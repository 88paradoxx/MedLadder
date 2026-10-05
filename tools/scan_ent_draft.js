const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log(`Loaded ${qs.length} ENT questions.`);

// Check for questions in each module and search for obvious topic discrepancies
const candidateMoves = [];

qs.forEach(q => {
  const fullText = (clean(q.question_text) + ' ' + clean(q.option_a) + ' ' + clean(q.option_b) + ' ' + clean(q.option_c) + ' ' + clean(q.option_d) + ' ' + clean(q.explanation)).toLowerCase();
  const qText = clean(q.question_text);
  const mId = q.module_id;

  // Let's check some clear patterns
});
