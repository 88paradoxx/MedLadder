#!/usr/bin/env node
// Build script for service worker — injects version hash into CACHE_NAME
// Usage: npm run build:sw

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SW_PATH = path.join(__dirname, '..', 'sw.js');
const ROOT = path.join(__dirname, '..');

// Files to hash for version (content-addressable cache invalidation)
const FILES_TO_HASH = [
  'index.html',
  'app.js',
  'app.css',
  'syllabus.js',
  'gtag-init.js',
  'manifest.json',
  'optimize_lcp.js',
  'landing.html',
];

function getVersionHash() {
  const hasher = crypto.createHash('sha256');
  
  for (const file of FILES_TO_HASH) {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      hasher.update(content);
    }
  }
  
  // Also include package.json version
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  hasher.update(pkg.version);
  
  return hasher.digest('hex').slice(0, 12);
}

function build() {
  const versionHash = getVersionHash();
  const cacheName = `medladder-${versionHash}`;
  
  let swContent = fs.readFileSync(SW_PATH, 'utf8');
  
  const pattern = /const CACHE_NAME = 'medladder-[^']+';/;
  if (!pattern.test(swContent)) {
    console.error('Could not find CACHE_NAME pattern to replace');
    process.exit(1);
  }
  
  const newContent = swContent.replace(pattern, `const CACHE_NAME = '${cacheName}';`);
  fs.writeFileSync(SW_PATH, newContent);
  console.log(`✅ Service worker updated: ${cacheName}`);
}

build();
