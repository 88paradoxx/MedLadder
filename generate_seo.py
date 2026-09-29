#!/usr/bin/env python3
"""
generate_seo.py — MedLadder Static SEO Pre-renderer & Sitemap Generator

Generates high-performance static HTML pages for all subjects, modules,
and exam landing pages with Schema.org JSON-LD (BreadcrumbList, Quiz, FAQPage),
unique titles, meta descriptions, and self-referencing canonical URLs.
Extracts shared CSS and JS into /app.css, /syllabus.js, and /app.js for optimal
caching and crawl budget efficiency.
"""

import os
import re
import json
import html
import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://medladder.top"
CURRENT_DATE = datetime.date.today().isoformat()

# Pinned (never a floating "@2") so a compromised/breaking release can't reach the site.
# To add Subresource Integrity, see supabase/README.md ("Pin + SRI") and add integrity="sha384-..." below.
SUPABASE_JS_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"

# Supabase project host (must match SUPABASE_URL in app.js)
SUPABASE_HOST = "https://groeibwykzrliphzzruk.supabase.co"

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://checkout.razorpay.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' " + SUPABASE_HOST + " https://api.razorpay.com https://lumberjack.razorpay.com "
    "https://checkout.razorpay.com https://www.google-analytics.com https://*.google-analytics.com "
    "https://analytics.google.com https://*.analytics.google.com https://www.google.com https://*.google.com "
    "https://stats.g.doubleclick.net https://www.googletagmanager.com",
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
])

SECURITY_HEADERS = [
    ("Content-Security-Policy", CSP),
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ("Permissions-Policy", "camera=(), microphone=(), geolocation=()"),
    ("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"),
]

GTAG_INIT_JS = """window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-P5VJLV9KRH');
"""

def fit_title(head, subject, brand="MedLadder", limit=60):
    """Module page title that fits ~60 chars: prefer '<head> MCQs | <subject> | <brand>'."""
    for cand in (f"{head} MCQs | {subject} | {brand}", f"{head} MCQs | {subject}"):
        if len(cand) <= limit:
            return cand
    tail = f" MCQs | {subject}"
    room = limit - len(tail)
    if room >= 14:
        return head[:room - 1].rstrip(" ,-–—:;(") + "…" + tail
    return f"{head} MCQs | {subject}"

def slugify(value):
    """Matches the client-side slugifySeo function in index.html"""
    clean = str(value or '').lower()
    clean = re.sub(r'[^a-z0-9]+', '-', clean)
    clean = re.sub(r'^-|-$', '', clean)
    return clean

def esc(text):
    return html.escape(str(text or ''))

