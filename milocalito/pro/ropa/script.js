// CARRITO DRAWER PRO - LAS PACAS - MODO YSI - SIN ONCLICK
let carrito = JSON.parse(localStorage.getItem('carritoPacas')) || [];
const WA_NUMBER = '5213312345678';

document.addEventListener('DOMContentLoaded', () => {
    actualizarContador();
    bindEventosYsi();
});

function bindEventosYsi(){
    // ABRIR/CERRAR DRAWER
    document.querySelectorAll('[data-open-carrito]').forEach(b=> b.addEventListener('click', toggleCarrito));
    document.getElementById('carrito-overlay')?.addEventListener('click', toggleCarrito);
    document.getElementById('carrito-cerrar')?.addEventListener('click', toggleCarrito);

    // AGREGAR AL CARRITO - BOTONES DE CATALOGO
    document.addEventListener('click', e=>{
        const btn = e.target.closest('.btn-add-carrito');
        if(!btn) return;
        const nombre = btn.dataset.nombre;
        const precio = parseInt(btn.dataset.precio);
        const imagen = btn.dataset.imagen;
        agregarAlCarrito(nombre, precio, imagen);
    });

    // CLICK EN IMAGEN DE CARD TAMBIEN AGREGA
    document.addEventListener('click', e=>{
        const imgWrap = e.target.closest('.card-img');
        if(!imgWrap) return;
        const card = imgWrap.closest('.card-pro');
        const btn = card?.querySelector('.btn-add-carrito');
        if(btn) btn.click();
    });

    // DELEGACION PARA + - TRASH DENTRO DEL CARRITO
    document.getElementById('items-carrito')?.addEventListener('click', e=>{
        const btn = e.target.closest('[data-accion]');
        if(!btn) return;
        const index = parseInt(btn.dataset.index);
        const accion = btn.dataset.accion;
        if(accion === 'mas') cambiarCantidad(index, 1);
        if(accion === 'menos') cambiarCantidad(index, -1);
        if(accion === 'eliminar') eliminarItem(index);
    });

    document.getElementById('btn-vaciar')?.addEventListener('click', vaciarCarrito);
    document.getElementById('btn-finalizar-wa')?.addEventListener('click', finalizarCompra);
    document.getElementById('btn-pagar-tarjeta')?.addEventListener('click', pagarTarjeta);

    // MEDICION WA GENERAL
    document.querySelectorAll('a[href*="wa.me"]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            if(typeof gtag!=='undefined'){
                gtag('event','click_whatsapp',{sistema:'pro',ubicacion:'link_general'});
            }
        });
    });
}

function actualizarContador(){
    const total = carrito.reduce((s,i)=> s+i.cantidad,0);
    const el = document.getElementById('contador-carrito');
    if(el) el.textContent = total;
}

function agregarAlCarrito(nombre, precio, imagen){
    const ex = carrito.find(i=> i.nombre===nombre);
    if(ex) ex.cantidad++;
    else carrito.push({nombre, precio, imagen, cantidad:1});
    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador();
    mostrarNotificacion(`${nombre} agregado`);

    if(typeof gtag!=='undefined'){
        gtag('event','add_to_cart',{sistema:'pro',item_name:nombre,price:precio,value:precio,currency:'MXN'});
    }
    setTimeout(()=>{
        const d=document.getElementById('carrito-drawer');
        if(!d.classList.contains('activo')) toggleCarrito();
        else renderizarCarrito();
    },200);
}

function toggleCarrito(){
    const drawer=document.getElementById('carrito-drawer');
    if(!drawer) return;
    drawer.classList.toggle('activo');
    if(drawer.classList.contains('activo')){
        renderizarCarrito();
        if(typeof gtag!=='undefined'){
            gtag('event','view_cart',{sistema:'pro',items:carrito.length,value:carrito.reduce((s,i)=> s+i.precio*i.cantidad,0),currency:'MXN'});
        }
    }
}

