const WA = "523331402726";
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

// CLICK FUERA PARA CERRAR
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

// VACIAR CARRITO
btnVaciar.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(!cart.length) return;
  if(confirm('¿Vaciar carrito?')){
    cart = []; total = 0; renderCart();
  }
});

// COMPRAR AHORA - CON PAGO + 2 WHATSAPPS
btnCobrar.addEventListener('click', (e)=>{
  e.stopPropagation();
  if(!cart.length){
    alert('Carrito vacío');
    return;
  }
  const nombre = clientName.value.trim() || "Fulanito";
  const metodo = document.querySelector('input[name="pay"]:checked').value;
  const productos = cart.map(c=>c.n).join(', ');
  
  // 1) WhatsApp al dueño Ysi - aviso de pago
  const msgDueno = `¡VENTA PRO TERRAMAR!%0A%0A${nombre} pagó:%0A${encodeURIComponent(productos)}%0ATotal: $${total}%0AMétodo: ${metodo}%0A%0ACobro hecho - Empaca y envía. Stock descontado.`;
  
  // 2) WhatsApp al cliente - simulado, lo mandamos como segundo mensaje después de 1.5s
  const msgCliente = `Gracias por tu compra ${nombre}!%0A%0ATu producto está siendo empacado y va en camino.%0A%0ADetalle: ${encodeURIComponent(productos)}%0ATotal pagado: $${total} con ${metodo}%0A%0AYsi Líder Terramar - 33 3140 2726%0ATe mando guía en cuanto salga.`;

  // Abrimos primero el del dueño
  window.open(`https://wa.me/${WA}?text=${msgDueno}`, '_blank');

  // Luego, después de 1200ms, abrimos el del cliente (se lo copias y se lo mandas tú o el sistema lo envía si tienes API)
  setTimeout(()=>{
    // Si tienes el número del cliente, usarías su WA. Como demo, lo mostramos y lo mandamos al mismo número para que Ysi se lo reenvíe
    if(confirm(`Venta registrada: ${nombre} pagó $${total} con ${metodo}\n\n¿Quieres mandar también el mensaje de Gracias al cliente?\n\n"${decodeURIComponent(msgCliente).slice(0,120)}..."`)){
      window.open(`https://wa.me/${WA}?text=${msgCliente}`, '_blank');
    }
  }, 1200);

  // Vaciar y cerrar
  cart = []; total = 0; renderCart();
  closeAllMenus();
  alert(`¡Cobro registrado! ${nombre} pagó $${total} por ${productos} con ${metodo}. Mensaje enviado a Ysi 33 3140 2726`);
});

// Recluta y botones mapa igual
document.getElementById('btnWALlegar').href = `https://wa.me/${WA}?text=Hola%20Ysi%20dime%20como%20llego%20a%20tu%20tienda%20de%20San%20Andres,%20soy%20de%20`;
document.getElementById('footerWA2').href = `https://wa.me/${WA}?text=Hola%20Ysi%20vi%20tu%20pagina%20Terramar`;
document.getElementById('ysiFloat').href = `https://wa.me/${WA}?text=Hola%20Ysi%20vi%20que%20estas%20conectada`;

document.getElementById('btnRecluta').addEventListener('click', ()=>{
  const nom = document.getElementById('rn').value || '';
  const ciu = document.getElementById('rc').value || '';
  const inter = document.getElementById('ri').value;
  const msg = `Hola Ysi quiero ser parte de tu equipo, dime como lo hago?\n\nNombre: ${nom}\nDe donde: ${ciu}\nInteres: ${inter}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');
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
observer.observe(footer);