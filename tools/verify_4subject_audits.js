const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

const files = [
  'tools/audit_deep_ent.json',
  'tools/audit_deep_ophthalmology.json',
  'tools/audit_deep_psm.json',
  'tools/audit_deep_medicine.json'
];

let grandTotal = 0;
let grandFlagged = 0;
let grandCross = 0;
let grandIntra = 0;

console.log('================ AUDIT VERIFICATION TALLY ================');

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  grandTotal += d.totalQuestions;
  grandFlagged += d.flaggedCount;

  let crossSub = 0;
  let intraSub = 0;
  const crossBreakdown = {};
  const intraBreakdown = {};

  d.moves.forEach(m => {
    const fromMod = modLookup[m.fromModule];
    const toMod = modLookup[m.toModule];
    if (!toMod) {
      console.error('INVALID TO MODULE:', m);
      return;
    }
    if (fromMod.subjectId !== toMod.subjectId) {
      crossSub++;
      crossBreakdown[toMod.subjectName] = (crossBreakdown[toMod.subjectName] || 0) + 1;
    } else {
      intraSub++;
      intraBreakdown[toMod.moduleName] = (intraBreakdown[toMod.moduleName] || 0) + 1;
    }
  });

  grandCross += crossSub;
  grandIntra += intraSub;

  console.log(`\nSUBJECT: ${d.subject}`);
  console.log(`- Total Questions Audited: ${d.totalQuestions}`);
  console.log(`- Flagged for Move: ${d.flaggedCount} (${((d.flaggedCount / d.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`- Retained in Current Module: ${d.totalQuestions - d.flaggedCount} (${(((d.totalQuestions - d.flaggedCount) / d.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`- Intra-Subject Moves: ${intraSub}`);
  console.log(`- Cross-Subject Moves: ${crossSub}`);
  console.log(`- Cross-Subject Breakdown:`, JSON.stringify(crossBreakdown, null, 2));
});

console.log('\n================ GRAND TOTAL TALLY (4 SUBJECTS) ================');
console.log(`Total Audited Questions: ${grandTotal}`);
console.log(`Total Retained: ${grandTotal - grandFlagged} (${(((grandTotal - grandFlagged) / grandTotal) * 100).toFixed(1)}%)`);
console.log(`Total Flagged for Move: ${grandFlagged} (${((grandFlagged / grandTotal) * 100).toFixed(1)}%)`);
console.log(`- Intra-Subject Moves: ${grandIntra} (${((grandIntra / grandFlagged) * 100).toFixed(1)}% of flags)`);
console.log(`- Cross-Subject Moves: ${grandCross} (${((grandCross / grandFlagged) * 100).toFixed(1)}% of flags)`);

process.exit(0);
