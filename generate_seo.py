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

# --- Pricing-neutral wording -------------------------------------------------
# Whether MedLadder keeps a Pro tier or becomes fully free is undecided. Edit these
# two strings in ONE place once decided, then re-run this script.
ACCESS_FAQ_Q = "How do I start practising on MedLadder?"
ACCESS_FAQ_A = ("You can start practising right away on MedLadder, and every question comes with "
                "a detailed explanation. Access options can change over time, so check the app "
                "for the latest details.")

EXAM_HUBS = [("neet-pg", "NEET PG"), ("inicet", "INI-CET"), ("fmge", "FMGE"), ("neet-ss", "NEET SS")]

# Sample MCQs per topic, produced by tools/export_seo_samples.py (optional file).
SAMPLES = {}
_samples_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seo_samples.json")
if os.path.exists(_samples_path):
    with open(_samples_path, "r", encoding="utf-8") as _f:
        SAMPLES = json.load(_f)

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
    for cand in (f"{head} MCQs with Answers | {subject}", f"{head} MCQs | {subject} | {brand}", f"{head} MCQs | {subject}"):
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

def masthead_html():
    return (
        '    <header class="masthead glass" role="banner">\n'
        '      <a href="/" class="brand" style="text-decoration:none;">\n'
        '        <span class="brand-icon" style="overflow:hidden;display:inline-flex;align-items:center;justify-content:center;">\n'
        '          <img src="/icons/icon-72.png" alt="MedLadder" style="width:100%;height:100%;border-radius:inherit;display:block;object-fit:cover;">\n'
        '        </span>\n'
        '        <span>MedLadder</span>\n'
        '      </a>\n'
        '      <span class="right">\n'
        '        <span class="stat"><span class="stat-dot"></span>37,076 MCQs</span>\n'
        '        <button class="theme-toggle" id="themeToggle" title="Toggle theme" aria-label="Toggle theme">🌙</button>\n'
        '      </span>\n'
        '    </header>'
    )

def footer_html():
    return (
        '    <footer class="credit">\n'
        '      <div class="footer-content">\n'
        '        <a href="/MedLadder-latest.apk" class="footer-apk-btn" download="MedLadder-latest.apk" title="Download MedLadder Android APK">\n'
        '          <span class="footer-apk-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125s-3.5902.2866-5.1368.8247L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg></span>\n'
        '          <span class="footer-apk-text"><span class="footer-apk-sub">Android App</span><span class="footer-apk-title">Download APK</span></span>\n'
        '          <span class="footer-apk-badge">Latest</span>\n'
        '        </a>\n'
        '        <div class="footer-links-row">\n'
        '          <a href="/privacy" class="footer-link">Privacy Policy</a>\n'
        '          <span class="footer-dot" aria-hidden="true">·</span>\n'
        '          <a href="/terms" class="footer-link">Terms of Service</a>\n'
        '        </div>\n'
        '        <div class="footer-copy"><strong>MedLadder</strong> · Medical Entrance Exam Question Bank</div>\n'
        '        <div class="footer-subcopy">MBBS · FMGE · NEET PG · INI-CET · NEET SS · USMLE · MCAT · PLAB · MRCS · MRCP · State PG</div>\n'
        '      </div>\n'
        '    </footer>'
    )

def exam_links_html(heading_id="examHubs", extra_cards=""):
    links = "".join(
        f'<a href="/{slug}" class="seo-card">'
        f'<strong>{esc(name)} Question Bank</strong>'
        f'<small>Topic-wise MCQs and previous-year questions</small></a>'
        for slug, name in EXAM_HUBS
    ) + extra_cards
    return (f'<section aria-labelledby="{heading_id}" style="margin-top:34px;">'
            f'<h2 id="{heading_id}" class="seo-section-title">Prepare for your exam</h2>'
            f'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">{links}</div>'
            f'</section>')

def sample_schema(sample):
    letters = "ABCD"
    return {
        "@type": "Question",
        "eduQuestionType": "Multiple choice",
        "text": sample["q"],
        "suggestedAnswer": [
            {"@type": "Answer", "position": i + 1, "text": o} for i, o in enumerate(sample["o"])
        ],
        "acceptedAnswer": {
            "@type": "Answer",
            "position": letters.index(sample["a"]) + 1,
            "text": sample["o"][letters.index(sample["a"])],
            "answerExplanation": {"@type": "Comment", "text": sample["e"]},
        },
    }

