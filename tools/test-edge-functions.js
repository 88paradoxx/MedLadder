#!/usr/bin/env node
// Offline test of the Edge Functions' logic: transpiles the TypeScript, runs the
// real handlers under a fake Deno + in-memory fake Supabase + fake Razorpay API.
// Needs the `typescript` package:  npm i -D typescript   (then: node tools/test-edge-functions.js)
const fs = require('fs'), path = require('path'), crypto = require('crypto'), Module = require('module');
let ts;
try { ts = require('typescript'); } catch (e) {
  try {
    ts = require(process.env.TS_PATH || require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'typescript'));
  } catch (e2) {
    try {
      ts = require(path.join(__dirname, '..', 'node_modules', 'typescript'));
    } catch (e3) {
      console.error('TypeScript is required to run this test. Please run: npm install');
      process.exit(1);
    }
  }
}
const FN = path.join(__dirname, '..', 'supabase', 'functions');

// ── fake in-memory Supabase ────────────────────────────────────────────────
const db = { subscriptions: [], payments: [], admin_audit: [] };
const users = {
  'tok-alice': { id: 'u-alice', email: 'alice@example.com', app_metadata: {}, user_metadata: { role: 'admin' } },
  'tok-bob':   { id: 'u-bob',   email: 'bob@example.com',   app_metadata: {}, user_metadata: {} },
  'tok-admin': { id: 'u-admin', email: 'boss@example.com',  app_metadata: { role: 'admin' }, user_metadata: {} },
};
const emailToId = { 'alice@example.com': 'u-alice', 'bob@example.com': 'u-bob', 'boss@example.com': 'u-admin' };
let idSeq = 1;
function builder(table) {
  let op = 'select', filters = [], order = null, lim = null, payload = null, head = false, wantCount = false;
  const b = {
    select(cols, opts) { if (op === 'select') op = 'select'; if (opts && opts.head) head = true; if (opts && opts.count) wantCount = true; return b; },
    insert(row) { op = 'insert'; payload = row; return b; },
    update(p) { op = 'update'; payload = p; return b; },
    eq(c, v) { filters.push(r => r[c] === v); return b; },
    gt(c, v) { filters.push(r => String(r[c]) > String(v)); return b; },
    order(c, o) { order = [c, o && o.ascending === false ? -1 : 1]; return b; },
    limit(n) { lim = n; return b; },
    then(res, rej) { return Promise.resolve(run()).then(res, rej); },
  };
  function run() {
    const rows = db[table];
    if (op === 'insert') {
      const row = Object.assign({ id: 'row' + (idSeq++), created_at: new Date().toISOString() }, payload);
      if (table === 'subscriptions' && row.razorpay_payment_id && rows.some(r => r.razorpay_payment_id === row.razorpay_payment_id)) {
        return { data: null, error: { code: '23505', message: 'dup' } };
      }
      rows.push(row); return { data: null, error: null };
    }
    let m = rows.filter(r => filters.every(f => f(r)));
    if (op === 'update') { m.forEach(r => Object.assign(r, payload)); return { data: null, error: null }; }
    if (order) m = m.slice().sort((a, c) => (a[order[0]] > c[order[0]] ? 1 : a[order[0]] < c[order[0]] ? -1 : 0) * order[1]);
    if (lim !== null) m = m.slice(0, lim);
    return { data: head ? null : m, error: null, count: wantCount ? m.length : undefined };
  }
  return b;
}
const fakeClient = {
  from: builder,
  rpc: async (name, args) => name === 'admin_find_user_id' ? { data: emailToId[String(args.p_email).toLowerCase()] || null, error: null } : { data: null, error: { message: 'no rpc' } },
  auth: { getUser: async (t) => users[t] ? { data: { user: users[t] }, error: null } : { data: null, error: { message: 'bad' } } },
};

// ── fake Razorpay API ─────────────────────────────────────────────────────
const KEY_SECRET = 'test_key_secret', WEBHOOK_SECRET = 'test_webhook_secret';
const rzp = { orders: {}, payments: {}, captured: [] };
global.fetch = async (url, init) => {
  const u = String(url), body = init && init.body ? JSON.parse(init.body) : null;
  const ok = (o, s) => ({ ok: (s || 200) < 300, status: s || 200, json: async () => o, text: async () => JSON.stringify(o) });
  if (u.endsWith('/v1/orders')) { const id = 'order_' + (idSeq++) + 'ABCDEF'; rzp.orders[id] = body; return ok({ id, amount: body.amount }); }
  let m = u.match(/\/v1\/payments\/([A-Za-z0-9_]+)\/capture$/);
  if (m) { rzp.captured.push(m[1]); rzp.payments[m[1]].status = 'captured'; return ok({}); }
  m = u.match(/\/v1\/payments\/([A-Za-z0-9_]+)$/);
  if (m) return rzp.payments[m[1]] ? ok(rzp.payments[m[1]]) : ok({}, 404);
  return ok({}, 404);
};

