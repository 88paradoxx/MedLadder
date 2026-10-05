const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const fullAudit = require('./full_medicine_auditor');
const dumpMoves1 = JSON.parse(fs.readFileSync('tools/dump_categorized_moves.json', 'utf8'));
const dumpMoves2 = JSON.parse(fs.readFileSync('tools/dump_remaining_classified.json', 'utf8'));
const targetMoves = JSON.parse(fs.readFileSync('tools/target_additional_moves.json', 'utf8'));

const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

const movesMap = new Map();

// 1. Process base auditor moves
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
    movesMap.set(q.id, {
      id: q.id,
      fromModule: cleanedQ.currentModule,
      toModule: res.toModule,
      reason: res.reason
    });
  }
});

console.log(`Base moves: ${movesMap.size}`);

// 2. Add dump moves 1
let addedDump1 = 0;
dumpMoves1.forEach(m => {
  if (!movesMap.has(m.id)) addedDump1++;
  movesMap.set(m.id, m);
});
console.log(`Added from dump 1: ${addedDump1} (Total now: ${movesMap.size})`);

// 3. Add dump moves 2
let addedDump2 = 0;
dumpMoves2.forEach(m => {
  if (!movesMap.has(m.id)) addedDump2++;
  movesMap.set(m.id, m);
});
console.log(`Added from dump 2: ${addedDump2} (Total now: ${movesMap.size})`);

// 4. Add target additional moves
let addedTarget = 0;
targetMoves.forEach(m => {
  if (!movesMap.has(m.id)) addedTarget++;
  movesMap.set(m.id, m);
});
console.log(`Added from target modules: ${addedTarget} (Total now: ${movesMap.size})`);

// Validation
const finalMoves = [];
let invalidCount = 0;
for (const [id, move] of movesMap.entries()) {
  if (move.fromModule === move.toModule) {
    console.error(`ERROR: Question ${id} has identical fromModule and toModule: ${move.fromModule}`);
    invalidCount++;
    continue;
  }
  if (!modMap.has(move.fromModule)) {
    console.error(`ERROR: Question ${id} has unknown fromModule: ${move.fromModule}`);
    invalidCount++;
    continue;
  }
  if (!modMap.has(move.toModule)) {
    console.error(`ERROR: Question ${id} has unknown toModule: ${move.toModule}`);
    invalidCount++;
    continue;
  }
  finalMoves.push({
    id: move.id,
    fromModule: move.fromModule,
    toModule: move.toModule,
    reason: move.reason
  });
}

// Sort by question id
finalMoves.sort((a, b) => a.id - b.id);

console.log(`\nFinal valid moves count: ${finalMoves.length}`);
console.log(`Invalid moves: ${invalidCount}`);

// Subject summary
const crossSubjectMoves = {};
const intraMedicineMoves = {};
let crossSubjectCount = 0;
let intraMedicineCount = 0;

finalMoves.forEach(m => {
  const targetSub = modMap.get(m.toModule).subjectName;
  if (m.toModule >= 411 && m.toModule <= 479) {
    intraMedicineCount++;
    const targetModName = modMap.get(m.toModule).moduleName;
    intraMedicineMoves[targetModName] = (intraMedicineMoves[targetModName] || 0) + 1;
  } else {
    crossSubjectCount++;
    crossSubjectMoves[targetSub] = (crossSubjectMoves[targetSub] || 0) + 1;
  }
});

console.log(`\nCross-subject moves (${crossSubjectCount}):`, crossSubjectMoves);
console.log(`Intra-medicine moves (${intraMedicineCount}):`, Object.entries(intraMedicineMoves).sort((a,b) => b[1] - a[1]).slice(0, 15));

const auditReport = {
  subject: "Medicine",
  totalQuestions: rawQuestions.length,
  flaggedCount: finalMoves.length,
  moves: finalMoves
};

fs.writeFileSync('tools/audit_deep_medicine.json', JSON.stringify(auditReport, null, 2));
console.log('\nSuccessfully generated tools/audit_deep_medicine.json!');
