const fs = require('fs');
const path = require('path');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const dir = 'tools/peds_modules';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

for (let m = 575; m <= 608; m++) {
  const mQs = rawQuestions.filter(q => q.module_id === m);
  let content = `================================================================\n`;
  content += `MODULE ${m}: ${modMap.get(m).moduleName} (${mQs.length} questions)\n`;
  content += `================================================================\n\n`;

  mQs.forEach(q => {
    const qText = clean(q.question_text);
    const optA = clean(q.option_a);
    const optB = clean(q.option_b);
    const optC = clean(q.option_c);
    const optD = clean(q.option_d);
    const optE = clean(q.option_e || '');
    const expl = clean(q.explanation);
    const ansLetter = (q.answer || '').trim().toUpperCase();
    let ansText = '';
    if (ansLetter === 'A') ansText = optA;
    else if (ansLetter === 'B') ansText = optB;
    else if (ansLetter === 'C') ansText = optC;
    else if (ansLetter === 'D') ansText = optD;
    else if (ansLetter === 'E') ansText = optE;

    content += `ID: ${q.id} | Answer: [${ansLetter}] ${ansText}\n`;
    content += `QUESTION: ${qText}\n`;
    content += `OPTIONS: A) ${optA} | B) ${optB} | C) ${optC} | D) ${optD}`;
    if (optE) content += ` | E) ${optE}`;
    content += `\n`;
    
    // Topic tag if present
    const t = expl.match(/Topic:\s*([^\n\r<]+)/i);
    if (t) content += `TAG TOPIC: ${t[1].trim()}\n`;
    
    content += `EXPLANATION: ${expl}\n`;
    content += `----------------------------------------------------------------\n\n`;
  });

  fs.writeFileSync(path.join(dir, `mod_${m}.txt`), content, 'utf8');
}

console.log('Successfully wrote all 34 module dumps to tools/peds_modules/');
process.exit(0);
