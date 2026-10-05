const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('Testing prototype keyword profiler...');
process.exit(0);
