/* MedLadder share buttons (standalone, so app.js stays untouched).
 * - Adds a "Share" button next to h1.title on topic/subject pages.
 * - Adds a "Share result" button on quiz result screens (.result-actions).
 * Uses the native share sheet where available, otherwise copies the link.
 * Re-injects after SPA re-renders via MutationObserver. */
(function () {
  'use strict';

  var STYLE_ID = 'mlShareStyle';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      '.ml-share-btn{display:inline-flex;align-items:center;gap:6px;margin:10px 0 0;' +
      'padding:8px 16px;border-radius:999px;border:1px solid var(--glass-border,#7b2ff7);' +
      'background:rgba(123,47,247,.12);color:inherit;font-weight:700;font-size:13.5px;' +
      'cursor:pointer;font-family:inherit}' +
      '.ml-share-btn:hover{background:rgba(123,47,247,.22)}' +
      '.ml-share-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:#1b1b29;color:#f2f2f7;border:1px solid #7b2ff7;padding:11px 20px;' +
      'border-radius:12px;z-index:99999;font-size:14px;font-family:system-ui,sans-serif}';
    document.head.appendChild(st);
  }

  function toast(msg) {
    var old = document.querySelector('.ml-share-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'ml-share-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function copyLink(url) {
    function done() { toast('Link copied to clipboard'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { legacyCopy(url, done); });
    } else {
      legacyCopy(url, done);
    }
  }

  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { window.prompt('Copy this link:', text); }
    document.body.removeChild(ta);
  }

  function share(title, text, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
    } else {
      copyLink(url);
    }
  }

  /* ---- 1. topic / subject pages: button under the h1 ---- */
  function injectTitleShare() {
    if (document.getElementById('mlShareTitle')) return;
    var h1 = document.querySelector('h1.title');
    if (!h1 || !h1.textContent) return;
    // skip the home hero h1
    if (window.location.pathname === '/') return;
    ensureStyle();
    var btn = document.createElement('button');
    btn.id = 'mlShareTitle';
    btn.type = 'button';
    btn.className = 'ml-share-btn';
    btn.innerHTML = '&#128279; Share this page';
    btn.addEventListener('click', function () {
      var name = h1.textContent.replace(/\s+/g, ' ').trim();
      share(document.title,
        'Practice ' + name + ' on MedLadder — free medical MCQs with explanations.',
        window.location.href);
    });
    h1.parentNode.insertBefore(btn, h1.nextSibling);
  }

  /* ---- 2. quiz results: button in .result-actions ---- */
  function injectResultShare() {
    if (document.getElementById('mlShareResult')) return;
    var actions = document.querySelector('.result-actions');
    if (!actions) return;
    ensureStyle();
    var btn = document.createElement('button');
    btn.id = 'mlShareResult';
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = '🔗 Share result';
    btn.addEventListener('click', function () {
      var pct = document.querySelector('.result-hero .pct');
      var frac = document.querySelector('.result-hero .frac');
      var score = (pct ? pct.textContent.trim() : '') +
        (frac ? ' (' + frac.textContent.trim() + ')' : '');
      share('My MedLadder result',
        'I scored ' + score + ' on MedLadder! Can you beat me?',
        window.location.href);
    });
    actions.appendChild(btn);
  }

  function injectAll() {
    injectTitleShare();
    injectResultShare();
  }

  function init() {
    injectAll();
    if (window.MutationObserver) {
      new MutationObserver(function () { injectAll(); })
        .observe(document.body || document.documentElement,
          { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
