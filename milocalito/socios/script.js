document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('afiliadoForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const wa = document.getElementById('wa').value.trim();
    const tipo = document.getElementById('tipo').value;

    if(!nombre || !wa){
      alert('Pon tu nombre y tu WhatsApp socio');
      return;
    }

    const mensaje = `Hola, soy ${nombre} vi la pagina de Claudia Puebla y quiero ser ${tipo}. Mi WA es ${wa}`;
    const url = `https://wa.me/5210000000000?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  });
});