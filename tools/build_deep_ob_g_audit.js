const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));
const qMap = new Map(rawQuestions.map(q => [q.id, q]));

console.log(`Analyzing ${rawQuestions.length} questions...`);

// Let's create an exhaustive mapping script
