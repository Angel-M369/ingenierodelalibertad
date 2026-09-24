document.addEventListener('DOMContentLoaded', () => {
  // Cerrar menú
  document.querySelectorAll('.yare-nav a').forEach(link => {
    link.addEventListener('click', () => {
      const t = document.getElementById('yare-menu-toggle');
      if(t) t.checked = false;
    });
  });

  // ===== DEMO TlaqueNails - Sistema $6,999 - SOLO SIMULACIÓN =====
  const DUEÑO_WA = "523331389980";
  const MAP_LINK = "https://maps.app.goo.gl/pCwTK3WNF9sEe9tX9?g_st=ac";

  const servicioSelect = document.getElementById('servicio-select');
  const fechaInput = document.getElementById('fecha');
  const horaInput = document.getElementById('hora');
  const nombreInput = document.getElementById('nombre');
  const telefonoInput = document.getElementById('telefono');
  const resumenEl = document.getElementById('coti-resumen');
  const btnAgendar = document.getElementById('coti-btn');

  if(fechaInput){
    fechaInput.min = new Date().toISOString().split("T")[0];
  }

  function updateResumen(){
    if(!resumenEl) return;
    if(servicioSelect?.value && fechaInput?.value && horaInput?.value){
      resumenEl.textContent = `${servicioSelect.value.split(" - ")[0]} | ${fechaInput.value} ${horaInput.value}`;
    }
  }
  [servicioSelect, fechaInput, horaInput].forEach(el=> el?.addEventListener('change', updateResumen));

  // Cards llenan select
  document.querySelectorAll('.yare-card-box').forEach(card=>{
    card.addEventListener('click', ()=>{
      const s = card.dataset.servicio;
      if(servicioSelect){
        for(let opt of servicioSelect.options){
          if(opt.value.includes(s)){ servicioSelect.value = opt.value; break; }
        }
      }
      updateResumen();
      document.getElementById('cotizador')?.scrollIntoView({behavior:"smooth"});
    });
  });

  if(btnAgendar){
    btnAgendar.addEventListener('click', () => {
      const servicio = servicioSelect?.value || "";
      const fecha = fechaInput?.value || "";
      const hora = horaInput?.value || "";
      const nombre = nombreInput?.value.trim() || "";
      const telefono = telefonoInput?.value.trim() || "";

      if(!servicio ||!fecha ||!hora ||!nombre ||!telefono){
        alert("Completa todo: servicio, fecha, hora, nombre y WhatsApp");
        return;
      }

      // SIMULACIÓN ANTI-EMPALME - solo en demo
      const demoCitas = JSON.parse(localStorage.getItem('tlaque_demo') || '[]');
      if(demoCitas.find(c=> c.fecha===fecha && c.hora===hora)){
        alert(`❌ DEMO: Ya hay cita simulada el ${fecha} a las ${hora}. Elige otra. (Sistema anti-empalmes activo)`);
        return;
      }
      demoCitas.push({fecha,hora,servicio,nombre,telefono});
      localStorage.setItem('tlaque_demo', JSON.stringify(demoCitas));

      // MENSAJE QUE SIMULA ENVÍO AL DUEÑO
      const msgDueño = `🔔 *NUEVA CITA - TlaqueNails DEMO $6,999*%0A%0A👤 Cliente: ${nombre}%0A📱 Tel cliente: ${telefono}%0A💅 Servicio: ${servicio}%0A📅 Día: ${fecha}%0A⏰ Hora: ${hora}%0A%0A✅ DEMO: Cita simulada agendada sin empalme.%0A⏰ (En versión real se enviarían recordatorios 24h y 3h a ambos)%0A%0A📍 ${MAP_LINK}`;

      window.open(`https://wa.me/${DUEÑO_WA}?text=${msgDueño}`, "_blank");

      // SIMULACIÓN VISUAL DE RECORDATORIOS EN CONSOLA
      console.log(`%c[DEMO 24h] Dueño: ${nombre} ${telefono} -> ${fecha} ${hora}`, "color:#FF2D78; font-weight:bold");
      console.log(`%c[DEMO 24h] Cliente ${telefono}: Hola ${nombre} tu cita ${fecha} ${hora} ${servicio}`, "color:#5a5a5a");
      console.log(`%c[DEMO 3h] Dueño y cliente notificados`, "color:#FF2D78");

      setTimeout(()=>{
        alert(`✅ DEMO AGENDADA\n\n${fecha} ${hora}\n${servicio}\nCliente: ${nombre} - ${telefono}\n\nEn la versión real ($6,999) se guarda en BD y se programan recordatorios automáticos 24h y 3h antes.\n\nPor ahora solo se simuló y se mandó WhatsApp al dueño.`);
      }, 600);
    });
  }
});