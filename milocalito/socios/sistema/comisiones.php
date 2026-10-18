<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';

if (($_SESSION['user_role'] ?? '') !== 'admin') {
    header('Location: login.php');
    exit;
}

require_once __DIR__ . '/conexion.php';

if (!isset($pdo) || !($pdo instanceof PDO)) {
    http_response_code(500);
    exit('No se pudo establecer la conexión con la base de datos.');
}

function h($value): string { return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8'); }
function moneyFromCents($cents): string { return '$' . number_format(((int)$cents) / 100, 2, '.', ','); }

$estadoFiltro = trim((string)($_GET['estado'] ?? ''));
$tipoFiltro = trim((string)($_GET['tipo'] ?? ''));
$socioFiltro = filter_input(INPUT_GET, 'socio', FILTER_VALIDATE_INT) ?: 0;
$busqueda = trim((string)($_GET['q'] ?? ''));
$mensajeError = '';
$mensajeOk = '';
$comisiones = [];
$socios = [];
$resumen = ['total' => 0, 'pendientes' => 0, 'parciales' => 0, 'pagadas' => 0, 'importe' => 0, 'disponible' => 0];
if (empty($_SESSION['csrf_comisiones'])) { $_SESSION['csrf_comisiones'] = bin2hex(random_bytes(32)); }

function etiquetaEstado(string $estado): string {
    $labels = ['pending'=>'Pendiente','partially_paid'=>'Pago parcial','paid'=>'Pagada','adjusted'=>'Ajustada','payable'=>'Lista para pagar'];
    return $labels[$estado] ?? ucfirst(str_replace('_', ' ', $estado));
}

try {
    // Registrar el pago REAL al socio solo para una parcialidad que ya sea pagable.
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['accion'] ?? '') === 'pagar_parcialidad') {
        if (!hash_equals((string)$_SESSION['csrf_comisiones'], (string)($_POST['csrf'] ?? ''))) {
            throw new RuntimeException('La sesión del formulario venció. Recarga la página e inténtalo de nuevo.');
        }
        $instalacionId = filter_var($_POST['installment_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$instalacionId || $instalacionId < 1) throw new RuntimeException('La parcialidad seleccionada no es válida.');
        $pdo->beginTransaction();
        $lock = $pdo->prepare("SELECT ci.id, ci.commission_id, ci.installment_number, ci.amount_cents, ci.status, c.beneficiary_partner_id, c.sale_id
            FROM commission_installments ci JOIN commissions c ON c.id = ci.commission_id WHERE ci.id = ? FOR UPDATE");
        $lock->execute([$instalacionId]);
        $inst = $lock->fetch(PDO::FETCH_ASSOC);
        if (!$inst) throw new RuntimeException('No se encontró la parcialidad.');
        if ($inst['status'] !== 'payable') throw new RuntimeException('Solo puedes pagar una parcialidad que esté marcada como lista para pagar. Estado actual: ' . etiquetaEstado((string)$inst['status']) . '.');
        $upd = $pdo->prepare("UPDATE commission_installments SET status='paid', paid_at=NOW() WHERE id=? AND status='payable'");
        $upd->execute([$instalacionId]);
        if ($upd->rowCount() !== 1) throw new RuntimeException('La parcialidad cambió de estado. Recarga la página.');
        $states = $pdo->prepare('SELECT status FROM commission_installments WHERE commission_id = ?');
        $states->execute([(int)$inst['commission_id']]);
        $allStates = $states->fetchAll(PDO::FETCH_COLUMN);
        $hasAdjusted = in_array('adjusted', $allStates, true);
        $allSettled = count($allStates) > 0 && count(array_filter($allStates, fn($v) => in_array($v, ['paid','adjusted'], true))) === count($allStates);
        $paidCount = count(array_filter($allStates, fn($v) => $v === 'paid'));
        $commissionStatus = $allSettled ? ($hasAdjusted ? 'adjusted' : 'paid') : ($paidCount > 0 ? 'partially_paid' : 'pending');
        $upc = $pdo->prepare('UPDATE commissions SET status = ? WHERE id = ?');
        $upc->execute([$commissionStatus, (int)$inst['commission_id']]);
        // Audit log: actor_user_id may be NULL if the admin session doesn't expose a user ID.
        $actor = filter_var($_SESSION['user_id'] ?? $_SESSION['admin_id'] ?? null, FILTER_VALIDATE_INT);
        $details = json_encode(['installment_id'=>(int)$inst['id'],'commission_id'=>(int)$inst['commission_id'],'installment_number'=>(int)$inst['installment_number'],'amount_cents'=>(int)$inst['amount_cents'],'beneficiary_partner_id'=>(int)$inst['beneficiary_partner_id'],'sale_id'=>(int)$inst['sale_id']], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        $audit = $pdo->prepare('INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
        $audit->execute([$actor ?: null, 'commission_installment_paid', 'commission_installment', (int)$inst['id'], $details]);
        $pdo->commit();
        header('Location: comisiones.php?ok=paid');
        exit;
    }
    if (($_GET['ok'] ?? '') === 'paid') $mensajeOk = 'Pago al socio registrado. La parcialidad y la actividad quedaron actualizadas.';

    $sociosStmt = $pdo->query("SELECT p.id, COALESCE(NULLIF(p.display_name, ''), u.email, CONCAT('Socio #', p.id)) AS nombre FROM partners p LEFT JOIN users u ON u.id = p.user_id ORDER BY nombre ASC");
    $socios = $sociosStmt->fetchAll(PDO::FETCH_ASSOC);
    $where = []; $params = [];
    if ($estadoFiltro !== '') { $where[] = 'c.status = ?'; $params[] = $estadoFiltro; }
    if (in_array($tipoFiltro, ['direct','team'], true)) { $where[] = 'c.commission_type = ?'; $params[] = $tipoFiltro; }
    if ($socioFiltro > 0) { $where[] = 'c.beneficiary_partner_id = ?'; $params[] = $socioFiltro; }
    if ($busqueda !== '') { $where[] = '(s.order_number LIKE ? OR s.customer_name LIKE ? OR p.display_name LIKE ? OR u.email LIKE ?)'; $like='%'.$busqueda.'%'; array_push($params,$like,$like,$like,$like); }
    $whereSql = $where ? 'WHERE '.implode(' AND ',$where) : '';
    $sql = "SELECT c.id,c.sale_id,c.beneficiary_partner_id,c.commission_type,c.rate_snapshot,c.total_amount_cents,c.status,c.created_at,
        s.order_number,s.customer_name,s.customer_phone,
        COALESCE(NULLIF(p.display_name,''),u.email,CONCAT('Socio #',p.id)) AS beneficiary_name,
        ci.id AS installment_id,ci.installment_number,ci.trigger_type,ci.amount_cents AS installment_amount_cents,ci.status AS installment_status,ci.paid_at
        FROM commissions c LEFT JOIN sales s ON s.id=c.sale_id LEFT JOIN partners p ON p.id=c.beneficiary_partner_id LEFT JOIN users u ON u.id=p.user_id
        LEFT JOIN commission_installments ci ON ci.commission_id=c.id $whereSql
        ORDER BY c.created_at DESC,c.id DESC,ci.installment_number ASC LIMIT 1000";
    $stmt=$pdo->prepare($sql); $stmt->execute($params); $comisiones=$stmt->fetchAll(PDO::FETCH_ASSOC);
    $sumStmt=$pdo->query("SELECT COUNT(*) total, COALESCE(SUM(status='pending'),0) pendientes, COALESCE(SUM(status='partially_paid'),0) parciales, COALESCE(SUM(status='paid'),0) pagadas, COALESCE(SUM(total_amount_cents),0) importe FROM commissions");
    $r=$sumStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    foreach (['total','pendientes','parciales','pagadas','importe'] as $k) if (isset($r[$k])) $resumen[$k]=(int)$r[$k];
    $avail=$pdo->query("SELECT COALESCE(SUM(amount_cents),0) FROM commission_installments WHERE status='payable'")->fetchColumn();
    $resumen['disponible']=(int)$avail;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Mi Localito comisiones.php: '.$e->getMessage());
    $mensajeError = $e instanceof RuntimeException ? $e->getMessage() : 'No se pudo completar la operación. Verifica la estructura de las tablas y el registro de errores del servidor.';
}

?>
<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Comisiones | Mi Localito</title>
<style>
:root{color-scheme:dark;--bg:#080b09;--panel:#111713;--panel2:#171f19;--line:#28352b;--green:#19b943;--muted:#a8b5aa;--text:#f4f7f4;--red:#ff7777;--yellow:#ffd166}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}a{color:inherit;text-decoration:none}.wrap{max-width:1400px;margin:auto;padding:24px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px}.brand{font-weight:800;font-size:20px}.brand span{color:var(--green)}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);font-weight:650}.btn.primary{background:var(--green);color:#041006;border-color:var(--green)}h1{font-size:clamp(26px,4vw,36px);margin:0 0 5px}.sub{color:var(--muted);margin:0 0 24px}.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:20px 0}.stat,.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px}.stat{padding:16px}.stat .label{color:var(--muted);font-size:13px}.stat strong{display:block;font-size:clamp(19px,2vw,27px);margin-top:5px;overflow-wrap:anywhere}.filters{padding:16px;margin-bottom:18px}.filters form{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto auto;gap:10px;align-items:end}.field label{display:block;font-size:12px;color:var(--muted);margin-bottom:5px}.field input,.field select{width:100%;min-width:0;background:#090d0a;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:11px;font:inherit}.table-wrap{overflow-x:auto}.table-wrap table{width:100%;border-collapse:collapse;min-width:1050px}.table-wrap th,.table-wrap td{text-align:left;padding:13px 12px;border-bottom:1px solid var(--line);vertical-align:top}.table-wrap th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);background:#0d120e}.table-wrap tr:last-child td{border-bottom:0}.small{color:var(--muted);font-size:12px}.amount{font-weight:750;white-space:nowrap}.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:4px 9px;font-size:12px;white-space:nowrap}.pill.pending{color:var(--yellow)}.pill.paid{color:#72e89a}.pill.partially_paid{color:#8ecbff}.alert{padding:13px 15px;border:1px solid #704141;background:#241515;border-radius:10px;color:#ffd1d1;margin:16px 0}.empty{padding:35px;text-align:center;color:var(--muted)}.foot{margin-top:16px;color:var(--muted);font-size:12px}@media(max-width:1000px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.filters form{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.wrap{padding:15px}.stats{grid-template-columns:1fr 1fr}.filters form{grid-template-columns:1fr}.top{align-items:flex-start}}
</style>
</head>
<body><main class="wrap">
<header class="top"><div class="brand">Mi <span>Localito</span> · Administración</div><nav class="actions"><a class="btn" href="panel.php">← Dashboard</a><a class="btn" href="ventas.php">Ventas</a></nav></header>
<h1>Comisiones</h1><p class="sub">Administra las parcialidades de comisión. El pago del cliente habilita una parcialidad; aquí registras por separado el pago real al socio.</p>
<?php if ($mensajeError !== ''): ?><div class="alert"><?=h($mensajeError)?></div><?php endif; ?>
<?php if ($mensajeOk !== ''): ?><div class="alert" style="border-color:#24683a;background:#102318;color:#b9f5c9"><?=h($mensajeOk)?></div><?php endif; ?>
<section class="stats" aria-label="Resumen de comisiones">
<div class="stat"><div class="label">Comisiones registradas</div><strong><?=number_format($resumen['total'])?></strong></div>
<div class="stat"><div class="label">Pendientes</div><strong><?=number_format($resumen['pendientes'])?></strong></div>
<div class="stat"><div class="label">Pago parcial</div><strong><?=number_format($resumen['parciales'])?></strong></div>
<div class="stat"><div class="label">Pagadas</div><strong><?=number_format($resumen['pagadas'])?></strong></div>
<div class="stat"><div class="label">Importe total registrado</div><strong><?=moneyFromCents($resumen['importe'])?></strong></div>
<div class="stat"><div class="label">Parcialidades listas para pagar</div><strong><?=moneyFromCents($resumen['disponible'])?></strong></div>
</section>
<section class="panel filters"><form method="get" action="comisiones.php">
<div class="field"><label for="q">Buscar venta, cliente o socio</label><input id="q" name="q" value="<?=h($busqueda)?>" placeholder="Número de venta, nombre, correo..."></div>
<div class="field"><label for="estado">Estado</label><select id="estado" name="estado"><option value="">Todos</option><?php foreach (['pending'=>'Pendiente','partially_paid'=>'Pago parcial','paid'=>'Pagada','adjusted'=>'Ajustada'] as $v=>$label): ?><option value="<?=h($v)?>" <?= $estadoFiltro===$v?'selected':'' ?>><?=h($label)?></option><?php endforeach; ?></select></div>
<div class="field"><label for="tipo">Tipo de comisión</label><select id="tipo" name="tipo"><option value="">Todos</option><option value="direct" <?=$tipoFiltro==='direct'?'selected':''?>>Directa</option><option value="team" <?=$tipoFiltro==='team'?'selected':''?>>Equipo</option></select></div>
<div class="field"><label for="socio">Beneficiario</label><select id="socio" name="socio"><option value="">Todos los socios</option><?php foreach ($socios as $socio): ?><option value="<?= (int)$socio['id']?>" <?= $socioFiltro===(int)$socio['id']?'selected':'' ?>><?=h($socio['nombre'])?></option><?php endforeach; ?></select></div>
<button class="btn primary" type="submit">Filtrar</button><a class="btn" href="comisiones.php">Limpiar</a>
</form></section>
<section class="panel"><div class="table-wrap"><table><thead><tr><th>Comisión / venta</th><th>Beneficiario</th><th>Tipo</th><th>Comisión total</th><th>Parcialidad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
<?php if (!$comisiones): ?><tr><td colspan="7" class="empty">No hay comisiones que coincidan con los filtros.</td></tr><?php else: foreach ($comisiones as $c): $st=(string)$c['status']; ?><tr>
<td>#<?= (int)$c['id']?><div class="small"><?=h($c['order_number'] ?: ('Venta #'.$c['sale_id']))?></div><div><?=h($c['customer_name'] ?: 'Cliente no disponible')?></div><div class="small">Venta ID: <?= (int)$c['sale_id']?></div></td>
<td><?=h($c['beneficiary_name'] ?: ('Socio #'.$c['beneficiary_partner_id']))?><div class="small">Socio ID: <?= (int)$c['beneficiary_partner_id']?></div></td>
<td><?= $c['commission_type']==='direct'?'Directa':'Equipo' ?><div class="small"><?=number_format((float)$c['rate_snapshot'],2)?>%</div></td>
<td class="amount"><?=moneyFromCents($c['total_amount_cents'])?></td>
<td><?php if ($c['installment_id']): ?><strong><?=((int)$c['installment_number']===1?'1.ª parcialidad':'2.ª parcialidad')?></strong><div class="small">Origen: <?=h($c['trigger_type'])?></div><div class="amount"><?=moneyFromCents($c['installment_amount_cents'])?></div><?php else: ?><span class="small">Sin parcialidades registradas</span><?php endif; ?></td>
<td><span class="pill <?=h((string)($c['installment_status'] ?? $st))?>"><?=h(etiquetaEstado((string)($c['installment_status'] ?? $st)))?></span><?php if (!empty($c['paid_at'])): ?><div class="small">Pagada: <?=h($c['paid_at'])?></div><?php endif; ?></td>
<td><?php if (($c['installment_status'] ?? '')==='payable'): ?><form method="post" onsubmit="return confirm('¿Confirmas que ya pagaste esta parcialidad al socio? Esta acción quedará registrada.');"><input type="hidden" name="csrf" value="<?=h($_SESSION['csrf_comisiones'])?>"><input type="hidden" name="accion" value="pagar_parcialidad"><input type="hidden" name="installment_id" value="<?=(int)$c['installment_id']?>"><button class="btn primary" type="submit">Registrar pago al socio</button></form><?php elseif (($c['installment_status'] ?? '')==='pending'): ?><span class="small">Esperando confirmación del pago del cliente.</span><?php elseif (($c['installment_status'] ?? '')==='adjusted'): ?><span class="small">Ajustada; no se paga.</span><?php elseif (($c['installment_status'] ?? '')==='paid'): ?><span class="small">Pago al socio registrado.</span><?php else: ?><span class="small">—</span><?php endif; ?></td>
</tr><?php endforeach; endif; ?>
</tbody></table></div></section>
<p class="foot">Se muestran hasta 1,000 filas de parcialidades. “Lista para pagar” significa que el cliente ya cubrió el pago correspondiente; solo el botón de esta pantalla registra el pago al socio. Las parcialidades ajustadas se conservan en el historial.</p>
</main><?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
