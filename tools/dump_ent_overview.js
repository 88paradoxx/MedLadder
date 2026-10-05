const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Write out question summaries per module into text files or inspect them
let output = '';
for (let m = 293; m <= 328; m++) {
  const modQs = qs.filter(q => q.module_id === m);
  output += `================================================================================\n`;
  output += `MODULE ${m}: ${modMap[m]?.moduleName} (${modQs.length} questions)\n`;
  output += `================================================================================\n`;
  modQs.forEach(q => {
    output += `ID ${q.id} | Q: ${clean(q.question_text).substring(0, 110)} | Ans: ${q.answer}\n`;
  });
  output += '\n';
}

fs.writeFileSync('tools/ent_questions_overview.txt', output);
console.log('Saved tools/ent_questions_overview.txt, size:', output.length);
process.exit(0);
