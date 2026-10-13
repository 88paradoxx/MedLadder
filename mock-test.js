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
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.hidden = true; }, 3200);
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

  /* ---------- auth ---------- */
  function renderAuth() {
    var area = $('authArea');
    if (currentUser) {
      var name = esc(currentUser.email || 'Signed in');
      area.innerHTML = '<span>' + name + '</span>' +
        '<button class="mt-btn" id="signOutBtn">Sign out</button>';
      $('signOutBtn').onclick = function () {
        sb.auth.signOut().then(function () { location.reload(); });
      };
    } else {
      area.innerHTML =
        '<form class="mt-auth-form" id="authForm">' +
        '<input type="email" id="authEmail" placeholder="Email for magic link" required>' +
        '<button class="mt-btn" type="submit">Sign in</button>' +
        '<button class="mt-btn" type="button" id="googleBtn">Google</button>' +
        '</form>';
      $('authForm').onsubmit = function (ev) {
        ev.preventDefault();
        var email = $('authEmail').value.trim();
        sb.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: location.href }
        }).then(function (res) {
          if (res.error) toast(res.error.message);
          else toast('Check your email for the sign-in link.');
        });
      };
      $('googleBtn').onclick = function () {
        sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: location.href }
        });
      };
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
  function loadLobby() {
    showView('lobbyView');
    var list = $('testList');
    list.innerHTML = '<p style="color:var(--muted)">Loading mock tests…</p>';
    sb.from('mock_tests')
      .select('id,title,exam,description,starts_at,ends_at,duration_minutes,total_questions,is_free')
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
            '</div></div>' +
            '<div>' + phaseBadge(phase) + ' ' +
            (t.is_free ? '<span class="mt-badge free">FREE</span>' : '<span class="mt-badge pro">PRO</span>') +
            '</div>' +
            '<button class="mt-btn mt-btn-primary">' + btn + '</button>';
          card.querySelector('button').onclick = function () {
            location.href = '/mock-test?id=' + t.id;
          };
          list.appendChild(card);
        });
        tickCountdowns(tests);
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
      '<div class="qtext">' + esc(q.question_text) + '</div>';
    letters.forEach(function (k) {
      var sel = answers[q.sort_order] === k ? ' selected' : '';
      html += '<button class="mt-opt' + sel + '" data-k="' + k + '">' +
        '<span class="key">' + k + '</span><span>' + esc(q['option_' + k]) + '</span></button>';
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
    var box = $('leaderboard');
    if (!rows.length) {
      box.innerHTML = '<div class="mt-board-empty">No submissions yet — be the first on the board!</div>';
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
    var live = testPhase(currentTest) === 'live';
    $('liveDot').hidden = !live;
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
          '<div class="qtext">' + esc(q.question_text) + '</div>';
        optLetters(q).forEach(function (k) {
          var c = '';
          if (k === ans) c = ' correct-opt';
          else if (k === pick) c = ' wrong-pick';
          html += '<div class="mt-opt' + c + '"><span class="key">' + k + '</span>' +
            '<span>' + esc(q['option_' + k]) + '</span></div>';
        });
        if (q.explanation) {
          html += '<div class="mt-expl"><strong>Explanation:</strong> ' + esc(q.explanation) + '</div>';
        }
        html += '</div>';
      });
      pane.innerHTML = html || '<p>No questions found.</p>';
    });
  }

  /* ---------- view switching ---------- */
  function showView(id) {
    ['lobbyView', 'testView', 'resultView'].forEach(function (v) {
      $(v).hidden = v !== id;
    });
    if (id !== 'resultView' && lbChannel) {
      sb.removeChannel(lbChannel);
      lbChannel = null;
    }
    window.scrollTo(0, 0);
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

      var params = new URLSearchParams(location.search);
      var testId = params.get('id');
      if (testId) {
        sb.from('mock_tests').select('*').eq('id', testId).single().then(function (tr) {
          if (tr.error || !tr.data) { toast('Mock test not found.'); loadLobby(); return; }
          currentTest = tr.data;
          startTestFlow(testId);
        });
      } else {
        loadLobby();
      }
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
