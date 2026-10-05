const fs = require('fs');

const orig = fs.readFileSync('tools/build_audit_pharmacology.js', 'utf8');
const snippet = fs.readFileSync('tools/new_moves_code_snippet.txt', 'utf8');

const targetStr = '// ID 3153: Antipsychotic metabolic syndrome sitting in Anti-protozoal (246) -> Psychiatry (692)';
const idx = orig.indexOf(targetStr);
console.log('Index of targetStr:', idx);

if (idx === -1) {
  console.error('Target string not found!');
  process.exit(1);
}

const endBlock = orig.indexOf('  }', idx);
const insertPos = endBlock + 3;

const newContent = orig.slice(0, insertPos) + '\n\n  // --- NEW VERIFIED AUDIT BATCH (179 moves) ---\n' + snippet + orig.slice(insertPos);

const footerTarget = 'console.log(`Explicit verified moves: ${movedCount}`);';
const footerIdx = newContent.indexOf(footerTarget);
console.log('Footer index:', footerIdx);

const footerNew = footerTarget + '\n\n' +
  'const auditReport = {\n' +
  '  subject: "Pharmacology",\n' +
  '  totalQuestions: qs.length,\n' +
  '  flaggedCount: moves.length,\n' +
  '  moves: moves\n' +
  '};\n\n' +
  'fs.writeFileSync("tools/audit_pharmacology.json", JSON.stringify(auditReport, null, 2));\n' +
  'console.log("Saved audit report to tools/audit_pharmacology.json");\n\n' +
  'process.exit(0);';

const finalContent = newContent.slice(0, footerIdx) + footerNew;
fs.writeFileSync('tools/build_audit_pharmacology.js', finalContent);
console.log('Updated tools/build_audit_pharmacology.js successfully!');
