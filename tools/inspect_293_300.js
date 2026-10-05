const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

for (let m = 293; m <= 300; m++) {
  const modQs = qs.filter(q => q.module_id === m);
  console.log(`\n================ MODULE ${m}: ${modMap[m]?.moduleName} (${modQs.length}) ================`);
  modQs.forEach(q => {
    console.log(`[${q.id}] Q: ${clean(q.question_text).substring(0, 90)} | Ans: ${q.answer} | Expl: ${clean(q.explanation).substring(0, 90)}`);
  });
}
process.exit(0);
