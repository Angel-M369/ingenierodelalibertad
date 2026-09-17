document.addEventListener('DOMContentLoaded', () => {
  const checks = document.querySelectorAll('.coti-check');
  const totalEl = document.getElementById('coti-total');
  const btn = document.getElementById('coti-btn');
  const btnDemo = document.getElementById('btn-anticipo-demo');
  const nombre = document.getElementById('coti-nombre');
  const auto = document.getElementById('coti-auto');
  const tel = document.getElementById('coti-tel');
  const fecha = document.getElementById('coti-fecha');
  const horaEl = document.getElementById('coti-hora');
  const menuCheck = document.getElementById('brillo-menu-toggle');

  if (fecha) {
    fecha.min = new Date().toISOString().split('T')[0];
  }

  function actualizar() {
    let total = 0;
    let servicios = [];

    checks.forEach(c => {
      if (c.checked) {
        total += parseInt(c.dataset.price);
        servicios.push(c.value);
      }
    });

    if (totalEl) {
      totalEl.textContent = "$" + total.toLocaleString('es-MX');
    }

    // Muestra / oculta botón demo azul
    if (btnDemo) {
      btnDemo.style.display = servicios.length > 0? 'block' : 'none';
    }

    const datosCompletos = servicios.length > 0 &&
      nombre?.value.trim().length > 2 &&
      tel?.value.trim().length >= 10 &&
      fecha?.value &&
      horaEl?.value;

    if (btn) {
      btn.disabled =!datosCompletos;
      btn.textContent = datosCompletos
       ? `PAGAR ANTICIPO $200 Y AGENDAR $${total} →`
        : "Selecciona 1 servicio y llena datos";
      btn.dataset.serv = servicios.join(", ");
      btn.dataset.total = total;
    }
  }

  checks.forEach(c => c.addEventListener('change', actualizar));
  [nombre, auto, tel, fecha, horaEl].forEach(input => {
    if (input) input.addEventListener('input', actualizar);
  });

  if (btn) {
    btn.addEventListener('click', () => {
      btn.textContent = "Abriendo WhatsApp...";

      const msg = `Hola Luis! Soy ${nombre.value.trim()}%0A%0A🚗 Auto: ${auto.value.trim()}%0A📱 Mi cel: ${tel.value.trim()}%0A🛠️ Servicios: ${btn.dataset.serv}%0A📅 Fecha: ${fecha.value} a las ${horaEl.value}%0A💰 Total: $${btn.dataset.total}%0A%0AQuiero pagar mi anticipo de $200 y agendar.`;

      window.open(`https://wa.me/522292685379?text=${msg}`, '_blank');

      // Cierra el menú si quedó abierto
      if (menuCheck) menuCheck.checked = false;

      setTimeout(() => { actualizar(); }, 1000);
    });
  }

  // Cierra menú al dar click en cualquier enlace del nav
  document.querySelectorAll('.brillo-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (menuCheck) menuCheck.checked = false;
    });
  });

  actualizar();
});