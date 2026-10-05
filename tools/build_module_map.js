const fs = require('fs');
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const map = {};
mods.forEach(m => {
  map[m.moduleId] = `${m.subjectName} -> [${m.moduleId}] ${m.moduleName}`;
});
fs.writeFileSync('tools/module_id_title_map.json', JSON.stringify(map, null, 2));
console.log('Saved tools/module_id_title_map.json with 740 entries');
process.exit(0);
