#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function patchQuizBlock(quiz) {
  let subject = null;
  const assesses = quiz.assesses || '';
  if (assesses.includes(' - ')) {
    subject = assesses.split(' - ')[0].trim();
  }
  if (!subject) {
    const name = quiz.name || '';
    if (name.includes('|')) {
      const parts = name.split('|');
      subject = parts[parts.length - 1].trim();
    }
  }
  if (!subject) {
    const raw = (quiz.name || 'Medicine').split('|')[0].trim();
    subject = raw.slice(0, 60) || 'Medicine';
  }

  const parts = quiz.hasPart || [];
  for (const q of parts) {
    if (!q || typeof q !== 'object' || q['@type'] !== 'Question') {
      continue;
    }
    const qtext = q.text || '';
    if (!('name' in q)) q.name = qtext;
    if (!('encodingFormat' in q)) q.encodingFormat = 'text/plain';
    if (!('learningResourceType' in q)) q.learningResourceType = 'Practice problem';
    if (!('educationalAlignment' in q)) {
      q.educationalAlignment = {
        '@type': 'AlignmentObject',
        'alignmentType': 'educationalSubject',
        'targetName': subject
      };
    }
    if (!('typicalAgeRange' in q)) q.typicalAgeRange = '22-';

    const suggested = Array.isArray(q.suggestedAnswer) ? q.suggestedAnswer : [];
    const nOpts = suggested.length;
    if (!('comment' in q)) {
      q.comment = {
        '@type': 'Comment',
        'text': `Multiple-choice practice question with ${nOpts} answer options.`
      };
    }

    for (let i = 0; i < suggested.length; i++) {
      const a = suggested[i];
      if (!a || typeof a !== 'object') continue;
      if (!('encodingFormat' in a)) a.encodingFormat = 'text/plain';
      if (!('comment' in a)) {
        a.comment = {
          '@type': 'Comment',
          'text': `Multiple-choice answer option ${i + 1}.`
        };
      }
    }

    const acc = q.acceptedAnswer;
    if (acc && typeof acc === 'object') {
      if (!('encodingFormat' in acc)) acc.encodingFormat = 'text/plain';
      if (!('comment' in acc)) {
        const expl = acc.answerExplanation;
        if (expl && typeof expl === 'object' && expl.text) {
          acc.comment = { '@type': 'Comment', 'text': expl.text };
        } else {
          acc.comment = { '@type': 'Comment', 'text': 'Correct answer with explanation.' };
        }
      }
    }
  }

  return quiz;
}

const LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

function processFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const newHtml = html.replace(LD_RE, (match, jsonText) => {
    try {
      const d = JSON.parse(jsonText);
      if (d && d['@type'] === 'Quiz' && Array.isArray(d.hasPart)) {
        patchQuizBlock(d);
        changed = true;
        return '<script type="application/ld+json">' + JSON.stringify(d, null, 2) + '</script>';
      }
    } catch (_) {
      return match;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, newHtml, 'utf-8');
  }
  return changed;
}

function getGlobFiles() {
  const fileSet = new Set();
  const subjectsDir = path.join(ROOT, 'subjects');

  if (fs.existsSync(subjectsDir)) {
    const subjects = fs.readdirSync(subjectsDir, { withFileTypes: true });
    for (const sub of subjects) {
      if (!sub.isDirectory()) continue;
      const subPath = path.join(subjectsDir, sub.name);
      const subIdx = path.join(subPath, 'index.html');
      if (fs.existsSync(subIdx)) fileSet.add(path.relative(ROOT, subIdx));

      const topics = fs.readdirSync(subPath, { withFileTypes: true });
      for (const top of topics) {
        if (!top.isDirectory()) continue;
        const topIdx = path.join(subPath, top.name, 'index.html');
        if (fs.existsSync(topIdx)) fileSet.add(path.relative(ROOT, topIdx));
      }
    }
  }

  const extraFiles = ['neet-ss/index.html', 'neet-pg/index.html', 'inicet/index.html', 'fmge/index.html'];
  for (const f of extraFiles) {
    if (fs.existsSync(path.join(ROOT, f))) {
      fileSet.add(f);
    }
  }

  return Array.from(fileSet).sort();
}

function main() {
  const files = getGlobFiles();
  let patched = 0;

  for (const f of files) {
    const fullPath = path.join(ROOT, f);
    try {
      if (processFile(fullPath)) {
        patched++;
      }
    } catch (e) {
      console.error(`ERROR ${f}: ${e.message}`);
    }
  }
  console.log(`HTML files patched: ${patched}`);

  const smPath = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(smPath, 'utf-8');
  if (!xml.includes('https://medladder.top/mock-test')) {
    const fullAnchor = `  <url>\n    <loc>https://medladder.top/landing</loc>\n    <lastmod>2026-10-12</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
    const entry = fullAnchor + `\n  <url>\n    <loc>https://medladder.top/mock-test</loc>\n    <lastmod>2026-10-15</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`;

    // Normalize newlines for replacement matching
    const hasCrlf = xml.includes('\r\n');
    const normalizedXml = xml.replace(/\r\n/g, '\n');

    if (!normalizedXml.includes(fullAnchor)) {
      throw new Error('sitemap anchor not found');
    }
    const updatedNormalizedXml = normalizedXml.replace(fullAnchor, entry);
    xml = hasCrlf ? updatedNormalizedXml.replace(/\n/g, '\r\n') : updatedNormalizedXml;
    fs.writeFileSync(smPath, xml, 'utf-8');
    console.log('sitemap.xml: /mock-test added');
  } else {
    console.log('sitemap.xml: /mock-test already present');
  }

  const urlMatches = xml.match(/<url>/g);
  console.log(`sitemap valid, urls: ${urlMatches ? urlMatches.length : 0}`);
}

main();
