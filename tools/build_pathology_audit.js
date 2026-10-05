const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

function getCleanText(q) {
  const parts = [
    q.question_text || '',
    q.option_a || '',
    q.option_b || '',
    q.option_c || '',
    q.option_d || '',
    q.option_e || '',
    q.explanation || ''
  ];
  return parts.join(' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&alpha;/g, 'alpha').replace(/&beta;/g, 'beta').replace(/\s+/g, ' ').toLowerCase();
}

console.log('Testing setup...');
