const fs = require('fs');
const qs = JSON.parse(fs.readFileSync('tools/live_psm_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

const byMod = {};
qs.forEach(q => {
  if (!byMod[q.module_id]) byMod[q.module_id] = [];
  byMod[q.module_id].push(q);
});

console.log('Total questions:', qs.length);
for (let m = 355; m <= 410; m++) {
  const list = byMod[m] || [];
  console.log(`Mod ${m} [${modMap[m] ? modMap[m].moduleName : ''}]: ${list.length} questions`);
}

process.exit(0);
