const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function printModuleQuestions(startMod, endMod) {
  const filtered = qs.filter(q => q.module_id >= startMod && q.module_id <= endMod);
  console.log('Count for modules ' + startMod + ' - ' + endMod + ': ' + filtered.length);
  filtered.forEach(q => {
    const qClean = (q.question_text || '').replace(/\s+/g, ' ');
    console.log('[Mod ' + q.module_id + '] ID:' + q.id + ' | ' + qClean.slice(0, 100));
  });
}

const args = process.argv.slice(2);
const start = parseInt(args[0] || '329');
const end = parseInt(args[1] || '332');
printModuleQuestions(start, end);

process.exit(0);
