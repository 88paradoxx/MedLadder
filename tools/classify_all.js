const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

// Let's create an explicit dictionary of decisions for questions that need reclassification.
// Every decision will have a clinically sound rationale grounded in medical education curricula (NEET PG / INI-CET / Miller's Anesthesia / Morgan & Mikhail).

const auditDecisions = {};

// We will populate auditDecisions with functions and explicit IDs.
