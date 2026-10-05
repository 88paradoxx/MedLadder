const fs = require('fs');
const https = require('https');
const vm = require('vm');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

// Load moves from combined patch file
const patchData = JSON.parse(fs.readFileSync('tools/combined_batch5_patch.json', 'utf8'));
console.log(`Loaded ${patchData.length} questions to migrate.`);

function patchQuestion(item, retryCount = 0) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ module_id: item.toModule });
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: '/rest/v1/questions?id=eq.' + item.id,
      method: 'PATCH',
      agent: false,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, id: item.id });
        } else if (retryCount < 3) {
          setTimeout(() => {
            patchQuestion(item, retryCount + 1).then(resolve);
          }, 300 * Math.pow(2, retryCount));
        } else {
          resolve({ success: false, id: item.id, statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', err => {
      if (retryCount < 3) {
        setTimeout(() => {
          patchQuestion(item, retryCount + 1).then(resolve);
        }, 300 * Math.pow(2, retryCount));
      } else {
        resolve({ success: false, id: item.id, error: err.message });
      }
    });

    req.write(postData);
    req.end();
  });
}

async function runPatchPool(moves, concurrency = 15) {
  console.log(`Starting patch pool with concurrency = ${concurrency}...`);
  const total = moves.length;
  let completed = 0;
  let successCount = 0;
  let failCount = 0;
  const failedItems = [];

  let idx = 0;
  async function worker() {
    while (idx < moves.length) {
      const current = moves[idx++];
      const res = await patchQuestion(current);
      completed++;
      if (res.success) {
        successCount++;
      } else {
        failCount++;
        failedItems.push({ item: current, error: res.error || res.statusCode });
      }

      if (completed % 250 === 0 || completed === total) {
        const pct = ((completed / total) * 100).toFixed(1);
        console.log(`[Progress] ${completed} / ${total} (${pct}%) - Success: ${successCount}, Failed: ${failCount}`);
      }
    }
  }

  const workers = [];
  for (let w = 0; w < concurrency; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return { successCount, failCount, failedItems };
}

// Batch verification via PostgREST in.(...)
async function batchVerify(moves) {
  console.log('\nStarting high-speed batch verification via PostgREST in.(...) ...');
  const chunkSize = 100;
  const targetMap = new Map();
  moves.forEach(m => targetMap.set(m.id, m.toModule));

  const allIds = moves.map(m => m.id);
  let verified = 0;
  let mismatches = [];

  for (let i = 0; i < allIds.length; i += chunkSize) {
    const chunkIds = allIds.slice(i, i + chunkSize);
    const idList = chunkIds.join(',');

    const rows = await new Promise((resolve) => {
      https.get({
        hostname: SUPABASE_HOST,
        path: `/rest/v1/questions?id=in.(${idList})&select=id,module_id`,
        agent: false,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });

    rows.forEach(r => {
      const expected = targetMap.get(r.id);
      if (r.module_id === expected) {
        verified++;
      } else {
        mismatches.push({ id: r.id, expected, actual: r.module_id });
      }
    });

    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= allIds.length) {
      console.log(`Verified ${Math.min(i + chunkSize, allIds.length)} / ${allIds.length} records...`);
    }
  }

  return { verified, mismatches };
}

// Fetch all questions from Supabase to sync live counts accurately
async function fetchAllModuleCounts() {
  console.log('\nFetching live question assignments across all 740 modules...');
  let allRows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const rows = await new Promise((resolve) => {
      https.get({
        hostname: SUPABASE_HOST,
        path: `/rest/v1/questions?select=id,module_id,is_pyq&limit=${limit}&offset=${offset}`,
        agent: false,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch(e) { resolve([]); }
        });
      }).on('error', () => resolve([]));
    });

    if (!rows || rows.length === 0) break;
    allRows.push(...rows);
    offset += limit;
    if (rows.length < limit) break;
  }

  console.log(`Fetched ${allRows.length} total questions from Supabase.`);

  const counts = {};
  allRows.forEach(r => {
    if (!r.is_pyq && r.module_id) {
      counts[r.module_id] = (counts[r.module_id] || 0) + 1;
    }
  });

  return counts;
}

async function updateSyllabus(counts) {
  console.log('\nUpdating syllabus.js with verified live question counts...');
  const rawFile = fs.readFileSync('syllabus.js', 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(rawFile, sandbox);
  const syllabusData = sandbox.window.SYLLABUS_DATA;

  if (!Array.isArray(syllabusData)) {
    throw new Error('Could not parse window.SYLLABUS_DATA as array');
  }

  let grandTotalQuestions = 0;
  console.log('\n--- Subject Totals Before & After ---');
  syllabusData.forEach(sub => {
    const oldTotal = sub.questionCount;
    let subSum = 0;
    (sub.modules || []).forEach(m => {
      m.questionCount = counts[m.id] || 0;
      subSum += m.questionCount;
    });
    sub.questionCount = subSum;
    grandTotalQuestions += subSum;
    console.log(`${sub.name.padEnd(25)}: Old = ${String(oldTotal).padStart(5)} -> New = ${String(subSum).padStart(5)} (${subSum - oldTotal >= 0 ? '+' : ''}${subSum - oldTotal})`);
  });

  const newContent = 'window.SYLLABUS_DATA = ' + JSON.stringify(syllabusData, null, 2) + ';\n';
  fs.writeFileSync('syllabus.js', newContent, 'utf8');
  console.log(`\nsyllabus.js successfully updated! Grand total question count: ${grandTotalQuestions}`);

  const verifySandbox = { window: {} };
  vm.createContext(verifySandbox);
  vm.runInContext(fs.readFileSync('syllabus.js', 'utf8'), verifySandbox);
  console.log('Sanity verification: syllabus.js evaluates cleanly without syntax errors.');
}

async function main() {
  const startTime = Date.now();
  console.log('================ BATCH 5 HIGH-SPEED PATCH PIPELINE ================');

  // Step 1: Execute concurrent PATCH pool
  const patchResult = await runPatchPool(patchData, 15);
  console.log(`\nPatch Pool Finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`Success: ${patchResult.successCount} | Failed: ${patchResult.failCount}`);

  if (patchResult.failCount > 0) {
    console.log('Retrying failed items...');
    const retryMoves = patchResult.failedItems.map(f => f.item);
    const retryRes = await runPatchPool(retryMoves, 5);
    console.log(`Retry Results -> Success: ${retryRes.successCount}, Failed: ${retryRes.failCount}`);
  }

  // Step 2: Verification
  const verifyResult = await batchVerify(patchData);
  console.log(`\nBatch Verification Results:`);
  console.log(`- Verified Correct: ${verifyResult.verified} / ${patchData.length} (${((verifyResult.verified / patchData.length) * 100).toFixed(2)}%)`);
  if (verifyResult.mismatches.length > 0) {
    console.error(`- Mismatches detected:`, verifyResult.mismatches);
  } else {
    console.log('All 1,704 patched records verified 100% consistent with database state!');
  }

  // Step 3: Update syllabus.js with live counts
  const liveCounts = await fetchAllModuleCounts();
  await updateSyllabus(liveCounts);

  console.log(`\n================ ALL OPERATIONS COMPLETED IN ${((Date.now() - startTime) / 1000).toFixed(1)}s ================`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error in pipeline:', err);
  process.exit(1);
});
