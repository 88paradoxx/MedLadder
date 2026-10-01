#!/usr/bin/env node

/**
 * Move legacy questions.image_url values into question_text and Supabase Storage.
 * Defaults to a read-only dry run. Pass --apply to upload and update rows.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */

import { createHash } from 'node:crypto';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucket = process.env.QUESTION_IMAGE_BUCKET || 'question-images';
const pageSize = 50;
const maxDataUriBytes = 25 * 1024 * 1024;

if (args.has('--help')) {
  console.log('Dry run: node tools/migrate-question-image-uris.mjs');
  console.log('Apply:   node tools/migrate-question-image-uris.mjs --apply');
  console.log('Optional: set QUESTION_IMAGE_BUCKET (default: question-images).');
  process.exit(0);
}

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.');
  process.exit(2);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

async function request(path, options = {}) {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!response.ok) {
    // Avoid echoing response bodies: some API errors may include submitted values.
    throw new Error(`Supabase request failed (${response.status}) for ${options.method || 'GET'} ${path.split('?')[0]}`);
  }
  return response;
}

function parseDataUri(value) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(value || '');
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!bytes.length) throw new Error('Found an empty base64 image value. No rows were changed.');
  if (bytes.length > maxDataUriBytes) throw new Error('A data URI exceeds the 25 MiB safe upload limit. No rows were changed.');
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' })[mime];
  if (!ext) throw new Error(`Unsupported image MIME type ${mime}. No rows were changed.`);
  return { mime, bytes, ext };
}

function storageRenderUrl(imageUrl) {
  const parsed = new URL(imageUrl);
  const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match || match[1] !== bucket) return imageUrl;
  const objectPath = match[2].split('/').map(encodeURIComponent).join('/');
  return `${url}/storage/v1/render/image/public/${encodeURIComponent(bucket)}/${objectPath}?width=1200&height=1200&resize=contain&quality=75&format=webp`;
}

function makeQuestionImage(imageUrl) {
  const safe = imageUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<p><img src="${safe}" alt="Question image" loading="lazy" decoding="async" style="max-width:100%;height:auto;object-fit:contain"></p>`;
}

async function getRows(offset) {
  const query = new URLSearchParams({
    select: 'id,question_text,image_url',
    image_url: 'not.is.null',
    order: 'id.asc',
    limit: String(pageSize),
    offset: String(offset),
  });
  const response = await request(`/rest/v1/questions?${query}`);
  return response.json();
}

async function listRows() {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await getRows(offset);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function uploadImage(image) {
  const digest = createHash('sha256').update(image.bytes).digest('hex');
  const objectPath = `migrated-data-uri/${digest}.${image.ext}`;
  await request(`/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { 'Content-Type': image.mime, 'x-upsert': 'true' },
    body: image.bytes,
  });
  return `${url}/storage/v1/render/image/public/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}?width=1200&height=1200&resize=contain&quality=75&format=webp`;
}

async function updateRow(row, questionText) {
  const query = new URLSearchParams({ id: `eq.${row.id}` });
  await request(`/rest/v1/questions?${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ question_text: questionText, image_url: null }),
  });
}

try {
  const rows = await listRows();
  let base64Count = 0;
  let httpCount = 0;
  let unsupportedCount = 0;
  for (const row of rows) {
    const value = (row.image_url || '').trim();
    if (!value) continue;
    if (/^data:image\//i.test(value)) {
      parseDataUri(value);
      base64Count++;
    } else if (/^https?:\/\//i.test(value)) {
      httpCount++;
    } else {
      unsupportedCount++;
    }
  }
  console.log(`Rows with image_url: ${rows.length}`);
  console.log(`Base64 data URI images: ${base64Count}`);
  console.log(`HTTP(S) image URLs: ${httpCount}`);
  console.log(`Unsupported values: ${unsupportedCount}`);

  if (unsupportedCount) {
    throw new Error('Unsupported image_url values were found. No rows were changed. Inspect those rows before proceeding.');
  }
  if (!apply) {
    console.log('Dry run only. No uploads or database changes were made. Add --apply to proceed.');
    process.exit(0);
  }

  let updated = 0;
  for (const row of rows) {
    const value = (row.image_url || '').trim();
    if (!value) continue;
    let imageUrl = value;
    if (/^data:image\//i.test(value)) imageUrl = await uploadImage(parseDataUri(value));
    else imageUrl = storageRenderUrl(value);

    let questionText = row.question_text || '';
    if (!questionText.includes(imageUrl)) questionText += `${questionText ? '\n' : ''}${makeQuestionImage(imageUrl)}`;
    await updateRow(row, questionText);
    updated++;
    if (updated % 25 === 0 || updated === rows.length) console.log(`Updated ${updated} of ${rows.length} rows`);
  }
  console.log(`Finished. Updated ${updated} question rows; the image_url column remains in place but is cleared for migrated rows.`);
} catch (error) {
  console.error(error.message || 'Migration stopped.');
  process.exitCode = 1;
}
