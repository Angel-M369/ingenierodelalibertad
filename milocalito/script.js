// SCRIPT MI LOCALITO - FINAL V6 - PRECIOS $1,999 / $3,499 / $4,999 + SLIDER 3D + HERO + SOCIOS + GA4 G-0S14JTTS9D
document.addEventListener('DOMContentLoaded', () => {

    // ===== SISTEMA DE SOCIOS =====
    const params = new URLSearchParams(window.location.search);
    const refUrl = params.get('ref');
    if (refUrl) {
        localStorage.setItem('ml_ref', refUrl.toUpperCase().trim());
        window.history.replaceState({}, '', window.location.pathname);
    }
    const socioActivo = localStorage.getItem('ml_ref') || 'DIRECTO';

    document.querySelectorAll('a[href*="mpago.la"]').forEach(a => {
        try {
            const url = new URL(a.href);
            if (socioActivo!== 'DIRECTO') {
                url.searchParams.set('external_reference', socioActivo);
                url.searchParams.set('ref', socioActivo);
                a.href = url.toString();
            }
        } catch(e) {}
    });

    if (socioActivo!== 'DIRECTO' && typeof gtag!== 'undefined') {
        gtag('event', 'socio_detectado', { 'ref_socio': socioActivo });
    }

    // ===== HERO - IMAGEN APARECE EN BUCLE + FIX SCROLL =====
    function animarHero() {
        const box = document.getElementById('hero-anim-box');
        if (!box) return;
        box.classList.remove('animar');
        void box.offsetWidth;
        box.classList.add('animar');
    }

    setTimeout(animarHero, 300);

    const heroEl = document.getElementById('inicio');
    if (heroEl) {
        const heroObs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) animarHero();
            });
        }, { threshold: 0.3 });
        heroObs.observe(heroEl);
    }

    document.querySelectorAll('a[href="#inicio"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const hero = document.getElementById('inicio');
            if (hero) {
                const headerOffset = 90;
                const elementPosition = hero.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                setTimeout(animarHero, 600);
            }
            const menuCheck = document.getElementById('menu-check');
            if (menuCheck) menuCheck.checked = false;
        });
    });

    // ===== MENÚ =====
    const menuCheck = document.getElementById('menu-check');
    const overlay = document.querySelector('.overlay');

    document.querySelectorAll('.nav a:not([href="#inicio"])').forEach(link => {
        link.addEventListener('click', () => {
            if (menuCheck) menuCheck.checked = false;
        });
    });

    if (overlay && menuCheck) {
        overlay.addEventListener('click', () => {
            menuCheck.checked = false;
        });
    }

    // ===== SLIDER 3D INFINITO COVERFLOW =====
    const track3d = document.getElementById('slider3dTrack');
    const cont3d = document.getElementById('slider3d');
    if (track3d && cont3d) {
        let current = 0;
        const slides = Array.from(track3d.children);
        const total = slides.length;
        let autoPlay = null;
        let isHover = false;
        let startX = 0;
        let isDragging = false;

        function render() {
            slides.forEach((slide, i) => {
                let diff = i - current;
                if (diff > total / 2) diff -= total;
                if (diff < -total / 2) diff += total;

                const absDiff = Math.abs(diff);
                if (absDiff > 3) {
                    slide.style.opacity = '0';
                    slide.style.pointerEvents = 'none';
                } else {
                    slide.style.opacity = '1';
                    slide.style.pointerEvents = 'auto';
                    const x = diff * 220;
                    const rotate = diff * -35;
                    const scale = 1 - absDiff * 0.18;
                    const z = 100 - absDiff * 20;
                    const brightness = 1 - absDiff * 0.25;
                    slide.style.transform = `translate3d(-50%, -50%, 0) translateX(${x}px) rotateY(${rotate}deg) scale(${scale})`;
                    slide.style.zIndex = z;
                    slide.style.filter = `brightness(${brightness})`;
                }
                if (diff === 0) {
                    slide.style.transform += ' translateZ(80px)';
                    slide.style.zIndex = 200;
                }
            });
        }

        function next() { current = (current + 1) % total; render(); }
        function prev() { current = (current - 1 + total) % total; render(); }
        function startAuto() { if (autoPlay) clearInterval(autoPlay); autoPlay = setInterval(() => { if (!isHover &&!isDragging) next(); }, 2800); }
        function stopAuto() { if (autoPlay) clearInterval(autoPlay); }

        render();
        startAuto();

        cont3d.addEventListener('mouseenter', () => { isHover = true; stopAuto(); });
        cont3d.addEventListener('mouseleave', () => { isHover = false; startAuto(); });

        track3d.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' &&!isDragging) {
                const idx = slides.indexOf(e.target);
                if (idx === current) {
                    const targetId = e.target.dataset.target;
                    const destino = document.getElementById(targetId);
                    if (destino) {
                        const headerOffset = 85;
                        const pos = destino.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                        window.scrollTo({ top: pos, behavior: 'smooth' });
                        if (typeof gtag!== 'undefined') {
                            gtag('event', 'click_slider3d', { 'sistema': targetId, 'ref_socio': socioActivo });
                        }
                    }
                } else {
                    current = idx;
                    render();
                }
            }
        });

        cont3d.addEventListener('mousedown', (e) => { isDragging = false; startX = e.clientX; stopAuto(); });
        cont3d.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) {
                const diff = e.clientX - startX;
                if (Math.abs(diff) > 10) isDragging = true;
            }
        });
        cont3d.addEventListener('mouseup', (e) => {
            const diff = e.clientX - startX;
            if (Math.abs(diff) > 50) { if (diff < 0) next(); else prev(); }
            setTimeout(() => { isDragging = false; if (!isHover) startAuto(); }, 100);
        });
        cont3d.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stopAuto(); }, { passive: true });
        cont3d.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 50) { if (diff < 0) next(); else prev(); }
            if (!isHover) startAuto();
        }, { passive: true });
    }

    // ===== MEDICIÓN - PRECIOS NUEVOS $1,999 / $3,499 / $4,999 =====
    document.querySelectorAll('a[href*="mpago.la"]').forEach(btn => {
        btn.addEventListener('click', () => {
            let plan = 'desconocido';
            let value = 0;
            let sistema = btn.closest('.arma-card')?.id || 'madre';
            if (btn.href.includes('12MJpos')) { plan = 'ESENCIAL $1,999'; value = 1999; }
            else if (btn.href.includes('1je1Jwm')) { plan = 'PROFESIONAL $3,499'; value = 3499; }
            else if (btn.href.includes('1SrtN5r')) { plan = 'NEGOCIO TOTAL $4,999'; value = 4999; }
            if (typeof gtag!== 'undefined') {
                gtag('event', 'click_pago', { 'plan': plan, 'sistema_origen': sistema, 'ref_socio': socioActivo, 'value': value, 'currency': 'MXN' });
                gtag('event', 'begin_checkout', { 'value': value, 'currency': 'MXN', 'ref_socio': socioActivo, 'items': [{ 'item_name': plan + ' - ' + sistema, 'affiliation': socioActivo }] });
            }
        });
    });

    document.querySelectorAll('a[href*="/express/"], a[href*="/pro/"], a[href*="/custom/"], a[href*="/landing/"], a[href*="/agenda/"], a[href*="/elite/"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof gtag!== 'undefined') {
                gtag('event', 'view_demo', { 'demo': btn.getAttribute('href'), 'origen': 'madre', 'ref_socio': socioActivo });
            }
        });
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
        btn.addEventListener('click', () => {
            try {
                if (socioActivo!== 'DIRECTO') {
                    const url = new URL(btn.href);
                    const textoActual = url.searchParams.get('text') || '';
                    if (!textoActual.toLowerCase().includes('ref:')) {
                        url.searchParams.set('text', textoActual + ` (Ref: ${socioActivo})`);
                        btn.href = url.toString();
                    }
                }
            } catch(e) {}
            if (typeof gtag!== 'undefined') {
                gtag('event', 'click_whatsapp', { 'sistema': 'madre_milocalito', 'ubicacion': btn.closest('section')?.id || 'footer', 'ref_socio': socioActivo });
            }
        });
    });

    // ===== QUIZ - PRECIOS NUEVOS =====
    let tipoVenta = '';
    const btnsPaso1 = document.querySelectorAll('.quiz-step[data-step="1"].quiz-btn');
    const btnsFinal = document.querySelectorAll('.quiz-btn.final');

    btnsPaso1.forEach(btn => {
        btn.addEventListener('click', () => {
            tipoVenta = btn.dataset.value;
            document.querySelector('.quiz-step.active')?.classList.remove('active');
            if (tipoVenta === 'producto') {
                document.querySelector('[data-step="2a"]')?.classList.add('active');
            } else {
                document.querySelector('[data-step="2b"]')?.classList.add('active');
            }
            if (typeof gtag!== 'undefined') {
                gtag('event', 'quiz_step1', { 'tipo': tipoVenta, 'ref_socio': socioActivo });
            }
        });
    });

    btnsFinal.forEach(btn => {
        btn.addEventListener('click', () => {
            const armaId = btn.dataset.arma;
            const textos = {
                'plan-express': { t: 'TU SISTEMA ES: XPRESS - ESENCIAL $1,999', d: 'Vendes local, no necesitas pagos con tarjeta. Venta directa por WhatsApp.' },
                'plan-pro': { t: 'TU SISTEMA ES: PRO - PROFESIONAL $3,499', d: 'Necesitas cobrar antes de enviar. Carrito + MercadoPago para todo México.' },
                'plan-custom': { t: 'TU SISTEMA ES: CUSTOM - NEGOCIO TOTAL $4,999', d: 'Tienes +50 productos. Necesitas cotizador automático + stock real.' },
                'plan-landing': { t: 'TU SISTEMA ES: LANDING - ESENCIAL $1,999', d: 'Tu bronca es que no llegan clientes. Landing de 1 pantalla que convierte.' },
                'plan-agenda': { t: 'TU SISTEMA ES: AGENDA - PROFESIONAL $3,499', d: 'Tu bronca es organización. Agenda donde el cliente agenda solo 24/7.' },
                'plan-elite': { t: 'TU SISTEMA ES: ÉLITE - NEGOCIO TOTAL $4,999', d: 'Te cancelan y pierdes dinero. Sistema que cobra anticipo obligatorio.' },
                'plan-dueno': { t: 'TU SISTEMA ES: ÉLITE - NEGOCIO TOTAL $4,999', d: 'Sistema completo: captar + agendar + cobrar anticipo.' }
            };
            document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
            document.querySelector('[data-step="resultado"]')?.classList.add('active');
            const tit = document.getElementById('resultado-titulo');
            const txt = document.getElementById('resultado-texto');
            if (tit) tit.innerText = textos[armaId]?.t || 'TU SISTEMA';
            if (txt) txt.innerText = textos[armaId]?.d || '';
            const btnResultado = document.getElementById('resultado-btn');
            if (btnResultado) {
                btnResultado.href = '#' + armaId;
                btnResultado.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById(armaId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                };
            }
            if (typeof gtag!== 'undefined') {
                gtag('event', 'quiz_result', { 'sistema_recomendado': armaId, 'tipo_venta': tipoVenta, 'ref_socio': socioActivo });
            }
        });
    });
});

function reiniciarQuiz() {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.querySelector('[data-step="1"]')?.classList.add('active');
    const socioActivo = localStorage.getItem('ml_ref') || 'DIRECTO';
    if (typeof gtag!== 'undefined') {
        gtag('event', 'quiz_restart', { 'ref_socio': socioActivo });
    }
}