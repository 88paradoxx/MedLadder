const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => {
  modMap[m.moduleId] = m;
});

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));

console.log(`Loaded ${questions.length} questions.`);

// Let's create helper to strip HTML
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Check questions module by module
const flagged = [];

questions.forEach(q => {
  const text = (q.question_text || '') + ' ' + (q.option_a || '') + ' ' + (q.option_b || '') + ' ' + (q.option_c || '') + ' ' + (q.option_d || '') + ' ' + stripHtml(q.explanation || '');
  const lower = text.toLowerCase();
  const currentMod = q.module_id;

  // Let's inspect potential mismatches
});

console.log('Script template ready');
process.exit(0);
