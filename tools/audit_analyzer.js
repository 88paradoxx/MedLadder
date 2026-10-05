const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

console.log(`Loaded ${questions.length} questions across ${allModules.length} modules.`);

// Let's create an evaluation script that checks each question against all modules.
// We will inspect question text, options, explanation, and current module.
