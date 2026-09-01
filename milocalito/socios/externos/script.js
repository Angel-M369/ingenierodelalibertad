// TADEO SONORA - AFILIADOS MI LOCALITO - VERSIÓN FINAL
document.addEventListener('DOMContentLoaded', () => {

  // --- 1. SISTEMA QUE GUARDA EL REF DE AFILIADO ---
  (function guardarRef(){
    const params = new URLSearchParams(window.location.search);
    const refUrl = params.get('ref');
    if(refUrl){
      localStorage.setItem('ml_ref', refUrl);
      console.log('Ref guardado:', refUrl);
    }
    const savedRef = localStorage.getItem('ml_ref');
    if(savedRef){
      document.querySelectorAll('a[href*="mpago.la"]').forEach(a => {
        let base = a.href.split('?')[0];
        // Le mandamos el ref como external_reference + ref para que tu Apps Script lo lea sí o sí
        a.href = base + '?external_reference=' + savedRef + '&ref=' + savedRef;
      });
    }
  })();

  // --- 2. TU FORMULARIO ORIGINAL ---
  const form = document.getElementById('afiliadoForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const tipo = document.getElementById('tipo').value;

    if (!nombre ||!wa) {
      alert('Pon tu nombre y WhatsApp, socio');
      return;
    }

    // Limpia número
    let num = wa.replace(/\D/g, '');
    if (num.length === 10) num = '52' + num;

    // Agregamos el ref que traía
    const savedRef = localStorage.getItem('ml_ref') || 'directo-tadeo';

    let mensaje = `Hola Tadeo, soy ${nombre} vengo de tu página /socios/tadeo de Sonora. `;

    if (tipo.includes('afiliado')) {
      mensaje += `Quiero ser afiliado como tú para ganar el 30% refiriendo Mi Localito. Mi WA es ${wa}. Tipo: ${tipo}. Ref: ${savedRef}`;
    } else if (tipo.includes('sistema')) {
      mensaje += `Quiero mi sistema Mi Localito para mi negocio. Tipo: ${tipo}. Ref: ${savedRef}`;
    } else {
      mensaje += `Me interesa sistema + afiliados. Tipo: ${tipo}. Ref: ${savedRef}`;
    }

    const url = `https://wa.me/529191467339?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');

    // Limpia form
    form.reset();
  });
});