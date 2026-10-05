const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Sample check across other modules:');

// Check modules with suspicious counts or mixed topics:
[485, 487, 495, 498, 503, 504, 508, 515, 521, 522, 530].forEach(modId => {
  const modQs = rawQuestions.filter(q => q.module_id === modId);
  console.log(`\n=== Module ${modId}: ${modLookup[modId].moduleName} (Total: ${modQs.length}) ===`);
  modQs.slice(0, 5).forEach((q, i) => {
    console.log(`  [${i+1}] ID ${q.id}: ${clean(q.question_text).substring(0, 80)}...`);
  });
});

process.exit(0);
