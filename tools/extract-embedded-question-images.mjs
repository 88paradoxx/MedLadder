#!/usr/bin/env node

/**
 * Extract <img> elements from questions.question_text and questions.explanation.
 *
 * The actual image files must already be public Supabase Storage objects. This
 * tool creates a structured question_images relation and replaces each tag with
 * a stable [[mlimg:<uuid>]] marker. Run supabase/extract-question-images.sql
 * first. Preview is the default; --apply writes database changes.
 */

import { randomUUID } from 'node:crypto';

const apply = process.argv.includes('--apply');
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const pageSize = 1000;
const concurrency = Math.min(4, Math.max(1, Number(process.env.IMAGE_EXTRACTION_CONCURRENCY || 3)));
const imageTag = /<img\b[^>]*>/gi;

if (!supabaseUrl || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this tool.');
  process.exit(2);
}

const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

async function api(path, options = {}) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(`${supabaseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(45000),
        headers: { ...authHeaders, ...(options.headers || {}) },
      });
      if (response.ok) return response;
      if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === 5) {
        throw new Error(`${options.method || 'GET'} ${path.split('?')[0]} failed (${response.status}): ${await response.text()}`);
      }
      await response.body?.cancel();
    } catch (error) {
      if (attempt === 5) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
}

async function listRows(offset) {
  const params = new URLSearchParams({
    select: 'id,question_text,explanation',
    or: '(question_text.ilike.*<img*,explanation.ilike.*<img*)',
    order: 'id.asc', limit: String(pageSize), offset: String(offset),
  });
  return (await api(`/rest/v1/questions?${params}`)).json();
}

function decodeHtml(value) {
  return String(value || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

function attr(tag, name) {
  const found = new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i').exec(tag);
  return found ? decodeHtml(found[2]).trim() : '';
}

function storageTarget(src) {
  let url;
  try { url = new URL(src); } catch { throw new Error(`Unsupported image source: ${src.slice(0, 120)}`); }
  if (!/\.supabase\.co$/i.test(url.hostname)) throw new Error(`Image is not in Supabase Storage: ${url.hostname}`);
  const match = url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/);
  if (!match) throw new Error(`Image URL is not a public Storage object: ${src}`);
  return {
    storage_bucket: decodeURIComponent(match[1]),
    storage_path: match[2].split('/').map(segment => decodeURIComponent(segment)).join('/'),
  };
}

function extractField(questionId, field, html) {
  let ordinal = 0;
  const relations = [];
  const updated = String(html || '').replace(imageTag, tag => {
    const src = attr(tag, 'src');
    if (!src) throw new Error(`Question ${questionId} has an image tag without src in ${field}.`);
    const target = storageTarget(src);
    const id = randomUUID();
    relations.push({
      id,
      question_id: questionId,
      content_field: field,
      ordinal: ordinal++,
      storage_bucket: target.storage_bucket,
      storage_path: target.storage_path,
      alt_text: attr(tag, 'alt') || null,
    });
    return `[[mlimg:${id}]]`;
  });
  return { updated, relations };
}

async function writeRow(item) {
  const backup = { question_id: item.id, question_text: item.question_text, explanation: item.explanation };
  await api('/rest/v1/question_image_extraction_backups?on_conflict=question_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(backup),
  });
  await api('/rest/v1/question_images?on_conflict=question_id,content_field,ordinal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(item.relations),
  });
  await api(`/rest/v1/questions?id=eq.${item.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ question_text: item.updatedQuestion, explanation: item.updatedExplanation }),
  });
}

const rows = [];
for (let offset = 0; ; offset += pageSize) {
  const page = await listRows(offset);
  rows.push(...page);
  if (page.length < pageSize) break;
}

const planned = rows.map(row => {
  const question = extractField(row.id, 'question_text', row.question_text);
  const explanation = extractField(row.id, 'explanation', row.explanation);
  return {
    ...row,
    updatedQuestion: question.updated,
    updatedExplanation: explanation.updated,
    relations: [...question.relations, ...explanation.relations],
  };
});

const totalImages = planned.reduce((total, row) => total + row.relations.length, 0);
const bucketCounts = new Map();
for (const row of planned) for (const image of row.relations) {
  bucketCounts.set(image.storage_bucket, (bucketCounts.get(image.storage_bucket) || 0) + 1);
}
console.log(`Rows with embedded image tags: ${planned.length}`);
console.log(`Image relations to extract: ${totalImages}`);
for (const [bucket, count] of bucketCounts) console.log(`  ${bucket}: ${count} image references`);

if (!apply) {
  console.log('Dry run only. No question text, explanation, Storage object, or database relation was changed. Add --apply to proceed.');
  process.exit(0);
}

let completed = 0;
let nextIndex = 0;
async function worker() {
  while (true) {
    const index = nextIndex++;
    if (index >= planned.length) return;
    await writeRow(planned[index]);
    completed++;
    if (completed % 25 === 0 || completed === planned.length) console.log(`Extracted ${completed} of ${planned.length} rows`);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
console.log(`Finished. Extracted ${totalImages} image relations from ${completed} question rows.`);
