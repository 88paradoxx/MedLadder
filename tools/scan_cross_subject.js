const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Searching for any non-ENT questions in the 1217 ENT questions...');

const crossSubjectCandidates = [];

qs.forEach(q => {
  const text = (clean(q.question_text) + ' ' + clean(q.explanation)).toLowerCase();
  
  // OBGYN keywords
  if (text.includes('ectopic pregnancy') || text.includes('amenorrhea') || text.includes('labor') || text.includes('placenta') || text.includes('uterine') || text.includes('ovarian')) {
    crossSubjectCandidates.push({ id: q.id, mod: q.module_id, topic: 'OBGYN', text: clean(q.question_text) });
  }
  // Ortho keywords
  if (text.includes('septic arthritis') || text.includes('fracture neck of femur') || text.includes('colles fracture') || text.includes('monteggia') || text.includes('galeazzi')) {
    crossSubjectCandidates.push({ id: q.id, mod: q.module_id, topic: 'Ortho', text: clean(q.question_text) });
  }
  // Pediatrics / Medicine non-ENT
  if (text.includes('congestive heart failure') || text.includes('chf in children') || text.includes('tetralogy of fallot') || text.includes('ventricular septal defect') || text.includes('myocardial infarction') || text.includes('nephrotic syndrome')) {
    crossSubjectCandidates.push({ id: q.id, mod: q.module_id, topic: 'Peds/Med', text: clean(q.question_text) });
  }
});

console.log('Found candidates:');
crossSubjectCandidates.forEach(c => console.log(c.id, `[Mod ${c.mod}]`, c.topic, c.text));
process.exit(0);
