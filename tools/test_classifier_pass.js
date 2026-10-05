const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const questions = rawQuestions.map(q => {
  const text = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const optE = clean(q.option_e);
  const expl = clean(q.explanation);
  const ansLetter = (q.answer || '').trim().toUpperCase();
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;
  else if (ansLetter === 'E') ansText = optE;

  const full = `${text} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${text} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    text,
    options: { A: optA, B: optB, C: optC, D: optD, E: optE },
    ansLetter,
    ansText,
    expl,
    full,
    qa
  };
});

console.log(`Processing ${questions.length} questions...`);
process.exit(0);
