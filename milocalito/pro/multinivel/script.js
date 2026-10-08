// MODO DEMO - SIN WA REAL
let cart = [];
let total = 0;

const ysiNav = document.getElementById('ysiNav');
const ysiCartNav = document.getElementById('ysiCartNav');
const btnMenu = document.getElementById('btnMenu');
const btnCart = document.getElementById('btnCart');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const cartList = document.getElementById('cartList');
const btnCobrar = document.getElementById('btnCobrar');
const btnVaciar = document.getElementById('btnVaciar');
const closeCart = document.getElementById('closeCart');
const clientName = document.getElementById('clientName');

function toggleNav(){
  ysiNav.classList.toggle('open');
  ysiCartNav.classList.remove('open');
}
function toggleCart(){
  ysiCartNav.classList.toggle('open');
  ysiNav.classList.remove('open');
}
function closeAllMenus(){
  ysiNav.classList.remove('open');
  ysiCartNav.classList.remove('open');
}

btnMenu.addEventListener('click', (e)=>{ e.stopPropagation(); toggleNav(); });
btnCart.addEventListener('click', (e)=>{ e.stopPropagation(); toggleCart(); });
closeCart.addEventListener('click', closeAllMenus);

document.addEventListener('click', (e)=>{
  if(!ysiNav.contains(e.target) && !ysiCartNav.contains(e.target) && !btnMenu.contains(e.target) && !btnCart.contains(e.target)){
    closeAllMenus();
  }
});
document.querySelectorAll('.ysi-nav a').forEach(a=>{
  a.addEventListener('click', ()=> ysiNav.classList.remove('open'));
});

function renderCart(){
  cartCount.innerText = cart.length;
  cartTotal.innerText = total;
  if(cart.length === 0){
    cartList.innerHTML = "Vacío - agrega Terramar";
  } else {
    cartList.innerHTML = cart.map(c=>`• ${c.n} - $${c.p}`).join('<br>') + `<br><br><b>Total a cobrar: $${total}</b>`;
  }
}

function addProduct(name, price){
  cart.push({n:name, p:price});
  total += price;
  renderCart();
  if(cart.length === 1) ysiCartNav.classList.add('open');
}

document.querySelectorAll('.btn-add[data-name]').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const name = e.target.dataset.name;
    const price = parseInt(e.target.dataset.price);
    addProduct(name, price);
    const original = e.target.innerText;
    e.target.innerText = "✓ Agregado";
    setTimeout(()=> e.target.innerText = original, 1000);
  });
});

// MODAL DEMO LOGIC
const modal = document.getElementById("demoModal");
const modalTxt = document.getElementById("demoTexto");
function openDemo(html){
  if(!modal) return;
  if(modalTxt) modalTxt.innerHTML = html;
  modal.classList.add("active");
}
function closeDemo(){ modal?.classList.remove("active"); }
document.getElementById("demoClose")?.addEventListener("click", closeDemo);
document.getElementById("demoEntendido")?.addEventListener("click", closeDemo);
modal?.addEventListener("click", e=>{ if(e.target===modal) closeDemo(); });

btnVaciar.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(!cart.length){ openDemo("Carrito vacío - agrega un producto Terramar primero"); return; }
  if(confirm('¿Vaciar carrito?')){
    cart = []; total = 0; renderCart();
  }
});

btnCobrar.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(!cart.length){
    openDemo("Carrito vacío.<br><br>Agrega un producto Terramar primero.");
    return;
  }
  const nombre = clientName.value.trim() || "Cliente Demo";
  const metodo = document.querySelector('input[name="pay"]:checked')?.value || "Transferencia";
  const productos = cart.map(c=>c.n).join('<br>• ');
  const productosTxt = cart.map(c=>c.n).join(', ');

  openDemo(
    `🔒 MODO DEMO - YSI TERRAMAR<br><br>`+
    `<b>Cliente:</b> ${nombre}<br>`+
    `<b>Método:</b> ${metodo}<br><br>`+
    `• ${productos}<br><br>`+
    `<b>Total: $${total}</b><br><br>`+
    `En la tienda real aquí se cobraría con tarjeta/OXXO y se mandaría WhatsApp a Ysi:<br>`+
    `"¡VENTA PRO! ${nombre} pagó $${total} - ${productosTxt} - ${metodo}"<br><br>`+
    `No se cobró nada real.`
  );
  // NO vaciamos para que veas el demo
});

document.querySelectorAll(".btn-demo").forEach(b=>{
  b.addEventListener("click", (e)=>{
    e.preventDefault();
    const id = b.id;
    let msg = "";
    if(id==="btnWALlegar") msg = "En la tienda real aquí se abriría WhatsApp:<br>'Hola Ysi dime como llego a tu tienda de San Andrés'<br><br>En esta DEMO está desactivado.<br><br>📍 San Andrés, GDL";
    else if(id==="btnRecluta"){
      const nom = document.getElementById('rn').value || 'Demo';
      const ciu = document.getElementById('rc').value || 'GDL';
      const inter = document.getElementById('ri').value;
      msg = `🔒 MODO DEMO - Reclutamiento<br><br>Nombre: ${nom}<br>De donde: ${ciu}<br>Interés: ${inter}<br><br>En la tienda real Ysi te respondería con info de Kit Inicio + Capacitación.<br>WhatsApp bloqueado en demo.`;
    } else {
      msg = "En la tienda real aquí se abriría WhatsApp de Ysi Terramar 33 3140 2726.<br><br>En esta <b>DEMO</b> está desactivado para no spamear a Ysi.<br><br>✨ 7 años formando líderes";
    }
    openDemo(msg);
  });
});

// Flotante no tapa footer
const footer = document.querySelector('.yare-footer');
const ysiFloat = document.getElementById('ysiFloat');
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting) ysiFloat.classList.add('hide');
    else ysiFloat.classList.remove('hide');
  });
}, {threshold:0.1});
if(footer && ysiFloat) observer.observe(footer);