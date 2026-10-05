const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

// Let's inspect the questions module by module
const byMod = {};
rawQuestions.forEach(q => {
  if (!byMod[q.module_id]) byMod[q.module_id] = [];
  byMod[q.module_id].push(q);
});

console.log('Modules present:', Object.keys(byMod).length);

// Let's print out the first 3 questions of each module and see if they match the module topic
for (let m = 411; m <= 479; m++) {
  const qs = byMod[m] || [];
  const modInfo = modMap[m];
  console.log(`\n=== [${m}] ${modInfo ? modInfo.moduleName : 'Unknown'} (${qs.length} qs) ===`);
  qs.slice(0, 2).forEach(q => {
    console.log(`  - ID ${q.id}: ${clean(q.question_text).slice(0, 90)}`);
  });
}

process.exit(0);
