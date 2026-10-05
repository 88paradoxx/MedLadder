const fs = require('fs');

const moves = JSON.parse(fs.readFileSync('tools/draft_moves.json', 'utf8'));
const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const qMap = {};
qs.forEach(q => qMap[q.id] = q);
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log(`Total draft moves: ${moves.length}`);

// Group by fromModule
const byFrom = {};
moves.forEach(m => {
  if (!byFrom[m.fromModule]) byFrom[m.fromModule] = [];
  byFrom[m.fromModule].push(m);
});

for (const fromMod of Object.keys(byFrom).sort((a,b)=>a-b)) {
  console.log(`\nFrom Module [${fromMod}] ${modMap[fromMod]?.moduleName}: ${byFrom[fromMod].length} moves`);
  // Show up to 3 samples
  byFrom[fromMod].slice(0, 3).forEach(m => {
    const q = qMap[m.id];
    console.log(`  -> To [${m.toModule}] ${modMap[m.toModule]?.moduleName} | ID: ${m.id} | Q: ${clean(q.question_text).substring(0, 70)}`);
  });
}
process.exit(0);
