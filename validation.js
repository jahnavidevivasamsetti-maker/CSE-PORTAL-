window.CSEHub = window.CSEHub || {};

window.CSEHub.validation = {
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  },

  required(value) {
    return String(value || '').trim().length > 0;
  },

  maxLength(value, max) {
    return String(value || '').trim().length <= max;
  },

  fileTypeAllowed(file, allowedTypes) {
    if (!file) return false;
    const name = String(file.name || '').toLowerCase();
    const matches = allowedTypes.some((type) => name.endsWith(type.toLowerCase()));
    return matches;
  },

  fileSizeAllowed(file, maxMb) {
    if (!file) return false;
    return file.size <= maxMb * 1024 * 1024;
  }
};

window.CSEHub.showToast = function (message, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast ' + (type || 'info');
  toast.classList.add('show');
  window.clearTimeout(window.CSEHub.toastTimer);
  window.CSEHub.toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
};
