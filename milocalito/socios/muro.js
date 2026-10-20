/* EL MURO DE SOCIOS — menú, filtros, hero loop y animaciones */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // ELEMENTOS PRINCIPALES
  // ==========================================
  const toggle = document.getElementById("menuToggle");
  const panel = document.getElementById("menuPanel");
  const overlay = document.getElementById("menuOverlay");
  const links = document.querySelectorAll(".menu-enlace");

  const year = document.getElementById("anioActual");
  const search = document.getElementById("buscarSocio");
  const cityFilter = document.getElementById("filtroCiudad");
  const list = document.getElementById("listaSocios");
  const empty = document.getElementById("estadoDirectorio");
  const noResults = document.getElementById("sinResultados");
  const counter = document.getElementById("contadorSocios");

  // HERO ELEMENTS
  const hero = document.getElementById("inicio");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // ==========================================
  // DIRECTORIO DE SOCIOS
  // ==========================================
  const socios = [];

  // ==========================================
  // HERO LOOP - SOLO TEXTOS - IMAGEN SIEMPRE VISIBLE - INFINITO
  // ==========================================
  let heroLoopTimeout;
  let heroOutTimeout;

  function playHero() {
    if (!hero) return;
    
    clearTimeout(heroLoopTimeout);
    clearTimeout(heroOutTimeout);

    // Reinicia animación de textos, la imagen no se toca
    hero.classList.remove("is-leaving");
    hero.classList.remove("is-animating");
    void hero.offsetWidth; // fuerza reflow para reiniciar animación
    hero.classList.add("is-animating");

    // 5s visible + 0.8s salida = loop cada 5.8s
    heroLoopTimeout = setTimeout(() => {
      hero.classList.add("is-leaving");
      heroOutTimeout = setTimeout(() => {
        playHero();
      }, 800);
    }, 5000);
  }

  if (hero) {
    playHero();

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playHero();
          }
        });
      }, { threshold: 0.1 });
      heroObserver.observe(hero);
    }

    const inicioTriggers = document.querySelectorAll(
      'a[href="#inicio"], a[href="#muro"], a.logo, a.footer-logo, .scroll-cue'
    );
    inicioTriggers.forEach((el) => {
      el.addEventListener("click", () => {
        setTimeout(playHero, 120);
      });
    });
  }

  // ==========================================
  // MENÚ HAMBURGUESA
  // ==========================================
  function closeMenu(returnFocus = false) {
    if (!toggle || !panel || !overlay) return;
    panel.classList.remove("activo");
    overlay.classList.remove("activo");
    document.body.classList.remove("menu-abierto");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    panel.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    panel.inert = true;
    if (returnFocus) toggle.focus();
  }

  function openMenu() {
    if (!toggle || !panel || !overlay) return;
    panel.classList.add("activo");
    overlay.classList.add("activo");
    document.body.classList.add("menu-abierto");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    panel.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    panel.inert = false;
  }

  if (toggle && panel && overlay) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });
    overlay.addEventListener("click", () => closeMenu());
    panel.addEventListener("click", () => closeMenu());
    links.forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu(true);
      }
    });
    closeMenu();
  }

  // ==========================================
  // NORMALIZAR TEXTO
  // ==========================================
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // ==========================================
  // CREAR TARJETAS
  // ==========================================
  function makeCard(socio) {
    const article = document.createElement("article");
    article.className = "socio-card reveal visible";
    const top = document.createElement("div");
    top.className = "socio-card-top";
    const avatar = document.createElement("div");
    avatar.className = "socio-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = socio.initials || String(socio.name || "S").trim().slice(0, 2).toUpperCase();
    const identity = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = socio.name || "Socio autorizado";
    const status = document.createElement("span");
    status.className = "socio-estado";
    status.textContent = "SOCIO AUTORIZADO · MI LOCALITO";
    identity.append(heading, status);
    top.append(avatar, identity);
    const location = document.createElement("p");
    location.className = "socio-ubicacion";
    location.textContent = socio.location || "";
    const description = document.createElement("p");
    description.className = "socio-descripcion";
    description.textContent = socio.description || "Conoce esta oficina dentro del ecosistema Mi Localito.";
    const link = document.createElement("a");
    link.className = "socio-enlace";
    link.href = socio.url || "#";
    link.textContent = "VISITAR OFICINA ";
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(arrow);
    article.append(top);
    if (location.textContent) article.append(location);
    article.append(description, link);
    return article;
  }

  // ==========================================
  // MOSTRAR Y FILTRAR
  // ==========================================
  function renderSocios() {
    if (!list) return;
    const query = normalize(search?.value);
    const city = normalize(cityFilter?.value);
    const filtered = socios.filter((socio) => {
      const searchableText = normalize(`${socio.name || ""} ${socio.location || ""} ${socio.description || ""}`);
      const matchesSearch = searchableText.includes(query);
      const matchesCity = !city || normalize(socio.location) === city;
      return matchesSearch && matchesCity;
    });
    list.replaceChildren(...filtered.map(makeCard));
    if (counter) counter.textContent = String(socios.length);
    if (empty) empty.hidden = socios.length > 0;
    if (noResults) noResults.hidden = !(socios.length > 0 && filtered.length === 0);
  }

  if (cityFilter) {
    const cities = [...new Set(socios.map((s) => s.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      cityFilter.append(option);
    });
    cityFilter.addEventListener("change", renderSocios);
  }

  if (search) search.addEventListener("input", renderSocios);
  renderSocios();

  // ==========================================
  // ANIMACIONES SCROLL (reveal)
  // ==========================================
  const reveals = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => observer.observe(el));
  }
});