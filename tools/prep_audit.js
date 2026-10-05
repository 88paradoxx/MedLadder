const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log(`Loaded ${qs.length} questions.`);

// Let's inspect all 1217 questions and classify them using comprehensive clinical criteria
const questions = qs.map(q => {
  const qText = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const expl = clean(q.explanation);
  const fullText = `${qText} ${optA} ${optB} ${optC} ${optD} ${expl}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    currentModuleName: modMap[q.module_id]?.moduleName,
    qText,
    ans: q.answer,
    expl,
    fullText
  };
});

fs.writeFileSync('tools/questions_cleaned.json', JSON.stringify(questions, null, 2));
console.log('Saved tools/questions_cleaned.json');
process.exit(0);
