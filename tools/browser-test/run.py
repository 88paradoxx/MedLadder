import json, subprocess, time, sys, os
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PORT = 8123
BASE = f'http://localhost:{PORT}'
srv = subprocess.Popen(['node', 'server.js', ROOT, str(PORT)], cwd=os.path.dirname(os.path.abspath(__file__)))
time.sleep(1)
STUB = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'supabase-stub.js')).read()
RZP = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'razorpay-stub.js')).read()
results = []
def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('  ok   ' if cond else '  FAIL ') + name + (('  -> ' + str(extra)) if (extra and not cond) else ''))

def make_ctx(pw, mock=None, order_ok=True, verify_ok=True):
    b = pw.chromium.launch()
    ctx = b.new_context()
    ctx.add_init_script("localStorage.getItem('__mock')===null && localStorage.setItem('__mock', %s)" % json.dumps(json.dumps(mock or {})))
    log = {'console': [], 'errors': [], 'fn': []}
    def route(r):
        u = r.request.url
        if 'supabase-js' in u: return r.fulfill(status=200, content_type='application/javascript', body=STUB)
        if 'googletagmanager.com' in u: return r.fulfill(status=200, content_type='application/javascript', body='')
        if 'checkout.razorpay.com' in u: return r.fulfill(status=200, content_type='application/javascript', body=RZP)
        if '/functions/v1/' in u:
            log['fn'].append((r.request.method, u.split('/functions/v1/')[1], r.request.post_data))
            if r.request.method == 'OPTIONS': return r.fulfill(status=204, headers={'access-control-allow-origin': BASE, 'access-control-allow-headers': '*'})
            hdr = {'access-control-allow-origin': BASE, 'content-type': 'application/json'}
            if 'razorpay-order' in u:
                return r.fulfill(status=200, headers=hdr, body=json.dumps({'order_id': 'order_TEST123', 'amount': 79900, 'currency': 'INR'})) if order_ok else r.fulfill(status=502, headers=hdr, body='{}')
            if 'razorpay-verify' in u:
                return r.fulfill(status=200, headers=hdr, body=json.dumps({'verified': verify_ok}))
            return r.fulfill(status=200, headers=hdr, body='{"success":true}')
        if u.startswith(BASE): return r.continue_()
        return r.fulfill(status=200, body='')
    ctx.route('**/*', route)
    page = ctx.new_page()
    page.on('console', lambda m: log['console'].append(m.text))
    page.on('pageerror', lambda e: log['errors'].append(str(e)))
    return b, ctx, page, log

def csp_violations(log): return [c for c in log['console'] if 'Content Security Policy' in c or 'Refused to' in c]

FREE = {'id': 'u-free', 'email': 'free@example.com', 'app_metadata': {}, 'user_metadata': {'full_name': 'Free User'}}
FORGED = {'id': 'u-forge', 'email': 'forge@example.com', 'app_metadata': {}, 'user_metadata': {'full_name': 'Forger', 'expires_at': '2099-01-01T00:00:00Z', 'is_premium': True, 'is_pro': True, 'payment_id': 'pay_x', 'role': 'admin', 'is_admin': True}}
ADMIN = {'id': 'u-admin', 'email': 'boss@example.com', 'app_metadata': {'role': 'admin'}, 'user_metadata': {'full_name': 'Boss'}}

