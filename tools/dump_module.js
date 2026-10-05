const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

// Let's create an inspection function that prints questions with options and explanation if needed
function dumpModuleSummary(startMod, endMod) {
  for (let m = startMod; m <= endMod; m++) {
    const mod = modMap.get(m);
    const qs = rawQuestions.filter(q => q.module_id === m);
    console.log(`\n======================================================`);
    console.log(`Module ${m}: ${mod ? mod.moduleName : 'Unknown'} (${qs.length} questions)`);
    console.log(`======================================================`);
    qs.forEach((q, idx) => {
      console.log(`[#${idx + 1}] ID ${q.id}: ${q.question_text.replace(/\s+/g, ' ').slice(0, 100)}`);
      if (q.explanation) {
        console.log(`     Exp: ${q.explanation.replace(/\s+/g, ' ').slice(0, 100)}`);
      }
    });
  }
}

const start = parseInt(process.argv[2]) || 531;
const end = parseInt(process.argv[3]) || start;
dumpModuleSummary(start, end);
process.exit(0);
