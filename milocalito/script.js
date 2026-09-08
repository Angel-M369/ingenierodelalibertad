// SCRIPT MI LOCALITO - 6 SISTEMAS + MEDICIÓN MAESTRA G-0S14JTTS9D + SISTEMA DE SOCIOS V1 - FINAL - CORREGIDO
document.addEventListener('DOMContentLoaded', () => {
    // ===== SISTEMA DE SOCIOS - 24/7 TRACKING =====
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
        } catch(e){}
    });

    if (socioActivo!== 'DIRECTO' && typeof gtag!== 'undefined') {
        gtag('event', 'socio_detectado', { 'ref_socio': socioActivo });
    }

    // Cerrar menú
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', () => {
            const chk = document.getElementById('menu-check');
            if(chk) chk.checked = false;
        });
    });

    // ===== MEDICIÓN MAESTRA MADRE + REF =====
    document.querySelectorAll('a[href*="mpago.la"]').forEach(btn=>{
        btn.addEventListener('click',()=>{
            let plan = 'desconocido';
            let value = 0;
            let sistema = btn.closest('.arma-card')?.id || 'madre';
            if(btn.href.includes('12MJpos')){ plan = 'ESENCIAL $3,999'; value = 3999; }
            else if(btn.href.includes('1je1Jwm')){ plan = 'PROFESIONAL $6,999'; value = 6999; }
            else if(btn.href.includes('1SrtN5r')){ plan = 'NEGOCIO TOTAL $9,999'; value = 9999; }
            if(typeof gtag!== 'undefined'){
                gtag('event', 'click_pago', { 'plan': plan, 'sistema_origen': sistema, 'ref_socio': socioActivo, 'value': value, 'currency': 'MXN' });
                gtag('event', 'begin_checkout', { 'value': value, 'currency': 'MXN', 'ref_socio': socioActivo, 'items': [{ 'item_name': plan + ' - ' + sistema, 'affiliation': socioActivo }] });
            }
        });
    });

    document.querySelectorAll('a[href*="/express/"], a[href*="/pro/"], a[href*="/custom/"], a[href*="/landing/"], a[href*="/agenda/"], a[href*="/elite/"]').forEach(btn=>{
        btn.addEventListener('click',()=>{
            if(typeof gtag!== 'undefined'){
                gtag('event', 'view_demo', { 'demo': btn.getAttribute('href'), 'origen': 'madre', 'ref_socio': socioActivo });
            }
        });
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(btn=>{
        btn.addEventListener('click',()=>{
            try {
                if (socioActivo!== 'DIRECTO') {
                    const url = new URL(btn.href);
                    const textoActual = url.searchParams.get('text') || '';
                    if (!textoActual.toLowerCase().includes('ref:')) {
                        url.searchParams.set('text', textoActual + ` (Ref: ${socioActivo})`);
                        btn.href = url.toString();
                    }
                }
            } catch(e){}
            if(typeof gtag!== 'undefined'){
                gtag('event', 'click_whatsapp', { 'sistema': 'madre_milocalito', 'ubicacion': btn.closest('section')?.id || 'footer', 'ref_socio': socioActivo });
            }
        });
    });

    // ===== QUIZ LOGICA - CORREGIDO DEFINITIVO =====
    let tipoVenta = '';
    // CORREGIDO: ahora sí con espacio entre el contenedor y el botón
    const btnsPaso1 = document.querySelectorAll('.quiz-step[data-step="1"] .quiz-btn');
    const btnsFinal = document.querySelectorAll('.quiz-btn.final');

    btnsPaso1.forEach(btn => {
        btn.addEventListener('click', () => {
            tipoVenta = btn.dataset.value;
            document.querySelector('.quiz-step.active')?.classList.remove('active');
            if(tipoVenta === 'producto'){
                document.querySelector('[data-step="2a"]')?.classList.add('active');
            } else {
                document.querySelector('[data-step="2b"]')?.classList.add('active');
            }
            if(typeof gtag!== 'undefined'){
                gtag('event', 'quiz_step1', { 'tipo': tipoVenta, 'ref_socio': socioActivo });
            }
        });
    });

    btnsFinal.forEach(btn => {
        btn.addEventListener('click', () => {
            const armaId = btn.dataset.arma;
            const textos = {
                'plan-express':{t:'TU SISTEMA ES: XPRESS - ESENCIAL $3,999',d:'Vendes local, no necesitas pagos con tarjeta. Venta directa por WhatsApp.'},
                'plan-pro':{t:'TU SISTEMA ES: PRO - PROFESIONAL $6,999',d:'Necesitas cobrar antes de enviar. Carrito + MercadoPago para todo México.'},
                'plan-custom':{t:'TU SISTEMA ES: CUSTOM - NEGOCIO TOTAL $9,999',d:'Tienes +50 productos. Necesitas cotizador automático + stock real.'},
                'plan-landing':{t:'TU SISTEMA ES: LANDING - ESENCIAL $3,999',d:'Tu bronca es que no llegan clientes. Landing de 1 pantalla que convierte.'},
                'plan-agenda':{t:'TU SISTEMA ES: AGENDA - PROFESIONAL $6,999',d:'Tu bronca es organización. Agenda donde el cliente agenda solo 24/7.'},
                'plan-elite':{t:'TU SISTEMA ES: ÉLITE - NEGOCIO TOTAL $9,999',d:'Te cancelan y pierdes dinero. Sistema que cobra anticipo obligatorio.'},
                'plan-dueno':{t:'TU SISTEMA ES: ÉLITE - NEGOCIO TOTAL $9,999',d:'Sistema completo: captar + agendar + cobrar anticipo.'}
            };
            document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
            document.querySelector('[data-step="resultado"]')?.classList.add('active');
            document.getElementById('resultado-titulo').innerText = textos[armaId]?.t || 'TU SISTEMA';
            document.getElementById('resultado-texto').innerText = textos[armaId]?.d || '';
            const btnResultado = document.getElementById('resultado-btn');
            if(btnResultado){
                btnResultado.href = '#'+armaId;
                btnResultado.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById(armaId)?.scrollIntoView({behavior:'smooth', block:'center'});
                };
            }
            if(typeof gtag!== 'undefined'){
                gtag('event', 'quiz_result', { 'sistema_recomendado': armaId, 'tipo_venta': tipoVenta, 'ref_socio': socioActivo });
            }
        });
    });
});

function reiniciarQuiz(){
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.querySelector('[data-step="1"]')?.classList.add('active');
    const socioActivo = localStorage.getItem('ml_ref') || 'DIRECTO';
    if(typeof gtag!== 'undefined'){
        gtag('event', 'quiz_restart', { 'ref_socio': socioActivo });
    }
}