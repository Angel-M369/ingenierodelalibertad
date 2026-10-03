const ham = document.getElementById('hamburger');
const menu = document.getElementById('navMenu');
const overlay = document.getElementById('navOverlay');
function toggleMenu(){
  ham.classList.toggle('active');
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}
ham.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click', toggleMenu));

// BUCLE HERO - SCROLL + BOTON INICIO
function restartHero(){
  const hero = document.getElementById('hero');
  hero.classList.remove('animate');
  void hero.offsetWidth; // reinicia animación
  hero.classList.add('animate');
}

// Dispara al cargar
window.addEventListener('load', () => {
  document.getElementById('hero').classList.add('animate');
});

// Dispara al hacer scroll y entrar al hero
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting) restartHero();
  });
}, {threshold:0.5});
observer.observe(document.getElementById('hero'));

// Dispara al dar click en INICIO
document.querySelectorAll('a[href="#"], a[href="#hero"], .nav-link').forEach(link=>{
  if(link.textContent.trim().toLowerCase().includes('inicio')){
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      document.getElementById('hero').scrollIntoView({behavior:'smooth'});
      setTimeout(restartHero, 500);
    });
  }
});