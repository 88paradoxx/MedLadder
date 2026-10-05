const fs = require('fs');
const { auditQuestion, clean } = require('./build_deep_medicine_audit');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const unflaggedByMod = {};
const unflaggedQs = [];

rawQuestions.forEach(rawQ => {
  const text = clean(rawQ.question_text);
  const optA = clean(rawQ.option_a);
  const optB = clean(rawQ.option_b);
  const optC = clean(rawQ.option_c);
  const optD = clean(rawQ.option_d);
  const optE = clean(rawQ.option_e);
  const expl = clean(rawQ.explanation);
  const ansLetter = (rawQ.answer || '').trim().toUpperCase();
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;
  else if (ansLetter === 'E') ansText = optE;

  const full = `${text} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${text} ${ansText}`.toLowerCase();

  const q = {
    id: rawQ.id,
    currentModule: rawQ.module_id,
    text,
    options: { A: optA, B: optB, C: optC, D: optD, E: optE },
    ansLetter,
    ansText,
    expl,
    full,
    qa
  };

  const res = auditQuestion(q);
  if (!res || res.toModule === q.currentModule) {
    unflaggedByMod[q.currentModule] = (unflaggedByMod[q.currentModule] || 0) + 1;
    unflaggedQs.push(q);
  }
});

console.log('Unflagged counts in dumped modules:');
[411, 419, 432, 433, 434, 479].forEach(m => {
  console.log(`Mod ${m}: ${unflaggedByMod[m] || 0} questions unflagged`);
});

// Let's sample unflagged questions in 433
console.log('\n--- Sample unflagged in 433 (first 10) ---');
unflaggedQs.filter(q => q.currentModule === 433).slice(0, 10).forEach(q => {
  console.log(`[${q.id}] ${q.text.slice(0, 80)}`);
});

// Let's sample unflagged questions in 432
console.log('\n--- Sample unflagged in 432 (first 10) ---');
unflaggedQs.filter(q => q.currentModule === 432).slice(0, 10).forEach(q => {
  console.log(`[${q.id}] ${q.text.slice(0, 80)}`);
});

// Let's sample unflagged questions in 411
console.log('\n--- Sample unflagged in 411 (first 10) ---');
unflaggedQs.filter(q => q.currentModule === 411).slice(0, 10).forEach(q => {
  console.log(`[${q.id}] ${q.text.slice(0, 80)}`);
});

process.exit(0);
