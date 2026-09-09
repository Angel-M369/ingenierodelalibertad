// SCRIPT JORGE FUENTES - MANZANILLO - SOCIO DIRECTO - HÍBRIDO V3
document.addEventListener('DOMContentLoaded', () => {
  // ===== REF FIJO DE JORGE =====
  const REF_SOCIO = 'jorge-fuentes';
  const WA_SOCIO = '529191467339'; // Tu WhatsApp
  
  // Guardamos el ref para que pagar.html lo lea
  localStorage.setItem('ml_ref', REF_SOCIO);
  
  // Parcheamos todos los links de pago con su ref
  document.querySelectorAll('a[href*="pagar.html"], a[href*="mpago.la"]').forEach(a => {
    try {
      const url = new URL(a.href, window.location.origin);
      if(!url.searchParams.get('ref')){
        url.searchParams.set('ref', REF_SOCIO);
        a.href = url.toString();
      }
    } catch(e){}
  });

  // ===== TRACKING =====
  if(typeof gtag !== 'undefined'){
    gtag('event', 'socio_view', { 'ref_socio': REF_SOCIO, 'socio_ciudad': 'manzanillo', 'socio_tipo': 'directo' });
  }
  console.log('🔥 Socio activo:', REF_SOCIO);

  // ===== CLICKS EN PLANES =====
  document.querySelectorAll('.card .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.href.includes('basico') ? 'BASICO $3,999' : btn.href.includes('pro') ? 'PRO $6,999' : 'TOTAL $9,999';
      if(typeof gtag !== 'undefined'){
        gtag('event', 'click_pago', { 'plan': plan, 'ref_socio': REF_SOCIO, 'origen': 'jorge-manzanillo' });
      }
    });
  });

  // ===== FORMULARIO AFILIADOS =====
  const form = document.getElementById('afiliadoForm');
  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const wa = document.getElementById('wa').value.trim();
      const tipo = document.getElementById('tipo').value;

      if(typeof gtag !== 'undefined'){
        gtag('event', 'lead_afiliado', { 'tipo': tipo, 'ref_socio': REF_SOCIO });
      }

      const mensaje = `Hola Jorge! Soy ${nombre} de Manzanillo/Tribu.%0A%0AQuiero: ${tipo}%0AMi WA: ${wa}%0A%0ARef: ${REF_SOCIO}%0AVi tu pagina hibrida.`;
      window.open(`https://wa.me/${WA_SOCIO}?text=${mensaje}`, '_blank');
    });
  }

  // ===== CLICKS A DEMOS =====
  document.querySelectorAll('a[href*="/express/"], a[href*="/pro/"], a[href*="/custom/"], a[href*="/landing/"], a[href*="/agenda/"], a[href*="/elite/"]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(typeof gtag!== 'undefined'){
        gtag('event', 'view_demo', { 'demo': btn.getAttribute('href'), 'ref_socio': REF_SOCIO });
      }
    });
  });
});