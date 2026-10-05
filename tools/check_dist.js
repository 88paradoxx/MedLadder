const fs = require('fs');

const allQuestions = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

// Helper to clean HTML text
function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Loaded ' + allQuestions.length + ' questions.');
console.log('Loaded ' + allModules.length + ' modules.');

// Let us inspect the distribution by module
const byMod = {};
for (let m = 329; m <= 354; m++) byMod[m] = [];
allQuestions.forEach(q => {
  if (byMod[q.module_id]) byMod[q.module_id].push(q);
});

for (let m = 329; m <= 354; m++) {
  console.log('Mod ' + m + ' (' + modMap.get(m).moduleName + '): ' + byMod[m].length + ' questions');
}

process.exit(0);
