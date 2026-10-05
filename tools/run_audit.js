const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

console.log(`Loaded ${questions.length} questions across ${allModules.length} modules.`);

// We will build a detailed evaluator that classifies each question according to its true clinical and educational topic.
