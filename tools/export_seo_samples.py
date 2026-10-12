#!/usr/bin/env python3
"""
export_seo_samples.py - pull a few clean sample MCQs per topic for the static SEO pages.

Run locally (never commit the key):
    export SUPABASE_SERVICE_ROLE_KEY="<service_role key from Supabase > Settings > API>"
    python3 tools/export_seo_samples.py
    python3 generate_seo.py

Why the service-role key: questions are protected by RLS, so the public anon key cannot
read them. The key stays on your machine; only the sample text is written to seo_samples.json.
"""
import json, os, re, sys, time, urllib.request, urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://groeibwykzrliphzzruk.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
PER_TOPIC = 3
if not KEY:
    sys.exit("Set SUPABASE_SERVICE_ROLE_KEY first (see header).")

s = open(os.path.join(BASE, "syllabus.js"), encoding="utf-8").read()
syllabus = json.loads(s[s.find("window.SYLLABUS_DATA = ") + len("window.SYLLABUS_DATA = "):].rstrip(";\n "))

def clean(t):
    t = re.sub(r"<[^>]+>", " ", t or "")
    t = re.sub(r"&nbsp;", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def fetch(module_id):
    q = urllib.parse.urlencode({
        "select": "id,question_text,option_a,option_b,option_c,option_d,answer,explanation,has_image",
        "module_id": f"eq.{module_id}", "is_pyq": "eq.false", "has_image": "eq.false",
        "order": "id.asc", "limit": "40",
    })
    headers = {"apikey": KEY}
    # New-style sb_secret_... keys go in the apikey header only; legacy JWT service_role
    # keys (eyJ...) also need the Authorization header.
    if not KEY.startswith("sb_"):
        headers["Authorization"] = f"Bearer {KEY}"
    req = urllib.request.Request(f"{URL}/rest/v1/questions?{q}", headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def pick(rows):
    out = []
    for r in rows:
        if "<img" in (r.get("question_text") or "") or "<img" in (r.get("explanation") or ""):
            continue
        qt, ex = clean(r["question_text"]), clean(r["explanation"])
        opts = [clean(r.get(f"option_{c}")) for c in "abcd"]
        ans = (r.get("answer") or "").strip().upper()
        if ans not in "ABCD" or not ans or not all(opts):
            continue
        if not (30 <= len(qt) <= 600) or not (40 <= len(ex) <= 900):
            continue
        out.append({"q": qt, "o": opts, "a": ans, "e": ex})
        if len(out) == PER_TOPIC:
            break
    return out

result, total = {}, 0
for subj in syllabus:
    for mod in subj["modules"]:
        try:
            picked = pick(fetch(mod["id"]))
        except Exception as e:
            print("skip module", mod["id"], mod["name"], e); continue
        if picked:
            result[str(mod["id"])] = picked
            total += len(picked)
        time.sleep(0.05)
    print("done", subj["name"])

with open(os.path.join(BASE, "seo_samples.json"), "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
print(f"Wrote seo_samples.json: {len(result)} topics, {total} questions")
