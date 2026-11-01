window.CSEHub = window.CSEHub || {};

window.CSEHub.renderHackathons = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        ${window.CSEHub.renderSectionHeader('Hackathon Experience', 'Tell the story of your hackathon: the project you built, the venue and atmosphere, the people you met, and how the experience felt.')}
        <section class="submission-section" aria-labelledby="hackathon-stories-heading">
          <div class="submission-list-header">
            <h3 id="hackathon-stories-heading">Hackathon stories</h3>
            <button id="toggle-hackathon-form" class="add-submission-button" type="button" aria-label="Add a hackathon story" aria-expanded="false" aria-controls="hackathon-story-form">+</button>
          </div>
          <div id="hackathon-stories" class="card-grid" aria-live="polite">
            ${window.CSEHub.renderEmptyState('Loading stories...', 'Please wait while hackathon stories are loaded.')}
          </div>
        </section>
        <p id="hackathon-form-status" class="submission-status" role="status" aria-live="polite"></p>
        <form id="hackathon-story-form" class="form-box submission-form" hidden>
          <h3>Share your hackathon story</h3>
          <p>Help others picture the event by describing your project, the place, and the people there.</p>
          <p class="submission-storage-note">Your story will be reviewed by an administrator and shown to visitors only after approval. Do not include private information.</p>
          <div class="field">
            <label for="hackathon-author">Your name or team name</label>
            <input id="hackathon-author" name="author" type="text" maxlength="100" required />
          </div>
          <div class="field">
            <label for="hackathon-event">Hackathon name</label>
            <input id="hackathon-event" name="event" type="text" maxlength="120" required />
          </div>
          <div class="field">
            <label for="hackathon-project">What did you build?</label>
            <textarea id="hackathon-project" name="project" rows="3" maxlength="2000" required></textarea>
          </div>
          <div class="field">
            <label for="hackathon-venue">What was the place and atmosphere like?</label>
            <textarea id="hackathon-venue" name="venue" rows="3" maxlength="1500" required></textarea>
          </div>
          <div class="field">
            <label for="hackathon-people">What were the people like? (For example, teammates, participants, mentors, or organizers)</label>
            <textarea id="hackathon-people" name="people" rows="3" maxlength="1500" required></textarea>
          </div>
          <div class="field">
            <label for="hackathon-experience">How was the overall experience? What did you enjoy or learn?</label>
            <textarea id="hackathon-experience" name="experience" rows="4" maxlength="3000" required></textarea>
          </div>
          <button class="btn btn-primary" type="submit">Share hackathon story</button>
        </form>
      </div>
    </section>
  `;

  const form = document.getElementById('hackathon-story-form');
  const storyList = document.getElementById('hackathon-stories');
  const status = document.getElementById('hackathon-form-status');
  const toggleForm = document.getElementById('toggle-hackathon-form');

  toggleForm.addEventListener('click', () => {
    const isOpening = form.hidden;
    form.hidden = !isOpening;
    toggleForm.textContent = isOpening ? '×' : '+';
    toggleForm.setAttribute('aria-label', isOpening ? 'Close hackathon story form' : 'Add a hackathon story');
    toggleForm.setAttribute('aria-expanded', String(isOpening));
    status.textContent = '';
    if (isOpening) {
      form.querySelector('input').focus();
    }
  });

  function renderStories(stories) {
    storyList.replaceChildren();
    if (stories.length === 0) {
      storyList.innerHTML = window.CSEHub.renderEmptyState(
        'No approved stories yet',
        'Approved hackathon experiences will appear here.'
      );
      return;
    }

    stories.forEach((story) => {
      const card = document.createElement('article');
      card.className = 'card';
      const body = document.createElement('div');
      body.className = 'card-body';
      const event = document.createElement('span');
      event.className = 'badge info';
      event.textContent = story.event;
      const title = document.createElement('h3');
      title.textContent = story.author;
      const project = document.createElement('p');
      project.textContent = `What we built: ${story.project}`;
      const venue = document.createElement('p');
      venue.textContent = `Place and atmosphere: ${story.venue || 'Not included in this story'}`;
      const people = document.createElement('p');
      people.textContent = `People: ${story.people || 'Not included in this story'}`;
      const experience = document.createElement('p');
      experience.textContent = `Our experience: ${story.experience}`;
      body.append(event, title, project, venue, people, experience);
      card.append(body);
      storyList.append(card);
    });
  }

  window.CSEHub.getSubmissions('hackathon-stories')
    .then(renderStories)
    .catch((error) => {
      status.textContent = `Could not load hackathon stories: ${error.message}`;
    });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    const formData = new FormData(form);
    const story = {
      author: formData.get('author').trim(),
      event: formData.get('event').trim(),
      project: formData.get('project').trim(),
      venue: formData.get('venue').trim(),
      people: formData.get('people').trim(),
      experience: formData.get('experience').trim()
    };
    if (!Object.values(story).every((value) => value.length > 0)) {
      status.textContent = 'Please complete every field before saving.';
      return;
    }

    try {
      await window.CSEHub.createSubmission('hackathon-stories', story);
      renderStories(await window.CSEHub.getSubmissions('hackathon-stories'));
      form.reset();
      form.hidden = true;
      toggleForm.textContent = '+';
      toggleForm.setAttribute('aria-label', 'Add a hackathon story');
      toggleForm.setAttribute('aria-expanded', 'false');
      status.textContent = 'Your story was submitted for admin review. It will be visible to visitors after approval.';
    } catch (error) {
      status.textContent = `Could not save your story: ${error.message}`;
    }
  });
};
