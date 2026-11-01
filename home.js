window.CSEHub = window.CSEHub || {};

window.CSEHub.renderHome = function (appRoot) {
  const sections = [
    {
      title: 'Faculty Directory',
      summary: 'Browse the CSE faculty directory and designations.',
      href: '#faculty',
      label: 'Faculty'
    },
    {
      title: 'Our Projects',
      summary: 'Explore approved projects or submit a CSE project for admin review.',
      href: '#projects',
      label: 'Projects'
    },
    {
      title: 'Hackathon Experience',
      summary: 'Read and share what students built and what their hackathon experience was like.',
      href: '#hackathons',
      label: 'Student stories'
    },
    {
      title: 'Problem Statements',
      summary: 'Explore issues students and faculty think an app or website could solve.',
      href: '#problem-statements',
      label: 'Ideas'
    },
    {
      title: 'Clubs',
      summary: 'Discover the Masters, AR/VR, Rotaract, and Pragsoft clubs.',
      href: '#clubs',
      label: 'Communities'
    }
  ];

  const sectionCards = sections.map((section) => `
    <article class="card">
      <div class="card-body">
        <span class="badge info">${section.label}</span>
        <h3>${section.title}</h3>
        <p>${section.summary}</p>
        <div class="card-actions"><span></span><a class="flat-link" href="${section.href}">Explore</a></div>
      </div>
    </article>
  `).join('');

  appRoot.innerHTML = `
    <section class="section hero">
      <div class="container-xl">
        <div class="hero-banner">
          <div class="hero-grid">
            <div class="hero-copy">
              <p class="eyebrow" style="color: rgba(255,255,255,0.8);">Pragati Engineering College · Computer Science and Engineering</p>
              <h1>CSE Digital Hub</h1>
              <p>A place for the CSE community to explore projects, faculty, clubs, student hackathon experiences, and real-world problems that could be addressed with technology.</p>
              <div class="hero-actions">
                <a class="btn btn-primary" href="#projects">Explore our projects</a>
                <a class="btn btn-primary" href="#hackathons">Share a hackathon experience</a>
                <a class="btn btn-secondary" href="#problem-statements">Share a problem</a>
              </div>
              <div class="hero-meta">
                <span>Learn</span>
                <span>Achieve</span>
                <span>Innovate</span>
              </div>
            </div>
            <div class="hero-visual" aria-hidden="true">
              <div class="hero-cards">
                <div class="hero-card"><span class="mini-label">Community</span><strong>Faculty & Clubs</strong></div>
                <div class="hero-card"><span class="mini-label">Built by CSE</span><strong>Our Projects</strong></div>
                <div class="hero-card"><span class="mini-label">Ideas</span><strong>App-solvable problems</strong></div>
                <div class="hero-card"><span class="mini-label">Experiences</span><strong>Hackathons</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Explore the CSE Department', 'Choose a section to learn more or contribute to the community.')}
        <div class="stats-grid">${sectionCards}</div>
      </div>
    </section>

    <section class="section">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Latest Community Submissions', 'Recent approved projects, hackathon experiences, and problem statements shared with the department.')}
        <div class="submission-feed-grid">
          <section class="submission-section" aria-labelledby="home-projects-heading">
            <h3 id="home-projects-heading">Our Projects</h3>
            <div id="home-projects-feed" class="card-grid" aria-live="polite"></div>
          </section>
          <section class="submission-section" aria-labelledby="home-hackathon-heading">
            <h3 id="home-hackathon-heading">Hackathon Experiences</h3>
            <div id="home-hackathon-feed" class="card-grid" aria-live="polite"></div>
          </section>
          <section class="submission-section" aria-labelledby="home-problem-heading">
            <h3 id="home-problem-heading">Problem Statements</h3>
            <div id="home-problem-feed" class="card-grid" aria-live="polite"></div>
          </section>
        </div>
      </div>
    </section>
  `;

  function makeFeedCard(label, titleText, details) {
    const article = document.createElement('article');
    article.className = 'card';
    const body = document.createElement('div');
    body.className = 'card-body';
    const badge = document.createElement('span');
    badge.className = 'badge info';
    badge.textContent = label;
    const title = document.createElement('h3');
    title.textContent = titleText;
    body.append(badge, title);
    details.forEach((detail) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = detail;
      body.append(paragraph);
    });
    article.append(body);
    return article;
  }

  function showEmpty(host, title, description) {
    host.innerHTML = window.CSEHub.renderEmptyState(title, description);
  }

  function showError(host, message) {
    showEmpty(host, 'Submissions are unavailable', message);
  }

  const hackathonFeed = document.getElementById('home-hackathon-feed');
  const problemFeed = document.getElementById('home-problem-feed');
  const projectFeed = document.getElementById('home-projects-feed');
  showEmpty(projectFeed, 'Loading projects...', 'Please wait while shared projects are loaded.');
  showEmpty(hackathonFeed, 'Loading experiences...', 'Please wait while shared stories are loaded.');
  showEmpty(problemFeed, 'Loading problem statements...', 'Please wait while shared ideas are loaded.');

  window.CSEHub.getSubmissions('projects')
    .then((projects) => {
      projectFeed.replaceChildren();
      if (projects.length === 0) {
        showEmpty(projectFeed, 'No approved projects yet', 'Approved CSE projects will appear here.');
        return;
      }

      projects.slice(0, 3).forEach((project) => {
        const card = makeFeedCard(project.team, project.title, [
          project.description,
          `Technologies: ${project.technologies}`
        ]);
        if (project.project_url) {
          const projectLink = document.createElement('a');
          projectLink.className = 'flat-link';
          projectLink.href = project.project_url;
          projectLink.target = '_blank';
          projectLink.rel = 'noopener noreferrer';
          projectLink.textContent = 'View project';
          card.querySelector('.card-body').append(projectLink);
        }
        projectFeed.append(card);
      });
    })
    .catch((error) => {
      showError(projectFeed, `Could not load projects: ${error.message}`);
    });

  window.CSEHub.getSubmissions('hackathon-stories')
    .then((stories) => {
      hackathonFeed.replaceChildren();
      if (stories.length === 0) {
        showEmpty(hackathonFeed, 'No approved hackathon experiences yet', 'Approved hackathon stories will appear here.');
        return;
      }

      stories.slice(0, 3).forEach((story) => {
        hackathonFeed.append(makeFeedCard(story.event, story.author, [
          `What they built: ${story.project}`,
          `Place and atmosphere: ${story.venue}`,
          `People: ${story.people}`,
          `Experience: ${story.experience}`
        ]));
      });
    })
    .catch((error) => {
      showError(hackathonFeed, `Could not load hackathon experiences: ${error.message}`);
    });

  window.CSEHub.getSubmissions('problem-statements')
    .then((statements) => {
      problemFeed.replaceChildren();
      if (statements.length === 0) {
        showEmpty(problemFeed, 'No problem statements yet', 'Be the first to share an issue an app or website could solve.');
        return;
      }

      statements.slice(0, 3).forEach((statement) => {
        problemFeed.append(makeFeedCard(statement.role, statement.title, [
          `Shared by ${statement.author}`,
          statement.description,
          `Possible app or website solution: ${statement.solution}`
        ]));
      });
    })
    .catch((error) => {
      showError(problemFeed, `Could not load problem statements: ${error.message}`);
    });
};
