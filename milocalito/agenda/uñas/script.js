document.addEventListener('DOMContentLoaded', () => {
  // Cerrar menú
  document.querySelectorAll('.yare-nav a').forEach(link => {
    link.addEventListener('click', () => { 
      const t = document.getElementById('yare-menu-toggle');
      if(t) t.checked = false; 
    });
  });

  // ===== COTIZADOR DOÑA YARE - LÓGICA REAL =====
  const checks = document.querySelectorAll('.coti-check');
  const totalEl = document.getElementById('coti-total');
  const btnCoti = document.getElementById('coti-btn');
  const btnAnticipo = document.getElementById('btn-anticipo-demo');
  const inputNombre = document.getElementById('coti-nombre');
  const inputFecha = document.getElementById('coti-fecha');
  const lugaresEl = document.getElementById('lugares');

  // FOMO lugares aleatorio
  if(lugaresEl){
    setInterval(()=> { lugaresEl.innerText = Math.floor(Math.random()*2)+1; }, 4000);
  }

  function actualizarCotizador(){
    let total = 0;
    let servicios = [];
    
    checks.forEach(ch => {
      const opt = ch.closest('.yare-coti-opt');
      if(ch.checked){
        total += parseInt(ch.dataset.price);
        servicios.push(ch.value);
        if(opt){
          opt.classList.add('active');
          const checkIcon = opt.querySelector('.yare-coti-check');
          if(checkIcon) checkIcon.style.opacity = '1';
        }
      } else {
        if(opt){
          opt.classList.remove('active');
          const checkIcon = opt.querySelector('.yare-coti-check');
          if(checkIcon) checkIcon.style.opacity = '0';
        }
      }
    });

    if(totalEl) totalEl.innerText = `$${total}`;
    
    if(servicios.length > 0){
      if(btnCoti){
        btnCoti.disabled = false;
        btnCoti.innerText = `Agendar ${servicios.length} servicio(s) - $${total} →`;
      }
      if(btnAnticipo) btnAnticipo.style.display = 'block';
    } else {
      if(btnCoti){
        btnCoti.disabled = true;
        btnCoti.innerText = 'Selecciona 1 servicio';
      }
      if(btnAnticipo) btnAnticipo.style.display = 'none';
    }

    return { total, servicios };
  }

  // Inicializar en 0
  checks.forEach(ch => {
    ch.checked = false;
    const opt = ch.closest('.yare-coti-opt');
    if(opt){
      opt.classList.remove('active');
      const checkIcon = opt.querySelector('.yare-coti-check');
      if(checkIcon) checkIcon.style.opacity = '0';
    }
    ch.addEventListener('change', () => {
      const data = actualizarCotizador();
      if(typeof gtag!== 'undefined' && ch.checked){
        gtag('event', 'select_service_agenda', {
          'sistema': 'agenda',
          'servicio': ch.value,
          'price': ch.dataset.price
        });
      }
    });
  });

  actualizarCotizador();

  // Click AGENDAR
  if(btnCoti){
    btnCoti.addEventListener('click', () => {
      const { total, servicios } = actualizarCotizador();
      if(servicios.length === 0) return;

      const nombre = inputNombre?.value || 'Hola';
      const fecha = inputFecha?.value || 'fecha por definir';
      
      let msg = `Hola Yare! 💅 Quiero agendar:%0A%0A`;
      servicios.forEach(s => msg += `• ${s}%0A`);
      msg += `%0ATotal: $${total}%0AFecha: ${fecha}%0AMi nombre: ${nombre}%0A%0A¿Me apartas lugar?`;

      // MEDICIÓN MAESTRA
      if(typeof gtag!== 'undefined'){
        gtag('event', 'click_whatsapp', {
          'sistema': 'agenda',
          'servicio': servicios.join(', '),
          'value': total,
          'currency': 'MXN'
        });
        gtag('event', 'cita_intent_agenda', {
          'servicios': servicios.length,
          'value': total
        });
        gtag('event', 'begin_checkout', {
          'sistema': 'agenda',
          'value': total,
          'currency': 'MXN'
        });
      }

      window.open(`https://wa.me/529613706663?text=${msg}`, '_blank');
    });
  }

  // MEDICIÓN WA general
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    if(btn.id !== 'coti-btn'){
      btn.addEventListener('click', () => {
        if(typeof gtag!== 'undefined'){
          gtag('event', 'click_whatsapp', {
            'sistema': 'agenda',
            'ubicacion': 'float/header'
          });
        }
      });
    }
  });

  // Fix hora
  const horaEl = document.getElementById('hora');
  if(horaEl){
    const now = new Date();
    horaEl.textContent = now.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  }
});