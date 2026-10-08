document.addEventListener('DOMContentLoaded', () => {
  const ham = document.getElementById('ham');
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');

  const closeMenu = () => {
    menu.classList.remove('active');
    overlay.classList.remove('active');
  };
  const openMenu = () => {
    menu.classList.add('active');
    overlay.classList.add('active');
  };

  ham.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.contains('active')? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  const heroImages = [
    'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=1200',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1200',
    'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=1200'
  ];
  let heroIndex = 0;

  function playHero() {
    const bg = document.getElementById('heroBg');
    const img = document.getElementById('heroImg');
    const t = document.getElementById('hTitle');
    const s1 = document.getElementById('hSub1');
    const s2 = document.getElementById('hSub2');
    const b = document.getElementById('hBtn');

    [bg, t, s1, s2, b].forEach(el => el && el.classList.remove('show'));
    if(img) img.src = heroImages[heroIndex];

    setTimeout(() => bg && bg.classList.add('show'), 100);
    setTimeout(() => t && t.classList.add('show'), 600);
    setTimeout(() => s1 && s1.classList.add('show'), 1200);
    setTimeout(() => s2 && s2.classList.add('show'), 1800);
    setTimeout(() => b && b.classList.add('show'), 2300);

    heroIndex = (heroIndex + 1) % heroImages.length;
  }

  playHero();
  setInterval(playHero, 5000);

  // CARRUSEL INFINITO REAL - duplicar
  const track = document.getElementById('track');
  if(track) track.innerHTML += track.innerHTML;

  // AGENDA QUE SUMA
  let cart = [];

  window.addService = (name, price) => {
    cart.push({ key: Date.now(), name, price });
    renderCart();
    document.getElementById('atiende').scrollIntoView({ behavior: 'smooth' });
  };

  window.removeService = (key) => {
    cart = cart.filter(c => c.key!== key);
    renderCart();
  };

  window.clearCart = () => {
    cart = [];
    renderCart();
  };

  function renderCart() {
    const list = document.getElementById('cartList');
    const totalEl = document.getElementById('total');
    const countEl = document.getElementById('count');
    let total = 0;

    list.innerHTML = '';
    cart.forEach(item => {
      total += item.price;
      list.innerHTML += `<li><span>${item.name} - $${item.price}</span><button onclick="removeService(${item.key})" style="background:#000;color:#fff;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;">×</button></li>`;
    });

    if (!cart.length) {
      list.innerHTML = '<li>Elige del carrusel de arriba</li>';
    }

    if(totalEl) totalEl.innerText = `Total: $${total}`;
    if(countEl) countEl.innerText = `${cart.length} servicios`;
  }

  // ===== MODO DEMO - NO MANDA WHATSAPP =====
  const modal = document.getElementById('demoModal');
  const demoTexto = document.getElementById('demoTexto');
  const btnClose = document.getElementById('demoClose');
  const btnEntendido = document.getElementById('demoEntendido');
  const btnConfirmar = document.getElementById('btnConfirmar');

  function abrirDemo(html){
    demoTexto.innerHTML = html;
    modal.classList.add('active');
  }
  function cerrarDemo(){
    modal.classList.remove('active');
  }

  window.cerrarDemo = cerrarDemo;

  if(btnClose) btnClose.addEventListener('click', cerrarDemo);
  if(btnEntendido) btnEntendido.addEventListener('click', cerrarDemo);
  if(modal) modal.addEventListener('click', (e)=>{
    if(e.target === modal) cerrarDemo();
  });

  // Esta es la función que ahora usa tu botón CONFIRMAR
  window.confirmarReserva = () => {
    if (!cart.length) return alert('Elige al menos un servicio del carrusel');

    const nombre = document.getElementById('nombre').value.trim();
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const direccion = document.getElementById('direccion').value.trim();

    if(!nombre ||!fecha ||!hora){
      return alert('Por favor llena nombre, fecha y hora');
    }

    let total = cart.reduce((a,b) => a + b.price, 0);
    let serviciosHtml = cart.map(c => `• ${c.name} ($${c.price})`).join('<br>');

    const html = `
      <b>Cliente:</b> ${nombre}<br>
      <b>Fecha:</b> ${fecha}<br>
      <b>Hora:</b> ${hora}<br>
      ${direccion? `<b>Dirección:</b> ${direccion}<br>` : `<b>Modalidad:</b> En estudio - C. Jalisco 50a<br>`}
      <br>
      <b>Servicios:</b><br>${serviciosHtml}<br><br>
      <b>Total: $${total}</b>
    `;

    abrirDemo(html);
  };

  if(btnConfirmar){
    btnConfirmar.addEventListener('click', window.confirmarReserva);
  }

  // Intercepta todos los botones de WhatsApp de la demo
  document.querySelectorAll('.btn-demo').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      abrirDemo(`En la versión real, este botón abriría WhatsApp.`);
    });
  });
});