#!/usr/bin/env python3
"""
MedLadder SEO schema fix — run from the repo root:
    python3 apply-seo-schema-fix.py

Adds Google's Practice Problems recommended fields to the Quiz JSON-LD
on all topic pages and adds /mock-test to sitemap.xml.
Idempotent: safe to re-run; existing fields are never overwritten.
"""
import re, json, glob, os, sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))

def patch_quiz_block(quiz):
    subject = None
    assesses = quiz.get('assesses', '')
    if ' - ' in assesses:
        subject = assesses.split(' - ')[0].strip()
    if not subject:
        name = quiz.get('name', '')
        if '|' in name:
            subject = name.split('|')[-1].strip()
    if not subject:
        subject = quiz.get('name', 'Medicine').split('|')[0].strip()[:60] or 'Medicine'

    for q in quiz.get('hasPart', []):
        if not isinstance(q, dict) or q.get('@type') != 'Question':
            continue
        qtext = q.get('text', '')
        q.setdefault('name', qtext)
        q.setdefault('encodingFormat', 'text/plain')
        q.setdefault('learningResourceType', 'Practice problem')
        if 'educationalAlignment' not in q:
            q['educationalAlignment'] = {
                '@type': 'AlignmentObject',
                'alignmentType': 'educationalSubject',
                'targetName': subject
            }
        q.setdefault('typicalAgeRange', '22-')
        n_opts = len(q.get('suggestedAnswer', []) or [])
        if 'comment' not in q:
            q['comment'] = {
                '@type': 'Comment',
                'text': 'Multiple-choice practice question with %d answer options.' % n_opts
            }
        for i, a in enumerate(q.get('suggestedAnswer', []) or []):
            if not isinstance(a, dict):
                continue
            a.setdefault('encodingFormat', 'text/plain')
            if 'comment' not in a:
                a['comment'] = {'@type': 'Comment',
                                'text': 'Multiple-choice answer option %d.' % (i + 1)}
        acc = q.get('acceptedAnswer')
        if isinstance(acc, dict):
            acc.setdefault('encodingFormat', 'text/plain')
            if 'comment' not in acc:
                expl = acc.get('answerExplanation')
                if isinstance(expl, dict) and expl.get('text'):
                    acc['comment'] = {'@type': 'Comment', 'text': expl['text']}
                else:
                    acc['comment'] = {'@type': 'Comment',
                                      'text': 'Correct answer with explanation.'}
    return quiz

LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)

def process_file(path):
    with open(path, encoding='utf-8') as f:
        html = f.read()
    changed = False
    def repl(m):
        nonlocal changed
        try:
            d = json.loads(m.group(1))
        except Exception:
            return m.group(0)
        if d.get('@type') == 'Quiz' and isinstance(d.get('hasPart'), list):
            patch_quiz_block(d)
            changed = True
            return ('<script type="application/ld+json">'
                    + json.dumps(d, ensure_ascii=False, indent=2) + '</script>')
        return m.group(0)
    new_html = LD_RE.sub(repl, html)
    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_html)
    return changed

def main():
    os.chdir(ROOT)
    files = (glob.glob('subjects/*/index.html')
             + glob.glob('subjects/*/*/index.html')
             + ['neet-ss/index.html', 'neet-pg/index.html',
                'inicet/index.html', 'fmge/index.html'])
    patched = 0
    for path in sorted(set(files)):
        if not os.path.exists(path):
            continue
        try:
            if process_file(path):
                patched += 1
        except Exception as e:
            print('ERROR %s: %s' % (path, e), file=sys.stderr)
    print('HTML files patched: %d' % patched)

    sm = 'sitemap.xml'
    xml = open(sm, encoding='utf-8').read()
    if 'https://medladder.top/mock-test' not in xml:
        full_anchor = """  <url>
    <loc>https://medladder.top/landing</loc>
    <lastmod>2026-10-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>"""
        entry = full_anchor + """
  <url>
    <loc>https://medladder.top/mock-test</loc>
    <lastmod>2026-10-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>"""
        assert full_anchor in xml, 'sitemap anchor not found'
        xml = xml.replace(full_anchor, entry)
        open(sm, 'w', encoding='utf-8').write(xml)
        print('sitemap.xml: /mock-test added')
    else:
        print('sitemap.xml: /mock-test already present')
    tree = ET.parse(sm)
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    urls = tree.getroot().findall(ns + 'url')
    print('sitemap valid, urls: %d' % len(urls))

if __name__ == '__main__':
    main()
