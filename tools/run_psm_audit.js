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

// Prepare cleaned question objects
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

console.log(`Loaded ${questions.length} questions.`);

// Classification function
function classify(q) {
  const full = q.full;
  const cur = q.currentModule;
  const qAndAns = q.qAndAns;
  const qText = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  // Helper matching functions
  const has = (...terms) => terms.some(t => full.includes(t.toLowerCase()));
  const hasAll = (...terms) => terms.every(t => full.includes(t.toLowerCase()));
  const qHas = (...terms) => terms.some(t => qText.includes(t.toLowerCase()));
  const ansHas = (...terms) => terms.some(t => ans.includes(t.toLowerCase()));
  const qAnsHas = (...terms) => terms.some(t => qAndAns.includes(t.toLowerCase()));

  // =========================================================================
  // 1. OUTSIDE SUBJECT CHECKS
  // =========================================================================

  // Pure Microbiology
  // Culture media for bacteria (e.g. LJ medium, MacConkey agar, TCBS, Chocolate agar, Wilson Blair)
  if (qAnsHas('lowenstein-jensen', 'lowenstein jensen', 'l.j medium', 'lj medium') && (has('egg based', 'culture medium', 'culturing tb', 'mycobacterium tuberculosis') || ansHas('lowenstein', 'lj'))) {
    if (qHas('culture', 'medium', 'agar') && !has('ntep', 'rntcp', 'national tuberculosis elimination')) {
      return { toModule: 197, reason: 'Focuses on microbiological culture medium (Lowenstein-Jensen) for M. tuberculosis, belongs in Microbiology: Mycobacterium' };
    }
  }

  // Pure bacterial staining / morphology (e.g. Albert stain, Ziehl-Neelsen stain, Gram stain mechanics, drumstick spores)
  if (qAnsHas('albert stain', "albert's stain", 'volutin granules', 'metachromatic granules', 'babes ernst') && has('corynebacterium', 'diphtheria', 'stain', 'granules')) {
    return { toModule: 196, reason: "Tests microbiological staining and metachromatic granules of Corynebacterium diphtheriae, belongs in Microbiology: Corynebacterium" };
  }

  if (qAnsHas('drumstick appearance', 'drum stick appearance', 'drumstick spores') && has('tetanus', 'tetani', 'clostridium')) {
    return { toModule: 198, reason: 'Tests microscopic morphology (terminal drumstick spore) of Clostridium tetani, belongs in Microbiology: Clostridium' };
  }

  if (qAnsHas('tcbs agar', 'thiosulfate citrate bile salts', 'darting motility', 'string test') && has('vibrio', 'cholera')) {
    return { toModule: 199, reason: 'Tests microbiological culture and motility identification of Vibrio cholerae, belongs in Microbiology: Vibrio and Campylobacter' };
  }

  if (qAnsHas('nagler reaction', 'stormy fermentation', 'lecithinase') && has('clostridium perfringens', 'welchii')) {
    return { toModule: 198, reason: 'Tests biochemical identification (Nagler reaction) of Clostridium perfringens, belongs in Microbiology: Clostridium' };
  }

  if (qAnsHas('weil felix test', 'weil-felix test') && has('proteus', 'ox19', 'ox2', 'oxk', 'antigen', 'cross react')) {
    return { toModule: 204, reason: 'Tests serological cross-reaction mechanism of Weil-Felix test in rickettsia, belongs in Microbiology: Rickettsia and Chlamydia' };
  }

  if (qAnsHas('negri bodies', 'negri body') && has('rabies', 'hippocampus', 'purkinje', 'inclusion body')) {
    return { toModule: 211, reason: 'Tests pathological/microbiological diagnostic hallmark (Negri bodies) of Rabies virus, belongs in Microbiology: Rabies and Arboviruses' };
  }

  if (qAnsHas('elek test', "elek's test", 'toxigenicity test') && has('corynebacterium diphtheriae', 'diphtheria toxin')) {
    return { toModule: 196, reason: 'Tests microbiological toxigenicity assay (Elek test) for C. diphtheriae, belongs in Microbiology: Corynebacterium' };
  }

  // Parasitology pure morphology (e.g. egg morphology)
  if (qAnsHas('bile stained egg', 'bile-stained', 'unsegmented ovum', 'fertilized egg', 'mammillated coat') && has('ascaris lumbricoides', 'ovum', 'egg')) {
    return { toModule: 220, reason: 'Tests helminth egg morphology (mammillated bile-stained egg of Ascaris), belongs in Microbiology: Nematodes' };
  }

  if (qAnsHas('scotch tape test', 'cellophane tape', 'perianal swab', 'national pruritus') && has('enterobius vermicularis', 'pinworm', 'pruritus ani')) {
    return { toModule: 220, reason: 'Tests diagnostic parasitological scotch tape test for Enterobius vermicularis, belongs in Microbiology: Nematodes' };
  }

  if (qAnsHas('amastigote', 'ld body', 'leishman donovan body') && has('kala azar', 'leishmania', 'bone marrow', 'splenic aspirate') && !has('nvbdcp', 'vector', 'phlebotomus', 'sandfly')) {
    return { toModule: 217, reason: 'Tests morphological identification of Leishmania amastigotes (LD bodies), belongs in Microbiology: Protozoa' };
  }

  // Pure Pharmacology
  if (qAnsHas('mechanism of action', 'acts by inhibiting', 'competitive inhibitor') && has('dihydrofolate reductase', 'dihydropteroate synthase', 'cell wall synthesis', 'dna gyrase', 'rna polymerase') && !has('nvbdcp', 'rntcp', 'ntep', 'program', 'schedule', 'prophylaxis')) {
    if (has('isoniazid', 'rifampicin', 'pyrazinamide', 'ethambutol')) {
      return { toModule: 247, reason: 'Tests mechanism of action of antitubercular drugs at cellular/molecular level, belongs in Pharmacology: Antitubercular and Antileprotic Drugs' };
    }
  }

  // Pure Pediatrics (milestones, congenital clinical conditions)
  if (qAnsHas('neck holding', 'social smile', 'rolls over', 'sits without support', 'pincer grasp', 'stranger anxiety', 'babbles') && has('milestone', 'development', 'age of attainment', 'motor development')) {
    return { toModule: 576, reason: 'Tests developmental milestones in young children, belongs in Pediatrics: Growth and Development' };
  }

  if (qAnsHas('tetralogy of fallot', 'boot shaped heart', 'coarctation of aorta', 'transposition of great arteries') && has('cyanosis', 'murmur', 'congenital heart', 'shunting') && !has('rbsk', 'defects')) {
    return { toModule: 587, reason: 'Tests congenital heart defects clinical diagnosis/imaging, belongs in Pediatrics: Cardiovascular Disorders in Children' };
  }

  if (qAnsHas('foreign body aspiration', 'foreign body in bronchus') && has('choking', 'sudden breathlessness', 'playing', 'peanut') && !has('epidemiology')) {
    return { toModule: 586, reason: 'Tests clinical diagnosis and management of foreign body aspiration in toddler, belongs in Pediatrics: Respiratory Disorders' };
  }

  // Pure Obstetrics & Gynaecology
  if (qAnsHas('bimanual compression', 'uterine balloon tamponade', 'bakri balloon', 'condom tamponade', 'brace suture', 'b-lynch') && has('postpartum hemorrhage', 'atonic pph', 'pph')) {
    return { toModule: 540, reason: 'Tests surgical/mechanical management of postpartum hemorrhage (PPH), belongs in OB & G: Postpartum Hemorrhage' };
  }

  if (qAnsHas('bishop score', "bishop's score") && has('inducibility', 'cervical dilatation', 'effacement', 'consistency', 'station')) {
    return { toModule: 534, reason: "Tests Bishop's score for cervical assessment before induction of labor, belongs in OB & G: Normal Labor" };
  }

  if (qAnsHas('partograph', 'alert line', 'action line') && has('cervical dilatation', 'latent phase', 'active phase') && !has('rbsk', 'national', 'who')) {
    return { toModule: 534, reason: 'Tests intrapartum monitoring using WHO Partograph, belongs in OB & G: Normal Labor' };
  }

  if (qAnsHas('pritchard regimen', 'zuspan regimen', 'magnesium sulphate', 'magnesium sulfate toxicity', 'patellar reflex', 'calcium gluconate') && has('eclampsia', 'preeclampsia', 'seizure')) {
    return { toModule: 538, reason: 'Tests pharmacological magnesium sulfate regimens for eclampsia, belongs in OB & G: Hypertensive Disorders in Pregnancy' };
  }

  // Pure Forensic Medicine
  if (qAnsHas('rigor mortis', 'livor mortis', 'algor mortis', 'postmortem staining', 'post-mortem staining', 'cadaveric spasm', 'adipocere', 'mummification') && has('postmortem', 'death', 'time since death', 'autopsy', 'stiffening')) {
    return { toModule: 273, reason: 'Tests postmortem changes and time since death estimation, belongs in Forensic Medicine: Thanatology' };
  }

  if (qAnsHas('diatom test', 'diatoms', "gettler's test") && has('drowning', 'water', 'femur', 'bone marrow')) {
    return { toModule: 277, reason: 'Tests diatom test for antemortem drowning, belongs in Forensic Medicine: Asphyxial Deaths' };
  }

  if (qAnsHas('rule of haase', "haase's rule") && has('gestational age', 'fetus length', 'crown heel', 'crown rump')) {
    return { toModule: 278, reason: "Tests Haase's rule for fetal age determination, belongs in Forensic Medicine: Forensic Entomology and Fetal Age" };
  }

  if (qAnsHas('dying declaration', 'res ipsa loquitur', 'bolam test', 'medical negligence', 'ipc 304a', 'ipc 320', 'grievous hurt') && !has('factories act', 'esi act', 'workmen')) {
    return { toModule: 291, reason: 'Tests legal medicine, medical negligence, or penal code provisions, belongs in Forensic Medicine: Medical Jurisprudence' };
  }

  // Pure ENT
  if (qAnsHas('rinne test', 'weber test', 'schwabach test', 'tuning fork') && has('bone conduction', 'air conduction', 'conductive hearing loss', 'sensorineural')) {
    return { toModule: 293, reason: 'Tests clinical tuning fork evaluation of hearing loss, belongs in ENT: Examination and Physiology of Ear' };
  }

  if (qAnsHas('carhart notch', "carhart's notch") && has('otosclerosis', 'audiogram', 'bone conduction', '2000 hz', '2 khz')) {
    return { toModule: 298, reason: "Tests audiometric hallmark (Carhart's notch) of otosclerosis, belongs in ENT: Diseases of Middle Ear" };
  }

  // Pure Ophthalmology
  if (qAnsHas('argon laser trabeculoplasty', 'selective laser', 'trabeculectomy', 'gonioscopy', 'shaffer system', 'van herick') && has('glaucoma', 'intraocular pressure', 'angle')) {
    return { toModule: 334, reason: 'Tests diagnosis and surgical laser management of glaucoma, belongs in Ophthalmology: Glaucoma' };
  }

  if (qAnsHas('phacoemulsification', 'extracapsular cataract extraction', 'sics', 'ecce', 'intraocular lens', 'iol calculation', 'srk formula') && has('cataract', 'lens') && !has('vision 2020', 'npcb', 'blindness definition', 'causes of blindness in india')) {
    return { toModule: 333, reason: 'Tests cataract surgical techniques and intraocular lens power calculation, belongs in Ophthalmology: Diseases of Lens' };
  }

  // Pure Medicine (Inpatient cardiology / ECG / shock)
  if (qAnsHas('st elevation', 'st segment elevation', 'q wave', 'troponin i', 'acute myocardial infarction', 'inferior wall mi', 'anterior wall mi') && (has('lead ii', 'lead iii', 'avf', 'v1-v4', 'ecg shows', 'coronary angiogram') || qHas('ecg', 'lead'))) {
    return { toModule: 412, reason: 'Tests clinical ECG localization and acute management of myocardial infarction, belongs in Medicine: Coronary Artery Disease' };
  }

  // =========================================================================
  // 2. INTERNAL PSM CLASSIFICATION (Modules 355 to 410)
  // =========================================================================

  // Module 396: Biomedical Waste Management
  if (has('biomedical waste', 'bio-medical waste', 'bmw rules', 'bmw management', 'yellow bag', 'red bag', 'blue box', 'white translucent', 'color coded bag', 'colour coded bag', 'sharps container', 'cytotoxic waste', 'anatomical waste', 'soiled waste', 'disposal of placenta', 'disposal of amputated', 'disposal of blood bag', 'disposal of iv tubing', 'disposal of needles', 'disposal of scalpel', 'disposal of syringe', 'discarded medicines', 'disposal of expired medicine', 'mercury spill management', 'autoclaving and shredding', 'plasma pyrolysis')) {
    // Check if primarily BMW
    if (cur !== 396) {
      return { toModule: 396, reason: 'Question tests Biomedical Waste Management categories, color-coded bags/containers, or treatment methods under BMW Rules 2016' };
    }
    return null; // Correct in 396
  }

  // Module 398: Occupational Health Diseases
  if (has('pneumoconiosis', 'silicosis', 'asbestosis', 'byssinosis', 'bagassosis', "farmer's lung", 'farmers lung', 'anthracosis', 'coal workers', 'coal worker', 'berylliosis', 'siderosis', 'chalicosis', 'occupational hazard', 'occupational lung', 'occupational cancer', 'lead poisoning', 'plumbism', 'burtonian line', 'basophilic stippling', 'coproporphyrin', 'sickness absenteeism', 'ergonomics', 'monday morning fever', 'sugarcane dust', 'cotton dust', 'silica dust', 'asbestos bodies', 'egg shell calcification', 'snow storm appearance', 'factories act', 'esi act', 'employees state insurance', 'employees compensation act', 'workmen compensation') &&
      !has('hdi', 'pqli', 'demography', 'water treatment')) {
    // If not general legal/social, tests occupational health
    if (cur !== 398) {
      return { toModule: 398, reason: 'Tests occupational health, occupational lung diseases (pneumoconiosis), occupational hazards, lead poisoning, or occupational legislation (Factories/ESI Act)' };
    }
    return null;
  }

  // Module 384: Food Quality and Processing
  if (has('lathyrism', 'khesari dal', 'kesari dal', 'boaa', 'beta-oxalyl', 'neurolathyrism', 'epidemic dropsy', 'argemone mexicana', 'argemone oil', 'sanguinarine', 'nitric acid test', 'paper chromatography test', 'pasteurization', 'holder method', 'htst method', 'phosphatase test', 'methylene blue reduction test', 'mbrt', 'turbidity test', 'bovine tuberculosis in milk', 'adulteration of milk', 'food adulteration', 'fssai', 'codex alimentarius', 'agmark', 'aflatoxin', 'aspergillus flavus', 'ergotism', 'claviceps purpurea', 'food fortification standards', 'parboiling of rice')) {
    if (cur !== 384) {
      return { toModule: 384, reason: 'Tests food quality, food processing, food adulteration (argemone/lathyrism), or milk pasteurization standards' };
    }
    return null;
  }

  // Module 383: Micronutrients and Water (Nutrition / Nutritional Deficiencies / Vitamins / Minerals)
  if (has('xerophthalmia', 'bitot spots', "bitot's spots", 'keratomalacia', 'night blindness due to vitamin a', 'vitamin a prophylaxis', 'vitamin a deficiency', 'pellagra', 'niacin deficiency', 'casal necklace', '4 ds of pellagra', 'beriberi', 'wet beriberi', 'dry beriberi', 'wernicke', 'thiamine deficiency', 'scurvy', 'vitamin c deficiency', 'rickets', 'osteomalacia', 'vitamin d deficiency', 'folic acid dose', 'folic acid dosage', 'neural tube defect prevention', 'iron folic acid', 'anemia mukt bharat', 'iodine deficiency', 'endemic goitre', 'iodized salt', 'urinary iodine', 'fluorosis', 'dental fluorosis', 'skeletal fluorosis', 'nalgonda technique', 'fluoride content', 'kwashiorkor', 'marasmus', 'protein energy malnutrition', 'protein-energy malnutrition', 'net protein utilization', 'biological value of protein', 'reference indian man', 'reference indian woman', 'balanced diet rda', 'essential amino acid', 'limiting amino acid', 'mid-upper arm circumference', 'shakir tape', 'bengoa classification', 'gomez classification', 'waterlow classification', 'iap classification of malnutrition')) {
    // Exception: if specifically National Iron Plus Initiative under National Health Programs 378
    if (cur !== 383 && !(cur === 378 && has('initiative', 'program', 'scheme'))) {
      return { toModule: 383, reason: 'Tests nutrition, micronutrients (vitamins, minerals), protein-energy malnutrition (PEM), or deficiency syndromes' };
    }
    if (cur === 383) return null;
  }

  // Module 381: Family Planning
  if (has('contracepti', 'copper-t', 'copper t', 'cu-t', 'cut 380', 'cut-380', 'cut 375', 'lng-ius', 'mirena', 'iud', 'iucd', 'intrauterine device', 'pearl index', 'oral contraceptive', 'combined oral contraceptive', 'mala-d', 'mala-n', 'centchroman', 'saheli', 'chhaya', 'antrogel', 'depo-provera', 'dmpa', 'antara program', 'net-en', 'norplant', 'implanon', 'emergency contracept', 'morning after pill', 'levonorgestrel 1.5', 'barrier method', 'condom', 'diaphragm', 'cervical cap', 'vasectomy', 'no scalpel vasectomy', 'nsv', 'tubectomy', 'minilap', 'laparoscopic sterilization', 'couple protection rate', 'unmet need for family planning', 'medical termination of pregnancy', 'mtp act')) {
    if (cur !== 381) {
      return { toModule: 381, reason: 'Tests contraception, family planning spacing/terminal methods (IUCD, OCP, sterilization, Pearl index, MTP Act)' };
    }
    return null;
  }

  // Module 379: Demography I: Demographic Cycle, Annual Growth Rate and Age Pyramid
  if (has('demographic cycle', 'stages of demographic cycle', 'early expanding', 'late expanding', 'high stationary', 'low stationary', 'declining stage', 'annual growth rate', 'population growth rate', 'doubling time of population', 'demographic transition', 'demographic dividend', 'age sex pyramid', 'age pyramid', 'population pyramid', 'dependency ratio', 'young age dependency', 'old age dependency', 'sex ratio of india', 'child sex ratio')) {
    if (cur !== 379) {
      return { toModule: 379, reason: 'Tests demography fundamentals: demographic cycle stages, population growth rates, doubling time, or age-sex pyramids' };
    }
    return null;
  }

  // Module 380: Demography II: Demographic Indicators
  if (has('crude birth rate', 'general fertility rate', 'total fertility rate', 'tfr', 'gross reproduction rate', 'grr', 'net reproduction rate', 'nrr = 1', 'nrr of 1', 'crude death rate', 'infant mortality rate', 'imr of', 'under-5 mortality rate', 'u5mr', 'maternal mortality ratio', 'maternal mortality rate', 'mmr', 'neonatal mortality rate', 'early neonatal mortality', 'post neonatal mortality', 'perinatal mortality rate', 'stillbirth rate', 'census in india', 'sample registration system', 'srs bulletin', 'civil registration system', 'national family health survey', 'nfhs-5', 'nfhs 5', 'vital statistics of india')) {
    if (cur !== 380 && !(cur === 356 && has('pqli', 'hdi', 'indicator of socioeconomic'))) {
      return { toModule: 380, reason: 'Tests demographic and vital health indicators (fertility rates, mortality indicators, census, SRS, NFHS)' };
    }
    if (cur === 380) return null;
  }

  // Module 382: Preventive Obstetrics, Paediatrics and Geriatrics
  if (has('antenatal care', 'anc visits', 'minimum anc visits', 'high risk pregnancy', 'exclusive breastfeeding', 'colostrum', 'baby friendly hospital', 'bfhi', 'road to health chart', 'growth chart designed by david morley', 'growth monitoring curve', 'growth faltering', 'imnci', 'integrated management of neonatal', 'pink yellow green triage', 'kangaroo mother care', 'low birth weight infant', 'vlbw', 'elbw', 'preventive geriatrics', 'problems of the elderly', 'active aging', 'falls in elderly')) {
    if (cur !== 382 && !(cur === 378 && has('jsy', 'jssk', 'pmsma', 'suman', 'rbsk'))) {
      return { toModule: 382, reason: 'Tests preventive maternal and child health (ANC, breastfeeding, BFHI, growth charts, IMNCI, KMC, or preventive geriatrics)' };
    }
    if (cur === 382) return null;
  }

  // Module 377: National Health Programmes II - NLEP, NTEP & NACO
  if (has('nlep', 'national leprosy eradication', 'multidrug therapy for leprosy', 'paucibacillary leprosy', 'multibacillary leprosy', 'rom regimen', 'clofazimine', 'dapsone', 'rifampicin for leprosy', 'ntep', 'rntcp', 'revised national tuberculosis', 'nikshay', 'cbnaat', 'truenat', 'dots therapy', 'dots category', 'presumptive tb', 'bacteriologically confirmed tb', 'isoniazid preventive therapy', 'ipt in tb', 'tpt', 'bpalm regimen', 'mdr tb', 'xdr tb', 'line probe assay', 'naco', 'national aids control', 'ictc', 'pptct', 'art centre', 'first line art', 'tlr regimen', 'tle regimen', 'post exposure prophylaxis for hiv', 'pep for hiv', '95-95-95', 'avahan')) {
    if (cur !== 377) {
      return { toModule: 377, reason: 'Tests National Health Programmes for major communicable diseases: NLEP (Leprosy), NTEP (Tuberculosis), or NACO (HIV/AIDS)' };
    }
    return null;
  }

  // Module 376: National Health Programmes I - NVBDCP
  if (has('nvbdcp', 'national vector borne', 'annual parasite incidence', 'api < 1', 'annual blood examination rate', 'aber', 'slide positivity rate', 'spr', 'slide falciparum rate', 'sfr', 'act regimen', 'artemisinin combination therapy for malaria', 'mass drug administration for filaria', 'mda in filaria', 'dec and albendazole', 'ida regimen in filariasis', 'vector control in nvbdcp', 'indoor residual spraying in malaria', 'llin distribution', 'malaria drug policy in india')) {
    if (cur !== 376) {
      return { toModule: 376, reason: 'Tests National Vector Borne Disease Control Programme (NVBDCP) guidelines, indices (API, ABER, SPR), or treatment protocols' };
    }
    return null;
  }

  // Module 378: National Health Programmes III - NIS, JSY, RBSK and Others
  if (has('national immunization schedule', 'national immunisation schedule', 'uip schedule', 'routine immunization schedule in india', 'janani suraksha yojana', 'jsy incentive', 'janani shishu suraksha karyakram', 'jssk', 'pradhan mantri surakshit matritva abhiyan', 'pmsma', 'rashtriya bal swasthya karyakram', 'rbsk 4 ds', '4ds of rbsk', 'rashtriya kishor swasthya karyakram', 'rksk', 'weekly iron and folic acid', 'wifs', 'national iron plus initiative', 'nipi', 'integrated child development services', 'icds scheme', 'anganwadi worker services under icds', 'ayushman bharat', 'pm-jay', 'pmjay', 'health and wellness centre', 'ayushman arogya mandir', 'national health mission', 'nrhm', 'nuhm', 'idsp', 'integrated disease surveillance programme', 'npcdcs', 'national programme for prevention and control of cancer, diabetes', 'suman scheme', 'laqshya')) {
    if (cur !== 378) {
      return { toModule: 378, reason: 'Tests flagship National Health Programmes (NIS/UIP, RMNCH+A, JSY, JSSK, RBSK, Ayushman Bharat, IDSP)' };
    }
    return null;
  }

  // Module 374: Non-Communicable Diseases - Cardiovascular Diseases and Diabetes
  if (has('coronary heart disease epidemiology', 'rule of halves in hypertension', 'tracking of blood pressure', 'rheumatic heart disease prophylaxis', 'jones criteria in community', 'stroke epidemiology', 'diabetes mellitus epidemiology', 'impaired fasting glucose criteria', 'impaired glucose tolerance', 'metabolic syndrome criteria', 'atp iii criteria', 'framingham risk score')) {
    if (cur !== 374) {
      return { toModule: 374, reason: 'Tests epidemiology, risk factors, screening, and public health prevention of Cardiovascular Diseases, Hypertension, or Diabetes' };
    }
    return null;
  }

  // Module 375: Non-Communicable Diseases - Cancer, Obesity and Blindness
  if (has('cancer registry', 'population based cancer registry', 'pbcr', 'hbcr', 'cervical cancer screening in community', 'via test', 'visual inspection with acetic acid', 'breast self examination', 'mammography screening', 'body mass index classification', 'who bmi cut offs for asians', 'waist circumference cut off', 'waist hip ratio', 'definition of blindness by who', 'npcb blindness criteria', 'visual acuity < 3/60', 'visual acuity < 6/60', 'causes of blindness in india', 'vision 2020: the right to sight', 'cataract blindness in india')) {
    if (cur !== 375) {
      return { toModule: 375, reason: 'Tests epidemiology and public health control of Cancer (registries/screening), Obesity (BMI/waist cut-offs), or Blindness (WHO/NPCB/Vision 2020)' };
    }
    return null;
  }

  // Module 387: Water - I: Sources and purification of water
  if (has('slow sand filter', 'biological filter', 'rapid sand filter', 'mechanical filter', 'schmutzdecke', 'vital layer', 'loss of head in filter', 'effective size of sand', 'uniformity coefficient', 'backwashing of filter', 'sanitary well', 'shallow well vs deep well', 'step well guinea worm', 'percolation tank', 'rainwater harvesting')) {
    if (cur !== 387) {
      return { toModule: 387, reason: 'Tests water sources, well construction, and large-scale water purification systems (slow/rapid sand filters)' };
    }
    return null;
  }

  // Module 388: Water- II: Disinfection of water
  if (has('chlorination of water', 'break-point chlorination', 'breakpoint chlorination', 'free residual chlorine', 'chloramines', 'bleaching powder', 'chlorinated lime', 'available chlorine', 'horrocks apparatus', 'horrocks test', 'double pot method of chlorination', 'orthotolidine test', 'ot test', 'orthotolidine-arsenite test', 'ota test', 'chlorotex test', 'ozonation of water', 'ultraviolet disinfection of water')) {
    if (cur !== 388) {
      return { toModule: 388, reason: 'Tests water disinfection methods (chlorination chemistry, bleaching powder calculation, Horrocks apparatus, OT/OTA tests)' };
    }
    return null;
  }

  // Module 389: Water- III: Water Quality and Standards
  if (has('hardness of water', 'temporary hardness', 'permanent hardness', 'removal of hardness', "clark's process", 'permutit process', 'base exchange process', 'coliform organisms in water', 'escherichia coli in water', 'faecal streptococci', 'clostridium perfringens in water', 'most probable number', 'mpn of coliforms', 'membrane filter technique for water', 'multiple tube method', 'water-borne diseases', 'water-washed diseases', 'water-based diseases', 'water-related insect vector diseases', 'fluoride level in drinking water', 'presumptive coliform test')) {
    if (cur !== 389) {
      return { toModule: 389, reason: 'Tests water quality criteria, bacteriological indicators (coliforms/MPN), water hardness, and water-related disease classification' };
    }
    return null;
  }

  // Module 390: Housing and Ventilation
  if (has('overcrowding standards', 'persons per room', 'floor space per person', 'criteria for healthful housing', 'kata thermometer', 'cooling power of air', 'globe thermometer', 'effective temperature', 'corrected effective temperature', 'thermal comfort indices', 'natural ventilation vs artificial ventilation', 'plenum ventilation', 'air changes per hour')) {
    if (cur !== 390) {
      return { toModule: 390, reason: 'Tests standards of healthful housing, overcrowding criteria, ventilation, and thermal comfort indices (Kata thermometer)' };
    }
    return null;
  }

  // Module 391: Light, Sound and Radiation
  if (has('daylight factor', 'artificial lighting standards', 'glare in lighting', 'lux level', 'sound level meter', 'decibel scale', 'permissible noise exposure', 'temporary threshold shift', 'permanent threshold shift', 'acoustic trauma due to noise', 'presbycusis', 'radiation units', 'roentgen', 'gray', 'rad', 'rem', 'sievert', 'biological effects of radiation', 'radiation protection principles', 'alara principle', 'thermoluminescent dosimeter', 'tld badge', 'film badge')) {
    if (cur !== 391) {
      return { toModule: 391, reason: 'Tests environmental physics in public health: illumination standards, noise pollution effects/decibels, or radiation safety (ALARA/TLD)' };
    }
    return null;
  }

  // Module 392: Waste and Sewage Disposal
  if (has('composting', 'bangalore method of composting', 'anaerobic composting', 'indore method of composting', 'aerobic composting', 'sanitary landfill', 'controlled tipping', 'pit latrine', 'ventilated improved pit', 'vip latrine', 'rca latrine', 'sulabh shauchalaya', 'water seal latrine', 'septic tank design', 'retention period of septic tank', 'sludge digestion', 'soakage pit', 'trickling filter', 'activated sludge process', 'biochemical oxygen demand', 'bod of sewage', 'chemical oxygen demand', 'cod of sewage', 'grit chamber', 'sewage effluent standards')) {
    if (cur !== 392) {
      return { toModule: 392, reason: 'Tests municipal solid waste disposal methods, sanitary latrines, septic tanks, and sewage treatment processes (BOD/COD)' };
    }
    return null;
  }

  // Module 393: Medical Entomology - Mosquitoes and Flies
  if (has('anopheles mosquito', 'culex mosquito', 'aedes mosquito', 'mansonia mosquito', 'resting posture of anopheles', 'resting posture of culex', 'cigar shaped eggs of anopheles', 'siphon tube of larva', 'tiger mosquito', 'tree hole breeder', 'musca domestica', 'housefly transmission', 'phlebotomus', 'sandfly morphology', 'kala-azar vector', 'tsetse fly', 'glossina', 'sleeping sickness vector', 'blackfly', 'simulium', 'river blindness vector', 'chrysops', 'deer fly')) {
    if (cur !== 393 && !has('nvbdcp')) {
      return { toModule: 393, reason: 'Tests medical entomology of dipterans: mosquito morphology/habits (Anopheles, Culex, Aedes, Mansonia) and fly vectors' };
    }
    if (cur === 393) return null;
  }

  // Module 394: Medical Entomology - Ticks, Fleas and Mites
  if (has('hard tick', 'soft tick', 'ixodidae', 'argasidae', 'scutum of tick', 'capitulum visibility', 'kfd vector tick', 'haemaphysalis spinigera', 'rat flea', 'xenopsylla cheopis', 'xenopsylla astia', 'general flea index', 'cheopis index', 'flea index > 1', 'plague vector flea', 'trombiculid mite', 'leptotrombidium deliense', 'scrub typhus vector', 'sarcoptes scabiei', 'itch mite burrows', 'pediculus humanus', 'body louse', 'head louse', 'phthirus pubis', 'crab louse', 'cyclops intermediate host', 'guinea worm cyclops')) {
    if (cur !== 394) {
      return { toModule: 394, reason: 'Tests medical entomology of arachnids and wingless insects: ticks, rat fleas (Cheopis index), mites, lice, or Cyclops' };
    }
    return null;
  }

  // Module 395: Methods of Pest Control
  if (has('organochlorine insecticide', 'ddt spray', 'residual spray ddt', 'lindane', 'bhc', 'organophosphorus insecticide', 'malathion', 'fenthion', 'abate', 'temephos larvicide', 'propoxur', 'baygon', 'synthetic pyrethroid', 'deltamethrin', 'permethrin', 'cyfluthrin', 'larvicide vs adulticide', 'space spray vs residual spray', 'insecticide resistance mechanism', 'gambusia affinis', 'poecilia reticulata', 'guppy fish larvivorous', 'bacillus thuringiensis israelensis', 'source reduction of vectors')) {
    if (cur !== 395) {
      return { toModule: 395, reason: 'Tests pest and vector control methods: chemical insecticides (organochlorines, organophosphates, pyrethroids), larvicides, or biological controls (Gambusia)' };
    }
    return null;
  }

  // Module 397: Disaster Management
  if (has('disaster cycle', 'pre-disaster phase', 'disaster mitigation', 'disaster preparedness', 'disaster response', 'disaster triage', 'triage tag red', 'triage tag yellow', 'triage tag green', 'triage tag black', 'morgue tag in disaster', 'highest priority in triage', 'bioterrorism category a', 'bioterrorism category b', 'bioterrorism category c', 'anthrax in bioterrorism', 'smallpox in bioterrorism', 'botulism in bioterrorism', 'ndma guidelines', 'epidemiological surveillance in disaster')) {
    if (cur !== 397) {
      return { toModule: 397, reason: 'Tests disaster management: disaster cycle phases, disaster color-coded triage (Red/Yellow/Green/Black), or bioterrorism category agents' };
    }
    return null;
  }

  // Module 399: Communication for Health Education
  if (has('health education communication', 'process of communication', 'sender receiver message channel', 'barriers to communication', 'didactic communication', 'socratic communication', 'one-way vs two-way communication', 'delphi technique in health', 'panel discussion', 'symposium in health education', 'role play in health', 'socio-drama', 'group discussion method', 'demonstration method', 'principles of health education', 'health belief model', 'stages of change model', 'trans-theoretical model', 'health propaganda vs health education', 'adoption of new ideas')) {
    if (cur !== 399) {
      return { toModule: 399, reason: 'Tests communication process, health education methods (panel, symposium, Delphi, role play), health behavior models, or education principles' };
    }
    return null;
  }

  // Module 400: Health Planning and Management
  if (has('health planning cycle', 'planning process steps', 'assessment of health resources', 'cost-accounting in management', 'pert method', 'program evaluation and review technique', 'cpm method', 'critical path method', 'network analysis in health', 'work sampling method', 'systems analysis in management', 'bhore committee', 'mudaliar committee', 'chadah committee', 'mukherjee committee', 'jungalwalla committee', 'kartar singh committee', 'multipurpose health worker scheme', 'shrivastav committee', 'reorientation of medical education', 'rome scheme', 'bajaj committee')) {
    if (cur !== 400) {
      return { toModule: 400, reason: 'Tests health planning cycle, management techniques (PERT, CPM, network analysis), or landmark Health Committees in India (Bhore, Mudaliar, Kartar Singh, etc.)' };
    }
    return null;
  }

  // Module 401: Healthcare in India
  if (has('subcentre population norm', 'sub-centre population', 'phc population norm', 'primary health centre population', 'chc population norm', 'community health centre population', 'staffing of phc', 'staffing of chc', 'medical officer at phc', 'asha worker population', 'asha incentives', 'roles of asha', 'anganwadi worker population', 'anm at subcentre', 'indian public health standards', 'iphs norms', 'first referral unit', 'fru criteria', 'village health sanitation and nutrition committee', 'vhsnc', 'health delivery system in india', 'three tier health system')) {
    if (cur !== 401) {
      return { toModule: 401, reason: 'Tests the healthcare delivery system in India: population norms, staffing, and functions of Sub-centres, PHCs, CHCs, and frontline workers (ASHA/ANM)' };
    }
    return null;
  }

  // Module 402: International Health
  if (has('world health organization structure', 'world health assembly', 'who executive board', 'who headquarters in geneva', 'searo regional office', 'searo in new delhi', 'unicef gobi-fff', 'gobi strategy', 'food and agriculture organization', 'fao', 'international labour organization', 'ilo headquarters', 'international red cross', 'bilateral health agencies', 'usaid', 'sida', 'danida', 'international health regulations', 'yellow fever certificate validity', 'quarantine under ihr')) {
    if (cur !== 402) {
      return { toModule: 402, reason: 'Tests international health organizations (WHO, UNICEF, FAO, ILO, Red Cross) or International Health Regulations (IHR)' };
    }
    return null;
  }

  // Module 409: Mental Health
  if (has('national mental health programme', 'nmhp', 'district mental health programme', 'dmhp', 'mental healthcare act 2017', 'community psychiatry', 'epidemiology of depression in community', 'suicide prevention in community', 'alcohol dependence epidemiology in community')) {
    if (cur !== 409) {
      return { toModule: 409, reason: 'Tests Community Mental Health programmes (NMHP/DMHP), the Mental Healthcare Act 2017, or community prevention of psychiatric disorders' };
    }
    return null;
  }

  // Module 385: Concepts of Sociology and Psychology
  if (has('family structure sociology', 'nuclear family vs joint family', 'three-generation family', 'socialization process', 'social pathology', 'culture and health', 'customs and traditions in health', 'social beliefs in disease', 'acculturation')) {
    if (cur !== 385) {
      return { toModule: 385, reason: 'Tests concepts of medical sociology, family structures, culture, beliefs, and human behavior in relation to health' };
    }
    return null;
  }

  // Module 386: Social Organization and Economics
  if (has('kuppuswamy scale', 'modified kuppuswamy', 'bg prasad scale', 'modified bg prasad', 'udai pareek scale', 'consumer price index in bg prasad', 'social stratification', 'social mobility', 'poverty line criteria', 'cost-effective analysis', 'cost-benefit analysis', 'cost-utility analysis', 'cea vs cba', 'monetary units in cba', 'qaly gained in cua', 'health economics methods')) {
    if (cur !== 386) {
      return { toModule: 386, reason: 'Tests socioeconomic status classification scales (Kuppuswamy, BG Prasad), social stratification, and health economics (CEA, CBA, CUA)' };
    }
    return null;
  }

  // Biostatistics modules (403 to 408)
  // Module 403: Descriptive Statistics I - Probability and Data
  if (has('nominal data', 'ordinal data', 'discrete variable', 'continuous variable', 'qualitative variable vs quantitative', 'scales of measurement: nominal', 'scales of measurement: ordinal', 'scales of measurement: interval', 'scales of measurement: ratio', 'bar chart vs histogram', 'component bar chart', 'pie chart degrees', 'frequency polygon', 'ogive curve', 'cumulative frequency curve', 'scatter diagram to depict', 'addition rule of probability', 'multiplication rule of probability', 'probability of mutually exclusive', 'conditional probability')) {
    if (cur !== 403) {
      return { toModule: 403, reason: 'Tests types of statistical data, scales of measurement (nominal/ordinal/interval/ratio), graphical presentation (histogram/pie chart), or probability theory' };
    }
    return null;
  }

  // Module 404: Descriptive Statistics II - Measures of Location
  if (has('arithmetic mean', 'geometric mean is best for', 'harmonic mean', 'median is preferred for skewed', 'median calculation', 'mode of distribution', 'bimodal distribution', '50th percentile is median', 'quartile deviation calculation', 'percentiles in statistics', 'measure of central tendency')) {
    if (cur !== 404) {
      return { toModule: 404, reason: 'Tests measures of central tendency / central location (Mean, Median, Mode) and partition values (Quartiles, Percentiles)' };
    }
    return null;
  }

  // Module 405: Descriptive Statistics III - Measures of Dispersion
  if (has('standard deviation calculation', 'variance in statistics', 'coefficient of variation', 'sd divided by mean', 'normal distribution curve', 'gaussian curve properties', 'area under normal curve', '68.3% within 1 sd', '95.4% within 2 sd', '99.7% within 3 sd', 'positively skewed distribution', 'negatively skewed distribution', 'mean > median > mode', 'mean < median < mode', 'standard error of mean', 'sem = sd / sqrt(n)', 'standard error of proportion', '95% confidence interval formula', 'confidence limit = mean +- 1.96', '99% confidence interval')) {
    if (cur !== 405) {
      return { toModule: 405, reason: 'Tests measures of dispersion (Standard Deviation, Variance, CV), Normal distribution curve, Skewness, Standard Error, or Confidence Intervals' };
    }
    return null;
  }

  // Module 406: Correlational and Predictive Techniques
  if (has('pearson correlation coefficient', 'spearman rank correlation', 'correlation coefficient ranges from -1 to +1', 'linear regression equation', 'regression coefficient b', 'y = a + bx', 'scatter plot showing linear correlation', 'r = 0 indicates', 'r = 1 indicates')) {
    if (cur !== 406) {
      return { toModule: 406, reason: 'Tests correlation techniques (Pearson r, Spearman rank) and predictive linear regression modeling' };
    }
    return null;
  }

  // Module 407: Tests of Significance
  if (has('null hypothesis', 'alternative hypothesis', 'type 1 error', 'type i error', 'alpha error is rejecting true null', 'type 2 error', 'type ii error', 'beta error is accepting false null', 'power of test = 1 - beta', 'p-value < 0.05 indicates', "student's t test", 'paired t test is used for', 'unpaired t test', 'two-sample t test', 'anova test for comparing means', 'f test in anova', 'chi-square test', 'chi square test of independence', 'degrees of freedom (r-1)(c-1)', "yates correction", "fisher's exact test", 'mann-whitney u test', 'wilcoxon signed rank test', 'kruskal-wallis test', 'non-parametric test equivalent')) {
    if (cur !== 407) {
      return { toModule: 407, reason: 'Tests hypothesis testing, Type I and Type II errors, p-values, or parametric/non-parametric tests of significance (t-test, ANOVA, Chi-square)' };
    }
    return null;
  }

  // Module 408: Facets of Clinical Research and Biostatistics
  if (has('simple random sampling', 'systematic random sampling', 'stratified random sampling', 'cluster sampling in surveys', 'snowball sampling', 'purposive sampling', 'quota sampling', 'multistage sampling', 'sample size calculation factors', 'meta-analysis pooling', 'forest plot interpretation', 'diamond in forest plot represents', 'funnel plot asymmetry indicates publication bias', 'phase 1 clinical trial volunteers', 'phase 2 clinical trial efficacy', 'phase 3 multicentric clinical trial', 'phase 4 post marketing surveillance', 'consort statement')) {
    if (cur !== 408) {
      return { toModule: 408, reason: 'Tests sampling techniques (random, stratified, cluster), meta-analysis (Forest/Funnel plots), or Clinical Trial Phases (Phase I to IV)' };
    }
    return null;
  }

  // Module 366: Screening
  if (has('screening test vs diagnostic test', 'sensitivity of screening test', 'specificity of screening test', 'true positives / (true positives + false negatives)', 'true negatives / (true negatives + false positives)', 'positive predictive value', 'negative predictive value', 'ppv increases with prevalence', 'npv decreases with prevalence', 'likelihood ratio positive', 'likelihood ratio negative', 'receiver operating characteristic curve', 'roc curve sensitivity vs 1-specificity', 'lead time bias in screening', 'length time bias', 'yield of screening test', 'multiphasic screening', 'wilson and jungner criteria for screening')) {
    if (cur !== 366) {
      return { toModule: 366, reason: 'Tests screening test metrics (Sensitivity, Specificity, PPV, NPV, Likelihood ratios, ROC curves, or screening evaluation biases)' };
    }
    return null;
  }

  // Module 364: Vaccine Production and Storage
  if (has('cold chain equipment', 'ice lined refrigerator', 'ilr temperature', 'deep freezer in cold chain', 'vaccine carrier with ice packs', 'day carrier', 'dial thermometer in ilr', 'stem thermometer', 'vaccine vial monitor', 'vvm stage 1', 'vvm stage 2', 'vvm stage 3', 'vvm stage 4', 'discard point on vvm', 'shake test for frozen vaccine', 'freeze sensitive vaccines', 'heat sensitive vaccines', 'most heat sensitive vaccine is opv', 'freeze dried vaccine reconstitution')) {
    if (cur !== 364) {
      return { toModule: 364, reason: 'Tests Cold Chain equipment (ILR, deep freezer, vaccine carriers), temperature monitoring, VVM stages, or vaccine storage sensitivities' };
    }
    return null;
  }

  // Module 363: Principles of Immunization and Vaccination
  if (has('active immunity vs passive immunity', 'live attenuated vaccine example', 'killed vaccine example', 'toxoid vaccine (tetanus/diphtheria)', 'cellular fraction vaccine', 'recombinant hepatitis b vaccine', 'contraindications to live vaccines', 'immunization in pregnancy', 'adverse events following immunization', 'aefi surveillance', 'anaphylaxis kit after vaccination', 'open vial policy for vaccines', 'vaccine administration routes')) {
    if (cur !== 363) {
      return { toModule: 363, reason: 'Tests fundamental principles of immunization: active vs passive immunity, vaccine types (live/killed/toxoid), contraindications, or AEFI' };
    }
    return null;
  }

  // Module 365: Sterilization and Disinfection
  if (has('autoclaving temperature and pressure', '121 c for 15 minutes', 'moist heat sterilization', 'dry heat hot air oven 160 c', 'ethylene oxide sterilization', 'glutaraldehyde 2% cidex', 'disinfection of sputum with cresol', 'disinfection of feces with bleaching powder', 'concurrent disinfection vs terminal disinfection', 'antiseptic vs disinfectant definition')) {
    if (cur !== 365) {
      return { toModule: 365, reason: 'Tests hospital and public health sterilization physical/chemical agents, autoclaving standards, or concurrent/terminal disinfection' };
    }
    return null;
  }

  // Module 359: Analytical Epidemiology
  if (has('case control study design', 'case-control study', 'odds ratio calculation', 'ad/bc in 2x2 table', 'cohort study design', 'prospective cohort study', 'retrospective cohort study', 'relative risk calculation', 'incidence in exposed / incidence in unexposed', 'attributable risk = (ie - iu) / ie', 'population attributable risk', 'cross sectional study prevalence', 'ecological study design', 'ecological fallacy', 'recall bias in case-control', 'selection bias', "berkson's bias", 'berksonian bias', 'confounding bias', 'matching in case control to eliminate confounding', 'stratified analysis for confounding', 'effect modification vs confounding')) {
    if (cur !== 359) {
      return { toModule: 359, reason: 'Tests analytical epidemiological study designs (Case-Control, Cohort, Cross-sectional, Ecological), risk estimates (OR, RR, AR), or biases/confounding' };
    }
    return null;
  }

  // Module 360: Experimental Epidemiology
  if (has('randomized controlled trial', 'rct design', 'randomization eliminates selection bias', 'blinding in clinical trials', 'single blind vs double blind vs triple blind', 'intention to treat analysis', 'placebo controlled trial', 'community trial design', 'field trial design', 'hawthorne effect in trials')) {
    if (cur !== 360) {
      return { toModule: 360, reason: 'Tests experimental epidemiological designs (Randomized Controlled Trials, randomization, blinding techniques, field/community trials)' };
    }
    return null;
  }

  // Module 361: Basic Definitions in Infectious Disease Epidemiology
  if (has('endemic disease definition', 'epidemic disease definition', 'pandemic definition', 'sporadic occurrence', 'exotic disease definition', 'hyperendemic disease', 'holoendemic disease', 'zoonosis definition', 'epizootic vs enzoonotic', 'reservoir of infection', 'carrier definition in infectious disease', 'healthy carrier vs convalescent carrier', 'incubatory carrier', 'temporary vs chronic carrier', 'herd immunity threshold', 'critical vaccination coverage formula 1 - 1/r0', 'eradication of disease definition', 'elimination of disease definition')) {
    if (cur !== 361) {
      return { toModule: 361, reason: 'Tests fundamental definitions in infectious disease epidemiology (endemic, epidemic, pandemic, carrier states, herd immunity, eradication)' };
    }
    return null;
  }

  // Module 362: Dynamics of Disease Transmission
  if (has('chain of transmission', 'direct transmission: droplet vs contact', 'indirect transmission: vehicle borne', 'air-borne transmission: droplet nuclei', 'fomite borne transmission', 'incubation period definition', 'median incubation period', 'generation time definition', 'serial interval definition', 'quarantine definition and duration', 'isolation definition and duration', 'contact tracing in transmission control', 'index case vs primary case')) {
    if (cur !== 362) {
      return { toModule: 362, reason: 'Tests dynamics of disease transmission (modes of direct/indirect transmission, incubation periods, serial intervals, quarantine, isolation)' };
    }
    return null;
  }

  // Module 358: Principles of Epidemiology
  if (has('incidence definition', 'cumulative incidence', 'incidence density', 'person years calculation', 'prevalence definition', 'point prevalence vs period prevalence', 'relationship p = i x d', 'attack rate in food poisoning', 'secondary attack rate calculation', 'crude death rate mid-year population', 'standardized mortality ratio', 'smr calculation', 'direct standardization of mortality', 'indirect standardization', 'epidemic curve interpretation', 'point source epidemic curve', 'continuous source epidemic', 'propagated epidemic curve', 'secular trend of disease', 'cyclic trend of disease', 'seasonal variation of disease', 'steps in epidemic investigation', 'spot map for spatial distribution', 'clustering of cases')) {
    if (cur !== 358) {
      return { toModule: 358, reason: 'Tests core principles of descriptive epidemiology (incidence, prevalence, rates/ratios, epidemic curves, secular/cyclic trends, epidemic investigation)' };
    }
    return null;
  }

  // Module 356: Health Determinants and Indicators
  if (has('who definition of health', 'dimensions of health: physical, mental, social', 'positive health concept', 'determinants of health', 'physical quality of life index', 'pqli indicators: infant mortality, life expectancy, literacy', 'human development index', 'hdi dimensions: health, education, income', 'disability adjusted life years', 'daly = yll + yld', 'quality adjusted life years', 'qaly', 'health adjusted life expectancy', 'hale', "sullivan's index", 'disability free life expectancy', 'case fatality rate measures severity', 'proportional mortality rate', 'international death certificate line 1a')) {
    if (cur !== 356) {
      return { toModule: 356, reason: 'Tests health determinants and composite health indicators (PQLI, HDI, DALY, QALY, Sullivan index, mortality/morbidity metrics)' };
    }
    return null;
  }

  // Module 357: Concepts of Disease and Prevention
  if (has('primordial prevention definition', 'primary prevention definition', 'health promotion and specific protection', 'secondary prevention definition', 'early diagnosis and prompt treatment', 'tertiary prevention definition', 'disability limitation and rehabilitation', 'levels of prevention in hypertension', 'natural history of disease phases', 'pre-pathogenesis phase', 'pathogenesis phase', 'iceberg phenomenon of disease', 'tip of iceberg represents clinical cases', 'submerged portion represents subclinical', 'epidemiological triad: agent host environment', 'web of causation for chronic diseases', 'beings model of disease causation', 'rothmans causal pies', 'sufficient cause and component cause')) {
    if (cur !== 357) {
      return { toModule: 357, reason: 'Tests concepts of disease causation (epidemiological triad, web of causation, BEINGS model, natural history) and levels of prevention (primordial, primary, secondary, tertiary)' };
    }
    return null;
  }

  // Specific Infectious Disease Modules:
  // Module 367: Viral Respiratory Infections
  if (has('measles epidemiology', 'koplik spots measles', 'measles incubation period', 'subacute sclerosing panencephalitis', 'sspe complication of measles', 'rubella congenital rubella syndrome', 'crs triad: cataract, pda, deafness', 'mumps parotitis', 'orchitis and oophoritis in mumps', 'chickenpox varicella rash', 'dew drop on rose petal rash', 'pleomorphic rash of chickenpox', 'centripetal distribution of rash', 'smallpox centrifugal rash', 'influenza virus antigenic shift', 'antigenic drift in influenza', 'h1n1 swine flu', 'covid-19 transmission respiratory')) {
    if (cur !== 367) {
      return { toModule: 367, reason: 'Tests epidemiology, transmission, and clinical features of Viral Respiratory Infections (Measles, Mumps, Rubella, Chickenpox, Influenza, Smallpox)' };
    }
    return null;
  }

  // Module 368: Bacterial Respiratory Infections
  if (has('diphtheria epidemiology', 'pseudomembrane diphtheria', 'schick test for diphtheria immunity', 'pertussis whooping cough 100 day cough', 'catarrhal paroxysmal convalescent stages', 'meningococcal meningitis epidemics', 'neisseria meningitidis carriage', 'acute respiratory infection ari classification in children', 'fast breathing cut offs for pneumonia')) {
    if (cur !== 368) {
      return { toModule: 368, reason: 'Tests epidemiology and prevention of Bacterial Respiratory Infections (Diphtheria, Pertussis, Meningococcal meningitis, childhood ARI)' };
    }
    return null;
  }

  // Module 369: Intestinal Infections
  if (has('poliomyelitis eradication', 'oral polio vaccine vs ipv', 'sabin vs salk vaccine', 'vaccine associated paralytic polio', 'vapp', 'vaccine derived poliovirus', 'vdpv', 'acute flaccid paralysis surveillance', 'afp surveillance in polio', 'hepatitis a epidemiology', 'hepatitis e in pregnancy high mortality', 'cholera rice water stools', 'vibrio cholerae classical vs el tor', 'cholera cot', 'rehydration in cholera', 'ors composition who osmolarity', 'reduced osmolarity ors 245 mosm', 'zinc supplementation in diarrhea', 'typhoid enteric fever step ladder fever', 'rose spots in typhoid', 'carriers of typhoid: urinary and gall bladder', 'staphylococcal food poisoning enterotoxin', 'botulism clostridium botulinum toxin', 'bacillus cereus fried rice vomiting', 'dracunculiasis guinea worm eradication')) {
    if (cur !== 369) {
      return { toModule: 369, reason: 'Tests epidemiology, transmission, and management of Intestinal and Diarrhoeal Infections (Polio, Hepatitis A/E, Cholera, Typhoid, Food Poisoning, ORS)' };
    }
    return null;
  }

  // Module 370: Arthropod-Borne Infections
  if (has('dengue fever breakbone fever', 'dengue hemorrhagic fever criteria', 'tourniquet test for dengue', 'chikungunya severe arthralgia', 'yellow fever urban vs jungle', 'lymphatic filariasis wuchereria bancrofti', 'nocturnal periodicity of microfilaria', 'dec provocation test in filariasis', 'japanese encephalitis amplification in pigs', 'ardea bird reservoir in je', 'kala-azar visceral leishmaniasis', 'pkdl post kala-azar dermal leishmaniasis', 'sandfly vector phlebotomus argentipes')) {
    if (cur !== 370 && !has('nvbdcp')) {
      return { toModule: 370, reason: 'Tests epidemiology, transmission vectors, and clinical manifestations of Arthropod-Borne Infections (Dengue, Chikungunya, Filariasis, JE, Leishmaniasis)' };
    }
    if (cur === 370) return null;
  }

  // Module 371: Zoonotic Infections - Viral
  if (has('rabies hydrophobia', 'street virus vs fixed virus in rabies', 'post exposure prophylaxis rabies wound washing', 'anti-rabies vaccination essen schedule', 'thai red cross intradermal regimen', 'rabies immunoglobulin rig administration', 'category i ii iii bite of rabies', 'kyasanur forest disease kfd monkey fever', 'nipah virus transmission fruit bats', 'crimean congo hemorrhagic fever', 'ebola virus transmission')) {
    if (cur !== 371) {
      return { toModule: 371, reason: 'Tests epidemiology, transmission, and post-exposure prophylaxis of Viral Zoonotic Infections (Rabies category bites & PEP schedules, KFD, Nipah)' };
    }
    return null;
  }

  // Module 372: Zoonotic Infections - Bacterial & Parasitic
  if (has('brucellosis undulant fever', 'brucella abortus / melitensis transmission raw milk', 'leptospirosis weils disease', 'leptospira icterohaemorrhagiae rat urine', 'plague yersinia pestis', 'bubonic plague vs pneumonic plague', 'anthrax bacillus anthracis', 'woolsorters disease cutaneous anthrax', 'scrub typhus orientia tsutsugamushi', 'eschar in scrub typhus', 'epidemic typhus rickettsia prowazekii louse', 'endemic murine typhus rickettsia typhi', 'q fever coxiella burnetii unpasteurized milk', 'hydatid cyst disease echinococcus granulosus dog feces', 'cysticercosis taenia solium pork tapeworm', 'trichinosis undercooked pork')) {
    if (cur !== 372) {
      return { toModule: 372, reason: 'Tests epidemiology and transmission of Bacterial and Parasitic Zoonoses (Brucellosis, Leptospirosis, Plague, Anthrax, Rickettsial typhus, Q fever, Hydatid disease)' };
    }
    return null;
  }

  // Module 373: STDs and Surface Infections
  if (has('syphilis primary chancre', 'treponema pallidum vdrl rpr', 'hutchinson triad in congenital syphilis', 'gonorrhea neisseria gonorrhoeae urethritis', 'chlamydia trachomatis d-k nongonococcal urethritis', 'chancroid haemophilus ducreyi painful ulcer', 'lymphogranuloma venereum groove sign', 'donovanosis granuloma inguinale donovan bodies', 'syndromic management of stis who kits', 'color coded kit 1 for urethral discharge', 'kit 2 for vaginitis', 'kit 5 for genital ulcer non-herpetic', 'tetanus clostridium tetani lockjaw risus sardonicus', 'tetanus neonatorum 8th day disease', 'tetanus prophylaxis in wound management', 'trachoma chlamydia trachomatis a b ba c', 'safe strategy for trachoma elimination', 'yaws treponema pertenue')) {
    if (cur !== 373) {
      return { toModule: 373, reason: 'Tests epidemiology and public health syndromic management of STIs (syphilis, gonorrhea, chancroid, kits 1-7), Tetanus, or Trachoma (SAFE strategy)' };
    }
    return null;
  }

  // Module 355: History of Medicine
  if (has('father of medicine hippocrates', 'hippocratic oath', 'galen experimental physiology', 'father of modern anatomy andreas vesalius', 'william harvey circulation of blood', 'father of immunology edward jenner', 'smallpox vaccine discovery jenner', 'louis pasteur germ theory', 'pasteurization discovery pasteur', 'rabies vaccine pasteur', 'robert koch discoverer of tubercle bacillus', 'koch postulates', 'joseph lister father of antiseptic surgery', 'paul ehrlich magic bullet', 'alexander fleming discovery of penicillin', 'father of modern epidemiology john snow', 'broad street pump cholera john snow', 'ignaz semmelweis hand washing childbed fever', 'edwin chadwick sanitary awakening report 1842', 'father of public health cholera', 'charaka father of indian medicine', 'sushruta father of indian surgery', 'ayurveda history dosha', 'samuel hahnemann father of homeopathy', 'dawn of scientific medicine', 'alma ata declaration 1978 health for all')) {
    if (cur !== 355) {
      return { toModule: 355, reason: 'Tests historical milestones, pioneers of medicine (Hippocrates, Jenner, Pasteur, Koch, Snow, Chadwick), or history of public health' };
    }
    return null;
  }

  // If question is in 355 and wasn't matched above, let's see why it's in 355!
  // Remember: 355 is "History of Medicine". If a question in 355 is NOT about the history of medicine, it MUST be audited and relocated.
  if (cur === 355) {
    // Let's do secondary deeper checks for questions stuck in 355
    return { needsInspection: true };
  }

  return null;
}

process.exit(0);
