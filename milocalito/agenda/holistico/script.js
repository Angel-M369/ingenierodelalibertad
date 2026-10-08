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

  // ========== 2. MENU 50VH ==========
  const menuToggle = document.getElementById('holistico-menu-toggle');
  const nav = document.querySelector('.holistico-nav');
  const overlay = document.querySelector('.holistico-overlay');
  const burger = document.querySelector('.holistico-burger');

  function lockScroll(lock){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.overflow = lock ? 'hidden' : '';
  }
  function closeMenu(){
    if(menuToggle) menuToggle.checked = false;
    lockScroll(false);
  }
  function isMenuOpen(){ return menuToggle && menuToggle.checked; }

  if(menuToggle){
    menuToggle.addEventListener('change', () => lockScroll(isMenuOpen()));
  }
  if(nav){
    nav.querySelectorAll('a').forEach(link => {
      if(!link.classList.contains('btn-demo')){
        link.addEventListener('click', closeMenu);
      }
    });
    nav.addEventListener('click', (e) => { if(e.target === nav) closeMenu(); });
  }
  if(overlay) overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && isMenuOpen()) closeMenu(); });

  // ========== 3. CARRUSEL ==========
  const carruselTrack = document.querySelector('.holistico-carrusel-track');
  if(carruselTrack){
    carruselTrack.addEventListener('touchstart', () => carruselTrack.style.animationPlayState = 'paused');
    carruselTrack.addEventListener('touchend', () => carruselTrack.style.animationPlayState = 'running');
  }

  // ========== 4. COTIZADOR + MODAL DEMO ==========
  const checks = document.querySelectorAll('.coti-check');
  const totalEl = document.getElementById('holistico-total');
  const btn = document.getElementById('holistico-btn');
  const nombreInput = document.getElementById('coti-nombre');
  const fechaInput = document.getElementById('coti-fecha');

  // Modal elements
  const modal = document.getElementById('demoModal');
  const demoTexto = document.getElementById('demoTexto');
  const closeBtn = document.getElementById('demoClose');
  const entendidoBtn = document.getElementById('demoEntendido');

  function abrirDemo(html){
    if(demoTexto) demoTexto.innerHTML = html;
    if(modal) modal.classList.add('active');
  }
  function cerrarDemo(){
    if(modal) modal.classList.remove('active');
  }
  window.cerrarDemo = cerrarDemo;
  closeBtn?.addEventListener('click', cerrarDemo);
  entendidoBtn?.addEventListener('click', cerrarDemo);
  modal?.addEventListener('click', (e)=>{ if(e.target===modal) cerrarDemo(); });

  function updateCotizador(){
    let total = 0;
    let servicios = [];
    checks.forEach(ch => {
      if(ch.checked){
        total += parseInt(ch.dataset.price);
        servicios.push(ch.value);
      }
    });
    if(totalEl) totalEl.textContent = `$${total}`;
    if(btn){
      if(total > 0){
        btn.disabled = false;
        btn.textContent = `Agendar ${servicios.join(' + ')} - $${total}`;
      } else {
        btn.disabled = true;
        btn.textContent = 'Selecciona tu terapia';
      }
    }
    return {total, servicios};
  }

  checks.forEach(ch => ch.addEventListener('change', updateCotizador));
  updateCotizador();

  // BOTON PRINCIPAL - YA NO ABRE WHATSAPP, ABRE MODAL
  if(btn){
    btn.addEventListener('click', () => {
      if(btn.disabled) return;
      const nombre = nombreInput?.value.trim();
      const fecha = fechaInput?.value;
      const {total, servicios} = updateCotizador();

      if(!nombre || !fecha) return alert('Por favor pon tu nombre y fecha *');
      if(!servicios.length) return alert('Elige al menos una terapia');

      const html = `
        <b>Cliente:</b> ${nombre}<br>
        <b>Fecha:</b> ${fecha}<br>
        <b>Terapias:</b><br>• ${servicios.join('<br>• ')}<br><br>
        <b>Total: $${total}</b><br>
        <b>Lugar:</b> Loma de Eucalipto 160-C, León Gto + a domicilio
      `;
      abrirDemo(html);
    });
  }

  // Intercepta todos los botones de WhatsApp de la demo
  document.querySelectorAll('.btn-demo').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      closeMenu();
      abrirDemo(`En la versión real, este botón abriría WhatsApp directo con Carmen.<br><br>En esta <b>DEMO</b> lo desactivamos para no molestarla.`);
    });
  });

  // ========== 5. FLOAT SIEMPRE VISIBLE ==========
  const floatBtn = document.querySelector('.holistico-float');
  if(floatBtn){
    floatBtn.style.opacity = '1';
    floatBtn.style.visibility = 'visible';
    floatBtn.style.pointerEvents = 'auto';
    floatBtn.style.transform = 'none';
  }
});