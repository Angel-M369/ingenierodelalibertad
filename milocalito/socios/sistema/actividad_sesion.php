<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'], $_SESSION['user_role'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Sesión no disponible.']);
    exit;
}
$action = (string)($_POST['action'] ?? '');
if ($action === 'heartbeat') {
    $_SESSION['last_activity'] = time();
    echo json_encode(['ok' => true]);
    exit;
}
if ($action === 'expire') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    echo json_encode(['ok' => true, 'expired' => true]);
    exit;
}
http_response_code(400);
echo json_encode(['ok' => false, 'message' => 'Acción no válida.']);
