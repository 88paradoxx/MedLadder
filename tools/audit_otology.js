const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('=== AUDITING MODULES 293-308 (OTOLOGY) ===');

const otologyMods = [293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308];

otologyMods.forEach(m => {
  const modQs = qs.filter(q => q.module_id === m);
  console.log(`\n------------------------------------------------------------`);
  console.log(`MODULE ${m}: ${modMap[m]?.moduleName} (${modQs.length} questions)`);
  console.log(`------------------------------------------------------------`);
  modQs.forEach(q => {
    const qText = clean(q.question_text);
    const expl = clean(q.explanation);
    console.log(`[${q.id}] Q: ${qText.substring(0, 90)} | Ans: ${q.answer}`);
  });
});
process.exit(0);
