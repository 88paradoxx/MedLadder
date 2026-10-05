const fs = require('fs');

const moves = JSON.parse(fs.readFileSync('tools/verified_deep_moves.json', 'utf8'));
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

console.log(`Total flagged moves: ${moves.length}`);

// Group by fromModule and toModule pairs
const pairCounts = {};
moves.forEach(m => {
  const key = `${m.fromModule}->${m.toModule}`;
  if (!pairCounts[key]) pairCounts[key] = [];
  pairCounts[key].push(m);
});

const sortedPairs = Object.keys(pairCounts).sort((a,b) => pairCounts[b].length - pairCounts[a].length);

for (const pair of sortedPairs) {
  const [from, to] = pair.split('->');
  console.log(`\n[${from}] ${modMap[from]?.moduleName} --> [${to}] ${modMap[to]?.moduleName} (${pairCounts[pair].length} moves)`);
  pairCounts[pair].slice(0, 2).forEach(m => {
    const q = qMap[m.id];
    console.log(`   ID ${m.id} | Q: ${clean(q.question_text).substring(0, 85)}`);
  });
}
process.exit(0);
