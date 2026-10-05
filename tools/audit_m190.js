const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const m190 = questionsByMod['190'] || [];
console.log('Auditing Module 190 questions:', m190.length);

// Let's create an entity detector that analyzes:
// 1. Correct answer text
// 2. Question text
// 3. Explanation text focusing on the correct answer

process.exit(0);
