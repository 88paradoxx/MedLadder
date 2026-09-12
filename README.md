# MedLadder

Medical entrance exam question bank for **FMGE, NEET PG, INI-CET & NEET SS** preparation — 19 subjects, 30,000+ MCQs with previous-year questions, explanations, and progress tracking.

Live site: https://medladder.top/

## What's in this repo

This is a static, single-page site (no build step required) deployed as-is.

```
.
├── index.html              # The entire app — HTML, CSS, and JS in one file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline/PWA support)
├── icons/                  # PWA icons (various sizes)
├── favicon.ico
├── og-image.png            # Open Graph share image
├── robots.txt
├── sitemap.xml
├── llms.txt                # LLM-crawler friendly site summary
├── google*.html            # Google Search Console site-verification file
├── _redirects              # SPA fallback rule for Netlify (all routes -> index.html)
└── supabase-fixes/         # Backend hardening: SQL + Edge Function (see below)
    ├── README.md
    ├── supabase_setup.sql
    └── functions/admin-grant-pro/index.ts
```

## Stack

- **Frontend:** vanilla HTML/CSS/JS, single file, no bundler
- **Backend:** [Supabase](https://supabase.com) (Auth, Postgres, Edge Functions) — the anon key in `index.html` is the public/publishable key and is safe to expose client-side
- **Hosting:** static host with SPA fallback (`_redirects` is Netlify's format; works unmodified on Netlify, and can be adapted for Vercel/Cloudflare Pages)

## Deploying

1. Push this repo to your static host of choice (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.) connected to your own Supabase project.
2. Run `supabase-fixes/supabase_setup.sql` in your Supabase SQL editor (edit the admin email at the top first).
3. Deploy `supabase-fixes/functions/admin-grant-pro/index.ts` as a Supabase Edge Function:
   ```
   supabase functions deploy admin-grant-pro
   ```
   Then set `PRO_CONFIG.EDGE_ADMIN_GRANT_URL` in `index.html` to the deployed function URL.

See `supabase-fixes/README.md` for details on what security issues were fixed and what's still outstanding.

## License

All rights reserved.
