const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_surgery.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function matchTerm(text, term) {
  if (!text || !term) return false;
  if (term.length <= 4) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('\\b' + escaped + '\\b', 'i').test(text);
  }
  return text.toLowerCase().includes(term.toLowerCase());
}

const cleanedQuestions = rawQuestions.map(q => {
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

console.log(`Cleaned ${cleanedQuestions.length} questions.`);

// Let's create an evaluation engine
function evaluate(q) {
  const full = q.full;
  const qText = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();
  const qAndAns = q.qAndAns;
  const cur = q.currentModule;

  const has = (...terms) => terms.some(t => matchTerm(full, t));
  const qHas = (...terms) => terms.some(t => matchTerm(qText, t));
  const ansHas = (...terms) => terms.some(t => matchTerm(ans, t));
  const qAnsHas = (...terms) => terms.some(t => matchTerm(qAndAns, t));

  // =========================================================================
  // 1. CROSS-SUBJECT EVALUATION
  // =========================================================================

  // Psychiatry
  if (has('defense mechanism', 'sublimation', 'reaction formation', 'projection', 'schizophrenia', 'delusion', 'hallucination', 'bipolar disorder', 'major depressive disorder', 'lithium toxicity', 'anorexia nervosa', 'bulimia nervosa', 'panic disorder', 'generalized anxiety disorder') &&
      !has('phaeochromocytoma', 'pheochromocytoma', 'cushing', 'insulinoma', 'carcinoid', 'burn', 'trauma', 'head injury')) {
    if (has('defense mechanism', 'sublimation', 'reaction formation', 'projection')) {
      return { toModule: 687, reason: 'Tests psychodynamic defense mechanisms, belonging to Psychiatry under Module 687 (Theories of Personality & Defense Mechanisms).' };
    }
    if (has('schizophrenia', 'delusion of persecution', 'thought broadcast')) {
      return { toModule: 694, reason: 'Tests psychotic disorders / schizophrenia, belonging to Psychiatry under Module 694 (Schizophrenia Spectrum and Other Psychotic Disorders).' };
    }
    if (has('bipolar', 'mania', 'lithium')) {
      return { toModule: 695, reason: 'Tests bipolar affective disorder and mood stabilizers, belonging to Psychiatry under Module 695 (Bipolar and Related Disorders).' };
    }
    if (has('major depressive', 'depression', 'ssri')) {
      return { toModule: 696, reason: 'Tests depressive disorders and pharmacotherapy, belonging to Psychiatry under Module 696 (Depressive Disorders).' };
    }
  }

  // Obstetrics & Gynaecology
  if (has('placenta previa', 'abruptio placentae', 'postpartum hemorrhage', 'carboprost', 'uterotonic', 'preeclampsia', 'eclampsia', 'gestational diabetes', 'labour', 'partogram', 'amniotic fluid') &&
      !has('wound', 'burn', 'pediatric', 'rhabdomyosarcoma')) {
    if (has('postpartum hemorrhage', 'carboprost', 'atonic uterus')) {
      return { toModule: 549, reason: 'Tests etiology and pharmacological management of postpartum hemorrhage (PPH), belonging to Obstetrics under Module 549 (Postpartum Haemorrhage).' };
    }
    if (has('placenta previa', 'abruptio placentae', 'antepartum hemorrhage')) {
      return { toModule: 548, reason: 'Tests antepartum hemorrhage (placenta previa / abruptio), belonging to Obstetrics under Module 548 (Antepartum Hemorrhage).' };
    }
    if (has('preeclampsia', 'eclampsia', 'magnesium sulfate', 'pritchard')) {
      return { toModule: 545, reason: 'Tests hypertensive disorders of pregnancy (preeclampsia/eclampsia), belonging to Obstetrics under Module 545 (Hypertensive Disorders of Pregnancy).' };
    }
  }
  if (has('endometrial carcinoma', 'cervical cancer', 'cervical intraepithelial', 'hpv 16', 'pap smear', 'fibroid uterus', 'leiomyoma', 'adenomyosis', 'endometriosis', 'ovarian cancer', 'dermoid cyst of ovary', 'granulosa cell tumor', 'krukenberg tumor of ovary') &&
      !has('gastric cancer', 'colon cancer', 'breast cancer', 'rectal cancer')) {
    if (has('cervical cancer', 'cervical intraepithelial', 'cin', 'pap smear')) {
      return { toModule: 569, reason: 'Tests cervical screening, pre-invasive lesions and carcinoma cervix, belonging to Gynaecology under Module 569 (Carcinoma Cervix).' };
    }
    if (has('endometrial', 'adenomyosis', 'fibroid', 'leiomyoma', 'heavy menstrual bleeding')) {
      return { toModule: 564, reason: 'Tests uterine pathology (leiomyoma/fibroid/adenomyosis), belonging to Gynaecology under Module 564 (Fibroid and Adenomyosis).' };
    }
    if (has('ovarian cancer', 'dermoid cyst', 'teratoma of ovary', 'dysgerminoma', 'granulosa cell')) {
      return { toModule: 570, reason: 'Tests ovarian neoplasms and cysts, belonging to Gynaecology under Module 570 (Ovarian Tumors / Adnexal Malignancies).' };
    }
  }

  // Orthopaedics
  if (has('fracture clavicle', 'fracture humerus', 'supracondylar fracture', 'monteggia', 'galeazzi', 'colles fracture', 'smith fracture', 'scaphoid fracture', 'femur neck fracture', 'trochanteric fracture', 'tibia fracture', 'ankle fracture', 'compartment syndrome of limb', 'fat embolism syndrome', 'osteosarcoma', 'ewing sarcoma', 'giant cell tumor of bone', 'osteochondroma', 'ddh', 'developmental dysplasia of hip', 'ctev', 'clubfoot', 'perthes disease', 'slipped capital femoral epiphysis') &&
      !has('head injury', 'atls', 'gcs', 'flail chest', 'blunt trauma abdomen', 'splenic laceration', 'liver laceration', 'burns')) {
    if (has('supracondylar fracture', 'volkmann ischemic contracture', 'cubitus varus')) {
      return { toModule: 661, reason: 'Tests pediatric elbow injuries (supracondylar humerus fracture) and neurovascular complications, belonging to Orthopaedics under Module 661 (Injuries of Elbow and Forearm).' };
    }
    if (has('colles', 'smith fracture', 'scaphoid fracture', 'dinner fork deformity')) {
      return { toModule: 662, reason: 'Tests distal radius and wrist fractures, belonging to Orthopaedics under Module 662 (Injuries Around Wrist).' };
    }
    if (has('femur neck fracture', 'intertrochanteric', 'subtrochanteric', 'avascular necrosis of femoral head')) {
      return { toModule: 664, reason: 'Tests proximal femoral fractures and blood supply complications, belonging to Orthopaedics under Module 664 (Injuries Around Hip and Proximal Femur).' };
    }
    if (has('osteosarcoma', 'sunburst', 'codman triangle', 'ewing sarcoma', 'onion peel', 'giant cell tumor', 'soap bubble')) {
      return { toModule: 676, reason: 'Tests primary benign and malignant bone tumors, belonging to Orthopaedics under Module 676 (Bone Tumours - General Principles & Benign Tumours) or 677.' };
    }
    if (has('ddh', 'developmental dysplasia of the hip', 'barlow', 'ortolani', 'ctev', 'talipes equinovarus', 'ponseti', 'perthes', 'scfe')) {
      return { toModule: 673, reason: 'Tests pediatric orthopaedic congenital and developmental disorders (DDH/CTEV/Perthes), belonging to Orthopaedics under Module 673 (Paediatric Orthopaedics).' };
    }
  }

  // Anaesthesia
  if (has('mallampati score', 'cormack-lehane', 'endotracheal tube', 'laryngeal mask airway', 'lma', 'rapid sequence induction', 'succinylcholine', 'vecuronium', 'rocuronium', 'malignant hyperthermia', 'dantrolene', 'propofol', 'etomidate', 'ketamine', 'sevoflurane', 'desflurane', 'isoflurane', 'spinal anaesthesia', 'epidural anaesthesia', 'bupivacaine toxicity', 'lipid emulsion', 'capnography', 'curare cleft') &&
      !has('burn', 'trauma', 'head injury', 'fasting')) {
    if (has('mallampati', 'cormack-lehane', 'laryngeal mask', 'airway device', 'endotracheal intubation')) {
      return { toModule: 613, reason: 'Tests airway assessment and devices in anaesthesia, belonging to Anaesthesia under Module 613 (Airway Devices).' };
    }
    if (has('succinylcholine', 'vecuronium', 'rocuronium', 'neuromuscular blocker', 'pseudocholinesterase deficiency')) {
      return { toModule: 618, reason: 'Tests neuromuscular blocking agents and monitoring, belonging to Anaesthesia under Module 618 (Neuromuscular Blockers).' };
    }
    if (has('malignant hyperthermia', 'dantrolene', 'ryanodine receptor', 'ryr1')) {
      return { toModule: 620, reason: 'Tests malignant hyperthermia pathophysiology and treatment with dantrolene, belonging to Anaesthesia under Module 620 (Complications of Anaesthesia).' };
    }
    if (has('spinal anaesthesia', 'epidural anaesthesia', 'post dural puncture headache', 'pdph', 'subarachnoid block')) {
      return { toModule: 622, reason: 'Tests neuraxial anaesthesia (spinal/epidural) and complications, belonging to Anaesthesia under Module 622 (Central Neuraxial Blocks).' };
    }
    if (has('bupivacaine', 'lignocaine', 'lidocaine', 'local anaesthetic systemic toxicity', 'last')) {
      return { toModule: 621, reason: 'Tests local anaesthetic pharmacology and systemic toxicity management, belonging to Anaesthesia under Module 621 (Local Anaesthetics).' };
    }
  }

  // Ophthalmology
  if (has('glaucoma', 'trabeculectomy', 'cataract', 'phacoemulsification', 'intraocular lens', 'iol', 'retinal detachment', 'diabetic retinopathy', 'uveitis', 'corneal ulcer', 'keratitis', 'hypopyon', 'strabismus', 'amblyopia', 'chalazion', 'stye') &&
      !has('burn', 'head injury', 'marjolin', 'melanoma')) {
    if (has('cataract', 'phacoemulsification', 'intraocular lens')) {
      return { toModule: 340, reason: 'Tests cataract pathogenesis, types, surgery and IOLs, belonging to Ophthalmology under Module 340 (Lens - Cataract Surgery, Complications and IOLs).' };
    }
    if (has('glaucoma', 'intraocular pressure', 'cup disc ratio', 'trabecular meshwork')) {
      return { toModule: 343, reason: 'Tests glaucoma pathophysiology, diagnosis and management, belonging to Ophthalmology under Module 343 (Glaucoma - Clinical Features & Management).' };
    }
    if (has('retina', 'retinal detachment', 'macula', 'diabetic retinopathy', 'cotton wool spots', 'neovascularization')) {
      return { toModule: 346, reason: 'Tests diseases of retina and vitreous, belonging to Ophthalmology under Module 346 (Diseases of Retina).' };
    }
  }

  // ENT
  if (has('cholesteatoma', 'otitis media', 'otosclerosis', 'stapedectomy', 'acoustic neuroma', 'vestibular schwannoma', 'meniere disease', 'presbycusis', 'rhinoplasty', 'deviated nasal septum', 'dns', 'atrophic rhinitis', 'allergic rhinitis', 'juvenile nasopharyngeal angiofibroma', 'jna', 'tonsillitis', 'tonsillectomy', 'adenoid hypertrophy', 'vocal nodule', 'vocal cord polyp', 'laryngomalacia', 'reinke edema') &&
      !has('trauma', 'burn', 'parotid', 'thyroid', 'oral cancer')) {
    if (has('cholesteatoma', 'attic perforation', 'csom', 'tympanoplasty', 'mastoidectomy')) {
      return { toModule: 299, reason: 'Tests chronic suppurative otitis media and cholesteatoma, belonging to ENT under Module 299 (Chronic Suppurative Otitis Media).' };
    }
    if (has('otosclerosis', 'carhart notch', 'schwartze sign', 'stapedectomy')) {
      return { toModule: 301, reason: 'Tests otosclerosis clinical features, audiometry and surgical treatment, belonging to ENT under Module 301 (Otosclerosis).' };
    }
    if (has('angiofibroma', 'juvenile nasopharyngeal', 'holman miller sign')) {
      return { toModule: 320, reason: 'Tests juvenile nasopharyngeal angiofibroma (JNA), belonging to ENT under Module 320 (Nasopharynx and its Disorders).' };
    }
    if (has('laryngeal carcinoma', 'vocal cord paralysis', 'vocal nodule', 'singer node', 'laryngomalacia')) {
      return { toModule: 325, reason: 'Tests benign and malignant disorders of larynx and vocal cords, belonging to ENT under Module 325 (Larynx and its Disorders).' };
    }
  }

  // Forensic Medicine
  if (has('algor mortis', 'livor mortis', 'rigor mortis', 'cadaveric spasm', 'postmortem hypostasis', 'putrefaction', 'adipocere', 'mummification', 'chop wound', 'defense wound', 'hesitation cut', 'entry wound', 'exit wound', 'tattooing', 'scorching', 'blackening', 'choking', 'hanging', 'ligature mark', 'hyoid bone fracture in strangulation', 'diatom test', 'gettle test', 'paltauf hemorrhage', 'ipc', 'bns', 'medical negligence', 'bolam test') &&
      !has('wound healing', 'burn')) {
    if (has('algor mortis', 'livor mortis', 'rigor mortis', 'postmortem', 'cadaveric')) {
      return { toModule: 276, reason: 'Tests early and late post-mortem changes for estimating time since death, belonging to Forensic Medicine under Module 276 (Death and Post-Mortem Changes).' };
    }
    if (has('firearm', 'entry wound', 'exit wound', 'tattooing', 'ballistics', 'choke')) {
      return { toModule: 280, reason: 'Tests firearm wound characteristics and ballistics, belonging to Forensic Medicine under Module 280 (Firearm Injuries).' };
    }
    if (has('hanging', 'strangulation', 'hyoid', 'ligature', 'asphyxia', 'drowning', 'diatom')) {
      return { toModule: 281, reason: 'Tests asphyxial deaths (hanging/strangulation/drowning), belonging to Forensic Medicine under Module 281 (Mechanical Asphyxia).' };
    }
  }

  // PSM
  if (has('biomedical waste', 'yellow bag', 'red bag', 'blue box', 'black bag', 'incineration', 'autoclaving of waste', 'shredder') && !has('surgical audit', 'who checklist')) {
    return { toModule: 396, reason: 'Tests biomedical waste segregation, color coding and disposal rules, belonging to PSM under Module 396 (Biomedical Waste Management).' };
  }
  if (has('sensitivity', 'specificity', 'positive predictive value', 'negative predictive value', 'odds ratio', 'relative risk', 'case control study', 'cohort study', 'randomized controlled trial', 'incidence', 'prevalence', 'infant mortality rate', 'maternal mortality ratio') &&
      !has('trauma score', 'alvarado', 'bisap', 'glasgow', 'gcs')) {
    if (has('sensitivity', 'specificity', 'positive predictive value', 'negative predictive value')) {
      return { toModule: 360, reason: 'Tests screening test metrics (sensitivity, specificity, predictive values), belonging to PSM under Module 360 (Screening for Disease).' };
    }
    if (has('odds ratio', 'relative risk', 'case control', 'cohort study', 'selection bias', 'confounding')) {
      return { toModule: 359, reason: 'Tests epidemiological study designs and measures of association, belonging to PSM under Module 359 (Analytical Epidemiology).' };
    }
  }

  // Dermatology
  if (has('psoriasis', 'auspitz sign', 'munro microabscess', 'lichen planus', 'wickham striae', 'pemphigus vulgaris', 'tombstone appearance', 'bullous pemphigoid', 'nikolsky sign', 'erythema multiforme', 'steven johnson syndrome', 'toxic epidermal necrolysis', 'leprosy', 'mycobacterium leprae', 'lepromin test', 'scabies', 'sarcoptes scabiei', 'burrows', 'dermatophytosis', 'tinea corporis', 'vitiligo', 'alopecia areata') &&
      !has('burn', 'wound', 'melanoma', 'basal cell', 'squamous cell', 'marjolin')) {
    if (has('pemphigus', 'bullous pemphigoid', 'nikolsky')) {
      return { toModule: 641, reason: 'Tests immunobullous skin disorders (pemphigus/pemphigoid), belonging to Dermatology under Module 641 (Vesiculobullous Disorders).' };
    }
    if (has('psoriasis', 'lichen planus', 'papulosquamous')) {
      return { toModule: 640, reason: 'Tests papulosquamous skin diseases (psoriasis/lichen planus), belonging to Dermatology under Module 640 (Papulosquamous Disorders).' };
    }
    if (has('leprosy', 'hansen disease', 'tuberculoid', 'lepromatous')) {
      return { toModule: 644, reason: 'Tests leprosy classification and cutaneous manifestations, belonging to Dermatology under Module 644 (Bacterial Infections of Skin).' };
    }
  }

  // Medicine
  if (has('diabetic ketoacidosis', 'dka', 'hyperosmolar hyperglycemic', 'hhs', 'addisonian crisis', 'cushing syndrome', 'dexamethasone suppression test', 'primary hyperaldosteronism', 'conn syndrome', 'acromegaly', 'growth hormone suppression', 'sheehan syndrome') &&
      !has('bariatric', 'metabolic surgery', 'insulinoma', 'gastrinoma', 'adrenalectomy')) {
    if (has('diabetic ketoacidosis', 'dka', 'insulin protocol', 'hhs')) {
      return { toModule: 421, reason: 'Tests acute metabolic complications of diabetes mellitus (DKA/HHS), belonging to Internal Medicine under Module 421 (Diabetes Mellitus - Complications & Management).' };
    }
    if (has('cushing', 'dexamethasone suppression', 'hyperaldosteronism', 'conn')) {
      return { toModule: 418, reason: 'Tests adrenal cortical disorders and diagnostic endocrine workup, belonging to Internal Medicine under Module 418 (Disorders of Adrenal Cortex).' };
    }
  }

  return null; // No cross-subject flag
}

console.log('Testing cross-subject rules on cleaned questions...');
let crossCount = 0;
cleanedQuestions.forEach(q => {
  const res = evaluate(q);
  if (res && res.toModule !== q.currentModule) {
    crossCount++;
  }
});
console.log(`Initial cross-subject flags: ${crossCount}`);

process.exit(0);
