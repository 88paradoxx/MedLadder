const fs = require('fs');
const { clean, matchTerm, rawQuestions, modMap } = require('./surgery_auditor_base');
const { evaluateQuestion } = require('./deep_surgery_auditor');
const { classifyIntraSurgery } = require('./audit_surgery_engine');

const moves = [];
const seenIds = new Set();

let crossSubjectCount = 0;
let intraSurgeryCount = 0;

rawQuestions.forEach(q => {
  // First check cross-subject
  const cross = evaluateQuestion(q);
  if (cross && cross.toModule !== q.module_id) {
    moves.push({
      id: q.id,
      fromModule: q.module_id,
      toModule: cross.toModule,
      reason: cross.reason
    });
    seenIds.add(q.id);
    crossSubjectCount++;
    return;
  }

  // Then check intra-surgery
  const intra = classifyIntraSurgery(q);
  if (intra && intra.toModule !== q.module_id) {
    moves.push({
      id: q.id,
      fromModule: q.module_id,
      toModule: intra.toModule,
      reason: intra.reason
    });
    seenIds.add(q.id);
    intraSurgeryCount++;
    return;
  }
});

console.log(`Total questions: ${rawQuestions.length}`);
console.log(`Total flagged moves: ${moves.length}`);
console.log(`- Cross-subject moves: ${crossSubjectCount}`);
console.log(`- Intra-surgery moves: ${intraSurgeryCount}`);

// Check how many questions from module 483 were flagged
const m483Moves = moves.filter(m => m.fromModule === 483);
console.log(`Module 483 moves flagged: ${m483Moves.length} / 434`);

process.exit(0);
