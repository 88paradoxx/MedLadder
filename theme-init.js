// Apply the saved theme before stylesheets paint, without an inline script.
(function () {
  try {
    if (localStorage.getItem('medladder_theme') === 'light') {
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
}());
