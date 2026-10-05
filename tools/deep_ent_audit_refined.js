const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Running refined deep audit of ENT questions...');

// Function to classify a single question
function evaluateQuestion(q) {
  const id = q.id;
  const curMod = q.module_id;
  const qText = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const expl = clean(q.explanation);
  const ansLetter = (q.answer || '').trim().toUpperCase();
  
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;

  const stemAndAns = `${qText} Answer: ${ansText}`.toLowerCase();
  const fullText = `${qText} ${optA} ${optB} ${optC} ${optD} ${expl}`.toLowerCase();

  // ----------------------------------------------------
  // 1. Cross-Subject Rules
  // ----------------------------------------------------

  // Biomedical Waste
  if (stemAndAns.includes('incineration') || fullText.includes('double-chamber') && fullText.includes('incineration technology')) {
    return { toModule: 396, reason: 'Tests biomedical waste disposal technology (double-chamber incineration of infectious waste), which belongs to PSM under Module 396 (Biomedical Waste Management).' };
  }

  // Thyroid Malignancies (Surgery 492)
  if ((stemAndAns.includes('papillary carcinoma thyroid') || stemAndAns.includes('medullary carcinoma thyroid') || fullText.includes('papillary carcinoma thyroid was advised radioiodine') || fullText.includes('medullary carcinoma thyroid is a malignant tumour showing c cell')) && !fullText.includes('laryngeal')) {
    return { toModule: 492, reason: 'Tests pathology, staging, or postoperative radioiodine management of thyroid malignancies (papillary/medullary thyroid carcinoma), belonging to General Surgery under Module 492 (Thyroid Malignancies).' };
  }

  // Thyroid Benign / Complications (Surgery 491)
  if (stemAndAns.includes('total thyroidectomy') && (stemAndAns.includes('calcium') || fullText.includes('post operative calcium level below 7-8 mg/dl')) || fullText.includes('inferior thyroid artery goes under the surface of thyroid') && fullText.includes('tetany')) {
    return { toModule: 491, reason: 'Tests endocrine surgical complications of thyroidectomy (postoperative hypocalcemia, tetany, inferior thyroid artery relationship), belonging to General Surgery under Module 491 (Benign Lesions of Thyroid).' };
  }

  // Oral Cavity & Salivary Glands (Surgery 522)
  if (stemAndAns.includes('carcinoma tongue') && stemAndAns.includes('hemiglossectomy')) {
    return { toModule: 522, reason: 'Tests surgical oncology and radiation indications for oral tongue carcinoma managed by hemiglossectomy and neck dissection, belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if (stemAndAns.includes('carcinoma lower lip') || stemAndAns.includes('carcinoma buccal mucosa') || stemAndAns.includes('verrucous carcinoma') && stemAndAns.includes('chewing tobacco')) {
    return { toModule: 522, reason: 'Tests oral cavity malignancy (lip carcinoma, buccal mucosa cancer, verrucous carcinoma) and reconstructive flaps, belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if (stemAndAns.includes('warthin\'s tumour') || stemAndAns.includes('pleomorphic adenoma of parotid') || (stemAndAns.includes('parotid') && stemAndAns.includes('swelling') && stemAndAns.includes('computed tomography'))) {
    return { toModule: 522, reason: 'Tests parotid gland neoplasms (pleomorphic adenoma, Warthin tumor, CT features of salivary tumors), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if (qText.includes('injured nerve after parotid surgery') || qText.includes('most commonly injured nerve after parotid surgery')) {
    return { toModule: 522, reason: 'Tests complications of parotid gland surgery (facial nerve injury during parotidectomy), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if ((qText.toLowerCase().includes('ranula') || expl.toLowerCase().includes('ranula is a mucous extravasation cyst')) && (ansText.toLowerCase().includes('ranula') || qText.toLowerCase().includes('ranula')) && !qText.toLowerCase().includes('laryngocele')) {
    return { toModule: 522, reason: 'Tests ranula (mucous extravasation cyst of sublingual salivary gland in floor of mouth), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if (stemAndAns.includes('retention cyst of a minor salivary gland')) {
    return { toModule: 522, reason: 'Tests oral minor salivary gland pathology (mucus retention cyst), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }
  if (stemAndAns.includes('leukoplakia') && fullText.includes('chronic smoker')) {
    return { toModule: 522, reason: 'Tests oral leukoplakia (premalignant lesion of oral mucosa in chronic smokers), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' };
  }

  // Dermatology
  if (stemAndAns.includes('lupus vulgaris') && fullText.includes('tuberculous')) {
    return { toModule: 645, reason: 'Tests Lupus vulgaris (cutaneous tuberculosis presentation with apple-jelly nodules on diascopy), belonging to Dermatology under Module 645 (Mycobacterial Infections).' };
  }
  if (stemAndAns.includes('basal cell carcinoma is the most common type of skin cancer') || (qText.toLowerCase().includes('non-healing ulcer between nose and upper lip') && expl.toLowerCase().includes('basal cell'))) {
    return { toModule: 654, reason: 'Tests Basal Cell Carcinoma (rodent ulcer) of facial skin, belonging to Dermatology under Module 654 (Skin Malignancies).' };
  }

  // Anatomy (Head & Neck Neurovascular)
  if (qText.includes('Posterior communicating artery a branch of')) {
    return { toModule: 27, reason: 'Tests neurovascular anatomy of the circle of Willis (origin of posterior communicating artery), belonging to Anatomy under Module 27 (Muscles, Neurovascular Anatomy of Head & Neck).' };
  }
  if (qText.includes('NOT a branch of 1st part of maxillary artery')) {
    return { toModule: 27, reason: 'Tests vascular branches of the maxillary artery, belonging to Anatomy under Module 27 (Muscles, Neurovascular Anatomy of Head & Neck).' };
  }
  if (qText.includes('boundaries of the Level 5 a lymph node')) {
    return { toModule: 27, reason: 'Tests anatomical boundaries of Level V posterior triangle cervical lymph nodes, belonging to Anatomy under Module 27 (Head & Neck Anatomy).' };
  }

  // ----------------------------------------------------
  // 2. Intra-ENT Reclassifications
  // ----------------------------------------------------

  // --- Foreign bodies in Aerodigestive Tract (Coin / Disc battery in esophagus) -> Module 328 ---
  if ((stemAndAns.includes('coin') || stemAndAns.includes('disc battery') || stemAndAns.includes('foreign body')) && (stemAndAns.includes('esophagus') || stemAndAns.includes('oesophagus') || stemAndAns.includes('swallow') || fullText.includes('ingestion of a coin') || fullText.includes('foreign body shadow in oesophagus')) && !stemAndAns.includes('bronchus') && !stemAndAns.includes('trachea') && !stemAndAns.includes('larynx') && !stemAndAns.includes('stridor')) {
    if (curMod !== 328) {
      return { toModule: 328, reason: 'Tests radiologic identification and management of esophageal foreign bodies (coin vs button battery, esophagoscopy), belonging to Module 328 (Mixed / Miscellaneous Topics - Aerodigestive Foreign Bodies).' };
    }
  }

  // --- Auditory Implants & Hearing Aids (Cochlear Implant / BAHA) -> Module 328 ---
  if (stemAndAns.includes('cochlear implant') || stemAndAns.includes('bone anchored hearing aid') || stemAndAns.includes('bone-anchored hearing aid') || stemAndAns.includes('baha') || qText.includes('Bilateral Anotia. Which hearing aid implant')) {
    if (curMod !== 328) {
      return { toModule: 328, reason: 'Tests auditory prosthetic rehabilitation devices (Cochlear implant components/indications, Bone-Anchored Hearing Aid / BAHA), belonging to Module 328 (Mixed / Miscellaneous Topics - Auditory Implants).' };
    }
  }

  // --- Obstructive Sleep Apnea / Sleep Endoscopy -> Module 328 ---
  if (stemAndAns.includes('obstructive sleep apnea') || fullText.includes('muller\'s manoeuvre')) {
    if (curMod !== 328) {
      return { toModule: 328, reason: 'Tests evaluation and treatment modalities of Obstructive Sleep Apnea (Muller\'s maneuver, CPAP), belonging to Module 328 (Mixed / Miscellaneous Topics).' };
    }
  }

  // --- ENT Instruments (Lempert mastoid retractor, Siegel pneumatic speculum) -> Module 328 ---
  if (fullText.includes('lemperts mastoid retractor') || fullText.includes('siegel\'s pneumatic speculum')) {
    if (curMod !== 328) {
      return { toModule: 328, reason: 'Tests identification and clinical utility of ENT surgical diagnostic instruments, belonging to Module 328 (Mixed / Miscellaneous Topics - ENT Instruments).' };
    }
  }

  // --- Stridor, Pediatric Airway Emergencies & Tracheostomy -> Module 325 ---
  if (stemAndAns.includes('laryngomalacia') || stemAndAns.includes('omega-shaped epiglottis') || stemAndAns.includes('congenital laryngeal stridor') || stemAndAns.includes('acute epiglottitis') || stemAndAns.includes('croup') || stemAndAns.includes('steeple sign') || stemAndAns.includes('acute laryngotracheobronchitis') || stemAndAns.includes('laryngocele') || stemAndAns.includes('trumpet blower') || stemAndAns.includes('trumpet player') || stemAndAns.includes('saxophone') || stemAndAns.includes('subglottic stenosis') || stemAndAns.includes('tracheostomy') || stemAndAns.includes('heimlich manoeuvre') || stemAndAns.includes('audible thud') || stemAndAns.includes('aspirated foreign body') || (stemAndAns.includes('stridor') && stemAndAns.includes('inspiratory'))) {
    if (curMod !== 325) {
      return { toModule: 325, reason: 'Tests congenital laryngeal anomalies (laryngomalacia, laryngocele), pediatric acute airway emergencies (epiglottitis, croup), airway foreign body aspiration, or tracheostomy, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' };
    }
  }

  // --- Benign Vocal Cord Pathology, Vocal Palsy & Voice Disorders -> Module 326 ---
  if (stemAndAns.includes('vocal nodule') || stemAndAns.includes('singer\'s node') || stemAndAns.includes('vocal polyp') || stemAndAns.includes('reinke\'s oedema') || stemAndAns.includes('reinke\'s edema') || stemAndAns.includes('contact ulcer') || stemAndAns.includes('vocal fold palsy') || stemAndAns.includes('vocal cord palsy') || stemAndAns.includes('vocal cord paralysis') || stemAndAns.includes('semon\'s law') || stemAndAns.includes('thyroplasty') || stemAndAns.includes('puberphonia') || stemAndAns.includes('spasmodic dysphonia') || stemAndAns.includes('hysterical aphonia') || stemAndAns.includes('functional aphonia') || stemAndAns.includes('gutzmann')) {
    if (curMod !== 326) {
      return { toModule: 326, reason: 'Tests benign vocal fold lesions (nodules, polyps, Reinke\'s edema, contact ulcers), neurogenic vocal cord paralysis (Semon\'s law, thyroplasty), or functional voice disorders (puberphonia), belonging to Module 326 (Voice and Speech Disorders).' };
    }
  }

  // --- Laryngeal Carcinoma -> Module 327 ---
  if (stemAndAns.includes('carcinoma larynx') || stemAndAns.includes('laryngeal carcinoma') || stemAndAns.includes('glottic cancer') || stemAndAns.includes('supraglottic cancer') || stemAndAns.includes('total laryngectomy') || stemAndAns.includes('cordectomy') || stemAndAns.includes('blom-singer') || stemAndAns.includes('tracheoesophageal puncture') || stemAndAns.includes('tep') || (stemAndAns.includes('glottic') && stemAndAns.includes('t1')) || (stemAndAns.includes('larynx') && stemAndAns.includes('malignan'))) {
    if (curMod !== 327) {
      return { toModule: 327, reason: 'Tests staging, surgical resection (cordectomy, total laryngectomy), or post-laryngectomy voice restoration (Blom-Singer TEP valve) for laryngeal cancer, belonging to Module 327 (Laryngeal Carcinoma).' };
    }
  }

  // --- Larynx Anatomy & Physiology -> Module 324 ---
  if ((stemAndAns.includes('posterior cricoarytenoid') || stemAndAns.includes('cricothyroid') || stemAndAns.includes('lateral cricoarytenoid') || stemAndAns.includes('tensors of vocal cord') || stemAndAns.includes('adductor of the vocal cords') || stemAndAns.includes('intrinsic muscles of larynx') || stemAndAns.includes('nerve supply of larynx') || stemAndAns.includes('pre-epiglottic space') || stemAndAns.includes('paraglottic space') || stemAndAns.includes('cricoid cartilage') || stemAndAns.includes('superior laryngeal nerve block')) && !stemAndAns.includes('palsy') && !stemAndAns.includes('paralysis') && !stemAndAns.includes('carcinoma') && !stemAndAns.includes('stridor')) {
    if (curMod !== 324) {
      return { toModule: 324, reason: 'Tests functional anatomy, intrinsic/extrinsic musculature, or nerve supply of the larynx, belonging to Module 324 (Anatomy and Physiology of Larynx).' };
    }
  }

  // --- Adenoids -> Module 320 ---
  if (stemAndAns.includes('adenoid hypertrophy') || stemAndAns.includes('adenoid facies') || stemAndAns.includes('adenoidectomy') || stemAndAns.includes('type of voice in adenoid hypertrophy') || (stemAndAns.includes('mouth breathing') && stemAndAns.includes('adenoid'))) {
    if (curMod !== 320) {
      return { toModule: 320, reason: 'Tests adenoid hypertrophy, adenoid facies, mouth breathing complications, or adenoidectomy indications/speech changes, belonging to Module 320 (Adenoids).' };
    }
  }

  // --- Tonsils & Peritonsillar Abscess -> Module 321 ---
  if (stemAndAns.includes('tonsillitis') || stemAndAns.includes('quinsy') || stemAndAns.includes('peritonsillar abscess') || stemAndAns.includes('tonsillectomy') || (stemAndAns.includes('hot potato voice') && stemAndAns.includes('trismus')) || stemAndAns.includes('plummy voice')) {
    if (curMod !== 321) {
      return { toModule: 321, reason: 'Tests palatine tonsil infections (acute tonsillitis, peritonsillar abscess / quinsy) or tonsillectomy indications and complications, belonging to Module 321 (Tonsils).' };
    }
  }

  // --- Juvenile Nasopharyngeal Angiofibroma (JNA) -> Module 322 ---
  if (stemAndAns.includes('angiofibroma') || stemAndAns.includes('juvenile nasopharyngeal angiofibroma') || stemAndAns.includes('holman-miller') || stemAndAns.includes('holman miller') || (stemAndAns.includes('adolescent male') && stemAndAns.includes('profuse epistaxis') && stemAndAns.includes('nasal mass'))) {
    if (curMod !== 322) {
      return { toModule: 322, reason: 'Tests clinical presentation, Holman-Miller antral sign, imaging, or management of Juvenile Nasopharyngeal Angiofibroma, belonging to Module 322 (Nasopharyngeal Angiofibroma).' };
    }
  }

  // --- Nasopharyngeal Carcinoma (NPC) -> Module 323 ---
  if (stemAndAns.includes('nasopharyngeal carcinoma') || stemAndAns.includes('trotter\'s triad') || stemAndAns.includes('fossa of rosenmuller') || stemAndAns.includes('fossa of rosenmüller') || (stemAndAns.includes('nasopharynx') && stemAndAns.includes('ebv') && stemAndAns.includes('cervical node'))) {
    if (curMod !== 323) {
      return { toModule: 323, reason: 'Tests Nasopharyngeal Carcinoma (fossa of Rosenmuller origin, EBV correlation, Trotter\'s triad, or cervical nodal metastases), belonging to Module 323 (Nasopharyngeal Carcinoma).' };
    }
  }

  // --- Pharynx Anatomy, Physiology, Deep Spaces & Zenker Diverticulum -> Module 319 ---
  if (stemAndAns.includes('zenker\'s diverticulum') || stemAndAns.includes('killian\'s dehiscence') || stemAndAns.includes('retropharyngeal abscess') || stemAndAns.includes('parapharyngeal space') || stemAndAns.includes('ludwig\'s angina') || stemAndAns.includes('ludwig s angina') || stemAndAns.includes('pyriform fossa') || stemAndAns.includes('pyriform sinus') || stemAndAns.includes('passavant\'s ridge') || stemAndAns.includes('waldeyer\'s ring') || stemAndAns.includes('angioedema of uvula') || stemAndAns.includes('quiencke') || stemAndAns.includes('postcricoid web') || stemAndAns.includes('plummer-vinson') || stemAndAns.includes('paterson-kelly') || (qText.includes('part of oropharynx') || qText.includes('part of Laryngopharynx') || qText.includes('Pharynx extends from'))) {
    if (curMod !== 319) {
      return { toModule: 319, reason: 'Tests pharyngeal anatomy, hypopharyngeal subsites (pyriform fossa), deep neck space infections (retropharyngeal, Ludwig\'s angina), or Zenker\'s diverticulum / Paterson-Kelly web, belonging to Module 319 (Anatomy and Physiology of Pharynx).' };
    }
  }

  // --- Sinonasal Tumors (Inverted Papilloma, Esthesioneuroblastoma, Maxillary Carcinoma) -> Module 317 ---
  if (stemAndAns.includes('inverted papilloma') || stemAndAns.includes('ringertz tumor') || stemAndAns.includes('esthesioneuroblastoma') || stemAndAns.includes('olfactory neuroblastoma') || (stemAndAns.includes('osteoma') && stemAndAns.includes('sinus')) || stemAndAns.includes('maxillary cancer') || stemAndAns.includes('maxillary sinus carcinoma') || stemAndAns.includes('ohngren\'s line') || stemAndAns.includes('maxillectomy')) {
    if (curMod !== 317) {
      return { toModule: 317, reason: 'Tests benign or malignant sinonasal tumors (Inverted papilloma, Esthesioneuroblastoma, Maxillary sinus SCC, Osteoma, maxillectomy), belonging to Module 317 (Tumors of Nose and PNS).' };
    }
  }

  // --- Trauma of Nose & Face (Fractures, Blow-out, CSF Rhinorrhea) -> Module 316 ---
  if (stemAndAns.includes('nasal bone fracture') || stemAndAns.includes('walsham') || stemAndAns.includes('asche forceps') || stemAndAns.includes('blow-out fracture') || stemAndAns.includes('blowout fracture') || stemAndAns.includes('orbital floor fracture') || stemAndAns.includes('le fort') || stemAndAns.includes('zygomatic fracture') || stemAndAns.includes('csf rhinorrhea') || stemAndAns.includes('csf rhinorrhoea') || stemAndAns.includes('target sign') || stemAndAns.includes('double target sign') || stemAndAns.includes('beta-2 transferrin') || stemAndAns.includes('battle\'s sign') || stemAndAns.includes('battle sign') || stemAndAns.includes('fracture of temporal bone') || stemAndAns.includes('longitudinal fracture') && stemAndAns.includes('temporal') || stemAndAns.includes('fracture in middle cranial fos') || stemAndAns.includes('frontal sinus fracture')) {
    if (curMod !== 316) {
      return { toModule: 316, reason: 'Tests maxillofacial trauma, nasal/orbital floor fractures, skull base fractures, or post-traumatic CSF rhinorrhea, belonging to Module 316 (Trauma of Nose and Face).' };
    }
  }

  // --- Septum Disorders & Nasal Polyposis -> Module 315 ---
  if (stemAndAns.includes('deviated nasal septum') || stemAndAns.includes('dns') && stemAndAns.includes('septum') || stemAndAns.includes('submucous resection') || stemAndAns.includes('smr') && stemAndAns.includes('septum') || stemAndAns.includes('septoplasty') || stemAndAns.includes('killian\'s incision') || stemAndAns.includes('freer\'s incision') || stemAndAns.includes('septal hematoma') || stemAndAns.includes('septal abscess') || stemAndAns.includes('septal perforation') || stemAndAns.includes('antrochoanal polyp') || stemAndAns.includes('ethmoidal polyp') || stemAndAns.includes('nasal polypi') || stemAndAns.includes('nasal polyposis') || stemAndAns.includes('samter\'s triad') || stemAndAns.includes('aspirin-exacerbated respiratory disease')) {
    if (curMod !== 315) {
      return { toModule: 315, reason: 'Tests nasal septal disorders (DNS, SMR, septoplasty, septal hematoma/perforation) or sinonasal polyposis (antrochoanal, ethmoidal polyps, Samter\'s triad), belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).' };
    }
  }

  // --- Sinusitis & Complications -> Module 318 ---
  if ((stemAndAns.includes('sinusitis') || stemAndAns.includes('fess') || stemAndAns.includes('functional endoscopic sinus surgery') || stemAndAns.includes('pott\'s puffy tumour') || stemAndAns.includes('pott\'s puffy tumor') || (stemAndAns.includes('orbital cellulitis') && fullText.includes('purulent nasal discharge')) || stemAndAns.includes('cavernous sinus thrombosis') || (stemAndAns.includes('mucormycosis') && fullText.includes('sinus')) || stemAndAns.includes('allergic fungal rhinosinusitis') || stemAndAns.includes('sphenoid sinus surgery')) && !stemAndAns.includes('inverted papilloma') && !stemAndAns.includes('angiofibroma')) {
    if (curMod !== 318) {
      return { toModule: 318, reason: 'Tests acute/chronic rhinosinusitis, FESS, fungal sinusitis (mucormycosis, AFRS), or orbital/intracranial complications of sinusitis, belonging to Module 318 (Sinusitis and its Complication).' };
    }
  }

  // --- Congenital Anomalies & Specific Granulomatous Diseases of Nose -> Module 313 ---
  if (stemAndAns.includes('rhinoscleroma') || stemAndAns.includes('mikulicz') || stemAndAns.includes('russell bodies') || stemAndAns.includes('rhinosporidiosis') || stemAndAns.includes('rhinosporidium') || stemAndAns.includes('atrophic rhinitis') || stemAndAns.includes('ozaena') || stemAndAns.includes('ozena') || stemAndAns.includes('merciful anosmia') || stemAndAns.includes('lautenschlaeger') || stemAndAns.includes('young\'s operation') || stemAndAns.includes('choanal atresia') || stemAndAns.includes('nasal dermoid') || stemAndAns.includes('encephalocele') || (stemAndAns.includes('unilateral, foul-smelling') && stemAndAns.includes('nasal discharge') && fullText.includes('child')) || stemAndAns.includes('disc battery in nose') || stemAndAns.includes('rhinophyma') || stemAndAns.includes('potato tumour')) {
    if (curMod !== 313) {
      return { toModule: 313, reason: 'Tests congenital nasal anomalies (choanal atresia, dermoids), specific chronic granulomatous nasal infections (rhinoscleroma, rhinosporidiosis, atrophic rhinitis / ozena), or nasal foreign body / rhinophyma, belonging to Module 313 (Congenital Anomalies of Nose and Disease of Nose).' };
    }
  }

  // --- Rhinitis -> Module 314 ---
  if ((stemAndAns.includes('allergic rhinitis') || stemAndAns.includes('vasomotor rhinitis') || stemAndAns.includes('rhinitis medicamentosa') || stemAndAns.includes('nasal allergy') || stemAndAns.includes('allergic shiners') || stemAndAns.includes('allergic salute') || stemAndAns.includes('dennie-morgan')) && !stemAndAns.includes('rhinoscleroma') && !stemAndAns.includes('rhinosporidiosis') && !stemAndAns.includes('atrophic rhinitis') && !stemAndAns.includes('sinusitis') && !stemAndAns.includes('polyp')) {
    if (curMod !== 314) {
      return { toModule: 314, reason: 'Tests pathophysiology, clinical signs, or pharmacotherapy (intranasal steroids, antihistamines) of allergic or vasomotor rhinitis, belonging to Module 314 (Rhinitis).' };
    }
  }

  // --- Paranasal Sinus Anatomy -> Module 310 ---
  if ((stemAndAns.includes('maxillary sinus') || stemAndAns.includes('frontal sinus') || stemAndAns.includes('ethmoid sinus') || stemAndAns.includes('sphenoid sinus') || stemAndAns.includes('ostiomeatal complex') || stemAndAns.includes('agger nasi') || stemAndAns.includes('haller cell') || stemAndAns.includes('onodi cell') || stemAndAns.includes('water\'s view') || stemAndAns.includes('caldwell view') || stemAndAns.includes('anterior most ethmoidal cell')) && (fullText.includes('anatomy') || fullText.includes('boundary') || fullText.includes('drain') || fullText.includes('x-ray') || fullText.includes('air cells')) && !stemAndAns.includes('sinusitis') && !stemAndAns.includes('carcinoma') && !stemAndAns.includes('fracture') && !stemAndAns.includes('polyp')) {
    if (curMod !== 310) {
      return { toModule: 310, reason: 'Tests anatomical boundaries, ethmoidal air cell anatomy (Agger nasi, Haller cells, Onodi cells), or radiographic views of paranasal sinuses, belonging to Module 310 (Anatomy of Paranasal Sinuses).' };
    }
  }

  // --- Physiology of Nose & PNS -> Module 311 ---
  if ((stemAndAns.includes('nasal cycle') || stemAndAns.includes('mucociliary clearance') || stemAndAns.includes('saccharin test') || stemAndAns.includes('olfaction') || stemAndAns.includes('smell disturbance') || stemAndAns.includes('bowman\'s glands')) && !stemAndAns.includes('sinusitis') && !stemAndAns.includes('rhinitis') && !stemAndAns.includes('inverted papilloma')) {
    if (curMod !== 311) {
      return { toModule: 311, reason: 'Tests physiological functions of nasal cavity/PNS (nasal cycle, mucociliary transport, saccharin test, olfaction), belonging to Module 311 (Physiology of Nose and Paranasal Sinuses).' };
    }
  }

  // --- Epistaxis -> Module 312 ---
  if ((stemAndAns.includes('epistaxis') || stemAndAns.includes('severe nosebleed') || stemAndAns.includes('anterior nasal pack') || stemAndAns.includes('posterior nasal pack') || stemAndAns.includes('trotter\'s method') || stemAndAns.includes('endoscopic sphenopalatine artery ligation') || stemAndAns.includes('espal') || stemAndAns.includes('rendu osler weber')) && !stemAndAns.includes('angiofibroma') && !stemAndAns.includes('inverted papilloma') && !stemAndAns.includes('rhinosporidiosis') && !stemAndAns.includes('carcinoma') && !stemAndAns.includes('fracture')) {
    if (curMod !== 312) {
      return { toModule: 312, reason: 'Tests etiology, vascular sources, emergency management (packing, cautery), or surgical arterial ligation (ESPAL) for epistaxis, belonging to Module 312 (Epistaxis).' };
    }
  }

  // --- Ear Tumors (Glomus, Acoustic Neuroma, etc.) -> Module 303 ---
  if (stemAndAns.includes('glomus jugulare') || stemAndAns.includes('glomus tympanicum') || stemAndAns.includes('glomus tumour') || stemAndAns.includes('glomus tumor') || stemAndAns.includes('pulsatile tinnitus and an ear mass') || stemAndAns.includes('rising sun') || stemAndAns.includes('brown\'s sign') || stemAndAns.includes('vestibular schwannoma') || stemAndAns.includes('acoustic neuroma') || stemAndAns.includes('hitselberger') || stemAndAns.includes('squamous cell carcinoma of the temporal bone') || stemAndAns.includes('fisch classification of glomus')) {
    if (curMod !== 303) {
      return { toModule: 303, reason: 'Tests neoplasms of the middle ear and temporal bone (Glomus tumor / paraganglioma, Acoustic neuroma / vestibular schwannoma, temporal bone carcinoma, Fisch classification), belonging to Module 303 (Tumors of Ear).' };
    }
  }

  // --- Facial Nerve Disorders -> Module 305 ---
  if (stemAndAns.includes('bell\'s palsy') || stemAndAns.includes('ramsay hunt syndrome') || stemAndAns.includes('herpes zoster oticus') || stemAndAns.includes('house-brackmann') || stemAndAns.includes('frey\'s syndrome') || stemAndAns.includes('facial nerve decompression') || (stemAndAns.includes('lower motor neuron') && stemAndAns.includes('facial paralysis') && stemAndAns.includes('acute-onset'))) {
    if (curMod !== 305) {
      return { toModule: 305, reason: 'Tests facial nerve neuropathies, clinical grading (House-Brackmann), Bell\'s palsy, Ramsay Hunt syndrome, or Frey\'s syndrome, belonging to Module 305 (Facial Nerve Disorders).' };
    }
  }

  // --- Facial Nerve Anatomy -> Module 304 ---
  if ((stemAndAns.includes('facial nerve') || stemAndAns.includes('fallopian canal')) && (fullText.includes('segment') || fullText.includes('labyrinthine') || fullText.includes('tympanic segment') || fullText.includes('mastoid segment') || fullText.includes('greater superficial petrosal')) && !stemAndAns.includes('bell\'s palsy') && !stemAndAns.includes('house-brackmann') && !stemAndAns.includes('ramsay hunt') && !stemAndAns.includes('parotid surgery')) {
    if (curMod !== 304) {
      return { toModule: 304, reason: 'Tests anatomical course, intratemporal segments, and branches of the facial nerve, belonging to Module 304 (Anatomy of Facial Nerve).' };
    }
  }

  // --- Otosclerosis -> Module 301 ---
  if (stemAndAns.includes('otosclerosis') || stemAndAns.includes('otospongiosis') || stemAndAns.includes('carhart\'s notch') || stemAndAns.includes('schwartz sign') || stemAndAns.includes('schwartze sign') || stemAndAns.includes('paracusis willisii') || stemAndAns.includes('paracusis of willis') || stemAndAns.includes('stapedectomy') || stemAndAns.includes('stapedotomy') || (stemAndAns.includes('sodium fluoride') && fullText.includes('otosclerosis')) || (stemAndAns.includes('conductive hearing loss') && stemAndAns.includes('pregnancy') && fullText.includes('otosclerosis'))) {
    if (curMod !== 301) {
      return { toModule: 301, reason: 'Tests clinical features, audiologic findings (Carhart\'s notch, Schwartz sign, Paracusis Willisii), or surgical/medical management of otosclerosis, belonging to Module 301 (Otosclerosis).' };
    }
  }

  // --- Meniere's Disease & Peripheral Vestibular Disorders -> Module 302 ---
  if (stemAndAns.includes('meniere\'s disease') || stemAndAns.includes('meniere disease') || stemAndAns.includes('endolymphatic hydrops') || stemAndAns.includes('lermoyez syndrome') || stemAndAns.includes('bppv') || stemAndAns.includes('benign paroxysmal positional vertigo') || stemAndAns.includes('dix hallpike') || stemAndAns.includes('hallpike maneuver') || stemAndAns.includes('epley maneuver') || stemAndAns.includes('caloric test') || stemAndAns.includes('tullio\'s phenomenon') || stemAndAns.includes('superior semicircular canal dehiscence') || (stemAndAns.includes('episodic vertigo') && fullText.includes('meniere'))) {
    if (curMod !== 302) {
      return { toModule: 302, reason: 'Tests Meniere\'s disease (endolymphatic hydrops, Lermoyez) or peripheral vestibular disorders (BPPV, Dix-Hallpike/Epley, caloric test, Tullio\'s phenomenon), belonging to Module 302 (Meniere\'s Disease).' };
    }
  }

  // --- Eustachian Tube & Glue Ear / OME -> Module 306 ---
  if (stemAndAns.includes('eustachian tube') || stemAndAns.includes('patulous eustachian') || stemAndAns.includes('glue ear') || stemAndAns.includes('otitis media with effusion') || stemAndAns.includes('serous otitis media') || stemAndAns.includes('grommet') || stemAndAns.includes('secretory otitis media')) {
    if (curMod !== 306) {
      return { toModule: 306, reason: 'Tests Eustachian tube function/dysfunction, or Otitis Media with Effusion / Glue ear (pathophysiology, diagnosis, grommet insertion), belonging to Module 306 (Eustachian Tube).' };
    }
  }

  // --- Cholesteatoma & Types of CSOM -> Module 299 ---
  if ((stemAndAns.includes('cholesteatoma') || stemAndAns.includes('atticoantral') || stemAndAns.includes('tubotympanic') || stemAndAns.includes('retraction of pars tensa') || stemAndAns.includes('sade classification') || stemAndAns.includes('tos classification') || (stemAndAns.includes('unsafe csom') && !stemAndAns.includes('complication') && !stemAndAns.includes('treatment of choice'))) && !stemAndAns.includes('mastoidectomy') && !stemAndAns.includes('tympanoplasty') && !stemAndAns.includes('brain abscess') && !stemAndAns.includes('sinus thrombosis') && !stemAndAns.includes('gradenigo') && !stemAndAns.includes('mastoiditis')) {
    if (curMod !== 299) {
      return { toModule: 299, reason: 'Tests pathology, pathogenesis, Sade/Tos staging of retraction pockets, or diagnostic characteristics of cholesteatoma and CSOM types, belonging to Module 299 (Cholesteatoma and Types of CSOM).' };
    }
  }

  // --- CSOM Treatment & Complications -> Module 300 ---
  if (stemAndAns.includes('gradenigo') || stemAndAns.includes('petrositis') || stemAndAns.includes('lateral (sigmoid) sinus thrombosis') || stemAndAns.includes('empty delta sign') || stemAndAns.includes('griesinger') || stemAndAns.includes('bezold abscess') || stemAndAns.includes('citelli') || stemAndAns.includes('coalescent mastoiditis') || stemAndAns.includes('otogenic brain abscess') || (stemAndAns.includes('unsafe csom') && stemAndAns.includes('fistula sign') && stemAndAns.includes('treatment of choice')) || (stemAndAns.includes('tympanoplasty') && (fullText.includes('type') || fullText.includes('graft'))) || stemAndAns.includes('suppurative labyrinthitis') || stemAndAns.includes('labyrinthine fistula as a complication')) {
    if (curMod !== 300) {
      return { toModule: 300, reason: 'Tests complications of suppurative otitis media (Gradenigo syndrome, lateral sinus thrombosis, Bezold abscess, coalescent mastoiditis, labyrinthine fistula, brain abscess) or CSOM surgical intervention (tympanoplasty), belonging to Module 300 (CSOM - Treatment and Complications).' };
    }
  }

  // --- Disorders of External Ear -> Module 298 ---
  if (stemAndAns.includes('otitis externa') || stemAndAns.includes('malignant otitis externa') || stemAndAns.includes('necrotizing otitis externa') || stemAndAns.includes('otomycosis') || stemAndAns.includes('singapore ear') || stemAndAns.includes('wet newspaper') || stemAndAns.includes('keratosis obturans') || (stemAndAns.includes('ear wax') && stemAndAns.includes('syringing') && !stemAndAns.includes('arnold\'s nerve')) || stemAndAns.includes('pinna haematoma') || stemAndAns.includes('traumatic hematoma of the pinna') || stemAndAns.includes('live insect in eac') || stemAndAns.includes('foreign body impaction in ear') || stemAndAns.includes('myringitis bullosa')) {
    if (curMod !== 298) {
      return { toModule: 298, reason: 'Tests inflammatory, infectious, traumatic, or obstructive disorders of the auricle and external auditory canal (otitis externa, otomycosis, ear wax, hematoma auris, foreign body in EAC), belonging to Module 298 (Disorders of External Ear).' };
    }
  }

  // --- Embryology of Ear & Malformations -> Module 293 ---
  if ((stemAndAns.includes('preauricular sinus') || stemAndAns.includes('microtia') || stemAndAns.includes('anotia') || stemAndAns.includes('scheibe dysplasia') || stemAndAns.includes('mondini dysplasia') || stemAndAns.includes('michel aplasia') || (stemAndAns.includes('middle ear ossicles') && fullText.includes('neural crest')) || stemAndAns.includes('germ layers of tympanic membrane') || stemAndAns.includes('saccule of inner ear develop from') || fullText.includes('tympanic membrane develops from all three germinal layers')) && !stemAndAns.includes('csom') && !stemAndAns.includes('stapedectomy')) {
    if (curMod !== 293) {
      return { toModule: 293, reason: 'Tests embryological development of the ear (branchial arches, germ layers, ossicle/saccule embryogenesis) or congenital ear malformations (microtia, anotia, preauricular sinus, Scheibe/Mondini dysplasia), belonging to Module 293 (Embryology of Ear and Malformations).' };
    }
  }

  // --- Audiometric & Special Tests of Hearing -> Module 308 ---
  if ((stemAndAns.includes('pure tone audiometry') || stemAndAns.includes('audiogram') || stemAndAns.includes('tympanogram') || stemAndAns.includes('stapedial reflex') || stemAndAns.includes('acoustic reflex') || stemAndAns.includes('bera') || stemAndAns.includes('brainstem evoked response') || stemAndAns.includes('otoacoustic emission') || stemAndAns.includes('oae') || stemAndAns.includes('sisi test') || stemAndAns.includes('tone decay') || stemAndAns.includes('rollover phenomenon') || stemAndAns.includes('speech audiometry') || stemAndAns.includes('retrocochlear hearing loss') || stemAndAns.includes('recruitment')) && !stemAndAns.includes('otosclerosis') && !stemAndAns.includes('meniere') && !stemAndAns.includes('effusion') && !stemAndAns.includes('glue ear')) {
    if (curMod !== 308) {
      return { toModule: 308, reason: 'Tests audiometric evaluations (PTA, speech audiometry, tympanometry), electrophysiologic testing (BERA, OAE), or special tests of hearing (SISI, Tone decay, recruitment, rollover), belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).' };
    }
  }

  // --- Physiology of Hearing & Tuning Fork Tests -> Module 307 ---
  if ((stemAndAns.includes('rinne') || stemAndAns.includes('weber') || stemAndAns.includes('schwabach') || stemAndAns.includes('bing test') || stemAndAns.includes('gelle\'s test') || stemAndAns.includes('absolute bone conduction') || stemAndAns.includes('impedance matching') || stemAndAns.includes('transformer ratio') || stemAndAns.includes('areal ratio') || stemAndAns.includes('lever ratio') || stemAndAns.includes('travelling wave theory') || stemAndAns.includes('auditory pathway from cochlear nucleus to auditory cortex') || stemAndAns.includes('slim')) && !stemAndAns.includes('audiogram') && !stemAndAns.includes('otosclerosis')) {
    if (curMod !== 307) {
      return { toModule: 307, reason: 'Tests sound transmission physiology (impedance matching mechanism, travelling wave, central auditory pathway) or clinical tuning fork tests (Rinne, Weber, Schwabach, Gelle), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).' };
    }
  }

  return null;
}

const finalMoves = [];

qs.forEach(q => {
  const result = evaluateQuestion(q);
  if (result && result.toModule !== q.module_id) {
    finalMoves.push({
      id: q.id,
      fromModule: q.module_id,
      toModule: result.toModule,
      reason: result.reason
    });
  }
});

console.log(`Final evaluation complete:`);
console.log(`Total questions: ${qs.length}`);
console.log(`Flagged moves: ${finalMoves.length}`);

// Check if any id is duplicated
const seenIds = new Set();
let duplicates = 0;
finalMoves.forEach(m => {
  if (seenIds.has(m.id)) duplicates++;
  seenIds.add(m.id);
});
console.log(`Duplicate IDs: ${duplicates}`);

const output = {
  subject: 'ENT',
  totalQuestions: qs.length,
  flaggedCount: finalMoves.length,
  moves: finalMoves
};

fs.writeFileSync('tools/audit_deep_ent.json', JSON.stringify(output, null, 2));
console.log(`Successfully generated and saved to tools/audit_deep_ent.json!`);
process.exit(0);
