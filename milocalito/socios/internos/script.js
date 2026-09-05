// CLAUDIA PUEBLA - VERSIÓN FINAL UNIFICADA
document.addEventListener('DOMContentLoaded', () => {
  const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycby4hbjQNCbCpCXtM0mMZ2kEUOb8tt38BOkQcjta95Ez-BKBjcdSMBU8h3ZUUHh8KPAI/exec";

  // Guarda el ref que te trajo
  (function(){
    const p = new URLSearchParams(window.location.search);
    const r = p.get('ref');
    if(r) localStorage.setItem('ml_ref', r);
  })();

  const form = document.getElementById('afiliadoForm');
  if(!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const tipo = document.getElementById('tipo').value;
    if(!nombre || !wa){ alert('Pon tu nombre y WhatsApp'); return; }

    const refNueva = nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + wa.slice(-4);
    const jefe = 'claudia-puebla';
    const invito = localStorage.getItem('ml_ref') || jefe;

    // Si es afiliado, guardalo en Config usando EL MISMO WEBHOOK que pagar.html
    if(tipo.includes('Afiliado')){
      const url = `${SHEET_WEBHOOK}?accion=nuevo&ref=${encodeURIComponent(refNueva)}&jefe=${encodeURIComponent(jefe)}&nombre=${encodeURIComponent(nombre)}&wa=${encodeURIComponent(wa)}&tipo=${encodeURIComponent(tipo)}&invito=${encodeURIComponent(invito)}`;
      fetch(url, {mode:'no-cors'}).then(()=> console.log('Socio guardado:'+refNueva));
    }

    const mensaje = `Hola Claudia, soy ${nombre} vengo de tu pagina Yerberitos. Quiero ${tipo}. Mi WA: ${wa}. Mi ref nueva: ${refNueva}`;
    window.open(`https://wa.me/522227132374?text=${encodeURIComponent(mensaje)}`, '_blank');
    form.reset();
    alert(`¡Listo ${nombre}! Tu ref es ${refNueva}. Ya estás registrado.`);
  });
});