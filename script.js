document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  // <<<< AQUI MUEVES TODO - MAS NUMERO = MAS ARRIBA >>>>
  const OFFSETS = {
    inicio: 0,
    historia: -70,
    filosofia: -70,
    construyendo: -70,
    comienzo: -70,
    'tu-camino': -70,
    footer: -70
  };

  if (toggle && nav && mobileMenu) {
    const openMenu = () => {
      nav.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      mobileMenu.setAttribute("aria-hidden", "false");
      mobileMenu.removeAttribute("inert");
      document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      // FIX: quitar foco de dentro antes de ocultar para lectores de pantalla
      const active = document.activeElement;
      if (active && mobileMenu.contains(active)) {
        active.blur();
        toggle.focus();
      }
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      mobileMenu.setAttribute("aria-hidden", "true");
      mobileMenu.setAttribute("inert", "");
      document.body.style.overflow = "";
    };

    toggle.addEventListener("click", () => {
      nav.classList.contains("nav-open")? closeMenu() : openMenu();
    });

    document.querySelectorAll(".mobile-menu-links a,.nav-links a").forEach(l => {
      l.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && nav.classList.contains("nav-open")) closeMenu();
    });

    document.addEventListener("click", e => {
      if (nav.classList.contains("nav-open") &&!nav.contains(e.target)) closeMenu();
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(r => obs.observe(r));
  } else {
    reveals.forEach(r => r.classList.add("visible"));
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const id = href.replace('#','');
      const extra = OFFSETS[id]!== undefined? OFFSETS[id] : 120;
      const top = target.getBoundingClientRect().top + window.scrollY - document.querySelector('.nav').offsetHeight - extra;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  const scrollCue = document.querySelector(".scroll-cue");
  if (scrollCue) {
    window.addEventListener("scroll", () => {
      scrollCue.style.opacity = window.scrollY > 100? "0" : "1";
    }, { passive: true });
  }
});