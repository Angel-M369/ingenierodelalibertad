<?php
session_start();
require_once __DIR__ . '/control_sesion.php';

// Protección del panel de administración
if (
    !isset($_SESSION['user_id']) ||
    !isset($_SESSION['user_role']) ||
    $_SESSION['user_role'] !== 'admin'
) {
    header('Location: login.php');
    exit;
}

$email = $_SESSION['user_email'] ?? 'Administrador';
$userId = (int) $_SESSION['user_id'];
require_once __DIR__ . '/conexion.php';

/**
 * Devuelve el número de registros de una tabla existente.
 * Cada tabla se pasa como nombre fijo desde este mismo archivo.
 */
function contarRegistros(PDO $pdo, string $tabla): int
{
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $tabla)) {
        return 0;
    }

    try {
        return (int) $pdo->query("SELECT COUNT(*) FROM `{$tabla}`")->fetchColumn();
    } catch (PDOException $e) {
        error_log("Mi Localito: no se pudo contar {$tabla}: " . $e->getMessage());
        return 0;
    }
}

/**
 * Obtiene hasta 10 registros de una tabla conocida.
 * Si la tabla aún no existe o falla la consulta, devuelve un arreglo vacío.
 */
function obtenerRegistros(PDO $pdo, string $tabla, int $limite = 10): array
{
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $tabla)) {
        return [];
    }

    try {
        $limite = max(1, min(25, $limite));
        return $pdo->query("SELECT * FROM `{$tabla}` LIMIT {$limite}")->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Mi Localito: no se pudieron consultar registros de {$tabla}: " . $e->getMessage());
        return [];
    }
}

/**
 * Busca una tabla de actividad/configuración entre nombres habituales.
 * Solo consulta nombres de tablas previamente definidos aquí.
 */
function buscarTablaDisponible(PDO $pdo, array $candidatas): ?string
{
    foreach ($candidatas as $tabla) {
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $tabla)) {
            continue;
        }

        try {
            $stmt = $pdo->prepare(
                'SELECT COUNT(*) FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = ?'
            );
            $stmt->execute([$tabla]);

            if ((int) $stmt->fetchColumn() > 0) {
                return $tabla;
            }
        } catch (PDOException $e) {
            error_log('Mi Localito: no se pudo comprobar una tabla auxiliar: ' . $e->getMessage());
            return null;
        }
    }

    return null;
}

/**
 * Renderiza una tabla de consulta y oculta columnas que podrían contener
 * contraseñas, tokens o secretos. No realiza cambios en la base de datos.
 */
