<?php
/* Control central de inactividad. Incluir después de session_start() y antes de cualquier salida. */
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
$__ml_allowed_minutes = [1, 5, 10, 15, 30, 60];
$__ml_minutes = (int)($_SESSION['session_minutes'] ?? 10);
if (!in_array($__ml_minutes, $__ml_allowed_minutes, true)) { $__ml_minutes = 10; }
$__ml_now = time();
if (isset($_SESSION['user_id'])) {
    if (isset($_SESSION['last_activity']) && ($__ml_now - (int)$_SESSION['last_activity']) >= $__ml_minutes * 60) {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $__ml_cookie = session_get_cookie_params();
            setcookie(session_name(), '', $__ml_now - 42000, $__ml_cookie['path'], $__ml_cookie['domain'], $__ml_cookie['secure'], $__ml_cookie['httponly']);
        }
        session_destroy();
        header('Location: login.php?expired=1');
        exit;
    }
    $_SESSION['last_activity'] = $__ml_now;
}
unset($__ml_allowed_minutes, $__ml_minutes, $__ml_now, $__ml_cookie);
