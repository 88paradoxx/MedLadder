const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const m483 = rawQuestions.filter(q => q.module_id === 483);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Inspecting first 30 questions of module 483:');
m483.slice(0, 30).forEach((q, i) => {
  const t = clean(q.question_text);
  const a = q.answer;
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const expl = clean(q.explanation).substring(0, 100);
  console.log(`[${i+1}] ID: ${q.id} | ${t.substring(0, 75)}...`);
  console.log(`    Ans: ${a} | Expl: ${expl}...`);
});
process.exit(0);
