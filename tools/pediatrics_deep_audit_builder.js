const fs = require('fs');
const path = require('path');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function hasWord(text, word) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(text);
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
    optA, optB, optC, optD, optE,
    ansLetter,
    ansText,
    expl,
    qa,
    full
  };
});

console.log(`Loaded ${questions.length} questions.`);

// Audit rules function
function auditQuestion(q) {
  const cur = q.currentModule;
  const id = q.id;
  const qa = q.qa;
  const full = q.full;
  const text = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  const inQA = (t) => qa.includes(t.toLowerCase());
  const wordQA = (w) => hasWord(qa, w);
  const inText = (t) => text.includes(t.toLowerCase());
  const wordText = (w) => hasWord(text, w);
  const inAns = (t) => ans.includes(t.toLowerCase());
  const wordAns = (w) => hasWord(ans, w);
  const inFull = (t) => full.includes(t.toLowerCase());
  const wordFull = (w) => hasWord(full, w);

  // -------------------------------------------------------------
  // CROSS-SUBJECT MOVES
  // -------------------------------------------------------------

  // PSM: Health indicators / Demography
  if (id === 23290 || inQA('dale is replaced by') || inQA('hale')) {
    return { toModule: 356, reason: 'Health-Adjusted Life Expectancy (HALE) replacing Disability-Adjusted Life Expectancy (DALE) is a standard population health indicator belonging to PSM (Module 356: Indicators of Health).' };
  }
  if (id === 23335 || inQA('net reproduction rate') || (inText('number of daughters a newborn girl') && inFull('reproduction'))) {
    return { toModule: 357, reason: 'Net Reproduction Rate (NRR) and demographic fertility indices belong to PSM (Module 357: Demography and Family Planning).' };
  }
  if (id === 23307 || inQA('remand homes')) {
    return { toModule: 397, reason: 'Remand homes and juvenile reformatory placement homes belong to PSM (Module 397: Social Problems / Vulnerable Groups).' };
  }
  if (id === 23973 || (inQA('mission indradhanush') && inQA('routine'))) {
    return { toModule: 405, reason: 'Mission Indradhanush national immunization programmatic coverage belongs to PSM (Module 405: National Health Programmes).' };
  }

  // Microbiology: Arboviruses (Zika)
  if (id === 23522 || (inQA('zika') && inText('hofbauer'))) {
    return { toModule: 210, reason: 'Transplacental transmission of Zika virus via Hofbauer cells causing congenital microcephaly belongs to Microbiology (Module 210: Arboviruses and Picorna Viruses).' };
  }

  // Surgery: Testicular torsion
  if (id === 24251 || (inText('testicular pain') && inText('exploration of the testis') && inFull('torsion'))) {
    return { toModule: 520, reason: 'Acute testicular torsion requiring urgent surgical exploration of the testis belongs to Surgery (Module 520: Testes and Scrotum).' };
  }

  // Orthopaedics: Fractures / Hip / Pediatric Ortho
  if (id === 24258 || inQA('barlow') && inQA('ortolani')) {
    return { toModule: 676, reason: 'Clinical screening tests (Barlow and Ortolani maneuvers) for Developmental Dysplasia of the Hip (DDH) belong to Orthopaedics (Module 676: Congenital Malformations, Perthes Disease and SCFE).' };
  }
  if (inQA('galeazzi') && inFull('hip')) {
    return { toModule: 676, reason: 'Galeazzi sign in developmental dysplasia of the hip belongs to Orthopaedics (Module 676: Congenital Malformations, Perthes Disease and SCFE).' };
  }
  if ((inQA('perthes') || inQA('legg-calve')) && !inFull('chromosome')) {
    return { toModule: 676, reason: 'Legg-Calve-Perthes disease of the femoral head belongs to Orthopaedics (Module 676: Congenital Malformations, Perthes Disease and SCFE).' };
  }
  if ((inQA('scfe') || inQA('slipped capital femoral')) && !inFull('chromosome')) {
    return { toModule: 676, reason: 'Slipped Capital Femoral Epiphysis (SCFE) in adolescents belongs to Orthopaedics (Module 676: Congenital Malformations, Perthes Disease and SCFE).' };
  }
  if (inQA('ctev') || inQA('clubfoot') || (inQA('talipes equinovarus') && inFull('ponseti'))) {
    return { toModule: 675, reason: 'Congenital Talipes Equinovarus (CTEV / Clubfoot) and Ponseti casting belong to Orthopaedics (Module 675: CTEV, Genu Varum and Valgum).' };
  }

  // Adult Cardiology / Medicine: Sudden Cardiac Death / HOCM in adolescent
  if (id === 24166 || (inText('basketball game') && inText('collapses') && inAns('aed'))) {
    return { toModule: 608, reason: 'Sudden cardiac arrest during sports in an adolescent and emergency AED use belongs to Pediatric Emergency / Mixed Topics (Module 608).' };
  }

  return null;
}

process.exit(0);
