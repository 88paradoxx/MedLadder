const fs = require('fs');

const overview = fs.readFileSync('tools/ent_questions_overview.txt', 'utf8');
const lines = overview.split('\n');

// Let's print out modules 293 to 300
let printing = false;
let currentMod = 0;
for (const line of lines) {
  if (line.startsWith('MODULE ')) {
    const modNum = parseInt(line.split(' ')[1]);
    if (modNum >= 293 && modNum <= 303) {
      printing = true;
      console.log('\n' + line);
      continue;
    } else {
      printing = false;
    }
  }
  if (printing && line.startsWith('ID ')) {
    console.log(line);
  }
}
process.exit(0);
