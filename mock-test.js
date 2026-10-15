/* MedLadder live mock tests + leaderboard.
 * Standalone page: /mock-test (see mock-test.html).
 * All privileged work goes through Supabase RPCs — the browser never
 * sees answer keys before submitting (see supabase migration). */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://groeibwykzrliphzzruk.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_tXvgKaWrUfWlpy8SB3c1mQ_ZMrHxzVY';

  var sb = null;
  var currentUser = null;
  var currentTest = null;
  var attemptId = null;
  var questions = [];
  var answers = {};      // {"<sort_order>": "a"|"b"|"c"|"d"|"e"}
  var marked = {};       // {"<sort_order>": true}
  var currentIdx = 0;
  var deadlineMs = 0;
  var timerInt = null;
  var lbChannel = null;
  var submitLock = false;

  /* ---------- utils ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Images live on Cloudflare R2; the bank stores legacy Supabase URLs.
   * Same rewrite the main site uses, so mock questions show the same images. */
  var R2_IMAGES_BASE = 'https://pub-5e62ac2b4d1c43fcb7fb6b025a52e189.r2.dev';
  function optimizeQuestionImageUrl(src) {
    if (!src) return '';
    try {
      var url = new URL(String(src), window.location.href);
      if (/\.supabase\.co$/i.test(url.hostname)) {
        var prefix = '/storage/v1/object/public/question-images/';
        var renderPrefix = '/storage/v1/render/image/public/question-images/';
        if (url.pathname.indexOf(prefix) === 0) {
          return R2_IMAGES_BASE + '/' + url.pathname.slice(prefix.length);
        } else if (url.pathname.indexOf(renderPrefix) === 0) {
          return R2_IMAGES_BASE + '/' + url.pathname.slice(renderPrefix.length);
        }
      }
      return url.toString();
    } catch (_) {
      return String(src);
    }
  }
  /* Render question stems that may contain trusted editorial HTML (<br>, <img>)
   * with an allowlist, matching the main site's sanitizer. */
  function sanitizeQuestionHtml(input) {
    if (input === null || input === undefined || input === '') return '';
    var tpl = document.createElement('template');
    tpl.innerHTML = String(input);
    var allowed = {
      BR: true, B: true, STRONG: true, I: true, EM: true,
      U: true, S: true, SUB: true, SUP: true, SMALL: true,
      SPAN: true, P: true, DIV: true
    };
    function clean(parent) {
      Array.prototype.forEach.call(parent.childNodes, function (node) {
        if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        var tag = node.tagName.toUpperCase();
        if (tag === 'IMG') {
          var src = node.getAttribute('src') || '';
          var alt = node.getAttribute('alt') || 'Clinical exhibit';
          if (!/^https?:\/\//i.test(src)) { node.remove(); return; }
          Array.prototype.forEach.call(node.attributes, function (attr) {
            node.removeAttribute(attr.name);
          });
          node.setAttribute('src', optimizeQuestionImageUrl(src));
          node.setAttribute('alt', alt);
          node.className = 'qtext-img';
          node.setAttribute('loading', 'lazy');
          node.setAttribute('decoding', 'async');
          return;
        }
        if (!allowed[tag]) { node.remove(); return; }
        Array.prototype.forEach.call(node.attributes, function (attr) {
          node.removeAttribute(attr.name);
        });
        clean(node);
      });
    }
    clean(tpl.content);
    return tpl.innerHTML;
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.hidden = true; }, 3200);
  }
  /* Share via the native sheet where available, else copy the link. */
  function shareLink(title, text, url) {
    if (window.navigator && navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
      return;
    }
    function done() { toast('Link copied to clipboard'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { legacyCopy(url, done); });
    } else {
      legacyCopy(url, done);
    }
  }
  function legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { window.prompt('Copy this link:', text); }
    document.body.removeChild(ta);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtHMS(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  }
  function fmtDur(sec) {
    if (sec == null) return '–';
    var m = Math.floor(sec / 60);
    return m + 'm ' + (sec % 60) + 's';
  }
  function friendlyErr(e) {
    var m = (e && e.message) || '';
    var map = {
      SIGNIN_REQUIRED: 'Please sign in to take the mock test.',
      TEST_NOT_FOUND: 'This mock test could not be found.',
      TEST_NOT_PUBLISHED: 'This mock test is not published yet.',
      TEST_NOT_STARTED: 'This mock test has not started yet.',
      TEST_ENDED: 'This mock test has ended.',
      PRO_REQUIRED: 'This is a Pro mock test. Upgrade to MedLadder Pro to take it.',
      ATTEMPT_REQUIRED: 'Start the test first.',
      ATTEMPT_NOT_FOUND: 'Attempt not found. Please restart the test.',
      ALREADY_SUBMITTED: 'You have already submitted this test.',
      NOT_SUBMITTED: 'Submit the test to see the review.'
    };
    for (var k in map) { if (m.indexOf(k) !== -1) return map[k]; }
    return 'Something went wrong. Please try again.';
  }
  function optLetters(q) {
    var out = [];
    ['a', 'b', 'c', 'd', 'e'].forEach(function (k) {
      if (q['option_' + k]) out.push(k);
    });
    return out;
  }

  /* ---------- auth (same pill as the index page) ---------- */
  function userInitials(u) {
    var meta = u.user_metadata || {};
    var name = String(meta.full_name || meta.name || '').trim();
    var parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (u.email || 'U').slice(0, 2).toUpperCase();
  }
  function userDisplayName(u) {
    var meta = u.user_metadata || {};
    var name = String(meta.full_name || meta.name || '').trim();
    if (name) return name;
    return (u.email || 'User').split('@')[0];
  }
  function doGoogleSignIn() {
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href } });
  }
  function closeAuthDropdown(ev) {
    var dd = $('authDropdown'), btn = $('authUserBtn'), wrap = $('userMenuWrap');
    if (dd && !dd.classList.contains('hidden') && (!ev || !wrap || !wrap.contains(ev.target))) {
      dd.classList.add('hidden');
      if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    }
  }
  function renderAuth() {
    var area = $('authArea');
    if (currentUser) {
      var initials = esc(userInitials(currentUser));
      var name = esc(userDisplayName(currentUser));
      var email = esc(currentUser.email || '');
      area.innerHTML =
        '<div class="user-menu-wrap" id="userMenuWrap">' +
        '<button class="auth-user-btn" id="authUserBtn" aria-label="Account menu" aria-expanded="false">' +
        '<span class="auth-avatar">' + initials + '</span>' +
        '<span class="auth-user-name">' + name + '</span>' +
        '<span class="auth-caret">\u25BE</span>' +
        '</button>' +
        '<div class="auth-dropdown hidden" id="authDropdown">' +
        '<div class="dropdown-header">' +
        '<div class="dropdown-avatar">' + initials + '</div>' +
        '<div class="dropdown-details">' +
        '<div class="dropdown-name">' + name + '</div>' +
        '<div class="dropdown-email">' + email + '</div>' +
        '</div></div>' +
        '<div class="dropdown-divider"></div>' +
        '<button class="dropdown-action-btn" id="authSignOutBtn">Sign Out</button>' +
        '</div></div>';
      var btn = $('authUserBtn'), dd = $('authDropdown');
      btn.onclick = function (ev) {
        ev.stopPropagation();
        var isHidden = dd.classList.toggle('hidden');
        btn.classList.toggle('open', !isHidden);
        btn.setAttribute('aria-expanded', String(!isHidden));
      };
      document.removeEventListener('click', closeAuthDropdown);
      document.addEventListener('click', closeAuthDropdown);
      $('authSignOutBtn').onclick = function () {
        sb.auth.signOut().then(function () { location.reload(); });
      };
    } else {
      area.innerHTML =
        '<button class="auth-btn" id="authTriggerBtn" title="Sign in">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' +
        '<span>Sign In</span>' +
        '</button>';
      $('authTriggerBtn').onclick = doGoogleSignIn;
    }
  }

  /* ---------- lobby ---------- */
  function testPhase(t) {
    var now = Date.now();
    var s = new Date(t.starts_at).getTime();
    var e = new Date(t.ends_at).getTime();
    if (now < s) return 'upcoming';
    if (now > e) return 'ended';
    return 'live';
  }
  function phaseBadge(phase) {
    if (phase === 'live') return '<span class="mt-badge live">● LIVE NOW</span>';
    if (phase === 'upcoming') return '<span class="mt-badge upcoming">UPCOMING</span>';
    return '<span class="mt-badge ended">ENDED</span>';
  }
  var expandedDetails = {};
  function detailRow(label, value) {
    return '<div class="mt-detail"><span class="mt-detail-k">' + esc(label) +
      '</span><span class="mt-detail-v">' + esc(value) + '</span></div>';
  }
  function detailsHtml(t) {
    var open = !!expandedDetails[t.id];
    return '<div class="mt-test-details"' + (open ? '' : ' hidden') + '>' +
      '<div class="mt-detail-grid">' +
      detailRow('Starts', new Date(t.starts_at).toLocaleString()) +
      detailRow('Ends', new Date(t.ends_at).toLocaleString()) +
      detailRow('Duration', t.duration_minutes + ' minutes') +
      detailRow('Questions', String(t.total_questions)) +
      detailRow('Marking', '+' + t.positive_marks + '  /  \u2212' + t.negative_marks) +
      detailRow('Access', t.is_free ? 'Free for signed-in users' : 'Pro members only') +
      '</div></div>';
  }
  function loadLobby() {
    showView('lobbyView');
    var list = $('testList');
    list.innerHTML = '<p style="color:var(--muted)">Loading mock tests…</p>';
    sb.from('mock_tests')
      .select('id,title,exam,description,starts_at,ends_at,duration_minutes,total_questions,positive_marks,negative_marks,is_free')
      .eq('status', 'published')
      .order('starts_at', { ascending: false })
      .limit(20)
      .then(function (res) {
        if (res.error) { list.innerHTML = '<p>Could not load tests.</p>'; return; }
        var tests = res.data || [];
        if (!tests.length) {
          list.innerHTML = '<div class="mt-test-card"><div class="mt-test-info">' +
            '<h3>No mock tests yet</h3><p>The first free All-India mock is coming soon. Check back!</p>' +
            '</div></div>';
          return;
        }
        list.innerHTML = '';
        tests.forEach(function (t) {
          var phase = testPhase(t);
          var card = document.createElement('div');
          card.className = 'mt-test-card';
          var when = phase === 'upcoming'
            ? 'Starts: ' + new Date(t.starts_at).toLocaleString()
            : phase === 'live'
              ? 'Ends: ' + new Date(t.ends_at).toLocaleString()
              : 'Ended: ' + new Date(t.ends_at).toLocaleString();
          var btn = phase === 'ended' ? 'View leaderboard'
            : phase === 'live' ? 'Start test' : 'View details';
          card.innerHTML =
            '<div class="mt-test-info">' +
            '<h3>' + esc(t.title) + '</h3>' +
            '<p>' + esc(t.description || '') + '</p>' +
            '<div class="mt-test-meta">' +
            '<span>' + esc(t.exam) + '</span>' +
            '<span>' + t.total_questions + ' questions</span>' +
            '<span>' + t.duration_minutes + ' min</span>' +
            '<span>' + esc(when) + '</span>' +
            '</div>' +
            (phase === 'upcoming' ? detailsHtml(t) : '') +
            '</div>' +
            '<div>' + phaseBadge(phase) + ' ' +
            (t.is_free ? '<span class="mt-badge free">FREE</span>' : '<span class="mt-badge pro">PRO</span>') +
            '</div>' +
            '<button class="mt-btn mt-btn-primary" data-act="open">' +
            (phase === 'upcoming' && expandedDetails[t.id] ? 'Hide details' : btn) + '</button>' +
            ' <button class="mt-btn" data-act="share" title="Share this test">🔗</button>';
          var openBtn = card.querySelector('[data-act="open"]');
          if (phase === 'upcoming') {
            openBtn.onclick = function () {
              expandedDetails[t.id] = !expandedDetails[t.id];
              var d = card.querySelector('.mt-test-details');
              d.hidden = !expandedDetails[t.id];
              openBtn.textContent = expandedDetails[t.id] ? 'Hide details' : 'View details';
            };
          } else if (phase === 'ended') {
            openBtn.onclick = function () {
              openEndedTest(t.id);
            };
          } else {
            openBtn.onclick = function () {
              openTest(t.id);
            };
          }
          card.querySelector('[data-act="share"]').onclick = function () {
            shareLink(t.title,
              'Join this free mock test on MedLadder: ' + t.title,
              location.origin + '/mock-test?id=' + t.id);
          };
          list.appendChild(card);
        });
        tickCountdowns(tests);
        loadMyResults();
      });
  }
  /* Past submitted attempts — review questions, answers and explanations any time. */
  function loadMyResults() {
    var box = $('myResults');
    box.innerHTML = '';
    if (!currentUser) return;
    sb.rpc('get_my_mock_attempts', { p_limit: 20 }).then(function (res) {
      if (res.error || !(res.data && res.data.length)) return;
      var html = '<h2>My Past Results</h2>';
      (res.data || []).forEach(function (a) {
        html += '<div class="mt-result-row" data-aid="' + a.attempt_id + '" data-tid="' + a.mock_test_id + '">' +
          '<div><div class="rr-title">' + esc(a.test_title) + '</div>' +
          '<div class="rr-sub">' + esc(a.exam || '') + ' \u00B7 ' +
          new Date(a.submitted_at).toLocaleDateString() + '</div></div>' +
          '<div class="rr-score"><div class="rr-rank">#' + a.rank + '</div>' +
          '<div class="rr-pts">' + a.score + ' pts</div></div>' +
          '</div>';
      });
      box.innerHTML = html;
      Array.prototype.forEach.call(box.querySelectorAll('.mt-result-row'), function (row) {
        row.onclick = function () { openPastAttempt(row.dataset.aid, row.dataset.tid); };
      });
    });
  }
  function openPastAttempt(aid, tid) {
    sb.from('mock_tests').select('*').eq('id', tid).single().then(function (tr) {
      if (tr.error || !tr.data) { toast('Mock test not found.'); return; }
      currentTest = tr.data;
      attemptId = aid;
      questions = []; answers = {}; marked = {}; currentIdx = 0;
      if (lbChannel) { sb.removeChannel(lbChannel); lbChannel = null; }
      showResultView();
    });
  }
  var countdownInt = null;
  function tickCountdowns(tests) {
    // Lightweight: re-render lobby every 30s so badges/countdowns stay fresh.
    clearInterval(countdownInt);
    countdownInt = setInterval(function () {
      if (!$('lobbyView').hidden) loadLobby();
    }, 30000);
  }

  /* ---------- test engine ---------- */
  function lsKey() { return 'ml_mock_' + attemptId; }
  function saveLocal() {
    try {
      localStorage.setItem(lsKey(), JSON.stringify({ answers: answers, marked: marked }));
    } catch (e) { /* storage full / private mode — non-fatal */ }
  }
  function loadLocal() {
    try {
      var raw = localStorage.getItem(lsKey());
      if (raw) {
        var d = JSON.parse(raw);
        answers = d.answers || {};
        marked = d.marked || {};
      }
    } catch (e) { /* ignore */ }
  }

  function startTestFlow(testId) {
    if (!currentUser) {
      toast('Please sign in to take the mock test.');
      showView('lobbyView');
      return;
    }
    sb.rpc('start_mock_attempt', { p_mock_test_id: testId }).then(function (res) {
      if (res.error) { toast(friendlyErr(res.error)); loadLobby(); return; }
      var d = res.data;
      attemptId = d.attempt_id;
      if (d.already_submitted) {
        showResultView();
        return;
      }
      sb.from('mock_tests').select('*').eq('id', testId).single().then(function (tr) {
        currentTest = tr.data;
        deadlineMs = new Date(d.deadline_at).getTime();
        loadLocal();
        return sb.rpc('get_mock_questions', { p_mock_test_id: testId });
      }).then(function (qr) {
        if (qr.error) { toast(friendlyErr(qr.error)); loadLobby(); return; }
        questions = qr.data || [];
        if (!questions.length) { toast('No questions in this test yet.'); loadLobby(); return; }
        renderTestView();
      });
    });
  }

  function renderTestView() {
    showView('testView');
    $('testTitle').textContent = currentTest.title;
    renderPalette();
    renderQuestion();
    startTimer();
    window.onbeforeunload = function () {
      return 'Your test is in progress. Leaving may cost you time.';
    };
  }

  function startTimer() {
    clearInterval(timerInt);
    function tick() {
      var left = deadlineMs - Date.now();
      var el = $('timer');
      el.textContent = fmtHMS(left);
      el.classList.toggle('danger', left < 10 * 60 * 1000);
      if (left <= 0) {
        clearInterval(timerInt);
        doSubmit(true);
      }
    }
    tick();
    timerInt = setInterval(tick, 1000);
  }

  function renderPalette() {
    var p = $('palette');
    p.innerHTML = '';
    questions.forEach(function (q, i) {
      var b = document.createElement('button');
      b.className = 'mt-pal-btn';
      b.textContent = (i + 1);
      b.dataset.i = i;
      if (answers[q.sort_order]) b.classList.add('answered');
      if (marked[q.sort_order]) b.classList.add('marked');
      if (i === currentIdx) b.classList.add('current');
      b.onclick = function () { currentIdx = i; renderQuestion(); renderPalette(); };
      p.appendChild(b);
    });
  }

  function renderQuestion() {
    var q = questions[currentIdx];
    var card = $('questionCard');
    var letters = optLetters(q);
    var html = '<div class="qnum">Question ' + (currentIdx + 1) + ' of ' + questions.length +
      (q.subject ? ' · ' + esc(q.subject) : '') + '</div>' +
      '<div class="qtext">' + sanitizeQuestionHtml(q.question_text) + '</div>';
    letters.forEach(function (k) {
      var sel = answers[q.sort_order] === k ? ' selected' : '';
      html += '<button class="mt-opt' + sel + '" data-k="' + k + '">' +
        '<span class="key">' + k + '</span><span>' + sanitizeQuestionHtml(q['option_' + k]) + '</span></button>';
    });
    card.innerHTML = html;
    Array.prototype.forEach.call(card.querySelectorAll('.mt-opt'), function (btn) {
      btn.onclick = function () {
        answers[q.sort_order] = btn.dataset.k;
        saveLocal();
        renderQuestion();
        renderPalette();
      };
    });
    $('prevBtn').disabled = currentIdx === 0;
    $('nextBtn').disabled = currentIdx === questions.length - 1;
    $('markBtn').textContent = marked[q.sort_order] ? 'Unmark review' : 'Mark for review';
  }

  function wireTestButtons() {
    $('prevBtn').onclick = function () {
      if (currentIdx > 0) { currentIdx--; renderQuestion(); renderPalette(); }
    };
    $('nextBtn').onclick = function () {
      if (currentIdx < questions.length - 1) { currentIdx++; renderQuestion(); renderPalette(); }
    };
    $('markBtn').onclick = function () {
      var q = questions[currentIdx];
      if (marked[q.sort_order]) delete marked[q.sort_order];
      else marked[q.sort_order] = true;
      saveLocal();
      renderQuestion();
      renderPalette();
    };
    $('clearBtn').onclick = function () {
      var q = questions[currentIdx];
      delete answers[q.sort_order];
      saveLocal();
      renderQuestion();
      renderPalette();
    };
    $('submitBtn').onclick = function () { confirmSubmit(); };
  }

  function answeredCount() {
    return Object.keys(answers).length;
  }
  function confirmSubmit() {
    var n = questions.length - answeredCount();
    var msg = n > 0
      ? 'You have ' + n + ' unanswered question' + (n === 1 ? '' : 's') + '. Submit anyway?'
      : 'Submit your test? You cannot change answers after submitting.';
    if (window.confirm(msg)) doSubmit(false);
  }

  function doSubmit(auto) {
    if (submitLock) return;
    submitLock = true;
    window.onbeforeunload = null;
    clearInterval(timerInt);
    $('submitBtn').disabled = true;
    $('submitBtn').textContent = auto ? 'Time up — submitting…' : 'Submitting…';
    sb.rpc('submit_mock_attempt', { p_attempt_id: attemptId, p_answers: answers })
      .then(function (res) {
        submitLock = false;
        if (res.error) { toast(friendlyErr(res.error)); return; }
        try { localStorage.removeItem(lsKey()); } catch (e) {}
        showResultView(res.data);
      });
  }

  /* ---------- result + leaderboard ---------- */
  function showResultView(submitData) {
    showView('resultView');
    clearInterval(timerInt);
    window.onbeforeunload = null;
    if (submitData) {
      renderScore(submitData);
      loadLeaderboard();
    } else {
      // Returning user with an already-submitted attempt: pull detail via RPC.
      sb.rpc('get_my_attempt', { p_attempt_id: attemptId }).then(function (res) {
        if (res.error) { toast(friendlyErr(res.error)); loadLobby(); return; }
        var a = res.data.attempt;
        renderScore({
          score: a.score, correct: a.correct_count, wrong: a.wrong_count,
          skipped: a.skipped_count, time_taken_seconds: a.time_taken_seconds,
          rank: null, total_questions: questions.length || a.total
        });
        loadLeaderboard();
      });
    }
    $('reviewBtn').onclick = loadReview;
    $('shareRankBtn').onclick = function () {
      var rank = $('resRank').textContent || '';
      var score = $('resScore').textContent || '';
      var title = currentTest ? currentTest.title : 'Mock Test';
      shareLink(title,
        'I ranked ' + rank + ' scoring ' + score + ' in "' + title +
        '" on MedLadder! Can you beat me?',
        location.href);
    };
  }

  function renderScore(d) {
    $('resRank').textContent = d.rank ? '#' + d.rank : '#–';
    var total = (currentTest ? currentTest.total_questions : d.total_questions) || questions.length;
    var maxMarks = total * (currentTest ? Number(currentTest.positive_marks) : 4);
    $('resScore').textContent = d.score + ' / ' + maxMarks;
    $('resBreakup').innerHTML =
      '<span><span class="c">✓ ' + d.correct + '</span> correct</span>' +
      '<span><span class="w">✗ ' + d.wrong + '</span> wrong</span>' +
      '<span><span class="s">– ' + d.skipped + '</span> skipped</span>' +
      '<span>⏱ ' + fmtDur(d.time_taken_seconds) + '</span>';
  }

  function loadLeaderboard() {
    var box = $('leaderboard');
    box.innerHTML = '<div class="mt-board-empty">Loading leaderboard…</div>';
    sb.rpc('get_leaderboard', { p_mock_test_id: currentTest.id, p_limit: 100 })
      .then(function (res) {
        if (res.error) { box.innerHTML = '<div class="mt-board-empty">Could not load.</div>'; return; }
        renderBoard(res.data || []);
        subscribeBoard();
      });
  }

  function renderBoard(rows) {
    renderBoardInto(rows, $('leaderboard'));
    var live = testPhase(currentTest) === 'live';
    $('liveDot').hidden = !live;
  }
  function renderBoardInto(rows, box, emptyMsg) {
    if (!rows.length) {
      box.innerHTML = '<div class="mt-board-empty">' +
        esc(emptyMsg || 'No submissions yet — be the first on the board!') + '</div>';
      return;
    }
    var html = '';
    rows.forEach(function (r) {
      html += '<div class="mt-board-row' + (r.is_you ? ' you' : '') + '">' +
        '<span class="rank">#' + r.rank + '</span>' +
        '<span>' + esc(r.display_name) + (r.is_you ? ' (you)' : '') +
        '<div class="sub">' + r.correct + '✓ ' + r.wrong + '✗ · ' + fmtDur(r.time_taken) + '</div></span>' +
        '<span class="pts">' + r.score + '</span>' +
        '<span class="sub">' + new Date(r.submitted_at).toLocaleTimeString() + '</span>' +
        '</div>';
    });
    box.innerHTML = html;
  }

  /* ---------- ended test: final leaderboard (no attempt needed) ---------- */
  function openEndedTest(id) {
    if (('' + location.search) !== ('?id=' + id)) {
      history.pushState({}, '', (location.pathname || '/mock-test.html') + '?id=' + id);
    }
    route();
  }
  function showEndedView(t) {
    currentTest = t;
    showView('endedView');
    $('endedTitle').textContent = t.title;
    $('endedMeta').textContent = t.exam + ' · ' + t.total_questions + ' questions · ' +
      'Ended ' + new Date(t.ends_at).toLocaleString();
    loadEndedLeaderboard();
  }
  function loadEndedLeaderboard() {
    var box = $('endedLeaderboard');
    if (!currentUser) {
      box.innerHTML = '<div class="mt-board-empty">Sign in to view the final leaderboard.<br><br>' +
        '<button class="mt-btn mt-btn-primary" id="endedGoogleBtn">Sign in with Google</button></div>';
      $('endedGoogleBtn').onclick = doGoogleSignIn;
      return;
    }
    box.innerHTML = '<div class="mt-board-empty">Loading final leaderboard…</div>';
    sb.rpc('get_leaderboard', { p_mock_test_id: currentTest.id, p_limit: 100 })
      .then(function (res) {
        if (res.error) { box.innerHTML = '<div class="mt-board-empty">Could not load.</div>'; return; }
        renderBoardInto(res.data || [], box, 'No submissions were recorded for this test.');
      });
  }

  function subscribeBoard() {
    if (lbChannel) { sb.removeChannel(lbChannel); lbChannel = null; }
    lbChannel = sb.channel('mocklb:' + currentTest.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mock_attempts', filter: 'mock_test_id=eq.' + currentTest.id },
        function () {
          // Debounced refresh — many submits can land at once.
          clearTimeout(subscribeBoard._t);
          subscribeBoard._t = setTimeout(loadLeaderboardQuiet, 1500);
        })
      .subscribe();
  }
  function loadLeaderboardQuiet() {
    sb.rpc('get_leaderboard', { p_mock_test_id: currentTest.id, p_limit: 100 })
      .then(function (res) {
        if (!res.error) renderBoard(res.data || []);
      });
  }

  function loadReview() {
    var pane = $('reviewPane');
    pane.hidden = false;
    pane.innerHTML = '<p style="color:var(--muted)">Loading review…</p>';
    pane.scrollIntoView({ behavior: 'smooth' });
    sb.rpc('get_my_attempt', { p_attempt_id: attemptId }).then(function (res) {
      if (res.error) { toast(friendlyErr(res.error)); return; }
      var d = res.data;
      var given = d.attempt.answers || {};
      var html = '';
      (d.questions || []).forEach(function (q, i) {
        var pick = (given[q.sort_order] || '').toLowerCase();
        var ans = String(q.answer || '').toLowerCase().trim();
        var cls = !pick ? 'skipped-q' : (pick === ans ? 'correct-q' : 'wrong-q');
        html += '<div class="mt-qcard ' + cls + '">' +
          '<div class="qnum">Question ' + (i + 1) + (q.subject ? ' · ' + esc(q.subject) : '') + '</div>' +
          '<div class="qtext">' + sanitizeQuestionHtml(q.question_text) + '</div>';
        optLetters(q).forEach(function (k) {
          var c = '';
          if (k === ans) c = ' correct-opt';
          else if (k === pick) c = ' wrong-pick';
          html += '<div class="mt-opt' + c + '"><span class="key">' + k + '</span>' +
            '<span>' + sanitizeQuestionHtml(q['option_' + k]) + '</span></div>';
        });
        if (q.explanation) {
          html += '<div class="mt-expl"><strong>Explanation:</strong> ' + sanitizeQuestionHtml(q.explanation) + '</div>';
        }
        html += '</div>';
      });
      pane.innerHTML = html || '<p>No questions found.</p>';
    });
  }

  /* ---------- view switching ---------- */
  function showView(id) {
    ['lobbyView', 'testView', 'resultView', 'endedView'].forEach(function (v) {
      $(v).hidden = v !== id;
    });
    if (id !== 'resultView' && lbChannel) {
      sb.removeChannel(lbChannel);
      lbChannel = null;
    }
    window.scrollTo(0, 0);
  }

  /* ---------- client-side routing (no page reloads) ---------- */
  function stopTestLoops() {
    clearInterval(timerInt);
    clearInterval(countdownInt);
    window.onbeforeunload = null;
    if (lbChannel) { sb.removeChannel(lbChannel); lbChannel = null; }
  }
  function route() {
    stopTestLoops();
    var params = new URLSearchParams(location.search);
    var testId = params.get('id');
    if (testId) {
      sb.from('mock_tests').select('*').eq('id', testId).single().then(function (tr) {
        if (tr.error || !tr.data) { toast('Mock test not found.'); loadLobby(); return; }
        currentTest = tr.data;
        if (testPhase(currentTest) === 'ended') { showEndedView(currentTest); return; }
        startTestFlow(testId);
      });
    } else {
      loadLobby();
    }
  }
  function openTest(id) {
    if (('' + location.search) !== ('?id=' + id)) {
      history.pushState({}, '', (location.pathname || '/mock-test.html') + '?id=' + id);
    }
    route();
  }

  /* ---------- init ---------- */
  function init() {
    if (!window.supabase) {
      document.getElementById('viewRoot').innerHTML =
        '<p style="padding:40px;text-align:center">Failed to load. Please check your connection and refresh.</p>';
      return;
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    wireTestButtons();

    sb.auth.getSession().then(function (res) {
      currentUser = res.data.session ? res.data.session.user : null;
      renderAuth();

      route();
      window.addEventListener('popstate', route);
    });

    sb.auth.onAuthStateChange(function (_ev, session) {
      var u = session ? session.user : null;
      if ((u && !currentUser) || (!u && currentUser)) {
        currentUser = u;
        renderAuth();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
