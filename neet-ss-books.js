/* MedLadder NEET SS Books section (standalone, so app.js stays untouched).
 * Injects a "NEET SS Books" card directly beneath the mock-test banner (#mockTestBanner)
 * on the home page. Only Pediatrics has a live download URL; the rest show "Coming soon".
 * Re-injects after SPA re-renders via MutationObserver, same as mock-banner.js. */
(function () {
  'use strict';

  var SECTION_ID = 'neetSsBooksSection';

  // ---------------------------------------------------------------------------
  // SETUP: upload neet-ss-pediatrics-book-web.pdf to your R2 bucket under
  // books/neet-ss-pediatrics-book.pdf, connect a custom domain (e.g.
  // cdn.medladder.top), then make sure PDF_URL below matches the public URL.
  // ---------------------------------------------------------------------------
  var PEDIATRICS_PDF_URL = 'https://cdn.medladder.top/books/neet-ss-pediatrics-book.pdf';

  var BOOKS = [
    { n: 1, title: 'Pediatrics', live: true,
      desc: 'Complete review \u00B7 12 chapters \u00B7 24 illustrations \u00B7 300 MCQs' },
    { n: 2, title: 'Medicine', live: false },
    { n: 3, title: 'Surgery', live: false },
    { n: 4, title: 'Cardiology', live: false },
    { n: 5, title: 'Neurology', live: false },
    { n: 6, title: 'Nephrology', live: false },
    { n: 7, title: 'Gastroenterology', live: false },
    { n: 8, title: 'Endocrinology', live: false },
    { n: 9, title: 'Pulmonology', live: false },
    { n: 10, title: 'Hematology & Oncology', live: false }
  ];

  var isHome = window.location.pathname === '/' ||
               window.location.pathname === '/index.html' ||
               window.location.pathname === '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function bookRow(b) {
    var action;
    if (b.live) {
      action = '<a href="' + esc(PEDIATRICS_PDF_URL) + '" target="_blank" rel="noopener"' +
        ' style="flex:none;display:inline-flex;align-items:center;gap:6px;background:#7b2ff7;color:#fff;' +
        'font-weight:700;font-size:13px;padding:8px 14px;border-radius:9px;text-decoration:none;">' +
        '<span>\u2B07</span> Download PDF</a>';
    } else {
      action = '<span style="flex:none;font-size:12px;font-weight:600;color:#a78bfa;' +
        'background:rgba(123,47,247,.14);border:1px solid rgba(123,47,247,.4);' +
        'padding:6px 12px;border-radius:999px;">Coming soon</span>';
    }
    var sub = b.live && b.desc
      ? '<span style="display:block;font-size:12.5px;opacity:.65;margin-top:2px;">' + esc(b.desc) + '</span>'
      : '';
    return '<div style="display:flex;align-items:center;gap:12px;padding:11px 4px;' +
      'border-bottom:1px solid rgba(148,163,184,.12);">' +
      '<span style="flex:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;' +
      'justify-content:center;font-size:13px;font-weight:700;color:#c4b5fd;' +
      'background:rgba(123,47,247,.14);border:1px solid rgba(123,47,247,.35);">' + b.n + '</span>' +
      '<span style="flex:1;min-width:0;"><strong style="font-size:15px;">' + esc(b.title) + '</strong>' + sub + '</span>' +
      action + '</div>';
  }

  function render() {
    if (!isHome) return;
    var banner = document.getElementById('mockTestBanner');
    if (!banner || !banner.parentNode) return; // banner not injected yet; observer will retry
    var el = document.getElementById(SECTION_ID);
    if (!el) {
      el = document.createElement('section');
      el.id = SECTION_ID;
      banner.parentNode.insertBefore(el, banner.nextSibling);
    }
    if (!el.innerHTML) {
      var rows = BOOKS.map(bookRow).join('');
      el.setAttribute('style',
        'margin:0 0 18px;padding:18px 20px;border-radius:14px;color:inherit;' +
        'background:linear-gradient(135deg,rgba(123,47,247,.14),rgba(123,47,247,.04));' +
        'border:1px solid rgba(123,47,247,.55);');
      el.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">' +
        '<span style="font-size:26px;line-height:1;">\uD83D\uDCDA</span>' +
        '<div><strong style="display:block;font-size:17px;">NEET SS Books</strong>' +
        '<span style="opacity:.7;font-size:13px;">Free super-speciality review books \u00B7 by MedLadder</span></div>' +
        '</div>' + rows;
    }
  }

  function init() {
    render();
    if (window.MutationObserver) {
      new MutationObserver(function () { render(); })
        .observe(document.body || document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
