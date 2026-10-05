const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Total questions:', rawQuestions.length);

// Let us inspect the distribution and check for obvious module mismatch keywords
const questions = rawQuestions.map(q => {
  const qText = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const optE = clean(q.option_e || '');
  const expl = clean(q.explanation);
  const ansLetter = (q.answer || '').trim().toUpperCase();
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;
  else if (ansLetter === 'E') ansText = optE;

  const full = `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${qText} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    qText,
    ansText,
    expl,
    qa,
    full
  };
});

// Let us check module by module
const moduleList = [];
for (let m = 575; m <= 608; m++) {
  moduleList.push(m);
}

moduleList.forEach(m => {
  const mQs = questions.filter(q => q.currentModule === m);
  console.log(`\n=== Module ${m}: ${modMap.get(m).moduleName} (${mQs.length} questions) ===`);
  // Print first 5 questions titles/answers
  mQs.slice(0, 5).forEach(q => {
    console.log(`  [ID ${q.id}] ${q.qText.slice(0, 80)} -> Ans: ${q.ansText.slice(0, 30)}`);
  });
});

process.exit(0);
