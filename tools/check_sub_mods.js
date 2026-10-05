const fs = require('fs');
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const groups = {};
mods.forEach(m => {
  if (!groups[m.subjectName]) groups[m.subjectName] = [];
  groups[m.subjectName].push(`${m.moduleId}: ${m.moduleName}`);
});

for (const [sub, list] of Object.entries(groups)) {
  console.log(`=== ${sub} (${list.length}) ===`);
  console.log(list.slice(0, 5).join(' | ') + (list.length > 5 ? ' ...' : ''));
}
process.exit(0);
