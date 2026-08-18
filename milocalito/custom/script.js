let carrito = [];
let total = 0;

// Toggle carrito
const toggleCart = () => {
    document.getElementById('cartDrawer').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
    if(typeof gtag!== 'undefined' && document.getElementById('cartDrawer').classList.contains('active')){
        gtag('event', 'view_cart', {
            'sistema': 'custom',
            'items': carrito.length,
            'value': total,
            'currency': 'MXN'
        });
    }
};

// Menu mobile
const menuCheck = document.getElementById('menu-check');
const cerrarMenu = () => {
    if (menuCheck) menuCheck.checked = false;
};

document.querySelectorAll('.nav-pro > a').forEach(a => {
    a.addEventListener('click', cerrarMenu);
});

// Filtros
function filtrarPor(cat) {
    document.querySelectorAll('.filtro-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filtro === cat);
    });

    document.querySelectorAll('.producto-card-custom').forEach(c => {
        c.style.display = (cat === 'todos' || c.dataset.categoria === cat) ? 'block' : 'none';
    });

    if(typeof gtag!== 'undefined'){
        gtag('event', 'filter_product_custom', {
            'categoria': cat,
            'sistema': 'custom'
        });
    }
}

// Agregar al carrito
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-cart')) {
        let n = e.target.dataset.nombre;
        let p = parseInt(e.target.dataset.precio);
        
        carrito.push({ nombre: n, precio: p });
        total += p;
        
        actualizarCarrito();
        
        if (!document.getElementById('cartDrawer').classList.contains('active')) {
            toggleCart();
        }

        // MEDICIÓN INTERÉS DEMO CUSTOM - NO VENTA REAL DE PASTEL
        if(typeof gtag!== 'undefined'){
            gtag('event', 'add_to_cart', {
                'sistema': 'custom',
                'item_name': n,
                'price': p,
                'value': p,
                'currency': 'MXN'
            });
            gtag('event', 'view_product_custom', {
                'product': n,
                'sistema': 'custom'
            });
        }
    }
});

function actualizarCarrito() {
    document.getElementById('countCart').innerText = carrito.length;
    document.getElementById('cartCountHeader').innerText = carrito.length;
    document.getElementById('cartTotal').innerText = `$${total.toLocaleString()}`;

    let html = carrito.map(p => `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:8px">
            <span>${p.nombre}</span>
            <strong>$${p.precio}</strong>
        </div>
    `).join('');

    document.getElementById('cartItems').innerHTML = html || '<p>Tu carrito está vacío.</p>';
}

// Cupón
document.getElementById('btnCupon')?.addEventListener('click', () => {
    let v = document.getElementById('inputCupon').value.toLowerCase().trim();
    if (v === 'dulce10') {
        total = Math.round(total * 0.9);
        actualizarCarrito();
        alert('10% OFF aplicado');
        if(typeof gtag!== 'undefined'){
            gtag('event', 'apply_coupon_custom', {
                'coupon': 'dulce10',
                'sistema': 'custom'
            });
        }
    } else {
        alert('Cupón no válido');
    }
});

// Calculadora envío - LEÓN
document.getElementById('btnCalcularEnvio')?.addEventListener('click', () => {
    let cp = document.getElementById('cotiCP').value.trim();
    if (!cp) return alert('Pon tu CP');

    let envio = cp.startsWith('37') ? 79 : 149;
    let pers = document.getElementById('cotiPersonas').value;
    let desc = parseInt(pers) >= 50 ? 200 : 0;

    document.getElementById('cotiEnvio').innerText = `$${envio}`;
    document.getElementById('cotiDescuento').innerText = `-$${desc}`;

    if(typeof gtag!== 'undefined'){
        gtag('event', 'cotizador_custom', {
            'cp': cp,
            'personas': pers,
            'envio': envio,
            'sistema': 'custom'
        });
    }
});

// FOMO dinámico
setInterval(() => {
    let el = document.getElementById('fomoPersonas');
    if (el) el.innerText = Math.floor(Math.random() * 15) + 5;
}, 3500);

// MEDICIÓN GENERAL WA Y PAGOS REALES (SI TIENES BOTON DE PAGAR DEMO)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if(typeof gtag!== 'undefined'){
                gtag('event', 'click_whatsapp', {
                    'sistema': 'custom',
                    'ubicacion': 'demo_interes',
                    'value': total
                });
                gtag('event', 'purchase_intent_custom', {
                    'value': total,
                    'items': carrito.length
                });
            }
        });
    });

    document.querySelectorAll('a[href*="mpago.la"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if(typeof gtag!== 'undefined'){
                gtag('event', 'click_pago', {
                    'sistema': 'custom_origen',
                    'plan': 'CUSTOM $9,999',
                    'value': 9999,
                    'currency': 'MXN'
                });
            }
        });
    });
});