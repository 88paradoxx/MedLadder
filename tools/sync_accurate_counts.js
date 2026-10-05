const fs = require('fs');
const https = require('https');
const vm = require('vm');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

function getCount(id) {
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'groeibwykzrliphzzruk.supabase.co',
      path: '/rest/v1/questions?module_id=eq.' + id + '&is_pyq=eq.false&select=id',
      method: 'HEAD',
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
  console.log('Fetching live counts for all Physiology modules (59-98) and modified cross-subject modules...');
  const physModules = [];
  for (let i = 59; i <= 98; i++) physModules.push(i);
  
  // Also cross-subject modules:
  const crossModules = [103, 119, 129, 134, 180, 185, 201, 226, 228, 256, 260, 447, 463, 464, 467, 470, 576, 585, 594, 607, 631];
  const allTargetMods = [...physModules, ...crossModules];

  const counts = {};
  for (let i = 0; i < allTargetMods.length; i += 8) {
    const batch = allTargetMods.slice(i, i + 8);
    const results = await Promise.all(batch.map(getCount));
    batch.forEach((id, idx) => {
      counts[id] = results[idx];
    });
    process.stdout.write(`Fetched ${Math.min(i + 8, allTargetMods.length)} / ${allTargetMods.length}\r`);
  }
  console.log('\nAll counts fetched.');

  let content = fs.readFileSync('syllabus.js', 'utf8');

  // Update syllabus.js line by line or regex matching id: <id>, name: ..., questionCount: <count>
  for (let id of allTargetMods) {
    const count = counts[id];
    // Regex matches e.g. { id: 59, name: '...', questionCount: \d+
    // or { id: 59, name: "...", questionCount: \d+
    const reg = new RegExp(`(\\{\\s*id:\\s*${id}\\s*,\\s*name:[^,]+,\\s*questionCount:\\s*)\\d+`, 'g');
    content = content.replace(reg, `$1${count}`);
  }

  // Update subject question totals
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(content, sandbox);
  const syllabus = sandbox.window.SYLLABUS_DATA;

  syllabus.forEach(sub => {
    const sum = (sub.modules || []).reduce((acc, m) => acc + (m.questionCount || 0), 0);
    const escapedName = sub.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(name:\\s*['"]${escapedName}['"],\\s*questionCount:\\s*)(\\d+)`, 'g');
    content = content.replace(regex, `$1${sum}`);
  });

  fs.writeFileSync('syllabus.js', content, 'utf8');
  console.log('syllabus.js successfully updated with live counts for all relevant modules and subject totals!');
}

run();
