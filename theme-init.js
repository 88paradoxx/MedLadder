// Apply the saved theme before stylesheets paint, without an inline script.
(function () {
  try {
    if (localStorage.getItem('medladder_theme') === 'light') {
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('themeToggle');
    if (b) {
      var isDark = document.documentElement.classList.contains('dark');
      b.textContent = isDark ? '🌙' : '☀️';
      b.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      b.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      b.addEventListener('click', function () {
        var nextDark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('medladder_theme', nextDark ? 'dark' : 'light'); } catch (_) {}
        b.textContent = nextDark ? '🌙' : '☀️';
        b.title = nextDark ? 'Switch to light mode' : 'Switch to dark mode';
        b.setAttribute('aria-label', nextDark ? 'Switch to light mode' : 'Switch to dark mode');
      });
    }
  });
}());
