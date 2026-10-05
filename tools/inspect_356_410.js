const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/live_psm_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Let's inspect modules 356 to 410
// Group questions by module
const byMod = {};
qs.forEach(q => {
  if (!byMod[q.module_id]) byMod[q.module_id] = [];
  byMod[q.module_id].push(q);
});

// Let's write a file mod_inspection.txt detailing the questions in each module 356 to 410
let out = '';
for (let m = 356; m <= 410; m++) {
  const list = byMod[m] || [];
  out += `\n======================================================\nMODULE ${m}: ${modMap[m] ? modMap[m].moduleName : ''} (Count: ${list.length})\n======================================================\n`;
  list.forEach(q => {
    out += `[${q.id}] Q: ${clean(q.question_text).slice(0, 120)}\n    Ans: ${q.answer} | Expl: ${clean(q.explanation).slice(0, 120)}\n`;
  });
}

fs.writeFileSync('tools/mod_inspection.txt', out);
console.log('Saved inspection of modules 356-410 to tools/mod_inspection.txt');
process.exit(0);
