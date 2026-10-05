const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

// Flatten questions
const allQuestions = [];
for (let m = 190; m <= 220; m++) {
  if (questionsByMod[m]) {
    for (const q of questionsByMod[m]) {
      allQuestions.push({ ...q, current_module: m });
    }
  }
}
console.log('Total questions loaded:', allQuestions.length);

// Helper to strip HTML
function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Write a simple analyzer to check where questions belong
// Let's inspect Module 190 first in depth
const m190Questions = allQuestions.filter(q => q.current_module === 190);
console.log('Module 190 count:', m190Questions.length);

// Let's create an initial categorization test
fs.writeFileSync('tools/m190_summary.json', JSON.stringify(m190Questions.map(q => ({
  id: q.id,
  text: clean(q.question_text).slice(0, 120),
  ans: q.answer,
  optA: clean(q.option_a),
  optB: clean(q.option_b),
  optC: clean(q.option_c),
  optD: clean(q.option_d),
  expl: clean(q.explanation).slice(0, 150)
})), null, 2));

console.log('Saved tools/m190_summary.json');
process.exit(0);
