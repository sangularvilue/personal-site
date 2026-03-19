// Hash-based navigation between landing, arts, and crafts
function navigate() {
  const hash = window.location.hash.replace('#', '') || 'landing';
  const landing = document.getElementById('landing');
  const pages = document.querySelectorAll('.page');

  if (hash === 'landing') {
    landing.classList.remove('hidden');
    pages.forEach(p => p.classList.remove('active'));
  } else {
    landing.classList.add('hidden');
    pages.forEach(p => {
      if (p.id === hash) {
        p.classList.add('active');
        // Re-trigger animation
        p.style.animation = 'none';
        p.offsetHeight; // force reflow
        p.style.animation = '';
      } else {
        p.classList.remove('active');
      }
    });
  }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);
