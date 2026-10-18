<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';
require_once __DIR__ . '/conexion.php';

if (empty($_SESSION['user_id']) || ($_SESSION['user_role'] ?? '') !== 'partner') {
    header('Location: login.php');
    exit;
}

$userId = (int) $_SESSION['user_id'];
try {
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.status AS user_status,
                p.id AS partner_id, p.display_name, p.phone, p.referral_code,
                p.can_recruit, p.status AS partner_status, p.created_at
         FROM users u
         INNER JOIN partners p ON p.user_id = u.id
         WHERE u.id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $userId]);
    $partner = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log('Mi Localito socio: ' . $e->getMessage());
    http_response_code(500);
    exit('No se pudo cargar tu cuenta. Intenta más tarde.');
}

if (!$partner || ($partner['user_status'] ?? '') !== 'active' || ($partner['partner_status'] ?? '') !== 'active') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    header('Location: login.php?inactive=1');
    exit;
}

$name = trim((string)($partner['display_name'] ?? ''));
if ($name === '') $name = (string)($partner['email'] ?? 'Socio');
$referralCode = strtoupper(trim((string)($partner['referral_code'] ?? '')));
$canRecruit = (int)($partner['can_recruit'] ?? 0) === 1;
$createdAt = (string)($partner['created_at'] ?? '');
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = (string)($_SERVER['HTTP_HOST'] ?? '');
$basePath = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/socio.php'))), '/');
$inviteUrl = $scheme . '://' . $host . $basePath . '/registro.php?ref=' . rawurlencode($referralCode);
$inviteText = '¡Hola! Te invito a conocer Mi Localito y su oportunidad para socios. Regístrate con mi enlace: ' . $inviteUrl;
function escaparSocio(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?>
<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mi espacio de socio | Mi Localito</title>
<style>
:root{--green:#048a25;--dark:#102016;--muted:#647067;--line:#e0e8e2;--bg:#f4f8f5;--white:#fff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--dark);font-family:Arial,Helvetica,sans-serif;line-height:1.5}.wrap{width:min(920px,calc(100% - 28px));margin:28px auto}.top{background:var(--dark);color:#fff;border-radius:18px;padding:24px}.brand{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8be69e;font-weight:700}.top h1{margin:8px 0 4px;font-size:clamp(25px,5vw,36px)}.top p{margin:0;color:#d5e4d8}.card{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:22px;margin-top:16px;box-shadow:0 5px 18px #10201608}.row{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.muted{color:var(--muted);font-size:14px}.value{font-weight:700;overflow-wrap:anywhere}.pill{display:inline-block;border-radius:999px;background:#e7f7eb;color:#17692b;padding:6px 11px;font-size:13px;font-weight:700}.pill.no{background:#fff0e8;color:#94451c}.linkbox{padding:13px;border:1px dashed #a9b9ad;border-radius:10px;background:#f8fbf8;overflow-wrap:anywhere;margin:12px 0}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;padding:12px 16px;font-weight:700;text-decoration:none;cursor:pointer;font-size:14px}.primary{background:var(--green);color:#fff}.secondary{background:#eaf0eb;color:var(--dark)}.actions{display:flex;gap:10px;flex-wrap:wrap}.footer{text-align:center;color:var(--muted);font-size:12px;padding:22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.item{border:1px solid var(--line);border-radius:12px;padding:14px}.item .muted{margin-bottom:5px}a{color:inherit}@media(max-width:500px){.top,.card{padding:18px}.wrap{margin:14px auto}}
</style>
</head><body><main class="wrap">
<header class="top"><div class="brand">Mi Localito · Socios</div><h1>Hola, <?= escaparSocio($name) ?> 👋</h1><p>Tu espacio personal para compartir Mi Localito.</p></header>
<section class="card"><div class="row"><h2 style="margin:0">Tu cuenta</h2><span class="pill">Cuenta activa</span></div><div class="grid" style="margin-top:16px"><div class="item"><div class="muted">Nombre</div><div class="value"><?= escaparSocio($name) ?></div></div><div class="item"><div class="muted">Correo</div><div class="value"><?= escaparSocio((string)$partner['email']) ?></div></div><div class="item"><div class="muted">Teléfono</div><div class="value"><?= escaparSocio((string)($partner['phone'] ?? 'No registrado')) ?></div></div><div class="item"><div class="muted">Fecha de registro</div><div class="value"><?= escaparSocio($createdAt !== '' ? date('d/m/Y', strtotime($createdAt)) : '—') ?></div></div></div></section>
<section class="card"><h2 style="margin-top:0">Invita a nuevos socios</h2><p>Tu código personal de invitación:</p><div class="linkbox"><strong><?= escaparSocio($referralCode) ?></strong></div><p class="muted">Comparte tu enlace personal para que el registro quede asociado a ti.</p><div class="linkbox" id="inviteUrl"><?= escaparSocio($inviteUrl) ?></div><div class="actions"><button class="btn primary" type="button" onclick="copiarEnlace()">Copiar enlace</button><a class="btn secondary" href="https://wa.me/?text=<?= rawurlencode($inviteText) ?>" target="_blank" rel="noopener">Compartir por WhatsApp</a></div><p id="copyStatus" class="muted" aria-live="polite"></p></section>
<section class="card"><h2 style="margin-top:0">Permisos de tu cuenta</h2><div class="row"><span>Reclutar socios para tu equipo</span><span class="pill <?= $canRecruit ? '' : 'no' ?>"><?= $canRecruit ? 'Habilitado' : 'No habilitado' ?></span></div><p class="muted">Los permisos los administra Mi Localito. Si todavía no tienes acceso, contacta al administrador.</p></section>
<div class="actions" style="margin-top:16px"><a class="btn secondary" href="logout.php">Cerrar sesión</a></div><footer class="footer">Mi Localito · by ingenierodelalibertad.com</footer>
</main><script>function copiarEnlace(){const texto=document.getElementById('inviteUrl').textContent.trim();const estado=document.getElementById('copyStatus');if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(texto).then(()=>estado.textContent='Enlace copiado.').catch(()=>fallback(texto,estado));}else{fallback(texto,estado)}}function fallback(texto,estado){const area=document.createElement('textarea');area.value=texto;document.body.appendChild(area);area.select();try{document.execCommand('copy');estado.textContent='Enlace copiado.'}catch(e){estado.textContent='Copia manualmente el enlace.'}area.remove()}</script><?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
