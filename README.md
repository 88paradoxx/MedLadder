# MedLadder

Medical entrance exam question bank for **FMGE, NEET PG, INI-CET & NEET SS** preparation — 19 subjects, 37,076 MCQs with previous-year questions, explanations, and progress tracking.

Live site: https://medladder.top/

## What's in this repo

```
.
├── index.html              # Pre-rendered homepage (generated)
├── app.js                  # Interactive quiz, auth and checkout UI
├── app.css                 # Shared stylesheet
├── syllabus.js             # Syllabus data (19 subjects, 739 modules)
├── gtag-init.js            # Google Analytics init (external file so the CSP needs no inline scripts)
├── generate_seo.py         # Pre-renders SEO pages, sitemap, vercel.json, _headers
├── sw.js                   # Service worker (network-first; offline fallback only)
├── vercel.json / _headers / _redirects   # Routing + security headers (generated; keep in sync)
├── manifest.json, icons/, favicon.ico, og-image.png, robots.txt, sitemap.xml, llms.txt
├── subjects/, neet-pg/, inicet/, fmge/, neet-ss/   # Pre-rendered landing pages (generated)
├── supabase/               # Database schema + Edge Functions (see supabase/README.md)
└── tools/
    ├── gen-free-modules.js       # SQL for the free-module list
    ├── test-edge-functions.js    # Offline tests of the payment/admin functions
    └── browser-test/             # Chromium test with the real CSP headers
```

## Stack

- **Frontend:** vanilla HTML/CSS/JS, no bundler. The Supabase key in `app.js` is the public (publishable) key and is safe to ship.
- **Backend:** Supabase (Auth, Postgres with row-level security, Edge Functions) + Razorpay.
- **Hosting:** any static host. `generate_seo.py` writes both `vercel.json` and `_headers`; use whichever your host reads.

## How access control works

- **Pro** = a row in `subscriptions`, written only by Edge Functions after Razorpay confirms a payment (or by an admin). The browser asks `my_pro_status()` to *display* status; Postgres row-level security on `questions` *enforces* it (free users: first 8 modules per subject; PYQ = Pro).
- **Admin** = `app_metadata.role = 'admin'` on the Supabase account, set with `supabase/grant-admin.sql`. Nothing in the browser can grant it.
- The browser only sends a `plan_id` to the server; prices, user ids and durations are server-owned.

## Deploying

1. Follow `supabase/README.md` (run `schema.sql`, deploy the four functions, set the Razorpay secrets and webhook, run `grant-admin.sql`).
2. Deploy the static files. Run `python3 generate_seo.py` after any syllabus / template change and commit the output.
3. Run the tests: `node tools/test-edge-functions.js` and `python3 tools/browser-test/run.py`.

## License

All rights reserved.
