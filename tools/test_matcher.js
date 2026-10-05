const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

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
        options: { A: optA, B: optB, C: optC, D: optD, E: optE },
        ansLetter,
        ansText,
        expl,
        q_plus_ans: `${qText} ${ansText}`.toLowerCase(),
        full: `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase()
      });
    }
  }
}

console.log('Total questions loaded:', allQuestions.length);

function hasWord(text, word) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(text);
}

function hasPhrase(text, phrase) {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

// Let's test the helper
console.log('Test organism has word nis:', hasWord('Identify the organism', 'nis'));
console.log('Test NIS schedule has word nis:', hasWord('According to NIS schedule', 'nis'));

process.exit(0);
