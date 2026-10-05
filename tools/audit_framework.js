const fs = require('fs');

// Load questions and modules
const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Flatten all questions
const allQuestions = [];
for (let m = 190; m <= 220; m++) {
  if (questionsByMod[m]) {
    for (const q of questionsByMod[m]) {
      const qText = clean(q.question_text);
      const optA = clean(q.option_a);
      const optB = clean(q.option_b);
      const optC = clean(q.option_c);
      const optD = clean(q.option_d);
      const optE = clean(q.option_e);
      const expl = clean(q.explanation);
      const ansLetter = (q.answer || '').trim().toUpperCase();
      let ansText = '';
      if (ansLetter === 'A') ansText = optA;
      else if (ansLetter === 'B') ansText = optB;
      else if (ansLetter === 'C') ansText = optC;
      else if (ansLetter === 'D') ansText = optD;
      else if (ansLetter === 'E') ansText = optE;

      allQuestions.push({
        id: q.id,
        current_module: m,
        q_text: qText,
        options: [optA, optB, optC, optD, optE].filter(Boolean).join(' | '),
        ansLetter,
        ansText,
        expl,
        fullText: `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase()
      });
    }
  }
}

console.log('Total questions loaded for audit:', allQuestions.length);

// Let's write an inspection script to check how many questions match each criteria
// and generate proposed moves.

process.exit(0);
