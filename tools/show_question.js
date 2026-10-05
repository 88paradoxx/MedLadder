const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const qMap = new Map(qs.map(q => [q.id, q]));

const ids = process.argv.slice(2).map(Number);
ids.forEach(id => {
  const q = qMap.get(id);
  if (!q) {
    console.log('ID ' + id + ' not found');
    return;
  }
  console.log('========================================================');
  console.log('ID: ' + q.id + ' | Current Module: ' + q.module_id);
  console.log('Question: ' + q.question_text);
  console.log('A: ' + q.option_a);
  console.log('B: ' + q.option_b);
  console.log('C: ' + q.option_c);
  console.log('D: ' + q.option_d);
  if (q.option_e) console.log('E: ' + q.option_e);
  console.log('Answer: ' + q.answer);
  console.log('Explanation:\n' + (q.explanation || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
});

process.exit(0);
