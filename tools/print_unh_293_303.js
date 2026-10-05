const fs = require('fs');

const unh = fs.readFileSync('tools/unhandled_questions.txt', 'utf8');
const lines = unh.split('\n');

let print = false;
for (const line of lines) {
  if (line.startsWith('MODULE ')) {
    const m = parseInt(line.split(' ')[1]);
    if (m >= 293 && m <= 303) {
      print = true;
      console.log('\n' + line);
      continue;
    } else {
      print = false;
    }
  }
  if (print && line.startsWith('ID ')) {
    console.log(line);
  }
}
process.exit(0);
