const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

function cleanText(html) {
  if (!html) return '';
  return html
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

// Let's create an analysis function that takes each question and checks:
// 1. Module topic vs question text, options, explanation
// 2. Clear markers of other subjects or other medicine modules

const questions = rawQuestions.map(q => {
  const text = cleanText(q.question_text);
  const optA = cleanText(q.option_a);
  const optB = cleanText(q.option_b);
  const optC = cleanText(q.option_c);
  const optD = cleanText(q.option_d);
  const optE = cleanText(q.option_e);
  const expl = cleanText(q.explanation);
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

console.log(`Prepared ${questions.length} questions.`);
process.exit(0);
