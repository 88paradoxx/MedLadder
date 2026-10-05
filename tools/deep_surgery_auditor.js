const fs = require('fs');
const { clean, matchTerm, rawQuestions, modMap } = require('./surgery_auditor_base');

function evaluateQuestion(q) {
  const cur = q.module_id;
  const id = q.id;
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
  const stem = qText.toLowerCase();
  const ans = ansText.toLowerCase();

  const has = (...terms) => terms.some(t => matchTerm(full, t));
  const stemHas = (...terms) => terms.some(t => matchTerm(stem, t));
  const ansHas = (...terms) => terms.some(t => matchTerm(ans, t));
  const qAnsHas = (...terms) => terms.some(t => matchTerm(qAndAns, t));

  // =========================================================================
  // 1. CROSS-SUBJECT EVALUATION
  // =========================================================================

  // --- Psychiatry ---
  if (has('defense mechanism', 'sublimation', 'reaction formation', 'projection', 'displacement', 'rationalization', 'splitting') &&
      !has('hernia', 'burn', 'wound', 'trauma', 'breast', 'thyroid')) {
    return { toModule: 687, reason: 'Tests psychodynamic defense mechanisms, belonging to Psychiatry under Module 687 (Theories of Personality & Defense Mechanisms).' };
  }
  if ((stemHas('schizophrenia', 'delusion', 'hallucination') || ansHas('schizophrenia', 'delusion')) &&
      !has('pheochromocytoma', 'insulinoma', 'delirium tremens', 'head injury', 'trauma')) {
    return { toModule: 694, reason: 'Tests schizophrenia spectrum and psychotic disorders, belonging to Psychiatry under Module 694 (Schizophrenia Spectrum and Other Psychotic Disorders).' };
  }
  if (has('bipolar', 'lithium toxicity', 'mania', 'hypomania') && !has('thyroid', 'adrenal', 'trauma')) {
    return { toModule: 695, reason: 'Tests bipolar affective disorder and mood stabilizer management, belonging to Psychiatry under Module 695 (Bipolar and Related Disorders).' };
  }
  if (has('major depressive disorder', 'mdd', 'ssri', 'citalopram', 'sertraline', 'escitalopram', 'snri') &&
      !has('breast', 'tamoxifen', 'pain', 'burn', 'surgery')) {
    return { toModule: 696, reason: 'Tests depressive disorders and antidepressant therapy, belonging to Psychiatry under Module 696 (Depressive Disorders).' };
  }
  if (has('anorexia nervosa', 'bulimia nervosa') && !has('bariatric', 'refeeding syndrome')) {
    return { toModule: 701, reason: 'Tests eating disorders (anorexia/bulimia nervosa), belonging to Psychiatry under Module 701 (Feeding and Eating Disorders).' };
  }

  // --- Obstetrics & Gynaecology ---
  if (has('postpartum hemorrhage', 'carboprost', 'methylergonovine', 'uterine atony', 'b-lynch suture', 'bakri balloon', 'inversion of uterus') &&
      !has('wound', 'burn', 'trauma')) {
    return { toModule: 549, reason: 'Tests etiology, medical and surgical management of postpartum hemorrhage (PPH), belonging to Obstetrics under Module 549 (Postpartum Haemorrhage).' };
  }
  if (has('placenta previa', 'abruptio placentae', 'antepartum hemorrhage', 'couvelaire uterus') && !has('trauma')) {
    return { toModule: 548, reason: 'Tests antepartum hemorrhage (placenta previa/abruptio placentae), belonging to Obstetrics under Module 548 (Antepartum Hemorrhage).' };
  }
  if (has('preeclampsia', 'eclampsia', 'magnesium sulfate', 'pritchard regimen', 'zuspan regimen', 'hellp syndrome') && !has('shock')) {
    return { toModule: 545, reason: 'Tests hypertensive disorders of pregnancy and magnesium sulfate prophylaxis, belonging to Obstetrics under Module 545 (Hypertensive Disorders of Pregnancy).' };
  }
  if (has('partogram', 'latent phase of labor', 'active phase of labor', 'bishop score', 'induction of labor', 'fetal distress') && !has('trauma')) {
    return { toModule: 541, reason: 'Tests labor mechanisms, partogram, and induction, belonging to Obstetrics under Module 541 (Physiology of Normal Labour) or 542.' };
  }
  if (has('cervical cancer', 'cervical intraepithelial neoplasia', 'cin 1', 'cin 2', 'cin 3', 'pap smear', 'bethesda system for cervical', 'hpv 16', 'hpv 18', 'transformation zone of cervix') &&
      !has('anal canal', 'penile cancer', 'vulvar')) {
    return { toModule: 569, reason: 'Tests cervical screening, pre-invasive lesions and carcinoma cervix, belonging to Gynaecology under Module 569 (Carcinoma Cervix).' };
  }
  if (has('endometrial carcinoma', 'endometrial hyperplasia', 'tamoxifen induced endometrial', 'atypical endometrial hyperplasia') &&
      !has('breast cancer', 'tamoxifen mechanism')) {
    return { toModule: 571, reason: 'Tests endometrial hyperplasia and carcinoma, belonging to Gynaecology under Module 571 (Endometrial Carcinoma & Uterine Sarcoma).' };
  }
  if (has('fibroid uterus', 'uterine leiomyoma', 'submucosal fibroid', 'intramural fibroid', 'myomectomy', 'red degeneration of fibroid', 'adenomyosis') &&
      !has('breast', 'hernia')) {
    return { toModule: 564, reason: 'Tests benign uterine smooth muscle tumors (fibroid/adenomyosis), belonging to Gynaecology under Module 564 (Fibroid and Adenomyosis).' };
  }
  if (has('dermoid cyst of ovary', 'mature cystic teratoma of ovary', 'struma ovarii', 'dysgerminoma', 'yolk sac tumor of ovary', 'granulosa cell tumor of ovary', 'call-exner bodies') &&
      !has('testis', 'testicular', 'sacrococcygeal', 'gastric cancer', 'krukenberg')) {
    return { toModule: 570, reason: 'Tests ovarian tumors and germ cell/stromal neoplasms, belonging to Gynaecology under Module 570 (Ovarian Tumors / Adnexal Malignancies).' };
  }
  if (has('heavy menstrual bleeding', 'abnormal uterine bleeding', 'aub-p', 'aub-l', 'aub-m', 'palmcocen') && !has('trauma', 'head injury')) {
    return { toModule: 562, reason: 'Tests abnormal uterine bleeding classification and diagnosis, belonging to Gynaecology under Module 562 (Abnormal Uterine Bleeding).' };
  }

  // --- Orthopaedics ---
  if (has('supracondylar fracture', 'volkmann ischemic contracture', 'vic', 'gunstock deformity', 'cubitus varus') && !has('burn', 'wound')) {
    return { toModule: 661, reason: 'Tests pediatric supracondylar humerus fracture and neurovascular complications, belonging to Orthopaedics under Module 661 (Injuries of Elbow and Forearm).' };
  }
  if (has('colles fracture', 'smith fracture', 'barton fracture', 'scaphoid fracture', 'dinner fork deformity', 'anatomical snuffbox tenderness') && !has('burn')) {
    return { toModule: 662, reason: 'Tests fractures of distal radius and carpal bones, belonging to Orthopaedics under Module 662 (Injuries Around Wrist).' };
  }
  if (has('femoral neck fracture', 'transcervical fracture', 'intertrochanteric fracture', 'subtrochanteric fracture', 'garden classification', 'avascular necrosis of femoral head', 'pauwels classification') && !has('burn')) {
    return { toModule: 664, reason: 'Tests proximal femoral fractures and blood supply complications, belonging to Orthopaedics under Module 664 (Injuries Around Hip and Proximal Femur).' };
  }
  if (has('monteggia fracture', 'galeazzi fracture', 'nightstick fracture') && !has('burn')) {
    return { toModule: 661, reason: 'Tests forearm fracture-dislocations (Monteggia/Galeazzi), belonging to Orthopaedics under Module 661 (Injuries of Elbow and Forearm).' };
  }
  if (has('osteosarcoma', 'sunburst appearance', 'codman triangle', 'ewing sarcoma', 'onion skin appearance', 'giant cell tumor', 'soap bubble appearance', 'osteochondroma') &&
      !has('amputation', 'burn', 'wound', 'head injury')) {
    return { toModule: 676, reason: 'Tests primary bone tumors, classic radiological signs and histopathology, belonging to Orthopaedics under Module 676 (Bone Tumours - General Principles & Benign Tumours).' };
  }
  if (has('ddh', 'developmental dysplasia of the hip', 'barlow test', 'ortolani test', 'perthes disease', 'legg-calve-perthes', 'slipped capital femoral epiphysis', 'scfe', 'ctev', 'talipes equinovarus', 'ponseti technique') && !has('hernia', 'burn')) {
    return { toModule: 673, reason: 'Tests pediatric orthopaedic conditions (DDH/CTEV/Perthes/SCFE), belonging to Orthopaedics under Module 673 (Paediatric Orthopaedics).' };
  }

  // --- Anaesthesia ---
  if (has('mallampati score', 'cormack-lehane', 'laryngeal mask airway', 'fastrach lma', 'proseal lma', 'difficult airway algorithm', 'bougie', 'videolaryngoscope') &&
      !has('trauma', 'burn', 'pediatric surgery', 'head injury')) {
    return { toModule: 613, reason: 'Tests airway evaluation and supraglottic airway devices, belonging to Anaesthesia under Module 613 (Airway Devices).' };
  }
  if (has('succinylcholine', 'suxamethonium', 'phase ii block', 'pseudocholinesterase deficiency', 'rocuronium', 'sugammadex', 'vecuronium', 'train-of-four') &&
      !has('burns', 'shock', 'trauma')) {
    return { toModule: 618, reason: 'Tests neuromuscular blockers and reversal agents, belonging to Anaesthesia under Module 618 (Neuromuscular Blockers).' };
  }
  if (has('malignant hyperthermia', 'dantrolene sodium', 'ryanodine receptor 1', 'ryr1 mutation', 'caffeine halothane contracture test') &&
      !has('burn', 'trauma')) {
    return { toModule: 620, reason: 'Tests malignant hyperthermia etiology and management with dantrolene, belonging to Anaesthesia under Module 620 (Complications of Anaesthesia).' };
  }
  if (has('bupivacaine toxicity', 'intralipid', 'lipid emulsion therapy', 'maximum dose of lignocaine', 'maximum dose of bupivacaine', 'last algorithm') &&
      !has('wound', 'burn', 'hernia')) {
    return { toModule: 621, reason: 'Tests local anaesthetic systemic toxicity (LAST) and pharmacological limits, belonging to Anaesthesia under Module 621 (Local Anaesthetics).' };
  }
  if (has('spinal anaesthesia', 'subarachnoid block', 'post dural puncture headache', 'pdph', 'epidural blood patch', 'ligamentum flavum', 'quincke needle', 'whitacre needle') &&
      !has('trauma', 'hernia', 'vascular')) {
    return { toModule: 622, reason: 'Tests central neuraxial blocks and complications, belonging to Anaesthesia under Module 622 (Central Neuraxial Blocks).' };
  }
  if (has('capnography', 'end tidal co2', 'etco2', 'curare cleft', 'esophageal intubation on capnogram', 'shark fin appearance') &&
      !has('laparoscopy', 'pneumoperitoneum', 'trauma')) {
    return { toModule: 612, reason: 'Tests intraoperative respiratory monitoring and capnography waveforms, belonging to Anaesthesia under Module 612 (Respiratory Monitoring in Anaesthesia).' };
  }

  // --- Ophthalmology ---
  if (has('cataract surgery', 'phacoemulsification', 'intraocular lens', 'iol power calculation', 'biometry', 'posterior capsular opacification', 'yag capsulotomy') &&
      !has('burn', 'trauma')) {
    return { toModule: 340, reason: 'Tests cataract surgical techniques, IOLs, and postoperative complications, belonging to Ophthalmology under Module 340 (Lens - Cataract Surgery, Complications and IOLs).' };
  }
  if (has('glaucoma', 'trabeculectomy', 'timolol eye drops', 'latanoprost', 'cup disc ratio', 'closed angle glaucoma', 'open angle glaucoma', 'gonioscopy') &&
      !has('trauma', 'burn')) {
    return { toModule: 343, reason: 'Tests glaucoma diagnosis, medical and surgical management, belonging to Ophthalmology under Module 343 (Glaucoma - Clinical Features & Management).' };
  }
  if (has('retinal detachment', 'rhegmatogenous', 'proliferative diabetic retinopathy', 'panretinal photocoagulation', 'cherry red spot at macula', 'central retinal artery occlusion') &&
      !has('head injury', 'trauma')) {
    return { toModule: 346, reason: 'Tests retinal vascular diseases and retinal detachment, belonging to Ophthalmology under Module 346 (Diseases of Retina).' };
  }

  // --- ENT ---
  if (has('cholesteatoma', 'attic perforation', 'csom atticoantral', 'tympanoplasty', 'mastoidectomy', 'kanas') &&
      !has('trauma', 'head injury')) {
    return { toModule: 299, reason: 'Tests chronic suppurative otitis media and cholesteatoma, belonging to ENT under Module 299 (Chronic Suppurative Otitis Media).' };
  }
  if (has('otosclerosis', 'carhart notch', 'schwartze sign', 'stapedectomy', 'stapedotomy', 'flamingo pink') &&
      !has('trauma')) {
    return { toModule: 301, reason: 'Tests otosclerosis diagnosis and surgical management, belonging to ENT under Module 301 (Otosclerosis).' };
  }
  if (has('juvenile nasopharyngeal angiofibroma', 'jna', 'holman-miller sign', 'antral sign', 'sphenopalatine foramen') &&
      !has('trauma')) {
    return { toModule: 320, reason: 'Tests juvenile nasopharyngeal angiofibroma (JNA), belonging to ENT under Module 320 (Nasopharynx and its Disorders).' };
  }
  if (has('vocal cord nodule', 'singer node', 'vocal cord polyp', 'reinke edema', 'laryngeal papillomatosis', 'laryngomalacia', 'omega shaped epiglottis') &&
      !has('thyroidectomy', 'recurrent laryngeal nerve', 'trauma', 'intubation')) {
    return { toModule: 325, reason: 'Tests benign laryngeal pathology and vocal cord lesions, belonging to ENT under Module 325 (Larynx and its Disorders).' };
  }

  // --- Forensic Medicine ---
  if (has('algor mortis', 'livor mortis', 'rigor mortis', 'cadaveric spasm', 'adipocere', 'mummification', 'casper dictum', 'postmortem hypostasis') &&
      !has('burn', 'wound healing')) {
    return { toModule: 276, reason: 'Tests post-mortem changes and time since death estimation, belonging to Forensic Medicine under Module 276 (Death and Post-Mortem Changes).' };
  }
  if (has('firearm', 'rifling of barrel', 'choke of shotgun', 'entry wound', 'exit wound', 'tattooing', 'powder burns in firearm') &&
      !has('trauma', 'atls')) {
    return { toModule: 280, reason: 'Tests firearm ballistics and gunshot wound characteristics, belonging to Forensic Medicine under Module 280 (Firearm Injuries).' };
  }
  if (has('hanging', 'hyoid bone fracture in hanging', 'ligature mark in hanging', 'diatom test in drowning', 'gettle test', 'paltauf hemorrhages') &&
      !has('trauma')) {
    return { toModule: 281, reason: 'Tests mechanical asphyxial deaths (hanging/strangulation/drowning), belonging to Forensic Medicine under Module 281 (Mechanical Asphyxia).' };
  }

  // --- PSM ---
  if (has('biomedical waste', 'bmw rules', 'yellow bag', 'red bag', 'blue bag', 'white translucent container', 'disposal of sharps', 'disposal of placenta', 'incinerator double chamber') &&
      !has('who surgical checklist', 'audit')) {
    return { toModule: 396, reason: 'Tests biomedical waste categorization, segregation and disposal regulations, belonging to PSM under Module 396 (Biomedical Waste Management).' };
  }
  if (has('sensitivity of test', 'specificity of test', 'positive predictive value', 'negative predictive value', 'receiver operating characteristic', 'roc curve') &&
      !has('trauma score', 'alvarado score', 'bisap', 'gcs')) {
    return { toModule: 360, reason: 'Tests screening test performance metrics and predictive values, belonging to PSM under Module 360 (Screening for Disease).' };
  }
  if (has('case control study', 'cohort study', 'odds ratio', 'relative risk', 'attributable risk', 'confounding bias', 'selection bias', 'randomized controlled trial phase') &&
      !has('surgical audit', 'clinical trial in surgery')) {
    return { toModule: 359, reason: 'Tests epidemiological study designs and measures of association, belonging to PSM under Module 359 (Analytical Epidemiology).' };
  }

  // --- Dermatology ---
  if (has('pemphigus vulgaris', 'bullous pemphigoid', 'nikolsky sign', 'tombstone appearance', 'desmoglein 3', 'desmoglein 1') &&
      !has('burn', 'wound')) {
    return { toModule: 641, reason: 'Tests immunobullous cutaneous disorders (pemphigus/pemphigoid), belonging to Dermatology under Module 641 (Vesiculobullous Disorders).' };
  }
  if (has('psoriasis vulgaris', 'auspitz sign', 'munro microabscesses', 'lichen planus', 'wickham striae', 'saw tooth rete ridges') &&
      !has('wound', 'burn', 'skin malignancy')) {
    return { toModule: 640, reason: 'Tests papulosquamous dermatological disorders (psoriasis/lichen planus), belonging to Dermatology under Module 640 (Papulosquamous Disorders).' };
  }
  if (has('leprosy', 'mycobacterium leprae', 'lepromin test', 'ridley jopling', 'erythema nodosum leprosum') &&
      !has('nerve biopsy', 'ulcer')) {
    return { toModule: 644, reason: 'Tests leprosy classification and cutaneous manifestations, belonging to Dermatology under Module 644 (Bacterial Infections of Skin).' };
  }

  // --- Pediatrics (Medical) ---
  if (has('developmental milestone', 'social smile age', 'neck holding age', 'pincer grasp age', 'walking age') &&
      !has('pediatric surgery', 'congenital anomaly')) {
    return { toModule: 578, reason: 'Tests developmental milestone attainment in children, belonging to Pediatrics under Module 578 (Developmental Milestones).' };
  }
  if (has('neonatal resuscitation program', 'nrp guidelines', 'apgar score calculation') &&
      !has('cdh', 'omphalocele', 'gastroschisis', 'tracheoesophageal fistula')) {
    return { toModule: 577, reason: 'Tests neonatal resuscitation algorithms and Apgar scoring, belonging to Pediatrics under Module 577 (Apgar score and Neonatal Resuscitation).' };
  }
  if (has('kwashiorkor', 'marasmus', 'severe acute malnutrition', 'sam criteria', 'edema in malnutrition') &&
      !has('surgical nutrition', 'tpn', 'refeeding')) {
    return { toModule: 585, reason: 'Tests pediatric malnutrition syndromes (kwashiorkor/marasmus), belonging to Pediatrics under Module 585 (Nutritional Disorders).' };
  }

  // --- Internal Medicine ---
  if (has('diabetic ketoacidosis', 'dka management', 'hyperosmolar hyperglycemic state', 'hhs') &&
      !has('bariatric', 'metabolic surgery', 'trauma', 'burn')) {
    return { toModule: 421, reason: 'Tests acute metabolic complications of diabetes (DKA/HHS), belonging to Internal Medicine under Module 421 (Diabetes Mellitus - Complications & Management).' };
  }
  if (has('st-elevation myocardial infarction', 'stemi', 'troponin i elevation', 'primary pci in stemi', 'fibrinolysis in stemi') &&
      !has('trauma', 'shock', 'burn', 'preoperative cardiac evaluation')) {
    return { toModule: 428, reason: 'Tests acute coronary syndromes and medical reperfusion in STEMI, belonging to Internal Medicine under Module 428 (Ischemic Heart Disease).' };
  }

  return null;
}

module.exports = {
  evaluateQuestion
};
