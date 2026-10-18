<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';

if (!isset($_SESSION['user_id'], $_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    header('Location: login.php');
    exit;
}
require_once __DIR__ . '/conexion.php';

if (empty($_SESSION['csrf_ventas'])) {
    $_SESSION['csrf_ventas'] = bin2hex(random_bytes(32));
}
function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function money(int $c): string { return '$' . number_format($c / 100, 2) . ' MXN'; }
function columnExists(PDO $pdo, string $table, string $column): bool {
    $q = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
    $q->execute([$column]);
    return (bool)$q->fetch(PDO::FETCH_ASSOC);
}
function audit(PDO $pdo, int $actor, string $action, string $type, int $id, array $details = []): void {
    $q = $pdo->prepare('INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $q->execute([$actor, $action, $type, $id, json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}
function getEnumValues(PDO $pdo, string $table, string $column, array $fallback): array {
    try {
        $q = $pdo->query("SHOW COLUMNS FROM `$table` LIKE " . $pdo->quote($column));
        $r = $q->fetch(PDO::FETCH_ASSOC);
        if ($r && preg_match('/^enum\((.*)\)$/i', (string)$r['Type'], $m)) {
            preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/", $m[1], $matches);
            if ($matches[1]) return array_map('stripcslashes', $matches[1]);
        }
    } catch (Throwable $e) { error_log($e->getMessage()); }
    return $fallback;
}
$mensaje = ''; $error = false; $errorConsulta = false;
$estadosPermitidos = getEnumValues($pdo, 'sales', 'status', ['pending_payment','deposit_paid','paid','cancelled']);
$socios = []; $sistemas = []; $ventas = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!hash_equals((string)$_SESSION['csrf_ventas'], (string)($_POST['csrf_token'] ?? ''))) {
            throw new RuntimeException('La sesión expiró. Recarga la página e inténtalo de nuevo.');
        }
        $accion = (string)($_POST['accion'] ?? '');
        if ($accion === 'registrar') {
            $nombre = trim((string)($_POST['customer_name'] ?? ''));
            $correo = trim((string)($_POST['customer_email'] ?? ''));
            $telefono = trim((string)($_POST['customer_phone'] ?? ''));
            $sistemaId = filter_var($_POST['system_id'] ?? null, FILTER_VALIDATE_INT);
            $vendedorId = filter_var($_POST['seller_partner_id'] ?? null, FILTER_VALIDATE_INT);
            $metodo = trim((string)($_POST['payment_method'] ?? ''));
            $referencia = trim((string)($_POST['payment_reference'] ?? ''));
            $notas = trim((string)($_POST['payment_notes'] ?? ''));
            $estado = in_array('deposit_paid', $estadosPermitidos, true) ? 'deposit_paid' : (in_array('pending_payment', $estadosPermitidos, true) ? 'pending_payment' : $estadosPermitidos[0]);

            if ($nombre === '' || mbLen($nombre) > 150) throw new RuntimeException('Escribe el nombre del cliente (máximo 150 caracteres).');
            if ($telefono === '' || mbLen($telefono) > 30) throw new RuntimeException('Escribe un teléfono válido (máximo 30 caracteres).');
            if ($correo !== '' && (!filter_var($correo, FILTER_VALIDATE_EMAIL) || mbLen($correo) > 190)) throw new RuntimeException('El correo no tiene un formato válido.');
            if (!$sistemaId || !$vendedorId) throw new RuntimeException('Selecciona un sistema y un socio vendedor.');
            if (!in_array($metodo, ['transferencia','efectivo','tarjeta','paypal','otro'], true)) $metodo = 'otro';

            $pdo->beginTransaction();
            $q = $pdo->prepare('SELECT id, name, price_cents, direct_rate, team_rate FROM systems WHERE id = ? AND active = 1 LIMIT 1');
            $q->execute([$sistemaId]); $sistema = $q->fetch(PDO::FETCH_ASSOC);
            if (!$sistema) throw new RuntimeException('El sistema no existe o está inactivo.');
            $precioC = (int)$sistema['price_cents'];
            if ($precioC <= 0) throw new RuntimeException('El sistema seleccionado no tiene un precio válido.');
            $anticipoC = intdiv($precioC, 2);
            $saldoC = $precioC - $anticipoC;
            if ($anticipoC <= 0) throw new RuntimeException('El precio del sistema es demasiado bajo para dividirlo en dos pagos.');

            $q = $pdo->prepare("SELECT id, display_name, sponsor_id, status, can_recruit FROM partners WHERE id = ? AND status = 'active' LIMIT 1");
            $q->execute([$vendedorId]); $vendedor = $q->fetch(PDO::FETCH_ASSOC);
            if (!$vendedor) throw new RuntimeException('El socio vendedor no existe o no está activo.');

            $liderId = null;
            if (!empty($vendedor['sponsor_id'])) {
                $q = $pdo->prepare("SELECT id FROM partners WHERE id = ? AND status = 'active' AND can_recruit = 1 LIMIT 1");
                $q->execute([(int)$vendedor['sponsor_id']]);
                if ($l = $q->fetch(PDO::FETCH_ASSOC)) $liderId = (int)$l['id'];
            }

            $folio = 'ML-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
            $q = $pdo->prepare('INSERT INTO sales (order_number, customer_name, customer_email, customer_phone, system_id, seller_partner_id, leader_partner_id, agreed_price_cents, direct_rate_snapshot, team_rate_snapshot, deposit_cents, balance_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $q->execute([$folio,$nombre,$correo !== '' ? $correo : null,$telefono,(int)$sistema['id'],(int)$vendedor['id'],$liderId,$precioC,(float)$sistema['direct_rate'],(float)$sistema['team_rate'],$anticipoC,$saldoC,$estado]);
            $saleId = (int)$pdo->lastInsertId();

            // El anticipo capturado aquí se guarda como pago confirmado, no solo como texto en la venta.
            $q = $pdo->prepare("INSERT INTO payments (sale_id, payment_type, amount_cents, method, provider_reference, status, confirmed_at, created_at) VALUES (?, 'deposit', ?, ?, ?, 'confirmed', NOW(), NOW())");
            $q->execute([$saleId,$anticipoC,$metodo,$referencia !== '' ? $referencia : null]);
            $paymentId = (int)$pdo->lastInsertId();

            // Genera comisión del vendedor y, cuando existe, del líder. Cada comisión se divide en dos mitades.
            $comisionesCreadas = [];
            $beneficiarios = [
                ['id'=>(int)$vendedor['id'], 'type'=>'direct', 'rate'=>(float)$sistema['direct_rate']]
            ];
            if ($liderId !== null && $liderId !== (int)$vendedor['id']) {
                $beneficiarios[] = ['id'=>$liderId, 'type'=>'team', 'rate'=>(float)$sistema['team_rate']];
            }
            foreach ($beneficiarios as $b) {
                $totalC = (int)round($precioC * $b['rate'] / 100);
                if ($totalC <= 0) continue;
                // Evita duplicados por venta y beneficiario.
                $q = $pdo->prepare('SELECT id FROM commissions WHERE sale_id = ? AND beneficiary_partner_id = ? LIMIT 1');
                $q->execute([$saleId,$b['id']]);
                if ($q->fetch(PDO::FETCH_ASSOC)) continue;
                $q = $pdo->prepare("INSERT INTO commissions (sale_id, beneficiary_partner_id, commission_type, rate_snapshot, total_amount_cents, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', NOW())");
                $q->execute([$saleId,$b['id'],$b['type'],$b['rate'],$totalC]);
                $commissionId = (int)$pdo->lastInsertId();
                $mitad1 = intdiv($totalC, 2);
                $mitad2 = $totalC - $mitad1;
                $q = $pdo->prepare("INSERT INTO commission_installments (commission_id, installment_number, trigger_type, amount_cents, status, paid_at, created_at) VALUES (?, 1, 'deposit', ?, 'payable', NULL, NOW()), (?, 2, 'balance', ?, 'pending', NULL, NOW())");
                $q->execute([$commissionId,$mitad1,$commissionId,$mitad2]);
                $comisionesCreadas[] = ['commission_id'=>$commissionId,'beneficiary_partner_id'=>$b['id'],'total_cents'=>$totalC];
            }

            audit($pdo,(int)$_SESSION['user_id'],'sale_created','sale',$saleId,[
                'order_number'=>$folio,'payment_id'=>$paymentId,'deposit_cents'=>$anticipoC,
                'balance_cents'=>$saldoC,'commissions_created'=>$comisionesCreadas
            ]);
            audit($pdo,(int)$_SESSION['user_id'],'deposit_confirmed','payment',$paymentId,['sale_id'=>$saleId,'amount_cents'=>$anticipoC]);
            $pdo->commit();
            $mensaje = 'Venta registrada con precio del sistema y anticipo del 50% confirmados. La segunda mitad queda pendiente. Folio: ' . $folio;
        } elseif ($accion === 'registrar_saldo') {
            $saleId = filter_var($_POST['sale_id'] ?? null, FILTER_VALIDATE_INT);
            if (!$saleId) throw new RuntimeException('La venta seleccionada no es válida.');
            $pdo->beginTransaction();
            $q = $pdo->prepare('SELECT id, status, balance_cents FROM sales WHERE id = ? FOR UPDATE');
            $q->execute([$saleId]); $sale = $q->fetch(PDO::FETCH_ASSOC);
            if (!$sale) throw new RuntimeException('No se encontró la venta.');
            if ((string)$sale['status'] === 'cancelled') throw new RuntimeException('No se puede registrar saldo en una venta cancelada.');
            $q = $pdo->prepare("SELECT COALESCE(SUM(amount_cents),0) FROM payments WHERE sale_id = ? AND payment_type = 'balance' AND status = 'confirmed'");
            $q->execute([$saleId]); $saldoYaPagado = (int)$q->fetchColumn();
            $saldoTotal = (int)$sale['balance_cents'];
            $restante = max(0, $saldoTotal - $saldoYaPagado);
            if ($restante <= 0) throw new RuntimeException('El saldo de esta venta ya está liquidado.');
            $metodo = trim((string)($_POST['payment_method'] ?? 'otro'));
            if (!in_array($metodo, ['transferencia','efectivo','tarjeta','paypal','otro'], true)) $metodo = 'otro';
            $referencia = trim((string)($_POST['payment_reference'] ?? ''));
            $q = $pdo->prepare("INSERT INTO payments (sale_id, payment_type, amount_cents, method, provider_reference, status, confirmed_at, created_at) VALUES (?, 'balance', ?, ?, ?, 'confirmed', NOW(), NOW())");
            $q->execute([$saleId,$restante,$metodo,$referencia !== '' ? $referencia : null]);
            $paymentId = (int)$pdo->lastInsertId();
            $q = $pdo->prepare("UPDATE commission_installments ci INNER JOIN commissions c ON c.id = ci.commission_id SET ci.status = 'payable' WHERE c.sale_id = ? AND ci.trigger_type = 'balance' AND ci.status = 'pending'");
            $q->execute([$saleId]);
            if (in_array('paid', $estadosPermitidos, true)) {
                $q = $pdo->prepare('UPDATE sales SET status = ? WHERE id = ?');
                $q->execute(['paid',$saleId]);
            }
            audit($pdo,(int)$_SESSION['user_id'],'balance_confirmed','payment',$paymentId,['sale_id'=>$saleId,'amount_cents'=>$restante]);
            audit($pdo,(int)$_SESSION['user_id'],'balance_installments_payable','sale',$saleId,['payment_id'=>$paymentId]);
            $pdo->commit();
            $mensaje = 'Saldo registrado como recibido. La segunda parcialidad de las comisiones quedó habilitada; no se marcó como pagada al socio.';
        } elseif ($accion === 'estado') {
            $saleId = filter_var($_POST['sale_id'] ?? null, FILTER_VALIDATE_INT);
            $nuevo = (string)($_POST['status'] ?? '');
            if (!$saleId || !in_array($nuevo, $estadosPermitidos, true)) throw new RuntimeException('La venta o el estado seleccionado no son válidos.');
            if ($nuevo === 'paid') throw new RuntimeException('Para liquidar una venta, usa “Registrar saldo recibido”; no cambies el estado manualmente.');
            $pdo->beginTransaction();
            $q = $pdo->prepare('SELECT id, status FROM sales WHERE id = ? FOR UPDATE');
            $q->execute([$saleId]); $sale = $q->fetch(PDO::FETCH_ASSOC);
            if (!$sale) throw new RuntimeException('No se encontró la venta.');
            $anterior = (string)$sale['status'];
            if ($nuevo === 'cancelled') {
                $q = $pdo->prepare("SELECT COALESCE(SUM(amount_cents),0) FROM payments WHERE sale_id = ? AND payment_type = 'balance' AND status = 'confirmed'");
                $q->execute([$saleId]);
                if ((int)$q->fetchColumn() > 0) throw new RuntimeException('Esta venta ya tiene el saldo confirmado. No se puede cancelar desde este control.');
            }
            if ($anterior !== $nuevo) {
                $q = $pdo->prepare('UPDATE sales SET status = ? WHERE id = ?');
                $q->execute([$nuevo,$saleId]);
                if ($nuevo === 'cancelled') {
                    $q = $pdo->prepare("UPDATE commission_installments ci INNER JOIN commissions c ON c.id = ci.commission_id SET ci.status = 'adjusted' WHERE c.sale_id = ? AND ci.trigger_type = 'balance' AND ci.status IN ('pending','payable')");
                    $q->execute([$saleId]);
                    // No se ajusta la comisión completa: la primera parcialidad conserva su estado e historial.
                }
                audit($pdo,(int)$_SESSION['user_id'],'sale_status_changed','sale',$saleId,['from'=>$anterior,'to'=>$nuevo]);
            }
            $pdo->commit();
            $mensaje = 'Estado de la venta actualizado.';
        } else {
            throw new RuntimeException('Acción no válida.');
        }
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        $mensaje = $e instanceof RuntimeException ? $e->getMessage() : 'No se pudo guardar. Revisa el registro de errores del servidor.';
        $error = true;
        if (!($e instanceof RuntimeException)) error_log('Mi Localito Ventas: '.$e->getMessage());
    }
}
function mbLen(string $s): int { return function_exists('mb_strlen') ? mb_strlen($s,'UTF-8') : strlen($s); }

try {
    $socios = $pdo->query("SELECT id, display_name, sponsor_id, can_recruit FROM partners WHERE status = 'active' ORDER BY display_name")->fetchAll(PDO::FETCH_ASSOC);
    $sistemas = $pdo->query('SELECT id, code, name, price_cents, direct_rate, team_rate FROM systems WHERE active = 1 ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    $ventas = $pdo->query("SELECT s.id, s.order_number, s.customer_name, s.customer_email, s.customer_phone, s.agreed_price_cents, s.deposit_cents, s.balance_cents, s.status, s.created_at, sy.name AS system_name, sy.code AS system_code, seller.display_name AS seller_name, leader.display_name AS leader_name, (SELECT COALESCE(SUM(p.amount_cents),0) FROM payments p WHERE p.sale_id=s.id AND p.payment_type='balance' AND p.status='confirmed') AS balance_paid_cents FROM sales s LEFT JOIN systems sy ON sy.id=s.system_id LEFT JOIN partners seller ON seller.id=s.seller_partner_id LEFT JOIN partners leader ON leader.id=s.leader_partner_id ORDER BY s.id DESC LIMIT 200")->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $errorConsulta = true; error_log('Mi Localito Ventas consulta: '.$e->getMessage());
}
?>
<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ventas | Mi Localito</title>
<style>
:root{--g:#078a35;--dark:#102117;--muted:#66736a;--line:#dfe7e1;--bg:#f4f7f4;--red:#a52b2b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#1b261e;font-family:Arial,Helvetica,sans-serif}header{background:var(--dark);color:white;padding:20px max(18px,calc((100% - 1200px)/2));display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}header h1{font-size:22px;margin:0 0 5px}header p{margin:0;color:#c8d8cc;font-size:13px}header a{color:white;text-decoration:none}main{max-width:1200px;margin:25px auto;padding:0 16px 40px}.intro{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:18px}h2{font-size:23px;margin:0 0 6px}p{line-height:1.5}.intro p{margin:0;color:var(--muted);font-size:14px}a{color:var(--g);font-weight:bold;text-decoration:none}.back{background:white;border:1px solid var(--line);padding:10px 13px;border-radius:8px}.notice{padding:13px 15px;border-radius:9px;margin:0 0 18px;background:#e8f7ec;color:#17602b;border:1px solid #bde4c7;font-size:14px}.notice.error{background:#fff0f0;color:var(--red);border-color:#efcaca}.card{background:white;border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:20px}.card h2{margin-bottom:15px}.formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.field{min-width:0}.wide{grid-column:span 2}label{display:block;font-size:12px;font-weight:bold;margin-bottom:6px;color:#344238}input,select,textarea{width:100%;min-width:0;padding:11px 10px;border:1px solid #cfd9d1;border-radius:8px;background:white;font:inherit;font-size:14px}small,.hint{font-size:12px;color:var(--muted)}button{border:0;border-radius:8px;padding:12px 16px;font-weight:bold;font-size:13px;cursor:pointer;background:var(--g);color:white}.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px}table{width:100%;border-collapse:collapse;min-width:1000px;background:white}th,td{padding:11px 12px;text-align:left;border-bottom:1px solid #e9eee9;font-size:13px;vertical-align:top}th{background:#f0f5f1;color:#35443a;white-space:nowrap}tr:last-child td{border-bottom:0}.pill{display:inline-block;padding:5px 8px;border-radius:20px;background:#edf2ee;font-size:11px;white-space:nowrap}.empty{background:white;border:1px dashed #cbd8cd;padding:18px;border-radius:10px;color:var(--muted)}.statusform{display:flex;gap:6px;min-width:210px}.statusform select{padding:7px;font-size:12px}.statusform button{padding:7px 9px;font-size:11px}@media(max-width:800px){.formgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.wide{grid-column:span 2}}@media(max-width:500px){.formgrid{grid-template-columns:1fr}.wide{grid-column:auto}.card{padding:15px}h2{font-size:20px}}
</style></head><body>
<header><div><h1>Mi Localito · Ventas</h1><p>Ventas, anticipos y comisiones</p></div><a href="panel.php">← Volver al dashboard</a></header>
<main><div class="intro"><div><h2>Control de ventas</h2><p>Una venta se registra cuando ya se recibió un anticipo.</p></div><a class="back" href="panel.php">Volver al dashboard</a></div>
<?php if($mensaje!==''):?><div class="notice <?=$error?'error':''?>"><?=h($mensaje)?></div><?php endif;?>
<section class="card"><h2>Registrar venta y anticipo</h2>
<?php if(!$socios||!$sistemas):?><div class="empty">Necesitas al menos un socio activo y un sistema activo.</div><?php else:?>
<form method="post"><input type="hidden" name="csrf_token" value="<?=h($_SESSION['csrf_ventas'])?>"><input type="hidden" name="accion" value="registrar">
<div class="formgrid">
<div class="field"><label for="customer_name">Nombre del cliente *</label><input id="customer_name" name="customer_name" maxlength="150" required></div>
<div class="field"><label for="customer_phone">Teléfono *</label><input id="customer_phone" name="customer_phone" maxlength="30" required></div>
<div class="field"><label for="customer_email">Correo</label><input id="customer_email" name="customer_email" type="email" maxlength="190"></div>
<div class="field"><label for="system_id">Sistema vendido *</label><select id="system_id" name="system_id" required><option value="">Selecciona</option><?php foreach($sistemas as $s):?><option value="<?=(int)$s['id']?>" data-price="<?=number_format(((int)$s['price_cents'])/100,2,'.','')?>"><?=h($s['name'])?> (<?=h($s['code'])?>) · <?=money((int)$s['price_cents'])?></option><?php endforeach;?></select></div>
<div class="field"><label for="seller_partner_id">Socio vendedor *</label><select id="seller_partner_id" name="seller_partner_id" required><option value="">Selecciona</option><?php foreach($socios as $p):?><option value="<?=(int)$p['id']?>"><?=h($p['display_name']?:('Socio #'.$p['id']))?><?=!empty($p['can_recruit'])?' · Líder autorizado':''?></option><?php endforeach;?></select></div>

<div class="field"><label>Precio del sistema</label><input id="price_preview" readonly value="Se toma del precio configurado en Sistemas"></div>
<div class="field"><label>Anticipo inicial (50%)</label><input id="deposit_preview" readonly value="Se calcula automáticamente"></div>
<div class="field"><label>Saldo pendiente (50%)</label><input id="balance_preview" readonly value="Se calcula automáticamente"></div>
<div class="field"><label for="payment_method">Método de pago *</label><select id="payment_method" name="payment_method"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="paypal">PayPal</option><option value="otro">Otro</option></select></div>
<div class="field"><label for="payment_reference">Referencia del pago</label><input id="payment_reference" name="payment_reference" maxlength="190"></div>


</div><p class="hint">El precio se toma del sistema seleccionado. Se registra el primer 50% como pago recibido; el otro 50% queda pendiente. Cada parcialidad de comisión sigue el mismo ciclo: se habilita cuando se confirma el pago del cliente y solo pasa a pagada cuando tú liquidas al socio.</p><p><button type="submit">Registrar venta</button></p></form><?php endif;?></section>
<section class="card"><h2>Ventas registradas (<?=count($ventas)?> mostradas; máximo 200)</h2>
<?php if($errorConsulta):?><div class="empty">No se pudieron consultar las ventas. Revisa el registro de errores del servidor.</div><?php elseif(!$ventas):?><div class="empty">Todavía no hay ventas registradas.</div><?php else:?>
<div class="tablewrap"><table><thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Contacto</th><th>Sistema</th><th>Vendedor</th><th>Líder</th><th>Precio</th><th>Anticipo</th><th>Saldo</th><th>Estado</th><th>Actualizar estado</th></tr></thead><tbody>
<?php foreach($ventas as $v):?><tr><td><?=h($v['order_number'])?></td><td><?=h($v['created_at']??'—')?></td><td><?=h($v['customer_name'])?></td><td><?=h($v['customer_phone'])?><br><small><?=h($v['customer_email']?:'Sin correo')?></small></td><td><?=h($v['system_name']?:'Sistema eliminado')?> <small>(<?=h($v['system_code']??'—')?>)</small></td><td><?=h($v['seller_name']?:('Socio #'.$v['id']))?></td><td><?=h($v['leader_name']?:'Sin líder asignado')?></td><td><?=money((int)$v['agreed_price_cents'])?></td><td><?=money((int)$v['deposit_cents'])?></td><td><?=money((int)$v['balance_cents'])?></td><td><span class="pill"><?=h(str_replace('_',' ',(string)$v['status']))?></span></td><td><?php if((int)$v['balance_cents'] > (int)$v['balance_paid_cents'] && $v['status'] !== 'cancelled'): ?><form class="statusform" method="post"><input type="hidden" name="csrf_token" value="<?=h($_SESSION['csrf_ventas'])?>"><input type="hidden" name="accion" value="registrar_saldo"><input type="hidden" name="sale_id" value="<?=(int)$v['id']?>"><select name="payment_method" aria-label="Método de pago del saldo"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="paypal">PayPal</option><option value="otro">Otro</option></select><input name="payment_reference" maxlength="190" placeholder="Referencia (opcional)"><button type="submit" onclick="return confirm('¿Confirmas que recibiste el saldo completo de esta venta?')">Registrar saldo recibido</button></form><?php endif; ?><?php if($v['status'] !== 'cancelled' && in_array('cancelled',$estadosPermitidos,true)): ?><form class="statusform" method="post" style="margin-top:8px"><input type="hidden" name="csrf_token" value="<?=h($_SESSION['csrf_ventas'])?>"><input type="hidden" name="accion" value="estado"><input type="hidden" name="sale_id" value="<?=(int)$v['id']?>"><input type="hidden" name="status" value="cancelled"><button type="submit" style="background:#a52b2b" onclick="return confirm('¿Cancelar esta venta? La segunda parcialidad de comisión se ajustará.')">Cancelar venta</button></form><?php endif; ?></td></tr><?php endforeach;?>
</tbody></table></div><?php endif;?></section></main>
<script>
(()=>{const s=document.getElementById('system_id'),p=document.getElementById('price_preview'),d=document.getElementById('deposit_preview'),b=document.getElementById('balance_preview');if(!s||!p||!d||!b)return;const fmt=c=>'$'+(c/100).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+' MXN';function u(){const o=s.options[s.selectedIndex],price=o&&o.dataset.price?Math.round(parseFloat(o.dataset.price)*100):0; p.value=price?fmt(price):'Selecciona un sistema';d.value=price?fmt(Math.floor(price/2)):'—';b.value=price?fmt(price-Math.floor(price/2)):'—'}s.addEventListener('change',u);u()})();
</script><?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
