// PLATAFORMA - MI LOCALITO | JS LIMPIO
document.addEventListener('DOMContentLoaded', () => {
  
  const menu = document.getElementById('menu');
  const hamb = document.getElementById('hamb-btn');

  // 1. Menu hamburguesa
  if (hamb && menu) {
    hamb.addEventListener('click', () => {
      menu.classList.toggle('active');
    });
  }

  // 2. Scroll suave + cerrar menu al dar click
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      if (menu) menu.classList.remove('active');
    });
  });

  // 3. Botones que abren demo (reemplaza el onclick)
  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.open(btn.dataset.go, '_blank');
    });
  });

  // 4. Cerrar menu si das click fuera
  document.addEventListener('click', e => {
    if (menu && hamb && !menu.contains(e.target) && !hamb.contains(e.target)) {
      menu.classList.remove('active');
    }
  });

});