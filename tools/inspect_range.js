const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

// Module 126 to 135 inspect
function inspectModRange(from, to) {
  for (let m = from; m <= to; m++) {
    const qs = questions.filter(q => q.module_id === m);
    console.log(`\n======================================================`);
    console.log(`MODULE ${m}: ${modMap.get(m)?.moduleName} (Total: ${qs.length})`);
    console.log(`======================================================`);
    qs.forEach((q, idx) => {
      const qText = q.question_text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const expl = (q.explanation || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`[${idx + 1}] ID ${q.id} | Q: ${qText.slice(0, 120)}`);
      console.log(`    Ans: ${q.answer} | Expl: ${expl.slice(0, 140)}...`);
    });
  }
}

inspectModRange(parseInt(process.argv[2] || '126'), parseInt(process.argv[3] || '128'));
