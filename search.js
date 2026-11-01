window.CSEHub = window.CSEHub || {};

window.CSEHub.filterCardsInSection = function (root) {
  const panel = root || document;
  const inputs = panel.querySelectorAll('.search-panel input, .search-panel select');
  if (!inputs.length) return;

  const cards = Array.from(panel.querySelectorAll('.card'));

  function applyFilter() {
    const searchValue = (panel.querySelector('.search-panel input')?.value || '').trim().toLowerCase();
    const categorySelect = panel.querySelectorAll('.search-panel select')[0];
    const categoryValue = categorySelect ? categorySelect.value.toLowerCase() : '';
    const yearSelect = panel.querySelectorAll('.search-panel select')[1];
    const yearValue = yearSelect ? yearSelect.value.toLowerCase() : '';

    let visibleCount = 0;
    cards.forEach((card) => {
      const cardText = (card.textContent || '').toLowerCase();
      const matchesQuery = !searchValue || cardText.includes(searchValue);
      const matchesCategory = !categoryValue || categoryValue === 'all categories' || categoryValue === 'all' || categoryValue === 'all years' || categoryValue === 'all outcomes' || categoryValue === 'all designations' || categoryValue === 'all subjects' || categoryValue === 'all roles' || categoryValue === 'all batches' || !cardText.includes(categoryValue);
      const matchesYear = !yearValue || yearValue === 'all' || yearValue === 'all years' || yearValue === 'all batches' || !cardText.includes(yearValue);

      const visible = matchesQuery && matchesCategory && matchesYear;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });

    const emptyState = panel.querySelector('.dynamic-empty-state');
    if (emptyState) emptyState.remove();

    if (visibleCount === 0) {
      const fallback = document.createElement('div');
      fallback.className = 'empty-state dynamic-empty-state';
      fallback.innerHTML = '<h3>No matching records</h3><p>Try a broader keyword, different year, or reset the filters.</p>';
      panel.querySelector('.card-grid, .stats-grid, .gallery-grid')?.after(fallback);
    }
  }

  inputs.forEach((input) => input.addEventListener('input', applyFilter));
  inputs.forEach((input) => input.addEventListener('change', applyFilter));
  applyFilter();
};

window.CSEHub.renderSearchPage = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        <div class="section-header">
          <div>
            <p class="eyebrow">Search</p>
            <h2>Global department search</h2>
            <p>Search public content across faculty, projects, hackathons, problem statements, and clubs.</p>
          </div>
        </div>
        <div class="search-panel">
          <input type="search" id="global-search-input" placeholder="Search records, teams, events, research, clubs, or keywords" aria-label="Global search" />
        </div>
        <div id="global-search-results" class="card-grid"></div>
      </div>
    </section>
  `;

  const results = [
    { title: 'Faculty Directory', category: 'Faculty', href: '#faculty', summary: 'CSE faculty names and designations.' },
    { title: 'Our Projects', category: 'Projects', href: '#projects', summary: 'Projects built by CSE students and teams.' },
    { title: 'Hackathon Experience', category: 'Hackathons', href: '#hackathons', summary: 'Student stories about what they built, their teamwork, challenges, and how the hackathon felt.' },
    { title: 'Problem Statements', category: 'Projects', href: '#problem-statements', summary: 'Issues students and faculty face that could be solved with an app or website.' },
    { title: 'Club portal', category: 'Clubs', href: '#clubs', summary: 'Masters Club, AR/VR Club, Rotaract Club, and Pragsoft Club information.' }
  ];

  const input = document.getElementById('global-search-input');
  const resultHost = document.getElementById('global-search-results');

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const filtered = results.filter((item) => !q || `${item.title} ${item.category} ${item.summary}`.toLowerCase().includes(q));

    if (!filtered.length) {
      resultHost.innerHTML = '<div class="empty-state"><h3>No results found</h3><p>Your search did not match any public section. Try a different keyword or browse the department pages.</p></div>';
      return;
    }

    resultHost.innerHTML = filtered.map((item) => `
      <article class="card">
        <div class="card-body">
          <span class="badge info">${item.category}</span>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <div class="card-actions"><span></span><a class="flat-link" href="${item.href}">Open</a></div>
        </div>
      </article>
    `).join('');
  }

  input.addEventListener('input', (event) => renderResults(event.target.value));
  renderResults('');
};

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const searchInputs = document.querySelectorAll('.search-panel input, .search-panel select');
    if (searchInputs.length && !document.getElementById('faculty-search')) {
      window.CSEHub.filterCardsInSection(document);
    }
  });
})();
