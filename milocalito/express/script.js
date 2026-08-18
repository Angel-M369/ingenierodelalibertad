// ===== SNACKS EL BAJÓN - JS FINAL + MEDICIÓN MAESTRA G-0S14JTTS9D =====
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalNombre = document.getElementById('modal-nombre');
  const btnCancel = document.getElementById('btn-cancel');
  const btnSend = document.getElementById('btn-send');
  const menuToggle = document.getElementById('bajon-menu-toggle');
  
  let productoActual = '';
  let precioActual = '';
  let tipoEntrega = 'Para recoger - Lomas 4 - 15 min';

  // 1. Cerrar menú al dar click en un link (mobile)
  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (menuToggle) menuToggle.checked = false;
    });
  });

  // 2. Abrir modal al pedir - EVENTO DE INTERÉS
  document.querySelectorAll('.btn-pedir').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card');
      productoActual = card.dataset.nombre;
      precioActual = card.dataset.precio;
      
      modalNombre.textContent = productoActual;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';

      // EVENTO: Vio producto
      if(typeof gtag!== 'undefined'){
        gtag('event', 'view_product_express', {
          'product_name': productoActual,
          'price': precioActual,
          'sistema': 'express'
        });
      }
    });
  });

  // 3. Cambiar tipo de entrega
  document.querySelectorAll('.op').forEach(op => {
    op.addEventListener('click', () => {
      document.querySelectorAll('.op').forEach(o => {
        o.classList.remove('active');
        o.querySelector('i').style.opacity = '0';
      });
      
      op.classList.add('active');
      op.querySelector('i').style.opacity = '1';
      tipoEntrega = op.dataset.tipo;

      if(typeof gtag!== 'undefined'){
        gtag('event', 'select_delivery', {
          'delivery_type': tipoEntrega
        });
      }
    });
  });

  // 4. Funciones cerrar
  function cerrarModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnCancel.addEventListener('click', cerrarModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      cerrarModal();
    }
  });

  // 5. Mandar a WhatsApp - EVENTO DE CONVERSIÓN MAESTRO
  btnSend.addEventListener('click', () => {
    const num = '522291234567';
    const msg = `Hola El Bajón! 🔥\n\nQuiero pedir:\n• ${productoActual} ${precioActual}\n• Modalidad: ${tipoEntrega}\n\n¿Me confirman tiempo?`;
    
    // MEDICIÓN MAESTRA - ESTO ES LO QUE TE HACE FACTURAR
    if(typeof gtag!== 'undefined'){
      gtag('event', 'click_whatsapp', {
        'sistema': 'express',
        'product_name': productoActual,
        'price': precioActual,
        'delivery_type': tipoEntrega,
        'value': 1
      });
      gtag('event', 'purchase_intent_express', {
        'product': productoActual,
        'entrega': tipoEntrega
      });
    }

    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    cerrarModal();
  });

  // EVENTOS GENERALES DE ESTA DEMO
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    if(btn.id !== 'btn-send'){
      btn.addEventListener('click', () => {
        if(typeof gtag!== 'undefined'){
          gtag('event', 'click_whatsapp', {
            'sistema': 'express',
            'ubicacion': 'link_general'
          });
        }
      });
    }
  });
});