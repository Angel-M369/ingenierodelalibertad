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
    img.src = heroImages[heroIndex];

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
  track.innerHTML += track.innerHTML;

  // AGENDA QUE SUMA
  let cart = [];
  
  window.addService = (name, price) => {
    cart.push({ key: Date.now(), name, price });
    renderCart();
    document.getElementById('atiende').scrollIntoView({ behavior: 'smooth' });
  };

  window.removeService = (key) => {
    cart = cart.filter(c => c.key !== key);
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

    totalEl.innerText = `Total: $${total}`;
    countEl.innerText = `${cart.length} servicios`;
  }

  window.confirmarReserva = () => {
    if (!cart.length) return alert('Elige al menos un servicio del carrusel');
    
    const nombre = document.getElementById('nombre').value || 'Clienta';
    const fecha = document.getElementById('fecha').value || 'por confirmar';
    const hora = document.getElementById('hora').value || 'por confirmar';
    const direccion = document.getElementById('direccion').value || 'En estudio - C. Jalisco 50a';
    
    let total = cart.reduce((a,b) => a + b.price, 0);
    let servicios = cart.map(c => `${c.name} ($${c.price})`).join(', ');

    // WhatsApp a Dalila
    const msgDalila = `Hola Dalila! 💖%0A%0ASoy ${nombre}%0AServicios: ${servicios}%0ATotal: $${total}%0AFecha: ${fecha}%0AHora: ${hora}%0ADirección: ${direccion}%0A%0AStudioD - Nude Premium`;
    window.open(`https://wa.me/523317995988?text=${msgDalila}`, '_blank');

    // Mensaje para clienta (segundo WA con timeout)
    setTimeout(() => {
      const msgClienta = `Hola ${nombre}! Tu reservación está confirmada para ${fecha} a las ${hora}.%0A%0AServicios: ${servicios}%0ATotal: $${total}%0A%0ANos vemos pronto!!!%0AStudioD - C. Jalisco 50a, Tlaquepaque%0A33 1799 5988`;
      // Copiamos al portapapeles para que la clienta lo vea
      alert(`✅ Reserva lista para Dalila\n\nMensaje para la clienta:\n\n${decodeURIComponent(msgClienta).replace(/%0A/g,'\n')}`);
    }, 800);
  };
});