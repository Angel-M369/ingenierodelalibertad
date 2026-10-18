<?php
declare(strict_types=1);

session_start();
require_once __DIR__ . '/conexion.php';

if (!isset($pdo) || !($pdo instanceof PDO)) {
    http_response_code(500);
    exit('No se pudo establecer la conexión con la base de datos.');
}

if (empty($_SESSION['csrf_registro'])) {
    $_SESSION['csrf_registro'] = bin2hex(random_bytes(32));
}

// Leer las reglas administrativas que deben aplicarse al crear nuevas cuentas.
// Si no se puede consultar la configuración, el registro se bloquea por seguridad.
$configuracionDisponible = true;
$ajustes = [];
try {
    $stmtAjustes = $pdo->prepare(
        'SELECT setting_key, setting_value
         FROM app_settings
         WHERE setting_key IN (?, ?)'
    );
    $stmtAjustes->execute([
        'partner_registration_enabled',
        'partner_recruitment_default'
    ]);
    foreach ($stmtAjustes->fetchAll(PDO::FETCH_ASSOC) as $ajuste) {
        $ajustes[(string)$ajuste['setting_key']] = (string)$ajuste['setting_value'];
    }
} catch (Throwable $e) {
    $configuracionDisponible = false;
    error_log('Mi Localito registro: no se pudo leer app_settings: ' . $e->getMessage());
}

$registroPermitido = $configuracionDisponible
    && in_array($ajustes['partner_registration_enabled'] ?? '0', ['1', 'true', 'on'], true);
$reclutamientoPorDefecto = $configuracionDisponible
    && in_array($ajustes['partner_recruitment_default'] ?? '0', ['1', 'true', 'on'], true);

$errores = [];
$nombre = '';
$email = '';
$telefono = '';
$codigoReferido = strtoupper(trim((string)($_GET['ref'] ?? '')));
$registroExitoso = false;
$referralCode = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$registroPermitido) {
        $errores[] = $configuracionDisponible
            ? 'El registro de nuevos socios está deshabilitado por el administrador.'
            : 'No se pudo verificar la configuración del registro. Inténtalo más tarde.';
    }

    $nombre = trim((string)($_POST['nombre'] ?? ''));
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $telefono = trim((string)($_POST['telefono'] ?? ''));
    $codigoReferido = strtoupper(trim((string)($_POST['codigo_referido'] ?? '')));
    $password = (string)($_POST['password'] ?? '');
    $confirmacion = (string)($_POST['confirmacion'] ?? '');
    $csrf = (string)($_POST['csrf_token'] ?? '');

    if (
        !is_string($_SESSION['csrf_registro'] ?? null) ||
        !hash_equals($_SESSION['csrf_registro'], $csrf)
    ) {
        $errores[] = 'La sesión expiró. Recarga la página e inténtalo de nuevo.';
    }

    if ($nombre === '' || strlen($nombre) > 150) {
        $errores[] = 'Escribe tu nombre o nombre comercial (máximo 150 caracteres).';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
        $errores[] = 'Escribe un correo electrónico válido.';
    }

    if (strlen($telefono) > 30) {
        $errores[] = 'El teléfono no puede superar los 30 caracteres.';
    }

    if (strlen($password) < 12) {
        $errores[] = 'La contraseña debe tener al menos 12 caracteres.';
    }

    if ($password !== $confirmacion) {
        $errores[] = 'Las contraseñas no coinciden.';
    }

    if (
        $codigoReferido !== '' &&
        !preg_match('/^[A-Z0-9_-]{1,50}$/', $codigoReferido)
    ) {
        $errores[] = 'El código de referido no tiene un formato válido.';
    }

    if (!$errores) {
        try {
            $pdo->beginTransaction();

            // Comprobar que el correo no esté registrado.
            $stmt = $pdo->prepare(
                'SELECT id FROM users WHERE email = ? LIMIT 1'
            );
            $stmt->execute([$email]);

            if ($stmt->fetchColumn()) {
                throw new RuntimeException(
                    'Ya existe una cuenta con ese correo electrónico.'
                );
            }

            // Validar al patrocinador y su permiso para reclutar.
            $sponsorId = null;

            if ($codigoReferido !== '') {
                $stmt = $pdo->prepare(
                    "SELECT p.id
                     FROM partners p
                     INNER JOIN users u ON u.id = p.user_id
                     WHERE p.referral_code = ?
                       AND p.status = 'active'
                       AND p.can_recruit = 1
                       AND u.status = 'active'
                     LIMIT 1
                     FOR UPDATE"
                );

                $stmt->execute([$codigoReferido]);
                $sponsorId = $stmt->fetchColumn();

                if (!$sponsorId) {
                    throw new RuntimeException(
                        'El código de invitación no es válido o el socio no tiene permiso para reclutar.'
                    );
                }

                // sponsor_id guarda partners.id, no users.id.
                $sponsorId = (int)$sponsorId;
            }

            // Proteger la contraseña.
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            if ($passwordHash === false) {
                throw new RuntimeException(
                    'No se pudo proteger la contraseña. Inténtalo nuevamente.'
                );
            }

            // Crear la cuenta del usuario.
            $stmt = $pdo->prepare(
                "INSERT INTO users (email, password_hash, role, status)
                 VALUES (?, ?, 'partner', 'active')"
            );
            $stmt->execute([$email, $passwordHash]);

            $userId = (int)$pdo->lastInsertId();

            // Generar un código personal único.
            do {
                $referralCode = 'ML' . strtoupper(bin2hex(random_bytes(5)));

                $stmt = $pdo->prepare(
                    'SELECT id FROM partners WHERE referral_code = ? LIMIT 1'
                );
                $stmt->execute([$referralCode]);
                $existeCodigo = (bool)$stmt->fetchColumn();
            } while ($existeCodigo);

            // Crear el socio pendiente, vinculado a su patrocinador.
            $stmt = $pdo->prepare(
                "INSERT INTO partners (
                    user_id,
                    sponsor_id,
                    referral_code,
                    display_name,
                    phone,
                    can_recruit,
                    recruitment_approved_at,
                    status
                ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending')"
            );

            $stmt->execute([
                $userId,
                $sponsorId,
                $referralCode,
                $nombre,
                $telefono !== '' ? $telefono : null,
                $reclutamientoPorDefecto ? 1 : 0
            ]);

            $pdo->commit();

            // Renovar el token CSRF.
            $_SESSION['csrf_registro'] = bin2hex(random_bytes(32));
            $registroExitoso = true;

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            if ($e instanceof RuntimeException) {
                $errores[] = $e->getMessage();
            } else {
                error_log('Mi Localito registro: ' . $e->getMessage());
                $errores[] =
                    'No se pudo completar el registro. Revisa los datos e inténtalo nuevamente.';
            }
        }
    }
}

