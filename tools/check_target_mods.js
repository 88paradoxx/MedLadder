const fs = require('fs');
const { audit, clean } = require('./full_medicine_auditor');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));

const questions = rawQuestions.map(q => {
  const text = clean(q.question_text);
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

  const full = `${text} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${text} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    text,
    options: { A: optA, B: optB, C: optC, D: optD, E: optE },
    ansLetter,
    ansText,
    expl,
    full,
    qa
  };
});

const baseMoves = [];
questions.forEach(q => {
  const result = audit(q);
  if (result && result.toModule !== q.currentModule) {
    baseMoves.push({
      id: q.id,
      fromModule: q.currentModule,
      toModule: result.toModule,
      reason: result.reason
    });
  }
});

const dumpMoves1 = JSON.parse(fs.readFileSync('tools/dump_categorized_moves.json', 'utf8'));
const dumpMoves2 = JSON.parse(fs.readFileSync('tools/dump_remaining_classified.json', 'utf8'));

const combinedMap = new Map();
baseMoves.forEach(m => combinedMap.set(m.id, m));
dumpMoves1.forEach(m => combinedMap.set(m.id, m));
dumpMoves2.forEach(m => combinedMap.set(m.id, m));

console.log(`Base moves: ${baseMoves.length}`);
console.log(`Dump moves 1: ${dumpMoves1.length}`);
console.log(`Dump moves 2: ${dumpMoves2.length}`);
console.log(`Total unique flagged so far: ${combinedMap.size}`);

// Now let's check unflagged in modules 412, 452, 454, 470, 476, 478
const targetMods = [412, 452, 454, 470, 476, 478];
const targetUnflagged = questions.filter(q => targetMods.includes(q.currentModule) && !combinedMap.has(q.id));
console.log(`Unflagged in target modules (412, 452, 454, 470, 476, 478): ${targetUnflagged.length}`);

const byMod = {};
targetUnflagged.forEach(q => byMod[q.currentModule] = (byMod[q.currentModule] || 0) + 1);
console.log('By target module:', byMod);

let out = '';
targetUnflagged.forEach((q, idx) => {
  out += `[${idx+1}] Mod ${q.currentModule} (ID ${q.id}): ${q.text.substring(0, 95)} | Ans: ${q.ansText}\n`;
});
fs.writeFileSync('tools/target_unflagged.txt', out);
console.log('Saved to tools/target_unflagged.txt');
