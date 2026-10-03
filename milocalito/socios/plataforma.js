// PLATAFORMA - MI LOCALITO | JS FINAL V8 - SIN BUG DE SCROLL + REF SOCIO
document.addEventListener('DOMContentLoaded', () => {
  
  const menu = document.getElementById('menu') || document.getElementById('navMenu');
  const hamb = document.getElementById('hamb-btn') || document.getElementById('hamburger');
  const socioActivo = localStorage.getItem('ml_ref') || 'DIRECTO';

  function lockScroll() {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }
  function unlockScroll() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if(scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }

  // 1. Menu hamburguesa
  if (hamb && menu) {
    hamb.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('active');
      if (isOpen) lockScroll();
      else unlockScroll();
    });
  }

  // 2. Scroll suave + cerrar menu + tracking
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('https')) return;
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const navH = document.querySelector('.header')?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (typeof gtag !== 'undefined') gtag('event', 'click_nav_plataforma', { 'seccion': href, 'ref_socio': socioActivo });
      }
      
      if (menu?.classList.contains('active')) {
        menu.classList.remove('active');
        unlockScroll();
      }
    });
  });

  // 3. Botones demo con ref + tracking
  document.querySelectorAll('[data-go], a[href*="wa.me"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.go || btn.href;
      if (url && typeof gtag !== 'undefined') {
        gtag('event', 'click_cta_plataforma', { 'destino': url, 'ref_socio': socioActivo });
      }
      // Agrega ref a wa.me
      if(btn.href && btn.href.includes('wa.me') && socioActivo !== 'DIRECTO'){
        try{
          const u = new URL(btn.href);
          if(!u.searchParams.get('text')?.includes('Ref:')){
            u.searchParams.set('text', (u.searchParams.get('text')||'') + ` (Ref: ${socioActivo})`);
            btn.href = u.toString();
          }
        }catch(e){}
      }
    });
  });

  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.go;
      if (url) window.open(url, '_blank', 'noopener');
    });
  });

  // 4. Cerrar menu si das click fuera
  document.addEventListener('click', e => {
    if (menu && hamb && menu.classList.contains('active') && !menu.contains(e.target) && !hamb.contains(e.target)) {
      menu.classList.remove('active');
      unlockScroll();
    }
  });

  // 5. Cerrar con ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.classList.contains('active')) {
      menu.classList.remove('active');
      unlockScroll();
    }
  });
});