def samples_html(samples, topic_name):
    if not samples:
        return ""
    letters = "ABCD"
    blocks = []
    for n, sm in enumerate(samples, 1):
        opts = "".join(
            f'<div class="seo-opt"><span class="letter">{let}</span><span>{esc(o)}</span></div>'
            for let, o in zip(letters, sm["o"])
        )
        ai = letters.index(sm["a"])
        blocks.append(
            f'<article class="seo-qcard">'
            f'<div class="qnum-eyebrow" style="color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Sample MCQ #{n}</div>'
            f'<h3 style="font-size:16.5px;font-weight:700;line-height:1.45;margin:0 0 14px;color:var(--ink);">{esc(sm["q"])}</h3>'
            f'<div style="margin-bottom:12px;">{opts}</div>'
            f'<details style="margin-top:12px;">'
            f'<summary class="btn secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;padding:8px 16px;cursor:pointer;list-style:none;">Show Answer &amp; Explanation ▾</summary>'
            f'<div class="explain show" style="display:block;margin-top:12px;border-left:4px solid var(--accent);">'
            f'<div class="exlabel" style="color:var(--green);font-weight:800;margin-bottom:8px;">✓ Correct Answer: {sm["a"]}. {esc(sm["o"][ai])}</div>'
            f'<p style="margin:0;line-height:1.65;color:var(--ink);font-size:14.5px;">{esc(sm["e"])}</p>'
            f'</div>'
            f'</details>'
            f'</article>'
        )
    return (f'<section aria-labelledby="seoSamples" style="margin-top:34px;">'
            f'<h2 id="seoSamples" class="seo-section-title">Sample {esc(topic_name)} MCQs with answers</h2>{"".join(blocks)}</section>')

def fit_desc(text, limit=158):
    if len(text) <= limit:
        return text
    return text[:limit - 1].rsplit(" ", 1)[0].rstrip(",;:-– ") + "…"

# --- SEO upgrade: key-phrase derivation, cross-subject links, money pages ----
SEO_YEAR = "2026"  # freshness signal used in titles/descriptions

# Title/description patterns — grounded in 38-search ranking-title research:
# Dominant: "[Topic] MCQs for NEET PG" (EduRev/PrepLadder rank #1 everywhere);
# "with Answers/Solutions" near-universal; "Important"/"High-Yield" beat
# "practice questions" in Indian results; year suffix signals freshness.
# {topic}, {n}, {subject}, {phrases}, {year} are substituted per page.
SEO_TITLE_PATTERN = "{topic} MCQs with Answers for NEET PG {year}"
SEO_TITLE_FALLBACK = "{topic} MCQs for NEET PG {year}"
# Three rotated description templates (deterministic md5 pick, stable across runs)
# so the boilerplate itself varies across pages, not just the substituted phrases.
SEO_DESC_PATTERNS = [
    ("{topic} MCQs: practice {n} high-yield questions on {phrases} for NEET PG, FMGE, "
     "INI-CET & NEET SS — each with detailed explanations on MedLadder."),
    ("Practice {n} {topic} MCQs covering {phrases} — NEET PG, FMGE, INI-CET & "
     "NEET SS preparation with detailed answer explanations on MedLadder."),
    ("{topic} important questions: {n} MCQs on {phrases} with answers & "
     "explanations for NEET PG, FMGE, INI-CET, NEET SS — on MedLadder."),
]

_GENERIC_PHRASES = {"treatment", "basics", "general", "overview", "introduction",
                    "part", "approach", "evaluation", "miscellaneous", "mixed",
                    "disorders", "disorder", "diseases", "disease"}

def topic_key_phrases(mod_name, section_name, max_phrases=4, subj_name=""):
    """Derive 2-4 distinctive key phrases from the topic's own data (name + section)."""
    phrases, seen = [], set()
    for p in re.split(r'\s*(?:,|&|\band\b|\bof\b|\bin\b| – | — | - | / |\bvs\.?\b|\bversus\b)\s*',
                      mod_name, flags=re.I):
        p = p.strip(' -–—').strip()
        # strip leading articles/generic adjectives: "General Anatomy of Thorax" -> "Anatomy", "Thorax"
        p = re.sub(r'^(the|a|general|important|basic|basics|clinical)\s+', '', p, flags=re.I).strip()
        pl = p.lower()
        if p and pl not in seen and pl not in _GENERIC_PHRASES and len(p) >= 3:
            phrases.append(p)
            seen.add(pl)
    sec = (section_name or '').strip()
    if sec and sec.lower() not in seen and sec.lower() not in mod_name.lower():
        phrases.append(sec)
        seen.add(sec.lower())
    # thin-topic fallback: never echo the bare topic name alone — add subject context
    if len(phrases) <= 1 and subj_name and subj_name.lower() not in seen:
        phrases.append(subj_name)
        seen.add(subj_name.lower())
    # drop a phrase that merely echoes the full topic name when other phrases exist
    ml = mod_name.lower()
    if len(phrases) > 1:
        phrases = [p for p in phrases if p.lower() != ml] or phrases
    return phrases[:max_phrases] or [mod_name]

