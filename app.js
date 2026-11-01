(function () {
  const appRoot = document.getElementById('app');

  window.CSEHub.state = Object.assign(window.CSEHub.state || {}, {
    route: 'home',
    filters: {}
  });

  function resolveRoute() {
    const hash = window.location.hash.replace('#', '').trim();
    if (!hash) return 'home';
    const normalized = hash.split('/')[0];
    return normalized || 'home';
  }

  function renderPage() {
    const route = resolveRoute();
    window.CSEHub.state.route = route;
    const renderers = {
      home: window.CSEHub.renderHome,
      faculty: window.CSEHub.renderFaculty,
      projects: window.CSEHub.renderProjects,
      admin: window.CSEHub.renderAdmin,
      hackathons: window.CSEHub.renderHackathons,
      'problem-statements': window.CSEHub.renderProblemStatements,
      clubs: window.CSEHub.renderClubs
    };
    const render = renderers[route] || renderers.home;

    if (typeof render === 'function') {
      render(appRoot);
      return;
    }
    appRoot.innerHTML = '<section class="section"><div class="container-xl"><div class="empty-state"><h3>Page content unavailable</h3><p>This page could not be loaded.</p></div></div></section>';
  }

  function initialise() {
    window.addEventListener('hashchange', renderPage);
    window.CSEHub.renderApp = renderPage;
    renderPage();
  }

  initialise();
})();
