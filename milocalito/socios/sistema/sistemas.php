<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';
if (!isset($_SESSION['user_id'], $_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    header('Location: login.php'); exit;
}
require_once __DIR__ . '/conexion.php';
if (empty($_SESSION['csrf_sistemas'])) $_SESSION['csrf_sistemas'] = bin2hex(random_bytes(32));
function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
$mensaje = ''; $error = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!hash_equals((string)$_SESSION['csrf_sistemas'], (string)($_POST['csrf_token'] ?? ''))) throw new RuntimeException('La sesión expiró. Recarga e inténtalo de nuevo.');
        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        if (!$id || $id < 1) throw new RuntimeException('Sistema no válido.');
        $accion = (string)($_POST['accion'] ?? '');
        if ($accion === 'guardar') {
            $nombre = trim((string)($_POST['name'] ?? ''));
            $precio = filter_input(INPUT_POST, 'price_mxn', FILTER_VALIDATE_FLOAT);
            $directa = filter_input(INPUT_POST, 'direct_rate', FILTER_VALIDATE_FLOAT);
            $equipo = filter_input(INPUT_POST, 'team_rate', FILTER_VALIDATE_FLOAT);
            if ($nombre === '' || strlen($nombre) > 120) throw new RuntimeException('Escribe un nombre válido (máximo 120 caracteres).');
            if ($precio === false || $precio === null || $precio < 0 || $precio > 10000000) throw new RuntimeException('El precio debe estar entre $0 y $10,000,000 MXN.');
            if ($directa === false || $directa === null || $directa < 0 || $directa > 100 || $equipo === false || $equipo === null || $equipo < 0 || $equipo > 100) throw new RuntimeException('Los porcentajes de comisión deben estar entre 0 y 100.');
            $q = $pdo->prepare('UPDATE systems SET name = ?, price_cents = ?, direct_rate = ?, team_rate = ? WHERE id = ?');
            $q->execute([$nombre, (int)round((float)$precio * 100), (float)$directa, (float)$equipo, $id]);
            $mensaje = 'Sistema actualizado correctamente.';
        } elseif ($accion === 'estado') {
            $activo = (int)($_POST['active'] ?? 0) === 1 ? 1 : 0;
            $q = $pdo->prepare('UPDATE systems SET active = ? WHERE id = ?'); $q->execute([$activo, $id]);
            $mensaje = $activo ? 'Sistema activado correctamente.' : 'Sistema desactivado correctamente.';
        } else throw new RuntimeException('Acción no válida.');
    } catch (Throwable $e) {
        $mensaje = $e instanceof RuntimeException ? $e->getMessage() : 'No se pudo guardar el cambio. Revisa el registro de errores del servidor.';
        $error = true; if (!($e instanceof RuntimeException)) error_log('Mi Localito Sistemas: '.$e->getMessage());
    }
}
try {
    $sistemas = $pdo->query('SELECT id, code, name, price_cents, direct_rate, team_rate, active, created_at FROM systems ORDER BY id ASC')->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) { error_log('Mi Localito Sistemas consulta: '.$e->getMessage()); $sistemas = []; $errorConsulta = true; }
