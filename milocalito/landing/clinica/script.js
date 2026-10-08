const horaEl=document.getElementById('hora');
if(horaEl)horaEl.textContent=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});

const toggle=document.getElementById('imp-menu-toggle');
const nav=document.querySelector('.imp-nav');
const overlay=document.querySelector('.imp-overlay');
function cerrarMenu(){if(toggle)toggle.checked=false;document.body.style.overflow='';}
if(toggle&&nav){
  document.querySelectorAll('.imp-nav a').forEach(a=>a.addEventListener('click',cerrarMenu));
  overlay?.addEventListener('click',cerrarMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarMenu();});
  toggle.addEventListener('change',()=>{document.body.style.overflow=toggle.checked?'hidden':'';});
}

// MODAL DEMO
const modal = document.getElementById("demoModal");
const modalTxt = document.getElementById("demoTexto");
function openDemo(html){
  if(modalTxt) modalTxt.innerHTML = html;
  modal?.classList.add("active");
}
function closeDemo(){ modal?.classList.remove("active"); }
document.getElementById("demoClose")?.addEventListener("click", closeDemo);
document.getElementById("demoEntendido")?.addEventListener("click", closeDemo);
modal?.addEventListener("click", e=>{ if(e.target===modal) closeDemo(); });

const btn=document.querySelector('.imp-btn-cotizar');
if(btn){
  btn.addEventListener('click',()=>{
    const inputs=document.querySelectorAll('.imp-coti-inputs input');
    const nombre=inputs[0]?.value.trim()||'';const caso=inputs[1]?.value.trim()||'';const wa=inputs[2]?.value.trim()||'';
    if(!nombre||!wa){
      openDemo("Pon tu nombre y WhatsApp<br><br>Demo: Dra. Aldazaba · Manzanillo<br>Valoración GRATIS");
      return;
    }

    openDemo(
      `🔒 MODO DEMO - DIENTES SANOS<br><br>`+
      `<b>Paciente:</b> ${nombre}<br>`+
      `<b>Necesidad:</b> ${caso || 'No especificada'}<br>`+
      `<b>WA:</b> ${wa}<br><br>`+
      `En la tienda real aquí se abriría WhatsApp de Dra. Aldazaba:<br>`+
      `"Hola Dra. Soy ${nombre} de Manzanillo. Necesito: ${caso}"<br><br>`+
      `🦷 Cita HOY - Valoración Gratis<br>`+
      `WhatsApp bloqueado en demo.`
    );

    // limpiamos inputs en demo
    inputs.forEach(i=> i.value="");
  });
}

// Todos los botones WA en demo
document.querySelectorAll(".imp-float-btn,.imp-social.wa,.btn-demo").forEach(b=>{
  b.addEventListener("click", (e)=>{
    e.preventDefault();
    openDemo(`🦷 <b>DRA. ALDAZABA - MANZANILLO</b><br><br>Valoración GRATIS por WA<br><br>En la tienda real aquí se abriría WhatsApp 314 123 4567<br><br>En esta <b>DEMO</b> está bloqueado para no spamear.<br><br>📍 Av. Manzanillo 123, Centro`);
  });
});