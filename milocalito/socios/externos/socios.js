/* =====================================================
   1. MENÚ MÓVIL
   Abrir, cerrar y permitir cierre con Escape
===================================================== */

const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuOverlay = document.getElementById('menuOverlay');

function cerrarMenu() {
  if (!burgerBtn || !mobileMenu) return;

  mobileMenu.classList.remove('open');
  burgerBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');

  if (menuOverlay) {
    menuOverlay.classList.remove('open');
  }
}

function abrirMenu() {
  if (!burgerBtn || !mobileMenu) return;

  mobileMenu.classList.add('open');
  burgerBtn.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');

  if (menuOverlay) {
    menuOverlay.classList.add('open');
  }
}

if (burgerBtn && mobileMenu) {
  burgerBtn.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');

  burgerBtn.addEventListener('click', event => {
    event.stopPropagation();

    if (mobileMenu.classList.contains('open')) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', cerrarMenu);
  });

  if (menuOverlay) {
    menuOverlay.addEventListener('click', cerrarMenu);
  }

  document.addEventListener('click', event => {
    if (!mobileMenu.classList.contains('open')) return;

    if (
      !mobileMenu.contains(event.target) &&
      !burgerBtn.contains(event.target)
    ) {
      cerrarMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      cerrarMenu();
    }
  });
}


/* =====================================================
   2. CONFIGURACIÓN DE LOS SEIS SISTEMAS
===================================================== */

const mapaSistemas = {
  xpress: {
    imagen: 'S-ex',
    tarjeta: 'card-xpress'
  },
  pro: {
    imagen: 'S-p',
    tarjeta: 'card-pro'
  },
  custom: {
    imagen: 'S-c',
    tarjeta: 'card-custom'
  },
  landing: {
    imagen: 'S-l',
    tarjeta: 'card-landing'
  },
  agenda: {
    imagen: 'S-a',
    tarjeta: 'card-agenda'
  },
  elite: {
    imagen: 'S-e',
    tarjeta: 'card-elite'
  }
};

let seleccionActual = 0;
let temporizadoresEnfoque = [];

function limpiarTemporizadoresEnfoque() {
  temporizadoresEnfoque.forEach(temporizador => {
    clearTimeout(temporizador);
  });

  temporizadoresEnfoque = [];
}

function programar(callback, tiempo) {
  const temporizador = setTimeout(callback, tiempo);
  temporizadoresEnfoque.push(temporizador);
  return temporizador;
}


/* =====================================================
   3. UTILIDADES DEL CARRUSEL
===================================================== */

function obtenerElementosCarrusel() {
  return {
    b3: document.getElementById('b3'),
    track: document.getElementById('infiniteTrack')
  };
}

function quitarFocos(track) {
  if (!track) return;

  track.querySelectorAll('img.foco-activo').forEach(img => {
    img.classList.remove('foco-activo');
  });
}

function centrarElementoEnContenedor(elemento, contenedor) {
  if (!elemento || !contenedor) return;

  const cajaContenedor = contenedor.getBoundingClientRect();
  const cajaElemento = elemento.getBoundingClientRect();

  const centroContenedor =
    cajaContenedor.left + cajaContenedor.width / 2;

  const centroElemento =
    cajaElemento.left + cajaElemento.width / 2;

  const diferencia = centroContenedor - centroElemento;
  const transformacion = getComputedStyle(contenedor).transform;

  let xActual = 0;

  if (transformacion && transformacion !== 'none') {
    try {
      xActual = new DOMMatrixReadOnly(transformacion).m41;
    } catch (error) {
      const coincidencia = transformacion.match(
        /matrix\(([^)]+)\)/
      );

      if (coincidencia) {
        xActual =
          Number(coincidencia[1].split(',')[4]) || 0;
      }
    }
  }

  contenedor.style.transform =
    `translateX(${xActual + diferencia}px)`;
}


/* =====================================================
   4. BLOQUE 2 -> BLOQUE 3
   Seleccionar problema y resaltar solución
===================================================== */

