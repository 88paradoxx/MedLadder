const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(modules.map(m => [m.moduleId, m]));

const modSummary = {};
for (let m = 575; m <= 608; m++) {
  modSummary[m] = {
    id: m,
    name: modMap.get(m).moduleName,
    count: 0,
    sampleQuestions: []
  };
}

questions.forEach(q => {
  if (modSummary[q.module_id]) {
    modSummary[q.module_id].count++;
    if (modSummary[q.module_id].sampleQuestions.length < 3) {
      const cleanText = (q.question_text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      modSummary[q.module_id].sampleQuestions.push({ id: q.id, text: cleanText.substring(0, 90) });
    }
  }
});

for (let m = 575; m <= 608; m++) {
  const item = modSummary[m];
  console.log('[' + item.id + '] ' + item.name + ' (' + item.count + ' questions)');
  item.sampleQuestions.forEach(s => console.log('   - #' + s.id + ': ' + s.text));
}

process.exit(0);