?>
<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sistemas | Mi Localito</title>
<style>
:root{--g:#078a35;--dark:#102117;--muted:#66736a;--line:#dfe7e1;--bg:#f4f7f4;--red:#a52b2b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#1b261e;font-family:Arial,Helvetica,sans-serif}header{background:var(--dark);color:white;padding:20px max(18px,calc((100% - 1120px)/2));display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}header h1{font-size:22px;margin:0 0 5px}header p{margin:0;color:#c8d8cc;font-size:13px}header a{color:white}main{max-width:1120px;margin:26px auto;padding:0 16px 40px}.intro{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:20px}.intro h2{margin:0 0 6px;font-size:24px}.intro p{margin:0;color:var(--muted);font-size:14px;line-height:1.5}a{color:var(--g);font-weight:bold;text-decoration:none}.back{background:white;border:1px solid var(--line);padding:10px 13px;border-radius:8px}.notice{padding:13px 15px;border-radius:9px;margin:0 0 18px;background:#e8f7ec;color:#17602b;border:1px solid #bde4c7;font-size:14px}.notice.error{background:#fff0f0;color:var(--red);border-color:#efcaca}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{background:white;border:1px solid var(--line);border-radius:14px;padding:18px;min-width:0}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.code{display:inline-block;font-size:11px;letter-spacing:.08em;font-weight:bold;color:var(--g);background:#e9f8ed;border-radius:6px;padding:6px 8px;margin-bottom:8px}.card h3{margin:0;font-size:19px;overflow-wrap:anywhere}.status{font-size:12px;font-weight:bold;border-radius:30px;padding:6px 9px;white-space:nowrap;background:#e8f7ec;color:#17602b}.off{background:#f1f2f1;color:#68716a}.price-label{display:block;font-size:12px;color:var(--muted);margin-bottom:5px}.price{font-size:25px;font-weight:800;margin:0 0 16px}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field{min-width:0}.full{grid-column:1/-1}label{display:block;font-size:12px;font-weight:bold;margin-bottom:6px;color:#344238}input{width:100%;min-width:0;padding:11px 10px;border:1px solid #cfd9d1;border-radius:8px;font:inherit;font-size:14px}button{border:0;border-radius:8px;padding:11px 14px;font-weight:bold;font-size:13px;cursor:pointer}.primary{background:var(--g);color:white}.secondary{background:#edf1ed;color:#27352a;border:1px solid var(--line)}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}.small{font-size:12px;color:var(--muted);margin-top:12px;line-height:1.5}.empty{background:white;border:1px dashed #cbd8cd;padding:18px;border-radius:10px;color:var(--muted)}@media(max-width:700px){.cards{grid-template-columns:1fr}.intro h2{font-size:21px}}@media(max-width:390px){.fields{grid-template-columns:1fr}.full{grid-column:auto}.card{padding:14px}}
</style></head><body>
<header><div><h1>Mi Localito · Sistemas</h1><p>Administración del catálogo y sus reglas de comisión</p></div><a href="panel.php">← Volver al dashboard</a></header>
<main><div class="intro"><div><h2>Catálogo de sistemas</h2><p>Edita nombres, precios y porcentajes. Desactiva un sistema sin eliminarlo.</p></div><a class="back" href="panel.php">Volver al dashboard</a></div>
<?php if ($mensaje !== ''): ?><div class="notice <?= $error ? 'error' : '' ?>"><?= h($mensaje) ?></div><?php endif; ?>
<?php if (!empty($errorConsulta)): ?><div class="empty">No se pudo consultar la tabla systems. Revisa la conexión y el registro de errores.</div><?php elseif (!$sistemas): ?><div class="empty">No hay sistemas registrados todavía.</div><?php else: ?><div class="cards">
<?php foreach ($sistemas as $s): ?><article class="card"><div class="top"><div><span class="code"><?= h($s['code']) ?></span><h3><?= h($s['name']) ?></h3></div><span class="status <?= (int)$s['active'] === 1 ? '' : 'off' ?>"><?= (int)$s['active'] === 1 ? 'Activo' : 'Inactivo' ?></span></div><span class="price-label">Precio actual</span><p class="price">$<?= number_format(((int)$s['price_cents'])/100,2) ?> MXN</p>
<form method="post"><input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_sistemas']) ?>"><input type="hidden" name="accion" value="guardar"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><div class="fields"><div class="field full"><label for="n<?= (int)$s['id'] ?>">Nombre del sistema</label><input id="n<?= (int)$s['id'] ?>" name="name" maxlength="120" required value="<?= h($s['name']) ?>"></div><div class="field"><label for="p<?= (int)$s['id'] ?>">Precio (MXN)</label><input id="p<?= (int)$s['id'] ?>" name="price_mxn" type="number" min="0" max="10000000" step="0.01" required value="<?= h(number_format(((int)$s['price_cents'])/100,2,'.','')) ?>"></div><div class="field"><label for="d<?= (int)$s['id'] ?>">Comisión directa (%)</label><input id="d<?= (int)$s['id'] ?>" name="direct_rate" type="number" min="0" max="100" step="0.01" required value="<?= h($s['direct_rate']) ?>"></div><div class="field"><label for="t<?= (int)$s['id'] ?>">Comisión de equipo (%)</label><input id="t<?= (int)$s['id'] ?>" name="team_rate" type="number" min="0" max="100" step="0.01" required value="<?= h($s['team_rate']) ?>"></div></div><div class="actions"><button class="primary" type="submit">Guardar cambios</button></div></form>
<form method="post" class="actions" onsubmit="return confirm('¿Confirmas cambiar el estado de este sistema?');"><input type="hidden" name="csrf_token" value="<?= h($_SESSION['csrf_sistemas']) ?>"><input type="hidden" name="accion" value="estado"><input type="hidden" name="id" value="<?= (int)$s['id'] ?>"><input type="hidden" name="active" value="<?= (int)$s['active'] === 1 ? '0' : '1' ?>"><button class="secondary" type="submit"><?= (int)$s['active'] === 1 ? 'Desactivar sistema' : 'Activar sistema' ?></button></form><p class="small">Código: <?= h($s['code']) ?> · ID: <?= (int)$s['id'] ?><br>Las comisiones históricas no se recalculan desde esta pantalla.</p></article><?php endforeach; ?></div><?php endif; ?></main><?php require_once __DIR__ . '/bloqueo_visual.php'; ?>
</body></html>
