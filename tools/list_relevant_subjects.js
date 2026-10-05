const fs = require('fs');
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const relevantSubjects = ['Anaesthesia', 'Ophthalmology', 'Microbiology', 'Pediatrics', 'Orthopaedics', 'Surgery', 'Dermatology'];

relevantSubjects.forEach(s => {
  console.log(`\n=== ${s} ===`);
  mods.filter(m => m.subjectName === s).forEach(m => console.log(`[${m.moduleId}] ${m.moduleName}`));
});
process.exit(0);
