const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

console.log('Total questions:', rawQuestions.length);
process.exit(0);
