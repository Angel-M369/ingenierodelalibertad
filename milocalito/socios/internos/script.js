// CLAUDIA PUEBLA - VERSIÓN FINAL CORREGIDA
document.addEventListener('DOMContentLoaded', () => {
  (function(){
    const p = new URLSearchParams(window.location.search);
    const r = p.get('ref');
    if(r) localStorage.setItem('ml_ref', r);
    const s = localStorage.getItem('ml_ref');
    if(s){
      document.querySelectorAll('a[href*="mpago.la"]').forEach(a => {
        let b = a.href.split('?')[0];
        a.href = b + '?external_reference=' + s + '&ref=' + s;
      });
    }
  })();

  const form = document.getElementById('afiliadoForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const tipo = document.getElementById('tipo').value;
    if(!nombre ||!wa){ alert('Pon tu nombre y WhatsApp'); return; }
    const s = localStorage.getItem('ml_ref') || 'directo-claudia';
    const mensaje = `Hola Claudia, soy ${nombre} vengo de tu pagina Yerberitos. Quiero ${tipo}. Mi WA: ${wa}. Ref: ${s}`;
    window.open(`https://wa.me/522227132374?text=${encodeURIComponent(mensaje)}`, '_blank');
    form.reset();
  });
});