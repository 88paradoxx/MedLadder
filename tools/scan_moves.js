const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

// Helper to check text matches
function matches(q, regex) {
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  return regex.test(text);
}

function qTextMatches(q, regex) {
  return regex.test(q.question_text || '');
}

console.log('Running detailed scan for potential misclassifications...');

// Let's create an analysis function that checks each question against all module topics
const results = [];

rawQuestions.forEach(q => {
  const m = q.module_id;
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  const qt = q.question_text || '';
  const exp = q.explanation || '';

  // Non-OBG
  if (/cimetidine.*(side effect|s\/e)|atrophic gastritis.*cimetidine/i.test(text)) {
    results.push({ id: q.id, from: m, to: 260, reason: 'Adverse effects of cimetidine belong to Pharmacology (Gastrointestinal Drugs).' });
    return;
  }
  if (/ezetimibe|inhibiting absorption.*hypercholestero/i.test(text)) {
    results.push({ id: q.id, from: m, to: 247, reason: 'Ezetimibe and cholesterol absorption inhibition belong to Pharmacology (Cardiovascular Drugs).' });
    return;
  }
  if (/terbinafine|antifungal which can be used orally but not iv/i.test(text)) {
    results.push({ id: q.id, from: m, to: 238, reason: 'Terbinafine pharmacokinetics and route belong to Pharmacology (Antifungal Drugs).' });
    return;
  }
  if (/rosuvastatin|most potent statin/i.test(text)) {
    results.push({ id: q.id, from: m, to: 247, reason: 'Statin potency comparison belongs to Pharmacology (Cardiovascular Drugs).' });
    return;
  }
  if (/low molecular weight heparin mainly inhibits which factor/i.test(text)) {
    results.push({ id: q.id, from: m, to: 246, reason: 'LMWH mechanism of action (Factor Xa inhibition) belongs to Pharmacology (Hematology / Anticoagulants).' });
    return;
  }
  if (/interaction with warfarin except.*benzodiazep/i.test(text)) {
    results.push({ id: q.id, from: m, to: 246, reason: 'Warfarin drug-drug interactions belong to Pharmacology (Hematology / Anticoagulants).' });
    return;
  }
  if (/pyrimethamine|slow acting schizonticide/i.test(text)) {
    results.push({ id: q.id, from: m, to: 236, reason: 'Pyrimethamine classification and antimalarial mechanism belong to Pharmacology (Antimalarials).' });
    return;
  }
  if (/vancomycin|red man syndrome/i.test(text)) {
    results.push({ id: q.id, from: m, to: 239, reason: 'Vancomycin adverse effect (Red man syndrome) belongs to Pharmacology (Antibacterial Agents).' });
    return;
  }
  if (/sulphonamide.*decrease in folic acid.*competitive inhibition/i.test(text)) {
    results.push({ id: q.id, from: m, to: 235, reason: 'Sulfonamide mechanism of action belongs to Pharmacology (Antimicrobial Agents).' });
    return;
  }
  if (/moxalactam|bleeding is seen with the use of -.*moxalactam/i.test(text)) {
    results.push({ id: q.id, from: m, to: 239, reason: 'Cephalosporin/moxalactam hypoprothrombinemia belongs to Pharmacology (Antibacterial Agents).' });
    return;
  }
  if (/national leprosy eradication programme|nlep/i.test(text)) {
    results.push({ id: q.id, from: m, to: 377, reason: 'National Leprosy Eradication Programme (NLEP) belongs to PSM (National Health Programmes II).' });
    return;
  }
  if (/kartar singh committee|multi-purpose worker scheme/i.test(text)) {
    results.push({ id: q.id, from: m, to: 404, reason: 'Multi-purpose worker scheme and Kartar Singh Committee belong to PSM (Health Planning and Management).' });
    return;
  }
  if (/high sensitive.*low false negative|true positive is directly related to sensitivity/i.test(text)) {
    results.push({ id: q.id, from: m, to: 362, reason: 'Screening test statistical parameters belong to PSM (Epidemiology - Screening of Disease).' });
    return;
  }
  if (/best indicator of availability.*health services.*imr/i.test(text)) {
    results.push({ id: q.id, from: m, to: 380, reason: 'Infant Mortality Rate (IMR) as an indicator belongs to PSM (Demography II).' });
    return;
  }
  if (/direct cash transfer scheme to adolescent girls|rajiv gandhi scheme.*sabla/i.test(text)) {
    results.push({ id: q.id, from: m, to: 378, reason: 'Adolescent health schemes (SABLA) belong to PSM (National Health Programmes III).' });
    return;
  }
  if (/highest funding for reproductive health is by.*unfpa/i.test(text)) {
    results.push({ id: q.id, from: m, to: 402, reason: 'International health agencies (UNFPA) funding belongs to PSM (International Health).' });
    return;
  }
  if (/perinatal mortality includes deaths/i.test(text)) {
    results.push({ id: q.id, from: m, to: 380, reason: 'Definition of perinatal mortality belongs to PSM (Demography II: Demographic Indicators).' });
    return;
  }
  if (/bmi of an overweight female/i.test(text) && m === 531) {
    results.push({ id: q.id, from: m, to: 385, reason: 'BMI nutritional status classification belongs to PSM (Nutrition and Health) / Medicine.' });
    return;
  }
  if (/diarrhoea in a child of 12 month.*dose of zinc/i.test(text)) {
    results.push({ id: q.id, from: m, to: 592, reason: 'Zinc therapy in pediatric diarrhea belongs to Pediatrics (Medical GI Disorders).' });
    return;
  }
  if (/cyanotic spells.*systolic murmur.*tof|cxr boot shaped heart/i.test(text)) {
    results.push({ id: q.id, from: m, to: 598, reason: 'Tetralogy of Fallot presentation and CXR belong to Pediatrics (Cyanotic Congenital Heart Diseases).' };
    return;
  }
  if (/kawasaki disease.*thrombocytopenia/i.test(text)) {
    results.push({ id: q.id, from: m, to: 605, reason: 'Kawasaki disease features belong to Pediatrics (Paediatric Rheumatology).' });
    return;
  }
  if (/exclusive breastfeeding recommended/i.test(text) && m === 535) {
    results.push({ id: q.id, from: m, to: 580, reason: 'Exclusive breastfeeding duration belongs to Pediatrics (Nutrition and Breastfeeding).' });
    return;
  }
  if (/4-year-old boy.*early development of pubic hair/i.test(text) && m === 535) {
    results.push({ id: q.id, from: m, to: 603, reason: 'Precocious puberty in young boys belongs to Pediatrics (Disorders of Puberty).' };
    return;
  }
  if (/hbig is indicated for newborn infants of hbsag-positive/i.test(text) && m === 562) {
    results.push({ id: q.id, from: m, to: 575, reason: 'Newborn management of hepatitis B exposure belongs to Pediatrics (Basics of Neonatology).' });
    return;
  }
  if (/7-month-old child who has a hemoglobi.*severe microcytic hypochromic anem/i.test(text) && m === 573) {
    results.push({ id: q.id, from: m, to: 607, reason: 'Severe infantile anemia workup belongs to Pediatrics (Paediatric Anemias).' };
    return;
  }
  if (/alveolar hypoventilation.*paco2.*dyspnea, tachycardia, confusion/i.test(text) && m === 548) {
    results.push({ id: q.id, from: m, to: 417, reason: 'Alveolar hypoventilation and respiratory failure belong to Medicine (Respiratory Medicine).' });
    return;
  }
  if (/bone pain and hepatosplenomegaly.*gaucher/i.test(text) && m === 574) {
    results.push({ id: q.id, from: m, to: 443, reason: 'Gaucher disease bone marrow findings belong to Medicine (Hematology) / Pathology.' });
    return;
  }
  if (/nephrotic syndrome diagnosed when she was.*membranous|fsgs|minimal change/i.test(text) && m === 574) {
    results.push({ id: q.id, from: m, to: 449, reason: 'Nephrotic syndrome in adults belongs to Medicine (Nephrology).' });
    return;
  }
  if (/diabetes insipidus|nephrogenic diabetes insipidus|desmopressin.*diabetes insipidus/i.test(text) && m === 554) {
    results.push({ id: q.id, from: m, to: 458, reason: 'Diabetes insipidus evaluation and treatment belong to Medicine (Endocrinology).' });
    return;
  }
  if (/42-year-old man presents with headaches, excessive sweating, galactorrhoea, polyuria and polydipsia/i.test(text) && m === 554) {
    results.push({ id: q.id, from: m, to: 458, reason: 'Male prolactinoma belongs to Medicine (Endocrinology).' };
    return;
  }
  if (/paraneoplastic syndromes in bronchogenic carcinoma|54-year-old chronic smoker presents with polyuria/i.test(text) && m === 554) {
    results.push({ id: q.id, from: m, to: 418, reason: 'Paraneoplastic syndromes in lung cancer belong to Medicine (Respiratory Medicine).' };
    return;
  }
  if (/hemochromatosis.*dark skinned.*bronzing of skin/i.test(text) && m === 554) {
    results.push({ id: q.id, from: m, to: 437, reason: 'Hemochromatosis belongs to Medicine (Gastroenterology / Hepatology).' };
    return;
  }
  if (/nutmeg liver.*right sided heart failure/i.test(text) && m === 548) {
    results.push({ id: q.id, from: m, to: 129, reason: 'Nutmeg liver in right heart failure belongs to Pathology (Hemodynamics) / Medicine.' };
    return;
  }
  if (/lymphedema precox.*onset b\/w ages 1 year and 35 years/i.test(text) && m === 531) {
    results.push({ id: q.id, from: m, to: 528, reason: 'Lymphedema praecox belongs to Surgery (Lymphatic System).' };
    return;
  }
  if (/coeliac plexus block.*diarrhea and hypotension/i.test(text) && m === 562) {
    results.push({ id: q.id, from: m, to: 623, reason: 'Celiac plexus block belongs to Anaesthesia (Regional Anaesthesia / Pain Management).' };
    return;
  }
  if (/half-life of iodine 131/i.test(text) && m === 574) {
    results.push({ id: q.id, from: m, to: 737, reason: 'Iodine-131 physical half-life belongs to Radiology (Nuclear Medicine).' };
    return;
  }
  if (/premature ejaculation is seen in which phase/i.test(text) && m === 535) {
    results.push({ id: q.id, from: m, to: 718, reason: 'Premature ejaculation belongs to Psychiatry (Human Sexuality).' };
    return;
  }
  if (/low bmi, fatigue, weakness.*amenorrhea.*constant worry about/i.test(text) && /anorexia/i.test(text) && m === 531) {
    results.push({ id: q.id, from: m, to: 715, reason: 'Anorexia nervosa belongs to Psychiatry (Eating Disorders).' };
    return;
  }
  if (/risk factors for carcinoma gall bladder/i.test(text) && m === 572) {
    results.push({ id: q.id, from: m, to: 492, reason: 'Carcinoma gallbladder risk factors belong to Surgery (Gallbladder and Bile Ducts).' };
    return;
  }
  if (/screening procedure is best for ca of -.*colon/i.test(text) && m === 572) {
    results.push({ id: q.id, from: m, to: 498, reason: 'Colorectal cancer screening belongs to Surgery (Colorectal) / Medicine.' };
    return;
  }
  if (/breast cancer.*most common malignancy in women/i.test(text) && m === 571) {
    results.push({ id: q.id, from: m, to: 487, reason: 'Breast cancer epidemiology and risk factors belong to Surgery (Carcinoma Breast).' };
    return;
  }
  if (/gynecomastia|gynaecomastia is seen in all of the following/i.test(text) && m === 555) {
    results.push({ id: q.id, from: m, to: 486, reason: 'Gynecomastia causes and evaluation belong to Surgery (Breast) / Medicine.' };
    return;
  }
  if (/transovarian transmission.*yellow fever|transovarian transmission of infection occurs in/i.test(text) && m === 570) {
    results.push({ id: q.id, from: m, to: 217, reason: 'Transovarial transmission of arboviruses belongs to Microbiology (General Virology / Arboviruses).' };
    return;
  }
  if (/risk factors for deep vein thrombosis.*dvt/i.test(text) && m === 574) {
    results.push({ id: q.id, from: m, to: 483, reason: 'Risk factors for deep vein thrombosis (DVT) belong to Surgery (General Surgery / Vascular) / Medicine.' };
    return;
  }
  if (/audit in obstetrics/i.test(text) && m === 545) {
    results.push({ id: q.id, from: m, to: 404, reason: 'Clinical audit principles and evaluation belong to PSM (Health Planning and Management) / Mixed Topics.' };
    return;
  }
  if (/maternal mortality.*developing countries.*hemorrhage/i.test(text) && m === 533) {
    results.push({ id: q.id, from: m, to: 380, reason: 'Maternal mortality causes and epidemiology belong to PSM (Demography II: Demographic Indicators).' };
    return;
  }
  if (/maternal mortality.*maximum.*peripartum/i.test(text) && m === 533) {
    results.push({ id: q.id, from: m, to: 380, reason: 'Maternal mortality timing and epidemiology belong to PSM (Demography II: Demographic Indicators).' };
    return;
  }
  if (/maternal mortality refers to the death of a woman/i.test(text) && m === 547) {
    results.push({ id: q.id, from: m, to: 380, reason: 'Maternal mortality definition belongs to PSM (Demography II: Demographic Indicators).' };
    return;
  }
});

console.log(`Scan completed. Found ${results.length} non-OBG questions.`);
process.exit(0);
