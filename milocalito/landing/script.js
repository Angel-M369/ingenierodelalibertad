document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('imp-menu-toggle');
  document.querySelectorAll('.imp-nav a').forEach(link => {
    link.addEventListener('click', () => { if(toggle) toggle.checked = false; });
  });
  const horaEl = document.getElementById('hora');
  if(horaEl){ 
    const now = new Date(); 
    horaEl.textContent = now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}); 
  }

  // MEDICIÓN GENERAL WA EN ESTA DEMO
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    if(btn.id !== 'coti-btn'){
      btn.addEventListener('click', () => {
        if(typeof gtag!== 'undefined'){
          gtag('event', 'click_whatsapp', {
            'sistema': 'landing',
            'ubicacion': 'link_general'
          });
          gtag('event', 'lead_landing', {
            'sistema': 'landing'
          });
        }
      });
    }
  });

  const btn = document.getElementById('coti-btn');
  if(btn){
    btn.addEventListener('click', () => {
      const nombre = document.getElementById('coti-nombre')?.value || 'Hola';
      const caso = document.getElementById('coti-negocio')?.value || 'mi caso';
      const wa = document.getElementById('coti-presupuesto')?.value || '';
      const msg = `Lic. Murillo, soy ${nombre}. Mi caso es: ${caso}. Mi WA: ${wa}. Necesito asesoría en Puebla.`;

      // MEDICIÓN MAESTRA - CONVERSIÓN DE ESTA DEMO
      if(typeof gtag!== 'undefined'){
        gtag('event', 'click_whatsapp', {
          'sistema': 'landing',
          'caso': caso,
          'ubicacion': 'formulario_cotizador'
        });
        gtag('event', 'form_submit_landing', {
          'sistema': 'landing',
          'caso_tipo': caso
        });
        gtag('event', 'lead_landing', {
          'value': 1
        });
      }

      window.open(`https://wa.me/522221234567?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // MEDIR CLICS A PAGO REAL DESDE ESTA DEMO
  document.querySelectorAll('a[href*="mpago.la"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(typeof gtag!== 'undefined'){
        gtag('event', 'click_pago', {
          'sistema': 'landing_origen',
          'plan': 'LANDING $3,999',
          'value': 3999,
          'currency': 'MXN'
        });
      }
    });
  });
});