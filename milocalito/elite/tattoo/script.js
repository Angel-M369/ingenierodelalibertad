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
    var p = 30;
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

  // --- MODAL DEMO JESS ---
  var modal = document.getElementById('demoModal');
  var modalTxt = document.getElementById('demoTexto');
  function openDemo(html){
    if(!modal) return;
    if(modalTxt) modalTxt.innerHTML = html;
    modal.classList.add('active');
  }
  function closeDemo(){ if(modal) modal.classList.remove('active'); }
  var btnClose = document.getElementById('demoClose');
  var btnOk = document.getElementById('demoEntendido');
  if(btnClose) btnClose.addEventListener('click', closeDemo);
  if(btnOk) btnOk.addEventListener('click', closeDemo);
  if(modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeDemo(); });

  // Bloquear todos los botones de WhatsApp reales
  document.querySelectorAll('.btn-demo').forEach(function(b){
    b.addEventListener('click', function(e){
      e.preventDefault();
      openDemo('En la tienda real aquí se abriría WhatsApp de Jess con tu idea.<br><br>En esta <b>DEMO</b> está desactivado para no spamear a la artista.<br><br>📍 5.0 ★ (57) - San Jorge 2118A, GDL<br>📅 Calendario en vivo con anticipo 30%.');
    });
  });

  // Boton apartar - DEMO con modal en vez de alert
  var btn = document.getElementById('rayas-btn');
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var nombreInput = document.getElementById('rayas-nombre');
      var ideaInput = document.getElementById('rayas-idea');
      var fechaInput = document.getElementById('rayas-fecha');
      var nombre = nombreInput && nombreInput.value ? nombreInput.value : 'Cliente demo';
      var idea = ideaInput && ideaInput.value ? ideaInput.value : 'Full Color / Cover Up';
      var fecha = fechaInput && fechaInput.value ? fechaInput.value : 'Por definir';
      var total = txt ? txt.textContent : '$600 MXN (30%)';
      openDemo(
        '🔒 MODO DEMO ELITE<br><br>' +
        'En la versión real aquí cobrarías <b>' + total + '</b> con MercadoPago directo a tu cuenta.<br><br>' +
        '<b>Datos capturados:</b><br>' +
        '👤 ' + nombre + '<br>' +
        '💡 ' + idea + '<br>' +
        '📅 ' + fecha + '<br><br>' +
        'A ti te llegaría WhatsApp automático: "Nueva cita ' + nombre + ' - ' + total + ' - ' + idea + '"<br><br>' +
        '<span style="font-size:11px;opacity:.7">No se cobró nada real. Demo de Mi Localito.</span>'
      );
    });
  }

  // Carrusel
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