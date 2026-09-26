document.addEventListener("DOMContentLoaded",()=>{
  // === 1. MENU HAMBURGUESA - NUEVO ===
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  hamburger?.addEventListener('click', ()=>{
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });
  // cierra al dar click
  document.querySelectorAll('.nav-menu a').forEach(a=>{
    a.addEventListener('click', ()=>{
      hamburger?.classList.remove('active');
      navMenu?.classList.remove('active');
    })
  });

  // === 2. TU FORM ORIGINAL - IGUAL PERO MEJORADO ===
  const form=document.getElementById("afiliadoForm");
  if(!form) return;
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const nombre=document.getElementById("nombre")?.value.trim()||"";
    const waInput=document.getElementById("wa")?.value.trim()||"";
    const tipo=document.getElementById("tipo")?.value||"Quiero ser socio autorizado";
    const page=document.body.className;
    let socio="Tadeo", num="529191467339";
    if(page.includes("jorge")){socio="Jorge";num="523142262901";}
    if(page.includes("joss")){socio="Joss";num="526644738497";}
    // limpia el WA por si ponen +52 o espacios
    const waLimpio = waInput.replace(/\D/g,'');
    const msg=`Hola ${socio} 🔥 Soy ${nombre}, mi WA es ${waLimpio}. Vi tu pagina y ${tipo.toLowerCase()}.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
  });
});