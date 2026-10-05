const fs = require('fs');
const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const fullAudit = require('./full_medicine_auditor');
const dumpMoves1 = JSON.parse(fs.readFileSync('tools/dump_categorized_moves.json', 'utf8'));
const dumpMoves2 = JSON.parse(fs.readFileSync('tools/dump_remaining_classified.json', 'utf8'));

const combinedMap = new Map();
rawQuestions.forEach(q => {
  const cleanedQ = {
    id: q.id,
    currentModule: q.module_id,
    text: fullAudit.clean(q.question_text),
    options: {
      A: fullAudit.clean(q.option_a),
      B: fullAudit.clean(q.option_b),
      C: fullAudit.clean(q.option_c),
      D: fullAudit.clean(q.option_d),
      E: fullAudit.clean(q.option_e)
    },
    ansLetter: (q.answer || '').trim().toUpperCase(),
    expl: fullAudit.clean(q.explanation)
  };
  let ansText = cleanedQ.options[cleanedQ.ansLetter] || '';
  cleanedQ.ansText = ansText;
  cleanedQ.full = (cleanedQ.text + ' ' + Object.values(cleanedQ.options).join(' ') + ' ' + cleanedQ.expl).toLowerCase();
  cleanedQ.qa = (cleanedQ.text + ' ' + ansText).toLowerCase();

  const res = fullAudit.audit(cleanedQ);
  if (res && res.toModule !== cleanedQ.currentModule) {
    combinedMap.set(q.id, { id: q.id, fromModule: cleanedQ.currentModule, toModule: res.toModule, reason: res.reason });
  }
});
dumpMoves1.forEach(m => combinedMap.set(m.id, m));
dumpMoves2.forEach(m => combinedMap.set(m.id, m));

// Filter unflagged questions in 412, 452, 454, 470, 476, 477, 478
const targetMods = [412, 452, 454, 470, 476, 477, 478];
const unflaggedTargets = rawQuestions.filter(q => targetMods.includes(q.module_id) && !combinedMap.has(q.id));
console.log(`Unflagged in target modules: ${unflaggedTargets.length}`);

let out = '';
unflaggedTargets.forEach((q, idx) => {
  const text = fullAudit.clean(q.question_text);
  const expl = fullAudit.clean(q.explanation);
  const ans = (q.answer || '').trim().toUpperCase();
  const opt = q['option_' + ans.toLowerCase()] || '';
  out += `[${idx+1}] ID ${q.id} (Mod ${q.module_id}): ${text}\n  Options: A: ${q.option_a} | B: ${q.option_b} | C: ${q.option_c} | D: ${q.option_d}\n  Ans: [${ans}] ${opt}\n  Expl: ${expl.substring(0, 100)}\n\n`;
});
fs.writeFileSync('tools/target_unflagged_all.txt', out);
console.log('Saved to tools/target_unflagged_all.txt');
