const fs = require('fs');

const unflagged = JSON.parse(fs.readFileSync('tools/unflagged_deep_review.json', 'utf8'));
const targetMods = [411, 419, 432, 433, 434, 470, 476, 478];
const targetQs = unflagged.filter(q => targetMods.includes(q.currentModule));

console.log(`Analyzing ${targetQs.length} questions...`);

// Let's create clinical condition matchers
