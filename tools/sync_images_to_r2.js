/**
 * tools/sync_images_to_r2.js
 * 
 * Pipeline:
 * 1. Queries Supabase Storage objects in 'question-images'.
 * 2. Checks Cloudflare R2: skips if already uploaded (incremental resume).
 * 3. Downloads each image.
 * 4. Applies a subtle watermark in the bottom-right corner:
 *    - "medladder.top"
 *    - 35% opacity white with subtle dark stroke for legibility across light/dark medical scans.
 *    - Responsive font sizing, non-intrusive padding.
 * 5. Uploads to Cloudflare R2 bucket with 1-year immutable caching.
 * 6. Logs progress and supports graceful resumption.
 */

const sharp = require('sharp');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const http = require('http');
const https = require('https');

const SUPABASE_BASE = 'https://groeibwykzrliphzzruk.supabase.co';
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) 
  ? process.env.SUPABASE_SERVICE_ROLE_KEY 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb2VpYnd5a3pybGlwaHp6cnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYyNTM1MSwiZXhwIjoyMTA0MjAxMzUxfQ.tyyOb-4oaUcirocXJvUueyh0xnhrEQd-yGn0NdT9rug';
const BUCKET_NAME = 'question-images';

const R2_BUCKET = 'medladder-images';
const R2_ENDPOINT = 'https://854ae1925107f3e63f0df9a168b60203.r2.cloudflarestorage.com';
const R2_ACCESS_KEY = '2e7b97892a73bd8b487fe9f622c7acd9';
const R2_SECRET_KEY = '61cfa182dddbc80dfa194cf0ea64afe11f8c5cf0da59b054fc0d37148879756a';

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY
  }
});

// Direct DNS fallback for Supabase
const SUPABASE_IP = '104.18.38.10';

function fetchSupabase(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_BASE);
    const headers = {
      'Host': url.hostname,
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {})
    };
    if (options.body) {
      headers['Content-Length'] = Buffer.byteLength(options.body);
    }
    const reqOptions = {
      hostname: SUPABASE_IP,
      port: 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers,
      servername: url.hostname // for SNI TLS handshake
    };

    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.toString('utf-8')}`));
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function listFolderObjects(prefix) {
  const allObjects = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const bodyStr = JSON.stringify({ limit, offset, prefix });
    const resBuf = await fetchSupabase(`/storage/v1/object/list/${BUCKET_NAME}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });
    const batch = JSON.parse(resBuf.toString('utf-8'));
    if (!batch || batch.length === 0) break;

    for (const item of batch) {
      if (item.id) { // It's a file
        const fullKey = prefix ? `${prefix}/${item.name}` : item.name;
        allObjects.push({ key: fullKey, name: item.name, size: item.metadata?.size || 0, mimetype: item.metadata?.mimetype || 'image/webp' });
      }
    }

    if (batch.length < limit) break;
    offset += limit;
  }
  return allObjects;
}

async function applyWatermark(inputBuffer, mimetype) {
  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 600;
    const height = metadata.height || 400;

    // Subtle responsive font size: ~2.4% of dimension, min 11px, max 20px
    const fontSize = Math.max(11, Math.min(20, Math.round(Math.max(width, height) * 0.024)));
    const paddingX = Math.round(fontSize * 1.2);
    const paddingY = Math.round(fontSize * 0.9);

    const svg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <style>
          .wm-shadow {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: 700;
            letter-spacing: 0.6px;
            fill: none;
            stroke: rgba(0, 0, 0, 0.45);
            stroke-width: 2px;
          }
          .wm-text {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: 700;
            letter-spacing: 0.6px;
            fill: rgba(255, 255, 255, 0.35);
          }
        </style>
        <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end" class="wm-shadow">medladder.top</text>
        <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end" class="wm-text">medladder.top</text>
      </svg>
    `);

    let pipeline = image.composite([{ input: svg, top: 0, left: 0 }]);

    if (mimetype === 'image/jpeg' || metadata.format === 'jpeg') {
      return await pipeline.jpeg({ quality: 86 }).toBuffer();
    } else if (mimetype === 'image/png' || metadata.format === 'png') {
      return await pipeline.png({ compressionLevel: 8 }).toBuffer();
    } else {
      return await pipeline.webp({ quality: 85 }).toBuffer();
    }
  } catch (err) {
    // If sharp fails for any corrupt header, fallback to original buffer without watermark
    return inputBuffer;
  }
}

async function isAlreadyInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return false;
    return false;
  }
}

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType || 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable'
  }));
}

async function processObject(item) {
  const exists = await isAlreadyInR2(item.key);
  if (exists) {
    return { status: 'skipped', key: item.key };
  }

  // Download from Supabase
  const downloadUrl = `/storage/v1/object/public/${BUCKET_NAME}/${item.key.split('/').map(encodeURIComponent).join('/')}`;
  const rawBuf = await fetchSupabase(downloadUrl);

  // Apply subtle watermark
  const processedBuf = await applyWatermark(rawBuf, item.mimetype);

  // Upload to R2
  await uploadToR2(item.key, processedBuf, item.mimetype);
  return { status: 'uploaded', key: item.key, size: processedBuf.length };
}

async function runWorkerPool(items, concurrency = 12) {
  let index = 0;
  let done = 0;
  let skipped = 0;
  let uploaded = 0;
  let errors = 0;
  const startTime = Date.now();

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];

      try {
        const result = await processObject(item);
        if (result.status === 'skipped') skipped++;
        else uploaded++;
      } catch (err) {
        errors++;
        console.error(`Error on ${item.key}:`, err.message);
      }
      done++;

      if (done % 50 === 0 || done === items.length) {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (uploaded / Math.max(1, (Date.now() - startTime) / 1000)).toFixed(1);
        console.log(`[Progress ${done}/${items.length}] Uploaded: ${uploaded} (${rate}/s), Skipped: ${skipped}, Errors: ${errors}, Elapsed: ${elapsedSec}s`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Sync Finished in ${totalSec}s! Uploaded: ${uploaded}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function main() {
  console.log('--- MedLadder Supabase Storage -> Cloudflare R2 Watermark Sync ---');
  console.log('Collecting object list from Supabase bucket: question-images...');

  const prefixes = ['', 'cleaned', 'migrated-external', 'migrated-data-uri', 'generated'];
  let allItems = [];

  for (const prefix of prefixes) {
    process.stdout.write(`Fetching ${prefix || 'root'}... `);
    const list = await listFolderObjects(prefix);
    console.log(`${list.length} objects found`);
    allItems = allItems.concat(list);
  }

  // Deduplicate by key
  const uniqueItemsMap = new Map();
  for (const item of allItems) uniqueItemsMap.set(item.key, item);
  const uniqueItems = Array.from(uniqueItemsMap.values());

  console.log(`\nTotal unique images to process: ${uniqueItems.length}`);
  console.log(`Target Cloudflare R2 bucket: ${R2_BUCKET}`);
  console.log(`Starting worker pool with 12 concurrent workers...\n`);

  await runWorkerPool(uniqueItems, 12);
}

main().catch(console.error);
