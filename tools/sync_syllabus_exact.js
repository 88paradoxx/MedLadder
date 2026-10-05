const fs = require('fs');
const https = require('https');
const vm = require('vm');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

async function fetchLiveCounts() {
  console.log('Fetching all live question assignments from Supabase...');
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

async function updateSyllabusFile() {
  const counts = await fetchLiveCounts();

  const rawFile = fs.readFileSync('syllabus.js', 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(rawFile, sandbox);
  const syllabusData = sandbox.window.SYLLABUS_DATA;

  if (!Array.isArray(syllabusData)) {
    throw new Error('Could not parse window.SYLLABUS_DATA as array');
  }

  let totalQuestionsAllSubjects = 0;
  let totalModulesAllSubjects = 0;

  console.log('\n--- Subject Totals Before & After ---');
  syllabusData.forEach(sub => {
    const oldTotal = sub.questionCount;
    let subSum = 0;
    (sub.modules || []).forEach(m => {
      m.questionCount = counts[m.id] || 0;
      subSum += m.questionCount;
      totalModulesAllSubjects++;
    });
    sub.questionCount = subSum;
    totalQuestionsAllSubjects += subSum;
    console.log(`${sub.name.padEnd(25)}: Old = ${String(oldTotal).padStart(5)} -> New = ${String(subSum).padStart(5)} (${subSum - oldTotal >= 0 ? '+' : ''}${subSum - oldTotal})`);
  });

  console.log(`\nGrand Total Questions Across All Subjects: ${totalQuestionsAllSubjects}`);
  console.log(`Grand Total Modules Across All Subjects: ${totalModulesAllSubjects}`);

  // Format as clean window.SYLLABUS_DATA = ...;
  const newContent = 'window.SYLLABUS_DATA = ' + JSON.stringify(syllabusData, null, 2) + ';\n';
  fs.writeFileSync('syllabus.js', newContent, 'utf8');
  console.log('syllabus.js successfully written!');

  // Validate written file
  const verifySandbox = { window: {} };
  vm.createContext(verifySandbox);
  vm.runInContext(fs.readFileSync('syllabus.js', 'utf8'), verifySandbox);
  console.log('Verification: syllabus.js evaluates cleanly in JS environment.');

  process.exit(0);
}

updateSyllabusFile().catch(err => {
  console.error(err);
  process.exit(1);
});
