window.CSEHub = window.CSEHub || {};

window.CSEHub.getSubmissions = async function (collection) {
  const response = await fetch(`/api/${collection}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not load submissions.');
  }
  return payload.items;
};

window.CSEHub.createSubmission = async function (collection, submission) {
  const response = await fetch(`/api/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not save submission.');
  }
  return payload.item;
};

window.CSEHub.adminLogin = async function (password) {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not sign in as admin.');
  }
};

window.CSEHub.getPendingSubmissions = async function () {
  const response = await fetch('/api/admin/submissions', { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not load submissions for review.');
  }
  return payload.items;
};

window.CSEHub.reviewSubmission = async function (collection, submissionId, action) {
  const response = await fetch(`/api/admin/submissions/${collection}/${submissionId}/${action}`, {
    method: 'POST'
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not update submission review status.');
  }
};

window.CSEHub.adminLogout = async function () {
  const response = await fetch('/api/admin/logout', { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Could not sign out.');
  }
};
