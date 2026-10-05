const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('--- ALL QUESTIONS IN MODULE 294 (Anatomy of External Ear) ---');
qs.filter(q => q.module_id === 294).forEach(q => {
  console.log(`[${q.id}] Q: ${clean(q.question_text).substring(0, 95)} | Ans: ${q.answer} | Expl: ${clean(q.explanation).substring(0, 75)}`);
});
process.exit(0);