_XSTOP = {'and', 'the', 'with', 'for', 'from', 'into', 'general', 'principles',
          'basics', 'clinical', 'medical', 'system', 'systems', 'disorders',
          'diseases', 'disease', 'anatomy', 'physiology', 'management', 'disorder',
          'syndrome', 'part', 'approach'}

def build_cross_subject_index(syllabus):
    """Index every topic's significant words + document frequency for IDF scoring."""
    from collections import Counter
    topics = []
    for s in syllabus:
        for m in s.get('modules', []):
            words = {w for w in re.findall(r'[a-z]{4,}', m['name'].lower()) if w not in _XSTOP}
            topics.append({'subject': s['name'], 'ssub': slugify(s['name']),
                           'name': m['name'], 'slug': slugify(m['name']), 'words': words})
    df = Counter()
    for t in topics:
        df.update(t['words'])
    return topics, df

def cross_subject_links(topics, df, subject_name, mod_name, topn=2):
    """Genuinely overlapping topics in OTHER subjects, ranked by IDF word overlap."""
    mine = {w for w in re.findall(r'[a-z]{4,}', mod_name.lower()) if w not in _XSTOP}
    scored = []
    for t in topics:
        if t['subject'] == subject_name:
            continue
        ov = mine & t['words']
        if not ov:
            continue
        score = sum(1.0 / df[w] for w in ov)
        if len(ov) >= 2 or score >= 0.25:
            scored.append((score, t))
    scored.sort(key=lambda x: -x[0])
    return [t for _, t in scored[:topn]]

def build_topic_title(mod_name, subj_name, qcount):
    title = SEO_TITLE_PATTERN.format(topic=mod_name, n=f"{qcount:,}",
                                     subject=subj_name, year=SEO_YEAR)
    if len(title) <= 62:
        return title
    title = SEO_TITLE_FALLBACK.format(topic=mod_name, n=f"{qcount:,}",
                                     subject=subj_name, year=SEO_YEAR)
    if len(title) <= 62:
        return title
    room = 62 - len(f" MCQs for NEET PG {SEO_YEAR}")
    return mod_name[:room - 1].rstrip(" ,-–—:;(") + "…" + f" MCQs for NEET PG {SEO_YEAR}"

def build_topic_desc(mod_name, subj_name, qcount, phrases):
    import hashlib
    phr = ", ".join(phrases)
    # deterministic variant pick (md5, NOT hash() — must be stable across runs)
    vi = int(hashlib.md5(mod_name.encode("utf-8")).hexdigest(), 16) % len(SEO_DESC_PATTERNS)
    desc = SEO_DESC_PATTERNS[vi].format(topic=mod_name, n=f"{qcount:,}",
                                        subject=subj_name, phrases=phr, year=SEO_YEAR)
    return fit_desc(desc)

def money_page_cards(subject_name):
    """Contextual money-page cards appended to the 'Prepare for your exam' section."""
    cards = [
        '<a href="/mock-test" class="seo-card">'
        '<strong>Free All-India Mock Tests</strong>'
        '<small>Timed mocks with live leaderboards</small></a>'
    ]
    if subject_name == "Pediatrics":
        cards.append(
            '<a href="/neet-ss-books" class="seo-card">'
            '<strong>NEET SS Books — Free PDFs</strong>'
            '<small>Super-speciality review books incl. Pediatrics</small></a>'
        )
    return "".join(cards)

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

    # SEO upgrade: precompute cross-subject topic index (IDF word overlap)
    _x_topics, _x_df = build_cross_subject_index(syllabus)
    print(f"✓ Built cross-subject link index ({len(_x_topics)} topics)")

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
  <script src="/theme-init.js"></script>
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

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&family=DM+Sans:wght@400;500;600;700&display=optional" media="print" id="gfonts-css">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,500&family=DM+Sans:wght@400;500;600;700&display=optional"></noscript>

  <link rel="stylesheet" href="/app.css">
  <link rel="stylesheet" href="/quiz-pro.css" media="print" id="quiz-pro-css">
