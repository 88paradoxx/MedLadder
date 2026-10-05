const fs = require('fs');
const { clean, rawQuestions } = require('./surgery_auditor_base');
const { evaluateQuestion } = require('./deep_surgery_auditor');
const { classifyIntraSurgery } = require('./audit_surgery_engine');

const unflagged483 = [];

rawQuestions.forEach(q => {
  if (q.module_id !== 483) return;
  const cross = evaluateQuestion(q);
  if (cross && cross.toModule !== 483) return;
  const intra = classifyIntraSurgery(q);
  if (intra && intra.toModule !== 483) return;
  unflagged483.push(q);
});

console.log(`Unflagged in 483: ${unflagged483.length}`);

// Print first 40 unflagged in 483
unflagged483.slice(0, 40).forEach((q, i) => {
  const t = clean(q.question_text);
  const expl = clean(q.explanation).substring(0, 120);
  console.log(`[${i+1}] ID: ${q.id} | ${t.substring(0, 80)}`);
  console.log(`     Expl: ${expl}`);
});

process.exit(0);
