const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

// Helper to check text matches
function matches(q, regex) {
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  return regex.test(text);
}

function qTextMatches(q, regex) {
  return regex.test(q.question_text || '');
}

console.log(`Analyzing all ${rawQuestions.length} questions...`);

const moves = [];
const seenIds = new Set();

function addMove(id, toMod, reason) {
  if (seenIds.has(id)) {
    return;
  }
  const q = rawQuestions.find(x => x.id === id);
  if (!q) {
    console.error('ID not found:', id);
    return;
  }
  if (q.module_id === toMod) {
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

// Let's print out how many moves we find per module
