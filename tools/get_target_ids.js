const fs = require('fs');
const mods = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const keywords = [
  'waste', 'disaster', 'histogram', 'triage', 'panel discussion', 'prevalence',
  'entonox', 'critical temp', 'airway', 'anaesthetic agent',
  'homocystinuria', 'coloboma', 'lens',
  'parotitis', 'lupus', 'cerebellar',
  'rosette', 'innate immunity', 'immunoglobulin', 'complement', 'schistosoma',
  'hardy', 'epigenetic', 'bartholin'
];

mods.forEach(m => {
  const name = m.moduleName.toLowerCase();
  keywords.forEach(k => {
    if (name.includes(k) || (k === 'histogram' && name.includes('data')) || (k === 'entonox' && name.includes('inhalat')) || (k === 'lupus' && name.includes('connective'))) {
      console.log(`[${m.moduleId}] ${m.subjectName} > ${m.moduleName} (matches: ${k})`);
    }
  });
});
process.exit(0);
