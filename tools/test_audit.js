const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ob_g_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

console.log(`Loaded ${rawQuestions.length} questions and ${allModules.length} modules.`);

// Helper function to search text
function matches(q, regex) {
  const text = `${q.question_text || ''} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${q.option_e || ''} ${q.explanation || ''}`;
  return regex.test(text);
}

// Function to classify a question
function evaluateQuestion(q) {
  const currentMod = q.module_id;
  const qText = q.question_text || '';
  const exp = q.explanation || '';
  const fullText = `${qText} ${q.option_a || ''} ${q.option_b || ''} ${q.option_c || ''} ${q.option_d || ''} ${exp}`;

  // Let's define precise rules

  // --- NON-OBG TOPICS ---
  // 1. Pure General Pharmacology
  if (matches(q, /Cimetidine.*S\/E|side effect of Cimetidine/i)) {
    return { toModule: 260, reason: 'Adverse effects of cimetidine belong to Pharmacology (Gastrointestinal Drugs).' };
  }
  if (matches(q, /Ezetimibe|Antilipidemic.*inhibiting absorption/i)) {
    return { toModule: 247, reason: 'Ezetimibe and cholesterol absorption inhibitors belong to Pharmacology (Cardiovascular / Hypolipidemic Drugs).' };
  }
  if (matches(q, /Terbinafine|Antifungal which can be used orally but not iv/i)) {
    return { toModule: 238, reason: 'Antifungal pharmacokinetics (Terbinafine) belong to Pharmacology (Antifungal Drugs).' };
  }
  if (matches(q, /Rosuvastatin|Most potent statin/i)) {
    return { toModule: 247, reason: 'Statin pharmacology and potency comparison belong to Pharmacology (Cardiovascular / Hypolipidemic Drugs).' };
  }
  if (matches(q, /Low molecular weight heparin mainly inhibits which factor/i)) {
    return { toModule: 246, reason: 'LMWH mechanism of action (Factor Xa inhibition) belongs to Pharmacology (Hematology / Anticoagulants).' };
  }
  if (matches(q, /interaction with warfarin except.*Benzodiazep/i)) {
    return { toModule: 246, reason: 'Warfarin drug-drug interactions belong to Pharmacology (Hematology / Anticoagulants).' };
  }
  if (matches(q, /Pyrimethamine|antimalarial is a slow acting schizonticide/i)) {
    return { toModule: 236, reason: 'Antimalarial mechanism and classification (Pyrimethamine) belong to Pharmacology (Antimalarials).' };
  }
  if (matches(q, /Red man syndrome.*Vancomycin/i)) {
    return { toModule: 239, reason: 'Vancomycin adverse effects (Red man syndrome) belong to Pharmacology (Antibacterial Agents).' };
  }
  if (matches(q, /Sulphonamide.*decrease in folic acid.*Competitive inhibition/i)) {
    return { toModule: 235, reason: 'Sulfonamide mechanism of action belongs to Pharmacology (Antimicrobial Agents).' };
  }
  if (matches(q, /Moxalactam.*hypoprothrombinemia|Bleeding is seen with the use of -.*Moxalactam/i)) {
    return { toModule: 239, reason: 'Cephalosporin/moxalactam induced hypoprothrombinemia and bleeding belong to Pharmacology (Antibacterial Agents).' };
  }

  // 2. Pure PSM / Community Medicine
  if (matches(q, /National Leprosy Eradication Programme|NLEP/i)) {
    return { toModule: 377, reason: 'National Leprosy Eradication Programme (NLEP) belongs to PSM (National Health Programmes II - NLEP, NTEP & NACO).' };
  }
  if (matches(q, /Kartar Singh committee|Multi-purpose worker scheme/i)) {
    return { toModule: 404, reason: 'Multi-purpose worker scheme and Kartar Singh Committee belong to PSM (Health Planning and Management).' };
  }
  if (matches(q, /High sensitive.*Low False negative|True positive is directly related to sensitivity/i)) {
    return { toModule: 362, reason: 'Epidemiological screening test parameters (sensitivity, specificity, predictive values) belong to PSM (Epidemiology - Screening of Disease).' };
  }
  if (matches(q, /Best indicator of availability.*health services.*IMR/i)) {
    return { toModule: 380, reason: 'Infant Mortality Rate (IMR) as a health indicator belongs to PSM (Demography II: Demographic Indicators).' };
  }
  if (matches(q, /Direct cash transfer scheme to adolescent girls|Rajiv Gandhi Scheme.*SABLA/i)) {
    return { toModule: 378, reason: 'Adolescent health and nutrition schemes (SABLA) belong to PSM (National Health Programmes III).' };
  }
  if (matches(q, /Highest funding for reproductive health is by.*UNFPA/i)) {
    return { toModule: 402, reason: 'International health agencies (UNFPA) funding reproductive health belong to PSM (International Health).' };
  }
  if (matches(q, /Perinatal mortality includes deaths/i)) {
    return { toModule: 380, reason: 'Definition and calculation of perinatal mortality rate belong to PSM (Demography II: Demographic Indicators).' };
  }
  if (matches(q, /BMI of an overweight female|overweight.*BMI.*25/i) && currentMod === 531) {
    return { toModule: 385, reason: 'Body Mass Index classification for nutritional status belongs to PSM (Nutrition and Health) / Medicine.' };
  }

  // 3. Pure Pediatrics
  if (matches(q, /Diarrhoea in a child of 12 month.*dose of Zinc/i)) {
    return { toModule: 592, reason: 'Zinc supplementation in pediatric diarrhea belongs to Pediatrics (Medical GI Disorders).' };
  }
  if (matches(q, /cyanotic spells.*systolic murmur.*TOF|CXR boot shaped heart/i)) {
    return { toModule: 598, reason: 'Tetralogy of Fallot presentation and CXR features belong to Pediatrics (Cyanotic Congenital Heart Diseases).' };
  }
  if (matches(q, /Kawasaki disease.*Thrombocytopenia/i)) {
    return { toModule: 605, reason: 'Kawasaki disease clinical features and lab findings belong to Pediatrics (Paediatric Rheumatology) / Medicine.' };
  }
  if (matches(q, /exclusive breastfeeding recommended/i) && currentMod === 535) {
    return { toModule: 580, reason: 'Recommended duration of exclusive breastfeeding belongs to Pediatrics (Nutrition and Breastfeeding).' };
  }
  if (matches(q, /4-year-old boy.*early development of pubic hair|precocious puberty in boy/i) && currentMod === 535) {
    return { toModule: 603, reason: 'Evaluation of precocious puberty in young boys belongs to Pediatrics (Disorders of Puberty).' };
  }
  if (matches(q, /HBIG is indicated for newborn infants of HBsAg-positive mothers/i) && currentMod === 562) {
    return { toModule: 575, reason: 'Management of neonates born to HBsAg-positive mothers belongs to Pediatrics (Basics of Neonatology and Routine Newborn Care).' };
  }

  // 4. Pure General Medicine
  if (matches(q, /30-year-old female.*dyspnea, tachycardia, confusion.*Alveolar hypoventilation.*Paco2/i)) {
    return { toModule: 417, reason: 'Respiratory failure with alveolar hypoventilation and arterial blood gas analysis belongs to Medicine (Respiratory Medicine).' };
  }
  if (matches(q, /Patient presented with anemia, bone pain and hepatosplenomegaly.*Gaucher|Gaucher cells/i)) {
    return { toModule: 443, reason: 'Lysosomal storage disorders / Gaucher disease presentation belongs to Medicine (Hematology) / Pathology.' };
  }
  if (matches(q, /nephrotic syndrome diagnosed when she was.*Membranous|FSGS|Minimal change/i) && !matches(q, /pregnancy|preeclampsia|eclampsia/i)) {
    return { toModule: 449, reason: 'Nephrotic syndrome pathology and management in adults belong to Medicine (Nephrology).' };
  }
  if (matches(q, /Diabetes insipidus|nephrogenic diabetes insipidus|desmopressin.*diabetes insipidus/i) && currentMod === 554) {
    return { toModule: 458, reason: 'Central and nephrogenic diabetes insipidus evaluation and desmopressin treatment belong to Medicine (Endocrinology).' };
  }
  if (matches(q, /42-year-old man presents with headaches, excessive sweating, galactorrhoea, polyuria and polydipsia/i) && currentMod === 554) {
    return { toModule: 458, reason: 'Male prolactinoma / pituitary adenoma evaluation belongs to Medicine (Endocrinology).' };
  }
  if (matches(q, /Paraneoplastic syndromes in bronchogenic carcinoma|54-year-old chronic smoker presents with polyuria, polydipsia and altered sensorium/i) && currentMod === 554) {
    return { toModule: 418, reason: 'Paraneoplastic endocrine syndromes of bronchogenic carcinoma belong to Medicine (Respiratory / Oncology).' };
  }
  if (matches(q, /hemochromatosis.*dark skinned.*bronzing of skin.*polyuria, polydipsia/i) && currentMod === 554) {
    return { toModule: 437, reason: 'Hemochromatosis (bronze diabetes) presentation and pathogenesis belong to Medicine (Gastroenterology / Hepatology).' };
  }
  if (matches(q, /Nutmeg liver.*Right sided heart failure/i)) {
    return { toModule: 129, reason: 'Nutmeg liver caused by chronic passive hepatic congestion in right heart failure belongs to Pathology (Hemodynamics) / Medicine.' };
  }
  if (matches(q, /Lymphedema precox.*onset b\/w ages 1 year and 35 years/i) && currentMod === 531) {
    return { toModule: 528, reason: 'Primary lymphedema / lymphedema praecox diagnosis and management belong to Surgery (Lymphatic System).' };
  }
  if (matches(q, /coeliac plexus block.*diarrhea and hypotension/i)) {
    return { toModule: 623, reason: 'Celiac plexus neurolytic block technique and adverse effects belong to Anaesthesia (Regional Anaesthesia / Pain Management).' };
  }
  if (matches(q, /Half-life of Iodine 131/i)) {
    return { toModule: 737, reason: 'Physical half-life of radioisotopes (Iodine-131) belongs to Radiology (Nuclear Medicine).' };
  }
  if (matches(q, /Premature ejaculation is seen in which phase/i) && currentMod === 535) {
    return { toModule: 718, reason: 'Premature ejaculation and phases of human sexual response cycle belong to Psychiatry (Human Sexuality).' };
  }
  if (matches(q, /low BMI, fatigue, weakness.*amenorrhea.*constant worry about/i) && matches(q, /Anorexia/i) && currentMod === 531) {
    return { toModule: 715, reason: 'Anorexia nervosa with secondary amenorrhea belongs to Psychiatry (Eating Disorders).' };
  }

  // Return null if none of the above
  return null;
}

const evaluated = rawQuestions.map(q => {
  const ev = evaluateQuestion(q);
  return ev ? { id: q.id, fromModule: q.module_id, toModule: ev.toModule, reason: ev.reason } : null;
}).filter(Boolean);

console.log(`Initial non-OBG filter flagged: ${evaluated.length} questions.`);
process.exit(0);
