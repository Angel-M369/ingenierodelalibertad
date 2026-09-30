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

  document.getElementById('topTrack').innerHTML += document.getElementById('topTrack').innerHTML;

  function playHero() {
    const bg = document.getElementById('heroBg');
    const t = document.getElementById('hTitle');
    const s1 = document.getElementById('hSub1');
    const s2 = document.getElementById('hSub2');
    const b = document.getElementById('hBtn');

    [bg, t, s1, s2, b].forEach(el => el && el.classList.remove('show'));

    setTimeout(() => bg && bg.classList.add('show'), 100);
    setTimeout(() => t && t.classList.add('show'), 800);
    setTimeout(() => s1 && s1.classList.add('show'), 1600);
    setTimeout(() => s2 && s2.classList.add('show'), 2400);
    setTimeout(() => b && b.classList.add('show'), 3100);
  }

  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) playHero(); });
  }, { threshold: 0.3 });

  obs.observe(document.getElementById('inicio'));
  playHero();

  const precios = {
    suadero: { taco: 22, orden: 105, kilo: 484, img: '../../../images/taco1.jpeg' },
    chorizo: { taco: 22, orden: 105, kilo: 484, img: '../../../images/taco2.jpeg' },
    bistec: { taco: 22, orden: 105, kilo: 484, img: '../../../images/taco3.jpeg' },
    adobada: { taco: 22, orden: 105, kilo: 484, img: '../../../images/taco4.jpeg' },
    campechanos: { taco: 25, orden: 120, kilo: 550, img: '../../../images/taco5.jpeg' }
  };

  let cart = [];
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  Object.keys(precios).forEach(id => {
    const p = precios[id];
    grid.innerHTML += `
      <div class="item">
        <div class="item-head">
          <div class="item-title">
            <img src="${p.img}" alt="${id}" onerror="this.src='https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=200'">
            <h3><span>${id.toUpperCase()}</span></h3>
          </div>
          <b>$${p.taco}</b>
        </div>
        <div class="opts">
          <button class="btn-uniform" onclick="add('${id}','taco')">🌮 TACO<small>$${p.taco}</small></button>
          <button class="btn-uniform" onclick="add('${id}','orden')">🔥 ORDEN 5<small>$${p.orden}</small></button>
          <button class="btn-uniform" onclick="add('${id}','kilo')">⚖️ KILO<small>$${p.kilo}</small></button>
        </div>
      </div>`;
  });

  window.add = (id, mode) => {
    const p = precios[id];
    let price = mode === 'taco'? p.taco : mode === 'orden'? p.orden : p.kilo;
    cart.push({ key: Date.now(), label: `${id.toUpperCase()} ${mode.toUpperCase()}`, price });
    render();
  };

  window.removeItem = (k) => {
    cart = cart.filter(c => c.key!== k);
    render();
  };

  window.clearCart = () => {
    cart = [];
    render();
  };

  function render() {
    let list = document.getElementById('cartList');
    list.innerHTML = '';
    let tot = 0;
    cart.forEach(c => {
      tot += c.price;
      list.innerHTML += `<li><span>${c.label} - $${c.price}</span><button class="del" onclick="removeItem(${c.key})">×</button></li>`;
    });
    if (!cart.length) list.innerHTML = '<li>Vacío</li>';
    document.getElementById('total').innerText = 'Total: $' + tot;
  }

  document.getElementById('pickup').addEventListener('change', () => {
    document.getElementById('dirBox').style.display = 'none';
  });

  document.getElementById('envio').addEventListener('change', () => {
    document.getElementById('dirBox').style.display = 'block';
  });

  let hSel = document.getElementById('hora');
  for (let h = 7; h <= 11; h++) {
    hSel.innerHTML += `<option>${h}:00 PM</option><option>${h}:30 PM</option>`;
  }

  window.pagar = () => {
    if (!cart.length) return alert('Agrega tacos');
    let n = document.getElementById('nombre').value || 'Cliente';
    let dir = document.getElementById('envio').checked? document.getElementById('direccion').value : 'Paso por Av. San Miguel #911';
    let h = document.getElementById('hora').value;
    let tot = document.getElementById('total').innerText;
    let det = cart.map(c => `${c.label} ($${c.price})`).join(', ');
    let msg = `Hola Karina! Soy ${n}%0A%0APedido: ${det}%0A${tot}%0A%0AEntrega: ${dir}%0AHora: ${h}%0ADirección local: Av. San Miguel #911 Afuera de abarrotes Tolentino%0A%0A*Tacos con papa, frijol, cebolla guisada y chile guisado*`;
    window.open(`https://wa.me/523121931212?text=${msg}`, '_blank');
  };

  window.mandarUbi = () => {
    window.open(`https://wa.me/523121931212?text=Te comparto mi ubicación para el pedido de Tacos El Cotorreo`, '_blank');
  };

  window.agendarEvento = () => {
    let t = document.getElementById('evTipo').value;
    let p = document.getElementById('evPersonas').value;
    let f = document.getElementById('evFecha').value;
    let n = document.getElementById('evNombre').value;
    window.open(`https://wa.me/523121931212?text=Hola! Quiero cotizar evento ${t} para ${p} personas el ${f}. Soy ${n}.`, '_blank');
  };
});