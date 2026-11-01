window.CSEHub = window.CSEHub || {};

window.CSEHub.renderProjects = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Our Projects', 'Discover projects approved by the department, or submit a project for review.')}
        <section class="submission-section" aria-labelledby="projects-list-heading">
          <div class="submission-list-header">
            <h3 id="projects-list-heading">CSE Projects</h3>
            <button id="toggle-project-form" class="add-submission-button" type="button" aria-label="Add a project" aria-expanded="false" aria-controls="project-form">+</button>
          </div>
          <div id="projects-list" class="card-grid" aria-live="polite">
            ${window.CSEHub.renderEmptyState('Loading projects...', 'Please wait while approved projects are loaded.')}
          </div>
        </section>
        <p id="project-form-status" class="submission-status" role="status" aria-live="polite"></p>
        <form id="project-form" class="form-box submission-form" hidden>
          <h3>Share a CSE project</h3>
          <p>Describe what your project does and the technologies used.</p>
          <p class="submission-storage-note">New projects are reviewed by an administrator. They will be visible to all visitors only after approval. Do not include private information.</p>
          <div class="field">
            <label for="project-title">Project name</label>
            <input id="project-title" name="title" type="text" maxlength="160" required />
          </div>
          <div class="field">
            <label for="project-team">Student or team name</label>
            <input id="project-team" name="team" type="text" maxlength="120" required />
          </div>
          <div class="field">
            <label for="project-description">What does the project do?</label>
            <textarea id="project-description" name="description" rows="4" maxlength="3000" required></textarea>
          </div>
          <div class="field">
            <label for="project-technologies">Technologies used</label>
            <input id="project-technologies" name="technologies" type="text" maxlength="500" placeholder="For example: HTML, CSS, JavaScript" required />
          </div>
          <div class="field">
            <label for="project-url">Project URL</label>
            <input id="project-url" name="project_url" type="url" maxlength="2048" placeholder="https://example.com/your-project" required />
          </div>
          <button class="btn btn-primary" type="submit">Share project</button>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById('project-form');
  const projectList = document.getElementById('projects-list');
  const status = document.getElementById('project-form-status');
  const toggleForm = document.getElementById('toggle-project-form');

  toggleForm.addEventListener('click', () => {
    const isOpening = form.hidden;
    form.hidden = !isOpening;
    toggleForm.textContent = isOpening ? '×' : '+';
    toggleForm.setAttribute('aria-label', isOpening ? 'Close project form' : 'Add a project');
    toggleForm.setAttribute('aria-expanded', String(isOpening));
    status.textContent = '';
    if (isOpening) {
      form.querySelector('input').focus();
    }
  });

  function renderProjects(projects) {
    projectList.replaceChildren();
    if (projects.length === 0) {
      projectList.innerHTML = window.CSEHub.renderEmptyState(
        'No approved projects yet',
        'Approved CSE projects will appear here.'
      );
      return;
    }

    projects.forEach((project) => {
      const card = document.createElement('article');
      card.className = 'card';
      const body = document.createElement('div');
      body.className = 'card-body';
      const team = document.createElement('span');
      team.className = 'badge info';
      team.textContent = project.team;
      const title = document.createElement('h3');
      title.textContent = project.title;
      const description = document.createElement('p');
      description.textContent = project.description;
      const technologies = document.createElement('p');
      technologies.textContent = `Technologies: ${project.technologies}`;
      body.append(team, title, description, technologies);
      if (project.project_url) {
        const projectLink = document.createElement('a');
        projectLink.className = 'flat-link';
        projectLink.href = project.project_url;
        projectLink.target = '_blank';
        projectLink.rel = 'noopener noreferrer';
        projectLink.textContent = 'View project';
        body.append(projectLink);
      }
      card.append(body);
      projectList.append(card);
    });
  }

  window.CSEHub.getSubmissions('projects')
    .then(renderProjects)
    .catch((error) => {
      status.textContent = `Could not load projects: ${error.message}`;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    const formData = new FormData(form);
    const project = {
      title: formData.get('title').trim(),
      team: formData.get('team').trim(),
      description: formData.get('description').trim(),
      technologies: formData.get('technologies').trim(),
      project_url: formData.get('project_url').trim()
    };

    if (!Object.values(project).every((value) => value.length > 0)) {
      status.textContent = 'Please complete every field before sharing.';
      return;
    }

    try {
      await window.CSEHub.createSubmission('projects', project);
      form.reset();
      status.textContent = 'Your project was submitted for admin review. It will be visible to visitors after approval.';
      form.hidden = true;
      toggleForm.textContent = '+';
      toggleForm.setAttribute('aria-label', 'Add a project');
      toggleForm.setAttribute('aria-expanded', 'false');
      try {
        renderProjects(await window.CSEHub.getSubmissions('projects'));
      } catch (error) {
        status.textContent += ` Approved projects could not be refreshed: ${error.message}`;
      }
    } catch (error) {
      status.textContent = `Could not share your project: ${error.message}`;
    }
  });
};
