const fs = require('fs');

const dumpMoves = JSON.parse(fs.readFileSync('tools/dump_categorized_moves.json', 'utf8'));
const movedIds = new Set(dumpMoves.map(m => m.id));
const dumpQs = JSON.parse(fs.readFileSync('tools/unflagged_dump_only.json', 'utf8'));
const remaining = dumpQs.filter(q => !movedIds.has(q.id));
console.log('Remaining unflagged dumped questions:', remaining.length);

const byMod = {};
remaining.forEach(q => byMod[q.fromModule] = (byMod[q.fromModule] || 0) + 1);
console.log('By module:', byMod);

remaining.slice(0, 20).forEach(q => {
  console.log(`[Mod ${q.fromModule}, ID ${q.id}]: ${q.text.substring(0, 80)} | Ans: ${q.ansText.substring(0, 40)}`);
});

fs.writeFileSync('tools/dump_unclassified_remaining.json', JSON.stringify(remaining, null, 2));
