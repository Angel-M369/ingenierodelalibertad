const WA = "5213312345678";
let cart = JSON.parse(localStorage.getItem("chinoCart") || "[]");
let angle = 0;
let autoRotate = true;

const menu = document.getElementById("chinoMenu");
const drawer = document.getElementById("chinoDrawer");
const carousel = document.getElementById("carousel");
const wrap = document.getElementById("carouselWrap");
const items = document.querySelectorAll(".chino-car-item");
const n = items.length;

function layoutCarousel() {
  const radius = window.innerWidth < 768? 250 : 380;
  items.forEach((el, i) => {
    const theta = (360 / n) * i;
    el.style.transform = `rotateY(${theta}deg) translateZ(${radius}px)`;
  });
}
if (n > 0) {
  layoutCarousel();
  window.addEventListener("resize", layoutCarousel);
}

function rotateCar() {
  if (!autoRotate ||!carousel) return;
  angle -= 0.4;
  carousel.style.transform = `rotateY(${angle}deg)`;
}
setInterval(rotateCar, 16);

if (wrap) {
  wrap.addEventListener("mouseenter", () => (autoRotate = false));
  wrap.addEventListener("mouseleave", () => (autoRotate = true));
  wrap.addEventListener("touchstart", () => (autoRotate = false), { passive: true });
  wrap.addEventListener("touchend", () => setTimeout(() => (autoRotate = true), 1500));
}

// MENU Y CARRITO - YA CIERRA AL CLICK DENTRO Y FUERA
document.getElementById("openMenu").onclick = (e) => {
  e.stopPropagation();
  menu.classList.toggle("open");
  drawer.classList.remove("open");
};

document.getElementById("openCart").onclick = (e) => {
  e.stopPropagation();
  drawer.classList.add("open");
  menu.classList.remove("open");
  render();
};

document.getElementById("closeCart")?.addEventListener("click", () => drawer.classList.remove("open"));
document.getElementById("drawerBg")?.addEventListener("click", () => drawer.classList.remove("open"));

// Cierra menú al dar click en cualquier link del menú
document.querySelectorAll('.chino-menu a').forEach(a => {
  a.addEventListener('click', () => menu.classList.remove('open'));
});

// Cierra al click fuera
document.addEventListener("click", (e) => {
  if (menu &&!menu.contains(e.target) &&!e.target.closest("#openMenu")) {
    menu.classList.remove("open");
  }
  const panel = drawer? drawer.querySelector(".chino-drawer-panel") : null;
  if (panel &&!panel.contains(e.target) &&!e.target.closest("#openCart")) {
    drawer.classList.remove("open");
  }
});

function save() {
  localStorage.setItem("chinoCart", JSON.stringify(cart));
}

function render() {
  const list = document.getElementById("chinoCartList");
  const totalEl = document.getElementById("chinoTotal");
  const countEl = document.getElementById("chinoCount");
  const countText = document.getElementById("chinoCountText");
  let total = 0;
  const qty = cart.reduce((s, i) => s + i.q, 0);

  if (countEl) countEl.textContent = qty;
  if (countText) countText.textContent = `${qty} producto${qty!== 1? 's' : ''}`;
  if (!list ||!totalEl) return;

  if (!cart.length) {
    list.innerHTML = `<div style="color:#64748B;text-align:center;padding:20px 0">Vacío - agrega pacas pa' que veas la magia</div>`;
    totalEl.textContent = "0";
    return;
  }

  list.innerHTML = cart.map((it, i) => {
    total += it.p * it.q;
    return `<div class="chino-cart-item"><span>${it.n} x${it.q} - $${(it.p * it.q).toLocaleString("es-MX")}</span><span><button onclick="chg(${i},-1)">-</button> <button onclick="chg(${i},1)">+</button> <button onclick="del(${i})">x</button></span></div>`;
  }).join("");

  totalEl.textContent = total.toLocaleString("es-MX");
}

window.chg = (i, d) => {
  cart[i].q += d;
  if (cart[i].q <= 0) cart.splice(i, 1);
  save(); render();
};
window.del = (i) => {
  cart.splice(i, 1);
  save(); render();
};

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const name = b.dataset.add;
  const price = parseInt(b.dataset.price);
  const ex = cart.find((x) => x.n === name);
  if (ex) ex.q++;
  else cart.push({ n: name, p: price, q: 1 });
  save(); render();
  if (drawer) drawer.classList.add("open");
});

document.getElementById("btnClear")?.addEventListener("click", () => {
  cart = [];
  save(); render();
});

document.getElementById("btnPagar")?.addEventListener("click", () => {
  if (!cart.length) return alert("Vacío");
  const nombre = document.getElementById("chinoName").value || "Cliente";
  const payInput = document.querySelector('input[name="pay"]:checked');
  const pay = payInput? payInput.value : "Transferencia";
  let msg = `VENTA PACAS CHINO%0A${nombre}%0A`;
  let total = 0;
  cart.forEach((it) => {
    total += it.p * it.q;
    msg += `• ${it.n} x${it.q}%0A`;
  });
  msg += `Total $${total} con ${pay}`;
  window.open(`https://wa.me/${WA}?text=${msg}`, "_blank");
  cart = []; save(); render();
  drawer.classList.remove("open");
});

render();

// HERO LOOP INFINITO
const hero = document.querySelector(".chino-hero-impact");
const title = document.querySelector(".chino-hero-title");
const subs = document.querySelector(".chino-hero-subs");
const topText = document.querySelector(".chino-hero-side.top");
const bottomText = document.querySelector(".chino-hero-side.bottom");
const btn = document.querySelector(".chino-hero-btn");

function replayHero() {
  [title, subs, topText, bottomText, btn].forEach((el) => {
    if (!el) return;
    el.classList.remove("animate-title", "animate-sub", "animate-top", "animate-bottom", "animate-btn");
    void el.offsetWidth;
  });
  if (title) title.classList.add("animate-title");
  if (subs) subs.classList.add("animate-sub");
  if (topText) topText.classList.add("animate-top");
  if (bottomText) bottomText.classList.add("animate-bottom");
  if (btn) btn.classList.add("animate-btn");
}

if (hero) {
  replayHero();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) replayHero(); });
  }, { threshold: 0.5 });
  observer.observe(hero);
  document.querySelectorAll('.chino-menu a[href="#top"]').forEach((a) => {
    a.addEventListener("click", () => setTimeout(replayHero, 200));
  });
}

// BOTONES UBICACIÓN
const btnUbiWa = document.getElementById("btnUbiWa");
if (btnUbiWa) {
  btnUbiWa.onclick = (e) => {
    e.preventDefault();
    const msg = `Hola Chino! Mándame tu ubicación de la Bodega Oblatos porfa - Av. Belisario Dominguez 2640 GDL`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  };
}