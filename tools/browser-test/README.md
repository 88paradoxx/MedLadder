# Browser test (Playwright + Chromium)

Serves the site with the exact headers from `vercel.json` (CSP included), stubs Supabase /
Razorpay / Google, and checks: no CSP violations, forged Pro/admin is ignored, the checkout
fails closed, admin console + grant call, service worker registers.

    pip install playwright && playwright install chromium
    python3 tools/browser-test/run.py
