window.CSEHub = window.CSEHub || {};

window.CSEHub.renderAdmin = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Submission Review', 'Sign in to review hackathon experiences and projects before they are published to the site.')}
        <form id="admin-login-form" class="form-box submission-form">
          <h3>Administrator sign in</h3>
          <div class="field">
            <label for="admin-password">Admin password</label>
            <input id="admin-password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn btn-primary" type="submit">Sign in</button>
        </form>
        <p id="admin-status" class="submission-status" role="status" aria-live="polite"></p>
        <section id="admin-review" class="submission-section" aria-labelledby="admin-review-heading" hidden>
          <div class="card-actions">
            <h3 id="admin-review-heading">Submissions awaiting approval</h3>
            <button id="admin-logout" class="btn btn-secondary" type="button">Sign out</button>
          </div>
          <div id="pending-submissions" class="card-grid"></div>
        </section>
      </div>
    </section>
  `;

  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password');
  const status = document.getElementById('admin-status');
  const review = document.getElementById('admin-review');
  const submissionList = document.getElementById('pending-submissions');

  function showPendingSubmissions(submissions) {
    submissionList.replaceChildren();
    if (submissions.length === 0) {
      submissionList.innerHTML = window.CSEHub.renderEmptyState(
        'No submissions awaiting review',
        'New hackathon experiences and projects will appear here.'
      );
      return;
    }

    submissions.forEach((submission) => {
      const card = document.createElement('article');
      card.className = 'card';
      const body = document.createElement('div');
      body.className = 'card-body';
      const type = document.createElement('span');
      type.className = 'badge info';
      type.textContent = submission.submission_type === 'projects'
        ? 'Project'
        : 'Hackathon Experience';
      const author = document.createElement('p');
      author.textContent = submission.submission_type === 'projects'
        ? submission.team
        : `Shared by ${submission.author}`;
      const title = document.createElement('h3');
      title.textContent = submission.submission_type === 'projects'
        ? submission.title
        : `${submission.event} — ${submission.author}`;
      const description = document.createElement('p');
      description.textContent = submission.description || submission.project;
      const details = [];
      if (submission.submission_type === 'projects') {
        details.push(`Technologies: ${submission.technologies}`);
      } else {
        details.push(`Place and atmosphere: ${submission.venue}`);
        details.push(`People: ${submission.people}`);
        details.push(`Experience: ${submission.experience}`);
      }
      const detailParagraphs = details.map((detail) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = detail;
        return paragraph;
      });
      let projectLink;
      if (submission.project_url) {
        projectLink = document.createElement('a');
        projectLink.className = 'flat-link';
        projectLink.href = submission.project_url;
        projectLink.target = '_blank';
        projectLink.rel = 'noopener noreferrer';
        projectLink.textContent = 'Review project URL';
      }
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const approve = document.createElement('button');
      approve.className = 'btn btn-primary';
      approve.type = 'button';
      approve.textContent = 'Approve';
      const reject = document.createElement('button');
      reject.className = 'btn btn-secondary';
      reject.type = 'button';
      reject.textContent = 'Reject';

      async function reviewSubmission(action, button) {
        status.textContent = '';
        approve.disabled = true;
        reject.disabled = true;
        try {
          await window.CSEHub.reviewSubmission(
            submission.submission_type,
            submission.id,
            action
          );
          await loadPendingSubmissions();
          status.textContent = action === 'approve'
            ? 'Submission approved and now visible to visitors.'
            : 'Submission rejected and kept hidden from visitors.';
        } catch (error) {
          status.textContent = `Could not ${action} submission: ${error.message}`;
          button.disabled = false;
          (action === 'approve' ? reject : approve).disabled = false;
        }
      }

      approve.addEventListener('click', () => reviewSubmission('approve', approve));
      reject.addEventListener('click', () => reviewSubmission('reject', reject));
      actions.append(approve, reject);
      body.append(type, title, author, description, ...detailParagraphs);
      if (projectLink) {
        body.append(projectLink);
      }
      body.append(actions);
      card.append(body);
      submissionList.append(card);
    });
  }

  async function loadPendingSubmissions() {
    showPendingSubmissions(await window.CSEHub.getPendingSubmissions());
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    try {
      await window.CSEHub.adminLogin(passwordInput.value);
      passwordInput.value = '';
      loginForm.hidden = true;
      review.hidden = false;
      await loadPendingSubmissions();
    } catch (error) {
      status.textContent = `Could not sign in: ${error.message}`;
    }
  });

  document.getElementById('admin-logout').addEventListener('click', async () => {
    status.textContent = '';
    try {
      await window.CSEHub.adminLogout();
      review.hidden = true;
      loginForm.hidden = false;
      submissionList.replaceChildren();
      status.textContent = 'You have signed out.';
    } catch (error) {
      status.textContent = `Could not sign out: ${error.message}`;
    }
  });
};
