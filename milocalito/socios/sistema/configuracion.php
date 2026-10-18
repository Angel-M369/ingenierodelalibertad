<?php
declare(strict_types=1);
session_start();
require_once __DIR__ . '/control_sesion.php';
if (($_SESSION['user_role'] ?? '') !== 'admin') { header('Location: login.php'); exit; }
require_once __DIR__ . '/conexion.php';
if (!isset($pdo) || !($pdo instanceof PDO)) { http_response_code(500); exit('Error de conexión a la base de datos.'); }
function h($v): string { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8'); }
function tabla(PDO $pdo,string $t): bool { $q=$pdo->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?'); $q->execute([$t]); return (int)$q->fetchColumn()>0; }
if (!tabla($pdo,'app_settings')) { http_response_code(500); exit('Falta app_settings. Importa primero crear_app_settings.sql en phpMyAdmin.'); }
if (empty($_SESSION['csrf_cfg'])) $_SESSION['csrf_cfg']=bin2hex(random_bytes(32));
$csrf=$_SESSION['csrf_cfg']; $uid=$_SESSION['user_id']??null;
$defaults=['business_name'=>'Mi Localito','contact_email'=>'','timezone'=>'America/Mexico_City','session_minutes'=>'10','notify_email_enabled'=>'0','notify_email'=>'','notify_whatsapp_enabled'=>'0','notify_whatsapp'=>'','partner_registration_enabled'=>'1','partner_recruitment_default'=>'0'];
$s=$defaults;
$q=$pdo->query('SELECT setting_key,setting_value FROM app_settings');
foreach($q->fetchAll(PDO::FETCH_ASSOC) as $r) if(array_key_exists($r['setting_key'],$s)) $s[$r['setting_key']]=$r['setting_value'];
// Normaliza valores antiguos de duración para que el selector siempre muestre una opción válida.
if (!in_array((string)($s['session_minutes'] ?? ''), ['1','5','10','15','30','60'], true)) {
    $s['session_minutes'] = '30';
}

$msg=''; $err=false;
if($_SERVER['REQUEST_METHOD']==='POST'){
 if(!hash_equals($csrf,(string)($_POST['csrf_token']??''))){$msg='El formulario venció. Recarga la página.';$err=true;}
 else {
  $n=[
   'business_name'=>trim((string)($_POST['business_name']??'')),
   'contact_email'=>trim((string)($_POST['contact_email']??'')),
   'timezone'=>trim((string)($_POST['timezone']??'')),
   'session_minutes'=>(string)($_POST['session_minutes']??'60'),
   'notify_email_enabled'=>isset($_POST['notify_email_enabled'])?'1':'0',
   'notify_email'=>trim((string)($_POST['notify_email']??'')),
   'notify_whatsapp_enabled'=>isset($_POST['notify_whatsapp_enabled'])?'1':'0',
   'notify_whatsapp'=>trim((string)($_POST['notify_whatsapp']??'')),
   'partner_registration_enabled'=>isset($_POST['partner_registration_enabled'])?'1':'0',
   'partner_recruitment_default'=>isset($_POST['partner_recruitment_default'])?'1':'0'];
  $tz=timezone_identifiers_list();
  if($n['business_name']===''||strlen($n['business_name'])>120)$msg='El nombre es obligatorio (máximo 120 caracteres).';
  elseif($n['contact_email']!==''&&!filter_var($n['contact_email'],FILTER_VALIDATE_EMAIL))$msg='El correo de contacto no es válido.';
  elseif(!in_array($n['timezone'],$tz,true))$msg='Zona horaria no válida.';
  elseif(!in_array($n['session_minutes'],['1','5','10','15','30','60'],true))$msg='Duración de sesión no válida.';
  elseif($n['notify_email']!==''&&!filter_var($n['notify_email'],FILTER_VALIDATE_EMAIL))$msg='Correo de notificación no válido.';
  elseif($n['notify_email_enabled']==='1'&&$n['notify_email']==='')$msg='Indica el correo receptor de notificaciones.';
  elseif($n['notify_whatsapp_enabled']==='1'&&$n['notify_whatsapp']==='')$msg='Indica el WhatsApp receptor.';
  elseif(strlen($n['notify_whatsapp'])>30)$msg='El teléfono es demasiado largo.';
  if($msg!==''){$err=true;$s=array_merge($s,$n);}
  else try {
   $pdo->beginTransaction();
   // Guarda cada ajuste sin depender de que setting_key tenga un índice UNIQUE.
   // Si la clave ya existe, actualiza todas sus filas; si no existe, la crea.
   $exists=$pdo->prepare('SELECT COUNT(*) FROM app_settings WHERE setting_key = ?');
   $update=$pdo->prepare('UPDATE app_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?');
   $insert=$pdo->prepare('INSERT INTO app_settings (setting_key, setting_value, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
   foreach($n as $k=>$v){
       $exists->execute([$k]);
       if((int)$exists->fetchColumn() > 0){
           $update->execute([$v, $uid, $k]);
       }else{
           $insert->execute([$k, $v, $uid]);
       }
   }
   $a=$pdo->prepare("INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,details) VALUES(?, 'settings_updated','settings',NULL,?)");
   $a->execute([$uid,json_encode(['keys'=>array_keys($n)],JSON_UNESCAPED_UNICODE)]);
   $pdo->commit();$s=array_merge($s,$n);$msg='Configuración guardada correctamente.';
  }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('Configuración Mi Localito: '.$e->getMessage());$msg='No se guardaron los cambios. Revisa el log de errores.';$err=true;}
 }
}
$labels=['users'=>'Usuarios','partners'=>'Socios','systems'=>'Sistemas','sales'=>'Ventas','payments'=>'Pagos','commissions'=>'Comisiones','commission_installments'=>'Parcialidades','audit_log'=>'Auditoría','app_settings'=>'Configuración'];
$rows=[];
foreach($labels as $t=>$label){$ex=tabla($pdo,$t);$count=null;if($ex)try{$count=(int)$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();}catch(Throwable $e){}$rows[]=[$label,$t,$ex,$count];}
$db='No disponible';try{$db=(string)$pdo->query('SELECT VERSION()')->fetchColumn();}catch(Throwable $e){}
?>
<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Configuración | Mi Localito</title>
<style>
:root{color-scheme:dark;--bg:#080b09;--panel:#111713;--line:#28352b;--green:#19b943;--muted:#a8b5aa;--text:#f4f7f4}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,sans-serif}.wrap{max-width:1200px;margin:auto;padding:22px}a{color:inherit;text-decoration:none}.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px}.brand{font-size:20px;font-weight:800}.brand span{color:var(--green)}.btn{display:inline-block;padding:10px 14px;border:1px solid var(--line);border-radius:9px;background:#171f19;color:inherit;font-weight:700;cursor:pointer}.primary{background:var(--green);color:#041006}h1{margin:0} .muted,.sub,.hint{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;min-width:0;margin-top:14px}.panel h2{font-size:18px;margin:0 0 5px}.field{display:grid;gap:6px;margin:14px 0}.field input,.field select{width:100%;padding:11px;background:#0b100c;color:var(--text);border:1px solid var(--line);border-radius:8px;font:inherit}.check{display:flex;gap:10px;margin:13px 0}.check input{accent-color:var(--green);margin-top:5px}.notice,.warning{padding:13px 15px;border-radius:10px;margin:15px 0;background:#102316;border:1px solid #356342}.notice.error{background:#271313;border-color:#713535;color:#ffb5b5}.warning{background:#211b0d;border-color:#65512a;color:#f6e2a7}.tablewrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:500px}td,th{text-align:left;padding:10px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-size:12px}.ok{color:#72e89a}.warn{color:#ffd166}.hint{font-size:12px}@media(max-width:700px){.grid{grid-template-columns:1fr}.wrap{padding:14px}}
</style></head><body><main class="wrap">
<header class="top"><div class="brand">Mi <span>Localito</span> · Administración</div><nav><a class="btn" href="panel.php">← Dashboard</a> <a class="btn" href="sistemas.php">Administrar sistemas</a></nav></header>
<h1>Configuración</h1><p class="sub">Ajustes generales, seguridad, notificaciones, reglas iniciales de socios y diagnóstico técnico.</p>
<?php if($msg!==''):?><div class="notice <?=$err?'error':''?>"><?=h($msg)?></div><?php endif;?>
<div class="warning"><strong>Nota importante:</strong> preferencias de notificación aún no envían mensajes. Duración de sesión, zona horaria y reglas de altas se guardan, pero necesitan conectarse al sistema de autenticación y al flujo de registro para aplicarse globalmente.</div>
<form method="post" action="configuracion.php"><input type="hidden" name="csrf_token" value="<?=h($csrf)?>"><div class="grid">
<section class="panel"><h2>1. Datos generales</h2><p class="muted">Nombre, contacto y zona horaria.</p>
<div class="field"><label for="business_name">Nombre de la plataforma</label><input id="business_name" name="business_name" maxlength="120" required value="<?=h($s['business_name'])?>"></div>
<div class="field"><label for="contact_email">Correo de contacto</label><input id="contact_email" type="email" name="contact_email" value="<?=h($s['contact_email'])?>"></div>
<div class="field"><label for="timezone">Zona horaria</label><select id="timezone" name="timezone"><?php foreach(['America/Mexico_City'=>'Ciudad de México','America/Mazatlan'=>'Mazatlán','America/Tijuana'=>'Tijuana','America/Cancun'=>'Cancún','UTC'=>'UTC'] as $v=>$l):?><option value="<?=h($v)?>" <?=$s['timezone']===$v?'selected':''?>><?=h($l)?></option><?php endforeach;?></select><span class="hint">Se guarda la preferencia; no cambia PHP global automáticamente.</span></div></section>
<section class="panel"><h2>2. Seguridad y sesiones</h2><p class="muted">Tiempo de sesión deseado.</p><div class="field"><label for="session_minutes">Duración de sesión</label><select id="session_minutes" name="session_minutes"><?php foreach(['1'=>'1 minuto','5'=>'5 minutos','10'=>'10 minutos','15'=>'15 minutos','30'=>'30 minutos','60'=>'1 hora'] as $v=>$l):?><option value="<?=$v?>" <?=((string)($s['session_minutes'] ?? '') === (string)$v) ? 'selected' : ''?>><?=$l?></option><?php endforeach;?></select><span class="hint">Esta duración se aplica al detectar inactividad en login.php.</span></div></section>
<section class="panel"><h2>3. Notificaciones</h2><p class="muted">Destinatarios para futuras alertas.</p>
<label class="check"><input type="checkbox" name="notify_email_enabled" value="1" <?=$s['notify_email_enabled']==='1'?'checked':''?>>Activar preferencia de aviso por correo</label><div class="field"><label for="notify_email">Correo receptor</label><input id="notify_email" type="email" name="notify_email" value="<?=h($s['notify_email'])?>"></div>
<label class="check"><input type="checkbox" name="notify_whatsapp_enabled" value="1" <?=$s['notify_whatsapp_enabled']==='1'?'checked':''?>>Activar preferencia de aviso por WhatsApp</label><div class="field"><label for="notify_whatsapp">WhatsApp receptor</label><input id="notify_whatsapp" name="notify_whatsapp" maxlength="30" value="<?=h($s['notify_whatsapp'])?>" placeholder="+52..."></div></section>
<section class="panel"><h2>4. Reglas generales de socios</h2><p class="muted">Preferencias para nuevas altas; no cambian permisos actuales.</p>
<label class="check"><input type="checkbox" name="partner_registration_enabled" value="1" <?=$s['partner_registration_enabled']==='1'?'checked':''?>>Permitir nuevos registros de socios (preferencia)</label>
<label class="check"><input type="checkbox" name="partner_recruitment_default" value="1" <?=$s['partner_recruitment_default']==='1'?'checked':''?>>Permitir reclutamiento por defecto (preferencia)</label><span class="hint">El permiso individual actual está en partners.can_recruit. Hay que conectar estas opciones al alta de socios para que tengan efecto operativo.</span></section></div><p><button class="btn primary" type="submit">Guardar configuración</button></p></form>
<section class="panel"><h2>5. Estado técnico</h2><p class="muted">Versiones y estado de las tablas.</p><div class="grid"><div>PHP: <strong><?=h(PHP_VERSION)?></strong></div><div>Base de datos: <strong><?=h($db)?></strong></div><div>Zona horaria PHP: <strong><?=h(date_default_timezone_get())?></strong></div><div>Fecha servidor: <strong><?=h(date('Y-m-d H:i:s'))?></strong></div></div><div class="tablewrap"><table><thead><tr><th>Área</th><th>Tabla</th><th>Estado</th><th>Filas</th></tr></thead><tbody><?php foreach($rows as $r):?><tr><td><?=h($r[0])?></td><td><code><?=h($r[1])?></code></td><td class="<?=$r[2]?'ok':'warn'?>"><?=$r[2]?'Disponible':'No disponible'?></td><td><?=$r[3]===null?'—':number_format($r[3])?></td></tr><?php endforeach;?></tbody></table></div></section>
<p class="hint">Solo administradores. Los cambios se registran en audit_log. No se muestran credenciales.</p></main></body></html>
