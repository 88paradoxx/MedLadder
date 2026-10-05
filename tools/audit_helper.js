const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

function printModule(modId, start = 0, count = 100) {
  const modInfo = modMap.get(modId);
  console.log('=== MODULE ' + modId + ': ' + (modInfo ? modInfo.moduleName : 'Unknown') + ' (' + (modInfo ? modInfo.subjectName : '') + ') ===');
  const list = questions.filter(q => q.module_id === modId);
  console.log('Total in module: ' + list.length + ' (showing ' + start + ' to ' + (start + count) + ')');
  list.slice(start, start + count).forEach((q, idx) => {
    console.log('\n--- [' + (start + idx + 1) + '/' + list.length + '] ID: ' + q.id + ' ---');
    console.log('Q: ' + q.question_text);
    console.log('Options: A: ' + q.option_a + ' | B: ' + q.option_b + ' | C: ' + q.option_c + ' | D: ' + q.option_d);
    console.log('Ans: ' + q.answer);
    console.log('Expl: ' + (q.explanation || '').slice(0, 250).replace(/\n/g, ' ') + '...');
  });
}

const targetMod = parseInt(process.argv[2], 10);
const start = parseInt(process.argv[3] || '0', 10);
const count = parseInt(process.argv[4] || '100', 10);

if (targetMod) {
  printModule(targetMod, start, count);
} else {
  console.log('Provide module id: node tools/audit_helper.js <moduleId> [start] [count]');
}
