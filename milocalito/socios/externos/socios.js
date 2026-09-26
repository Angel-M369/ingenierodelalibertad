document.addEventListener("DOMContentLoaded",()=>{
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
    const msg=`Hola ${socio} 🔥 Soy ${nombre}, mi WA es ${waInput}. Vi tu pagina y ${tipo.toLowerCase()}.`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
  });
});