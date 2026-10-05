const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const start = parseInt(process.argv[2] || '575');
const end = parseInt(process.argv[3] || '580');

for (let m = start; m <= end; m++) {
  const mQs = rawQuestions.filter(q => q.module_id === m);
  console.log(`\n============================================================`);
  console.log(`MODULE ${m}: ${modMap.get(m).moduleName} (${mQs.length} questions)`);
  console.log(`============================================================`);

  mQs.forEach(q => {
    const qText = clean(q.question_text);
    const ans = clean(q['option_' + (q.answer || 'a').toLowerCase()] || '');
    const expl = clean(q.explanation);
    console.log(`[${q.id}] Q: ${qText.slice(0, 95)} | Ans: ${ans.slice(0, 35)}`);
  });
}

process.exit(0);
