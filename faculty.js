window.CSEHub = window.CSEHub || {};

window.CSEHub.faculty = [
  { name: 'Dr. Y. Jaya Babu', designation: 'Professor' },
  { name: 'Dr. M.Radhika Mani', designation: 'Professor' },
  { name: 'Dr. Y.V.Ramkumar', designation: 'Professor' },
  { name: 'Dr. D.V.Manjula', designation: 'Associate Professor', title: 'Head of the Department' },
  { name: 'Dr. S Sarada', designation: 'Associate Professor' },
  { name: 'Dr. S.Suresh', designation: 'Associate Professor' },
  { name: 'Dr. Kondru Mounika', designation: 'Associate Professor' },
  { name: 'Dr. K. Chandra Sekhar', designation: 'Associate Professor' },
  { name: 'Dr. Darapu Uma', designation: 'Associate Professor' },
  { name: 'Dr. A. Avinash', designation: 'Associate Professor' },
  { name: 'Mr. M. Raja Kumar', designation: 'Associate Professor' },
  { name: 'Mr. T.Soma Sekhar', designation: 'Assistant Professor' },
  { name: 'Mr. Manas Kumar Yogi', designation: 'Assistant Professor' },
  { name: 'Mr. G. Vijaya Kumar', designation: 'Assistant Professor' },
  { name: 'Mr. S.Kanaka Sankar', designation: 'Assistant Professor' },
  { name: 'Mrs. P. Lakshmi Satya', designation: 'Assistant Professor' },
  { name: 'Mrs. Kanakatulasi P Reddi', designation: 'Assistant Professor' },
  { name: 'Mrs. T. Naga Venkata Durga', designation: 'Assistant Professor' },
  { name: 'Mrs. A. Harini', designation: 'Assistant Professor' },
  { name: 'Mrs.Kakarla  Ganga Devi Bhavani', designation: 'Assistant Professor' },
  { name: 'Ms. S. Surya Sri', designation: 'Assistant Professor' },
  { name: 'Mr. K V V Subba Rao', designation: 'Assistant Professor' },
  { name: 'Mrs. M. Uma Devi', designation: 'Assistant Professor' },
  { name: 'Mrs. T. Satya Aruna', designation: 'Assistant Professor' },
  { name: 'Mrs. K. Shamsri', designation: 'Assistant Professor' },
  { name: 'Mr. Sayantan Kar', designation: 'Assistant Professor' },
  { name: 'Mr. Vemagiri Prem Kumar', designation: 'Assistant Professor' },
  { name: 'Ms. M. Saranya', designation: 'Assistant Professor' },
  { name: 'Mrs. N Durga Deepthi Priya', designation: 'Assistant Professor' },
  { name: 'Ms. G.Nagarani', designation: 'Assistant Professor' },
  { name: 'Ms. Md. Apsar Jaha', designation: 'Assistant Professor' },
  { name: 'Ms. D. Kanaka Mahalakshmi Devi', designation: 'Assistant Professor' },
  { name: 'Mrs. Ch.Sowjanya', designation: 'Assistant Professor' },
  { name: 'Mr. Y H S S Phaneendra', designation: 'Assistant Professor' },
  { name: 'Mr. M Ravikumar', designation: 'Assistant Professor' },
  { name: 'Ms. I.Ishwarya', designation: 'Assistant Professor' }
];

window.CSEHub.renderFaculty = function (appRoot) {
  appRoot.innerHTML = `
    <section class="section detail-page">
      <div class="container-xl">
        <div class="section-header">
          <div>
            <p class="eyebrow">Core CSE faculty</p>
            <h2>Faculty Directory</h2>
            <p>Directory of 36 CSE faculty members and their designations.</p>
          </div>
        </div>
        <div class="search-panel faculty-filters">
          <input id="faculty-search" type="search" placeholder="Search faculty by name" aria-label="Search faculty by name" />
          <select id="faculty-designation" aria-label="Filter by designation">
            <option value="">All designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
          </select>
        </div>
        <p id="faculty-result-count" class="meta-note" aria-live="polite"></p>
        <div id="faculty-cards" class="card-grid"></div>
        <div id="faculty-empty" class="empty-state hidden" role="status">
          <h3>No faculty match</h3>
          <p>Try a different name or clear the designation filter.</p>
        </div>
      </div>
    </section>
  `;

  const searchInput = document.getElementById('faculty-search');
  const designationFilter = document.getElementById('faculty-designation');
  const cardHost = document.getElementById('faculty-cards');
  const emptyState = document.getElementById('faculty-empty');
  const countLabel = document.getElementById('faculty-result-count');

  function makeCard(person) {
    const article = document.createElement('article');
    article.className = 'card faculty-card';

    const body = document.createElement('div');
    body.className = 'card-body';

    const badge = document.createElement('span');
    badge.className = 'badge info';
    badge.textContent = person.designation;

    const name = document.createElement('h3');
    name.textContent = person.name;

    body.append(badge);
    if (person.title) {
      const title = document.createElement('span');
      title.className = 'badge success';
      title.textContent = person.title;
      body.append(title);
    }
    body.append(name);
    article.append(body);
    return article;
  }

  function updateFacultyList() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const designation = designationFilter.value;
    const matches = window.CSEHub.faculty.filter((person) => {
      return person.name.toLocaleLowerCase().includes(query)
        && (!designation || person.designation === designation);
    });

    cardHost.replaceChildren(...matches.map(makeCard));
    emptyState.classList.toggle('hidden', matches.length > 0);
    countLabel.textContent = `${matches.length} of ${window.CSEHub.faculty.length} faculty`;
  }

  searchInput.addEventListener('input', updateFacultyList);
  designationFilter.addEventListener('change', updateFacultyList);
  updateFacultyList();
};
