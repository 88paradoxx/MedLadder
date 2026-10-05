const fs = require('fs');

const rep = JSON.parse(fs.readFileSync('tools/ophthalmology_audit_report.json', 'utf8'));
console.log('Count:', rep.length);
rep.forEach((r, idx) => {
  const fromName = r.from_module ? r.from_module.split('>')[1] || r.from_module : r.old_module_id;
  const toName = r.to_module ? r.to_module.split('>')[1] || r.to_module : r.new_module_id;
  console.log((idx + 1) + '. ID:' + r.id + ' [' + r.old_module_id + ' -> ' + r.new_module_id + '] (' + fromName.trim() + ' -> ' + toName.trim() + ') Q: ' + r.question.slice(0, 60));
});

process.exit(0);
