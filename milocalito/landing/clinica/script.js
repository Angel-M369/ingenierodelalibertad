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
const btn=document.querySelector('.imp-btn-cotizar');
if(btn){
  btn.addEventListener('click',()=>{
    const inputs=document.querySelectorAll('.imp-coti-inputs input');
    const nombre=inputs[0]?.value.trim()||'';const caso=inputs[1]?.value.trim()||'';const wa=inputs[2]?.value.trim()||'';
    if(!nombre||!wa){alert('Pon tu nombre y WhatsApp');return;}
    const msg=`Hola Dra. Aldazaba! Soy ${nombre} de Manzanillo. Necesito: ${caso}. Mi WA: ${wa}. Quiero mi valoracion gratis.`;
    window.open(`https://wa.me/523141234567?text=${encodeURIComponent(msg)}`,'_blank');
  });
}