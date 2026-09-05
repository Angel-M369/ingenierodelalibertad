// TADEO SONORA - VERSIÓN FINAL UNIFICADA
document.addEventListener('DOMContentLoaded', () => {
  const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycby4hbjQNCbCpCXtM0mMZ2kEUOb8tt38BOkQcjta95Ez-BKBjcdSMBU8h3ZUUHh8KPAI/exec";

  // 1. Guarda ref
  (function(){
    const p = new URLSearchParams(window.location.search);
    const r = p.get('ref');
    if(r) localStorage.setItem('ml_ref', r);
  })();

  const form = document.getElementById('afiliadoForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const tipo = document.getElementById('tipo').value;

    if (!nombre || !wa) {
      alert('Pon tu nombre y WhatsApp, socio');
      return;
    }

    const invito = localStorage.getItem('ml_ref') || 'directo-tadeo';
    const refNueva = nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + wa.slice(-4);
    const jefe = 'tadeo-sonora';

    if (tipo.toLowerCase().includes('afiliado') || tipo.toLowerCase().includes('ambos')) {
      const urlSheet = `${SHEET_WEBHOOK}?accion=nuevo&ref=${encodeURIComponent(refNueva)}&jefe=${encodeURIComponent(jefe)}&nombre=${encodeURIComponent(nombre)}&wa=${encodeURIComponent(wa)}&tipo=${encodeURIComponent(tipo)}&invito=${encodeURIComponent(invito)}`;
      fetch(urlSheet, {mode:'no-cors'}).then(()=> console.log('Socio guardado:'+refNueva));
    }

    let mensaje = `Hola Tadeo, soy ${nombre} vengo de tu pagina. `;
    if (tipo.toLowerCase().includes('afiliado')) {
      mensaje += `Quiero ser afiliado para ganar el 30% refiriendo Mi Localito. Mi WA es ${wa}. Tipo: ${tipo}. Ref: ${invito} | Mi ref nueva: ${refNueva}`;
    } else if (tipo.toLowerCase().includes('sistema')) {
      mensaje += `Quiero mi sistema Mi Localito. Tipo: ${tipo}. Ref: ${invito}`;
    } else {
      mensaje += `Me interesa sistema + afiliados. Tipo: ${tipo}. Ref: ${invito} | Mi ref nueva: ${refNueva}`;
    }

    window.open(`https://wa.me/529191467339?text=${encodeURIComponent(mensaje)}`, '_blank');
    form.reset();
    alert(`¡Listo ${nombre}! Tu ref es ${refNueva}.`);
  });
});