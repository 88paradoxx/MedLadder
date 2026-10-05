const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const idToMod = {};
raw.forEach(q => idToMod[q.id] = q.module_id);

const remaining = JSON.parse(fs.readFileSync('tools/dump_unclassified_remaining.json', 'utf8'));
let out = '';
remaining.forEach((q, idx) => {
  const m = idToMod[q.id];
  out += `[${idx+1}] Mod ${m} (ID ${q.id}): ${q.text.substring(0, 100)} | Ans: ${q.ansText}\n`;
});
fs.writeFileSync('tools/dump_remaining_186.txt', out);
console.log('Written dump_remaining_186.txt');
