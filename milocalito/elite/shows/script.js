// BARBY RUSA - V5 ELITE DUEÑO TOTAL $9,999 + MEDICIÓN G-0S14JTTS9D
function actualizarHoras(){
  const hora = new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  document.querySelectorAll('.hora-txt').forEach(el=>{el.textContent = hora;});
}
actualizarHoras();
setInterval(actualizarHoras, 60000);

const LINK_PAGO = "https://mpago.la/TU-LINK-AQUI";
const pagoLink = document.getElementById('rusa-pago-link');
if(pagoLink){ 
  pagoLink.href = LINK_PAGO;
  pagoLink.addEventListener('click', ()=>{
    if(typeof gtag!== 'undefined'){
      gtag('event', 'click_pago', {
        'sistema': 'elite',
        'plan': 'DUEÑO TOTAL $9,999',
        'value': 9999,
        'currency': 'MXN'
      });
    }
  });
}

const eventoSelect = document.getElementById('rusa-evento');
const porcentajeTxt = document.getElementById('rusa-porcentaje');
const totalTxt = document.getElementById('rusa-total-txt');

if(eventoSelect){
  eventoSelect.addEventListener('change',()=>{
    const val = eventoSelect.value;
    if(val){
      porcentajeTxt.textContent = val + '%';
      totalTxt.textContent = val + '% + viáticos';
      if(typeof gtag!== 'undefined'){
        gtag('event', 'select_event_elite', {
          'evento': eventoSelect.options[eventoSelect.selectedIndex].text,
          'anticipo': val,
          'sistema': 'elite'
        });
      }
    } else {
      porcentajeTxt.textContent = '10%';
      totalTxt.textContent = '10% + viáticos';
    }
  });
}

const btnApartar = document.getElementById('rusa-btn');
if(btnApartar){
  btnApartar.addEventListener('click',()=>{
    const nombre = document.getElementById('rusa-nombre')?.value.trim();
    const ciudad = document.getElementById('rusa-ciudad')?.value;
    const eventoOpt = eventoSelect?.options[eventoSelect.selectedIndex];
    const evento = eventoOpt ? eventoOpt.text : '';
    const eventoVal = eventoSelect?.value || '10';
    const anexo = document.getElementById('rusa-anexo')?.value || 'No especificado';
    const fecha = document.getElementById('rusa-fecha')?.value;
    const wa = document.getElementById('rusa-wa')?.value.trim();

    if(fecha){
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const fechaSel = new Date(fecha+'T00:00:00');
      if(fechaSel < hoy){
        alert("Esa fecha ya pasó, elige una futura");
        return;
      }
    }

    if(!nombre || !ciudad || !eventoSelect.value || !fecha || !wa){
      alert("Completa todos los datos: Nombre, Ciudad, Evento, Fecha y WhatsApp");
      return;
    }

    if(typeof gtag!== 'undefined'){
      gtag('event', 'click_whatsapp', {
        'sistema': 'elite',
        'evento': evento,
        'ciudad': ciudad,
        'value': parseInt(eventoVal)*100,
        'currency': 'MXN'
      });
      gtag('event', 'form_submit_elite', {
        'sistema': 'elite',
        'evento_tipo': evento,
        'anticipo': eventoVal
      });
      gtag('event', 'begin_checkout', {
        'sistema': 'elite',
        'value': 9999,
        'currency': 'MXN',
        'items': [{ 'item_name': 'DUEÑO TOTAL - '+evento }]
      });
    }

    const mensaje = `Hola Barby Rusa! 🔥%0AQuiero apartar fecha%0A%0A👤 Nombre: ${nombre}%0A📍 Ciudad: ${ciudad}%0A🎉 Evento: ${evento}%0A✨ Anexo: ${anexo}%0A📅 Fecha: ${fecha}%0A📱 Mi WA: ${wa}%0A%0AAnticipo: ${eventoVal}% + viáticos%0A¿Me cotizas el total?`;
    const NUMERO_BARBY = "526641234567";
    window.open(`https://wa.me/${NUMERO_BARBY}?text=${mensaje}`,'_blank');
    setTimeout(()=>{
      if(!LINK_PAGO.includes("TU-LINK")){
        window.open(LINK_PAGO,'_blank');
      }
    }, 800);
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', function(e){
    const id = this.getAttribute('href');
    if(id.length>1){
      const t = document.querySelector(id);
      if(t){ 
        e.preventDefault(); 
        t.scrollIntoView({behavior:'smooth'}); 
        const toggle = document.getElementById('rusa-menu-toggle');
        if(toggle) toggle.checked = false;
        if(typeof gtag!== 'undefined'){
          gtag('event', 'nav_click_elite', {
            'seccion': id
          });
        }
      }
    }
  });
});

document.querySelectorAll('a[href*="wa.me"]').forEach(btn=>{
  if(btn.id !== 'rusa-btn' && btn.id !== 'rusa-pago-link'){
    btn.addEventListener('click', ()=>{
      if(typeof gtag!== 'undefined'){
        gtag('event', 'click_whatsapp', {
          'sistema': 'elite',
          'ubicacion': 'general'
        });
      }
    });
  }
});