// ── minimal Deno + module loader ──────────────────────────────────────────
const envVars = { SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'svc', RAZORPAY_KEY_ID: 'rzp_test_x',
  RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET };
let handler = null;
global.Deno = { env: { get: k => envVars[k] }, serve: fn => { handler = fn; } };
const cache = {};
function load(file) {
  file = path.resolve(file);
  if (cache[file]) return cache[file].exports;
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} }; cache[file] = mod;
  const req = spec => {
    if (spec.startsWith('npm:@supabase/supabase-js')) return { createClient: () => fakeClient };
    if (spec.startsWith('.')) return load(path.resolve(path.dirname(file), spec));
    return require(spec);
  };
  new Function('require', 'module', 'exports', js)(req, mod, mod.exports);
  return mod.exports;
}
async function call(fn, { method = 'POST', token, body, headers = {}, raw } = {}) {
  handler = null; Object.keys(cache).forEach(k => delete cache[k]);
  load(path.join(FN, fn, 'index.ts'));
  const h = Object.assign({ Origin: 'https://medladder.top' }, headers);
  if (token) h.Authorization = 'Bearer ' + token;
  const req = new Request('https://x/functions/v1/' + fn, { method, headers: h, body: method === 'POST' ? (raw !== undefined ? raw : JSON.stringify(body || {})) : undefined });
  const res = await handler(req);
  let data = null; try { data = JSON.parse(await res.clone().text()); } catch (e) {}
  return { status: res.status, data, headers: res.headers };
}
const sign = (o, p) => crypto.createHmac('sha256', KEY_SECRET).update(o + '|' + p).digest('hex');

let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + JSON.stringify(extra) : '')); } }

