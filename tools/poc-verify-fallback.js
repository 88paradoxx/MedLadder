#!/usr/bin/env node
// PoC: proves the Razorpay verify fallback exploit is now BLOCKED.
//
// Before the fix, submitting a valid payment ID with no order_id would grant
// a subscription to the caller — even if the payment belonged to someone else.
// After the fix, order_id is mandatory; this script confirms the reject.
//
// Run: node tools/poc-verify-fallback.js
// Requires: npm i -D typescript (same as test-edge-functions.js)

const fs = require('fs'), path = require('path'), crypto = require('crypto'), Module = require('module');
let ts;
try { ts = require('typescript'); } catch (e) {
  try {
    ts = require(process.env.TS_PATH || require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'typescript'));
  } catch (e2) {
    ts = require('/home/claude/.npm-global/lib/node_modules/typescript');
  }
}
const FN = path.join(__dirname, '..', 'supabase', 'functions');

// ── fake in-memory Supabase ────────────────────────────────────────────────
const db = { subscriptions: [], payments: [], admin_audit: [] };
const users = {
  'tok-mallory': { id: 'u-mallory', email: 'mallory@example.com', app_metadata: {}, user_metadata: {} },
  'tok-bob':     { id: 'u-bob',     email: 'bob@example.com',     app_metadata: {}, user_metadata: {} },
};
let idSeq = 1;
function builder(table) {
  let op = 'select', filters = [], order = null, lim = null, payload = null, head = false, wantCount = false;
  const b = {
    select(cols, opts) { if (opts && opts.head) head = true; if (opts && opts.count) wantCount = true; return b; },
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
  rpc: async () => ({ data: null, error: null }),
  auth: { getUser: async (t) => users[t] ? { data: { user: users[t] }, error: null } : { data: null, error: { message: 'bad' } } },
};

// ── fake Razorpay ──────────────────────────────────────────────────────────
const KEY_SECRET = 'test_key_secret';
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

const envVars = { SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'svc', RAZORPAY_KEY_ID: 'rzp_test_x',
  RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_WEBHOOK_SECRET: 'wh' };
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
  return { status: res.status, data };
}

(async () => {
  console.log('=== PoC: Razorpay verify fallback exploit ===\n');

  // Setup: Bob creates an order and makes a payment
  let r = await call('razorpay-order', { token: 'tok-bob', body: { plan_id: '1_year' } });
  const orderId = r.data.order_id;
  const payId = 'pay_BOB_REAL_PAYMENT';
  rzp.payments[payId] = { id: payId, order_id: orderId, amount: 99900, currency: 'INR', status: 'captured' };
  console.log('Bob created order ' + orderId + ' and paid with ' + payId);

  // Bob verifies normally
  const sig = crypto.createHmac('sha256', KEY_SECRET).update(orderId + '|' + payId).digest('hex');
  r = await call('razorpay-verify', { token: 'tok-bob', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sig } });
  console.log('Bob verify: status=' + r.status + ' verified=' + (r.data && r.data.verified));
  console.log('Bob has ' + db.subscriptions.filter(s => s.user_id === 'u-bob').length + ' subscription(s)\n');

  // Mallory's EXPLOIT ATTEMPT 1: Submit Bob's payment ID with no order
  console.log('--- Mallory exploit attempt 1: no order_id ---');
  r = await call('razorpay-verify', { token: 'tok-mallory', body: { razorpay_payment_id: payId } });
  console.log('Mallory verify (no order): status=' + r.status + ' error=' + (r.data && r.data.error));
  const mallorySubs1 = db.subscriptions.filter(s => s.user_id === 'u-mallory').length;
  console.log('Mallory subscriptions: ' + mallorySubs1 + (mallorySubs1 === 0 ? ' ✅ BLOCKED' : ' ❌ EXPLOITED'));

  // Mallory's EXPLOIT ATTEMPT 2: Submit Bob's payment ID with empty order + plan_id
  console.log('\n--- Mallory exploit attempt 2: empty order_id + plan_id ---');
  r = await call('razorpay-verify', { token: 'tok-mallory', body: { razorpay_payment_id: payId, razorpay_order_id: '', razorpay_signature: '', plan_id: '1_year' } });
  console.log('Mallory verify (empty order): status=' + r.status + ' error=' + (r.data && r.data.error));
  const mallorySubs2 = db.subscriptions.filter(s => s.user_id === 'u-mallory').length;
  console.log('Mallory subscriptions: ' + mallorySubs2 + (mallorySubs2 === 0 ? ' ✅ BLOCKED' : ' ❌ EXPLOITED'));

  // Mallory's EXPLOIT ATTEMPT 3: Use Bob's order_id but can't sign it
  console.log('\n--- Mallory exploit attempt 3: Bob\'s order_id, bad signature ---');
  r = await call('razorpay-verify', { token: 'tok-mallory', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: 'deadbeef' } });
  console.log('Mallory verify (bad sig): status=' + r.status + ' error=' + (r.data && r.data.error));
  const mallorySubs3 = db.subscriptions.filter(s => s.user_id === 'u-mallory').length;
  console.log('Mallory subscriptions: ' + mallorySubs3 + (mallorySubs3 === 0 ? ' ✅ BLOCKED' : ' ❌ EXPLOITED'));

  // Mallory's EXPLOIT ATTEMPT 4: Forge valid signature, but order belongs to Bob
  console.log('\n--- Mallory exploit attempt 4: valid signature, Bob\'s order ---');
  r = await call('razorpay-verify', { token: 'tok-mallory', body: { razorpay_payment_id: payId, razorpay_order_id: orderId, razorpay_signature: sig } });
  console.log('Mallory verify (valid sig, wrong user): status=' + r.status + ' error=' + (r.data && r.data.error));
  const mallorySubs4 = db.subscriptions.filter(s => s.user_id === 'u-mallory').length;
  console.log('Mallory subscriptions: ' + mallorySubs4 + (mallorySubs4 === 0 ? ' ✅ BLOCKED' : ' ❌ EXPLOITED'));

  // Summary
  const allBlocked = mallorySubs1 === 0 && mallorySubs2 === 0 && mallorySubs3 === 0 && mallorySubs4 === 0;
  console.log('\n=== RESULT: ' + (allBlocked ? '✅ All exploit paths BLOCKED' : '❌ VULNERABLE — exploit succeeded') + ' ===');
  console.log('Bob subscriptions: ' + db.subscriptions.filter(s => s.user_id === 'u-bob').length);
  console.log('Mallory subscriptions: ' + db.subscriptions.filter(s => s.user_id === 'u-mallory').length);

  process.exit(allBlocked ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
