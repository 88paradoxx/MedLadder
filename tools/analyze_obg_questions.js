const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

console.log('Total questions:', rawQuestions.length);

function inspectModule(modId) {
  const mod = modMap.get(modId);
  const qs = rawQuestions.filter(q => q.module_id === modId);
  console.log(`\n========================================`);
  console.log(`Module ${modId}: ${mod ? mod.moduleName : 'Unknown'} (${qs.length} questions)`);
  console.log(`========================================`);
  qs.forEach((q, idx) => {
    console.log(`${idx + 1}. [ID: ${q.id}] ${q.question_text.replace(/\n/g, ' ').slice(0, 120)}`);
  });
}

const args = process.argv.slice(2);
if (args.length > 0) {
  args.forEach(arg => inspectModule(parseInt(arg)));
} else {
  console.log('Provide module IDs to inspect, e.g. node tools/analyze_obg_questions.js 536 543');
}

process.exit(0);
