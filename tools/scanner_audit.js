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

function inspectModule(mId) {
  const mQs = questions.filter(q => q.currentModule === mId);
  let out = '';
  out += '================================================================\n';
  out += 'MODULE ' + mId + ': ' + modMap.get(mId).moduleName + ' (' + mQs.length + ' questions)\n';
  out += '================================================================\n';
  mQs.forEach(q => {
    out += 'ID ' + q.id + ' | Ans: ' + q.ansText.slice(0, 35) + '\n';
    out += '  Q: ' + q.qText.slice(0, 110) + '\n';
    const t = q.expl.match(/Topic:\s*([^\n\r<]+)/i);
    if (t) out += '  Topic: ' + t[1].trim() + '\n';
    out += '  Expl: ' + q.expl.slice(0, 110) + '\n';
    out += '----------------------------------------------------------------\n';
  });
  return out;
}

const target = parseInt(process.argv[2] || '575');
const outFile = process.argv[3];
const result = inspectModule(target);

if (outFile) {
  fs.writeFileSync(outFile, result, 'utf8');
  console.log(`Wrote module ${target} to ${outFile} (${result.length} bytes)`);
} else {
  console.log(result);
}

process.exit(0);