function mostrarTabla(array $registros, string $mensajeVacio): void
{
    if (!$registros) {
        echo '<div class="empty-state">' . htmlspecialchars($mensajeVacio, ENT_QUOTES, 'UTF-8') . '</div>';
        return;
    }

    $columnas = array_keys($registros[0]);
    $columnas = array_values(array_filter($columnas, static function ($columna): bool {
        return !preg_match('/password|passwd|hash|token|secret|api.?key|private.?key|credential/i', (string) $columna);
    }));

    if (!$columnas) {
        echo '<div class="empty-state">Hay registros, pero no hay columnas seguras para mostrar.</div>';
        return;
    }

    echo '<div class="table-wrap"><table class="data-table"><thead><tr>';
    foreach ($columnas as $columna) {
        echo '<th>' . htmlspecialchars((string) $columna, ENT_QUOTES, 'UTF-8') . '</th>';
    }
    echo '</tr></thead><tbody>';

    foreach ($registros as $registro) {
        echo '<tr>';
        foreach ($columnas as $columna) {
            $valor = $registro[$columna] ?? '';
            if (is_array($valor) || is_object($valor)) {
                $valor = json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
            if ($valor === null || $valor === '') {
                $texto = '—';
            } else {
                $texto = (string) $valor;
            }
            if (function_exists('mb_strlen') && mb_strlen($texto, 'UTF-8') > 160) {
                $texto = mb_substr($texto, 0, 157, 'UTF-8') . '…';
            } elseif (!function_exists('mb_strlen') && strlen($texto) > 160) {
                $texto = substr($texto, 0, 157) . '...';
            }
            echo '<td>' . htmlspecialchars($texto, ENT_QUOTES, 'UTF-8') . '</td>';
        }
        echo '</tr>';
    }

    echo '</tbody></table></div>';
}


// Token CSRF para proteger las acciones administrativas.
if (empty($_SESSION['csrf_panel'])) {
    $_SESSION['csrf_panel'] = bin2hex(random_bytes(32));
}
$mensajeSocios = '';
$tipoMensajeSocios = 'success';

// Acciones del módulo Socios: únicamente mediante POST y sesión de administrador.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion_socio'])) {
    $tokenRecibido = (string)($_POST['csrf_token'] ?? '');
    if (!hash_equals((string)$_SESSION['csrf_panel'], $tokenRecibido)) {
        $mensajeSocios = 'La sesión de seguridad expiró. Recarga la página e inténtalo de nuevo.';
        $tipoMensajeSocios = 'error';
    } else {
        $socioIdAccion = filter_input(INPUT_POST, 'socio_id', FILTER_VALIDATE_INT);
        $accionSocio = (string)$_POST['accion_socio'];

        if (!$socioIdAccion || $socioIdAccion < 1) {
            $mensajeSocios = 'El identificador del socio no es válido.';
            $tipoMensajeSocios = 'error';
        } else {
            try {
                $pdo->beginTransaction();

                $stmtSocio = $pdo->prepare(
                    'SELECT p.id, p.user_id, p.status, p.can_recruit
                     FROM partners p
                     WHERE p.id = ?
                     FOR UPDATE'
                );
                $stmtSocio->execute([$socioIdAccion]);
                $socioActual = $stmtSocio->fetch(PDO::FETCH_ASSOC);

                if (!$socioActual) {
                    throw new RuntimeException('No se encontró el socio seleccionado.');
                }
                if ((int)$socioActual['user_id'] === $userId) {
                    throw new RuntimeException('No puedes suspender ni cambiar los permisos de tu propio usuario desde esta sección.');
                }

                if ($accionSocio === 'cambiar_estado') {
                    $nuevoEstado = (string)($_POST['nuevo_estado'] ?? '');
                    if (!in_array($nuevoEstado, ['pending', 'active', 'suspended'], true)) {
                        throw new RuntimeException('El estado seleccionado no es válido.');
                    }

                    if ($nuevoEstado === 'suspended') {
                        // Al suspender, se retira también el permiso de reclutamiento.
                        $stmtActualizarSocio = $pdo->prepare(
                            'UPDATE partners
                             SET status = ?, can_recruit = 0, recruitment_approved_at = NULL
                             WHERE id = ?'
                        );
                        $stmtActualizarSocio->execute([$nuevoEstado, $socioIdAccion]);
                    } else {
                        $stmtActualizarSocio = $pdo->prepare(
                            'UPDATE partners SET status = ? WHERE id = ?'
                        );
                        $stmtActualizarSocio->execute([$nuevoEstado, $socioIdAccion]);
                    }

                    // users solo admite active/suspended; pending en partners mantiene la cuenta activa,
                    // pero el socio aún no queda habilitado como socio activo.
                    $estadoUsuario = ($nuevoEstado === 'suspended') ? 'suspended' : 'active';
                    $stmtUsuario = $pdo->prepare('UPDATE users SET status = ? WHERE id = ?');
                    $stmtUsuario->execute([$estadoUsuario, (int)$socioActual['user_id']]);

                    $mensajeSocios = 'Estado del socio actualizado correctamente.';
                } elseif ($accionSocio === 'cambiar_reclutamiento') {
                    $permitirReclutar = (int)($_POST['permitir_reclutar'] ?? 0) === 1;

                    if ($permitirReclutar && $socioActual['status'] !== 'active') {
                        throw new RuntimeException('Solo puedes autorizar el reclutamiento a un socio con estado active.');
                    }

                    $stmtReclutamiento = $pdo->prepare(
                        'UPDATE partners
                         SET can_recruit = ?,
                             recruitment_approved_at = ?
                         WHERE id = ?'
                    );
                    $stmtReclutamiento->execute([
                        $permitirReclutar ? 1 : 0,
                        $permitirReclutar ? date('Y-m-d H:i:s') : null,
                        $socioIdAccion
                    ]);

                    $mensajeSocios = $permitirReclutar
                        ? 'Permiso para reclutar aprobado correctamente.'
                        : 'Permiso para reclutar retirado correctamente.';
                } else {
                    throw new RuntimeException('La acción solicitada no está permitida.');
                }

                $pdo->commit();
                $tipoMensajeSocios = 'success';
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $mensajeSocios = $e instanceof RuntimeException
                    ? $e->getMessage()
                    : 'No se pudo completar la acción. Revisa el registro de errores del servidor.';
                $tipoMensajeSocios = 'error';
                if (!($e instanceof RuntimeException)) {
                    error_log('Mi Localito: error en acción de socios: ' . $e->getMessage());
                }
            }
        }
    }
}


