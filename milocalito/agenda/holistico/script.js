document.addEventListener('DOMContentLoaded', () => {
  // ========== 1. FOMO ==========
  const horaEl = document.getElementById('holistico-hora');
  const lugaresEl = document.getElementById('holistico-lugares');
  if(horaEl){
    const now = new Date();
    horaEl.textContent = now.toLocaleTimeString('es-MX', {hour:'numeric', minute:'2-digit'});
  }
  if(lugaresEl){
    lugaresEl.textContent = Math.floor(Math.random()*2)+2;
  }

  // ========== 2. MENU 50VH - CIERRE DENTRO Y FUERA + FIX SCROLL HORIZONTAL ==========
  const menuToggle = document.getElementById('holistico-menu-toggle');
  const nav = document.querySelector('.holistico-nav');
  const overlay = document.querySelector('.holistico-overlay');
  const burger = document.querySelector('.holistico-burger');

  function lockScroll(lock){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    if(lock){
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  function closeMenu(){
    if(menuToggle){ menuToggle.checked = false; }
    lockScroll(false);
  }

  function isMenuOpen(){
    return menuToggle && menuToggle.checked;
  }

  if(menuToggle){
    menuToggle.addEventListener('change', () => {
      lockScroll(isMenuOpen());
    });
  }

  if(nav){
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
    nav.addEventListener('click', (e) => {
      if(e.target === nav) closeMenu();
    });
  }

  if(overlay){
    overlay.addEventListener('click', closeMenu);
  }

  document.addEventListener('click', (e) => {
    if(!isMenuOpen()) return;
    const header = document.querySelector('.holistico-header');
    const isClickInsideHeader = header && header.contains(e.target);
    const isClickOnBurger = burger && burger.contains(e.target);
    if(!isClickInsideHeader &&!isClickOnBurger){
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && isMenuOpen()){
      closeMenu();
    }
  });

  // ========== 3. CARRUSEL GIRATORIO AUTOMATICO 5 CARDS HEADER ==========
  const carruselTrack = document.querySelector('.holistico-carrusel-track');
  if(carruselTrack){
    carruselTrack.addEventListener('touchstart', () => {
      carruselTrack.style.animationPlayState = 'paused';
    });
    carruselTrack.addEventListener('touchend', () => {
      carruselTrack.style.animationPlayState = 'running';
    });
  }

  const oldTrack = document.querySelector('.holistico-track');
  if(oldTrack && oldTrack.children.length >= 5){
    let index = 0;
    setInterval(() => {
      index = (index + 1) % oldTrack.children.length;
      oldTrack.children[index].scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    }, 3000);
  }

  // ========== 4. COTIZADOR 9 TERAPIAS ==========
  const checks = document.querySelectorAll('.coti-check');
  const totalEl = document.getElementById('holistico-total');
  const btn = document.getElementById('holistico-btn');
  const btnAnticipo = document.getElementById('holistico-btn-anticipo');
  const nombreInput = document.getElementById('coti-nombre');
  const fechaInput = document.getElementById('coti-fecha');

  function updateCotizador(){
    let total = 0;
    let servicios = [];
    checks.forEach(ch => {
      if(ch.checked){
        total += parseInt(ch.dataset.price);
        servicios.push(ch.value);
      }
    });
    if(totalEl){ totalEl.textContent = `$${total}`; }
    if(total > 0){
      if(btn){
        btn.disabled = false;
        btn.textContent = `Agendar ${servicios.join(' + ')} - $${total}`;
      }
      if(btnAnticipo){ btnAnticipo.style.display = 'block'; }
    } else {
      if(btn){
        btn.disabled = true;
        btn.textContent = 'Selecciona tu terapia';
      }
      if(btnAnticipo){ btnAnticipo.style.display = 'none'; }
    }
  }

  checks.forEach(ch => ch.addEventListener('change', updateCotizador));
  updateCotizador();

  if(btn){
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      const nombre = nombreInput && nombreInput.value? nombreInput.value : 'Hola';
      const fecha = fechaInput && fechaInput.value? fechaInput.value : 'fecha por definir';
      let total = 0;
      let servicios = [];
      checks.forEach(ch => { if(ch.checked){ total+=parseInt(ch.dataset.price); servicios.push(ch.value); } });
      const msg = `Hola Carmen, soy ${nombre}. Quiero agendar: ${servicios.join(' + ')} para el ${fecha}. Total: $${total}. ¿Me apartas lugar? Gracias.`;
      window.open(`https://wa.me/524776936338?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  if(btnAnticipo){
    btnAnticipo.addEventListener('click', () => {
      let total = 0;
      checks.forEach(ch => { if(ch.checked) total+=parseInt(ch.dataset.price); });
      const anticipo = Math.round(total * 0.3);
      alert(`🔒 MODO DEMO GIRO HOLISTICO\n\nEn la versión real aquí se cobraría un ANTICIPO de $${anticipo} (30%) con tarjeta para asegurar tu cita en Loma de Eucalipto 160-C.\n\nSi no paga, no se agenda.\n\nDemo sin cobros reales.`);
    });
  }

  // ========== 5. FLOAT WHATSAPP SIEMPRE VISIBLE - NO TAPA COPY ==========
  const floatBtn = document.querySelector('.holistico-float');
  if(floatBtn){
    // Quita cualquier oculto que haya quedado de versiones anteriores
    floatBtn.classList.remove('holistico-float-hidden');
    floatBtn.style.opacity = '1';
    floatBtn.style.visibility = 'visible';
    floatBtn.style.pointerEvents = 'auto';
    floatBtn.style.transform = 'none';
  }
});