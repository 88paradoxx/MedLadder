const fs = require('fs');

const unflagged = JSON.parse(fs.readFileSync('tools/unflagged_deep_review.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log(`Starting advanced classification on ${unflagged.length} unflagged questions...`);
