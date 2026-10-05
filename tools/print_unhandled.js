const fs = require('fs');

const unh = fs.readFileSync('tools/unhandled_questions.txt', 'utf8');
const lines = unh.split('\n');

for (const line of lines) {
  if (line.startsWith('MODULE ') || line.startsWith('ID ')) {
    console.log(line);
  }
}
process.exit(0);