with sync_playwright() as pw:
    print('signed-out home + CSP')
    b, ctx, page, log = make_ctx(pw)
    page.goto(BASE + '/'); page.wait_for_selector('#app', timeout=8000); page.wait_for_timeout(1500)
    check('no page errors', not log['errors'], log['errors'])
    check('no CSP violations on home', not csp_violations(log), csp_violations(log))
    check('signed-out sees Pro upsell button', page.locator('#headerGoProBtn').count() >= 1)
    check('signed-out has no admin button', page.locator('#headerAdminBtn').count() == 0)
    check('legacy globals gone', page.evaluate("typeof window.unlockAdmin === 'undefined' && typeof window.activateAdminSession === 'undefined' && typeof window.lockAdminSession === 'undefined'"))
    check('service worker registered', page.evaluate("navigator.serviceWorker.getRegistration().then(r => !!r)"))
    page.goto(BASE + '/?admin=letmein#letmein'); page.wait_for_timeout(800)
    check('?admin= and #hash do nothing', page.locator('#headerAdminBtn').count() == 0 and page.locator('#adminModalOverlay.open').count() == 0)
    page.keyboard.type('adminadmin123'); page.wait_for_timeout(300)
    check('typing key sequences does nothing', page.locator('#adminModalOverlay.open').count() == 0)
    b.close()

    print('subject SEO page + CSP')
    b, ctx, page, log = make_ctx(pw)
    page.goto(BASE + '/subjects/anatomy'); page.wait_for_timeout(1500)
    check('subject page: no errors', not log['errors'], log['errors'])
    check('subject page: no CSP violations', not csp_violations(log), csp_violations(log))
    b.close()

    print('forged Pro / forged admin')
    forged_ls = {'user': FORGED, 'pro': False}
    b, ctx, page, log = make_ctx(pw, forged_ls)
    page.add_init_script("localStorage.setItem('medladder_pro_exp_u-forge','2099-01-01T00:00:00Z');localStorage.setItem('medladder_admin_session','true');localStorage.setItem('medladder_admin_email','forge@example.com');localStorage.setItem('medladder_admin_whitelist','[\"forge@example.com\"]')")
    page.goto(BASE + '/'); page.wait_for_timeout(2000)
    check('forged user_metadata/localStorage => NOT Pro (still sees upgrade button)', page.locator('#headerGoProBtn').count() >= 1 and page.locator('.pro-badge-header').count() == 0)
    check('forged user_metadata role/is_admin => NOT admin', page.locator('#headerAdminBtn').count() == 0)
    check('asked server for status (rpc my_pro_status)', page.evaluate("window.__calls.rpc.includes('my_pro_status')"))
    check('legacy localStorage keys cleaned', page.evaluate("localStorage.getItem('medladder_admin_session')===null && localStorage.getItem('medladder_pro_exp_u-forge')===null && localStorage.getItem('medladder_admin_whitelist')===null"))
    b.close()

    print('server says Pro')
    b, ctx, page, log = make_ctx(pw, {'user': FREE, 'pro': True})
    page.goto(BASE + '/'); page.wait_for_timeout(2000)
    check('server-confirmed Pro shows PRO badge', page.locator('.pro-badge-header').count() >= 1)
    b.close()

    print('admin')
    b, ctx, page, log = make_ctx(pw, {'user': ADMIN, 'pro': False})
    page.goto(BASE + '/'); page.wait_for_timeout(2000)
    check('real admin sees Admin button', page.locator('#headerAdminBtn').count() >= 1)
    page.locator('#headerAdminBtn').first.click(); page.wait_for_timeout(500)
    check('admin console shows grant/revoke', page.locator('#grantProBtn').count() == 1 and page.locator('#revokeProBtn').count() == 1)
    check('no whitelist / passkey UI left', page.locator('#addAdminEmailBtn').count() == 0 and page.locator('#adminUpdatePasskeyBtn').count() == 0)
    page.fill('#grantProEmailInput', 'student@example.com'); page.locator('#grantProBtn').click(); page.wait_for_timeout(800)
    sent = [f for f in log['fn'] if f[1].startswith('admin-grant-pro') and f[0] == 'POST']
    body = json.loads(sent[0][2]) if sent else {}
    check('grant call sent to admin-grant-pro with action/email/days', body.get('action') == 'grant' and body.get('target_email') == 'student@example.com' and body.get('days') == 365, body)
    check('admin flow: no CSP violations / errors', not csp_violations(log) and not log['errors'], (csp_violations(log), log['errors']))
    b.close()

    print('admin gate for signed-out visitor')
    b, ctx, page, log = make_ctx(pw)
    page.goto(BASE + '/'); page.wait_for_timeout(1200)
    page.keyboard.press('Control+Shift+A'); page.wait_for_timeout(500)
    check('gate has no prefilled email', page.locator('#adminGateEmail').count() == 1 and page.input_value('#adminGateEmail') == '')
    check('gate has no admin console content', page.locator('#grantProBtn').count() == 0)
    b.close()

    print('checkout')
    b, ctx, page, log = make_ctx(pw, {'user': FREE, 'pro': False})
    page.goto(BASE + '/'); page.wait_for_timeout(1500)
    page.locator('#headerGoProBtn').first.click(); page.wait_for_timeout(500)
    page.locator('#proCheckoutBtn').click(); page.wait_for_timeout(1500)
    order = [f for f in log['fn'] if f[1].startswith('razorpay-order') and f[0] == 'POST']
    ob = json.loads(order[0][2]) if order else {}
    check('order request sends ONLY plan_id', list(ob.keys()) == ['plan_id'], ob)
    check('Razorpay opened with server order id', page.evaluate("window.__rzpOpened === true && window.__rzpOptions.order_id === 'order_TEST123'"))
    check('no client-chosen notes/ids in options', page.evaluate("!('notes' in window.__rzpOptions)"))
    # simulate Razorpay success -> verify true; server (rpc) still says not pro => must NOT become Pro
    page.evaluate("void window.__rzpOptions.handler({razorpay_payment_id:'pay_TEST1234', razorpay_order_id:'order_TEST123', razorpay_signature:'sig'})")
    page.wait_for_timeout(500)
    ver = [f for f in log['fn'] if f[1].startswith('razorpay-verify')]
    check('verify called', len(ver) == 1)
    check('client never writes Pro to user_metadata', page.evaluate("window.__calls.updateUser.length === 0"))
    check('verified but server has no subscription => not Pro (fail closed)', page.locator('.pro-badge-header').count() == 0)
    # now server grants (flip mock) and poll picks it up
    page.evaluate("localStorage.setItem('__mock', JSON.stringify({user:%s, pro:true}))" % json.dumps(FREE))
    page.wait_for_timeout(9000)
    check('once server reports Pro, UI unlocks', page.locator('.pro-badge-header').count() >= 1)
    check('checkout flow: no CSP violations', not csp_violations(log), csp_violations(log))
    b.close()

    print('order endpoint down => no fallback checkout')
    b, ctx, page, log = make_ctx(pw, {'user': FREE, 'pro': False}, order_ok=False)
    page.goto(BASE + '/'); page.wait_for_timeout(1500)
    page.locator('#headerGoProBtn').first.click(); page.wait_for_timeout(400)
    page.locator('#proCheckoutBtn').click(); page.wait_for_timeout(1500)
    check('Razorpay NOT opened without a server order', page.evaluate("!window.__rzpOpened"))
    b.close()

    print('verify fails => no Pro')
    b, ctx, page, log = make_ctx(pw, {'user': FREE, 'pro': False}, verify_ok=False)
    page.goto(BASE + '/'); page.wait_for_timeout(1500)
    page.locator('#headerGoProBtn').first.click(); page.wait_for_timeout(400)
    page.locator('#proCheckoutBtn').click(); page.wait_for_timeout(1200)
    page.evaluate("void window.__rzpOptions.handler({razorpay_payment_id:'pay_TEST1234', razorpay_order_id:'order_TEST123', razorpay_signature:'bad'})")
    page.wait_for_timeout(800)
    check('failed verification => no Pro', page.locator('.pro-badge-header').count() == 0)
    b.close()

srv.terminate()
bad = [n for n, ok in results if not ok]
print(f'\n{len(results)-len(bad)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
