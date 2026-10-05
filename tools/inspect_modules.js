const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const questions = rawQuestions.map(q => {
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

  const full = `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${qText} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    qText,
    ansLetter,
    ansText,
    expl,
    qa,
    full
  };
});

// Let's create an analysis script that outputs questions for any given module range
const startMod = parseInt(process.argv[2] || '575');
const endMod = parseInt(process.argv[3] || '580');

console.log(`Analyzing modules ${startMod} to ${endMod}...`);

for (let m = startMod; m <= endMod; m++) {
  const mQs = questions.filter(q => q.currentModule === m);
  console.log(`\n======================================================`);
  console.log(`MODULE ${m}: ${modMap.get(m).moduleName} (${mQs.length} questions)`);
  console.log(`======================================================`);
  mQs.forEach(q => {
    console.log(`ID: ${q.id} | Ans (${q.ansLetter}): ${q.ansText.slice(0, 40)}`);
    console.log(`  Q: ${q.qText.slice(0, 120)}`);
    // Extract topic or tags from explanation if available
    const topicMatch = q.expl.match(/Topic:\s*([^<>\n\r]+)/i);
    if (topicMatch) console.log(`  Topic Tag: ${topicMatch[1].trim()}`);
    console.log(`  Expl snippet: ${q.expl.slice(0, 120)}...`);
  });
}

process.exit(0);
