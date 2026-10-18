<?php
session_start();
require_once __DIR__ . '/control_sesion.php';
if (!isset($_SESSION['user_id'], $_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    header('Location: login.php');
    exit;
}
require_once __DIR__ . '/conexion.php';

function e($v): string { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8'); }

/** Convierte nombres técnicos conocidos en etiquetas comprensibles sin alterar el registro original. */
function traducirEtiqueta(string $texto): string {
    $mapa = [
        'settings' => 'Configuración', 'setting' => 'Ajuste', 'partners' => 'Socios', 'partner' => 'Socio',
        'users' => 'Usuarios', 'user' => 'Usuario', 'systems' => 'Sistemas', 'system' => 'Sistema',
        'sales' => 'Ventas', 'sale' => 'Venta', 'commissions' => 'Comisiones', 'commission' => 'Comisión',
        'payments' => 'Pagos', 'payment' => 'Pago', 'commission_installments' => 'Pagos de comisiones',
        'audit_log' => 'Historial de actividad', 'login' => 'Inicio de sesión', 'logout' => 'Cierre de sesión',
        'created_at' => 'Fecha de creación', 'updated_at' => 'Fecha de actualización', 'updated_by' => 'Actualizado por',
        'business_name' => 'Nombre de la plataforma', 'contact_email' => 'Correo de contacto', 'timezone' => 'Zona horaria',
        'session_minutes' => 'Duración de sesión', 'notify_email_enabled' => 'Notificaciones por correo activadas',
        'notify_email' => 'Correo receptor de notificaciones', 'notify_whatsapp_enabled' => 'Notificaciones por WhatsApp activadas',
        'notify_whatsapp' => 'Número receptor de WhatsApp', 'partner_registration_enabled' => 'Registro de socios permitido',
        'partner_recruitment_default' => 'Reclutamiento predeterminado', 'actor_user_id' => 'ID del usuario que realizó la acción',
        'entity_id' => 'ID del elemento', 'entity_type' => 'Tipo de elemento', 'old' => 'Valor anterior', 'new' => 'Valor nuevo',
        'before' => 'Antes', 'after' => 'Después', 'from' => 'Desde', 'to' => 'Hasta', 'status' => 'Estado',
        'role' => 'Rango o rol', 'email' => 'Correo electrónico', 'name' => 'Nombre', 'phone' => 'Teléfono',
        'price' => 'Precio', 'amount' => 'Importe', 'enabled' => 'Activado', 'disabled' => 'Desactivado',
        'true' => 'Sí', 'false' => 'No', 'id' => 'Identificador', 'action' => 'Acción', 'details' => 'Detalles',
        'ip' => 'Dirección IP', 'ip_address' => 'Dirección IP', 'user_agent' => 'Navegador o dispositivo',
        'password' => 'Contraseña', 'password_hash' => 'Contraseña protegida', 'csrf_token' => 'Token de seguridad',
        'recruitment' => 'Reclutamiento de socios', 'revoked' => 'Retirado', 'recruitment_revoked' => 'Se retiró el permiso para reclutar socios',
        'balance_installments_payable' => 'Pagos pendientes del saldo', 'commission_installment_paid' => 'Se pagó una cuota de comisión',
        'deposit_confirmed' => 'Se confirmó un depósito', 'installments' => 'Cuotas', 'installment' => 'Cuota',
        'payable' => 'Pendiente de pago', 'paid' => 'Pagado', 'deposit' => 'Depósito', 'confirmed' => 'Confirmado',
        'balance' => 'Saldo', 'recruitment_revoked' => 'Permiso para reclutar retirado', 'commission_installment' => 'Cuota de comisión',
        'due' => 'Pendiente', 'pending' => 'Pendiente', 'confirmed_at' => 'Fecha de confirmación', 'paid_at' => 'Fecha de pago',
        'commission_id' => 'Comisión relacionada', 'sale_id' => 'Venta relacionada', 'partner_id' => 'Socio relacionado',
        'payment_method' => 'Método de pago', 'reference' => 'Referencia', 'description' => 'Descripción', 'reason' => 'Motivo',
    ];
    $key = strtolower(trim($texto));
    if (isset($mapa[$key])) return $mapa[$key];
    // Convierte nombres como settings_updated o partner_created en una frase legible.
    $palabras = preg_split('/[_\-]+/', $texto) ?: [$texto];
    $palabras = array_map(function ($p) use ($mapa) {
        $k = strtolower($p);
        return $mapa[$k] ?? ucfirst($p);
    }, $palabras);
    return implode(' ', $palabras);
}

function traducirAccion(string $accion): string {
    $mapa = [
        'settings_updated' => 'Se actualizaron los ajustes de la plataforma',
        'setting_updated' => 'Se actualizó un ajuste de la plataforma',
        'login' => 'El usuario inició sesión',
        'logout' => 'El usuario cerró sesión',
        'partner_created' => 'Se creó un socio',
        'partner_updated' => 'Se actualizaron los datos de un socio',
        'partner_status_updated' => 'Se actualizó el estado de un socio',
        'partner_recruitment_updated' => 'Se actualizó el permiso de reclutamiento de un socio',
        'partner_recruitment_revoked' => 'Se retiró el permiso para que un socio reclute a otras personas',
        'recruitment_revoked' => 'Se retiró el permiso para reclutar socios',
        'balance_installments_payable' => 'Se registraron cuotas del saldo pendientes de pago',
        'commission_installment_paid' => 'Se pagó una cuota de comisión',
        'deposit_confirmed' => 'Se confirmó un depósito',
        'system_created' => 'Se creó un sistema',
        'system_updated' => 'Se actualizaron los datos de un sistema',
        'sale_created' => 'Se registró una venta',
        'sale_updated' => 'Se actualizaron los datos de una venta',
        'commission_created' => 'Se registró una comisión',
        'payment_created' => 'Se registró un pago',
        'user_created' => 'Se creó un usuario',
        'user_updated' => 'Se actualizaron los datos de un usuario',
    ];
    if (isset($mapa[$accion])) return $mapa[$accion];
    $sufijos = [
        '_created' => 'Se creó: ', '_updated' => 'Se actualizaron los datos de: ',
        '_deleted' => 'Se eliminó: ', '_removed' => 'Se quitó: ', '_enabled' => 'Se activó: ',
        '_disabled' => 'Se desactivó: ', '_approved' => 'Se aprobó: ', '_rejected' => 'Se rechazó: ',
        '_status_changed' => 'Se cambió el estado de: ', '_login' => 'Inicio de sesión: ',
    ];
    foreach ($sufijos as $sufijo => $inicio) {
        if (substr($accion, -strlen($sufijo)) === $sufijo) return $inicio . strtolower(traducirEtiqueta(substr($accion, 0, -strlen($sufijo))));
    }
    return traducirEtiqueta($accion);
}

/** Traduce frases técnicas conocidas que pueden aparecer como acciones o dentro de los detalles. */
function traducirFrase(string $texto): string {
    $original = trim($texto);
    $normalizado = strtolower(str_replace(['-', '_'], ' ', $original));
    $frases = [
        'recruitment revoked' => 'Se retiró el permiso para reclutar socios',
        'partner recruitment revoked' => 'Se retiró el permiso de reclutamiento de este socio',
        'balance installments payable' => 'Cuotas del saldo que están pendientes de pago',
        'commission installment paid' => 'Se pagó una cuota de comisión',
        'deposit confirmed' => 'Se confirmó un depósito',
        'deposit confirmation' => 'Confirmación de depósito',
        'installment paid' => 'Se pagó una cuota',
        'installments payable' => 'Cuotas pendientes de pago',
        'balance payable' => 'Saldo pendiente de pago',
        'recruitment enabled' => 'Se permitió a este socio reclutar a otras personas',
        'recruitment disabled' => 'Se desactivó el permiso para reclutar socios',
        'no changes made' => 'No se realizaron cambios',
        'settings updated' => 'Se actualizaron los ajustes de la plataforma',
        'payment confirmed' => 'Se confirmó un pago',
        'payment pending' => 'Pago pendiente',
        'not applicable' => 'No aplica',
        'true' => 'Sí', 'false' => 'No', 'enabled' => 'Activado', 'disabled' => 'Desactivado',
        'revoked' => 'Retirado', 'payable' => 'Pendiente de pago', 'paid' => 'Pagado', 'confirmed' => 'Confirmado',
    ];
    if (isset($frases[$normalizado])) return $frases[$normalizado];
    return $original;
}

function traducirValor($valor, string $clave = ''): string {
    if (is_bool($valor)) return $valor ? 'Sí' : 'No';
    if ($valor === null || $valor === '') return 'Sin información';
    if (is_array($valor)) return '';
    if (!is_scalar($valor)) return 'Dato registrado';
    $texto = (string)$valor;
    $k = strtolower($clave);
    if (in_array($k, ['notify_email_enabled','notify_whatsapp_enabled','partner_registration_enabled','enabled','active','is_active'], true)) {
        if (in_array(strtolower($texto), ['1','true','yes','on','enabled','active'], true)) return 'Sí, activado';
        if (in_array(strtolower($texto), ['0','false','no','off','disabled','inactive'], true)) return 'No, desactivado';
    }
    if (in_array(strtolower($texto), ['true','false'], true)) return strtolower($texto) === 'true' ? 'Sí' : 'No';
    if ($k === 'session_minutes' && is_numeric($texto)) return $texto . ' minutos';
    if ($k === 'timezone') {
        $zonas = ['America/Mexico_City' => 'Hora del centro de México', 'America/Tijuana' => 'Hora de Tijuana', 'America/Cancun' => 'Hora de Cancún'];
        return $zonas[$texto] ?? $texto;
    }
    $fraseTraducida = traducirFrase($texto);
    if ($fraseTraducida !== $texto) return $fraseTraducida;
    return $texto;
}

/** Muestra los datos del detalle con etiquetas en español, conservando todos los campos del registro. */
function mostrarDetalle($valor, string $clave = ''): void {
    if (is_array($valor)) {
        echo '<ul class="detail-list">';
        foreach ($valor as $k => $v) {
            $etiqueta = is_string($k) ? traducirEtiqueta($k) : 'Dato ' . ($k + 1);
            echo '<li><strong>' . e($etiqueta) . ':</strong> ';
            if (is_array($v)) mostrarDetalle($v, (string)$k);
            else echo e(traducirValor($v, (string)$k));
            echo '</li>';
        }
        echo '</ul>';
        return;
    }
    echo e(traducirValor($valor, $clave));
}

function traducirDetalles($detalle): array {
    if ($detalle === null || trim((string)$detalle) === '') return ['tipo' => 'vacio', 'valor' => null];
    $decodificado = json_decode((string)$detalle, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decodificado)) return ['tipo' => 'json', 'valor' => $decodificado];
    return ['tipo' => 'texto', 'valor' => (string)$detalle];
}

$rows = [];
$error = '';
try {
    // Se consultan los mismos registros originales; esta página solo cambia su presentación.
    $sql = "SELECT a.id, a.actor_user_id, u.email AS actor_email, a.action,
                   a.entity_type, a.entity_id, a.details, a.created_at
            FROM audit_log a
            LEFT JOIN users u ON u.id = a.actor_user_id
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT 100";
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $ex) {
    error_log('Mi Localito: error consultando audit_log: ' . $ex->getMessage());
    $error = 'No se pudo consultar el historial. Revisa el registro de errores del servidor.';
}
$total = 0;
try { $total = (int)$pdo->query('SELECT COUNT(*) FROM audit_log')->fetchColumn(); } catch (Throwable $ex) {}
?>
<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Actividad | Mi Localito</title>
<style>
:root{--green:#048a25;--green2:#19b943;--ink:#172019;--muted:#657168;--line:#e1e9e2;--bg:#f4f7f4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.wrap{width:min(1200px,calc(100% - 32px));margin:32px auto}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:22px}.eyebrow{color:var(--green);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:12px}h1{margin:4px 0;font-size:clamp(25px,4vw,34px)}p{color:var(--muted);margin:4px 0}.btn{display:inline-block;text-decoration:none;background:var(--green);color:#fff;padding:10px 15px;border-radius:9px;font-weight:700}.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 8px 24px #17201908}.summary{display:flex;gap:12px;align-items:center;margin-bottom:16px}.number{font-size:26px;font-weight:800;color:var(--green)}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px}table{width:100%;border-collapse:collapse;min-width:900px}th,td{text-align:left;vertical-align:top;padding:12px 14px;border-bottom:1px solid var(--line)}th{background:#f4f8f4;color:#4e5b50;font-size:12px;text-transform:uppercase;letter-spacing:.04em}tr:last-child td{border-bottom:0}td{overflow-wrap:anywhere}.details{max-width:390px;min-width:260px}.detail-list{margin:0;padding-left:18px}.detail-list li{margin:0 0 6px}.detail-list li:last-child{margin-bottom:0}.muted{color:var(--muted)}.empty,.error{padding:20px;border-radius:10px;background:#f4f8f4;color:#536157}.error{background:#fff1ef;color:#9a2c20}.technical-note{margin-top:7px;font-size:12px;color:var(--muted)}footer{margin-top:18px;color:var(--muted);font-size:13px}
</style></head><body><main class="wrap">
<header class="top"><div><div class="eyebrow">Mi Localito · Administración</div><h1>Actividad del sistema</h1><p>Historial de acciones realizadas en Mi Localito, explicado en palabras claras.</p></div><a class="btn" href="panel.php">← Volver al panel</a></header>
<section class="card"><div class="summary"><div class="number"><?= number_format($total) ?></div><div><strong>eventos registrados en total</strong><p>Se muestran hasta los 100 más recientes, sin borrar ni modificar el historial.</p></div></div>
<?php if ($error !== ''): ?><div class="error"><?= e($error) ?></div>
<?php elseif (!$rows): ?><div class="empty">Todavía no hay eventos guardados en el historial. Esta pantalla consulta registros existentes; no crea eventos por sí sola.</div>
<?php else: ?><div class="table-wrap"><table><thead><tr><th>Fecha y hora</th><th>Quién realizó la acción</th><th>Qué ocurrió</th><th>Área afectada</th><th>Identificador</th><th>Detalles del cambio</th></tr></thead><tbody>
<?php foreach ($rows as $r): $detalle = traducirDetalles($r['details'] ?? null); ?><tr>
<td><?= e($r['created_at']) ?></td>
<td><?= e($r['actor_email'] ?: ($r['actor_user_id'] ? 'Usuario #' . $r['actor_user_id'] : 'Sistema o usuario no identificado')) ?></td>
<td><strong><?= e(traducirAccion((string)($r['action'] ?? ''))) ?></strong><div class="technical-note">Referencia: <?= e($r['action'] ?? 'Sin dato') ?></div></td>
<td><?= e(!empty($r['entity_type']) ? traducirEtiqueta((string)$r['entity_type']) : 'No aplica') ?></td>
<td><?= e(($r['entity_id'] !== null && $r['entity_id'] !== '') ? (string)$r['entity_id'] : 'No aplica') ?></td>
<td class="details">
<?php if ($detalle['tipo'] === 'vacio'): ?>No se guardaron detalles adicionales.
<?php elseif ($detalle['tipo'] === 'json'): ?><?php mostrarDetalle($detalle['valor']); ?>
<?php else: ?><?= e(traducirFrase((string)$detalle['valor'])) ?><div class="technical-note">Si este detalle sigue mostrando palabras técnicas, podremos añadir su traducción sin cambiar el registro original.</div>
<?php endif; ?>
</td></tr><?php endforeach; ?>
</tbody></table></div><?php endif; ?></section><footer>Historial de solo lectura. Esta vista traduce la presentación de los datos y no modifica la base de datos ni registra acciones nuevas.</footer></main><?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
