const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

const m483 = rawQuestions.filter(q => q.module_id === 483);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log(`Analyzing ${m483.length} questions in Module 483...`);

// Let's inspect questions and identify patterns
const unclassified = [];
const classified = [];

m483.forEach(q => {
  const text = (clean(q.question_text) + ' ' + clean(q.explanation)).toLowerCase();
  const id = q.id;

  // Let's check some specific topics
  let target = null;
  let reason = '';

  // Pediatric surgery checks - should stay in 483
  const isPeds = (
    text.includes('infantile hypertrophic pyloric stenosis') ||
    text.includes('pyloromyotomy') ||
    text.includes('hirschsprung') ||
    text.includes('anorectal malformation') ||
    text.includes('imperforate anus') ||
    text.includes('tracheoesophageal fistula') ||
    text.includes('esophageal atresia') ||
    text.includes('congenital diaphragmatic hernia') ||
    text.includes('bochdalek') ||
    text.includes('morgagni') ||
    text.includes('duodenal atresia') ||
    text.includes('jejunal atresia') ||
    text.includes('malrotation') ||
    text.includes('ladd procedure') ||
    text.includes('ladd\'s') ||
    text.includes('meconium ileus') ||
    text.includes('omphalocele') ||
    text.includes('gastroschisis') ||
    text.includes('biliary atresia') ||
    text.includes('kasai') ||
    text.includes('choledochal cyst in children') ||
    text.includes('wilms tumour') ||
    text.includes('wilms tumor') ||
    text.includes('nephroblastoma') ||
    text.includes('neuroblastoma') ||
    text.includes('sacrococcygeal teratoma') ||
    (text.includes('intussusception') && (text.includes('child') || text.includes('infant') || text.includes('target sign'))) ||
    text.includes('branchial cyst') ||
    text.includes('branchial fistula') ||
    text.includes('cystic hygroma') ||
    text.includes('thyroglossal cyst') ||
    text.includes('sistrunk')
  );

  if (isPeds) {
    classified.push({ id, target: 483, reason: 'Legitimate paediatric surgery condition.' });
  } else {
    unclassified.push(q);
  }
});

console.log(`Legitimate paediatric questions: ${classified.length}`);
console.log(`Misplaced in 483 needing reclassification: ${unclassified.length}`);

// Sample of unclassified
console.log('\nSample 10 unclassified in 483:');
unclassified.slice(0, 10).forEach(q => {
  console.log(`ID ${q.id}: ${clean(q.question_text).substring(0, 75)}`);
});

process.exit(0);
