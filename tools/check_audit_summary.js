const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('tools/audit_deep_ent.json', 'utf8'));
const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const qMap = {};
qs.forEach(q => qMap[q.id] = q);
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

console.log('Subject:', audit.subject);
console.log('Total Questions:', audit.totalQuestions);
console.log('Flagged Count:', audit.flaggedCount);

// Group by fromModule
const fromCounts = {};
audit.moves.forEach(m => {
  fromCounts[m.fromModule] = (fromCounts[m.fromModule] || 0) + 1;
});

console.log('\nMoves by FromModule:');
Object.keys(fromCounts).sort((a,b)=>a-b).forEach(f => {
  console.log(`[${f}] ${modMap[f]?.moduleName}: ${fromCounts[f]} moves`);
});

// Group by toModule
const toCounts = {};
audit.moves.forEach(m => {
  toCounts[m.toModule] = (toCounts[m.toModule] || 0) + 1;
});

console.log('\nMoves by ToModule:');
Object.keys(toCounts).sort((a,b)=>a-b).forEach(t => {
  console.log(`[${t}] ${modMap[t]?.subjectName}: ${modMap[t]?.moduleName}: ${toCounts[t]} incoming`);
});

process.exit(0);
