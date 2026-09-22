document.addEventListener('DOMContentLoaded', function() {
  var mainVideo = document.getElementById('main-video');
  var sections = document.querySelectorAll('.rayas-hero-content.snap');

  if (mainVideo && sections.length) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var newSrc = entry.target.getAttribute('data-video');
          if (newSrc && mainVideo.currentSrc.indexOf(newSrc.split('/').pop()) === -1) {
            mainVideo.style.opacity = '0';
            setTimeout(function() {
              mainVideo.src = newSrc;
              mainVideo.load();
              var p = mainVideo.play();
              if (p) p.catch(function() {});
              mainVideo.style.opacity = '1';
            }, 180);
          }
          entry.target.classList.remove('in-view');
          void entry.target.offsetWidth;
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.6 });
    sections.forEach(function(s) {
      observer.observe(s);
    });
  }

  document.querySelectorAll('.scroll-link').forEach(function(link) {
    link.addEventListener('click', function() {
      var chk = document.getElementById('rayas-menu-toggle');
      if (chk) chk.checked = false;
    });
  });

  var sel = document.getElementById('rayas-tam');
  var txt = document.getElementById('rayas-total-txt');
  var porc = document.getElementById('rayas-porc');

  function upd() {
    if (!sel) return;
    var val = sel.value;
    var p = 30; // TODO FIJO EN 30% PARA JESS
    if (txt) txt.textContent = '$' + val + ' MXN (' + p + '%)';
    if (porc) porc.textContent = p + '%';
  }
  if (sel) {
    sel.addEventListener('change', upd);
    upd();
  }

  setInterval(function() {
    var now = new Date();
    var time = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.hora-txt').forEach(function(el) {
      el.textContent = time;
    });
  }, 1000);

  var btn = document.getElementById('rayas-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      var nombreInput = document.getElementById('rayas-nombre');
      var nombre = nombreInput && nombreInput.value ? nombreInput.value : 'bro';
      var total = txt ? txt.textContent : '$600 MXN (30%)';
      alert('DEMO ELITE $9,999\nEn la version real aqui cobra ' + total + ' con MercadoPago.\n\n' + nombre + ', te llega WhatsApp automatico.');
    });
  }

  var track = document.getElementById('rayas-track');
  if (track) {
    track.querySelectorAll('.rayas-slide').forEach(function(slide) {
      slide.addEventListener('click', function() {
        var span = slide.querySelector('span');
        var estilo = span ? span.textContent : '';
        var ideaInput = document.getElementById('rayas-idea');
        if (ideaInput) {
          ideaInput.value = 'Quiero estilo ' + estilo + ' - ';
          ideaInput.focus();
        }
        var apartar = document.getElementById('apartar');
        if (apartar) apartar.scrollIntoView({ behavior: 'smooth' });
      });
    });
    track.addEventListener('mouseenter', function() {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', function() {
      track.style.animationPlayState = 'running';
    });
    track.addEventListener('touchstart', function() {
      track.style.animationPlayState = 'paused';
    }, { passive: true });
    track.addEventListener('touchend', function() {
      setTimeout(function() {
        track.style.animationPlayState = 'running';
      }, 800);
    });
  }
});