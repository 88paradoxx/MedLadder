const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const qMap = new Map(qs.map(q => [q.id, q]));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

const moves = [];

function move(id, toMod, reason) {
  const q = qMap.get(id);
  if (!q) {
    console.error('ERROR: Question ID ' + id + ' not found in raw questions!');
    return;
  }
  if (q.module_id === toMod) {
    console.warn('WARN: Question ID ' + id + ' is already in module ' + toMod + '!');
    return;
  }
  if (!modMap.has(toMod)) {
    console.error('ERROR: Target module ' + toMod + ' does not exist in 740 modules!');
    return;
  }
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: toMod,
    reason: reason
  });
}

// Export test runner
console.log('Test harness ready with ' + qs.length + ' questions.');
process.exit(0);