function enfocarEnB3(sistema) {
  const configuracion = mapaSistemas[sistema];

  if (!configuracion) return;

  const { b3, track } = obtenerElementosCarrusel();

  const imagen = document.getElementById(
    configuracion.imagen
  );

  if (!b3 || !track || !imagen) {
    console.error(
      'No se encontró el bloque 3, la cinta o la imagen:',
      sistema
    );
    return;
  }

  limpiarTemporizadoresEnfoque();

  const miSeleccion = ++seleccionActual;

  quitarFocos(track);

  track.style.animationPlayState = 'paused';

  const posicionB3 =
    b3.getBoundingClientRect().top +
    window.scrollY - 24;

  window.scrollTo({
    top: Math.max(0, posicionB3),
    behavior: 'smooth'
  });

  programar(() => {
    if (miSeleccion !== seleccionActual) return;

    const transformacion = getComputedStyle(track).transform;

    let xActual = 0;

    if (transformacion && transformacion !== 'none') {
      try {
        xActual = new DOMMatrixReadOnly(transformacion).m41;
      } catch (error) {
        const coincidencia = transformacion.match(
          /matrix\(([^)]+)\)/
        );

        if (coincidencia) {
          xActual =
            Number(coincidencia[1].split(',')[4]) || 0;
        }
      }
    }

    track.style.animation = 'none';
    track.style.transform = `translateX(${xActual}px)`;

    void track.offsetWidth;

    const elementoCentrar = imagen.closest('a') || imagen;
    const contenedor = track.parentElement;

    if (!contenedor) return;

    const cajaContenedor = contenedor.getBoundingClientRect();
    const cajaElemento = elementoCentrar.getBoundingClientRect();

    const centroContenedor =
      cajaContenedor.left + cajaContenedor.width / 2;

    const centroElemento =
      cajaElemento.left + cajaElemento.width / 2;

    const diferencia = centroContenedor - centroElemento;

    track.style.transform =
      `translateX(${xActual + diferencia}px)`;

    programar(() => {
      if (miSeleccion !== seleccionActual) return;

      imagen.classList.add('foco-activo');
    }, 100);

    programar(() => {
      if (miSeleccion !== seleccionActual) return;

      imagen.classList.remove('foco-activo');

      track.style.transform = '';
      track.style.animation = '';
      track.style.animationPlayState = 'running';
    }, 3100);

  }, 750);
}

document.querySelectorAll('#b2 [data-system]').forEach(card => {
  card.addEventListener('click', event => {
    event.preventDefault();
    enfocarEnB3(card.dataset.system);
  });
});


/* =====================================================
   5. BLOQUE 3 -> BLOQUE 4
   Pulsar solución para ir a su tarjeta
===================================================== */

document.querySelectorAll('#infiniteTrack a').forEach(enlace => {
  enlace.addEventListener('click', event => {
    const imagen = enlace.querySelector('img');

    if (!imagen) return;

    const sistema = imagen.dataset.system;
    const configuracion = mapaSistemas[sistema];

    if (!configuracion) return;

    event.preventDefault();

    const tarjeta = document.getElementById(
      configuracion.tarjeta
    );

    if (!tarjeta) {
      console.error(
        'No se encontró la tarjeta del sistema:',
        configuracion.tarjeta
      );
      return;
    }

    cerrarMenu();

    tarjeta.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    tarjeta.classList.remove('tarjeta-seleccionada');

    void tarjeta.offsetWidth;

    tarjeta.classList.add('tarjeta-seleccionada');

    setTimeout(() => {
      tarjeta.classList.remove('tarjeta-seleccionada');
    }, 1800);
  });
});


/* =====================================================
   6. WHATSAPP
===================================================== */

const WHATSAPP_SOCIA = '526644738497';

const nombresSistema = {
  xpress: 'Sistema XPRESS',
  pro: 'Sistema PRO',
  custom: 'Sistema CUSTOM',
  landing: 'Sistema LANDING',
  agenda: 'Sistema AGENDA',
  elite: 'Sistema ÉLITE'
};

function abrirWhatsApp(sistema) {
  const texto =
    sistema && nombresSistema[sistema]
      ? `Hola, me interesa conocer más sobre ${nombresSistema[sistema]}. ¿Me puedes orientar?`
      : 'Hola, quiero información sobre los sistemas de Mi Localito.';

  const url =
    `https://wa.me/${WHATSAPP_SOCIA}?text=${encodeURIComponent(texto)}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}


// Botones de contacto de cada sistema.
document.querySelectorAll('[data-select-system]').forEach(button => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    abrirWhatsApp(button.dataset.selectSystem);
  });
});


// Contacto general.
['waSocio', 'btnWa'].forEach(id => {
  const enlace = document.getElementById(id);

  if (enlace) {
    enlace.addEventListener('click', event => {
      event.preventDefault();
      abrirWhatsApp('');
    });
  }
});


// Contacto desde el footer antiguo, si todavía existe.
document.querySelectorAll('.foot-col.wa').forEach(enlace => {
  enlace.addEventListener('click', event => {
    event.preventDefault();
    abrirWhatsApp('');
  });
});


/* =====================================================
   7. FOOTER DE SOCIOS
   Botón para solicitar información para unirse
===================================================== */

const botonUnirseWhatsApp =
  document.getElementById('btnUnirseWhatsApp');

if (botonUnirseWhatsApp) {
  botonUnirseWhatsApp.addEventListener('click', event => {
    event.preventDefault();

    const textoUnirse =
      'Hola, quiero conocer cómo unirme como socio a la plataforma de Mi Localito. ¿Me puedes explicar cómo funciona?';

    const urlUnirse =
      `https://wa.me/${WHATSAPP_SOCIA}?text=${encodeURIComponent(textoUnirse)}`;

    window.open(urlUnirse, '_blank', 'noopener,noreferrer');
  });
}