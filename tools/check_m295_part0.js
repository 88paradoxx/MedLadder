const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const m295 = qs.filter(q => q.module_id === 295);

m295.slice(0, 34).forEach((q, idx) => {
  console.log(`${idx + 1}. [${q.id}] Q: ${clean(q.question_text).substring(0, 90)} | Ans: ${q.answer} | Expl: ${clean(q.explanation).substring(0, 60)}`);
});
process.exit(0);
