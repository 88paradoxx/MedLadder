const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));
const qMap = new Map(rawQuestions.map(q => [q.id, q]));

const moves = [];
const seenIds = new Set();

function recordMove(id, toMod, reason) {
  if (seenIds.has(id)) {
    console.error('DUPLICATE MOVE FOR ID:', id);
    return;
  }
  const q = qMap.get(id);
  if (!q) {
    console.error('ERROR: Question ID ' + id + ' not found in raw questions!');
    return;
  }
  if (q.module_id === toMod) {
    // Already in correct module, do nothing
    return;
  }
  if (!modMap.has(toMod)) {
    console.error('ERROR: Target module ' + toMod + ' does not exist in 740 modules!');
    return;
  }
  seenIds.add(id);
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: toMod,
    reason: reason
  });
}

// Let's create an exhaustive mapping of every question that belongs to another module

console.log('Script initialized.');
