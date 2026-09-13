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

  // No permitir fechas pasadas
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

    if (btnDemo) {
      btnDemo.style.display = servicios.length > 0? 'block' : 'none';
    }
  }

  // Listeners
  checks.forEach(c => c.addEventListener('change', actualizar));
  [nombre, auto, tel, fecha, horaEl].forEach(input => {
    if (input) input.addEventListener('input', actualizar);
  });

  // BOTÓN PRINCIPAL - WhatsApp a Luis (Demo)
  if (btn) {
    btn.addEventListener('click', () => {
      const datos = {
        nombre: nombre.value.trim(),
        auto: auto.value.trim(),
        telefono: tel.value.trim(),
        fecha: fecha.value,
        hora: horaEl.value,
        servicios: btn.dataset.serv,
        total: btn.dataset.total
      };

      const msg = `Hola Luis! Soy ${datos.nombre}%0A%0A🚗 Auto: ${datos.auto}%0A📱 Mi cel: ${datos.telefono}%0A🛠️ Servicios: ${datos.servicios}%0A📅 Fecha: ${datos.fecha} a las ${datos.hora}%0A💰 Total: $${datos.total}%0A%0AQuiero pagar mi anticipo de $200 y agendar.`;

      window.open(`https://wa.me/522292685379?text=${msg}`, '_blank');

      // CUANDO TENGAS EL PHP REAL, COMENTA LA LINEA DE ARRIBA Y USA ESTO:
      // fetch("api/guardar_cita.php", { method: 'POST', body: JSON.stringify(datos) })
      //.then(r => r.json()).then(res => alert("¡Agendado! Revisa tu WhatsApp"));
    });
  }

  // BOTÓN DEMO - Explicación del anticipo
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      alert(
        '🔒 MODO DEMO - SISTEMA AGENDA $6,999\n\n' +
        'En la versión real de Luis aquí se cobra ANTICIPO de $200 con tarjeta/OXXO para asegurar lugar.\n\n' +
        'Si no paga, NO se agenda. Así evitas plantones.\n\n' +
        'Demo sin cobros reales.'
      );
    });
  }

  actualizar();
});