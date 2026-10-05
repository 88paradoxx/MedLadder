const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

console.log(`Total questions loaded: ${rawQuestions.length}`);

// Let's examine Module 483 in depth
const m483 = rawQuestions.filter(q => q.module_id === 483);
console.log(`Module 483 count: ${m483.length}`);

// Sample of questions in 483
fs.writeFileSync('tools/m483_dump.json', JSON.stringify(m483.map(q => ({
  id: q.id,
  text: clean(q.question_text),
  ans: q.answer,
  optA: clean(q.option_a),
  optB: clean(q.option_b),
  optC: clean(q.option_c),
  optD: clean(q.option_d),
  expl: clean(q.explanation).substring(0, 200)
})), null, 2));

console.log('Saved tools/m483_dump.json');
process.exit(0);
