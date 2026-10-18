<?php
session_start();

require_once __DIR__ . '/conexion.php';

$error = '';
$sessionExpired = isset($_GET['expired']) && $_GET['expired'] === '1';
$accountInactive = isset($_GET['inactive']) && $_GET['inactive'] === '1';

/*
 * Duración de sesión por inactividad.
 * Se lee desde Configuración > Duración de sesión (session_minutes).
 * Opciones admitidas: 1, 5, 10, 15, 30 o 60 minutos.
 * Si la opción no existe o no es válida, se usan 10 minutos.
 */
$allowedSessionMinutes = [1, 5, 10, 15, 30, 60];
$sessionMinutes = 10;

try {
    $stmtSettings = $pdo->prepare(
        "SELECT setting_value
         FROM app_settings
         WHERE setting_key = 'session_minutes'
         LIMIT 1"
    );
    $stmtSettings->execute();
    $configuredMinutes = $stmtSettings->fetchColumn();

    if ($configuredMinutes !== false && is_numeric($configuredMinutes)) {
        $requestedMinutes = (int) $configuredMinutes;
        if (in_array($requestedMinutes, $allowedSessionMinutes, true)) {
            $sessionMinutes = $requestedMinutes;
        }
    }
} catch (PDOException $e) {
    // La ausencia de la configuración no debe impedir el inicio de sesión.
    error_log($e->getMessage());
}

// La sesión nueva guardará esta duración y el control central la aplicará en páginas protegidas.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $error = 'Introduce tu correo y contraseña.';
    } else {
        try {
            $stmt = $pdo->prepare(
                'SELECT id, email, password_hash, role, status
                 FROM users
                 WHERE email = :email
                 LIMIT 1'
            );

            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (
                $user &&
                password_verify($password, $user['password_hash']) &&
                $user['status'] === 'active'
            ) {
                if ($user['role'] === 'admin') {
                    session_regenerate_id(true);

                    $_SESSION['user_id'] = (int) $user['id'];
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['user_role'] = $user['role'];
                    $_SESSION['last_activity'] = time();
                        $_SESSION['session_minutes'] = $sessionMinutes;

                    header('Location: panel.php');
                    exit;
                }

                if ($user['role'] === 'partner') {
                    $stmtSocio = $pdo->prepare(
                        'SELECT id, status
                         FROM partners
                         WHERE user_id = ?
                         LIMIT 1'
                    );

                    $stmtSocio->execute([(int) $user['id']]);
                    $socio = $stmtSocio->fetch(PDO::FETCH_ASSOC);

                    if ($socio && $socio['status'] === 'active') {
                        session_regenerate_id(true);

                        $_SESSION['user_id'] = (int) $user['id'];
                        $_SESSION['user_email'] = $user['email'];
                        $_SESSION['user_role'] = 'partner';
                        $_SESSION['partner_id'] = (int) $socio['id'];
                        $_SESSION['last_activity'] = time();
                        $_SESSION['session_minutes'] = $sessionMinutes;

                        header('Location: socio.php');
                        exit;
                    }
                }
            }

            $error = 'Credenciales incorrectas o cuenta sin acceso.';
        } catch (PDOException $e) {
            error_log($e->getMessage());
            $error = 'No se pudo procesar el acceso. Intenta más tarde.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Acceso | Mi Localito</title>
    <style>
        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 20px;
            background: #f4f7f5;
            font-family: Arial, sans-serif;
            color: #202820;
        }

        .login {
            width: 100%;
            max-width: 400px;
            padding: 32px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 30px rgba(0,0,0,.08);
        }

        h1 { margin-top: 0; font-size: 25px; }
        p { color: #59645c; line-height: 1.5; }

        label {
            display: block;
            margin: 18px 0 7px;
            font-weight: bold;
        }

        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccd5ce;
            border-radius: 8px;
            font-size: 16px;
        }

        button {
            width: 100%;
            margin-top: 24px;
            padding: 13px;
            border: 0;
            border-radius: 8px;
            background: #048a25;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        .error {
            padding: 12px;
            border-radius: 8px;
            background: #fff0f0;
            color: #a21d1d;
        }
    </style>
</head>
<body>
    <main class="login">
        <h1>Mi Localito</h1>
        <p>Accede a tu cuenta de Mi Localito.</p>

        <?php if ($sessionExpired): ?>
            <p class="error" role="alert">Tu sesión se bloqueó por inactividad. Inicia sesión nuevamente para continuar.</p>
        <?php elseif ($accountInactive): ?>
            <p class="error" role="alert">Tu cuenta no está activa. Contacta al administrador de Mi Localito.</p>
        <?php endif; ?>

        <?php if ($error !== ''): ?>
            <p class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>

        <form method="POST" action="">
            <label for="email">Correo electrónico</label>
            <input
                type="email"
                id="email"
                name="email"
                autocomplete="username"
                required
            >

            <label for="password">Contraseña</label>
            <input
                type="password"
                id="password"
                name="password"
                autocomplete="current-password"
                required
            >

            <button type="submit">Iniciar sesión</button>
        </form>
    </main>
</body>
</html>