function renderizarCarrito(){
    const cont=document.getElementById('items-carrito');
    const footer=document.getElementById('carrito-footer');
    if(!cont) return;

    if(carrito.length===0){
        cont.innerHTML=`<div class="carrito-vacio"><i class="fas fa-shopping-cart"></i><p>Tu carrito está vacío</p><p style="font-size:.8rem;margin-top:6px">Agrega pacas para comenzar</p></div>`;
        if(footer) footer.style.display='none';
        return;
    }
    if(footer) footer.style.display='block';

    let html=''; let subtotal=0;
    carrito.forEach((item,idx)=>{
        subtotal+=item.precio*item.cantidad;
        html+=`
        <div class="item-carrito">
            <img src="${item.imagen}" alt="${item.nombre}" class="item-img-carrito" loading="lazy">
            <div class="item-info"><h4>${item.nombre}</h4><p>$${item.precio.toLocaleString('es-MX')}</p></div>
            <div class="item-cantidad">
                <button class="btn-cantidad" data-accion="menos" data-index="${idx}">-</button>
                <span>${item.cantidad}</span>
                <button class="btn-cantidad" data-accion="mas" data-index="${idx}">+</button>
                <button class="btn-cantidad" data-accion="eliminar" data-index="${idx}" style="color:#ff5a5a"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    });
    cont.innerHTML=html;
    document.getElementById('total').textContent=`$${subtotal.toLocaleString('es-MX')}`;
}

function cambiarCantidad(index,cambio){
    if(!carrito[index]) return;
    carrito[index].cantidad+=cambio;
    if(carrito[index].cantidad<=0) carrito.splice(index,1);
    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador(); renderizarCarrito();
}

function eliminarItem(index){
    const nombre=carrito[index]?.nombre;
    carrito.splice(index,1);
    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador(); renderizarCarrito();
    mostrarNotificacion(`${nombre} eliminado`);
    if(typeof gtag!=='undefined') gtag('event','remove_from_cart',{sistema:'pro',item_name:nombre});
}

function vaciarCarrito(){
    carrito=[]; localStorage.removeItem('carritoPacas');
    actualizarContador(); renderizarCarrito();
    mostrarNotificacion('Carrito vaciado');
}

function finalizarCompra(){
    if(carrito.length===0) return;
    let mensaje=`Hola Chino! 👋 Quiero este pedido:%0A%0A`; let total=0;
    carrito.forEach(i=>{ const sub=i.precio*i.cantidad; total+=sub; mensaje+=`• ${i.nombre} x${i.cantidad} = $${sub.toLocaleString('es-MX')}%0A`; });
    mensaje+=`%0A*TOTAL: $${total.toLocaleString('es-MX')}*%0A%0AMi nombre es:`;
    if(typeof gtag!=='undefined'){
        gtag('event','begin_checkout',{sistema:'pro',value:total,currency:'MXN',items:carrito.map(i=>({item_name:i.nombre,quantity:i.cantidad,price:i.precio}))});
        gtag('event','click_whatsapp',{sistema:'pro',value:total,currency:'MXN',items_count:carrito.length});
    }
    window.open(`https://wa.me/${WA_NUMBER}?text=${mensaje}`,'_blank');
    carrito=[]; localStorage.removeItem('carritoPacas'); actualizarContador(); toggleCarrito();
}

function pagarTarjeta(){
    if(carrito.length===0) return;
    const total=carrito.reduce((s,i)=> s+i.precio*i.cantidad,0);
    if(typeof gtag!=='undefined') gtag('event','pagar_tarjeta',{sistema:'pro',value:total,currency:'MXN'});
    // Aquí va tu link de Stripe / Mercado Pago
    mostrarNotificacion('Redirigiendo a pago con tarjeta...');
}

function mostrarNotificacion(texto){
    let c=document.getElementById('notif-container');
    if(!c){ c=document.createElement('div'); c.id='notif-container'; c.style.cssText='position:fixed;top:16px;right:16px;z-index:10000;display:flex;flex-direction:column;gap:8px'; document.body.appendChild(c); }
    const n=document.createElement('div');
    n.style.cssText='background:#25D366;color:#000;padding:10px 18px;border-radius:8px;font-weight:700;font-size:.8rem;box-shadow:0 4px 12px rgba(0,0,0,.3);animation:slideIn.25s ease';
    n.textContent=texto;
    c.appendChild(n);
    setTimeout(()=>{ n.style.opacity='0'; n.style.transform='translateX(40px)'; n.style.transition='.25s'; setTimeout(()=>n.remove(),250); },2000);
}