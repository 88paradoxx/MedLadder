const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
mods.forEach(m => modLookup[m.moduleId] = m);

const counts = {};
qs.forEach(q => counts[q.module_id] = (counts[q.module_id] || 0) + 1);

console.log('Module ID | Count | Module Name');
console.log('---------------------------------------------');
for (let id = 480; id <= 530; id++) {
  console.log(`${id} | ${String(counts[id] || 0).padStart(5)} | ${modLookup[id].moduleName}`);
}

process.exit(0);