$sociosDetallados = [];
$errorConsultaSocios = false;
try {
    $sqlSocios = "SELECT p.id, p.display_name, u.email AS user_email, p.phone,
        p.referral_code, sponsor.display_name AS sponsor_name, p.status,
        p.can_recruit, p.recruitment_approved_at, p.created_at
        FROM partners AS p
        LEFT JOIN users AS u ON u.id = p.user_id
        LEFT JOIN partners AS sponsor ON sponsor.id = p.sponsor_id
        ORDER BY p.id DESC LIMIT 100";
    $sociosDetallados = $pdo->query($sqlSocios)->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $errorConsultaSocios = true;
    error_log('Mi Localito: no se pudo cargar la vista detallada de socios: ' . $e->getMessage());
}
$totalSocios = contarRegistros($pdo, 'partners');
?>
<!DOCTYPE html>
<html lang="es-MX">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de socios | Mi Localito</title>
    <style>
        :root {
            --green: #048a25;
            --green-dark: #03691c;
            --green-light: #e9f7ed;
            --bg: #f4f7f5;
            --white: #fff;
            --text: #202820;
            --muted: #68756b;
            --border: #e3eae5;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: var(--bg);
            color: var(--text);
        }

        a {
            color: inherit;
            text-decoration: none;
        }

        .layout {
            min-height: 100vh;
            display: flex;
        }

        .sidebar {
            width: 250px;
            flex-shrink: 0;
            background: #101b13;
            color: white;
            padding: 28px 18px;
            display: flex;
            flex-direction: column;
        }

        .brand {
            padding: 0 12px 28px;
            border-bottom: 1px solid #304034;
        }

        .brand h1 {
            margin: 0;
            font-size: 25px;
            letter-spacing: -.8px;
        }

        .brand span {
            display: block;
            margin-top: 7px;
            color: #77df91;
            font-size: 12px;
        }

        .nav-label {
            margin: 27px 12px 12px;
            color: #a4b3a7;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 12px;
            margin-bottom: 5px;
            border-radius: 9px;
            color: #dbe6dd;
            font-size: 14px;
            transition: .2s;
        }

        .nav-link:hover,
        .nav-link.active {
            background: #203c27;
            color: white;
        }

        .nav-link.active {
            border-left: 3px solid #31c956;
        }

        .nav-icon {
            width: 22px;
            text-align: center;
            font-size: 17px;
        }

        .sidebar-bottom {
            margin-top: auto;
            padding-top: 24px;
        }

        .admin-mini {
            padding: 14px 10px;
            margin-bottom: 14px;
            border-top: 1px solid #304034;
            overflow-wrap: anywhere;
        }

        .admin-mini strong {
            display: block;
            font-size: 13px;
        }

        .admin-mini small {
            display: block;
            margin-top: 6px;
            color: #a4b3a7;
            font-size: 11px;
        }

        .logout {
            display: block;
            padding: 12px;
            border-radius: 8px;
            background: #27352a;
            text-align: center;
            font-size: 13px;
        }

        .logout:hover {
            background: #3b493e;
        }

        .main-area {
            min-width: 0;
            flex: 1;
        }

        .topbar {
            min-height: 78px;
            padding: 18px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            background: var(--white);
            border-bottom: 1px solid var(--border);
        }

        .topbar h2 {
            margin: 0;
            font-size: 20px;
        }

        .topbar p {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: 12px;
        }

        .role-badge {
            display: inline-block;
            padding: 8px 12px;
            background: var(--green-light);
            color: var(--green-dark);
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
        }

        main {
            max-width: 1450px;
            margin: 0 auto;
            padding: 30px 32px 45px;
        }

        .welcome {
            margin-bottom: 28px;
        }

        .welcome h1 {
            margin: 0 0 10px;
            font-size: clamp(24px, 3vw, 32px);
            letter-spacing: -1px;
        }

        .welcome p {
            margin: 0;
            color: var(--muted);
            line-height: 1.6;
        }

        .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin: 30px 0 16px;
        }

        .section-heading h2 {
            margin: 0;
            font-size: 18px;
        }

        .section-heading p {
            margin: 5px 0 0;
            color: var(--muted);
            font-size: 12px;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 17px;
        }

        .metric {
            min-width: 0;
            padding: 22px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 14px;
            box-shadow: 0 3px 12px rgba(20, 50, 25, .035);
        }

        .metric-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .metric-label {
            color: var(--muted);
            font-size: 13px;
        }

        .metric-icon {
            display: grid;
            place-items: center;
            width: 38px;
            height: 38px;
            flex-shrink: 0;
            background: var(--green-light);
            border-radius: 10px;
            font-size: 18px;
        }

        .metric-value {
            margin: 18px 0 9px;
            font-size: 24px;
            font-weight: bold;
        }

        .metric-note {
            color: var(--muted);
            font-size: 11px;
            line-height: 1.5;
        }

        .modules {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 17px;
        }

        .module {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            min-width: 0;
            padding: 23px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 14px;
            transition: .2s;
        }

        .module:hover {
            border-color: #9bd7a9;
            box-shadow: 0 7px 22px rgba(20, 50, 25, .06);
            transform: translateY(-2px);
        }

        .module-icon {
            display: grid;
            place-items: center;
            width: 46px;
            height: 46px;
            margin-bottom: 17px;
            background: var(--green-light);
            border-radius: 12px;
            font-size: 22px;
        }

        .module h3 {
            margin: 0 0 9px;
            font-size: 16px;
        }

        .module p {
            flex: 1;
            margin: 0 0 18px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }

        .module-status {
            display: inline-block;
            padding: 6px 9px;
            background: #f0f2f0;
            border-radius: 6px;
            color: #59645b;
            font-size: 11px;
        }

        .module-link {
            margin-top: 15px;
            color: var(--green);
            font-size: 13px;
            font-weight: bold;
        }

        .notice {
            margin-top: 25px;
            padding: 17px 20px;
            background: #fff;
            border: 1px solid var(--border);
            border-left: 4px solid var(--green);
            border-radius: 10px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.7;
        }

        footer {
            padding: 20px 32px;
            border-top: 1px solid var(--border);
            color: var(--muted);
            font-size: 11px;
            text-align: center;
        }

        @media (max-width: 1100px) {
            .metrics {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .modules {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 700px) {
            .layout {
                display: block;
            }

            .sidebar {
                width: 100%;
                padding: 18px;
            }

            .brand {
                padding-bottom: 16px;
            }

            .brand h1 {
                font-size: 22px;
            }

            .nav-label {
                margin-top: 18px;
            }

            .sidebar-bottom {
                margin-top: 15px;
                padding-top: 10px;
            }

            .admin-mini {
                padding-top: 12px;
            }

            .topbar {
                min-height: 68px;
                padding: 16px 20px;
            }

            main {
                padding: 25px 17px 35px;
            }

            .metrics,
            .modules {
                grid-template-columns: 1fr;
            }

            .metric {
                padding: 19px;
            }

            .section-heading {
                align-items: flex-start;
            }

            footer {
                padding: 20px;
            }
        }

        .module-link {
            display: inline-block;
        }

        .module-link:hover {
            text-decoration: underline;
        }

        .data-section {
            margin-top: 30px;
            padding: 22px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 14px;
            scroll-margin-top: 20px;
        }

        .data-section h2 {
            margin: 0 0 7px;
            font-size: 18px;
        }

        .section-description {
            margin: 0 0 18px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }

        .section-topline {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 15px;
        }

        .count-pill {
            display: inline-block;
            flex-shrink: 0;
            padding: 7px 10px;
            border-radius: 20px;
            background: var(--green-light);
            color: var(--green-dark);
            font-size: 12px;
            font-weight: bold;
        }

        .table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid var(--border);
            border-radius: 9px;
        }

        .data-table {
            width: 100%;
            min-width: 600px;
            border-collapse: collapse;
            font-size: 12px;
        }

        .data-table th,
        .data-table td {
            padding: 11px 12px;
            border-bottom: 1px solid var(--border);
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
            max-width: 280px;
        }

        .data-table th {
            background: #f7faf7;
            color: #465449;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .3px;
        }

        .data-table tr:last-child td {
            border-bottom: 0;
        }

        .data-table tbody tr:hover {
            background: #fbfdfb;
        }

        .empty-state {
            padding: 18px;
            border: 1px dashed #cbd8cd;
            border-radius: 9px;
            background: #fbfdfb;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }

        .config-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .config-item {
            padding: 15px;
            border: 1px solid var(--border);
            border-radius: 10px;
            min-width: 0;
        }

        .config-item small {
            display: block;
            margin-bottom: 7px;
            color: var(--muted);
            font-size: 11px;
        }

        .config-item strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 14px;
        }

        .back-top {
            display: inline-block;
            margin-top: 16px;
            color: var(--green);
            font-size: 12px;
            font-weight: bold;
        }

        @media (max-width: 700px) {
            .data-section {
                padding: 17px;
            }

            .config-grid {
                grid-template-columns: 1fr;
            }

            .section-topline {
                flex-direction: column;
            }
        }


        .notice-socios { margin: 0 0 16px; padding: 13px 15px; border-radius: 9px; font-size: 13px; line-height: 1.5; }
        .notice-socios.success { background: #e9f7ed; color: #145b27; border: 1px solid #b8e2c2; }
        .notice-socios.error { background: #fff0f0; color: #8a2020; border: 1px solid #f0c3c3; }
        .socios-actions { min-width: 190px; display: grid; gap: 8px; }
        .socios-actions form { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 0; }
        .socios-actions select, .socios-actions button { font: inherit; font-size: 11px; padding: 7px 8px; border-radius: 6px; border: 1px solid #d4dfd6; }
        .socios-actions button { cursor: pointer; background: var(--green); color: #fff; border-color: var(--green); font-weight: bold; }
        .socios-actions button:hover { background: var(--green-dark); }
        .socios-actions .secondary { background: #fff; color: var(--green-dark); }

    </style>
</head>
<body>
<div class="page-shell">
  <div class="dashboard">
    <header class="topbar">
      <div><h1>Gestión de socios</h1><p>Administra estados y permisos de reclutamiento.</p></div>
      <a class="module-link" href="panel.php">← Volver al panel principal</a>
    </header>
    <main>
      <section class="data-section" id="gestion-socios">
        <div class="section-topline"><div><h2>Socios registrados</h2><p class="section-description">Los cambios requieren sesión administrativa. Suspender un socio también retira su permiso de reclutamiento.</p></div><span class="count-pill"><?= $totalSocios ?> registrados</span></div>
        <?php if ($mensajeSocios !== ''): ?><div class="notice-socios <?= htmlspecialchars($tipoMensajeSocios, ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($mensajeSocios, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
        <?php if ($errorConsultaSocios): ?>
          <div class="empty-state">No se pudo cargar la lista de socios. Revisa el registro de errores del servidor.</div>
        <?php elseif (!$sociosDetallados): ?>
          <div class="empty-state">Todavía no hay socios registrados.</div>
        <?php else: ?>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Socio</th><th>Correo</th><th>Teléfono</th><th>Código de referido</th><th>Patrocinador</th><th>Estado</th><th>Puede reclutar</th><th>Aprobación reclutamiento</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>
        <?php foreach ($sociosDetallados as $socio): ?><tr>
          <td><?= (int)$socio['id'] ?></td><td><?= htmlspecialchars((string)($socio['display_name'] ?: 'Sin nombre'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)($socio['user_email'] ?: '—'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)($socio['phone'] ?: '—'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)($socio['referral_code'] ?: '—'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)($socio['sponsor_name'] ?: 'Sin patrocinador'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)$socio['status'], ENT_QUOTES, 'UTF-8') ?></td><td><?= !empty($socio['can_recruit']) ? 'Sí' : 'No' ?></td><td><?= htmlspecialchars((string)($socio['recruitment_approved_at'] ?: '—'), ENT_QUOTES, 'UTF-8') ?></td><td><?= htmlspecialchars((string)($socio['created_at'] ?: '—'), ENT_QUOTES, 'UTF-8') ?></td>
          <td><div class="socios-actions">
            <form method="post" action="socios.php"><input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_panel'], ENT_QUOTES, 'UTF-8') ?>"><input type="hidden" name="socio_id" value="<?= (int)$socio['id'] ?>"><input type="hidden" name="accion_socio" value="cambiar_estado"><select name="nuevo_estado" aria-label="Nuevo estado"><option value="pending" <?= $socio['status']==='pending'?'selected':'' ?>>Pendiente</option><option value="active" <?= $socio['status']==='active'?'selected':'' ?>>Activo</option><option value="suspended" <?= $socio['status']==='suspended'?'selected':'' ?>>Suspendido</option></select><button type="submit">Guardar estado</button></form>
            <form method="post" action="socios.php"><input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_panel'], ENT_QUOTES, 'UTF-8') ?>"><input type="hidden" name="socio_id" value="<?= (int)$socio['id'] ?>"><input type="hidden" name="accion_socio" value="cambiar_reclutamiento"><?php if (!empty($socio['can_recruit'])): ?><input type="hidden" name="permitir_reclutar" value="0"><button type="submit" class="secondary">Retirar permiso</button><?php else: ?><input type="hidden" name="permitir_reclutar" value="1"><button type="submit" <?= $socio['status']!=='active'?'disabled title="Primero activa al socio"':'' ?>>Aprobar reclutamiento</button><?php endif; ?></form>
          </div></td></tr><?php endforeach; ?>
        </tbody></table></div><p class="section-description">Se muestran hasta 100 socios, del más reciente al más antiguo.</p>
        <?php endif; ?>
      </section>
    </main>
    <footer>Mi Localito · Panel de administración</footer>
  </div>
</div>
<?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
