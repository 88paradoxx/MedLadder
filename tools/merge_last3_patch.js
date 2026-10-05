const fs = require('fs');

const files = [
  'tools/audit_deep_dermatology.json',
  'tools/audit_deep_psychiatry.json',
  'tools/audit_deep_radiology.json'
];

const movesMap = new Map();
let duplicateCount = 0;

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  d.moves.forEach(m => {
    if (movesMap.has(m.id)) {
      duplicateCount++;
    }
    movesMap.set(m.id, m);
  });
});

const allMoves = Array.from(movesMap.values());
console.log('Total unique moves in last 3 subjects:', allMoves.length, '(duplicates:', duplicateCount, ')');
fs.writeFileSync('tools/combined_last3_patch.json', JSON.stringify(allMoves, null, 2));
console.log('Saved to tools/combined_last3_patch.json');
process.exit(0);
