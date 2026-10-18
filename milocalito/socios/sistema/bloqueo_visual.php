<?php
// Componente visual de bloqueo por inactividad. Incluir antes de </body> en páginas protegidas.
if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
if (!isset($_SESSION['user_id'], $_SESSION['user_role'])) { return; }
$__ml_visual_minutes = (int)($_SESSION['session_minutes'] ?? 10);
if (!in_array($__ml_visual_minutes, [1, 5, 10, 15, 30, 60], true)) { $__ml_visual_minutes = 10; }
?>
<div id="mlIdleOverlay" class="ml-idle-overlay" hidden role="alertdialog" aria-modal="true" aria-labelledby="mlIdleTitle" aria-describedby="mlIdleText">
  <section class="ml-idle-card">
    <div class="ml-idle-icon" aria-hidden="true">🔒</div>
    <h2 id="mlIdleTitle">Tu sesión se bloqueó</h2>
    <p id="mlIdleText">Detectamos inactividad durante demasiado tiempo para proteger tu cuenta. Vuelve a iniciar sesión para continuar.</p>
    <a class="ml-idle-button" href="login.php?expired=1">Volver a iniciar sesión</a>
    <p class="ml-idle-note">Mi Localito · Protección de sesión</p>
  </section>
</div>
<style>
.ml-idle-overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(3,8,4,.88);backdrop-filter:blur(7px);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f4fff6}
.ml-idle-overlay[hidden]{display:none!important}.ml-idle-card{width:min(100%,440px);padding:30px 24px;text-align:center;border:1px solid #285735;border-radius:20px;background:#0d1710;box-shadow:0 24px 80px #0009}.ml-idle-icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 18px;border-radius:50%;background:#173b21;font-size:28px}.ml-idle-card h2{margin:0 0 12px;font-size:clamp(23px,5vw,30px);line-height:1.2}.ml-idle-card p{color:#c2d4c6;line-height:1.6}.ml-idle-button{display:inline-flex;align-items:center;justify-content:center;margin-top:12px;padding:13px 18px;border-radius:10px;background:#19b943;color:#041007;text-decoration:none;font-weight:800}.ml-idle-button:focus-visible{outline:3px solid #fff;outline-offset:3px}.ml-idle-note{margin:20px 0 0!important;font-size:12px;color:#8da995!important}
</style>
<script>
(()=>{
  'use strict';
  const overlay=document.getElementById('mlIdleOverlay');
  if(!overlay) return;
  const timeoutMs=<?= (int)$__ml_visual_minutes ?>*60*1000;
  const endpoint='actividad_sesion.php';
  let lastActivity=Date.now(), timer=null, locked=false, heartbeatBusy=false;
  const lock=()=>{
    if(locked) return;
    locked=true;
    overlay.hidden=false;
    document.documentElement.style.overflow='hidden';
    // Invalida la sesión en el servidor al llegar al bloqueo visual.
    try{fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'action=expire'}).catch(()=>{});}catch(e){}
    const link=overlay.querySelector('a'); if(link) link.focus({preventScroll:true});
  };
  const schedule=()=>{if(timer) clearTimeout(timer);timer=setTimeout(lock,Math.max(0,timeoutMs-(Date.now()-lastActivity)));};
  const activity=()=>{if(locked)return;lastActivity=Date.now();schedule();};
  ['pointerdown','keydown','touchstart','scroll','click'].forEach(ev=>document.addEventListener(ev,activity,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!locked){if(Date.now()-lastActivity>=timeoutMs)lock();else schedule();}});
  // Mantiene sincronizada la sesión del servidor mientras la persona está usando la página.
  setInterval(async()=>{
    if(locked||document.hidden||Date.now()-lastActivity>90000||heartbeatBusy)return;
    heartbeatBusy=true;
    try{
      const response=await fetch(endpoint,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'action=heartbeat'});
      const type=response.headers.get('content-type')||'';
      if(!response.ok||!type.includes('application/json'))lock();
      else {const data=await response.json();if(!data.ok)lock();}
    }catch(e){/* Un fallo de red no desbloquea ni extiende el contador local. */}
    finally{heartbeatBusy=false;}
  },60000);
  schedule();
})();
</script>
<?php unset($__ml_visual_minutes); ?>
