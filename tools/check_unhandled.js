const fs = require('fs');

const audit = JSON.parse(fs.readFileSync('tools/audit_deep_ent.json', 'utf8'));
const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const movedIds = new Set(audit.moves.map(m => m.id));
const unhandled = qs.filter(q => !movedIds.has(q.id));

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Total unhandled questions:', unhandled.length);

const unhandledByMod = {};
unhandled.forEach(q => {
  unhandledByMod[q.module_id] = (unhandledByMod[q.module_id] || 0) + 1;
});

Object.keys(unhandledByMod).sort((a,b)=>a-b).forEach(m => {
  console.log(`[${m}] ${modMap[m]?.moduleName}: ${unhandledByMod[m]} unhandled`);
});

// Let's write out all unhandled questions for review
let out = '';
for (let m = 293; m <= 328; m++) {
  const modUnh = unhandled.filter(q => q.module_id === m);
  if (modUnh.length > 0) {
    out += `================================================================================\n`;
    out += `MODULE ${m}: ${modMap[m]?.moduleName} (${modUnh.length} remaining)\n`;
    out += `================================================================================\n`;
    modUnh.forEach(q => {
      out += `ID ${q.id} | Q: ${clean(q.question_text)} | Ans: ${q.answer}\n`;
    });
    out += '\n';
  }
}

fs.writeFileSync('tools/unhandled_questions.txt', out);
console.log('Saved tools/unhandled_questions.txt');
process.exit(0);
