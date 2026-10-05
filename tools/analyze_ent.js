const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
mods.forEach(m => modMap[m.moduleId] = m);

const counts = {};
for (let m = 293; m <= 328; m++) counts[m] = 0;
qs.forEach(q => counts[q.module_id] = (counts[q.module_id] || 0) + 1);

console.log('Total live ENT questions:', qs.length);
console.log('Module distribution:');
for (let m = 293; m <= 328; m++) {
  console.log(`[${m}] ${modMap[m]?.moduleName}: ${counts[m]}`);
}
process.exit(0);
