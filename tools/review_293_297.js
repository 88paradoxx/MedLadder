const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

for (let m = 293; m <= 297; m++) {
  const mQs = qs.filter(q => q.module_id === m);
  console.log(`\n================ MODULE ${m} (${mQs.length}) ================`);
  mQs.forEach(q => {
    console.log(`ID: ${q.id} | Q: ${clean(q.question_text)} | Ans: ${q.answer} | Expl: ${clean(q.explanation).substring(0, 100)}`);
  });
}
process.exit(0);