(async () => {
  console.log('CORS / auth');
  let r = await call('razorpay-order', { method: 'OPTIONS' });
  check('preflight 204 + allow-origin', r.status === 204 && r.headers.get('access-control-allow-origin') === 'https://medladder.top');
  r = await call('razorpay-order', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
  check('preflight for unknown origin gets no allow-origin', !r.headers.get('access-control-allow-origin'));
  r = await call('razorpay-order', { body: { plan_id: '1_month' } });
  check('order without login -> 401', r.status === 401);

  console.log('razorpay-order');
  r = await call('razorpay-order', { token: 'tok-bob', body: { plan_id: 'nope' } });
  check('unknown plan -> 400', r.status === 400);
  r = await call('razorpay-order', { token: 'tok-bob', body: { plan_id: '1_year', amount: 100, user_id: 'u-alice' } });
  check('order ok; ignores client amount', r.status === 200 && r.data.amount === 99900 && rzp.orders[r.data.order_id].amount === 99900);
  check('payments row created for caller (not spoofed user)', db.payments.length === 1 && db.payments[0].user_id === 'u-bob' && db.payments[0].status === 'created');
  const orderId = r.data.order_id;

  console.log('razorpay-verify');
  const payId = 'pay_ABC123456';
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: 'deadbeef' } });
  check('bad signature -> 400, no Pro', r.status === 400 && r.data.verified === false && db.subscriptions.length === 0);
  r = await call('razorpay-verify', { token: 'tok-alice', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check("another user can't claim bob's order", r.status === 404 && db.subscriptions.length === 0);

  console.log('razorpay-verify (no-order fallback BLOCKED)');
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId } });
  check('verify with no order_id -> 400', r.status === 400 && r.data.verified === false);
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: '' } });
  check('verify with empty order_id -> 400', r.status === 400 && r.data.verified === false);
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: '', razorpay_signature: '', plan_id: '1_year' } });
  check('verify with plan_id but no order_id -> 400 (old fallback blocked)', r.status === 400 && r.data.verified === false);
  check('no subscriptions were created by blocked fallback', db.subscriptions.length === 0);

  console.log('razorpay-verify (normal flow)');
  rzp.payments[payId] = { id: payId, order_id: orderId, amount: 1, currency: 'INR', status: 'captured' };
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check('valid signature but wrong amount at Razorpay -> rejected', r.status === 400 && db.subscriptions.length === 0);
  rzp.payments[payId] = { id: payId, order_id: orderId, amount: 99900, currency: 'INR', status: 'created' };
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check('payment not completed -> rejected', r.status === 400 && db.subscriptions.length === 0);
  rzp.payments[payId] = { id: payId, order_id: orderId, amount: 99900, currency: 'INR', status: 'authorized' };
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check('authorized payment gets captured, Pro granted', r.status === 200 && r.data.verified === true && rzp.captured.includes(payId) && db.subscriptions.length === 1);
  const exp1 = Date.parse(db.subscriptions[0].expires_at);
  check('expiry ~365 days out', Math.abs(exp1 - (Date.now() + 365 * 86400000)) < 60000);
  check('payments row marked paid + verified_on_server', db.payments[0].status === 'paid' && db.payments[0].verified_on_server === true);
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check('replaying the same payment does not add time', r.status === 200 && db.subscriptions.length === 1);

  console.log('grantSubscription cross-user guard');
  // Alice tries to replay Bob's already-granted payment ID — should get 409
  r = await call('razorpay-verify', { token: 'tok-alice', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sign(orderId, payId) } });
  check("cross-user payment replay -> blocked (404 or 409)", (r.status === 404 || r.status === 409) && db.subscriptions.length === 1);

  console.log('razorpay-webhook');
  const evt = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_WEBHOOK99', order_id: orderId, amount: 99900, currency: 'INR' } } } };
  const rawEvt = JSON.stringify(evt);
  r = await call('razorpay-webhook', { raw: rawEvt, headers: { 'x-razorpay-signature': 'bad' } });
  check('webhook bad signature -> 400', r.status === 400 && db.subscriptions.length === 1);
  const wsig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawEvt).digest('hex');
  r = await call('razorpay-webhook', { raw: rawEvt, headers: { 'x-razorpay-signature': wsig } });
  check('webhook good signature grants (stacks time on top of active sub)', r.status === 200 && db.subscriptions.length === 2 &&
    Date.parse(db.subscriptions[1].expires_at) > exp1 + 364 * 86400000);
  r = await call('razorpay-webhook', { raw: rawEvt, headers: { 'x-razorpay-signature': wsig } });
  check('webhook replay is idempotent', r.status === 200 && db.subscriptions.length === 2);
  const evt2 = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_TAMPER01', order_id: orderId, amount: 100, currency: 'INR' } } } });
  const w2 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(evt2).digest('hex');
  r = await call('razorpay-webhook', { raw: evt2, headers: { 'x-razorpay-signature': w2 } });
  check('webhook with wrong amount grants nothing', db.subscriptions.length === 2);

  console.log('razorpay-refund-webhook');
  const refundEvt = { event: 'refund.created', payload: { refund: { entity: { id: 'rfnd_001', payment_id: payId, amount: 99900 } } } };
  const rawRefund = JSON.stringify(refundEvt);
  r = await call('razorpay-refund-webhook', { raw: rawRefund, headers: { 'x-razorpay-signature': 'bad' } });
  check('refund webhook bad signature -> 400', r.status === 400);
  const activeBefore = db.subscriptions.filter(s => s.razorpay_payment_id === payId && s.status === 'active').length;
  const rsig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawRefund).digest('hex');
  r = await call('razorpay-refund-webhook', { raw: rawRefund, headers: { 'x-razorpay-signature': rsig } });
  check('refund webhook revokes Pro for refunded payment', r.status === 200 &&
    db.subscriptions.filter(s => s.razorpay_payment_id === payId && s.status === 'active').length === 0 &&
    db.subscriptions.filter(s => s.razorpay_payment_id === payId && s.status === 'refunded').length > 0);

  const disputeEvt = { event: 'payment.dispute.created', payload: { dispute: { entity: { id: 'disp_001', payment_id: 'pay_WEBHOOK99' } } } };
  const rawDispute = JSON.stringify(disputeEvt);
  const dsig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawDispute).digest('hex');
  r = await call('razorpay-refund-webhook', { raw: rawDispute, headers: { 'x-razorpay-signature': dsig } });
  check('dispute webhook revokes Pro for disputed payment', r.status === 200 &&
    db.subscriptions.filter(s => s.razorpay_payment_id === 'pay_WEBHOOK99' && s.status === 'active').length === 0 &&
    db.subscriptions.filter(s => s.razorpay_payment_id === 'pay_WEBHOOK99' && s.status === 'disputed').length > 0);

  console.log('admin-grant-pro');
  r = await call('admin-grant-pro', { token: 'tok-alice', body: { target_email: 'bob@example.com', days: 30 } });
  check('user_metadata.role=admin is NOT admin -> 403', r.status === 403);
  r = await call('admin-grant-pro', { token: 'tok-bob', body: { target_email: 'bob@example.com', days: 30 } });
  check('normal user -> 403', r.status === 403);
  r = await call('admin-grant-pro', { token: 'tok-admin', body: { target_email: 'nobody@example.com', days: 30 } });
  check('unknown email -> 404', r.status === 404);
  r = await call('admin-grant-pro', { token: 'tok-admin', body: { target_email: 'alice@example.com', days: 99999 } });
  check('days out of range -> 400', r.status === 400);
  r = await call('admin-grant-pro', { token: 'tok-admin', body: { target_email: 'Alice@Example.com', days: 30 } });
  check('admin grant works (case-insensitive email)', r.status === 200 && r.data.success && db.subscriptions.some(s => s.user_id === 'u-alice' && s.granted_by === 'boss@example.com'));
  r = await call('admin-grant-pro', { token: 'tok-admin', body: { action: 'revoke', target_email: 'alice@example.com' } });
  check('admin revoke cancels active subs', r.status === 200 && db.subscriptions.filter(s => s.user_id === 'u-alice').every(s => s.status === 'cancelled'));
  check('audit log written', db.admin_audit.length === 2);

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
