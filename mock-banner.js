/* MedLadder small site enhancements (standalone, so app.js stays untouched).
 * 1. Home-page banner linking to the live mock tests (/mock-test). Only on "/".
 * 2. "Mock Test Admin" shortcut button inside the Admin Control Center modal.
 * Both re-inject after SPA re-renders via MutationObserver. */
(function () {
  'use strict';

  var BANNER_ID = 'mockTestBanner';
  var ADMIN_LINK_ID = 'mockAdminLink';
  var isHome = window.location.pathname === '/';

  function injectBanner() {
    if (!isHome) return;
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

  function injectAdminLink() {
    if (document.getElementById(ADMIN_LINK_ID)) return;
    var body = document.getElementById('adminModalBody');
    if (!body) return;
    var a = document.createElement('a');
    a.id = ADMIN_LINK_ID;
    a.href = '/admin-mock';
    a.setAttribute('style', 'display:flex;align-items:center;gap:10px;margin:0 0 14px;padding:12px 16px;border-radius:10px;background:rgba(123,47,247,.12);border:1px solid #7b2ff7;text-decoration:none;color:inherit;font-weight:700;font-size:14px;');
    a.innerHTML =
      '<span style="font-size:18px;">&#127942;</span>' +
      '<span style="flex:1;">Mock Test Admin</span>' +
      '<span style="opacity:.7;">&rsaquo;</span>';
    body.insertBefore(a, body.firstChild);
  }

  function injectAll() {
    injectBanner();
    injectAdminLink();
  }

  function init() {
    injectAll();
    var target = document.body || document.documentElement;
    if (window.MutationObserver) {
      new MutationObserver(function () { injectAll(); })
        .observe(target, { childList: true, subtree: true });
    } else {
      setInterval(injectAll, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
