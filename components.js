window.CSEHub = window.CSEHub || {};

window.CSEHub.renderSectionHeader = function (title, description, actionLink, actionLabel) {
  return `
    <div class="section-header">
      <div>
        <h2>${title}</h2>
        ${description ? `<p>${description}</p>` : ''}
      </div>
      ${actionLink ? `<a class="inline-link" href="${actionLink}">${actionLabel || 'View all'}</a>` : ''}
    </div>
  `;
};

window.CSEHub.renderCard = function (card) {
  const imageHtml = card.image ? `<div class="card-media"><img src="${card.image}" alt="${card.alt || card.title || 'Department card'}" loading="lazy" /></div>` : '';
  return `
    <article class="card">
      ${imageHtml}
      <div class="card-body">
        ${card.badge ? `<span class="badge ${card.badgeClass || 'info'}">${card.badge}</span>` : ''}
        <h3>${card.title}</h3>
        ${card.subtitle ? `<p class="meta-note">${card.subtitle}</p>` : ''}
        ${card.summary ? `<p>${card.summary}</p>` : ''}
        ${card.meta ? `<div class="card-meta"><span>${card.meta.left || ''}</span><span>${card.meta.right || ''}</span></div>` : ''}
        ${card.link ? `<div class="card-actions"><span></span><a class="flat-link" href="${card.link}">${card.linkLabel || 'Explore'}</a></div>` : ''}
      </div>
    </article>
  `;
};

window.CSEHub.renderEmptyState = function (title, message) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
};

window.CSEHub.createFilterBar = function (options, activeValue, onSelect) {
  const buttons = options.map((option) => {
    const active = option.value === activeValue ? 'active' : '';
    return `<button type="button" class="filter-chip ${active}" data-filter-value="${option.value}">${option.label}</button>`;
  }).join('');

  return `
    <div class="filter-bar" aria-label="Filters">
      ${buttons}
    </div>
  `;
};
