const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Build question objects
const questions = [];
for (let m = 190; m <= 220; m++) {
  if (questionsByMod[m]) {
    for (const q of questionsByMod[m]) {
      questions.push({
        id: q.id,
        current_module: m,
        q_text: clean(q.question_text),
        opt_a: clean(q.option_a),
        opt_b: clean(q.option_b),
        opt_c: clean(q.option_c),
        opt_d: clean(q.option_d),
        ans: q.answer,
        expl: clean(q.explanation),
        raw: q
      });
    }
  }
}

console.log('Total questions to audit:', questions.length);

// Let's write an initial classifier and inspect questions module by module
fs.writeFileSync('tools/audit_progress.txt', `Auditing ${questions.length} questions\n`);

process.exit(0);
