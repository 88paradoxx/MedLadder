const fs = require('fs');

const allQuestions = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function fullText(q) {
  return clean(`${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.explanation || ''}`).toLowerCase();
}

// Let's create an inspector that checks every question of a specific module
function inspectModule(modId) {
  const qs = allQuestions.filter(q => q.module_id === modId);
  console.log(`\n======================================================`);
  console.log(`Module ${modId}: ${modMap.get(modId).moduleName} (${qs.length} questions)`);
  console.log(`======================================================`);
  qs.forEach(q => {
    const txt = clean(q.question_text);
    console.log(`ID:${q.id} | Q: ${txt.slice(0, 90)}`);
  });
}

const arg = process.argv[2];
if (arg) {
  inspectModule(parseInt(arg));
}

process.exit(0);
