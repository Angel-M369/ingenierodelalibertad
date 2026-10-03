// PLATAFORMA - MI LOCALITO | JS FINAL SIN BUG DE SCROLL
document.addEventListener('DOMContentLoaded', () => {
  
  const menu = document.getElementById('menu');
  const hamb = document.getElementById('hamb-btn');

  // 1. Menu hamburguesa - 50vh + lock scroll sin esconder pagina
  if (hamb && menu) {
    hamb.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('active');
      // Bloquea solo el scroll, no esconde la pagina
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    });
  }

  // 2. Scroll suave + cerrar menu
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        const navH = 70; // AJUSTA AQUI QUE TAN ABAJO QUIERES QUE CAIGA EL SCROLL
        const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      
      if (menu) {
        menu.classList.remove('active');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    });
  });

  // 3. Botones demo
  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.go;
      if (url) window.open(url, '_blank');
    });
  });

  // 4. Cerrar menu si das click fuera
  document.addEventListener('click', e => {
    if (menu && hamb && menu.classList.contains('active') && !menu.contains(e.target) && !hamb.contains(e.target)) {
      menu.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });

  // 5. Cerrar con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu) {
      menu.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  });
});