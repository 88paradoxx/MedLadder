const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

// Let's create an exhaustive mapping ruleset.
// Each question will be checked by ID and by content.

// We will inspect question by question.
const moves = [];

// Helper to add a move
function addMove(id, toModule, reason) {
  const q = questions.find(item => item.id === id);
  if (!q) {
    console.error(`Question ${id} not found!`);
    return;
  }
  if (q.module_id === toModule) {
    // Already in correct module
    return;
  }
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: toModule,
    reason: reason
  });
}

console.log('Script template ready.');
