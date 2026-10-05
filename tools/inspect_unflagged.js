const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const auditData = JSON.parse(fs.readFileSync('tools/audit_deep_pediatrics.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

const flaggedSet = new Set(auditData.moves.map(m => m.id));
const unflagged = rawQuestions.filter(q => !flaggedSet.has(q.id));

console.log(`Total questions: ${rawQuestions.length}`);
console.log(`Flagged: ${flaggedSet.size}`);
console.log(`Unflagged: ${unflagged.length}`);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

let dump = '';
for (let m = 575; m <= 608; m++) {
  const mUnflagged = unflagged.filter(q => q.module_id === m);
  dump += `\n============================================================\n`;
  dump += `MODULE ${m}: ${modMap.get(m).moduleName} (${mUnflagged.length} unflagged)\n`;
  dump += `============================================================\n`;

  mUnflagged.forEach(q => {
    const qText = clean(q.question_text);
    const ans = clean(q['option_' + (q.answer || 'a').toLowerCase()] || '');
    dump += `[${q.id}] Q: ${qText.slice(0, 95)} | Ans: ${ans.slice(0, 35)}\n`;
  });
}

fs.writeFileSync('tools/unflagged_review.txt', dump, 'utf8');
console.log('Saved unflagged questions to tools/unflagged_review.txt');

process.exit(0);
