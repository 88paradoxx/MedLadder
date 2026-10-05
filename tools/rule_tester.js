const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

// Helper to check text matches
function matches(q, regex) {
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  return regex.test(text);
}

function classify(q) {
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  const qText = q.question_text || '';

  // Non-OBG specific checks
  if (/cimetidine.*(side effect|s\/e)|atrophic gastritis.*cimetidine/i.test(text)) return { to: 260, reason: 'Adverse effects of cimetidine belong to Pharmacology (Gastrointestinal Drugs).' };
  if (/ezetimibe|inhibiting absorption.*hypercholestero/i.test(text)) return { to: 247, reason: 'Ezetimibe and cholesterol absorption inhibition belong to Pharmacology (Cardiovascular Drugs).' };
  if (/terbinafine|antifungal which can be used orally but not iv/i.test(text)) return { to: 238, reason: 'Terbinafine pharmacokinetics and route belong to Pharmacology (Antifungal Drugs).' };
  if (/rosuvastatin|most potent statin/i.test(text)) return { to: 247, reason: 'Statin potency comparison belongs to Pharmacology (Cardiovascular Drugs).' };
  if (/low molecular weight heparin mainly inhibits which factor/i.test(text)) return { to: 246, reason: 'LMWH mechanism of action (Factor Xa inhibition) belongs to Pharmacology (Hematology / Anticoagulants).' };
  if (/interaction with warfarin except.*benzodiazep/i.test(text)) return { to: 246, reason: 'Warfarin drug-drug interactions belong to Pharmacology (Hematology / Anticoagulants).' };
  if (/pyrimethamine|slow acting schizonticide/i.test(text)) return { to: 236, reason: 'Pyrimethamine classification and antimalarial mechanism belong to Pharmacology (Antimalarials).' };
  if (/vancomycin|red man syndrome/i.test(text)) return { to: 239, reason: 'Vancomycin adverse effect (Red man syndrome) belongs to Pharmacology (Antibacterial Agents).' };
  if (/sulphonamide.*decrease in folic acid.*competitive inhibition/i.test(text)) return { to: 235, reason: 'Sulfonamide mechanism of action belongs to Pharmacology (Antimicrobial Agents).' };
  if (/moxalactam|bleeding is seen with the use of -.*moxalactam/i.test(text)) return { to: 239, reason: 'Cephalosporin/moxalactam hypoprothrombinemia belongs to Pharmacology (Antibacterial Agents).' };
  
  if (/national leprosy eradication programme|nlep/i.test(text)) return { to: 377, reason: 'National Leprosy Eradication Programme (NLEP) belongs to PSM (National Health Programmes II).' };
  if (/kartar singh committee|multi-purpose worker scheme/i.test(text)) return { to: 404, reason: 'Multi-purpose worker scheme and Kartar Singh Committee belong to PSM (Health Planning and Management).' };
  if (/high sensitive.*low false negative|true positive is directly related to sensitivity/i.test(text)) return { to: 362, reason: 'Screening test statistical parameters belong to PSM (Epidemiology - Screening of Disease).' };
  if (/best indicator of availability.*health services.*imr/i.test(text)) return { to: 380, reason: 'Infant Mortality Rate (IMR) as an indicator belongs to PSM (Demography II).' };
  if (/direct cash transfer scheme to adolescent girls|rajiv gandhi scheme.*sabla/i.test(text)) return { to: 378, reason: 'Adolescent health schemes (SABLA) belong to PSM (National Health Programmes III).' };
  if (/highest funding for reproductive health is by.*unfpa/i.test(text)) return { to: 402, reason: 'International health agencies (UNFPA) funding belongs to PSM (International Health).' };
  if (/perinatal mortality includes deaths/i.test(text)) return { to: 380, reason: 'Definition of perinatal mortality belongs to PSM (Demography II: Demographic Indicators).' };
  if (/bmi of an overweight female/i.test(text)) return { to: 385, reason: 'BMI nutritional status classification belongs to PSM (Nutrition and Health) / Medicine.' };
  
  if (/diarrhoea in a child of 12 month.*dose of zinc/i.test(text)) return { to: 592, reason: 'Zinc therapy in pediatric diarrhea belongs to Pediatrics (Medical GI Disorders).' };
  if (/cyanotic spells.*systolic murmur.*tof|cxr boot shaped heart/i.test(text)) return { to: 598, reason: 'Tetralogy of Fallot presentation and CXR belong to Pediatrics (Cyanotic Congenital Heart Diseases).' };
  if (/kawasaki disease.*thrombocytopenia/i.test(text)) return { to: 605, reason: 'Kawasaki disease features belong to Pediatrics (Paediatric Rheumatology).' };
  if (/exclusive breastfeeding recommended/i.test(text) && q.module_id === 535) return { to: 580, reason: 'Exclusive breastfeeding duration belongs to Pediatrics (Nutrition and Breastfeeding).' };
  if (/4-year-old boy.*early development of pubic hair/i.test(text)) return { to: 603, reason: 'Precocious puberty in young boys belongs to Pediatrics (Disorders of Puberty).' };
  if (/hbig is indicated for newborn infants of hbsag-positive/i.test(text)) return { to: 575, reason: 'Newborn management of hepatitis B exposure belongs to Pediatrics (Basics of Neonatology).' };
  if (/7-month-old child who has a hemoglobi.*severe microcytic hypochromic anem/i.test(text)) return { to: 607, reason: 'Severe infantile anemia workup belongs to Pediatrics (Paediatric Anemias).' };
  
  if (/alveolar hypoventilation.*paco2.*dyspnea, tachycardia, confusion/i.test(text)) return { to: 417, reason: 'Alveolar hypoventilation and respiratory failure belong to Medicine (Respiratory Medicine).' };
  if (/bone pain and hepatosplenomegaly.*gaucher/i.test(text)) return { to: 443, reason: 'Gaucher disease bone marrow findings belong to Medicine (Hematology) / Pathology.' };
  if (/nephrotic syndrome diagnosed when she was.*membranous|fsgs|minimal change/i.test(text) && !/pregnancy|preeclampsia/i.test(text)) return { to: 449, reason: 'Nephrotic syndrome in adults belongs to Medicine (Nephrology).' };
  if (/diabetes insipidus|nephrogenic diabetes insipidus|desmopressin.*diabetes insipidus/i.test(text) && q.module_id === 554) return { to: 458, reason: 'Diabetes insipidus evaluation and treatment belong to Medicine (Endocrinology).' };
  if (/42-year-old man presents with headaches, excessive sweating, galactorrhoea, polyuria and polydipsia/i.test(text)) return { to: 458, reason: 'Male prolactinoma belongs to Medicine (Endocrinology).' };
  if (/paraneoplastic syndromes in bronchogenic carcinoma|54-year-old chronic smoker presents with polyuria/i.test(text) && q.module_id === 554) return { to: 418, reason: 'Paraneoplastic syndromes in lung cancer belong to Medicine (Respiratory Medicine).' };
  if (/hemochromatosis.*dark skinned.*bronzing of skin/i.test(text) && q.module_id === 554) return { to: 437, reason: 'Hemochromatosis belongs to Medicine (Gastroenterology / Hepatology).' };
  if (/nutmeg liver.*right sided heart failure/i.test(text)) return { to: 129, reason: 'Nutmeg liver in right heart failure belongs to Pathology (Hemodynamics) / Medicine.' };
  if (/lymphedema precox.*onset b\/w ages 1 year and 35 years/i.test(text)) return { to: 528, reason: 'Lymphedema praecox belongs to Surgery (Lymphatic System).' };
  if (/coeliac plexus block.*diarrhea and hypotension/i.test(text)) return { to: 623, reason: 'Celiac plexus block belongs to Anaesthesia (Regional Anaesthesia / Pain Management).' };
  if (/half-life of iodine 131/i.test(text)) return { to: 737, reason: 'Iodine-131 physical half-life belongs to Radiology (Nuclear Medicine).' };
  if (/premature ejaculation is seen in which phase/i.test(text)) return { to: 718, reason: 'Premature ejaculation belongs to Psychiatry (Human Sexuality).' };
  if (/low bmi, fatigue, weakness.*amenorrhea.*constant worry about/i.test(text) && /anorexia/i.test(text)) return { to: 715, reason: 'Anorexia nervosa belongs to Psychiatry (Eating Disorders).' };
  if (/risk factors for carcinoma gall bladder/i.test(text)) return { to: 492, reason: 'Carcinoma gallbladder risk factors belong to Surgery (Gallbladder and Bile Ducts).' };
  if (/screening procedure is best for ca of -.*colon/i.test(text)) return { to: 498, reason: 'Colorectal cancer screening belongs to Surgery (Colorectal) / Medicine.' };
  if (/breast cancer.*most common malignancy in women/i.test(text) && q.module_id === 571) return { to: 487, reason: 'Breast cancer epidemiology and risk factors belong to Surgery (Carcinoma Breast).' };
  if (/gynecomastia|gynaecomastia is seen in all of the following/i.test(text) && q.module_id === 555) return { to: 486, reason: 'Gynecomastia causes and evaluation belong to Surgery (Breast) / Medicine.' };
  if (/transovarian transmission.*yellow fever|transovarian transmission of infection occurs in/i.test(text)) return { to: 217, reason: 'Transovarial transmission of arboviruses belongs to Microbiology (General Virology / Arboviruses).' };

  return null;
}

console.log('Testing classify function...');
let count = 0;
rawQuestions.forEach(q => {
  const res = classify(q);
  if (res && res.to !== q.module_id) {
    count++;
  }
});
console.log(`Found ${count} non-OBG questions.`);
process.exit(0);