function escapar(string $valor): string
{
    return htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="es-MX">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Registro de socios | Mi Localito</title>

    <style>
        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            padding: 24px;
            display: grid;
            place-items: center;
            font-family: Arial, sans-serif;
            color: #202820;
            background: #f4f7f5;
        }

        .card {
            width: 100%;
            max-width: 480px;
            padding: 30px;
            background: #fff;
            border: 1px solid #e3eae5;
            border-radius: 18px;
            box-shadow: 0 12px 35px rgba(0,0,0,.06);
        }

        h1 { margin-top: 0; color: #048a25; }

        .intro {
            color: #68756b;
            line-height: 1.5;
        }

        label {
            display: block;
            margin: 16px 0 7px;
            font-weight: bold;
        }

        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccd7ce;
            border-radius: 8px;
            font-size: 16px;
        }

        button {
            width: 100%;
            margin-top: 22px;
            padding: 14px;
            border: 0;
            border-radius: 8px;
            background: #048a25;
            color: #fff;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        button:hover { background: #03691c; }

        .error {
            padding: 12px;
            margin: 12px 0;
            border-radius: 8px;
            background: #fff0f0;
            color: #9b1c1c;
        }

        .success {
            padding: 15px;
            border-radius: 8px;
            background: #e9f7ed;
            line-height: 1.6;
        }

        .note {
            color: #68756b;
            font-size: 13px;
            line-height: 1.5;
        }

        .referral-note {
            padding: 12px;
            border-radius: 8px;
            background: #e9f7ed;
            color: #17632b;
            line-height: 1.5;
        }
    </style>
</head>

<body>
<div class="card">
    <h1>Mi Localito</h1>
    <p class="intro">Registro de nuevos socios de la plataforma.</p>

    <?php if (!$registroPermitido): ?>

        <div class="error">
            <?php if ($configuracionDisponible): ?>
                El registro de nuevos socios está temporalmente deshabilitado por el administrador.
            <?php else: ?>
                No se pudo verificar la configuración del registro. Inténtalo más tarde.
            <?php endif; ?>
        </div>

    <?php elseif ($registroExitoso): ?>

        <div class="success">
            <strong>¡Registro completado!</strong>
            <p>Tu cuenta fue creada correctamente.</p>
            <p>
                Tu código personal de referido es:
                <strong><?= escapar($referralCode) ?></strong>
            </p>
            <p>
                Tu registro quedó <strong>pendiente de aprobación</strong>.
                Todavía no puedes iniciar sesión ni reclutar.
            </p>
            <p>El administrador podrá revisar tu registro desde el panel.</p>
        </div>

    <?php else: ?>

        <?php foreach ($errores as $error): ?>
            <div class="error"><?= escapar($error) ?></div>
        <?php endforeach; ?>

        <?php if ($codigoReferido !== ''): ?>
            <div class="referral-note">
                Estás registrándote mediante una invitación.
                El código se validará al enviar el formulario.
            </div>
        <?php endif; ?>

        <form method="post" action="">
            <input
                type="hidden"
                name="csrf_token"
                value="<?= escapar($_SESSION['csrf_registro']) ?>"
            >

            <label for="nombre">Nombre o nombre comercial</label>
            <input
                id="nombre"
                name="nombre"
                maxlength="150"
                value="<?= escapar($nombre) ?>"
                autocomplete="name"
                required
            >

            <label for="email">Correo electrónico</label>
            <input
                id="email"
                name="email"
                type="email"
                maxlength="190"
                value="<?= escapar($email) ?>"
                autocomplete="email"
                required
            >

            <label for="telefono">Teléfono (opcional)</label>
            <input
                id="telefono"
                name="telefono"
                type="tel"
                maxlength="30"
                value="<?= escapar($telefono) ?>"
                autocomplete="tel"
            >

            <label for="codigo_referido">Código de invitación (opcional)</label>
            <input
                id="codigo_referido"
                name="codigo_referido"
                maxlength="50"
                value="<?= escapar($codigoReferido) ?>"
                autocomplete="off"
            >

            <label for="password">Contraseña</label>
            <input
                id="password"
                name="password"
                type="password"
                minlength="12"
                autocomplete="new-password"
                required
            >

            <label for="confirmacion">Confirmar contraseña</label>
            <input
                id="confirmacion"
                name="confirmacion"
                type="password"
                minlength="12"
                autocomplete="new-password"
                required
            >

            <p class="note">
                Usa una contraseña de al menos 12 caracteres.
            </p>

            <button type="submit">Crear cuenta de socio</button>
        </form>

    <?php endif; ?>
</div>
</body>
</html>