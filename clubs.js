window.CSEHub = window.CSEHub || {};

window.CSEHub.renderClubs = function (appRoot) {
  const clubs = [
    {
      name: 'Masters Club',
      summary: 'Creative and collaborative student ecosystem for technical challenge, peer learning, and community initiative support.',
      image: 'masters-club-logo.jpg',
      imageAlt: 'Computer Science Executive Council, Pragati University emblem',
      imageFit: 'contain'
    },
    {
      name: 'AR/VR Club',
      summary: 'Immersive technology exploration and applied development across interactive experiences and demos.',
      image: 'ar-vr-club-logo.jpeg',
      imageAlt: 'AR VR Club logo with Reality Redefined tagline',
      imageFit: 'contain'
    },
    {
      name: 'Rotaract Club',
      summary: 'Service-driven student community engagement focused on leadership, volunteering, and outreach.',
      image: 'rotaract-club-logo.jpeg',
      imageAlt: 'Rotaract Club logo',
      imageFit: 'contain'
    },
    {
      name: 'Pragsoft Club',
      summary: 'Software and problem-solving club for skill growth, coding practice, and collaborative project builds.',
      image: 'pragsoft-club-logo.jpeg',
      imageAlt: 'Pragsoft Club logo',
      imageFit: 'contain'
    }
  ];

  const cards = clubs.map((club) => `
    <article class="card">
      <div class="card-media${club.imageFit === 'contain' ? ' club-logo' : ''}"><img src="${club.image}" alt="${club.imageAlt || club.name}" loading="lazy" /></div>
      <div class="card-body">
        <span class="badge info">Club</span>
        <h3>${club.name}</h3>
        <p>${club.summary}</p>
      </div>
    </article>
  `).join('');

  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Clubs', 'Official club communities hosted within the department ecosystem.', '#', 'Explore all')} 
        <div class="card-grid">${cards}</div>
      </div>
    </section>
  `;
};
