#!/usr/bin/env node

/**
 * Copy external raster images referenced by question_text into Supabase Storage,
 * then replace their <img src> URLs with small Supabase WebP transforms.
 * Read-only preview is the default; pass --apply to make changes.
 */

import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucket = process.env.QUESTION_IMAGE_BUCKET || 'question-images';
const pageSize = 500;
const maxBytes = 25 * 1024 * 1024;
const requestedWorkers = Number(process.env.IMAGE_MIGRATION_CONCURRENCY || 2);
const workerLimit = Number.isFinite(requestedWorkers)
  ? Math.min(6, Math.max(1, Math.floor(requestedWorkers)))
  : 4;
const imageTag = /(<img\b[^>]*?\bsrc\s*=\s*)(["'])([\s\S]*?)\2/gi;

if (args.has('--help')) {
  console.log('Preview: node tools/migrate-external-question-images.mjs');
  console.log('Apply:   node tools/migrate-external-question-images.mjs --apply');
  console.log('Optional: set QUESTION_IMAGE_BUCKET (default: question-images).');
  process.exit(0);
}
if (!supabaseUrl || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.');
  process.exit(2);
}

const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

async function api(path, options = {}) {
  const method = options.method || 'GET';
  for (let attempt = 1; attempt <= 8; attempt++) {
    let response;
    try {
      response = await fetch(`${supabaseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(45000),
        headers: { ...authHeaders, 'User-Agent': 'MedLadderImageMigrator/1.0', ...(options.headers || {}) },
      });
    } catch (error) {
      const reason = error.cause?.code || error.cause?.message || error.message || 'network error';
      const transient = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|UND_ERR_SOCKET|fetch failed|TimeoutError/i.test(String(reason));
      if (!transient || attempt === 8) {
        throw new Error(`Supabase network request failed (${reason}) for ${method} ${path.split('?')[0]} after ${attempt} attempt(s)`);
      }
      console.log(`Supabase connection interrupted; retry ${attempt + 1}/8 in ${Math.min(attempt * 2, 15)}s`);
      await new Promise(resolve => setTimeout(resolve, Math.min(attempt * 2000, 15000)));
      continue;
    }
    if (response.ok) return response;
    const transientStatus = [408, 425, 429, 500, 502, 503, 504].includes(response.status);
    if (!transientStatus || attempt === 8) {
      throw new Error(`Supabase request failed (${response.status}) for ${method} ${path.split('?')[0]} after ${attempt} attempt(s)`);
    }
    const retryAfter = Number(response.headers.get('retry-after'));
    await response.body?.cancel();
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30000)
      : Math.min(attempt * 2000, 15000);
    console.log(`Supabase returned ${response.status}; retry ${attempt + 1}/8 in ${Math.ceil(waitMs / 1000)}s`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  throw new Error(`Supabase request failed for ${method} ${path.split('?')[0]}`);
}

function ipv4IsPublic(ip) {
  const n = ip.split('.').map(Number);
  if (n.length !== 4 || n.some(x => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a, b, c] = n;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168) ) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

function ipIsPublic(ip) {
  if (isIP(ip) === 4) return ipv4IsPublic(ip);
  if (isIP(ip) !== 6) return false;
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1' || normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') ||
      normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('ff')) return false;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? ipv4IsPublic(mapped[1]) : true;
}

async function validatePublicUrl(value) {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('An image URL uses an unsupported or credential-bearing address. No row was changed.');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('A non-public image host was found. No row was changed.');
  }
  const records = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => !ipIsPublic(record.address))) {
    throw new Error('An image host does not resolve exclusively to public addresses. No row was changed.');
  }
  return parsed;
}

function isSupabaseImageUrl(value) {
  try {
    const parsed = new URL(value);
    return /\.supabase\.co$/i.test(parsed.hostname) &&
      /^\/storage\/v1\/(?:object|render\/image)\/public\//.test(parsed.pathname);
  } catch { return false; }
}

async function fetchPublicImage(value) {
  let current = value;
  for (let redirects = 0; redirects <= 4; redirects++) {
    const parsed = await validatePublicUrl(current);
    let response = null;
    for (let attempt = 1; attempt <= 8; attempt++) {
      try {
        response = await fetch(parsed, {
          redirect: 'manual',
          signal: AbortSignal.timeout(30000),
          headers: {
            'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/gif',
            'User-Agent': 'Mozilla/5.0 (compatible; MedLadderImageMigrator/1.0)',
            'Referer': 'https://medladder.top/',
          },
        });
        if (![429, 500, 502, 503, 504].includes(response.status)) break;
        const retryAfter = Number(response.headers.get('retry-after'));
        await response.body?.cancel();
        if (attempt === 8) break;
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 20000)
          : Math.min(attempt * 3000, 20000);
        console.log(`CloudFront returned ${response.status}; retry ${attempt + 1}/8 in ${Math.ceil(waitMs / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      } catch (error) {
        const code = error.cause?.code || error.cause?.message || error.message || 'network error';
        const transient = /ECONNRESET|ETIMEDOUT|EAI_AGAIN|UND_ERR_SOCKET|fetch failed|TimeoutError/i.test(String(code));
        if (!transient || attempt === 8) {
          throw new Error(`External image request failed for host ${parsed.hostname} (${code}) after ${attempt} attempt(s).`);
        }
        const waitMs = Math.min(attempt * 3000, 20000);
        console.log(`CloudFront connection interrupted for ${parsed.hostname}; retry ${attempt + 1}/8 in ${Math.ceil(waitMs / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
    if (!response) throw new Error(`External image request failed for host ${parsed.hostname} (no response).`);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirects === 4) throw new Error('An image redirect chain is invalid or too long. No row was changed.');
      current = new URL(location, parsed).toString();
      continue;
    }
    if (!response.ok || !response.body) {
      const error = new Error(`External image request failed for host ${parsed.hostname} (${response.status}).`);
      if (response.status >= 400 && response.status < 500 && ![408, 425, 429].includes(response.status)) {
        error.permanentSourceFailure = true;
      }
      throw error;
    }
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > maxBytes) {
      await response.body.cancel();
      throw new Error('An external image exceeds the 25 MiB migration limit. No row was changed.');
    }
    const chunks = [];
    let total = 0;
    for await (const chunk of response.body) {
      total += chunk.length;
      if (total > maxBytes) {
        await response.body.cancel();
        throw new Error('An external image exceeds the 25 MiB migration limit. No row was changed.');
      }
      chunks.push(Buffer.from(chunk));
    }
    const bytes = Buffer.concat(chunks);
    const mimeHeader = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    let mime = mimeHeader;
    let ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[mime];
    if (!ext) throw new Error(`Unsupported external image format (${mimeHeader || 'unknown'}). No row was changed.`);
    return { bytes, mime, ext };
  }
  throw new Error('External image redirect limit reached. No row was changed.');
}

async function listRows(offset) {
  const query = new URLSearchParams({
    select: 'id,question_text,explanation',
    or: '(question_text.ilike.*<img*,explanation.ilike.*<img*)',
    order: 'id.asc',
    limit: String(pageSize),
    offset: String(offset),
  });
  const response = await api(`/rest/v1/questions?${query}`);
  return response.json();
}

async function getAllRows() {
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await listRows(offset);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function uploadImage(image) {
  const hash = createHash('sha256').update(image.bytes).digest('hex');
  const path = `migrated-external/${hash}.${image.ext}`;
  await api(`/storage/v1/object/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { 'Content-Type': image.mime, 'x-upsert': 'true' },
    body: image.bytes,
  });
  return `${supabaseUrl}/storage/v1/render/image/public/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}?width=640&height=640&resize=contain&quality=65&format=webp`;
}

async function patchQuestion(row, updatedFields) {
  const query = new URLSearchParams({ id: `eq.${row.id}` });
  await api(`/rest/v1/questions?${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(updatedFields),
  });
}

let completedRows = 0;
let plannedRows = 0;
const blockedImageUrls = new Map();
try {
  const rows = await getAllRows();
  const hostCounts = new Map();
  let externalReferences = 0;
  let supabaseReferences = 0;
  const planned = rows.map(row => {
    const fields = {};
    const urls = new Set();
    for (const field of ['question_text', 'explanation']) {
      const html = String(row[field] || '');
      html.replace(imageTag, (whole, before, quote, rawSrc) => {
        const src = rawSrc.trim();
        if (/^https?:\/\//i.test(src) && isSupabaseImageUrl(src)) supabaseReferences++;
        else if (/^https?:\/\//i.test(src)) {
          externalReferences++;
          try {
            const host = new URL(src).hostname.toLowerCase();
            hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
          } catch { /* Reported as unsupported below. */ }
          urls.add(src);
        }
        return whole;
      });
      if (html) fields[field] = html;
    }
    return { row, fields, urls: [...urls] };
  }).filter(item => item.urls.length);
  plannedRows = planned.length;

  console.log(`Question rows scanned: ${rows.length}`);
  console.log(`External image references to rehost: ${externalReferences}`);
  console.log(`Supabase image references already handled by the app: ${supabaseReferences}`);
  console.log(`Rows containing external images: ${planned.length}`);
  console.log('External hosts:');
  for (const [host, count] of [...hostCounts].sort((a, b) => b[1] - a[1])) console.log(`  ${host}: ${count}`);
  if (!apply) {
    console.log('Dry run only. No image downloads, uploads, or database changes were made. Add --apply to proceed.');
    process.exit(0);
  }

  const imageCache = new Map();
  let nextIndex = 0;
  let firstFailure = null;
  async function worker() {
    while (true) {
      if (firstFailure) return;
      const index = nextIndex++;
      if (index >= planned.length) return;
      const item = planned[index];
      try {
      let changed = false;
      for (const src of item.urls) {
        let resizedUrl;
        try {
          if (!imageCache.has(src)) imageCache.set(src, (async () => uploadImage(await fetchPublicImage(src)))());
          resizedUrl = await imageCache.get(src);
        } catch (error) {
          if (!error.permanentSourceFailure) throw error;
          const blocked = blockedImageUrls.get(src) || { host: new URL(src).hostname, rows: new Set() };
          blocked.rows.add(item.row.id);
          blockedImageUrls.set(src, blocked);
          continue;
        }
        for (const field of ['question_text', 'explanation']) {
          if (item.fields[field]) {
            const updated = item.fields[field].replace(imageTag, (whole, before, quote, rawSrc) =>
              rawSrc.trim() === src ? `${before}${quote}${resizedUrl}${quote}` : whole);
            if (updated !== item.fields[field]) changed = true;
            item.fields[field] = updated;
          }
        }
      }
      if (changed) await patchQuestion(item.row, item.fields);
      completedRows++;
      if (completedRows % 25 === 0 || completedRows === planned.length) console.log(`Processed ${completedRows} of ${planned.length} rows`);
      } catch (error) {
        firstFailure = new Error(`Failed on question row ${item.row.id}: ${error.message}`);
        return;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(workerLimit, planned.length) }, () => worker()));
  if (firstFailure) throw new Error(`Stopped after ${completedRows} of ${planned.length} rows: ${firstFailure.message}`);
  console.log(`Finished processing ${completedRows} rows. Successfully fetched image files are in Supabase Storage.`);
  if (blockedImageUrls.size) {
    const hosts = new Map();
    for (const blocked of blockedImageUrls.values()) {
      const item = hosts.get(blocked.host) || { images: 0, rows: new Set() };
      item.images++;
      blocked.rows.forEach(id => item.rows.add(id));
      hosts.set(blocked.host, item);
    }
    console.log(`Some source URLs denied access and remain in the questions: ${blockedImageUrls.size} unique image URLs.`);
    for (const [host, item] of hosts) console.log(`  ${host}: ${item.images} URLs across ${item.rows.size} question rows`);
  }
} catch (error) {
  if (apply && plannedRows) console.error(`Rows processed before stop: ${completedRows} of ${plannedRows}. Rerunning is safe; completed external URLs are already replaced.`);
  console.error(error.message || 'Migration stopped.');
  process.exitCode = 1;
}
