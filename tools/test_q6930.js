const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
let q6930 = null;
for (const m in questionsByMod) {
  const found = questionsByMod[m].find(q => q.id === 6930);
  if (found) { q6930 = found; q6930.current_module = parseInt(m); break; }
}

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const qText = clean(q6930.question_text);
const optA = clean(q6930.option_a);
const optB = clean(q6930.option_b);
const optC = clean(q6930.option_c);
const optD = clean(q6930.option_d);
const optE = clean(q6930.option_e);
const expl = clean(q6930.explanation);
const ansLetter = (q6930.answer || '').trim().toUpperCase();
let ansText = '';
if (ansLetter === 'A') ansText = optA;
else if (ansLetter === 'B') ansText = optB;
else if (ansLetter === 'C') ansText = optC;
else if (ansLetter === 'D') ansText = optD;
else if (ansLetter === 'E') ansText = optE;

const qObj = {
  id: q6930.id,
  current_module: 190,
  q_text: qText,
  options: { A: optA, B: optB, C: optC, D: optD, E: optE },
  ansLetter,
  ansText,
  expl,
  qa: (qText + ' ' + ansText).toLowerCase(),
  full: (qText + ' ' + optA + ' ' + optB + ' ' + optC + ' ' + optD + ' ' + optE + ' ' + expl).toLowerCase()
};

console.log('qa:', qObj.qa);
console.log('includes listeria:', qObj.qa.includes('listeria'));
