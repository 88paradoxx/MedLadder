const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

console.log('Loaded ' + questions.length + ' questions and ' + modules.length + ' modules.');
