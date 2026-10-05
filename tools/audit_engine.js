const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/questions_cleaned.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

// Helper function to check if text contains phrases
function hasAny(text, phrases) {
  return phrases.some(p => text.includes(p.toLowerCase()));
}

function hasAll(text, phrases) {
  return phrases.every(p => text.includes(p.toLowerCase()));
}

console.log(`Starting deep audit of ${questions.length} questions...`);

const moves = [];

for (const q of questions) {
  const { id, currentModule: cur, qText, expl, fullText } = q;
  let targetModule = null;
  let rationale = '';

  // ==========================================
  // 1. NON-ENT / CROSS-SUBJECT CONDITIONS
  // ==========================================

  // Bio-medical waste / Incineration
  if (hasAny(fullText, ['incineration of infectious', 'incineration technology', 'double-chamber incineration', 'biomedical waste'])) {
    targetModule = 398; // PSM: Biomedical Waste Management
    rationale = `Tests medical waste management technology (incineration of infectious waste), which belongs to PSM / Community Medicine under Biomedical Waste Management, not ENT CSOM.`;
  }
  // Pure Thyroid surgery/malignancy
  else if (hasAny(fullText, ['papillary carcinoma thyroid', 'radioiodine ablation', 'total thyroidectomy', 'medullary carcinoma thyroid', 'inferior thyroid artery goes under the surface of thyroid']) && !hasAny(fullText, ['thyroplasty', 'laryngeal', 'vocal cord', 'recurrent laryngeal'])) {
    if (hasAny(fullText, ['papillary', 'medullary', 'radioiodine'])) {
      targetModule = 492; // Surgery: Thyroid Malignancies
      rationale = `Tests evaluation, staging, or postoperative management of thyroid malignancy (papillary/medullary thyroid carcinoma), belonging to Surgery (Thyroid Malignancies).`;
    } else {
      targetModule = 491; // Surgery: Benign Lesions of Thyroid
      rationale = `Tests thyroidectomy anatomy/complications (hypocalcemia, inferior thyroid artery), belonging to Surgery (Thyroid Lesions).`;
    }
  }
  // Oral cavity / Lip / Buccal mucosa carcinoma & Salivary gland retention cysts / Ranula
  else if ((hasAny(fullText, ['carcinoma lower lip', 'carcinoma buccal mucosa', 'verrucous carcinoma', 'minor salivary gland', 'ranula is a mucous extravasation']) || (hasAny(fullText, ['ranula']) && !hasAny(fullText, ['ear', 'nose', 'larynx']))) && !hasAny(fullText, ['laryngeal', 'vocal', 'nasopharyngeal', 'sinus'])) {
    targetModule = 522; // Surgery: Oral Cavity & Salivary glands
    rationale = `Tests pathology, staging, or management of oral cavity lesions (lip/buccal carcinoma, ranula, minor salivary gland cysts), which belongs to General Surgery (Oral Cavity & Salivary Glands).`;
  }
  // Skin Tuberculosis / Lupus vulgaris
  else if (hasAny(fullText, ['lupus vulgaris', 'apple jelly nodules']) && hasAny(fullText, ['tuberculous', 'skin'])) {
    targetModule = 637; // Dermatology: Bacterial & Mycobacterial infections
    rationale = `Tests Lupus vulgaris (cutaneous tuberculosis presentation with apple-jelly nodules), which belongs to Dermatology (Bacterial & Mycobacterial infections).`;
  }
  // Basal cell carcinoma of skin
  else if (hasAny(fullText, ['basal cell carcinoma is the most common type of skin cancer', 'rodent ulcer']) && !hasAny(fullText, ['sinus', 'paranasal', 'inverted papilloma'])) {
    targetModule = 644; // Dermatology: Cutaneous Malignancies
    rationale = `Tests Basal Cell Carcinoma (rodent ulcer) of facial skin, which belongs to Dermatology (Cutaneous Malignancies).`;
  }

  // ==========================================
  // 2. INTRA-ENT CONDITIONS
  // ==========================================

  // --- Foreign bodies in Aerodigestive tract / Esophagus (Coin vs button battery) ---
  if (!targetModule && hasAny(fullText, ['coin', 'disc battery', 'button battery', 'esophagus', 'oesophagus', 'esophagoscopy']) && hasAny(fullText, ['ingest', 'ingestion', 'swallow', 'swallowing', 'child', 'x-ray']) && !hasAny(fullText, ['bronchus', 'carina', 'trachea', 'larynx', 'stridor', 'choking'])) {
    if (cur !== 328) {
      targetModule = 328; // Mixed / Miscellaneous Topics (Esophageal foreign bodies)
      rationale = `Tests diagnosis and radiologic differentiation of esophageal foreign bodies (coin vs battery on AP/lateral neck X-ray), which belongs to Mixed / Miscellaneous ENT Topics (Aerodigestive Foreign Bodies).`;
    }
  }

  // --- Foreign body in Airway / Heimlich / Croup / Epiglottitis / Laryngomalacia / Laryngocele / Tracheostomy ---
  if (!targetModule && (hasAny(fullText, ['laryngomalacia', 'omega-shaped epiglottis', 'congenital laryngeal stridor', 'acute epiglottitis', 'steeple sign', 'croup', 'acute laryngotracheobronchitis', 'laryngocele', 'trumpet blower', 'trumpet player', 'heimlich manoeuvre', 'subglottic stenosis', 'tracheostomy']) && !hasAny(fullText, ['csom', 'tympanoplasty', 'acoustic neuroma']))) {
    if (cur !== 325) {
      targetModule = 325; // Stridor and Congenital Conditions of Larynx
      rationale = `Tests pediatric airway conditions, congenital laryngeal anomalies (laryngomalacia, laryngocele, croup, epiglottitis), or tracheostomy procedures, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).`;
    }
  }

  // --- Voice and Speech Disorders (Vocal nodules, polyps, Reinke's, contact ulcer, vocal cord palsy, thyroplasty, puberphonia, spasmodic dysphonia) ---
  if (!targetModule && hasAny(fullText, ['vocal polyp', 'vocal nodule', 'singer\'s node', 'reinke\'s oedema', 'reinke\'s edema', 'contact ulcer', 'vocal fold palsy', 'vocal cord palsy', 'vocal cord paralysis', 'thyroplasty', 'semon\'s law', 'puberphonia', 'spasmodic dysphonia', 'hysterical aphonia', 'functional aphonia', 'gutzmann'])) {
    if (cur !== 326) {
      targetModule = 326; // Voice and Speech Disorders
      rationale = `Tests benign vocal fold pathology, vocal cord paralysis, laryngeal framework surgery (thyroplasty), or voice disorders, belonging to Module 326 (Voice and Speech Disorders).`;
    }
  }

  // --- Laryngeal Carcinoma ---
  if (!targetModule && (hasAny(fullText, ['laryngeal carcinoma', 'carcinoma larynx', 'glottic cancer', 'supraglottic cancer', 'total laryngectomy', 'cordectomy', 'blom-singer', 'tracheoesophageal puncture', 'tep']) || (hasAny(fullText, ['vocal cord', 'glottis', 'supraglottis']) && hasAny(fullText, ['t1', 't2', 't3', 't4', 'carcinoma', 'malignan', 'radiation therapy', 'radiotherapy'])))) {
    if (cur !== 327) {
      targetModule = 327; // Laryngeal Carcinoma
      rationale = `Tests staging, clinical behavior, or oncologic management of laryngeal carcinoma, belonging to Module 327 (Laryngeal Carcinoma).`;
    }
  }

  // --- Larynx Anatomy & Physiology ---
  if (!targetModule && (hasAny(fullText, ['posterior cricoarytenoid', 'cricothyroid', 'lateral cricoarytenoid', 'arytenoid', 'recurrent laryngeal nerve', 'superior laryngeal nerve', 'rima glottidis', 'pre-epiglottic space', 'paraglottic space', 'quadrangular membrane', 'conus elasticus', 'intrinsic muscles of larynx']) && !hasAny(fullText, ['palsy', 'paralysis', 'carcinoma', 'stridor', 'thyroidectomy', 'papillary', 'croup']))) {
    if (cur !== 324) {
      targetModule = 324; // Anatomy and Physiology of Larynx
      rationale = `Tests intrinsic/extrinsic laryngeal muscular, neurovascular, or structural anatomy, belonging to Module 324 (Anatomy and Physiology of Larynx).`;
    }
  }

  // --- Adenoids ---
  if (!targetModule && (hasAny(fullText, ['adenoid hypertrophy', 'adenoid facies', 'adenoidectomy', 'enlarged adenoids']) || (hasAny(fullText, ['mouth breathing']) && hasAny(fullText, ['adenoid'])))) {
    if (cur !== 320) {
      targetModule = 320; // Adenoids
      rationale = `Tests adenoid hypertrophy, adenoid facies, or adenoidectomy indications/complications, belonging to Module 320 (Adenoids).`;
    }
  }

  // --- Tonsils ---
  if (!targetModule && (hasAny(fullText, ['tonsillitis', 'quinsy', 'peritonsillar abscess', 'tonsillectomy', 'palatine tonsil', 'crypta magna']) && !hasAny(fullText, ['adenoid']))) {
    if (cur !== 321) {
      targetModule = 321; // Tonsils
      rationale = `Tests palatine tonsil anatomy, infections (acute/membranous tonsillitis, quinsy), or tonsillectomy procedures, belonging to Module 321 (Tonsils).`;
    }
  }

  // --- Nasopharyngeal Angiofibroma (JNA) ---
  if (!targetModule && (hasAny(fullText, ['angiofibroma', 'juvenile nasopharyngeal angiofibroma', 'holman-miller', 'holman miller', 'antral sign']) || (hasAny(fullText, ['adolescent male', 'epistaxis', 'nasopharyngeal mass']) && hasAny(fullText, ['biopsy contraindicated', 'sphenopalatine foramen', 'internal maxillary artery'])))) {
    if (cur !== 322) {
      targetModule = 322; // Nasopharyngeal Angiofibroma
      rationale = `Tests Juvenile Nasopharyngeal Angiofibroma (clinical triad, Holman-Miller sign, imaging, or management), which has a dedicated ENT module: Module 322 (Nasopharyngeal Angiofibroma).`;
    }
  }

  // --- Nasopharyngeal Carcinoma (NPC) ---
  if (!targetModule && (hasAny(fullText, ['nasopharyngeal carcinoma', 'trotter\'s triad', 'fossa of rosenmuller', 'fossa of rosenmüller']) || (hasAny(fullText, ['nasopharynx', 'ebv', 'epstein-barr']) && hasAny(fullText, ['cervical node', 'carcinoma', 'radiotherapy'])))) {
    if (cur !== 323) {
      targetModule = 323; // Nasopharyngeal Carcinoma
      rationale = `Tests Nasopharyngeal Carcinoma (NPC etiology, presentation, Trotter's triad, or radiotherapy management), belonging to Module 323 (Nasopharyngeal Carcinoma).`;
    }
  }

  // --- Pharynx Anatomy, Physiology, Spaces & Zenker ---
  if (!targetModule && (hasAny(fullText, ['zenker\'s diverticulum', 'killian\'s dehiscence', 'retropharyngeal abscess', 'parapharyngeal space', 'ludwig\'s angina', 'pyriform fossa', 'pyriform sinus', 'passavant\'s ridge', 'pharyngeal pouch', 'waldeyer\'s ring', 'deglutition', 'plummer vinson', 'paterson-kelly', 'postcricoid web']) && !hasAny(fullText, ['tonsillitis', 'quinsy', 'adenoid', 'angiofibroma', 'nasopharyngeal carcinoma']))) {
    if (cur !== 319) {
      targetModule = 319; // Anatomy and Physiology of Pharynx
      rationale = `Tests pharyngeal anatomy, deep neck space infections (retropharyngeal, Ludwig's angina), Zenker's diverticulum, or hypopharyngeal structures, belonging to Module 319 (Anatomy and Physiology of Pharynx).`;
    }
  }

  // --- Tumors of Nose and PNS ---
  if (!targetModule && (hasAny(fullText, ['inverted papilloma', 'ringertz tumor', 'esthesioneuroblastoma', 'olfactory neuroblastoma', 'osteoma of frontal', 'maxillary sinus carcinoma', 'ohngren\'s line', 'ohngren line', 'maxillectomy', 'sebileau']) && !hasAny(fullText, ['angiofibroma']))) {
    if (cur !== 317) {
      targetModule = 317; // Tumors of Nose and PNS
      rationale = `Tests benign or malignant sinonasal tumors (Inverted papilloma, Esthesioneuroblastoma, Maxillary sinus carcinoma, Osteoma), belonging to Module 317 (Tumors of Nose and PNS).`;
    }
  }

  // --- Facial & Nasal Trauma / Fractures / CSF Rhinorrhea ---
  if (!targetModule && (hasAny(fullText, ['blow-out fracture', 'blowout fracture', 'orbital floor fracture', 'nasal bone fracture', 'le fort', 'zygomatic fracture', 'csf rhinorrhea', 'csf rhinorrhoea', 'target sign', 'double target sign', 'beta-2 transferrin', 'cribriform plate fracture', 'battle\'s sign', 'battle sign', 'longitudinal fracture of temporal bone', 'fracture of temporal bone']) && !hasAny(fullText, ['epistaxis packing', 'mastoiditis']))) {
    if (cur !== 316) {
      targetModule = 316; // Trauma of Nose and Face
      rationale = `Tests maxillofacial trauma, nasal bone fractures, blow-out fractures, or post-traumatic CSF rhinorrhea, belonging to Module 316 (Trauma of Nose and Face).`;
    }
  }

  // --- Disorder of Nasal Septum and Polyposis ---
  if (!targetModule && (hasAny(fullText, ['deviated nasal septum', 'submucous resection', 'septoplasty', 'killian\'s incision', 'freer\'s incision', 'septal hematoma', 'septal abscess', 'septal perforation', 'antrochoanal polyp', 'ethmoidal polyp', 'ethmoidal nasal polyp', 'nasal polypi', 'nasal polyposis', 'samter\'s triad']) && !hasAny(fullText, ['inverted papilloma', 'angiofibroma']))) {
    if (cur !== 315) {
      targetModule = 315; // Disorder of Nasal Septum and Nasal Polyposis
      rationale = `Tests nasal septal deviations/surgeries (DNS, SMR, septoplasty), septal collections, or nasal polyps (antrochoanal, ethmoidal), belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).`;
    }
  }

  // --- Rhinitis ---
  if (!targetModule && (hasAny(fullText, ['allergic rhinitis', 'vasomotor rhinitis', 'rhinitis medicamentosa', 'nasal allergy', 'allergic shiners', 'allergic salute', 'dennie-morgan']) && !hasAny(fullText, ['rhinosporidiosis', 'rhinoscleroma', 'atrophic rhinitis', 'ozena', 'sinusitis']))) {
    if (cur !== 314) {
      targetModule = 314; // Rhinitis
      rationale = `Tests clinical features, pathophysiology, or pharmacological management of allergic or non-allergic rhinitis, belonging to Module 314 (Rhinitis).`;
    }
  }

  // --- Sinusitis and its Complications ---
  if (!targetModule && (hasAny(fullText, ['sinusitis', 'fess', 'functional endoscopic sinus surgery', 'pott\'s puffy tumour', 'pott\'s puffy tumor', 'orbital cellulitis', 'subperiosteal abscess', 'cavernous sinus thrombosis', 'mucormycosis of sinus', 'fungal sinusitis', 'allergic fungal sinusitis', 'maxillary sinusitis', 'sphenoid sinus surgery']) && !hasAny(fullText, ['inverted papilloma', 'angiofibroma', 'osteoma']))) {
    if (cur !== 318) {
      targetModule = 318; // Sinusitis and its Complication
      rationale = `Tests acute/chronic rhinosinusitis, FESS, fungal sinusitis, or orbital/intracranial complications of sinusitis, belonging to Module 318 (Sinusitis and its Complication).`;
    }
  }

  // --- Specific Diseases / Granulomas / Anomalies of Nose ---
  if (!targetModule && (hasAny(fullText, ['rhinoscleroma', 'mikulicz', 'russell bodies', 'rhinosporidiosis', 'rhinosporidium', 'atrophic rhinitis', 'ozaena', 'ozena', 'merciful anosmia', 'young\'s operation', 'choanal atresia', 'nasal dermoid', 'encephalocele', 'foreign body in nose', 'rhinolith', 'rhinophyma']) && !hasAny(fullText, ['syringing']))) {
    if (cur !== 313) {
      targetModule = 313; // Congenital Anomalies of Nose and Disease of Nose
      rationale = `Tests congenital anomalies (choanal atresia, dermoids) or chronic specific granulomatous nasal diseases (rhinoscleroma, rhinosporidiosis, atrophic rhinitis), belonging to Module 313 (Congenital Anomalies of Nose and Disease of Nose).`;
    }
  }

  // --- Paranasal Sinus Anatomy & Physiology ---
  if (!targetModule && (hasAny(fullText, ['maxillary sinus', 'frontal sinus', 'ethmoid sinus', 'sphenoid sinus', 'ostiomeatal complex', 'agger nasi', 'haller cell', 'onodi cell', 'water\'s view', 'caldwell view']) && hasAny(fullText, ['anatomy', 'boundary', 'wall', 'opening', 'innervation', 'blood supply', 'development', 'x-ray']) && !hasAny(fullText, ['sinusitis', 'carcinoma', 'fracture', 'polyp', 'angiofibroma']))) {
    if (cur !== 310) {
      targetModule = 310; // Anatomy of Paranasal Sinuses
      rationale = `Tests anatomical boundaries, drainage pathways, or radiographic views of paranasal sinuses, belonging to Module 310 (Anatomy of Paranasal Sinuses).`;
    }
  }

  // --- Physiology of Nose and PNS ---
  if (!targetModule && (hasAny(fullText, ['nasal cycle', 'mucociliary clearance', 'saccharin test', 'olfaction', 'olfactory pathway', 'humidification', 'filtration of air']) && !hasAny(fullText, ['sinusitis', 'rhinitis']))) {
    if (cur !== 311) {
      targetModule = 311; // Physiology of Nose and Paranasal Sinuses
      rationale = `Tests physiological functions of the nasal cavity and sinuses (mucociliary clearance, nasal cycle, olfaction), belonging to Module 311 (Physiology of Nose and Paranasal Sinuses).`;
    }
  }

  // --- Epistaxis ---
  if (!targetModule && (hasAny(fullText, ['epistaxis', 'kiesselbach\'s plexus', 'little\'s area', 'woodruff\'s plexus', 'anterior nasal pack', 'posterior nasal pack', 'trotter\'s method', 'sphenopalatine artery ligation', 'rendu osler weber']) && !hasAny(fullText, ['angiofibroma', 'inverted papilloma', 'rhinosporidiosis', 'carcinoma']))) {
    if (cur !== 312) {
      targetModule = 312; // Epistaxis
      rationale = `Tests etiology, vascular supply of bleeding areas, or emergency/surgical management of epistaxis, belonging to Module 312 (Epistaxis).`;
    }
  }

  // --- Ear Tumors (Glomus, Acoustic Neuroma, etc.) ---
  if (!targetModule && (hasAny(fullText, ['glomus tumor', 'glomus jugulare', 'glomus tympanicum', 'pulsatile tinnitus', 'brown\'s sign', 'rising sun sign', 'acoustic neuroma', 'vestibular schwannoma', 'cerebellopontine angle', 'hitselberger']) || (hasAny(fullText, ['squamous cell carcinoma of the temporal bone', 'fisch classification of glomus'])))) {
    if (cur !== 303) {
      targetModule = 303; // Tumors of Ear
      rationale = `Tests benign or malignant neoplasms of the ear (Glomus tumor / paraganglioma, Acoustic neuroma / vestibular schwannoma, temporal bone carcinoma), belonging to Module 303 (Tumors of Ear).`;
    }
  }

  // --- Facial Nerve Disorders vs Anatomy ---
  if (!targetModule && hasAny(fullText, ['bell\'s palsy', 'ramsay hunt syndrome', 'house-brackmann', 'facial nerve decompression', 'herpes zoster oticus', 'melkersson', 'frey\'s syndrome'])) {
    if (cur !== 305) {
      targetModule = 305; // Facial Nerve Disorders
      rationale = `Tests pathological conditions, neuropathies, or clinical grading of facial nerve paralysis (Bell's palsy, Ramsay Hunt, House-Brackmann), belonging to Module 305 (Facial Nerve Disorders).`;
    }
  }

  // --- Facial Nerve Anatomy ---
  if (!targetModule && (hasAny(fullText, ['facial nerve', 'greater superficial petrosal', 'chorda tympani', 'nerve to stapedius', 'facial canal', 'fallopian canal']) && hasAny(fullText, ['segment', 'branch', 'course', 'labyrinthine', 'tympanic', 'mastoid', 'meatal', 'innervat']) && !hasAny(fullText, ['palsy', 'paralysis', 'decompression', 'parotid surgery']))) {
    if (cur !== 304) {
      targetModule = 304; // Anatomy of Facial Nerve
      rationale = `Tests course, intratemporal segments, branches, or distribution of the facial nerve, belonging to Module 304 (Anatomy of Facial Nerve).`;
    }
  }

  // --- Otosclerosis ---
  if (!targetModule && (hasAny(fullText, ['otosclerosis', 'otospongiosis', 'carhart\'s notch', 'carhart notch', 'schwartz sign', 'schwartze sign', 'paracusis willisii', 'paracusis of willis', 'stapedectomy', 'stapedotomy', 'sodium fluoride for otosclerosis']) || (hasAny(fullText, ['primipara', 'bilateral conductive hearing loss', 'pregnancy']) && hasAny(fullText, ['otosclerosis', 'stapedial reflex'])))) {
    if (cur !== 301) {
      targetModule = 301; // Otosclerosis
      rationale = `Tests clinical features, audiologic signs (Carhart's notch, Schwartz sign, Paracusis Willisii), or surgical/medical management of otosclerosis, belonging to Module 301 (Otosclerosis).`;
    }
  }

  // --- Meniere's Disease & Vestibular (BPPV, Caloric, Endolymphatic hydrops) ---
  if (!targetModule && (hasAny(fullText, ['meniere\'s disease', 'meniere disease', 'endolymphatic hydrops', 'lermoyez', 'bppv', 'benign paroxysmal positional vertigo', 'dix hallpike', 'hallpike maneuver', 'epley maneuver', 'canalithiasis', 'cupulolithiasis', 'caloric test', 'vestibular evoked myogenic potential', 'vemp', 'tullio\'s phenomenon', 'superior semicircular canal dehiscence']) || (hasAny(fullText, ['episodic vertigo', 'fluctuating hearing loss', 'tinnitus', 'aural fullness'])))) {
    if (cur !== 302) {
      targetModule = 302; // Meniere's Disease (and Peripheral Vestibular Disorders)
      rationale = `Tests peripheral vestibular disorders, endolymphatic hydrops (Meniere's disease), BPPV (Dix-Hallpike, Epley), or vestibular diagnostics (caloric test, VEMP), belonging to Module 302 (Meniere's Disease).`;
    }
  }

  // --- Eustachian Tube & Glue Ear / OME ---
  if (!targetModule && (hasAny(fullText, ['eustachian tube', 'patulous eustachian', 'valsalva', 'toynbee', 'politzer', 'glue ear', 'otitis media with effusion', 'serous otitis media', 'secretory otitis media', 'grommet', 'ventilation tube']) || (hasAny(fullText, ['type b tympanogram']) && hasAny(fullText, ['effusion', 'fluid', 'glue ear'])))) {
    if (cur !== 306) {
      targetModule = 306; // Eustachian Tube (and Otitis Media with Effusion)
      rationale = `Tests Eustachian tube physiology/tests, or Otitis Media with Effusion / Glue ear (pathophysiology, grommet insertion), belonging to Module 306 (Eustachian Tube).`;
    }
  }

  // --- Cholesteatoma & Types of CSOM ---
  if (!targetModule && (hasAny(fullText, ['cholesteatoma', 'atticoantral', 'tubotympanic', 'unsafe csom', 'safe csom', 'retraction pocket', 'scutum erosion']) && !hasAny(fullText, ['mastoidectomy', 'tympanoplasty', 'brain abscess', 'sinus thrombosis', 'petrositis', 'fistula test']))) {
    if (cur !== 299) {
      targetModule = 299; // Cholesteatoma and Types of CSOM
      rationale = `Tests pathology, pathogenesis, classification, and presentation of CSOM types and cholesteatoma, belonging to Module 299 (Cholesteatoma and Types of CSOM).`;
    }
  }

  // --- CSOM Treatment & Complications ---
  if (!targetModule && (hasAny(fullText, ['tympanoplasty', 'mastoidectomy', 'petrositis', 'gradenigo', 'lateral sinus thrombosis', 'sigmoid sinus thrombosis', 'otogenic brain abscess', 'bezold abscess', 'citelli', 'luc\'s abscess', 'coalescent mastoiditis', 'labyrinthine fistula']) || (hasAny(fullText, ['csom']) && hasAny(fullText, ['complication', 'abscess', 'treatment', 'surgery'])))) {
    if (cur !== 300) {
      targetModule = 300; // CSOM - Treatment and Complications
      rationale = `Tests surgical treatment of CSOM (tympanoplasty, mastoidectomy) or extracranial/intracranial complications (Gradenigo syndrome, mastoid abscesses, sinus thrombosis), belonging to Module 300 (CSOM - Treatment and Complications).`;
    }
  }

  // --- Disorders of External Ear (Otitis externa, otomycosis, wax, hematoma auris, etc.) ---
  if (!targetModule && (hasAny(fullText, ['otitis externa', 'malignant otitis externa', 'necrotizing otitis externa', 'otomycosis', 'singapore ear', 'swimmer\'s ear', 'keratosis obturans', 'ear wax', 'cerumen', 'syringing', 'hematoma auris', 'perichondritis of pinna', 'foreign body in eac', 'foreign body impaction in ear', 'myringitis bullosa', 'furuncle of ear']))) {
    if (cur !== 298) {
      targetModule = 298; // Disorders of External Ear
      rationale = `Tests inflammatory, infectious, traumatic, or obstructive disorders of the auricle and external auditory canal (otitis externa, otomycosis, ear wax, hematoma auris), belonging to Module 298 (Disorders of External Ear).`;
    }
  }

  // --- Embryology of Ear & Malformations ---
  if (!targetModule && (hasAny(fullText, ['embryology of ear', 'preauricular sinus', 'preauricular tag', 'microtia', 'anotia', 'first branchial cleft', 'first branchial pouch', 'first pharyngeal arch', 'second pharyngeal arch', 'scheibe dysplasia', 'mondini dysplasia', 'michel aplasia', 'hillocks of his', 'germ layers of tympanic membrane']))) {
    if (cur !== 293) {
      targetModule = 293; // Embryology of Ear and Malformations
      rationale = `Tests ear embryological development, pharyngeal arch/cleft derivatives, or congenital ear malformations (dysplasias, microtia, preauricular sinus), belonging to Module 293 (Embryology of Ear and Malformations).`;
    }
  }

  // --- Audiometric & Special Tests of Hearing ---
  if (!targetModule && (hasAny(fullText, ['pure tone audiometry', 'pta', 'tympanometry', 'tympanogram', 'stapedial reflex', 'acoustic reflex', 'berA', 'brainstem evoked response', 'otoacoustic emission', 'oae', 'sisi test', 'tone decay', 'rollover phenomenon', 'speech audiometry', 'audiogram']) && !hasAny(fullText, ['otosclerosis', 'meniere']))) {
    if (cur !== 308) {
      targetModule = 308; // Audiometric Tests and Special Tests of Hearing
      rationale = `Tests audiometric instrumentation, electrophysiologic testing (BERA/OAE), tympanogram types, or special auditory diagnostic tests, belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).`;
    }
  }

  // --- Hearing Physiology & Tuning Fork Tests ---
  if (!targetModule && (hasAny(fullText, ['rinne test', 'weber test', 'schwabach test', 'bing test', 'gelle\'s test', 'gelle test', 'absolute bone conduction', 'abc test', 'tuning fork', 'impedance matching', 'transformer ratio', 'areal ratio', 'lever ratio', 'travelling wave theory', 'von bekesy', 'conductive hearing loss', 'sensorineural hearing loss']) && !hasAny(fullText, ['otosclerosis', 'audiogram', 'tympanogram']))) {
    if (cur !== 307) {
      targetModule = 307; // Physiology of Hearing and Tuning Fork Tests
      rationale = `Tests mechanical physiology of sound transmission (impedance matching, travelling wave) or clinical tuning fork evaluations (Rinne, Weber, Schwabach), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).`;
    }
  }

  // --- Hearing Aids / Cochlear Implants / Rehabilitation ---
  if (!targetModule && hasAny(fullText, ['cochlear implant', 'baha', 'bone-anchored hearing aid', 'bone anchored hearing aid', 'hearing aid'])) {
    if (cur !== 328) {
      targetModule = 328; // Mixed / Miscellaneous Topics (Hearing aids & Auditory Implants)
      rationale = `Tests auditory rehabilitation technology (Cochlear implants, Bone Anchored Hearing Aids / BAHA components and indications), belonging to Module 328 (Mixed / Miscellaneous Topics).`;
    }
  }

  if (targetModule && targetModule !== cur) {
    moves.push({
      id,
      fromModule: cur,
      toModule: targetModule,
      reason: rationale
    });
  }
}

console.log(`Scan completed. Found ${moves.length} potential moves.`);
fs.writeFileSync('tools/draft_moves.json', JSON.stringify(moves, null, 2));
process.exit(0);
