const fs = require('fs');
const https = require('https');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const flagged = JSON.parse(fs.readFileSync('tools/section5_audit.json', 'utf8'));

function patchQuestion(item) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ module_id: item.targetModId });
    const req = https.request({
      hostname: 'groeibwykzrliphzzruk.supabase.co',
      path: '/rest/v1/questions?id=eq.' + item.id,
      method: 'PATCH',
      agent: false,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.length > 0 && parsed[0].module_id === item.targetModId) {
              resolve({ success: true, id: item.id });
            } else {
              resolve({ success: false, id: item.id, error: 'Module ID mismatch' });
            }
          } catch(e) {
            resolve({ success: false, id: item.id, error: e.message });
          }
        } else {
          resolve({ success: false, id: item.id, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', err => resolve({ success: false, id: item.id, error: err.message }));
    req.write(postData);
    req.end();
  });
}

function verifyQuestion(item) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'groeibwykzrliphzzruk.supabase.co',
      path: '/rest/v1/questions?id=eq.' + item.id + '&select=id,module_id',
      agent: false,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.length > 0 && parsed[0].module_id === item.targetModId) {
            resolve({ verified: true, id: item.id });
          } else {
            resolve({ verified: false, id: item.id, got: parsed[0] ? parsed[0].module_id : null });
          }
        } catch(e) {
          resolve({ verified: false, id: item.id, error: e.message });
        }
      });
    }).on('error', err => resolve({ verified: false, id: item.id, error: err.message }));
  });
}

function getCount(id) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'groeibwykzrliphzzruk.supabase.co',
      path: '/rest/v1/questions?module_id=eq.' + id + '&is_pyq=eq.false&select=id',
      method: 'HEAD',
      agent: false,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'count=exact'
      }
    }, res => {
      const cr = res.headers['content-range'];
      if (cr && cr.includes('/')) {
        resolve(parseInt(cr.split('/')[1]));
      } else {
        resolve(0);
      }
    });
    req.on('error', () => resolve(0));
    req.end();
  });
}

async function run() {
  console.log(`Starting migration of ${flagged.length} questions for Section 5...`);
  
  // 1. PATCH
  let successCount = 0;
  let failCount = 0;
  const concurrency = 6;
  for (let i = 0; i < flagged.length; i += concurrency) {
    const batch = flagged.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(patchQuestion));
    results.forEach(r => {
      if (r.success) successCount++;
      else {
        failCount++;
        console.error('Failed ID ' + r.id);
      }
    });
    process.stdout.write(`PATCH progress: ${Math.min(i + concurrency, flagged.length)} / ${flagged.length}\r`);
  }
  console.log(`\nPATCH complete: ${successCount} succeeded, ${failCount} failed.`);

  // 2. GET verification
  console.log('Independently verifying all records via GET...');
  let verifiedCount = 0;
  let verifyFail = 0;
  for (let i = 0; i < flagged.length; i += 10) {
    const batch = flagged.slice(i, i + 10);
    const results = await Promise.all(batch.map(verifyQuestion));
    results.forEach(r => {
      if (r.verified) verifiedCount++;
      else {
        verifyFail++;
        console.error('Verification failed for ID ' + r.id, r);
      }
    });
  }
  console.log(`Verification complete: ${verifiedCount} / ${flagged.length} verified.`);

  // 3. Update syllabus.js with exact counts
  console.log('Updating syllabus.js live counts...');
  const targetModuleIds = new Set();
  flagged.forEach(f => {
    targetModuleIds.add(f.currentMod);
    targetModuleIds.add(f.targetModId);
  });
  
  const fileContent = fs.readFileSync('syllabus.js', 'utf8');
  const jsonStart = fileContent.indexOf('[');
  const jsonEnd = fileContent.lastIndexOf(']');
  const data = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));

  const targetArr = Array.from(targetModuleIds);
  console.log(`Fetching counts for ${targetArr.length} affected modules...`);
  const counts = {};
  for (let i = 0; i < targetArr.length; i += 8) {
    const batch = targetArr.slice(i, i + 8);
    const results = await Promise.all(batch.map(getCount));
    batch.forEach((id, idx) => {
      counts[id] = results[idx];
    });
  }

  for (let subject of data) {
    let touched = false;
    for (let mod of (subject.modules || [])) {
      if (counts[mod.id] !== undefined) {
        mod.questionCount = counts[mod.id];
        touched = true;
      }
    }
    if (touched) {
      subject.questionCount = subject.modules.reduce((acc, m) => acc + (m.questionCount || 0), 0);
    }
  }

  const prefix = fileContent.substring(0, jsonStart);
  const suffix = fileContent.substring(jsonEnd + 1);
  const newContent = prefix + JSON.stringify(data, null, 2) + suffix;

  fs.writeFileSync('syllabus.js', newContent, 'utf8');
  console.log('syllabus.js synchronized with live database counts!');

  // Report Section 5 counts
  const phys = data.find(s => s.name === 'Physiology');
  console.log('\n--- Section 5 New Live Counts ---');
  [82, 83, 84, 85].forEach(id => {
    const m = phys.modules.find(x => x.id === id);
    console.log(`[${id}] ${m.name}: ${m.questionCount}`);
  });

  process.exit(0);
}

run();