</head>

<body>
  <div class="app" id="app">
{masthead_html()}
{pre_rendered_body}
{footer_html()}
  </div>

  <script src="{SUPABASE_JS_URL}" crossorigin="anonymous" integrity="sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o" defer></script>
  <script src="/syllabus.js" defer></script>
  <script src="/app.js" defer></script>
  <script src="/gtag-init.js" defer></script>
  <script src="/analytics-loader.js" defer></script>
</body>

</html>
"""

    sitemap_entries = [
        {"loc": f"{SITE_URL}/", "priority": "1.0", "changefreq": "daily"},
        {"loc": f"{SITE_URL}/landing", "priority": "0.9", "changefreq": "weekly"},
        {"loc": f"{SITE_URL}/mock-test", "priority": "0.9", "changefreq": "weekly"},
        {"loc": f"{SITE_URL}/neet-ss-books", "priority": "0.9", "changefreq": "weekly"},
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
                    "q": ACCESS_FAQ_Q,
                    "a": ACCESS_FAQ_A
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
            f'<a href="/subjects/{slugify(s["name"])}" class="seo-card">'
            f'<strong>{esc(s["name"])}</strong><small>{s.get("questionCount", 0):,} MCQs · {s.get("moduleCount", 0)} modules</small></a>'
            for s in syllabus
        ])

        faq_details_html = "".join([
            f'<details class="seo-faq-card">'
            f'<summary><span>{esc(f["q"])}</span><span style="color:var(--accent);font-size:14px;margin-left:12px;">▾</span></summary>'
            f'<p>{esc(f["a"])}</p>'
            f'</details>'
            for f in ex["faqs"]
        ])

        body_html = f"""    <main class="seo-main" role="main">
      <nav class="seo-breadcrumb" aria-label="Breadcrumb">
        <a href="/" id="seoHomeTop">Home</a>
        <span class="sep" aria-hidden="true">/</span> <span>{esc(ex["name"])}</span>
      </nav>
      <div class="hero-wrap" style="padding:10px 4px 24px;text-align:center;">
        <div class="hero-eyebrow">⚡ {esc(ex["name"])} Question Bank &amp; PYQs</div>
        <h1 class="title">{esc(ex["name"])} <span class="brand-gradient">Question Bank</span></h1>
        <p class="subtitle" style="max-width:760px;margin:0 auto 18px;line-height:1.65;">{esc(ex["intro"])}</p>
        <div class="bento-bar" style="max-width:680px;margin:18px auto 24px;">
          <div class="bento-stat"><div class="bento-stat-num">37,076</div><div class="bento-stat-lbl">Total MCQs</div></div>
          <div class="bento-stat"><div class="bento-stat-num">{esc(ex["name"])}</div><div class="bento-stat-lbl">Verified PYQs</div></div>
          <div class="bento-stat"><div class="bento-stat-num">19</div><div class="bento-stat-lbl">Subjects</div></div>
          <div class="bento-stat"><div class="bento-stat-num">100%</div><div class="bento-stat-lbl">With Explanations</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:22px 0 6px;">
          <button id="seoStartBtn" class="btn" style="font-size:15px;padding:14px 28px;cursor:pointer;">Start Practising {esc(ex["name"])}</button>
          <a href="/" id="seoHomeBottom" class="btn secondary" style="font-size:15px;padding:14px 24px;text-decoration:none;">Back to Home</a>
        </div>
      </div>
      <section aria-labelledby="seoTopics" style="margin-top:28px;">
        <h2 id="seoTopics" class="seo-section-title">What you can practise</h2>
        <ul style="line-height:1.8;padding-left:22px;color:var(--ink-soft);font-size:15px;">
          <li><strong style="color:var(--ink);">Previous-year question papers</strong> with year and session filtering</li>
          <li><strong style="color:var(--ink);">Topic-wise medical MCQs</strong> across all 19 medical entrance subjects</li>
          <li><strong style="color:var(--ink);">Detailed explanations</strong> for every question to learn from mistakes</li>
          <li><strong style="color:var(--ink);">Timed exam simulation mode</strong> with instant score and performance tracking</li>
        </ul>
      </section>
      <section aria-labelledby="subjectTopics" style="margin-top:34px;">
        <h2 id="subjectTopics" class="seo-section-title">19 Subject-Wise Question Banks for {esc(ex["name"])}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
          {subjects_cards_html}
        </div>
      </section>
      <section aria-labelledby="seoFaq" style="margin-top:38px;">
        <h2 id="seoFaq" class="seo-section-title">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:6px;">
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

        s_title = f"{subj['name']} MCQs with Answers for NEET PG {SEO_YEAR}"
        _s_secs, _s_seen = [], set()
        for _m in subj.get("modules", []):
            _sec = (_m.get("section") or "").strip()
            if _sec and _sec.lower() not in _s_seen:
                _s_secs.append(_sec)
                _s_seen.add(_sec.lower())
            if len(_s_secs) >= 3:
                break
        _s_phr = ", ".join(_s_secs)
        s_desc = fit_desc(
            f"{subj['name']} MCQs: practice {subj.get('questionCount', 0):,} topic-wise questions "
            f"across {subj.get('moduleCount', 0)} modules ({_s_phr}) for NEET PG, FMGE, INI-CET & NEET SS "
            f"— detailed explanations on MedLadder."
        )
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
                "q": f"How do I start practising {subj['name']} on MedLadder?",
                "a": ACCESS_FAQ_A
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
            f'<a href="/subjects/{s_slug}/{slugify(m["name"])}" class="seo-card">'
            f'<strong>{esc(m["name"])}</strong><small>{m.get("questionCount", 0):,} questions · {esc(m.get("section", ""))}</small></a>'
            for m in modules
        ])

        s_faq_html = "".join([
            f'<details class="seo-faq-card">'
            f'<summary><span>{esc(f["q"])}</span><span style="color:var(--accent);font-size:14px;margin-left:12px;">▾</span></summary>'
            f'<p>{esc(f["a"])}</p>'
            f'</details>'
            for f in s_faqs
        ])

        s_body_html = f"""    <main class="seo-main" role="main">
      <nav class="seo-breadcrumb" aria-label="Breadcrumb">
        <a href="/" id="seoHomeTop">Home</a>
        <span class="sep" aria-hidden="true">/</span> <span>{esc(subj["name"])}</span>
      </nav>
      <div class="hero-wrap" style="padding:10px 4px 24px;text-align:center;">
        <div class="hero-eyebrow">⚡ {esc(subj["name"])} Question Bank</div>
        <h1 class="title">{esc(subj["name"])} <span class="brand-gradient">MCQs</span></h1>
        <p class="subtitle" style="max-width:760px;margin:0 auto 18px;line-height:1.65;">{esc(s_intro)}</p>
        <div class="bento-bar" style="max-width:680px;margin:18px auto 24px;">
          <div class="bento-stat"><div class="bento-stat-num">{subj.get('questionCount', 0):,}</div><div class="bento-stat-lbl">Questions</div></div>
          <div class="bento-stat"><div class="bento-stat-num">{subj.get('moduleCount', 0)}</div><div class="bento-stat-lbl">Topics</div></div>
          <div class="bento-stat"><div class="bento-stat-num">4 Exams</div><div class="bento-stat-lbl">NEET PG · INICET · FMGE · SS</div></div>
          <div class="bento-stat"><div class="bento-stat-num">100%</div><div class="bento-stat-lbl">With Rationales</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:22px 0 6px;">
          <button id="seoStartBtn" class="btn" style="font-size:15px;padding:14px 28px;cursor:pointer;">Open {esc(subj["name"])} Topics</button>
          <a href="/" id="seoHomeBottom" class="btn secondary" style="font-size:15px;padding:14px 24px;text-decoration:none;">Back to Home</a>
        </div>
      </div>
      <section aria-labelledby="seoTopics" style="margin-top:28px;">
        <h2 id="seoTopics" class="seo-section-title">What you can practise</h2>
        <ul style="line-height:1.8;padding-left:22px;color:var(--ink-soft);font-size:15px;">
          <li><strong style="color:var(--ink);">Topic-wise medical MCQs</strong> for targeted revision</li>
          <li><strong style="color:var(--ink);">Previous-year questions</strong> verified across NEET PG, INI-CET, and FMGE</li>
          <li><strong style="color:var(--ink);">Detailed explanations</strong> for every question</li>
          <li><strong style="color:var(--ink);">Performance tracking</strong> to spot and strengthen weak areas</li>
        </ul>
      </section>
      <section aria-labelledby="subjectTopics" style="margin-top:34px;">
        <h2 id="subjectTopics" class="seo-section-title">{esc(subj["name"])} topic-wise question banks</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
          {modules_cards_html}
        </div>
      </section>
      {exam_links_html(extra_cards=money_page_cards(subj["name"]))}
      <section aria-labelledby="seoFaq" style="margin-top:38px;">
        <h2 id="seoFaq" class="seo-section-title">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:6px;">
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

            m_title = build_topic_title(mod['name'], subj['name'], mod.get('questionCount', 0))
            if m_title in used_module_titles:          # never let truncation create duplicate titles
                m_title = f"{mod['name']} MCQs | {subj['name']} | MedLadder"
            used_module_titles.add(m_title)
            _phrases = topic_key_phrases(mod['name'], mod.get('section', ''), subj_name=subj['name'])
            m_desc = build_topic_desc(mod['name'], subj['name'], mod.get('questionCount', 0), _phrases)
            _xlinks = cross_subject_links(_x_topics, _x_df, subj['name'], mod['name'])
            m_heading = f"{mod['name']} — {subj['name']} MCQs"
            m_intro = (f"{mod['name']} is part of the {mod.get('section', 'core')} section of {subj['name']}. "
                       f"Practise {mod.get('questionCount', 0)} exam-style MCQs for NEET PG, FMGE, INI-CET and NEET SS, "
                       f"each with the correct answer and a detailed explanation.")

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
                    "q": f"How do I start practising {mod['name']} on MedLadder?",
                    "a": ACCESS_FAQ_A
                }
            ]

            samples = SAMPLES.get(str(mod.get("id")), [])
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
                    **({"hasPart": [sample_schema(sm) for sm in samples]} if samples else {}),
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
                f'<a href="/subjects/{s_slug}/{slugify(n["name"])}" class="seo-card" style="display:block;text-decoration:none;">'
                f'<strong style="font-size:15px;color:var(--ink);">{esc(n["name"])}</strong><br><small style="color:var(--ink-soft);">{n.get("questionCount", 0):,} questions</small></a>'
                for n in nearby
            ])

            m_faq_html = "".join([
                f'<details class="seo-faq-card">'
                f'<summary>{esc(f["q"])}</summary>'
                f'<p>{esc(f["a"])}</p>'
                f'</details>'
                for f in m_faqs
            ])

            prev_mod = modules[idx - 1] if idx > 0 else None
            next_mod = modules[idx + 1] if idx + 1 < len(modules) else None
            pn_parts = []
            if prev_mod:
                pn_parts.append(f'<a href="/subjects/{s_slug}/{slugify(prev_mod["name"])}" rel="prev" class="btn secondary" style="font-size:14px;padding:10px 18px;text-decoration:none;">← {esc(prev_mod["name"])}</a>')
            if next_mod:
                pn_parts.append(f'<a href="/subjects/{s_slug}/{slugify(next_mod["name"])}" rel="next" class="btn secondary" style="font-size:14px;padding:10px 18px;text-decoration:none;">{esc(next_mod["name"])} →</a>')
            pn_html = (f'<nav aria-label="Previous and next topic" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:32px;">{"".join(pn_parts)}</nav>') if pn_parts else ""
            samples_block = samples_html(samples, mod["name"])
            exam_block = exam_links_html(extra_cards=money_page_cards(subj["name"]))
            _xlink_cards = "".join(
                f'<a href="/subjects/{t["ssub"]}/{t["slug"]}" class="seo-card" style="display:block;text-decoration:none;">'
                f'<strong style="font-size:15px;color:var(--ink);">{esc(t["name"])}</strong><br><small style="color:var(--ink-soft);">{esc(t["subject"])}</small></a>'
                for t in _xlinks
            )
            _xlink_section = (
                f'<section aria-labelledby="xSubjectTopics" style="margin-top:36px;">'
                f'<h2 id="xSubjectTopics" class="seo-section-title">Related topics in other subjects</h2>'
                f'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">'
                f'{_xlink_cards}</div></section>'
            ) if _xlink_cards else ""
            _practise_phrases = ", ".join(_phrases[:3])

            m_body_html = f"""    <main class="seo-main">
      <nav aria-label="Breadcrumb" class="seo-breadcrumb">
        <a href="/" id="seoHomeTop">← Home</a>
        <span aria-hidden="true">/</span>
        <a href="/subjects/{s_slug}" id="seoSubjectCrumb">{esc(subj["name"])}</a>
        <span aria-hidden="true">/</span> <span>{esc(mod["name"])}</span>
      </nav>
      <div class="hero-wrap" style="text-align:center;padding:32px 18px 26px;margin-bottom:28px;">
        <div class="hero-eyebrow">Medical Entrance Revision · {esc(subj["name"])}</div>
        <h1 class="title">{esc(mod["name"])} <span class="brand-gradient">MCQs</span></h1>
        <p class="subtitle" style="max-width:760px;margin:0 auto 18px;line-height:1.65;">{esc(m_intro)}</p>
        <div class="bento-bar" style="max-width:680px;margin:18px auto 24px;">
          <div class="bento-stat"><div class="bento-stat-num">{mod.get('questionCount', 0):,}</div><div class="bento-stat-lbl">Questions</div></div>
          <div class="bento-stat"><div class="bento-stat-num">Core</div><div class="bento-stat-lbl">{esc(mod.get('section', 'Syllabus'))}</div></div>
          <div class="bento-stat"><div class="bento-stat-num">4 Exams</div><div class="bento-stat-lbl">NEET PG · INICET · FMGE · SS</div></div>
          <div class="bento-stat"><div class="bento-stat-num">100%</div><div class="bento-stat-lbl">With Rationales</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:22px 0 6px;">
          <button id="seoStartBtn" class="btn" style="font-size:15px;padding:14px 28px;cursor:pointer;">Start {esc(mod["name"])} Practice</button>
          <a href="/subjects/{s_slug}" class="btn secondary" style="font-size:15px;padding:14px 24px;text-decoration:none;">All {esc(subj["name"])} Topics</a>
        </div>
      </div>
      {samples_block}
      <section aria-labelledby="seoTopics" style="margin-top:30px;">
        <h2 id="seoTopics" class="seo-section-title">What you can practise in {esc(mod["name"])}</h2>
        <ul style="line-height:1.8;padding-left:22px;color:var(--ink-soft);font-size:15px;">
          <li><strong style="color:var(--ink);">{mod.get('questionCount', 0)} {esc(subj["name"])} MCQs</strong> on {esc(_practise_phrases)} — each with detailed explanations</li>
          <li><strong style="color:var(--ink);">Previous-year question practice</strong> across NEET PG, FMGE, INI-CET and NEET SS</li>
          <li><strong style="color:var(--ink);">Progress and performance tracking</strong> to measure retention</li>
        </ul>
      </section>
      <section aria-labelledby="relatedTopics" style="margin-top:36px;">
        <h2 id="relatedTopics" class="seo-section-title">More {esc(subj["name"])} topics</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
          {nearby_cards_html}
        </div>
      </section>
      {_xlink_section}
      {exam_block}
      <section aria-labelledby="seoFaq" style="margin-top:38px;">
        <h2 id="seoFaq" class="seo-section-title">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:6px;">
          {m_faq_html}
        </div>
      </section>
      {pn_html}
    </main>"""

            write_page(os.path.join(m_dir, "index.html"), render_page(m_title, m_desc, m_url, m_schemas, m_body_html), m_url)
            total_pages_generated += 1

    print(f"✓ Generated {total_pages_generated} static SEO pages")

    # 7. Update root index.html with crawlable homepage fallback and extracted assets
    home_subject_links = "".join([
        f'<a href="/subjects/{slugify(s["name"])}" class="seo-card" style="display:block;text-decoration:none;">'
        f'<strong style="font-size:16px;color:var(--ink);">{esc(s["name"])}</strong><br>'
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
            "q": ACCESS_FAQ_Q,
            "a": ACCESS_FAQ_A
        },
        {
            "q": "Can I practice questions in timed test mode?",
            "a": "Yes. MedLadder supports both Practice Mode (instant answer feedback) and Exam Mode (timed tests with customizable question limits and end-of-test review)."
        }
    ]

    home_faq_html = "".join([
        f'<details class="seo-faq-card">'
        f'<summary>{esc(f["q"])}</summary>'
        f'<p>{esc(f["a"])}</p>'
        f'</details>'
        for f in home_faqs
    ])

    home_body_fallback = f"""    <main class="seo-main">
      <div class="hero-wrap" style="text-align:center;padding:34px 18px 28px;margin-bottom:32px;">
        <div class="hero-eyebrow">India's Medical PG &amp; Licensure Question Bank</div>
        <h1 class="title">Medical Entrance Exam <span class="brand-gradient">Question Bank</span></h1>
        <p class="subtitle" style="max-width:780px;margin:0 auto 20px;line-height:1.65;">
          Master <strong>FMGE, NEET PG, INI-CET &amp; NEET SS</strong> with 37,076 topic-wise MCQs across 19 subjects, previous-year question papers, high-yield clinical explanations, and progress tracking.
        </p>
        <div class="bento-bar" style="max-width:680px;margin:20px auto 10px;">
          <div class="bento-stat"><div class="bento-stat-num">37,076</div><div class="bento-stat-lbl">Questions</div></div>
          <div class="bento-stat"><div class="bento-stat-num">19</div><div class="bento-stat-lbl">Subjects</div></div>
          <div class="bento-stat"><div class="bento-stat-num">4 Exams</div><div class="bento-stat-lbl">NEET PG · INICET · FMGE · SS</div></div>
          <div class="bento-stat"><div class="bento-stat-num">100%</div><div class="bento-stat-lbl">Verified Rationales</div></div>
        </div>
      </div>

      <section aria-labelledby="homeExams" style="margin-bottom:36px;">
        <h2 id="homeExams" class="seo-section-title">Previous-Year Question Papers (PYQ Bank)</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
          <a href="/neet-pg" class="seo-card" style="text-decoration:none;display:block;">
            <strong style="font-size:16px;color:var(--ink);">🏥 NEET PG PYQs</strong><br>
            <small style="color:var(--ink-soft);">2018–2025 · 8 Years (1,640+ MCQs)</small>
          </a>
          <a href="/inicet" class="seo-card" style="text-decoration:none;display:block;">
            <strong style="font-size:16px;color:var(--ink);">🔬 INI-CET PYQs</strong><br>
            <small style="color:var(--ink-soft);">2020–2025 · 10 Sessions (1,460+ MCQs)</small>
          </a>
          <a href="/fmge" class="seo-card" style="text-decoration:none;display:block;">
            <strong style="font-size:16px;color:var(--ink);">🌐 FMGE PYQs</strong><br>
            <small style="color:var(--ink-soft);">2020–2025 · 10 Sessions (2,430+ MCQs)</small>
          </a>
          <a href="/neet-ss" class="seo-card" style="text-decoration:none;display:block;">
            <strong style="font-size:16px;color:var(--ink);">⚕️ NEET SS PYQs</strong><br>
            <small style="color:var(--ink-soft);">2022–2024 Exam Question Papers</small>
          </a>
        </div>
      </section>

      <section aria-labelledby="homeSubjects">
        <h2 id="homeSubjects" class="seo-section-title">19 Subject-Wise Question Banks</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
          {home_subject_links}
        </div>
      </section>

      <section aria-labelledby="homeFaqs" style="margin-top:40px;">
        <h2 id="homeFaqs" class="seo-section-title">Frequently Asked Questions</h2>
        <div style="display:flex;flex-direction:column;gap:6px;">
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

    # Render clean index.html — but NEVER clobber a hand-customized homepage.
    # Only write when the file is missing or already matches this template.
    _gen_marker = "MedLadder — FMGE, NEET PG, INI-CET & NEET SS QBank"
    _existing_index = None
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            _existing_index = f.read()
    if _existing_index is None or _gen_marker in _existing_index:
        write_page(index_path, new_index_html, f"{SITE_URL}/")
        print("✓ Updated index.html with crawlable semantic fallback and linked assets")
    else:
        lastmods[f"{SITE_URL}/"] = prev_lastmod.get(f"{SITE_URL}/", CURRENT_DATE)
        print("✓ Skipped index.html (hand-customized homepage preserved)")

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
    # NOTE: vercel.json on main carries two hand-added production blocks that the
    # generator must preserve: the /download-apk rewrite (+ APK headers) and the
    # github.com CSP allowances. They are baked into the template below so that
    # regeneration never drops them again.
    vercel_csp = CSP.replace(
        "https://www.googletagmanager.com; frame-src https://api.razorpay.com https://checkout.razorpay.com;",
        "https://www.googletagmanager.com https://github.com https://*.github.com https://*.githubusercontent.com; "
        "frame-src https://api.razorpay.com https://checkout.razorpay.com https://github.com https://*.github.com https://*.githubusercontent.com;"
    )
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
                "source": "/download-apk",
                "destination": "/MedLadder-latest.apk"
            },
            {
                "source": "/(.*)",
                "destination": "/index.html"
            }
        ],
        "headers": [
            {
                "source": "/MedLadder-latest.apk",
                "headers": [
                    {"key": "Content-Type", "value": "application/vnd.android.package-archive"},
                    {"key": "Content-Disposition", "value": "attachment; filename=\"MedLadder-latest.apk\""},
                    {"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}
                ]
            },
            {
                "source": "/(.*)",
                "headers": [{"key": "Content-Security-Policy", "value": vercel_csp}] + [{"key": k, "value": v} for k, v in SECURITY_HEADERS[1:]]
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
