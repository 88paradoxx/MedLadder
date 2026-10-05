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

console.log(`Loaded ${rawQuestions.length} questions and ${allModules.length} modules.`);

// We will construct the master audit classifier
