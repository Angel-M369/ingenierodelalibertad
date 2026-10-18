<?php
declare(strict_types=1);

/*
 * Mi Localito: registra una venta y anticipo PENDIENTE antes de abrir Mercado Pago.
 * No confirma pagos ni crea comisiones. La confirmación requiere conciliación real.
 * Instalar en public_html/milocalito/socios/sistema/iniciar_compra.php
 */
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Método no permitido.');
}
require_once __DIR__ . '/conexion.php';

function failRequest(string $message, int $code = 400): never {
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="es-MX"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mi Localito</title><body style="font-family:Arial,sans-serif;max-width:620px;margin:50px auto;padding:20px;line-height:1.5"><h1>No pudimos iniciar tu compra</h1><p>' .
        htmlspecialchars($message, ENT_QUOTES, 'UTF-8') .
        '</p><p>Regresa a la página del socio e inténtalo nuevamente.</p></body></html>';
    exit;
}
function getEnumValues(PDO $pdo, string $table, string $column): array {
    $q = $pdo->query("SHOW COLUMNS FROM `$table` LIKE " . $pdo->quote($column));
    $r = $q->fetch(PDO::FETCH_ASSOC);
    if (!$r || !preg_match('/^enum\((.*)\)$/i', (string)$r['Type'], $m)) return [];
    preg_match_all("/'((?:[^'\\\\]|\\\\.)*)'/", $m[1], $matches);
    return array_map('stripcslashes', $matches[1] ?? []);
}
$mpLinks = [
    'XPRESS' => 'https://mpago.la/1dTFS3D',
    'PRO' => 'https://mpago.la/2pY2za5',
    'CUSTOM' => 'https://mpago.la/2Shskoj',
    'LANDING' => 'https://mpago.la/2YW5eV3',
    'AGENDA' => 'https://mpago.la/2Q2s4Cf',
    'ELITE' => 'https://mpago.la/2wq9uAh',
];

$nombre = trim((string)($_POST['customer_name'] ?? ''));
$telefono = trim((string)($_POST['customer_phone'] ?? ''));
$correo = trim((string)($_POST['customer_email'] ?? ''));
$systemCode = strtoupper(trim((string)($_POST['system_code'] ?? '')));
$socioId = filter_var($_POST['socio_id'] ?? null, FILTER_VALIDATE_INT);
if ($nombre === '' || mb_strlen($nombre) > 150) failRequest('Escribe tu nombre (máximo 150 caracteres).');
if ($telefono === '' || mb_strlen($telefono) > 30) failRequest('Escribe un teléfono válido.');
if ($correo !== '' && (!filter_var($correo, FILTER_VALIDATE_EMAIL) || mb_strlen($correo) > 190)) failRequest('El correo no tiene un formato válido.');
if (!$socioId || !isset($mpLinks[$systemCode])) failRequest('No se identificó correctamente el sistema o el socio.');

try {
    $pdo->beginTransaction();
    $q = $pdo->prepare("SELECT id, code, name, price_cents, direct_rate, team_rate FROM systems WHERE UPPER(code) = ? AND active = 1 LIMIT 1 FOR UPDATE");
    $q->execute([$systemCode]);
    $system = $q->fetch(PDO::FETCH_ASSOC);
    if (!$system) throw new RuntimeException('Este sistema no está disponible por el momento.');

    $q = $pdo->prepare("SELECT id, display_name, sponsor_id FROM partners WHERE id = ? AND status = 'active' LIMIT 1");
    $q->execute([$socioId]);
    $seller = $q->fetch(PDO::FETCH_ASSOC);
    if (!$seller) throw new RuntimeException('El enlace del socio ya no está activo.');

    $leaderId = null;
    if (!empty($seller['sponsor_id'])) {
        $q = $pdo->prepare("SELECT id FROM partners WHERE id = ? AND status = 'active' AND can_recruit = 1 LIMIT 1");
        $q->execute([(int)$seller['sponsor_id']]);
        $leader = $q->fetch(PDO::FETCH_ASSOC);
        if ($leader) $leaderId = (int)$leader['id'];
    }

    $priceCents = (int)$system['price_cents'];
    if ($priceCents < 2) throw new RuntimeException('El precio configurado para este sistema no es válido.');
    $depositCents = intdiv($priceCents, 2);
    $balanceCents = $priceCents - $depositCents;

    $saleStates = getEnumValues($pdo, 'sales', 'status');
    $pendingSaleStatus = in_array('pending_payment', $saleStates, true) ? 'pending_payment'
        : (in_array('pending_deposit', $saleStates, true) ? 'pending_deposit' : null);
    if ($pendingSaleStatus === null) throw new RuntimeException('No se encontró un estado pendiente reconocido para ventas. No se creó ningún registro.');

    $paymentStates = getEnumValues($pdo, 'payments', 'status');
    $pendingPaymentStatus = in_array('pending', $paymentStates, true) ? 'pending' : null;
    if ($pendingPaymentStatus === null) throw new RuntimeException('No se encontró el estado pendiente para pagos. No se creó ningún registro.');

    $folio = 'ML-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
    $q = $pdo->prepare('INSERT INTO sales (order_number, customer_name, customer_email, customer_phone, system_id, seller_partner_id, leader_partner_id, agreed_price_cents, direct_rate_snapshot, team_rate_snapshot, deposit_cents, balance_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $q->execute([$folio, $nombre, $correo !== '' ? $correo : null, $telefono, (int)$system['id'], (int)$seller['id'], $leaderId, $priceCents, (float)$system['direct_rate'], (float)$system['team_rate'], $depositCents, $balanceCents, $pendingSaleStatus]);
    $saleId = (int)$pdo->lastInsertId();

    // provider_reference es el folio interno; no se presume que el enlace corto lo reciba.
    $q = $pdo->prepare("INSERT INTO payments (sale_id, payment_type, amount_cents, method, provider_reference, status, confirmed_at, created_at) VALUES (?, 'deposit', ?, 'mercado_pago', ?, ?, NULL, NOW())");
    $q->execute([$saleId, $depositCents, $folio, $pendingPaymentStatus]);

    $pdo->commit();
    header('Cache-Control: no-store');
    header('Location: ' . $mpLinks[$systemCode], true, 303);
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Mi Localito iniciar_compra: ' . $e->getMessage());
    failRequest($e instanceof RuntimeException ? $e->getMessage() : 'Ocurrió un error al guardar la compra. No se confirmó ningún pago.', 500);
}