def main():
    syllabus_js_path = os.path.join(BASE_DIR, "syllabus.js")
    app_css_path = os.path.join(BASE_DIR, "app.css")
    app_js_path = os.path.join(BASE_DIR, "app.js")
    backup_index_path = os.path.join(BASE_DIR, "index.html.bak")
    index_path = os.path.join(BASE_DIR, "index.html")
    sitemap_path = os.path.join(BASE_DIR, "sitemap.xml")

    # <lastmod> should mean "this page's content changed". Remember the previous
    # dates and only bump a page whose generated HTML actually differs from disk.
    prev_lastmod = {}
    if os.path.exists(sitemap_path):
        with open(sitemap_path, "r", encoding="utf-8") as f:
            for loc, lm in re.findall(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", f.read()):
                prev_lastmod[loc] = lm
    lastmods = {}

    def write_page(path, content, loc):
        old = None
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                old = f.read()
        if old != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            lastmods[loc] = CURRENT_DATE
        else:
            lastmods[loc] = prev_lastmod.get(loc, CURRENT_DATE)

    used_module_titles = set()

    with open(os.path.join(BASE_DIR, "gtag-init.js"), "w", encoding="utf-8") as f:
        f.write(GTAG_INIT_JS)

    # 1. CSS
    if os.path.exists(app_css_path):
        print("✓ Using existing app.css")
    else:
        src = backup_index_path if os.path.exists(backup_index_path) else index_path
        with open(src, "r", encoding="utf-8") as f:
            raw = f.read()
        style_match = re.search(r'<style>(.*?)</style>', raw, re.DOTALL)
        if not style_match:
            raise RuntimeError("Could not find <style> block")
        with open(app_css_path, "w", encoding="utf-8") as f:
            f.write(style_match.group(1).strip() + "\n")
        print("✓ Extracted app.css")

    # 2. Syllabus
    if os.path.exists(syllabus_js_path):
        with open(syllabus_js_path, "r", encoding="utf-8") as f:
            content = f.read()
        prefix = "window.SYLLABUS_DATA = "
        idx = content.find(prefix)
        if idx != -1:
            raw_json = content[idx + len(prefix):].rstrip(";\n ")
            syllabus = json.loads(raw_json)
        else:
            raise RuntimeError("Failed to parse syllabus.js")
        print(f"✓ Loaded syllabus from syllabus.js ({len(syllabus)} subjects)")
    else:
        src = backup_index_path if os.path.exists(backup_index_path) else index_path
        with open(src, "r", encoding="utf-8") as f:
            raw = f.read()
        syl_match = re.search(r'<script id=[\"\']syllabus-index[\"\'][^>]*>(.*?)</script>', raw, re.DOTALL)
        if not syl_match:
            raise RuntimeError("Could not find syllabus-index")
        syllabus_raw = syl_match.group(1).strip()
        syllabus = json.loads(syllabus_raw)
        with open(syllabus_js_path, "w", encoding="utf-8") as f:
            f.write("window.SYLLABUS_DATA = " + syllabus_raw + ";\n")
        print(f"✓ Extracted syllabus.js ({len(syllabus)} subjects)")

    # 3. Main JS
    if os.path.exists(app_js_path):
        print("✓ Using existing app.js")
    else:
        src = backup_index_path if os.path.exists(backup_index_path) else index_path
        with open(src, "r", encoding="utf-8") as f:
            raw = f.read()
        scripts = list(re.finditer(r'<script(?:\s+[^>]*)?>(.*?)</script>', raw, re.DOTALL))
        main_script_content = scripts[7].group(1).strip()
        old_syl_lookup = """      try {
        var idxEl = document.getElementById('syllabus-index');
        if (!idxEl) throw new Error('Syllabus index not found on page.');
        SYLLABUS = JSON.parse(idxEl.textContent);"""
        new_syl_lookup = """      try {
        if (typeof window.SYLLABUS_DATA !== 'undefined' && Array.isArray(window.SYLLABUS_DATA) && window.SYLLABUS_DATA.length > 0) {
          SYLLABUS = window.SYLLABUS_DATA;
        } else {
          var idxEl = document.getElementById('syllabus-index');
          if (!idxEl) throw new Error('Syllabus index not found on page.');
          SYLLABUS = JSON.parse(idxEl.textContent);
        }"""
        if old_syl_lookup in main_script_content:
            main_script_content = main_script_content.replace(old_syl_lookup, new_syl_lookup)
        with open(app_js_path, "w", encoding="utf-8") as f:
            f.write(main_script_content + "\n")

    # 4. Base HTML Template for Static SEO Pages
    def render_page(title, description, canonical_url, schemas, pre_rendered_body):
        schema_tags = "\n  ".join([
            f'<script type="application/ld+json">\n  {json.dumps(s, ensure_ascii=False, indent=2)}\n  </script>'
            for s in schemas
        ])

        return f"""<!DOCTYPE html>
<html lang="en" class="dark">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{esc(canonical_url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MedLadder">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{esc(canonical_url)}">
  <meta property="og:image" content="{SITE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{SITE_URL}/og-image.png">

  <!-- PWA Support -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#7B2FF7">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="MedLadder">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png">
  <link rel="icon" href="/favicon.ico" sizes="any">

  {schema_tags}

  <link rel="stylesheet" href="/app.css">
</head>

<body>
  <div class="app" id="app">
{pre_rendered_body}
  </div>

  <script src="{SUPABASE_JS_URL}" crossorigin="anonymous" integrity="sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o" defer></script>
  <script src="/syllabus.js" defer></script>
  <script src="/app.js" defer></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P5VJLV9KRH"></script>
  <script src="/gtag-init.js" defer></script>
</body>

</html>
"""

    sitemap_entries = [
        {"loc": f"{SITE_URL}/", "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{SITE_URL}/landing", "priority": "0.9", "changefreq": "weekly"},
        {"loc": f"{SITE_URL}/privacy", "priority": "0.5", "changefreq": "monthly"},
        {"loc": f"{SITE_URL}/terms", "priority": "0.5", "changefreq": "monthly"}
    ]

    total_pages_generated = 0

    # 5. Generate Exam Pages
    exams = [
        {
            "slug": "neet-pg",
            "name": "NEET PG",
            "pyqId": "NEET PG",
            "coverage": "2018 – 2025 · 8 Years (1,640+ MCQs)",
            "title": "NEET PG Preparation & Question Bank | MedLadder",
            "desc": "Prepare for NEET PG with 37,000+ medical MCQs, 8 years of previous-year questions (2018–2025), detailed clinical explanations and progress tracking on MedLadder.",
            "heading": "NEET PG Question Bank & PYQs",
            "intro": "Prepare for NEET PG with topic-wise medical MCQs, verified previous-year questions (2018–2025), detailed clinical explanations, and performance tracking across all 19 subjects.",
            "faqs": [
                {
                    "q": "How many previous-year questions are available for NEET PG?",
                    "a": "MedLadder includes over 1,640 verified previous-year MCQs from NEET PG exam papers between 2018 and 2025, each with detailed explanations."
                },
                {
                    "q": "Can I practice questions topic-wise by medical subject?",
                    "a": "Yes, you can practice both full exam papers and topic-wise questions divided across all 19 medical entrance subjects."
                },
                {
                    "q": "How many questions can I practice for free?",
                    "a": "The first 8 modules in every single subject are completely free, allowing you to practice hundreds of questions before upgrading to Pro."
                }
            ]
        },
        {
            "slug": "inicet",
            "name": "INI-CET",
            "pyqId": "INICET",
            "coverage": "2020 – 2025 · 10 Sessions (1,460+ MCQs)",
            "title": "INI-CET Preparation & Question Bank | MedLadder",
            "desc": "Practice INI-CET MCQs across 10 exam sessions (2020–2025), AIIMS PG recalls, clinical vignettes and detailed explanations on MedLadder.",
            "heading": "INI-CET Question Bank & PYQs",
            "intro": "Prepare for INI-CET with high-yield clinical MCQs, 10 exam sessions of previous-year papers (2020–2025), AIIMS recalls, and progress tracking.",
            "faqs": [
                {
                    "q": "Which INI-CET sessions are covered on MedLadder?",
                    "a": "MedLadder covers 10 INI-CET sessions from November 2020 through May 2025, comprising 1,460+ curated questions."
                },
                {
                    "q": "Are image-based and clinical vignette questions included?",
                    "a": "Yes, high-yield clinical exhibits, image-based MCQs, and multi-step reasoning questions typical of INI-CET are built-in."
                },
                {
                    "q": "Is instant explanation provided for answers?",
                    "a": "Yes, every question provides complete rationale and key teaching points immediately upon selection or in the end-of-test review."
                }
            ]
        },
        {
            "slug": "fmge",
            "name": "FMGE",
            "pyqId": "FMGE",
            "coverage": "2020 – 2025 · 10 Sessions (2,430+ MCQs)",
            "title": "FMGE Preparation & Question Bank | MedLadder",
            "desc": "Prepare for FMGE (Foreign Medical Graduate Examination) with 10 sessions of previous-year questions (2020–2025), 19 subject-wise QBanks and explanations on MedLadder.",
            "heading": "FMGE Question Bank & PYQs",
            "intro": "Prepare for FMGE with focused medical MCQs, 10 sessions of previous-year questions (2020–2025), detailed clinical rationales, and progress tracking.",
            "faqs": [
                {
                    "q": "How many FMGE previous-year questions are available?",
                    "a": "MedLadder provides over 2,430 previous-year MCQs across 10 FMGE exam sessions from December 2020 to July 2025."
                },
                {
                    "q": "Does MedLadder cover both Pre-clinical and Clinical subjects?",
                    "a": "Yes, all 19 medical subjects required for the FMGE screening test are covered comprehensively."
                },
                {
                    "q": "Can I test myself under timed exam conditions?",
                    "a": "Yes, MedLadder features exam simulation mode with custom timers, shuffled question ordering, and performance analytics."
                }
            ]
        },
        {
            "slug": "neet-ss",
            "name": "NEET SS",
            "pyqId": "NEET SS",
            "coverage": "2022 – 2024 Exam Question Papers",
            "title": "NEET SS Preparation & Question Bank | MedLadder",
            "desc": "Prepare for NEET SS (Super Speciality) with previous-year question papers (2022–2024), high-yield MCQs, detailed explanations and performance tracking on MedLadder.",
            "heading": "NEET SS Question Bank & PYQs",
            "intro": "Prepare for NEET SS with focused medical MCQs, previous-year question papers (2022–2024), detailed rationales, and performance tracking.",
            "faqs": [
                {
                    "q": "What years are covered in the NEET SS PYQ bank?",
                    "a": "MedLadder includes NEET SS papers from 2022, 2023, and 2024 with detailed answer rationales."
                },
                {
                    "q": "Are explanations provided for super speciality MCQs?",
                    "a": "Yes, each question includes evidence-based explanations to solidify core clinical concepts."
                },
                {
                    "q": "How do I start practicing NEET SS questions?",
                    "a": "Click the Start Practising button or select from the subject banks to begin a customized test session."
                }
            ]
        }
    ]

    for ex in exams:
        out_dir = os.path.join(BASE_DIR, ex["slug"])
        os.makedirs(out_dir, exist_ok=True)
        canonical_url = f"{SITE_URL}/{ex['slug']}"
        sitemap_entries.append({"loc": canonical_url, "priority": "0.9", "changefreq": "weekly"})

        # Structured schemas
        schemas = [
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                    {"@type": "ListItem", "position": 2, "name": ex["name"], "item": canonical_url}
                ]
            },
            {
                "@context": "https://schema.org",
                "@type": "Quiz",
                "name": ex["title"],
                "description": ex["desc"],
                "educationalLevel": "Postgraduate Medical Entrance",
                "provider": {
                    "@type": "EducationalOrganization",
                    "name": "MedLadder",
                    "url": f"{SITE_URL}/"
                }
            },
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": f["q"],
                        "acceptedAnswer": {"@type": "Answer", "text": f["a"]}
                    }
                    for f in ex["faqs"]
                ]
            }
        ]

        # Pre-rendered body content
        subjects_cards_html = "".join([
            f'<a href="/subjects/{slugify(s["name"])}" style="display:block;padding:14px;border:1px solid var(--line);border-radius:12px;color:var(--ink);text-decoration:none;background:var(--paper-raised);">'
            f'<strong>{esc(s["name"])}</strong><br><small>{s.get("questionCount", 0):,} MCQs · {s.get("moduleCount", 0)} modules</small></a>'
            for s in syllabus
        ])

        faq_details_html = "".join([
            f'<details style="padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--paper-raised);margin-bottom:10px;">'
            f'<summary style="font-weight:700;cursor:pointer;">{esc(f["q"])}</summary>'
            f'<p style="margin-top:8px;color:var(--ink-soft);line-height:1.6;">{esc(f["a"])}</p>'
            f'</details>'
            for f in ex["faqs"]
        ])

        body_html = f"""    <main style="max-width:960px;margin:0 auto;padding:28px 20px 60px;">
      <nav aria-label="Breadcrumb" style="font-size:14px;margin-bottom:22px;">
        <a href="/" id="seoHomeTop" style="color:var(--accent-deep);font-weight:800;text-decoration:none;">← Home</a>
        <span aria-hidden="true">/</span> <span>{esc(ex["name"])}</span>
      </nav>
      <h1 class="title" style="margin-bottom:14px;">{esc(ex["heading"])}</h1>
      <p class="subtitle" style="max-width:820px;line-height:1.65;">{esc(ex["intro"])}</p>
      <p style="font-size:16px;"><strong>{esc(ex["coverage"])}</strong></p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin:26px 0;">
        <button id="seoStartBtn" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,var(--cta-a),var(--cta-b));font-weight:800;font-size:15px;cursor:pointer;">Start Practising {esc(ex["name"])}</button>
        <a href="/" id="seoHomeBottom" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);color:var(--ink);font-weight:800;font-size:15px;text-decoration:none;">Back to Home</a>
      </div>
      <section aria-labelledby="seoTopics">
        <h2 id="seoTopics">What you can practise</h2>
        <ul style="line-height:1.8;padding-left:22px;">
          <li>Previous-year question papers with year and session filtering</li>
          <li>Topic-wise medical MCQs across all 19 medical entrance subjects</li>
          <li>Detailed explanations for every question to learn from mistakes</li>
          <li>Timed exam simulation mode with performance tracking</li>
        </ul>
      </section>
      <section aria-labelledby="subjectTopics" style="margin-top:28px;">
        <h2 id="subjectTopics">19 Subject-Wise Question Banks for {esc(ex["name"])}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;">
          {subjects_cards_html}
        </div>
      </section>
      <section aria-labelledby="seoFaq" style="margin-top:36px;">
        <h2 id="seoFaq" style="margin-bottom:16px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:10px;">
          {faq_details_html}
        </div>
      </section>
    </main>"""

        page_content = render_page(ex["title"], ex["desc"], canonical_url, schemas, body_html)
        write_page(os.path.join(out_dir, "index.html"), page_content, canonical_url)
        total_pages_generated += 1

    # Also handle legacy /ini-cet alias by creating redirect page pointing to canonical /inicet
    inicet_alias_dir = os.path.join(BASE_DIR, "ini-cet")
    os.makedirs(inicet_alias_dir, exist_ok=True)
    with open(os.path.join(inicet_alias_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redirecting to INI-CET...</title>
  <link rel="canonical" href="{SITE_URL}/inicet">
  <meta http-equiv="refresh" content="0; url=/inicet">
</head>
<body><p>Redirecting to <a href="/inicet">/inicet</a>...</p></body>
</html>""")
    print("✓ Created Exam pages and /ini-cet redirect")

    # 6. Generate Subject and Module/Topic Pages
    for subj in syllabus:
        s_slug = slugify(subj["name"])
        s_dir = os.path.join(BASE_DIR, "subjects", s_slug)
        os.makedirs(s_dir, exist_ok=True)

        s_url = f"{SITE_URL}/subjects/{s_slug}"
        sitemap_entries.append({"loc": s_url, "priority": "0.8", "changefreq": "weekly"})

        s_title = f"{subj['name']} MCQs | MedLadder"
        s_desc = f"Practice {subj['name']} MCQs and previous-year questions with detailed explanations on MedLadder. Revise topic-wise across {subj.get('moduleCount', 0)} modules and track your performance."
        s_heading = f"{subj['name']} MCQs and Previous-Year Questions"
        s_intro = f"Practice {subj['name']} with topic-wise medical MCQs, previous-year questions, detailed explanations and progress tracking."

        s_faqs = [
            {
                "q": f"How many {subj['name']} MCQs are available on MedLadder?",
                "a": f"MedLadder features {subj.get('questionCount', 0):,} curated questions across {subj.get('moduleCount', 0)} topics in {subj['name']}."
            },
            {
                "q": f"Which entrance exams are these {subj['name']} questions relevant for?",
                "a": f"These questions cover high-yield topics for FMGE, NEET PG, INI-CET, AIIMS, and NEET SS."
            },
            {
                "q": f"Can I practice {subj['name']} modules for free?",
                "a": "Yes! The first 8 modules of every subject on MedLadder are free to practice with explanations included."
            }
        ]

        s_schemas = [
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                    {"@type": "ListItem", "position": 2, "name": subj["name"], "item": s_url}
                ]
            },
            {
                "@context": "https://schema.org",
                "@type": "Quiz",
                "name": s_title,
                "description": s_desc,
                "educationalLevel": "Postgraduate Medical Entrance",
                "assesses": subj["name"],
                "provider": {
                    "@type": "EducationalOrganization",
                    "name": "MedLadder",
                    "url": f"{SITE_URL}/"
                }
            },
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                    for f in s_faqs
                ]
            }
        ]

        modules = subj.get("modules", [])
        modules_cards_html = "".join([
            f'<a href="/subjects/{s_slug}/{slugify(m["name"])}" style="display:block;padding:12px 14px;border:1px solid var(--line);border-radius:12px;color:var(--ink);text-decoration:none;background:var(--paper-raised);">'
            f'<strong>{esc(m["name"])}</strong><br><small>{m.get("questionCount", 0):,} questions · {esc(m.get("section", ""))}</small></a>'
            for m in modules
        ])

        s_faq_html = "".join([
            f'<details style="padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--paper-raised);margin-bottom:10px;">'
            f'<summary style="font-weight:700;cursor:pointer;">{esc(f["q"])}</summary>'
            f'<p style="margin-top:8px;color:var(--ink-soft);line-height:1.6;">{esc(f["a"])}</p>'
            f'</details>'
            for f in s_faqs
        ])

        s_body_html = f"""    <main style="max-width:960px;margin:0 auto;padding:28px 20px 60px;">
      <nav aria-label="Breadcrumb" style="font-size:14px;margin-bottom:22px;">
        <a href="/" id="seoHomeTop" style="color:var(--accent-deep);font-weight:800;text-decoration:none;">← Home</a>
        <span aria-hidden="true">/</span> <span>{esc(subj["name"])}</span>
      </nav>
      <h1 class="title" style="margin-bottom:14px;">{esc(s_heading)}</h1>
      <p class="subtitle" style="max-width:820px;line-height:1.65;">{esc(s_intro)}</p>
      <p style="font-size:16px;"><strong>{subj.get('questionCount', 0):,} questions</strong> across {subj.get('moduleCount', 0)} topics/modules.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin:26px 0;">
        <button id="seoStartBtn" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,var(--cta-a),var(--cta-b));font-weight:800;font-size:15px;cursor:pointer;">Open {esc(subj["name"])} Topics</button>
        <a href="/" id="seoHomeBottom" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);color:var(--ink);font-weight:800;font-size:15px;text-decoration:none;">Back to Home</a>
      </div>
      <section aria-labelledby="seoTopics">
        <h2 id="seoTopics">What you can practise</h2>
        <ul style="line-height:1.8;padding-left:22px;">
          <li>Topic-wise medical MCQs for focused revision</li>
          <li>Previous-year question practice</li>
          <li>Detailed explanations for learning from mistakes</li>
          <li>Progress and performance tracking</li>
        </ul>
      </section>
      <section aria-labelledby="subjectTopics" style="margin-top:28px;">
        <h2 id="subjectTopics">{esc(subj["name"])} topic-wise question banks</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;">
          {modules_cards_html}
        </div>
      </section>
      <section aria-labelledby="seoFaq" style="margin-top:36px;">
        <h2 id="seoFaq" style="margin-bottom:16px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:10px;">
          {s_faq_html}
        </div>
      </section>
    </main>"""

        write_page(os.path.join(s_dir, "index.html"), render_page(s_title, s_desc, s_url, s_schemas, s_body_html), s_url)
        total_pages_generated += 1

        # Generate each module/topic page under this subject
        for idx, mod in enumerate(modules):
            m_slug = slugify(mod["name"])
            m_dir = os.path.join(s_dir, m_slug)
            os.makedirs(m_dir, exist_ok=True)

            m_url = f"{SITE_URL}/subjects/{s_slug}/{m_slug}"
            sitemap_entries.append({"loc": m_url, "priority": "0.6", "changefreq": "monthly"})

            m_title = fit_title(mod['name'], subj['name'])
            if m_title in used_module_titles:          # never let truncation create duplicate titles
                m_title = f"{mod['name']} MCQs | {subj['name']}"
            used_module_titles.add(m_title)
            m_desc = f"Practice {mod['name']} questions and medical MCQs in {subj['name']} with {mod.get('questionCount', 0)} questions, detailed explanations and topic-wise revision on MedLadder."
            m_heading = f"{mod['name']} — {subj['name']} MCQs"
            m_intro = f"Practice {mod['name']} with focused {subj['name']} medical MCQs, detailed explanations and topic-wise revision."

            m_faqs = [
                {
                    "q": f"How many questions are in {mod['name']}?",
                    "a": f"MedLadder includes {mod.get('questionCount', 0)} curated MCQs with explanations for {mod['name']} under {subj['name']} ({mod.get('section', 'General')})."
                },
                {
                    "q": "Which medical exams does this topic prepare for?",
                    "a": f"These {subj['name']} questions prepare you for FMGE, NEET PG, INI-CET, and NEET SS, covering both conceptual MCQs and clinical scenarios."
                },
                {
                    "q": f"Can I practice {mod['name']} for free?",
                    "a": "MedLadder offers free access to the first 8 modules of every subject. Full access to all modules and PYQs is available with MedLadder Pro."
                }
            ]

            m_schemas = [
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE_URL}/"},
                        {"@type": "ListItem", "position": 2, "name": subj["name"], "item": s_url},
                        {"@type": "ListItem", "position": 3, "name": mod["name"], "item": m_url}
                    ]
                },
                {
                    "@context": "https://schema.org",
                    "@type": "Quiz",
                    "name": m_title,
                    "description": m_desc,
                    "educationalLevel": "Postgraduate Medical Entrance",
                    "assesses": f"{subj['name']} - {mod['name']}",
                    "provider": {
                        "@type": "EducationalOrganization",
                        "name": "MedLadder",
                        "url": f"{SITE_URL}/"
                    }
                },
                {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": [
                        {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                        for f in m_faqs
                    ]
                }
            ]

            # Nearby topics within the subject
            nearby = []
            for d in range(-3, 4):
                if d == 0:
                    continue
                pos = idx + d
                if 0 <= pos < len(modules):
                    nearby.append(modules[pos])

            nearby_cards_html = "".join([
                f'<a href="/subjects/{s_slug}/{slugify(n["name"])}" style="display:block;padding:12px 14px;border:1px solid var(--line);border-radius:12px;color:var(--ink);text-decoration:none;background:var(--paper-raised);">'
                f'<strong>{esc(n["name"])}</strong><br><small>{n.get("questionCount", 0):,} questions</small></a>'
                for n in nearby
            ])

            m_faq_html = "".join([
                f'<details style="padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--paper-raised);margin-bottom:10px;">'
                f'<summary style="font-weight:700;cursor:pointer;">{esc(f["q"])}</summary>'
                f'<p style="margin-top:8px;color:var(--ink-soft);line-height:1.6;">{esc(f["a"])}</p>'
                f'</details>'
                for f in m_faqs
            ])

            m_body_html = f"""    <main style="max-width:960px;margin:0 auto;padding:28px 20px 60px;">
      <nav aria-label="Breadcrumb" style="font-size:14px;margin-bottom:22px;">
        <a href="/" id="seoHomeTop" style="color:var(--accent-deep);font-weight:800;text-decoration:none;">← Home</a>
        <span aria-hidden="true">/</span>
        <a href="/subjects/{s_slug}" id="seoSubjectCrumb" style="color:var(--accent-deep);font-weight:800;text-decoration:none;">{esc(subj["name"])}</a>
        <span aria-hidden="true">/</span> <span>{esc(mod["name"])}</span>
      </nav>
      <h1 class="title" style="margin-bottom:14px;">{esc(m_heading)}</h1>
      <p class="subtitle" style="max-width:820px;line-height:1.65;">{esc(m_intro)}</p>
      <p style="font-size:16px;"><strong>{mod.get('questionCount', 0):,} questions</strong> in this topic · {esc(mod.get('section', 'Core syllabus'))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin:26px 0;">
        <button id="seoStartBtn" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border:0;border-radius:14px;color:#fff;background:linear-gradient(135deg,var(--cta-a),var(--cta-b));font-weight:800;font-size:15px;cursor:pointer;">Start {esc(mod["name"])} Questions</button>
        <a href="/" id="seoHomeBottom" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);color:var(--ink);font-weight:800;font-size:15px;text-decoration:none;">Back to Home</a>
      </div>
      <section aria-labelledby="seoTopics">
        <h2 id="seoTopics">What you can practise</h2>
        <ul style="line-height:1.8;padding-left:22px;">
          <li>Topic-wise medical MCQs for focused revision</li>
          <li>Previous-year question practice</li>
          <li>Detailed explanations for learning from mistakes</li>
          <li>Progress and performance tracking</li>
        </ul>
      </section>
      <section aria-labelledby="relatedTopics" style="margin-top:28px;">
        <h2 id="relatedTopics">More {esc(subj["name"])} topics</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
          {nearby_cards_html}
        </div>
      </section>
      <section aria-labelledby="seoFaq" style="margin-top:36px;">
        <h2 id="seoFaq" style="margin-bottom:16px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:10px;">
          {m_faq_html}
        </div>
      </section>
    </main>"""

            write_page(os.path.join(m_dir, "index.html"), render_page(m_title, m_desc, m_url, m_schemas, m_body_html), m_url)
            total_pages_generated += 1

    print(f"✓ Generated {total_pages_generated} static SEO pages")

    # 7. Update root index.html with crawlable homepage fallback and extracted assets
    home_subject_links = "".join([
        f'<a href="/subjects/{slugify(s["name"])}" style="display:block;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);color:var(--ink);text-decoration:none;">'
        f'<strong style="font-size:16px;">{esc(s["name"])}</strong><br>'
        f'<small style="color:var(--ink-soft);">{s.get("questionCount", 0):,} MCQs · {s.get("moduleCount", 0)} modules</small></a>'
        for s in syllabus
    ])

    home_faqs = [
        {
            "q": "What medical entrance exams does MedLadder cover?",
            "a": "MedLadder is specifically built for FMGE, NEET PG, INI-CET, AIIMS, and NEET SS preparation, covering 19 subjects and 37,076 MCQs."
        },
        {
            "q": "Are previous-year question papers (PYQs) included?",
            "a": "Yes! MedLadder contains verified PYQ banks covering NEET PG (2018–2025), INI-CET (2020–2025), FMGE (2020–2025), AIIMS PG, and NEET SS."
        },
        {
            "q": "How many modules can I practice for free?",
            "a": "The first 8 modules in every single subject are completely free, with full access to questions, answer keys, and detailed explanations."
        },
        {
            "q": "Can I practice questions in timed test mode?",
            "a": "Yes. MedLadder supports both Practice Mode (instant answer feedback) and Exam Mode (timed tests with customizable question limits and end-of-test review)."
        }
    ]

    home_faq_html = "".join([
        f'<details style="padding:14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--paper-raised);margin-bottom:10px;">'
        f'<summary style="font-weight:700;cursor:pointer;">{esc(f["q"])}</summary>'
        f'<p style="margin-top:8px;color:var(--ink-soft);line-height:1.6;">{esc(f["a"])}</p>'
        f'</details>'
        for f in home_faqs
    ])

    home_body_fallback = f"""    <main style="max-width:960px;margin:0 auto;padding:24px 20px 60px;">
      <h1 class="title" style="margin-top:12px;margin-bottom:12px;">Medical Entrance Exam Question Bank</h1>
      <p class="subtitle" style="max-width:820px;line-height:1.6;margin-bottom:24px;">
        Master <strong>FMGE, NEET PG, INI-CET &amp; NEET SS</strong> with 37,076 topic-wise MCQs across 19 subjects, previous-year question papers, high-yield clinical explanations, and progress tracking.
      </p>

      <section aria-labelledby="homeExams" style="margin-bottom:32px;">
        <h2 id="homeExams" style="font-size:19px;font-weight:800;margin-bottom:14px;">Previous-Year Question Papers (PYQ Bank)</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
          <a href="/neet-pg" style="padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);text-decoration:none;color:var(--ink);display:block;">
            <strong style="font-size:16px;">🏥 NEET PG PYQs</strong><br>
            <small style="color:var(--ink-soft);">2018–2025 · 8 Years (1,640+ MCQs)</small>
          </a>
          <a href="/inicet" style="padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);text-decoration:none;color:var(--ink);display:block;">
            <strong style="font-size:16px;">🔬 INI-CET PYQs</strong><br>
            <small style="color:var(--ink-soft);">2020–2025 · 10 Sessions (1,460+ MCQs)</small>
          </a>
          <a href="/fmge" style="padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);text-decoration:none;color:var(--ink);display:block;">
            <strong style="font-size:16px;">🌐 FMGE PYQs</strong><br>
            <small style="color:var(--ink-soft);">2020–2025 · 10 Sessions (2,430+ MCQs)</small>
          </a>
          <a href="/neet-ss" style="padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--paper-raised);text-decoration:none;color:var(--ink);display:block;">
            <strong style="font-size:16px;">⚕️ NEET SS PYQs</strong><br>
            <small style="color:var(--ink-soft);">2022–2024 Exam Question Papers</small>
          </a>
        </div>
      </section>

      <section aria-labelledby="homeSubjects">
        <h2 id="homeSubjects" style="font-size:19px;font-weight:800;margin-bottom:14px;">19 Subject-Wise Question Banks</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
          {home_subject_links}
        </div>
      </section>

      <section aria-labelledby="homeFaqs" style="margin-top:40px;">
        <h2 id="homeFaqs" style="font-size:19px;font-weight:800;margin-bottom:14px;">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:10px;">
          {home_faq_html}
        </div>
      </section>
    </main>"""

    home_faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in home_faqs
        ]
    }

    # Render clean index.html
    new_index_html = render_page(
        "MedLadder — FMGE, NEET PG, INI-CET & NEET SS QBank",
        "Prepare for FMGE, NEET PG, INI-CET and NEET SS with MedLadder. Practice 37,076 medical MCQs, previous-year questions, detailed explanations and track your performance.",
        f"{SITE_URL}/",
        [
            {"@context": "https://schema.org", "@type": "WebSite", "name": "MedLadder", "url": f"{SITE_URL}/", "description": "Medical entrance and postgraduate exam question bank for FMGE, NEET PG, INI-CET and NEET SS."},
            {"@context": "https://schema.org", "@type": "EducationalOrganization", "name": "MedLadder", "url": f"{SITE_URL}/"},
            home_faq_schema
        ],
        home_body_fallback
    )

    write_page(index_path, new_index_html, f"{SITE_URL}/")
    print("✓ Updated index.html with crawlable semantic fallback and linked assets")

    # 8. Generate optimized sitemap.xml
    sitemap_xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for item in sitemap_entries:
        sitemap_xml_lines.append(f"  <url>")
        sitemap_xml_lines.append(f"    <loc>{item['loc']}</loc>")
        sitemap_xml_lines.append(f"    <lastmod>{lastmods.get(item['loc'], CURRENT_DATE)}</lastmod>")
        sitemap_xml_lines.append(f"    <changefreq>{item['changefreq']}</changefreq>")
        sitemap_xml_lines.append(f"    <priority>{item['priority']}</priority>")
        sitemap_xml_lines.append(f"  </url>")
    sitemap_xml_lines.append("</urlset>\n")

    with open(os.path.join(BASE_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sitemap_xml_lines))
    print(f"✓ Generated sitemap.xml with {len(sitemap_entries)} canonical URLs and lastmod timestamps")

    # 9. Update _redirects and vercel.json for canonical redirects
    redirects_path = os.path.join(BASE_DIR, "_redirects")
    with open(redirects_path, "w", encoding="utf-8") as f:
        f.write("/ini-cet    /inicet    301\n/*    /index.html   200\n")
    print("✓ Updated _redirects (with /ini-cet -> /inicet 301 redirect)")

    vercel_path = os.path.join(BASE_DIR, "vercel.json")
    vercel_config = {
        "cleanUrls": True,
        "redirects": [
            {
                "source": "/ini-cet",
                "destination": "/inicet",
                "permanent": True
            }
        ],
        "rewrites": [
            {
                "source": "/(.*)",
                "destination": "/index.html"
            }
        ],
        "headers": [
            {
                "source": "/(.*)",
                "headers": [{"key": k, "value": v} for k, v in SECURITY_HEADERS]
            },
            {
                "source": "/sw.js",
                "headers": [{"key": "Cache-Control", "value": "no-cache"}]
            }
        ]
    }
    with open(vercel_path, "w", encoding="utf-8") as f:
        json.dump(vercel_config, f, indent=2)
        f.write("\n")
    print("✓ Updated vercel.json (with cleanUrls and 301 redirect)")

    # 10. _headers (same headers as vercel.json, for Netlify / Cloudflare Pages)
    headers_path = os.path.join(BASE_DIR, "_headers")
    with open(headers_path, "w", encoding="utf-8") as f:
        f.write("/*\n" + "".join(f"  {k}: {v}\n" for k, v in SECURITY_HEADERS))
        f.write("\n/sw.js\n  Cache-Control: no-cache\n")
    print("✓ Wrote _headers (security headers / CSP)")
    # sw.js is maintained by hand (network-first, versioned cache); the generator no longer touches it.

    print("\n🎉 Pre-rendering and SEO build completed successfully!")

if __name__ == "__main__":
    main()
