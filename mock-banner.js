/* MedLadder home-page banner linking to the live mock tests (/mock-test).
 * Standalone so app.js never needs editing for this. Only activates on "/".
 * Re-injects after SPA re-renders via MutationObserver. */
(function () {
  'use strict';
  if (window.location.pathname !== '/') return;

  var BANNER_ID = 'mockTestBanner';

  function inject() {
    if (document.getElementById(BANNER_ID)) return;
    var anchor = document.querySelector('.pyq-section-wrap, #pyqBankToggle');
    if (!anchor || !anchor.parentNode) return;
    var section = (anchor.closest && anchor.closest('.pyq-section-wrap')) || anchor;
    var a = document.createElement('a');
    a.id = BANNER_ID;
    a.href = '/mock-test';
    a.setAttribute('style', 'display:flex;align-items:center;gap:14px;margin:18px 0;padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,rgba(123,47,247,.20),rgba(123,47,247,.05));border:1px solid #7b2ff7;text-decoration:none;color:inherit;');
    a.innerHTML =
      '<span style="font-size:28px;line-height:1;">&#127942;</span>' +
      '<span style="flex:1;min-width:0;"><strong style="display:block;font-size:17px;color:inherit;">Live Mock Tests</strong>' +
      '<span style="opacity:.72;font-size:13px;">Free All-India mocks &middot; NEET PG Grand Test #1 this Sunday &middot; real-time leaderboard</span></span>' +
      '<span style="font-size:22px;opacity:.7;">&rsaquo;</span>';
    section.parentNode.insertBefore(a, section);
  }

  function init() {
    inject();
    var app = document.getElementById('app');
    if (app && window.MutationObserver) {
      new MutationObserver(function () { inject(); })
        .observe(app, { childList: true, subtree: true });
    } else {
      setInterval(inject, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
