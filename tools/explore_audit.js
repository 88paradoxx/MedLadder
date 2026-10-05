const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/live_psm_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Total questions:', qs.length);

// Let's inspect module 355 first. What are the questions in module 355?
const mod355 = qs.filter(q => q.module_id === 355);
console.log('Mod 355 total:', mod355.length);

// Let's write out a text file with ID, Question text, and Answer for all mod 355 questions to inspect them
let out355 = '';
mod355.forEach(q => {
  out355 += `ID: ${q.id} | Answer: ${q.answer}\nQ: ${clean(q.question_text)}\nOptions: A: ${clean(q.option_a)} | B: ${clean(q.option_b)} | C: ${clean(q.option_c)} | D: ${clean(q.option_d)}\nExpl: ${clean(q.explanation).slice(0, 200)}\n----------------------------------------\n`;
});
fs.writeFileSync('tools/mod355_dump.txt', out355);
console.log('Dumped mod 355 questions to tools/mod355_dump.txt');

process.exit(0);
