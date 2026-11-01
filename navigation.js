window.CSEHub = window.CSEHub || {};

(function () {
  function updateNavState() {
    const hash = (window.location.hash || '#home').replace('#', '') || 'home';
    const links = document.querySelectorAll('.nav-link');
    links.forEach((link) => {
      const href = (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', href === hash);
    });
  }

  function handleMenuToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  window.addEventListener('hashchange', updateNavState);
  document.addEventListener('DOMContentLoaded', () => {
    updateNavState();
    handleMenuToggle();
  });
})();
