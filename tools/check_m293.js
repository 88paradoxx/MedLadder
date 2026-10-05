const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('--- ALL QUESTIONS IN MODULE 293 ---');
qs.filter(q => q.module_id === 293).forEach((q, idx) => {
  console.log(`${idx + 1}. [${q.id}] Q: ${clean(q.question_text)} | Ans: ${q.answer} | Expl: ${clean(q.explanation).substring(0, 80)}`);
});
process.exit(0);
