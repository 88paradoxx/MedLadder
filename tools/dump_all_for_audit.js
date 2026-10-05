const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

// Let's create an analysis function that looks at each question and suggests the most appropriate module based on clinical rules
function analyzeQuestion(q) {
  const text = (q.question_text || '') + ' ' + (q.option_a || '') + ' ' + (q.option_b || '') + ' ' + (q.option_c || '') + ' ' + (q.option_d || '') + ' ' + (q.explanation || '');
  const lower = text.toLowerCase();
  const qLower = (q.question_text || '').toLowerCase();
  const expLower = (q.explanation || '').toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    currentModuleName: moduleMap[q.module_id]?.moduleName,
    text: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean),
    answer: q.answer,
    explanation: q.explanation
  };
}

const detailed = questions.map(analyzeQuestion);

// Group by currentModule
const byModule = {};
for (let m = 609; m <= 632; m++) {
  byModule[m] = detailed.filter(d => d.currentModule === m);
}

// Write out summaries for review
let summary = '';
for (let m = 609; m <= 632; m++) {
  summary += `\n======================================================\nMODULE ${m}: ${moduleMap[m]?.moduleName} (${byModule[m].length} questions)\n======================================================\n`;
  byModule[m].forEach(q => {
    summary += `[ID: ${q.id}] ${q.text.replace(/\r?\n|\r/g, ' ').substring(0, 120)}\n`;
  });
}

fs.writeFileSync('tools/module_question_list.txt', summary, 'utf8');
console.log('Written tools/module_question_list.txt');
process.exit(0);
