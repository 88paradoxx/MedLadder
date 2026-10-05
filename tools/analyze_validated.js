const fs = require('fs');

const moves = JSON.parse(fs.readFileSync('tools/validated_moves.json', 'utf8'));
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

console.log(`Total validated moves: ${moves.length}`);

const crossSubject = [];
const intraEnt = [];

moves.forEach(m => {
  const targetSub = modMap[m.toModule]?.subjectName;
  if (targetSub !== 'ENT') {
    crossSubject.push(m);
  } else {
    intraEnt.push(m);
  }
});

console.log(`Cross-subject moves: ${crossSubject.length}`);
console.log(`Intra-ENT moves: ${intraEnt.length}`);

console.log('\n--- Cross-Subject Moves Breakdown ---');
const crossBySub = {};
crossSubject.forEach(m => {
  const sub = modMap[m.toModule]?.subjectName;
  crossBySub[sub] = (crossBySub[sub] || 0) + 1;
});
console.log(crossBySub);

console.log('\nSample Cross-Subject moves:');
crossSubject.forEach(m => {
  const q = qMap[m.id];
  console.log(`ID ${m.id} | From [${m.fromModule}] ${modMap[m.fromModule]?.moduleName} -> To [${m.toModule}] ${modMap[m.toModule]?.subjectName}: ${modMap[m.toModule]?.moduleName} | Q: ${clean(q.question_text).substring(0, 75)}`);
});
process.exit(0);
