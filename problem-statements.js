window.CSEHub = window.CSEHub || {};

window.CSEHub.renderProblemStatements = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Problem Statements', 'Students and faculty can describe real issues they face and explain how an app or website could help solve them.')}
        <section class="submission-section" aria-labelledby="problem-list-heading">
          <div class="submission-list-header">
            <h3 id="problem-list-heading">Problem statements</h3>
            <button id="toggle-problem-form" class="add-submission-button" type="button" aria-label="Add a problem statement" aria-expanded="false" aria-controls="problem-statement-form">+</button>
          </div>
          <div id="problem-statements" class="card-grid" aria-live="polite">
            ${window.CSEHub.renderEmptyState('Loading problem statements...', 'Please wait while problem statements are loaded.')}
          </div>
        </section>
        <p id="problem-form-status" class="submission-status" role="status" aria-live="polite"></p>
        <form id="problem-statement-form" class="form-box submission-form" hidden>
          <h3>Share an issue that needs solving</h3>
          <p>Describe a real problem you face and how an app or website might help.</p>
          <p class="submission-storage-note">Your submission is saved to the shared site database and visible to all visitors. Do not include private information.</p>
          <div class="field">
            <label for="problem-author">Your name</label>
            <input id="problem-author" name="author" type="text" maxlength="100" required />
          </div>
          <div class="field">
            <label for="problem-role">I am a</label>
            <select id="problem-role" name="role" required>
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
            </select>
          </div>
          <div class="field">
            <label for="problem-title">Issue title</label>
            <input id="problem-title" name="title" type="text" maxlength="160" required />
          </div>
          <div class="field">
            <label for="problem-description">What issue are you facing, and who does it affect?</label>
            <textarea id="problem-description" name="description" rows="4" maxlength="3000" required></textarea>
          </div>
          <div class="field">
            <label for="problem-solution">How could an app or website help solve it?</label>
            <textarea id="problem-solution" name="solution" rows="3" maxlength="2000" required></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Share problem statement</button>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById('problem-statement-form');
  const statementList = document.getElementById('problem-statements');
  const status = document.getElementById('problem-form-status');
  const toggleForm = document.getElementById('toggle-problem-form');

  toggleForm.addEventListener('click', () => {
    const isOpening = form.hidden;
    form.hidden = !isOpening;
    toggleForm.textContent = isOpening ? '×' : '+';
    toggleForm.setAttribute('aria-label', isOpening ? 'Close problem statement form' : 'Add a problem statement');
    toggleForm.setAttribute('aria-expanded', String(isOpening));
    status.textContent = '';
    if (isOpening) {
      form.querySelector('input').focus();
    }
  });

  function renderStatements(statements) {
    statementList.replaceChildren();
    if (statements.length === 0) {
      statementList.innerHTML = window.CSEHub.renderEmptyState(
        'No problem statements submitted yet',
        'Be the first to share an issue that an app or website could solve.'
      );
      return;
    }

    statements.forEach((statement) => {
      const card = document.createElement('article');
      card.className = 'card';
      const body = document.createElement('div');
      body.className = 'card-body';
      const role = document.createElement('span');
      role.className = 'badge info';
      role.textContent = statement.role;
      const title = document.createElement('h3');
      title.textContent = statement.title;
      const author = document.createElement('p');
      author.textContent = `Shared by ${statement.author}`;
      const description = document.createElement('p');
      description.textContent = statement.description;
      const solution = document.createElement('p');
      solution.textContent = `Possible app or website solution: ${statement.solution}`;
      body.append(role, title, author, description, solution);
      card.append(body);
      statementList.append(card);
    });
  }

  window.CSEHub.getSubmissions('problem-statements')
    .then(renderStatements)
    .catch((error) => {
      status.textContent = `Could not load problem statements: ${error.message}`;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    const formData = new FormData(form);
    const statement = {
      author: formData.get('author').trim(),
      role: formData.get('role'),
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      solution: formData.get('solution').trim()
    };
    if (!Object.values(statement).every((value) => value.length > 0)) {
      status.textContent = 'Please complete every field before saving.';
      return;
    }

    try {
      await window.CSEHub.createSubmission('problem-statements', statement);
      renderStatements(await window.CSEHub.getSubmissions('problem-statements'));
      form.reset();
      form.hidden = true;
      toggleForm.textContent = '+';
      toggleForm.setAttribute('aria-label', 'Add a problem statement');
      toggleForm.setAttribute('aria-expanded', 'false');
      status.textContent = 'Your problem statement has been shared with all site visitors.';
    } catch (error) {
      status.textContent = `Could not save your problem statement: ${error.message}`;
    }
  });
};
