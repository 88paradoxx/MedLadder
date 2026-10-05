const fs = require('fs');
const path = require('path');

const allQuestions = JSON.parse(fs.readFileSync('tools/live_psm_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = {};
allModules.forEach(m => {
  modMap[m.moduleId] = m;
});

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

const questions = allQuestions.map(q => {
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
  const qAndAns = `${qText} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    qText,
    optA, optB, optC, optD, optE,
    ansLetter,
    ansText,
    expl,
    full,
    qAndAns
  };
});

console.log(`Loaded ${questions.length} questions for PSM audit.`);

// Comprehensive Classifier
function auditQuestion(q) {
  const full = q.full;
  const cur = q.currentModule;
  const qText = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();
  const qAndAns = q.qAndAns;

  const has = (...terms) => terms.some(t => full.includes(t.toLowerCase()));
  const qHas = (...terms) => terms.some(t => qText.includes(t.toLowerCase()));
  const ansHas = (...terms) => terms.some(t => ans.includes(t.toLowerCase()));
  const qAnsHas = (...terms) => terms.some(t => qAndAns.includes(t.toLowerCase()));

  // -------------------------------------------------------------
  // PART A: RELOCATION TO OUTSIDE SUBJECTS (NON-PSM)
  // -------------------------------------------------------------

  // --- 1. PEDIATRICS ---
  // Pure developmental milestones (576: Pediatrics: Growth and Development)
  if ((qHas('milestone', 'age of attainment') || (qHas('child', 'infant', 'months') && (ansHas('months', 'year') || qHas('develop')))) &&
      (has('neck holding', 'social smile', 'rolls over', 'sits without support', 'sits with support', 'pincer grasp', 'stranger anxiety', 'babbles', 'stands alone', 'walks alone', 'climbs stairs', 'runs', 'speaks 2-3 words', 'names body parts') ||
       qAnsHas('pincer grasp', 'social smile', 'neck holding', 'sitting without support', 'monosyllables')) &&
      !has('road to health', 'growth chart', 'gomez', 'waterlow', 'rbsk', 'uip')) {
    return { toModule: 576, reason: 'Tests normal developmental milestones in child development, which belongs in Pediatrics: Growth and Development' };
  }

  // Pure acute pediatric clinical conditions
  if (qAnsHas('foreign body aspiration', 'foreign body in bronchus') && has('sudden', 'breathlessness', 'choking', 'peanut', 'playing') && !has('epidemiology')) {
    return { toModule: 586, reason: 'Tests clinical diagnosis and acute management of pediatric foreign body aspiration, belongs in Pediatrics: Respiratory Disorders' };
  }

  if (has('cyanotic heart disease', 'tetralogy of fallot', 'ventricular septal defect', 'patent ductus arteriosus', 'coarctation of aorta') &&
      (qHas('murmur', 'cyanosis', 'boot shaped heart', 'machinery murmur') || ansHas('fallot', 'vsd', 'pda', 'coarctation')) &&
      !has('rbsk', 'birth defects', 'screening', 'epidemiology')) {
    return { toModule: 587, reason: 'Tests clinical presentation and hemodynamic diagnosis of congenital heart disease, belongs in Pediatrics: Cardiovascular Disorders in Children' };
  }

  // --- 2. OBSTETRICS & GYNAECOLOGY ---
  if (qAnsHas('bishop score', "bishop's score") && has('inducibility', 'cervical', 'dilation', 'effacement')) {
    return { toModule: 534, reason: "Tests Bishop's score for cervical assessment before induction of labor, belongs in OB & G: Normal Labor" };
  }

  if (qAnsHas('bimanual compression', 'uterine balloon tamponade', 'bakri balloon', 'condom tamponade', 'b-lynch suture') && has('postpartum hemorrhage', 'atonic pph', 'pph')) {
    return { toModule: 540, reason: 'Tests active surgical/mechanical management of postpartum hemorrhage, belongs in OB & G: Postpartum Hemorrhage' };
  }

  if (qAnsHas('pritchard regimen', 'zuspan regimen', 'magnesium sulphate toxicity', 'patellar reflex lost') && has('eclampsia', 'preeclampsia')) {
    return { toModule: 538, reason: 'Tests pharmacological magnesium sulfate regimens for eclampsia, belongs in OB & G: Hypertensive Disorders in Pregnancy' };
  }

  // --- 3. MICROBIOLOGY ---
  // Pure culture media
  if (qAnsHas('lowenstein-jensen', 'lowenstein jensen', 'l.j medium', 'lj medium') && (qHas('culture', 'medium', 'agar') || ansHas('lowenstein', 'lj')) && !has('ntep', 'rntcp', 'dots', 'national program')) {
    return { toModule: 197, reason: 'Tests microbiological culture medium (Lowenstein-Jensen) for Mycobacterium tuberculosis, belongs in Microbiology: Mycobacterium' };
  }

  if (qAnsHas('albert stain', "albert's stain", 'volutin granules', 'metachromatic granules', 'babes ernst') && has('diphtheria', 'corynebacterium', 'granules')) {
    return { toModule: 196, reason: "Tests microbiological staining and identification of metachromatic granules of Corynebacterium diphtheriae, belongs in Microbiology: Corynebacterium" };
  }

  if (qAnsHas('elek test', "elek's test") && has('diphtheria', 'toxigenicity')) {
    return { toModule: 196, reason: 'Tests in vitro toxigenicity testing (Elek test) for C. diphtheriae, belongs in Microbiology: Corynebacterium' };
  }

  if (qAnsHas('drumstick appearance', 'drum stick appearance', 'drumstick spores') && has('tetani', 'tetanus', 'spore')) {
    return { toModule: 198, reason: 'Tests microscopic morphology of Clostridium tetani drumstick terminal spores, belongs in Microbiology: Clostridium' };
  }

  if (qAnsHas('tcbs agar', 'thiosulfate citrate bile salts', 'darting motility', 'string test') && has('vibrio', 'cholera')) {
    return { toModule: 199, reason: 'Tests selective isolation medium (TCBS) and motility of Vibrio cholerae, belongs in Microbiology: Vibrio and Campylobacter' };
  }

  if (qAnsHas('nagler reaction', 'stormy fermentation') && has('clostridium perfringens', 'welchii')) {
    return { toModule: 198, reason: 'Tests biochemical identification (Nagler reaction) of Clostridium perfringens, belongs in Microbiology: Clostridium' };
  }

  if (qAnsHas('negri bodies', 'negri body') && has('rabies', 'hippocampus', 'purkinje', 'inclusion')) {
    return { toModule: 211, reason: 'Tests diagnostic pathognomonic Negri inclusion bodies of Rabies, belongs in Microbiology: Rabies and Arboviruses' };
  }

  if (qAnsHas('bile stained egg', 'bile-stained', 'unsegmented ovum', 'mammillated coat') && has('ascaris', 'egg', 'ovum')) {
    return { toModule: 220, reason: 'Tests parasitological egg morphology of Ascaris lumbricoides, belongs in Microbiology: Nematodes' };
  }

  if (qAnsHas('amastigote', 'ld body', 'leishman donovan body') && has('kala-azar', 'kala azar', 'leishmania') && (qHas('morphology', 'form found in', 'stage') || ansHas('amastigote', 'ld body')) && !has('nvbdcp', 'vector', 'sandfly')) {
    return { toModule: 217, reason: 'Tests morphological identification of Leishmania amastigote form (LD bodies), belongs in Microbiology: Protozoa' };
  }

  // --- 4. FORENSIC MEDICINE ---
  if (qAnsHas('rigor mortis', 'livor mortis', 'algor mortis', 'postmortem staining', 'post-mortem staining', 'cadaveric spasm', 'adipocere', 'mummification') &&
      has('postmortem', 'time since death', 'autopsy', 'stiffening of body', 'cooling of body', 'hypostasis')) {
    return { toModule: 273, reason: 'Tests thanatology and postmortem changes for estimating time since death, belongs in Forensic Medicine: Thanatology' };
  }

  if (qAnsHas('diatom test', 'diatoms', "gettler's test") && has('drowning', 'water', 'femur', 'bone marrow')) {
    return { toModule: 277, reason: 'Tests diagnostic test for antemortem drowning (diatom test), belongs in Forensic Medicine: Asphyxial Deaths' };
  }

  if (qAnsHas('rule of haase', "haase's rule") && has('gestational age', 'fetus length', 'crown-heel')) {
    return { toModule: 278, reason: "Tests Haase's rule for fetal gestational age determination from length, belongs in Forensic Medicine: Forensic Entomology and Fetal Age" };
  }

  if (qAnsHas('res ipsa loquitur', 'bolam test', 'medical negligence', 'civil negligence', 'criminal negligence', 'ipc 304a', 'ipc 320', 'grievous hurt') &&
      !has('factories act', 'esi act', 'workmen')) {
    return { toModule: 291, reason: 'Tests legal concepts of medical negligence and Indian Penal Code sections, belongs in Forensic Medicine: Medical Jurisprudence' };
  }

  // --- 5. ENT ---
  if (qAnsHas('rinne test', 'weber test', 'schwabach test', 'tuning fork test') && has('air conduction', 'bone conduction', 'conductive hearing loss', 'sensorineural')) {
    return { toModule: 293, reason: 'Tests clinical tuning fork examination of hearing, belongs in ENT: Examination and Physiology of Ear' };
  }

  if (qAnsHas('carhart notch', "carhart's notch") && has('otosclerosis', 'audiogram', 'bone conduction', '2000 hz', '2 khz')) {
    return { toModule: 298, reason: "Tests audiometric hallmark (Carhart's notch at 2 kHz) of otosclerosis, belongs in ENT: Diseases of Middle Ear" };
  }

  // --- 6. OPHTHALMOLOGY ---
  if (qAnsHas('argon laser trabeculoplasty', 'selective laser', 'trabeculectomy', 'gonioscopy') && has('glaucoma', 'intraocular pressure', 'angle')) {
    return { toModule: 334, reason: 'Tests gonioscopic grading and surgical/laser management of glaucoma, belongs in Ophthalmology: Glaucoma' };
  }

  if (qAnsHas('phacoemulsification', 'sics', 'ecce', 'intraocular lens', 'srk formula', 'iol calculation') &&
      has('cataract', 'lens') && !has('vision 2020', 'npcb', 'definition of blindness', 'causes of blindness in india')) {
    return { toModule: 333, reason: 'Tests cataract surgical extraction techniques and IOL power calculation formulas, belongs in Ophthalmology: Diseases of Lens' };
  }

  // --- 7. MEDICINE ---
  if (qAnsHas('st elevation', 'st segment elevation', 'troponin i', 'acute myocardial infarction', 'inferior wall mi', 'anterior wall mi') &&
      (has('lead ii', 'lead iii', 'avf', 'v1-v4', 'ecg shows', 'coronary angiogram') || qHas('ecg', 'lead'))) {
    return { toModule: 412, reason: 'Tests clinical electrocardiographic localization and management of acute myocardial infarction, belongs in Medicine: Coronary Artery Disease' };
  }

  // -------------------------------------------------------------
  // PART B: INTERNAL PSM CLASSIFICATION (Modules 355 to 410)
  // -------------------------------------------------------------

  // --- Module 396: Biomedical Waste Management ---
  if (has('biomedical waste', 'bio-medical waste', 'bmw rules', 'bmw management', 'yellow bag', 'red bag', 'blue box', 'white translucent', 'color coded bag', 'colour coded bag', 'sharps container', 'cytotoxic waste', 'anatomical waste', 'soiled waste', 'disposal of placenta', 'disposal of amputated', 'disposal of blood bag', 'disposal of iv tubing', 'disposal of needles', 'disposal of scalpel', 'disposal of syringe', 'discarded medicines', 'disposal of expired medicine', 'mercury spill management', 'autoclaving and shredding', 'plasma pyrolysis') ||
      (qAnsHas('yellow bag', 'red bag', 'blue bag', 'white bag', 'puncture proof') && has('waste', 'bin', 'discard', 'bag'))) {
    if (cur !== 396) {
      return { toModule: 396, reason: 'Tests Biomedical Waste Management categories, color-coded bags/containers, or treatment methods under BMW Rules 2016' };
    }
    return null;
  }

  // --- Module 398: Occupational Health Diseases ---
  if (has('pneumoconiosis', 'silicosis', 'asbestosis', 'byssinosis', 'bagassosis', "farmer's lung", 'farmers lung', 'anthracosis', 'coal worker', 'berylliosis', 'siderosis', 'chalicosis', 'occupational hazard', 'occupational lung', 'occupational cancer', 'lead poisoning', 'plumbism', 'burtonian line', 'basophilic stippling', 'coproporphyrin', 'sickness absenteeism', 'ergonomics', 'monday morning fever', 'sugarcane dust', 'cotton dust', 'silica dust', 'asbestos bodies', 'egg shell calcification', 'snow storm appearance', 'factories act', 'esi act', 'employees state insurance', 'employees compensation act', 'workmen compensation') &&
      !has('water treatment', 'pqli', 'hdi')) {
    if (cur !== 398) {
      return { toModule: 398, reason: 'Tests occupational health, occupational lung diseases (pneumoconioses), occupational hazards, lead poisoning, or occupational legislation (Factories/ESI Act)' };
    }
    return null;
  }

  // --- Module 384: Food Quality and Processing ---
  if (has('lathyrism', 'khesari dal', 'kesari dal', 'boaa', 'beta-oxalyl', 'neurolathyrism', 'epidemic dropsy', 'argemone mexicana', 'argemone oil', 'sanguinarine', 'nitric acid test', 'paper chromatography test', 'pasteurization', 'holder method', 'htst method', 'phosphatase test', 'methylene blue reduction test', 'mbrt', 'turbidity test', 'bovine tuberculosis in milk', 'adulteration of milk', 'food adulteration', 'fssai', 'codex alimentarius', 'agmark', 'aflatoxin', 'aspergillus flavus', 'ergotism', 'claviceps purpurea', 'food fortification standards', 'parboiling of rice') ||
      (qAnsHas('lathyrism', 'epidemic dropsy', 'pasteurization', 'phosphatase test', 'boaa', 'argemone') && has('milk', 'dal', 'oil', 'toxin', 'adulterat', 'food'))) {
    if (cur !== 384) {
      return { toModule: 384, reason: 'Tests food quality, food processing, food adulteration (argemone/lathyrism/aflatoxin), or milk pasteurization standards' };
    }
    return null;
  }

  // --- Module 381: Family Planning ---
  if (has('contracepti', 'copper-t', 'copper t', 'cu-t', 'cut 380', 'cut-380', 'cut 375', 'lng-ius', 'mirena', 'iud', 'iucd', 'intrauterine device', 'pearl index', 'oral contraceptive', 'combined oral contraceptive', 'mala-d', 'mala-n', 'centchroman', 'saheli', 'chhaya', 'antrogel', 'depo-provera', 'dmpa', 'antara program', 'net-en', 'norplant', 'implanon', 'emergency contracept', 'morning after pill', 'levonorgestrel 1.5', 'barrier method', 'condom', 'diaphragm', 'cervical cap', 'vasectomy', 'no scalpel vasectomy', 'nsv', 'tubectomy', 'minilap', 'laparoscopic sterilization', 'couple protection rate', 'unmet need for family planning', 'medical termination of pregnancy', 'mtp act') ||
      (qAnsHas('copper t', 'iud', 'iucd', 'pearl index', 'vasectomy', 'tubectomy', 'oral contraceptive pill', 'saheli', 'chhaya', 'mala d', 'mirena') && has('contracept', 'family planning', 'pregnancy prevention', 'sterilization', 'failure rate'))) {
    if (cur !== 381) {
      return { toModule: 381, reason: 'Tests contraception and family planning methods (IUCD, hormonal pills, injectables, sterilization, Pearl index, or MTP Act)' };
    }
    return null;
  }

  // --- Module 383: Micronutrients and Water (Nutrition / Nutritional Deficiencies / Vitamins / Minerals) ---
  if (has('xerophthalmia', 'bitot spots', "bitot's spots", 'keratomalacia', 'night blindness due to vitamin a', 'vitamin a prophylaxis', 'vitamin a deficiency', 'pellagra', 'niacin deficiency', 'casal necklace', '4 ds of pellagra', 'beriberi', 'wet beriberi', 'dry beriberi', 'wernicke', 'thiamine deficiency', 'scurvy', 'vitamin c deficiency', 'rickets', 'osteomalacia', 'vitamin d deficiency', 'folic acid dose', 'folic acid dosage', 'neural tube defect prevention', 'iron folic acid', 'anemia mukt bharat', 'iodine deficiency', 'endemic goitre', 'iodized salt', 'urinary iodine', 'fluorosis', 'dental fluorosis', 'skeletal fluorosis', 'nalgonda technique', 'fluoride content in drinking water', 'kwashiorkor', 'marasmus', 'protein energy malnutrition', 'protein-energy malnutrition', 'net protein utilization', 'biological value of protein', 'reference indian man', 'reference indian woman', 'balanced diet rda', 'essential amino acid', 'limiting amino acid', 'mid-upper arm circumference', 'shakir tape', 'bengoa classification', 'gomez classification', 'waterlow classification', 'iap classification of malnutrition') ||
      (qAnsHas('pellagra', 'beriberi', 'folic acid', 'vitamin a', 'vitamin c', 'vitamin d', 'thiamine', 'niacin', 'kwashiorkor', 'marasmus', 'fluorosis') && has('deficiency', 'diet', 'intake', 'syndrome', 'rda', 'nutrition', 'malnutrition'))) {
    // If specifically National Iron Plus Initiative under National Health Programs 378
    if (cur !== 383 && !(cur === 378 && has('program', 'scheme', 'initiative'))) {
      return { toModule: 383, reason: 'Tests nutrition, micronutrients (vitamins, minerals), protein-energy malnutrition (PEM), or deficiency syndromes' };
    }
    if (cur === 383) return null;
  }

  // --- Module 377: National Health Programmes II - NLEP, NTEP & NACO ---
  if (has('nlep', 'national leprosy eradication', 'multidrug therapy for leprosy', 'paucibacillary leprosy', 'multibacillary leprosy', 'rom regimen', 'clofazimine', 'dapsone', 'rifampicin for leprosy', 'mitsuda reaction', 'lepromin test', 'ntep', 'rntcp', 'revised national tuberculosis', 'nikshay', 'cbnaat', 'truenat', 'dots therapy', 'dots category', 'presumptive tb', 'bacteriologically confirmed tb', 'isoniazid preventive therapy', 'ipt in tb', 'tpt in tb', 'bpalm regimen', 'mdr tb', 'xdr tb', 'line probe assay', 'second line att', 'daily regimen of tuberculosis', 'naco', 'national aids control', 'ictc', 'pptct', 'art centre', 'first line art', 'tlr regimen', 'tle regimen', 'post exposure prophylaxis for hiv', 'pep for hiv', '95-95-95', 'avahan program') ||
      ((has('tb', 'tuberculosis', 'anti tb', 'att') || has('leprosy', 'hansen') || has('hiv', 'aids', 'art drug')) &&
       (has('guideline', 'program', 'regimen', 'dots', 'nikshay', 'cbnaat', 'truenat', 'mdr', 'xdr', 'naco', 'nlep', 'ictc', 'pptct') || qHas('national tuberculosis', 'daily regimen', 'fixed dose combination', 'mdr tb', 'bacteriologically confirmed')))) {
    if (cur !== 377) {
      return { toModule: 377, reason: 'Tests National Health Programmes for major communicable diseases: NLEP (Leprosy), NTEP (Tuberculosis), or NACO (HIV/AIDS)' };
    }
    return null;
  }

  // --- Module 376: National Health Programmes I - NVBDCP ---
  if (has('nvbdcp', 'national vector borne', 'annual parasite incidence', 'api < 1', 'annual blood examination rate', 'aber', 'slide positivity rate', 'spr', 'slide falciparum rate', 'sfr', 'act regimen', 'artemisinin combination therapy', 'mass drug administration for filaria', 'mda in filaria', 'dec and albendazole', 'ida regimen in filariasis', 'indoor residual spraying in malaria', 'llin distribution', 'malaria drug policy in india', 'primaquine in p. vivax', 'primaquine for 14 days') ||
      (has('malaria', 'plasmodium', 'falciparum', 'vivax') && (has('primaquine', 'chloroquine', 'artemisinin', 'act', 'chemoprophylaxis', 'first trimester', 'drug policy', 'api', 'aber', 'spr') || qHas('primaquine is given for a period of', 'doc for treatment of p. falciparum')))) {
    if (cur !== 376) {
      return { toModule: 376, reason: 'Tests National Vector Borne Disease Control Programme (NVBDCP) guidelines, indices (API, ABER, SPR), or malaria/filaria national drug policies' };
    }
    return null;
  }

  // --- Module 378: National Health Programmes III - NIS, JSY, RBSK and Others ---
  if (has('national immunization schedule', 'national immunisation schedule', 'uip schedule', 'routine immunization schedule in india', 'janani suraksha yojana', 'jsy incentive', 'janani shishu suraksha karyakram', 'jssk', 'pradhan mantri surakshit matritva abhiyan', 'pmsma', 'pmmvy', 'pradhan mantri matru vandana yojana', 'rashtriya bal swasthya karyakram', 'rbsk 4 ds', '4ds of rbsk', 'rashtriya kishor swasthya karyakram', 'rksk', 'weekly iron and folic acid', 'wifs', 'national iron plus initiative', 'nipi', 'integrated child development services', 'icds scheme', 'anganwadi worker services under icds', 'ayushman bharat', 'pm-jay', 'pmjay', 'health and wellness centre', 'ayushman arogya mandir', 'national health mission', 'nrhm', 'nuhm', 'idsp', 'integrated disease surveillance programme', 'npcdcs', 'suman scheme', 'laqshya') ||
      qAnsHas('pmmvy', 'jsy', 'jssk', 'pmsma', 'rbsk', 'rksk', 'wifs', 'icds', 'pmjay', 'ayushman bharat')) {
    if (cur !== 378) {
      return { toModule: 378, reason: 'Tests flagship National Health Programmes (NIS/UIP, RMNCH+A, JSY, PMMVY, RBSK, Ayushman Bharat, IDSP)' };
    }
    return null;
  }

  // --- Module 379: Demography I: Demographic Cycle, Annual Growth Rate and Age Pyramid ---
  if (has('demographic cycle', 'stages of demographic cycle', 'early expanding', 'late expanding', 'high stationary', 'low stationary', 'declining stage', 'annual growth rate', 'population growth rate', 'doubling time of population', 'demographic transition', 'demographic dividend', 'age sex pyramid', 'age pyramid', 'population pyramid', 'dependency ratio', 'young age dependency', 'old age dependency', 'sex ratio of india', 'child sex ratio') ||
      (qHas('growth rate', 'doubling time', 'age pyramid', 'population pyramid', 'demographic cycle', 'dependency ratio') && (ansHas('stage', 'growing', 'expanding', 'ratio', 'years') || qHas('birth rate', 'death rate')))) {
    if (cur !== 379) {
      return { toModule: 379, reason: 'Tests demography fundamentals: demographic cycle stages, population growth rates, doubling time, or age-sex pyramids' };
    }
    return null;
  }

  // --- Module 380: Demography II: Demographic Indicators ---
  if (has('crude birth rate', 'general fertility rate', 'total fertility rate', 'tfr', 'gross reproduction rate', 'grr', 'net reproduction rate', 'nrr = 1', 'nrr of 1', 'infant mortality rate', 'imr of', 'under-5 mortality rate', 'u5mr', 'maternal mortality ratio', 'maternal mortality rate', 'mmr', 'neonatal mortality rate', 'early neonatal mortality', 'post neonatal mortality', 'perinatal mortality rate', 'stillbirth rate', 'census in india', 'sample registration system', 'srs bulletin', 'civil registration system', 'national family health survey', 'nfhs-5', 'nfhs 5', 'vital statistics of india') ||
      (qHas('maternal mortality', 'infant mortality', 'total fertility rate', 'net reproduction rate', 'crude birth rate', 'sample registration system') && (ansHas('rate', 'ratio', 'nrr', 'tfr', 'imr', 'mmr') || qHas('indicator', 'definition')))) {
    if (cur !== 380 && !(cur === 356 && has('pqli', 'hdi', 'disability'))) {
      return { toModule: 380, reason: 'Tests demographic and vital health indicators (fertility rates, mortality indicators, census, SRS, NFHS)' };
    }
    if (cur === 380) return null;
  }

  // --- Module 382: Preventive Obstetrics, Paediatrics and Geriatrics ---
  if (has('antenatal care', 'anc visits', 'minimum anc visits', 'high risk pregnancy', 'exclusive breastfeeding', 'colostrum', 'baby friendly hospital', 'bfhi', 'road to health chart', 'growth chart designed by david morley', 'growth monitoring curve', 'growth faltering', 'imnci', 'integrated management of neonatal', 'pink yellow green triage', 'kangaroo mother care', 'low birth weight infant', 'vlbw', 'elbw', 'preventive geriatrics', 'problems of the elderly', 'active aging', 'falls in elderly') ||
      qAnsHas('road to health', 'growth chart', 'imnci', 'kangaroo mother care', 'exclusive breastfeeding', 'colostrum')) {
    if (cur !== 382 && !(cur === 378 && has('jsy', 'jssk', 'pmsma', 'suman', 'rbsk'))) {
      return { toModule: 382, reason: 'Tests preventive maternal and child health (ANC, breastfeeding, BFHI, growth charts, IMNCI, KMC, or preventive geriatrics)' };
    }
    if (cur === 382) return null;
  }

  // --- Module 374: Non-Communicable Diseases - Cardiovascular Diseases and Diabetes ---
  if (has('coronary heart disease epidemiology', 'rule of halves in hypertension', 'tracking of blood pressure', 'rheumatic heart disease prophylaxis', 'jones criteria in community', 'stroke epidemiology', 'diabetes mellitus epidemiology', 'impaired fasting glucose criteria', 'impaired glucose tolerance', 'metabolic syndrome criteria', 'atp iii criteria', 'framingham risk score') ||
      (has('hypertension', 'rheumatic fever', 'rheumatic heart', 'coronary artery', 'myocardial infarction') && (has('rule of halves', 'tracking of bp', 'secondary prophylaxis', 'jones criteria', 'risk factor') || qHas('tracking of blood pressure', 'rheumatic fever developed carditis')))) {
    if (cur !== 374) {
      return { toModule: 374, reason: 'Tests epidemiology, risk factors, screening, and public health prevention of Cardiovascular Diseases, Hypertension, or Diabetes' };
    }
    return null;
  }

  // --- Module 375: Non-Communicable Diseases - Cancer, Obesity and Blindness ---
  if (has('cancer registry', 'population based cancer registry', 'pbcr', 'hbcr', 'cervical cancer screening in community', 'via test', 'visual inspection with acetic acid', 'breast self examination', 'mammography screening', 'body mass index classification', 'who bmi cut offs for asians', 'waist circumference cut off', 'waist hip ratio', 'definition of blindness by who', 'npcb blindness criteria', 'visual acuity < 3/60', 'visual acuity < 6/60', 'causes of blindness in india', 'vision 2020: the right to sight', 'cataract blindness in india') ||
      (has('blindness', 'visual acuity', 'cancer registry', 'obesity', 'bmi', 'waist circumference') && (has('who definition', 'threshold for visual acuity', 'indicator of obesity', 'pbcr', 'hbcr') || qHas('threshold for visual acuity to define blindness', 'indicators of obesity', 'waist circumference')))) {
    if (cur !== 375) {
      return { toModule: 375, reason: 'Tests epidemiology and public health control of Cancer (registries/screening), Obesity (BMI/waist cut-offs), or Blindness (WHO/NPCB/Vision 2020)' };
    }
    return null;
  }

  // --- Module 387: Water - I: Sources and purification of water ---
  if (has('slow sand filter', 'biological filter', 'rapid sand filter', 'mechanical filter', 'schmutzdecke', 'vital layer', 'loss of head in filter', 'effective size of sand', 'uniformity coefficient', 'backwashing of filter', 'sanitary well', 'shallow well vs deep well', 'step well guinea worm', 'percolation tank', 'rainwater harvesting') ||
      (qHas('sand filter', 'slow sand', 'rapid sand', 'schmutzdecke', 'vital layer', 'well', 'water purification') && (ansHas('filter', 'sand', 'schmutzdecke', 'well', 'layer') || qHas('sand', 'water')))) {
    if (cur !== 387) {
      return { toModule: 387, reason: 'Tests water sources, well construction, and large-scale water purification systems (slow/rapid sand filters)' };
    }
    return null;
  }

  // --- Module 388: Water- II: Disinfection of water ---
  if (has('chlorination of water', 'break-point chlorination', 'breakpoint chlorination', 'free residual chlorine', 'chloramines', 'bleaching powder', 'chlorinated lime', 'available chlorine', 'horrocks apparatus', 'horrocks test', 'double pot method of chlorination', 'orthotolidine test', 'ot test', 'orthotolidine-arsenite test', 'ota test', 'chlorotex test', 'ozonation of water', 'ultraviolet disinfection of water') ||
      (qHas('chlorination', 'bleaching powder', 'horrocks', 'orthotolidine', 'ota test', 'free residual chlorine', 'breakpoint') && (ansHas('chlorine', 'powder', 'horrocks', 'test', 'residual') || qHas('water', 'chlorin')))) {
    if (cur !== 388) {
      return { toModule: 388, reason: 'Tests water disinfection methods (chlorination chemistry, bleaching powder calculation, Horrocks apparatus, OT/OTA tests)' };
    }
    return null;
  }

  // --- Module 389: Water- III: Water Quality and Standards ---
  if (has('hardness of water', 'temporary hardness', 'permanent hardness', 'removal of hardness', "clark's process", 'permutit process', 'base exchange process', 'coliform organisms in water', 'escherichia coli in water', 'faecal streptococci', 'clostridium perfringens in water', 'most probable number', 'mpn of coliforms', 'membrane filter technique for water', 'multiple tube method', 'water-borne diseases', 'water-washed diseases', 'water-based diseases', 'water-related insect vector diseases', 'fluoride level in drinking water', 'presumptive coliform test') ||
      (qHas('hardness of water', 'coliform', 'mpn', 'most probable number', 'water quality', 'water-borne', 'water washed') && (ansHas('coliform', 'mpn', 'hardness', 'water') || qHas('water')))) {
    if (cur !== 389) {
      return { toModule: 389, reason: 'Tests water quality criteria, bacteriological indicators (coliforms/MPN), water hardness, and water-related disease classification' };
    }
    return null;
  }

  // --- Module 390: Housing and Ventilation ---
  if (has('overcrowding standards', 'persons per room', 'floor space per person', 'criteria for healthful housing', 'kata thermometer', 'cooling power of air', 'globe thermometer', 'effective temperature', 'corrected effective temperature', 'thermal comfort indices', 'natural ventilation vs artificial ventilation', 'plenum ventilation', 'air changes per hour') ||
      (qHas('kata thermometer', 'cooling power of air', 'air velocity', 'overcrowding', 'ventilation') && (ansHas('kata thermometer', 'cooling power', 'velocity', 'overcrowd') || qHas('air', 'housing')))) {
    if (cur !== 390) {
      return { toModule: 390, reason: 'Tests standards of healthful housing, overcrowding criteria, ventilation, and thermal comfort indices (Kata thermometer)' };
    }
    return null;
  }

  // --- Module 391: Light, Sound and Radiation ---
  if (has('daylight factor', 'artificial lighting standards', 'glare in lighting', 'lux level', 'sound level meter', 'decibel scale', 'permissible noise exposure', 'temporary threshold shift', 'permanent threshold shift', 'acoustic trauma due to noise', 'presbycusis', 'radiation units', 'roentgen', 'gray', 'rad', 'rem', 'sievert', 'biological effects of radiation', 'radiation protection principles', 'alara principle', 'thermoluminescent dosimeter', 'tld badge', 'film badge') ||
      (qHas('decibel', 'noise pollution', 'lighting', 'daylight factor', 'tld badge', 'alara', 'radiation dose') && (ansHas('decibel', 'noise', 'lux', 'tld', 'sievert', 'gray') || qHas('sound', 'radiation')))) {
    if (cur !== 391) {
      return { toModule: 391, reason: 'Tests environmental physics in public health: illumination standards, noise pollution effects/decibels, or radiation safety (ALARA/TLD)' };
    }
    return null;
  }

  // --- Module 392: Waste and Sewage Disposal ---
  if (has('composting', 'bangalore method of composting', 'anaerobic composting', 'indore method of composting', 'aerobic composting', 'sanitary landfill', 'controlled tipping', 'pit latrine', 'ventilated improved pit', 'vip latrine', 'rca latrine', 'sulabh shauchalaya', 'water seal latrine', 'septic tank design', 'retention period of septic tank', 'sludge digestion', 'soakage pit', 'trickling filter', 'activated sludge process', 'biochemical oxygen demand', 'bod of sewage', 'chemical oxygen demand', 'cod of sewage', 'grit chamber', 'sewage effluent standards') ||
      (qHas('septic tank', 'latrine', 'composting', 'sanitary landfill', 'sewage', 'bod', 'cod') && (ansHas('septic tank', 'latrine', 'compost', 'landfill', 'sewage', 'bod') || qHas('disposal', 'waste')))) {
    if (cur !== 392 && cur !== 396) {
      return { toModule: 392, reason: 'Tests municipal solid waste disposal methods, sanitary latrines, septic tanks, and sewage treatment processes (BOD/COD)' };
    }
    if (cur === 392) return null;
  }

  // --- Module 393: Medical Entomology - Mosquitoes and Flies ---
  if (has('anopheles mosquito', 'culex mosquito', 'aedes mosquito', 'mansonia mosquito', 'resting posture of anopheles', 'resting posture of culex', 'cigar shaped eggs of anopheles', 'siphon tube of larva', 'tiger mosquito', 'tree hole breeder', 'musca domestica', 'housefly transmission', 'phlebotomus', 'sandfly morphology', 'kala-azar vector', 'tsetse fly', 'glossina', 'sleeping sickness vector', 'blackfly', 'simulium', 'river blindness vector', 'chrysops', 'deer fly') ||
      (qHas('anopheles', 'culex', 'aedes', 'mansonia', 'housefly', 'sandfly', 'phlebotomus', 'tsetse fly') && (has('mosquito', 'vector', 'resting posture', 'larva', 'egg', 'fly') || ansHas('anopheles', 'culex', 'aedes', 'sandfly')))) {
    if (cur !== 393 && !has('nvbdcp', 'drug policy', 'api', 'aber')) {
      return { toModule: 393, reason: 'Tests medical entomology of dipterans: mosquito morphology/habits (Anopheles, Culex, Aedes, Mansonia) and fly vectors' };
    }
    if (cur === 393) return null;
  }

  // --- Module 394: Medical Entomology - Ticks, Fleas and Mites ---
  if (has('hard tick', 'soft tick', 'ixodidae', 'argasidae', 'scutum of tick', 'capitulum visibility', 'kfd vector tick', 'haemaphysalis spinigera', 'rat flea', 'xenopsylla cheopis', 'xenopsylla astia', 'general flea index', 'cheopis index', 'flea index > 1', 'plague vector flea', 'trombiculid mite', 'leptotrombidium deliense', 'scrub typhus vector', 'sarcoptes scabiei', 'itch mite burrows', 'pediculus humanus', 'body louse', 'head louse', 'phthirus pubis', 'crab louse', 'cyclops intermediate host', 'guinea worm cyclops') ||
      (qHas('hard tick', 'soft tick', 'rat flea', 'cheopis index', 'flea index', 'trombiculid mite', 'louse', 'lice', 'cyclops') && (ansHas('tick', 'flea', 'mite', 'louse', 'cyclops') || qHas('vector', 'index')))) {
    if (cur !== 394) {
      return { toModule: 394, reason: 'Tests medical entomology of arachnids and wingless insects: ticks, rat fleas (Cheopis index), mites, lice, or Cyclops' };
    }
    return null;
  }

  // --- Module 395: Methods of Pest Control ---
  if (has('organochlorine insecticide', 'ddt spray', 'residual spray ddt', 'lindane', 'bhc', 'organophosphorus insecticide', 'malathion', 'fenthion', 'abate', 'temephos larvicide', 'propoxur', 'baygon', 'synthetic pyrethroid', 'deltamethrin', 'permethrin', 'cyfluthrin', 'larvicide vs adulticide', 'space spray vs residual spray', 'insecticide resistance mechanism', 'gambusia affinis', 'poecilia reticulata', 'guppy fish larvivorous', 'bacillus thuringiensis israelensis', 'source reduction of vectors') ||
      (qHas('insecticide', 'larvicide', 'ddt', 'malathion', 'temephos', 'abate', 'pyrethroid', 'gambusia', 'pest control') && (ansHas('insecticide', 'larvicide', 'ddt', 'malathion', 'spray', 'gambusia') || qHas('spray', 'control')))) {
    if (cur !== 395) {
      return { toModule: 395, reason: 'Tests pest and vector control methods: chemical insecticides (organochlorines, organophosphates, pyrethroids), larvicides, or biological controls (Gambusia)' };
    }
    return null;
  }

  // --- Module 397: Disaster Management ---
  if (has('disaster cycle', 'pre-disaster phase', 'disaster mitigation', 'disaster preparedness', 'disaster response', 'disaster triage', 'triage tag red', 'triage tag yellow', 'triage tag green', 'triage tag black', 'morgue tag in disaster', 'highest priority in triage', 'bioterrorism category a', 'bioterrorism category b', 'bioterrorism category c', 'anthrax in bioterrorism', 'smallpox in bioterrorism', 'botulism in bioterrorism', 'ndma guidelines', 'epidemiological surveillance in disaster') ||
      (qHas('disaster', 'bioterrorism', 'triage tag') && (ansHas('red', 'yellow', 'green', 'black', 'category a', 'mitigation', 'preparedness') || qHas('triage', 'agent')))) {
    if (cur !== 397) {
      return { toModule: 397, reason: 'Tests disaster management: disaster cycle phases, disaster color-coded triage (Red/Yellow/Green/Black), or bioterrorism category agents' };
    }
    return null;
  }

  // --- Module 399: Communication for Health Education ---
  if (has('health education communication', 'process of communication', 'sender receiver message channel', 'barriers to communication', 'didactic communication', 'socratic communication', 'one-way vs two-way communication', 'delphi technique in health', 'panel discussion', 'symposium in health education', 'role play in health', 'socio-drama', 'group discussion method', 'demonstration method', 'principles of health education', 'health belief model', 'stages of change model', 'trans-theoretical model', 'health propaganda vs health education', 'adoption of new ideas', 'health propaganda') ||
      (qHas('delphi technique', 'panel discussion', 'symposium', 'role play', 'socio-drama', 'health education', 'communication barrier', 'health propaganda') && (ansHas('communication', 'education', 'technique', 'panel', 'symposium', 'role play') || qHas('method', 'process')))) {
    if (cur !== 399) {
      return { toModule: 399, reason: 'Tests communication process, health education methods (panel, symposium, Delphi, role play), health behavior models, or education principles' };
    }
    return null;
  }

  // --- Module 400: Health Planning and Management ---
  if (has('health planning cycle', 'planning process steps', 'assessment of health resources', 'cost-accounting in management', 'pert method', 'program evaluation and review technique', 'cpm method', 'critical path method', 'network analysis in health', 'work sampling method', 'systems analysis in management', 'bhore committee', 'mudaliar committee', 'chadah committee', 'mukherjee committee', 'jungalwalla committee', 'kartar singh committee', 'multipurpose health worker scheme', 'shrivastav committee', 'reorientation of medical education', 'rome scheme', 'bajaj committee') ||
      (qHas('committee', 'pert', 'cpm', 'network analysis', 'planning cycle', 'bed turnover interval') && (ansHas('committee', 'pert', 'cpm', 'bhore', 'mudaliar', 'kartar singh', 'shrivastav', 'planning') || qHas('recommend', 'report')))) {
    if (cur !== 400) {
      return { toModule: 400, reason: 'Tests health planning cycle, management techniques (PERT, CPM, network analysis), or landmark Health Committees in India (Bhore, Mudaliar, Kartar Singh, etc.)' };
    }
    return null;
  }

  // --- Module 401: Healthcare in India ---
  if (has('subcentre population norm', 'sub-centre population', 'phc population norm', 'primary health centre population', 'chc population norm', 'community health centre population', 'staffing of phc', 'staffing of chc', 'medical officer at phc', 'asha worker population', 'asha incentives', 'roles of asha', 'anganwadi worker population', 'anm at subcentre', 'indian public health standards', 'iphs norms', 'first referral unit', 'fru criteria', 'village health sanitation and nutrition committee', 'vhsnc', 'health delivery system in india', 'three tier health system', 'urban primary health centre', 'uphc staffing', 'type-a primary health center', 'type-b primary health center', 'department of ayush') ||
      (qHas('primary health center', 'primary health centre', 'phc', 'chc', 'sub-centre', 'subcentre', 'asha', 'anganwadi', 'iphs', 'ayush') && (ansHas('population', 'asha', 'phc', 'chc', 'sub-centre', 'norm', 'delivery') || qHas('population', 'norm', 'deliveries', 'staff')))) {
    if (cur !== 401) {
      return { toModule: 401, reason: 'Tests the healthcare delivery system in India: population norms, staffing, and functions of Sub-centres, PHCs, CHCs, and frontline workers (ASHA/ANM)' };
    }
    return null;
  }

  // --- Module 402: International Health ---
  if (has('world health organization structure', 'world health assembly', 'who executive board', 'who headquarters in geneva', 'searo regional office', 'searo in new delhi', 'unicef gobi-fff', 'gobi strategy', 'food and agriculture organization', 'fao', 'international labour organization', 'ilo headquarters', 'international red cross', 'bilateral health agencies', 'usaid', 'sida', 'danida', 'international health regulations', 'yellow fever certificate validity', 'quarantine under ihr') ||
      (qHas('world health organization', 'who headquarters', 'searo', 'unicef', 'fao', 'ilo', 'red cross', 'international health regulations') && (ansHas('geneva', 'new delhi', 'unicef', 'who', 'fao', 'ilo', 'agency') || qHas('headquarters', 'structure', 'regional office')))) {
    if (cur !== 402) {
      return { toModule: 402, reason: 'Tests international health organizations (WHO, UNICEF, FAO, ILO, Red Cross) or International Health Regulations (IHR)' };
    }
    return null;
  }

  // --- Module 409: Mental Health ---
  if (has('national mental health programme', 'nmhp', 'district mental health programme', 'dmhp', 'mental healthcare act 2017', 'community psychiatry', 'epidemiology of depression in community', 'suicide prevention in community', 'alcohol dependence epidemiology in community') ||
      (qHas('mental healthcare act', 'nmhp', 'dmhp', 'mental health programme') && (ansHas('act', 'programme', 'mental', '2017') || qHas('act', 'programme')))) {
    if (cur !== 409) {
      return { toModule: 409, reason: 'Tests Community Mental Health programmes (NMHP/DMHP), the Mental Healthcare Act 2017, or community prevention of psychiatric disorders' };
    }
    return null;
  }

  // --- Module 385: Concepts of Sociology and Psychology ---
  if (has('family structure sociology', 'nuclear family vs joint family', 'three-generation family', 'socialization process', 'social pathology', 'culture and health', 'customs and traditions in health', 'social beliefs in disease', 'acculturation') ||
      (qHas('nuclear family', 'joint family', 'three generation family', 'socialization', 'culture and health') && (ansHas('family', 'social', 'culture') || qHas('family', 'sociology')))) {
    if (cur !== 385) {
      return { toModule: 385, reason: 'Tests concepts of medical sociology, family structures, culture, beliefs, and human behavior in relation to health' };
    }
    return null;
  }

  // --- Module 386: Social Organization and Economics ---
  if (has('kuppuswamy scale', 'modified kuppuswamy', 'bg prasad scale', 'modified bg prasad', 'udai pareek scale', 'consumer price index in bg prasad', 'social stratification', 'social mobility', 'poverty line criteria', 'cost-effective analysis', 'cost-benefit analysis', 'cost-utility analysis', 'cea vs cba', 'monetary units in cba', 'qaly gained in cua', 'health economics methods') ||
      (qHas('kuppuswamy', 'bg prasad', 'udai pareek', 'cost-effective analysis', 'cost-benefit analysis', 'cost-utility analysis', 'poverty line', 'social mobility') && (ansHas('scale', 'analysis', 'prasad', 'kuppuswamy', 'mobility', 'poverty') || qHas('scale', 'analysis', 'score')))) {
    if (cur !== 386) {
      return { toModule: 386, reason: 'Tests socioeconomic status classification scales (Kuppuswamy, BG Prasad), social stratification, and health economics (CEA, CBA, CUA)' };
    }
    return null;
  }

  // --- Biostatistics Modules (403 to 408) ---
  // Module 403: Descriptive Statistics I - Probability and Data
  if (has('nominal data', 'ordinal data', 'discrete variable', 'continuous variable', 'qualitative variable', 'scales of measurement: nominal', 'scales of measurement: ordinal', 'scales of measurement: interval', 'scales of measurement: ratio', 'bar chart', 'histogram', 'pie chart', 'frequency polygon', 'ogive curve', 'cumulative frequency curve', 'addition rule of probability', 'multiplication rule of probability', 'probability of mutually exclusive', 'conditional probability') ||
      (qHas('nominal scale', 'ordinal scale', 'interval scale', 'ratio scale', 'categorical variable', 'quantitative variable', 'qualitative variable', 'pie chart', 'bar chart', 'histogram', 'ogive', 'frequency polygon', 'probability') &&
       (ansHas('nominal', 'ordinal', 'interval', 'ratio', 'quantitative', 'qualitative', 'bar chart', 'histogram', 'pie chart', 'probability') || qHas('scale of measurement', 'type of variable', 'graph', 'chart', 'probability')) &&
       !has('correlation', 'regression', 'mean', 'median', 'mode', 'standard deviation', 'variance', 't-test', 'chi-square', 'sampling'))) {
    if (cur !== 403) {
      return { toModule: 403, reason: 'Tests types of statistical data, scales of measurement (nominal/ordinal/interval/ratio), graphical presentation (histogram/pie chart), or probability theory' };
    }
    return null;
  }

  // Module 404: Descriptive Statistics II - Measures of Location
  if (has('arithmetic mean', 'geometric mean', 'harmonic mean', 'median is preferred for skewed', 'median calculation', 'mode of distribution', 'bimodal distribution', '50th percentile is median', 'quartile deviation calculation', 'percentiles in statistics', 'measure of central tendency', 'measure of central location') ||
      (qHas('measure of central tendency', 'measure of central location', 'arithmetic mean', 'geometric mean', 'median', 'mode is defined as', 'bimodal') &&
       (ansHas('mean', 'median', 'mode', 'central tendency') || qHas('central location', 'skewed data', 'middle value')))) {
    if (cur !== 404) {
      return { toModule: 404, reason: 'Tests measures of central tendency / central location (Mean, Median, Mode) and partition values (Quartiles, Percentiles)' };
    }
    return null;
  }

  // Module 405: Descriptive Statistics III - Measures of Dispersion
  if (has('standard deviation', 'variance in statistics', 'coefficient of variation', 'sd divided by mean', 'normal distribution curve', 'gaussian curve', 'area under normal curve', '68.3% within 1 sd', '95.4% within 2 sd', '99.7% within 3 sd', 'positively skewed distribution', 'negatively skewed distribution', 'mean > median > mode', 'mean < median < mode', 'standard error of mean', 'sem = sd / sqrt(n)', 'standard error of proportion', 'confidence interval formula', 'confidence limit = mean +- 1.96', '95% confidence interval', '99% confidence interval') ||
      ((qHas('standard deviation', 'normal distribution', 'gaussian distribution', 'skewed distribution', 'positively skewed', 'negatively skewed', 'standard error', 'confidence interval', 'coefficient of variation') || ansHas('standard deviation', 'normal distribution', 'skewed', 'standard error', 'confidence interval')) &&
       !has('t-test', 'chi-square', 'anova', 'p-value', 'sampling'))) {
    if (cur !== 405) {
      return { toModule: 405, reason: 'Tests measures of dispersion (Standard Deviation, Variance, CV), Normal distribution curve, Skewness, Standard Error, or Confidence Intervals' };
    }
    return null;
  }

  // Module 406: Correlational and Predictive Techniques
  if (has('pearson correlation coefficient', 'spearman rank correlation', 'correlation coefficient', 'linear regression equation', 'regression coefficient', 'y = a + bx', 'scatter plot showing linear correlation') ||
      (qHas('correlation coefficient', 'pearson correlation', 'spearman', 'linear regression', 'regression equation') && (ansHas('correlation', 'regression', 'r =', 'r is') || qHas('relationship between', 'scatter diagram')))) {
    if (cur !== 406) {
      return { toModule: 406, reason: 'Tests correlation techniques (Pearson r, Spearman rank) and predictive linear regression modeling' };
    }
    return null;
  }

  // Module 407: Tests of Significance
  if (has('null hypothesis', 'alternative hypothesis', 'type 1 error', 'type i error', 'alpha error', 'type 2 error', 'type ii error', 'beta error', 'power of test = 1 - beta', 'power of a test', 'p-value < 0.05', "student's t test", 't-test', 'paired t test', 'unpaired t test', 'two-sample t test', 'anova test', 'f test in anova', 'chi-square test', 'chi square test', 'degrees of freedom', "yates correction", "fisher's exact test", 'mann-whitney u test', 'wilcoxon signed rank test', 'kruskal-wallis test', 'non-parametric test equivalent') ||
      (qHas('null hypothesis', 'type i error', 'type ii error', 'alpha error', 'beta error', 'power of test', 'student\'s t-test', 'paired t-test', 'chi-square test', 'anova', 'fisher exact test', 'mann-whitney') &&
       (ansHas('t-test', 'chi-square', 'anova', 'null hypothesis', 'type i error', 'type ii error', 'p value', 'alpha error', 'beta error') || qHas('test of significance', 'significance test')))) {
    if (cur !== 407) {
      return { toModule: 407, reason: 'Tests hypothesis testing, Type I and Type II errors, p-values, or parametric/non-parametric tests of significance (t-test, ANOVA, Chi-square)' };
    }
    return null;
  }

  // Module 408: Facets of Clinical Research and Biostatistics
  if (has('simple random sampling', 'systematic random sampling', 'stratified random sampling', 'cluster sampling', 'snowball sampling', 'purposive sampling', 'quota sampling', 'multistage sampling', 'sample size calculation', 'meta-analysis', 'forest plot', 'diamond in forest plot', 'funnel plot asymmetry', 'phase 1 clinical trial', 'phase 2 clinical trial', 'phase 3 clinical trial', 'phase 4 post marketing', 'phase iv clinical trial', 'clinical trial phases') ||
      (qHas('sampling technique', 'types of sampling', 'random sampling', 'stratified sampling', 'cluster sampling', 'multistage sampling', 'snowball sampling', 'forest plot', 'funnel plot', 'phase 1', 'phase 2', 'phase 3', 'phase 4', 'clinical trial phase') &&
       (ansHas('sampling', 'random', 'stratified', 'cluster', 'multistage', 'snowball', 'phase 1', 'phase 2', 'phase 3', 'phase 4', 'forest plot', 'funnel plot') || qHas('sampling', 'trial', 'meta-analysis')))) {
    if (cur !== 408) {
      return { toModule: 408, reason: 'Tests sampling techniques (random, stratified, cluster, snowball), meta-analysis (Forest/Funnel plots), or Clinical Trial Phases (Phase I to IV)' };
    }
    return null;
  }

  // --- Module 366: Screening ---
  if (has('screening test', 'diagnostic test', 'sensitivity', 'specificity', 'positive predictive value', 'negative predictive value', 'ppv', 'npv', 'likelihood ratio', 'receiver operating characteristic', 'roc curve', 'lead time bias', 'length time bias', 'yield of screening', 'wilson and jungner') ||
      (qHas('screening test', 'sensitivity', 'specificity', 'positive predictive value', 'negative predictive value', 'roc curve', 'lead time bias') &&
       (ansHas('sensitivity', 'specificity', 'positive predictive value', 'negative predictive value', 'screening', 'bias') || qHas('test', 'screening')))) {
    if (cur !== 366) {
      return { toModule: 366, reason: 'Tests screening test metrics (Sensitivity, Specificity, PPV, NPV, Likelihood ratios, ROC curves, or screening evaluation biases)' };
    }
    return null;
  }

  // --- Module 364: Vaccine Production and Storage ---
  if (has('cold chain', 'ice lined refrigerator', 'ilr', 'deep freezer in cold chain', 'vaccine carrier', 'day carrier', 'dial thermometer', 'vaccine vial monitor', 'vvm stage', 'discard point on vvm', 'shake test', 'freeze sensitive vaccines', 'heat sensitive vaccines', 'most heat sensitive vaccine', 'reconstitution of vaccine') ||
      (qHas('cold chain', 'ice lined refrigerator', 'ilr', 'vaccine carrier', 'vaccine vial monitor', 'vvm', 'shake test', 'heat sensitive vaccine', 'freeze sensitive vaccine') &&
       (ansHas('cold chain', 'ilr', 'vvm', 'shake test', 'vaccine carrier', 'temperature', 'opv') || qHas('vaccine', 'storage', 'temperature')))) {
    if (cur !== 364) {
      return { toModule: 364, reason: 'Tests Cold Chain equipment (ILR, deep freezer, vaccine carriers), temperature monitoring, VVM stages, or vaccine storage sensitivities' };
    }
    return null;
  }

  // --- Module 363: Principles of Immunization and Vaccination ---
  if (has('active immunity', 'passive immunity', 'live attenuated vaccine', 'killed vaccine', 'toxoid vaccine', 'cellular fraction vaccine', 'recombinant vaccine', 'contraindications to live vaccines', 'immunization in pregnancy', 'adverse events following immunization', 'aefi', 'open vial policy') ||
      (qHas('live attenuated vaccine', 'killed vaccine', 'toxoid', 'contraindication to vaccination', 'aefi', 'adverse event following immunization', 'open vial policy', 'active immunity', 'passive immunity') &&
       (ansHas('vaccine', 'immunity', 'aefi', 'toxoid', 'live', 'killed') || qHas('immunization', 'vaccination')) &&
       !has('uip', 'national immunization schedule', 'cold chain', 'ilr', 'vvm'))) {
    if (cur !== 363 && cur !== 378) {
      return { toModule: 363, reason: 'Tests fundamental principles of immunization: active vs passive immunity, vaccine types (live/killed/toxoid), contraindications, or AEFI' };
    }
    if (cur === 363) return null;
  }

  // --- Module 365: Sterilization and Disinfection ---
  if (has('autoclaving', '121 c for 15 minutes', 'moist heat sterilization', 'dry heat hot air oven', 'ethylene oxide sterilization', 'glutaraldehyde 2% cidex', 'disinfection of sputum', 'disinfection of feces', 'concurrent disinfection', 'terminal disinfection', 'antiseptic vs disinfectant') ||
      (qHas('autoclaving', 'hot air oven', 'disinfection of sputum', 'disinfection of feces', 'concurrent disinfection', 'terminal disinfection') &&
       (ansHas('autoclave', 'disinfection', 'sterilization', 'cresol', 'bleaching powder', 'cidex') || qHas('disinfection', 'sterilization')))) {
    if (cur !== 365) {
      return { toModule: 365, reason: 'Tests hospital and public health sterilization physical/chemical agents, autoclaving standards, or concurrent/terminal disinfection' };
    }
    return null;
  }

  // --- Module 359: Analytical Epidemiology ---
  if (has('case control study', 'case-control study', 'odds ratio', 'cohort study', 'prospective cohort', 'retrospective cohort', 'relative risk', 'attributable risk', 'population attributable risk', 'cross sectional study', 'cross-sectional study', 'ecological study', 'ecological fallacy', 'recall bias', 'berkson bias', "berkson's bias", 'berksonian bias', 'confounding bias', 'matching in case control', 'stratified analysis') ||
      (qHas('case-control study', 'cohort study', 'cross-sectional study', 'ecological study', 'odds ratio', 'relative risk', 'attributable risk', 'berksonian bias', 'recall bias', 'confounding') &&
       (ansHas('case-control', 'cohort', 'odds ratio', 'relative risk', 'attributable risk', 'cross-sectional', 'ecological', 'bias', 'confounding') || qHas('study design', 'measure of association')))) {
    if (cur !== 359) {
      return { toModule: 359, reason: 'Tests analytical epidemiological study designs (Case-Control, Cohort, Cross-sectional, Ecological), risk estimates (OR, RR, AR), or biases/confounding' };
    }
    return null;
  }

  // --- Module 360: Experimental Epidemiology ---
  if (has('randomized controlled trial', 'rct design', 'randomization', 'blinding in clinical trials', 'single blind', 'double blind', 'triple blind', 'intention to treat', 'placebo controlled', 'community trial', 'field trial', 'hawthorne effect') ||
      (qHas('randomized controlled trial', 'rct', 'blinding', 'double blind', 'single blind', 'randomization', 'intention-to-treat', 'community trial', 'field trial') &&
       (ansHas('randomization', 'blinding', 'double blind', 'rct', 'trial') || qHas('trial', 'experimental study')) &&
       !has('phase 1', 'phase 2', 'phase 3', 'phase 4', 'meta-analysis'))) {
    if (cur !== 360 && cur !== 408) {
      return { toModule: 360, reason: 'Tests experimental epidemiological designs (Randomized Controlled Trials, randomization, blinding techniques, field/community trials)' };
    }
    if (cur === 360) return null;
  }

  // --- Module 361: Basic Definitions in Infectious Disease Epidemiology ---
  if (has('endemic disease', 'epidemic disease', 'pandemic', 'sporadic occurrence', 'exotic disease', 'hyperendemic', 'holoendemic', 'zoonosis definition', 'epizootic', 'enzoonotic', 'carrier state', 'healthy carrier', 'convalescent carrier', 'incubatory carrier', 'chronic carrier', 'herd immunity threshold', 'critical vaccination coverage', 'eradication of disease', 'elimination of disease', 'reservoir of infection') ||
      (qHas('endemic', 'epidemic', 'pandemic', 'sporadic', 'exotic disease', 'carrier', 'herd immunity', 'eradication', 'elimination of disease') &&
       (ansHas('endemic', 'epidemic', 'pandemic', 'sporadic', 'exotic', 'carrier', 'herd immunity', 'eradication', 'elimination') || qHas('definition', 'state', 'concept')) &&
       !has('nvbdcp', 'nlep', 'ntep', 'outbreak investigation', 'epidemic curve'))) {
    if (cur !== 361) {
      return { toModule: 361, reason: 'Tests fundamental definitions in infectious disease epidemiology (endemic, epidemic, pandemic, carrier states, herd immunity, eradication)' };
    }
    return null;
  }

  // --- Module 362: Dynamics of Disease Transmission ---
  if (has('chain of transmission', 'direct transmission', 'indirect transmission', 'droplet transmission', 'air-borne transmission', 'droplet nuclei', 'fomite borne', 'vehicle-borne', 'vector-borne transmission', 'incubation period', 'median incubation period', 'generation time', 'serial interval', 'quarantine', 'isolation', 'contact tracing') ||
      (qHas('mode of transmission', 'indirect mode of transmission', 'direct transmission', 'incubation period', 'generation time', 'serial interval', 'quarantine', 'isolation') &&
       (ansHas('transmission', 'incubation period', 'generation time', 'serial interval', 'quarantine', 'isolation', 'fomite', 'droplet') || qHas('transmission', 'interval', 'period')) &&
       !has('rabies', 'malaria', 'dengue', 'measles', 'nvbdcp'))) {
    if (cur !== 362) {
      return { toModule: 362, reason: 'Tests dynamics of disease transmission (modes of direct/indirect transmission, incubation periods, serial intervals, quarantine, isolation)' };
    }
    return null;
  }

  // --- Module 358: Principles of Epidemiology ---
  if (has('incidence rate', 'cumulative incidence', 'incidence density', 'person years', 'point prevalence', 'period prevalence', 'attack rate', 'secondary attack rate', 'crude death rate mid-year', 'standardized mortality ratio', 'smr', 'direct standardization', 'indirect standardization', 'epidemic curve', 'point source epidemic', 'continuous source epidemic', 'propagated epidemic', 'secular trend', 'cyclic trend', 'seasonal variation', 'epidemic investigation', 'spot map') ||
      (qHas('incidence', 'prevalence', 'attack rate', 'secondary attack rate', 'epidemic curve', 'point source epidemic', 'propagated epidemic', 'secular trend', 'cyclic trend', 'outbreak investigation', 'spot map') &&
       (ansHas('incidence', 'prevalence', 'attack rate', 'epidemic curve', 'point source', 'propagated', 'secular', 'cyclic', 'spot map') || qHas('calculate', 'rate', 'curve', 'trend')) &&
       !has('odds ratio', 'relative risk', 'case-control', 'cohort'))) {
    if (cur !== 358) {
      return { toModule: 358, reason: 'Tests core principles of descriptive epidemiology (incidence, prevalence, rates/ratios, epidemic curves, secular/cyclic trends, epidemic investigation)' };
    }
    return null;
  }

  // --- Module 356: Health Determinants and Indicators ---
  if (has('physical quality of life index', 'pqli', 'human development index', 'hdi', 'disability adjusted life years', 'daly', 'quality adjusted life years', 'qaly', 'health adjusted life expectancy', 'hale', "sullivan's index", 'sullivan index', 'disability free life expectancy', 'case fatality rate', 'proportional mortality rate', 'international death certificate', 'cause of death on death certificate', 'dimensions of health', 'determinants of health') ||
      (qHas('pqli', 'hdi', 'daly', 'qaly', 'hale', 'sullivan index', 'case fatality rate', 'proportional mortality rate', 'death certificate') &&
       (ansHas('pqli', 'hdi', 'daly', 'qaly', 'sullivan', 'case fatality', 'indicator', 'health') || qHas('indicator', 'index', 'measure of burden', 'cause of death')))) {
    if (cur !== 356 && cur !== 380) {
      return { toModule: 356, reason: 'Tests health determinants and composite health indicators (PQLI, HDI, DALY, QALY, Sullivan index, mortality/morbidity metrics)' };
    }
    if (cur === 356) return null;
  }

  // --- Module 357: Concepts of Disease and Prevention ---
  if (has('primordial prevention', 'primary prevention', 'secondary prevention', 'tertiary prevention', 'health promotion', 'specific protection', 'disability limitation', 'rehabilitation', 'levels of prevention', 'natural history of disease', 'pre-pathogenesis', 'pathogenesis phase', 'iceberg phenomenon', 'tip of iceberg', 'submerged portion', 'epidemiological triad', 'web of causation', 'beings model', 'rothman') ||
      (qHas('level of prevention', 'primordial prevention', 'primary prevention', 'secondary prevention', 'tertiary prevention', 'disability limitation', 'rehabilitation', 'iceberg phenomenon', 'natural history of disease', 'web of causation', 'beings model') &&
       (ansHas('prevention', 'primordial', 'primary', 'secondary', 'tertiary', 'disability limitation', 'iceberg', 'pathogenesis') || qHas('level of prevention', 'prevention')))) {
    if (cur !== 357) {
      return { toModule: 357, reason: 'Tests concepts of disease causation (epidemiological triad, web of causation, BEINGS model, natural history) and levels of prevention (primordial, primary, secondary, tertiary)' };
    }
    return null;
  }

  // --- Specific Infectious Disease Modules ---
  // Module 367: Viral Respiratory Infections
  if (has('measles', 'koplik spots', 'sspe', 'rubella', 'congenital rubella syndrome', 'crs', 'mumps', 'parotitis', 'orchitis', 'chickenpox', 'varicella', 'dew drop on rose petal', 'smallpox', 'influenza', 'antigenic shift', 'antigenic drift', 'h1n1', 'swine flu', 'covid-19', 'sars') ||
      (qHas('measles', 'mumps', 'rubella', 'chickenpox', 'smallpox', 'influenza', 'h1n1', 'covid-19') && (ansHas('measles', 'mumps', 'rubella', 'chickenpox', 'smallpox', 'influenza', 'virus') || qHas('rash', 'infection', 'features', 'transmission')))) {
    if (cur !== 367 && !has('nis', 'uip schedule', 'national immunization schedule')) {
      return { toModule: 367, reason: 'Tests epidemiology, transmission, and clinical features of Viral Respiratory Infections (Measles, Mumps, Rubella, Chickenpox, Influenza, Smallpox)' };
    }
    if (cur === 367) return null;
  }

  // Module 368: Bacterial Respiratory Infections
  if (has('diphtheria', 'pseudomembrane', 'schick test', 'pertussis', 'whooping cough', '100 day cough', 'meningococcal meningitis', 'acute respiratory infection in children', 'fast breathing') ||
      (qHas('diphtheria', 'pertussis', 'whooping cough', 'meningococcal', 'acute respiratory infection') && (ansHas('diphtheria', 'pertussis', 'corynebacterium', 'bordetella', 'meningitis') || qHas('features', 'infection', 'children')))) {
    if (cur !== 368 && !has('nis', 'uip schedule')) {
      return { toModule: 368, reason: 'Tests epidemiology and prevention of Bacterial Respiratory Infections (Diphtheria, Pertussis, Meningococcal meningitis, childhood ARI)' };
    }
    if (cur === 368) return null;
  }

  // Module 369: Intestinal Infections
  if (has('poliomyelitis', 'oral polio vaccine', 'sabin vaccine', 'salk vaccine', 'vapp', 'vdpv', 'afp surveillance', 'acute flaccid paralysis', 'hepatitis a', 'hepatitis e', 'cholera', 'rice water stool', 'vibrio cholerae', 'cholera cot', 'ors composition', 'oral rehydration salts', 'zinc in diarrhea', 'typhoid', 'enteric fever', 'step-ladder fever', 'rose spots', 'staphylococcal food poisoning', 'botulism', 'bacillus cereus', 'dracunculiasis', 'guinea worm') ||
      (qHas('polio', 'hepatitis a', 'hepatitis e', 'cholera', 'typhoid', 'food poisoning', 'botulism', 'ors', 'zinc in diarrhea', 'guinea worm') && (ansHas('polio', 'hepatitis a', 'hepatitis e', 'cholera', 'typhoid', 'botulism', 'ors', 'zinc') || qHas('diarrhea', 'stool', 'infection')))) {
    if (cur !== 369 && !has('uip', 'cold chain')) {
      return { toModule: 369, reason: 'Tests epidemiology, transmission, and management of Intestinal and Diarrhoeal Infections (Polio, Hepatitis A/E, Cholera, Typhoid, Food Poisoning, ORS)' };
    }
    if (cur === 369) return null;
  }

  // Module 370: Arthropod-Borne Infections
  if (has('dengue', 'dengue hemorrhagic fever', 'tourniquet test', 'chikungunya', 'yellow fever', 'filariasis', 'wuchereria bancrofti', 'microfilaria', 'dec provocation test', 'japanese encephalitis', 'kala-azar', 'pkdl', 'post kala azar', 'leishmania donovani') ||
      (qHas('dengue', 'chikungunya', 'yellow fever', 'filariasis', 'japanese encephalitis', 'kala-azar', 'leishmania') && (ansHas('dengue', 'chikungunya', 'filaria', 'encephalitis', 'kala-azar') || qHas('vector', 'manifestation', 'fever')))) {
    if (cur !== 370 && !has('nvbdcp', 'mda in filaria', 'annual parasite incidence')) {
      return { toModule: 370, reason: 'Tests epidemiology, transmission vectors, and clinical manifestations of Arthropod-Borne Infections (Dengue, Chikungunya, Filariasis, JE, Leishmaniasis)' };
    }
    if (cur === 370) return null;
  }

  // Module 371: Zoonotic Infections - Viral
  if (has('rabies', 'hydrophobia', 'street virus', 'fixed virus', 'anti-rabies vaccination', 'essen schedule', 'thai red cross', 'rabies immunoglobulin', 'rig', 'kyasanur forest disease', 'kfd', 'nipah virus', 'crimean congo', 'cchf', 'ebola') ||
      (qHas('rabies', 'anti-rabies', 'rig', 'kfd', 'nipah virus', 'crimean congo', 'cchf') && (ansHas('rabies', 'rig', 'kfd', 'nipah', 'cchf', 'schedule', 'bite') || qHas('bite', 'wound', 'virus')))) {
    if (cur !== 371) {
      return { toModule: 371, reason: 'Tests epidemiology, transmission, and post-exposure prophylaxis of Viral Zoonotic Infections (Rabies category bites & PEP schedules, KFD, Nipah)' };
    }
    return null;
  }

  // Module 372: Zoonotic Infections - Bacterial & Parasitic
  if (has('brucellosis', 'undulant fever', 'leptospirosis', 'weils disease', "weil's disease", 'plague', 'yersinia pestis', 'anthrax', 'woolsorters disease', 'scrub typhus', 'orientia tsutsugamushi', 'eschar in scrub typhus', 'epidemic typhus', 'murine typhus', 'q fever', 'coxiella burnetii', 'hydatid disease', 'echinococcus', 'cysticercosis', 'taenia solium') ||
      (qHas('brucellosis', 'leptospirosis', 'plague', 'anthrax', 'scrub typhus', 'q fever', 'hydatid cyst', 'cysticercosis') && (ansHas('brucella', 'leptospira', 'plague', 'anthrax', 'typhus', 'q fever', 'hydatid') || qHas('zoonosis', 'infection')))) {
    if (cur !== 372) {
      return { toModule: 372, reason: 'Tests epidemiology and transmission of Bacterial and Parasitic Zoonoses (Brucellosis, Leptospirosis, Plague, Anthrax, Rickettsial typhus, Q fever, Hydatid disease)' };
    }
    return null;
  }

  // Module 373: STDs and Surface Infections
  if (has('syphilis', 'chancre', 'treponema pallidum', 'vdrl', 'rpr', 'gonorrhea', 'neisseria gonorrhoeae', 'chlamydia trachomatis', 'chancroid', 'haemophilus ducreyi', 'lymphogranuloma venereum', 'lgv', 'donovanosis', 'granuloma inguinale', 'syndromic management of stis', 'color coded kit', 'colour coded kit', 'tetanus', 'tetanus neonatorum', 'trachoma', 'safe strategy', 'yaws') ||
      (qHas('syphilis', 'gonorrhea', 'chancroid', 'lymphogranuloma venereum', 'donovanosis', 'syndromic management', 'tetanus', 'trachoma', 'safe strategy') && (ansHas('syphilis', 'gonorrhea', 'chancroid', 'tetanus', 'trachoma', 'kit') || qHas('ulcer', 'discharge', 'sti', 'std')))) {
    if (cur !== 373 && !has('naco')) {
      return { toModule: 373, reason: 'Tests epidemiology and public health syndromic management of STIs (syphilis, gonorrhea, chancroid, kits 1-7), Tetanus, or Trachoma (SAFE strategy)' };
    }
    if (cur === 373) return null;
  }

  // Module 355: History of Medicine
  if (has('hippocrates', 'hippocratic', 'galen', 'andreas vesalius', 'william harvey', 'edward jenner', 'louis pasteur', 'robert koch', 'koch postulates', 'joseph lister', 'paul ehrlich', 'alexander fleming', 'john snow', 'broad street pump', 'semmelweis', 'edwin chadwick', 'father of public health', 'charaka', 'sushruta', 'samuel hahnemann', 'sanitary awakening', 'dawn of scientific medicine') ||
      (qHas('father of public health', 'father of medicine', 'father of modern epidemiology', 'father of immunology', 'father of antiseptic surgery', 'father of homeopathy', 'john snow', 'edward jenner', 'louis pasteur', 'robert koch', 'hippocrates', 'sanitary awakening') &&
       (ansHas('john snow', 'edward jenner', 'louis pasteur', 'robert koch', 'hippocrates', 'hahnemann', 'chadwick', 'cholera') || qHas('father of', 'pioneer')))) {
    if (cur !== 355) {
      return { toModule: 355, reason: 'Tests historical milestones, pioneers of medicine (Hippocrates, Jenner, Pasteur, Koch, Snow, Chadwick), or history of public health' };
    }
    return null;
  }

  // Module 410: Mixed / Miscellaneous Topics
  if (has('world trauma day', 'world health day theme', 'universal children day', 'public health acts miscellaneous', 'health days celebration') ||
      (qHas('day is celebrated on', 'theme of world health day', 'world diabetes day', 'world aids day is observed') && ansHas('october', 'april', 'december', 'november', 'theme'))) {
    if (cur !== 410) {
      return { toModule: 410, reason: 'Tests health awareness days, WHO annual themes, or miscellaneous cross-cutting public health topics' };
    }
    return null;
  }

  // If question is in Module 355 and hasn't matched anything above, it's still misfiled!
  if (cur === 355) {
    // Let's inspect the remaining unmatched questions in 355
    return { fallbackAudit: true };
  }

  return null; // Question belongs in current module
}

// Run audit
const moves = [];
const fallbackList = [];

questions.forEach(q => {
  const result = auditQuestion(q);
  if (result) {
    if (result.fallbackAudit) {
      fallbackList.push(q);
    } else if (result.toModule && result.toModule !== q.currentModule) {
      moves.push({
        id: q.id,
        fromModule: q.currentModule,
        toModule: result.toModule,
        reason: result.reason
      });
    }
  }
});

console.log(`Initial moves found: ${moves.length}`);
console.log(`Fallback questions from Module 355 needing specific assignment: ${fallbackList.length}`);

// Write fallback list for inspection
fs.writeFileSync('tools/fallback_355.json', JSON.stringify(fallbackList.map(q => ({ id: q.id, qText: q.qText, ansText: q.ansText, expl: q.expl.slice(0, 150) })), null, 2));

process.exit(0);
