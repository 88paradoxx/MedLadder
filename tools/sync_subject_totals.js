const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('syllabus.js', 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(content, sandbox);
const syllabus = sandbox.window.SYLLABUS_DATA;

let updated = content;
syllabus.forEach(sub => {
  const sum = (sub.modules || []).reduce((acc, m) => acc + (m.questionCount || 0), 0);
  // Match subject definition e.g. name: 'Physiology', questionCount: 1652
  const escapedName = sub.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(name:\\s*['"]${escapedName}['"],\\s*questionCount:\\s*)(\\d+)`, 'g');
  updated = updated.replace(regex, `$1${sum}`);
});

fs.writeFileSync('syllabus.js', updated, 'utf8');
console.log('Subject totals updated successfully in syllabus.js!');
