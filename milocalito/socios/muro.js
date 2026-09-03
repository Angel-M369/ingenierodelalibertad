// MENU HAMBURGUESA
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Cerrar menu al dar click en un link
document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// FILTRO MURO
const botones = document.querySelectorAll('.filtros button');
const cards = document.querySelectorAll('#grid .card');

botones.forEach(btn => {
    btn.addEventListener('click', () => {
        const tipo = btn.dataset.filter;

        botones.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        cards.forEach(card => {
            if (tipo === 'todos') {
                card.style.display = 'flex';
            } else {
                const esVacio = card.classList.contains('vacio');
                const coincide = card.classList.contains(tipo);
                card.style.display = (coincide || esVacio) ? 'flex' : 'none';
            }
        });
    });
});