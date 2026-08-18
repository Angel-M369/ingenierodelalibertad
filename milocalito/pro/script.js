// ===================================
// CARRITO DRAWER PRO - LAS PACAS + MEDICIÓN G-0S14JTTS9D
// ===================================

let carrito = JSON.parse(localStorage.getItem('carritoPacas')) || [];

document.addEventListener('DOMContentLoaded', function() {
    actualizarContador();

    // MEDICIÓN: Clicks generales WA en esta demo
    document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if(typeof gtag!== 'undefined'){
                gtag('event', 'click_whatsapp', {
                    'sistema': 'pro',
                    'ubicacion': 'link_general'
                });
            }
        });
    });
});

function actualizarContador() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contador = document.getElementById('contador-carrito');
    if (contador) {
        contador.textContent = total;
    }
}

function agregarAlCarrito(nombre, precio, imagen) {
    const itemExistente = carrito.find(item => item.nombre === nombre);

    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ nombre, precio, imagen, cantidad: 1 });
    }

    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador();
    mostrarNotificacion(`${nombre} agregado al carrito`);

    // MEDICIÓN: Add to cart
    if(typeof gtag!== 'undefined'){
        gtag('event', 'add_to_cart', {
            'sistema': 'pro',
            'item_name': nombre,
            'price': precio,
            'value': precio,
            'currency': 'MXN'
        });
        gtag('event', 'view_product_pro', {
            'product': nombre,
            'sistema': 'pro'
        });
    }

    setTimeout(() => {
        toggleCarrito();
    }, 300);
}

function toggleCarrito() {
    const drawer = document.getElementById('carrito-drawer');
    drawer.classList.toggle('activo');
    if (drawer.classList.contains('activo')) {
        renderizarCarrito();
        if(typeof gtag!== 'undefined'){
            gtag('event', 'view_cart', {
                'sistema': 'pro',
                'items': carrito.length,
                'value': carrito.reduce((s,i)=> s + (i.precio*i.cantidad),0),
                'currency': 'MXN'
            });
        }
    }
}

function renderizarCarrito() {
    const contenedor = document.getElementById('items-carrito');
    const footer = document.getElementById('carrito-footer');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div class="carrito-vacio"><i class="fas fa-shopping-cart"></i><p>Tu carrito está vacío</p><p style="font-size:0.9rem;margin-top:10px;">Agrega pacas para comenzar</p></div>';
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
    let html = '';
    let subtotal = 0;

    carrito.forEach((item, index) => {
        const totalItem = item.precio * item.cantidad;
        subtotal += totalItem;
        html += `
            <div class="item-carrito">
                <img src="${item.imagen}" alt="${item.nombre}" class="item-img-carrito">
                <div class="item-info">
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio.toLocaleString('es-MX')}</p>
                </div>
                <div class="item-cantidad">
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="cambiarCantidad(${index}, 1)">+</button>
                    <button class="btn-cantidad" onclick="eliminarItem(${index})" style="background:#ff0000;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    contenedor.innerHTML = html;
    const totalEl = document.getElementById('total');
    if (totalEl) totalEl.textContent = `$${subtotal.toLocaleString('es-MX')}`;
}

function cambiarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador();
    renderizarCarrito();
}

function eliminarItem(index) {
    const nombre = carrito[index].nombre;
    carrito.splice(index, 1);
    localStorage.setItem('carritoPacas', JSON.stringify(carrito));
    actualizarContador();
    renderizarCarrito();
    mostrarNotificacion(`${nombre} eliminado`);

    if(typeof gtag!== 'undefined'){
        gtag('event', 'remove_from_cart', {
            'sistema': 'pro',
            'item_name': nombre
        });
    }
}

function vaciarCarrito() {
    if (confirm('¿Seguro que quieres vaciar el carrito?')) {
        carrito = [];
        localStorage.removeItem('carritoPacas');
        actualizarContador();
        renderizarCarrito();
        mostrarNotificacion('Carrito vaciado');
    }
}

function finalizarCompra() {
    if (carrito.length === 0) return;

    let mensaje = `Hola Chino! 👋 Quiero hacer este pedido:%0A%0A`;
    let total = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `• ${item.nombre} x${item.cantidad} = $${subtotal.toLocaleString('es-MX')}%0A`;
    });

    mensaje += `%0A*TOTAL: $${total.toLocaleString('es-MX')}*%0A%0AMi nombre es:`;

    // MEDICIÓN MAESTRA - CONVERSIÓN REAL DE PRO
    if(typeof gtag!== 'undefined'){
        gtag('event', 'click_whatsapp', {
            'sistema': 'pro',
            'value': total,
            'currency': 'MXN',
            'items_count': carrito.length
        });
        gtag('event', 'begin_checkout', {
            'sistema': 'pro',
            'value': total,
            'currency': 'MXN',
            'items': carrito.map(i=> ({item_name: i.nombre, quantity: i.cantidad, price: i.precio}))
        });
        gtag('event', 'purchase_intent_pro', {
            'value': total,
            'items': carrito.length
        });
    }

    window.open(`https://wa.me/5213312345678?text=${mensaje}`, '_blank');

    carrito = [];
    localStorage.removeItem('carritoPacas');
    actualizarContador();
    toggleCarrito();
    mostrarNotificacion('Pedido enviado por WhatsApp');
}

function mostrarNotificacion(texto) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #25D366;
        color: #000;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 700;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notif.textContent = texto;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);