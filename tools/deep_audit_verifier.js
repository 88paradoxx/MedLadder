const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Auditing all 1217 questions across modules 293 to 328...');

// We will inspect question by question and classify
const flaggedMoves = [];

qs.forEach(q => {
  const id = q.id;
  const curMod = q.module_id;
  const qText = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const expl = clean(q.explanation);
  const fullText = `${qText} ${optA} ${optB} ${optC} ${optD} ${expl}`.toLowerCase();

  let targetMod = null;
  let reason = '';

  // Check based on true topic of question:

  // --- CROSS SUBJECT: PSM ---
  if (fullText.includes('incineration of infectious') || fullText.includes('double-chamber') && fullText.includes('incineration')) {
    targetMod = 398;
    reason = 'Question tests biomedical waste management technology (double-chamber incineration of infectious waste), which belongs to PSM / Community Medicine under Biomedical Waste Management, not ENT CSOM.';
  }

  // --- CROSS SUBJECT: SURGERY (Thyroid) ---
  else if ((fullText.includes('papillary carcinoma thyroid') || fullText.includes('medullary carcinoma thyroid')) && !fullText.includes('laryngeal')) {
    targetMod = 492;
    reason = 'Question tests thyroid malignancy staging/management (papillary/medullary thyroid carcinoma, radioiodine ablation), which belongs to General Surgery (Thyroid Malignancies).';
  }
  else if ((fullText.includes('total thyroidectomy') && fullText.includes('serum calcium') || fullText.includes('inferior thyroid artery goes under the surface of thyroid') && fullText.includes('tetan')) && !fullText.includes('laryngeal nerve')) {
    targetMod = 491;
    reason = 'Question tests complications of thyroid surgery (hypocalcemia/tetany post-thyroidectomy, inferior thyroid artery anatomy), which belongs to General Surgery (Benign Lesions of Thyroid / Endocrine Surgery).';
  }

  // --- CROSS SUBJECT: SURGERY (Oral Cavity & Salivary Glands) ---
  else if (fullText.includes('carcinoma tongue') && fullText.includes('hemiglossectomy')) {
    targetMod = 522;
    reason = 'Question tests management and radiation indications for oral tongue carcinoma treated with hemiglossectomy, belonging to General Surgery (Oral Cavity & Salivary Glands).';
  }
  else if (fullText.includes('carcinoma lower lip') || fullText.includes('carcinoma buccal mucosa') || fullText.includes('verrucous carcinoma') && fullText.includes('chewing tobacco')) {
    targetMod = 522;
    reason = 'Question tests oral cavity malignancy (lip carcinoma, buccal mucosa cancer, verrucous carcinoma / Ackerman tumor) and reconstruction flaps, which belongs to General Surgery (Oral Cavity & Salivary Glands).';
  }
  else if (fullText.includes('warthin\'s tumour') || fullText.includes('pleomorphic adenoma of parotid') || fullText.includes('computed tomography features of malignant salivary') || (fullText.includes('parotid surgery') && fullText.includes('injured nerve'))) {
    targetMod = 522;
    reason = 'Question tests salivary gland neoplasms (parotid pleomorphic adenoma, Warthin tumor, salivary malignancy) or parotidectomy complications, belonging to General Surgery (Oral Cavity & Salivary Glands).';
  }
  else if (fullText.includes('ranula') && (fullText.includes('sublingual') || fullText.includes('extravasation cyst') || fullText.includes('floor of mouth')) && !fullText.includes('middle ear')) {
    targetMod = 522;
    reason = 'Question tests ranula (mucous extravasation cyst of sublingual salivary gland in floor of mouth), belonging to General Surgery (Oral Cavity & Salivary Glands).';
  }
  else if (fullText.includes('retention cyst of a minor salivary gland')) {
    targetMod = 522;
    reason = 'Question tests retention cyst / mucocele of minor salivary gland in oral cavity, belonging to General Surgery (Oral Cavity & Salivary Glands).';
  }
  else if (fullText.includes('leukoplakia') && fullText.includes('chronic smoker') && fullText.includes('white patch')) {
    targetMod = 522;
    reason = 'Question tests oral leukoplakia (premalignant mucosal lesion of oral cavity), belonging to General Surgery (Oral Cavity & Salivary Glands).';
  }

  // --- CROSS SUBJECT: DERMATOLOGY ---
  else if (fullText.includes('lupus vulgaris') && fullText.includes('tuberculous')) {
    targetMod = 637;
    reason = 'Question tests Lupus vulgaris (cutaneous tuberculosis with apple-jelly nodules on diascopy), belonging to Dermatology (Bacterial & Mycobacterial infections).';
  }
  else if (fullText.includes('basal cell carcinoma is the most common type of skin cancer') || fullText.includes('non-healing ulcer between nose and upper lip') && fullText.includes('basal cell')) {
    targetMod = 644;
    reason = 'Question tests Basal Cell Carcinoma (rodent ulcer) of facial skin, belonging to Dermatology (Cutaneous Malignancies).';
  }

  // --- CROSS SUBJECT: PHARMACOLOGY ---
  else if (fullText.includes('cisplatin and 5-fluorouracil were started') && fullText.includes('mechanism of action of cisplatin')) {
    targetMod = 267;
    reason = 'Question specifically tests the pharmacological mechanism of action of Cisplatin (DNA cross-linking), belonging to Pharmacology (Anticancer Drugs).';
  }

  // --- CROSS SUBJECT: ANATOMY ---
  else if (fullText.includes('posterior communicating artery a branch of')) {
    targetMod = 27;
    reason = 'Question tests pure neurovascular anatomy of the circle of Willis (posterior communicating artery origin from ICA), belonging to Anatomy (Muscles, Neurovascular Anatomy of Head & Neck).';
  }
  else if (fullText.includes('branches of 1st part of maxillary artery')) {
    targetMod = 27;
    reason = 'Question tests anatomical branches of the maxillary artery, belonging to Anatomy (Muscles, Neurovascular Anatomy of Head & Neck).';
  }
  else if (fullText.includes('level 5 a lymph node level') && fullText.includes('boundaries')) {
    targetMod = 27;
    reason = 'Question tests anatomical boundaries of posterior triangle / Level V cervical lymph nodes, belonging to Anatomy (Head & Neck Anatomy).';
  }

  // --- INTRA-ENT: EAR EMBRYOLOGY & MALFORMATIONS (Module 293) ---
  else if ((fullText.includes('preauricular sinus') || fullText.includes('microtia') || fullText.includes('anotia') || fullText.includes('scheibe dysplasia') || fullText.includes('mondini dysplasia') || fullText.includes('michel aplasia') || fullText.includes('middle ear ossicles begin forming') && fullText.includes('neural crest') || fullText.includes('tympanic membrane develops from all three germinal layers') || fullText.includes('saccule of inner ear develop from')) && !fullText.includes('csom') && !fullText.includes('stapedectomy')) {
    if (curMod !== 293) {
      targetMod = 293;
      reason = 'Question tests embryological development of the ear (branchial arches, germ layers, ossicle/saccule embryogenesis) or congenital ear malformations (microtia, anotia, preauricular sinus, Scheibe/Mondini dysplasia), belonging to Module 293 (Embryology of Ear and Malformations).';
    }
  }

  // --- INTRA-ENT: EXTERNAL EAR ANATOMY (Module 294) ---
  else if ((fullText.includes('fissures of santorini') || fullText.includes('arnold\'s nerve') && fullText.includes('syringing') || fullText.includes('nerve provides sensation to the ear') && fullText.includes('greater auricular')) && !fullText.includes('csom') && !fullText.includes('facial palsy')) {
    if (curMod !== 294) {
      targetMod = 294;
      reason = 'Question tests anatomical structures, natural dehiscences (fissures of Santorini), or sensory innervation of the auricle/EAC (Arnold\'s nerve, greater auricular nerve), belonging to Module 294 (Anatomy of External Ear).';
    }
  }

  // --- INTRA-ENT: EXTERNAL EAR DISORDERS (Module 298) ---
  else if (fullText.includes('malignant otitis externa') || fullText.includes('necrotizing otitis externa') || fullText.includes('otomycosis') || fullText.includes('singapore ear') || fullText.includes('wet newspaper') || fullText.includes('keratosis obturans') || (fullText.includes('ear wax') && fullText.includes('syringing') && !fullText.includes('arnold\'s nerve')) || fullText.includes('pinna haematoma') || fullText.includes('traumatic hematoma of the pinna') || fullText.includes('live insect in eac') || fullText.includes('foreign body impaction in ear') || fullText.includes('myringitis bullosa')) {
    if (curMod !== 298) {
      targetMod = 298;
      reason = 'Question tests clinical presentation, pathology, or treatment of external ear disorders (malignant otitis externa, otomycosis, keratosis obturans, ear wax, hematoma auris, foreign body in EAC), belonging to Module 298 (Disorders of External Ear).';
    }
  }

  // --- INTRA-ENT: CHOLESTEATOMA & TYPES OF CSOM (Module 299) ---
  else if ((fullText.includes('cholesteatoma') || fullText.includes('atticoantral') || fullText.includes('tubotympanic') || fullText.includes('retraction of pars tensa') || fullText.includes('sade classification') || fullText.includes('tos classification') || fullText.includes('unsafe csom') && !fullText.includes('complication') && !fullText.includes('treatment of choice')) && !fullText.includes('mastoidectomy') && !fullText.includes('tympanoplasty') && !fullText.includes('brain abscess') && !fullText.includes('sinus thrombosis') && !fullText.includes('gradenigo') && !fullText.includes('mastoiditis')) {
    if (curMod !== 299) {
      targetMod = 299;
      reason = 'Question tests pathology, pathogenesis, Sade/Tos staging of retraction pockets, or diagnostic characteristics of cholesteatoma and CSOM types, belonging to Module 299 (Cholesteatoma and Types of CSOM).';
    }
  }

  // --- INTRA-ENT: CSOM TREATMENT & COMPLICATIONS (Module 300) ---
  else if (fullText.includes('gradenigo') || fullText.includes('petrositis') || fullText.includes('lateral (sigmoid) sinus thrombosis') || fullText.includes('empty delta sign') || fullText.includes('griesinger') || fullText.includes('bezold abscess') || fullText.includes('citelli') || fullText.includes('coalescent mastoiditis') || fullText.includes('otogenic brain abscess') || (fullText.includes('unsafe csom') && fullText.includes('fistula sign') && fullText.includes('treatment of choice')) || (fullText.includes('tympanoplasty') && (fullText.includes('type') || fullText.includes('graft'))) || fullText.includes('suppurative labyrinthitis') || fullText.includes('labyrinthine fistula as a complication')) {
    if (curMod !== 300) {
      targetMod = 300;
      reason = 'Question tests complications of suppurative otitis media (Gradenigo syndrome, lateral sinus thrombosis, Bezold abscess, coalescent mastoiditis, labyrinthine fistula, brain abscess) or CSOM surgical intervention (tympanoplasty), belonging to Module 300 (CSOM - Treatment and Complications).';
    }
  }

  // --- INTRA-ENT: OTOSCLEROSIS (Module 301) ---
  else if ((fullText.includes('otosclerosis') || fullText.includes('otospongiosis') || fullText.includes('carhart\'s notch') || fullText.includes('schwartz sign') || fullText.includes('schwartze sign') || fullText.includes('paracusis willisii') || fullText.includes('paracusis of willis') || fullText.includes('stapedectomy') || fullText.includes('stapedial piston') || fullText.includes('sodium fluoride') && fullText.includes('hearing') || (fullText.includes('conductive hearing loss') && fullText.includes('pregnancy') && fullText.includes('aggravated'))) && !fullText.includes('syndrome includes all except')) {
    if (curMod !== 301) {
      targetMod = 301;
      reason = 'Question tests otosclerosis pathophysiology, characteristic audiologic/clinical signs (Carhart\'s notch, Schwartz sign, Paracusis Willisii), or surgical/medical management (stapedectomy, sodium fluoride), belonging to Module 301 (Otosclerosis).';
    }
  }

  // --- INTRA-ENT: MENIERE'S DISEASE & VESTIBULAR (Module 302) ---
  else if (fullText.includes('meniere\'s disease') || fullText.includes('meniere disease') || fullText.includes('endolymphatic hydrops') || fullText.includes('lermoyez syndrome') || fullText.includes('bppv') || fullText.includes('benign paroxysmal positional vertigo') || fullText.includes('dix hallpike') || fullText.includes('hallpike maneuver') || fullText.includes('epley maneuver') || fullText.includes('caloric test') || fullText.includes('tullio\'s phenomenon') || fullText.includes('superior semicircular canal dehiscence') || (fullText.includes('episodic vertigo') && fullText.includes('tinnitus') && fullText.includes('hearing loss') && fullText.includes('fluctuat'))) {
    if (curMod !== 302) {
      targetMod = 302;
      reason = 'Question tests Meniere\'s disease (endolymphatic hydrops, Lermoyez syndrome) or peripheral vestibular disorders (BPPV, Dix-Hallpike/Epley, Tullio\'s phenomenon, caloric testing), belonging to Module 302 (Meniere\'s Disease).';
    }
  }

  // --- INTRA-ENT: TUMORS OF EAR (Module 303) ---
  else if (fullText.includes('glomus jugulare') || fullText.includes('glomus tympanicum') || fullText.includes('glomus tumour') || fullText.includes('glomus tumor') || fullText.includes('pulsatile tinnitus and an ear mass') || fullText.includes('rising sun') || fullText.includes('brown\'s sign') || fullText.includes('vestibular schwannoma') || fullText.includes('acoustic neuroma') || fullText.includes('hitselberger') || fullText.includes('squamous cell carcinoma of the temporal bone') || fullText.includes('fisch classification of glomus')) {
    if (curMod !== 303) {
      targetMod = 303;
      reason = 'Question tests neoplasms of the ear and temporal bone (Glomus tumor / paraganglioma, Acoustic neuroma / vestibular schwannoma, temporal bone carcinoma, Fisch staging), belonging to Module 303 (Tumors of Ear).';
    }
  }

  // --- INTRA-ENT: FACIAL NERVE ANATOMY (Module 304) ---
  else if ((fullText.includes('facial nerve') || fullText.includes('fallopian canal')) && (fullText.includes('segment') || fullText.includes('labyrinthine') || fullText.includes('tympanic segment') || fullText.includes('mastoid segment') || fullText.includes('greater superficial petrosal')) && !fullText.includes('bell\'s palsy') && !fullText.includes('house-brackmann') && !fullText.includes('ramsay hunt') && !fullText.includes('parotid surgery')) {
    if (curMod !== 304) {
      targetMod = 304;
      reason = 'Question tests anatomical course, intratemporal segments, or branching of the facial nerve, belonging to Module 304 (Anatomy of Facial Nerve).';
    }
  }

  // --- INTRA-ENT: FACIAL NERVE DISORDERS (Module 305) ---
  else if (fullText.includes('bell\'s palsy') || fullText.includes('ramsay hunt syndrome') || fullText.includes('herpes zoster oticus') || fullText.includes('house-brackmann') || fullText.includes('frey\'s syndrome') || fullText.includes('facial nerve decompression') || (fullText.includes('lower motor neuron') && fullText.includes('facial paralysis') && fullText.includes('acute-onset'))) {
    if (curMod !== 305) {
      targetMod = 305;
      reason = 'Question tests facial nerve neuropathies, clinical grading (House-Brackmann), Bell\'s palsy, Ramsay Hunt syndrome, or Frey\'s syndrome, belonging to Module 305 (Facial Nerve Disorders).';
    }
  }

  // --- INTRA-ENT: EUSTACHIAN TUBE & GLUE EAR (Module 306) ---
  else if (fullText.includes('eustachian tube') || fullText.includes('patulous eustachian') || fullText.includes('glue ear') || fullText.includes('otitis media with effusion') || fullText.includes('serous otitis media') || fullText.includes('grommet') || fullText.includes('secretory otitis media')) {
    if (curMod !== 306) {
      targetMod = 306;
      reason = 'Question tests Eustachian tube physiology/dysfunction, or Otitis Media with Effusion / Glue ear (OME pathogenesis, diagnosis, grommet insertion), belonging to Module 306 (Eustachian Tube).';
    }
  }

  // --- INTRA-ENT: PHYSIOLOGY OF HEARING & TUNING FORK (Module 307) ---
  else if ((fullText.includes('rinne') || fullText.includes('weber') || fullText.includes('schwabach') || fullText.includes('bing test') || fullText.includes('gelle\'s test') || fullText.includes('absolute bone conduction') || fullText.includes('impedance matching') || fullText.includes('transformer ratio') || fullText.includes('areal ratio') || fullText.includes('lever ratio') || fullText.includes('travelling wave theory') || fullText.includes('auditory pathway from cochlear nucleus to auditory cortex') || fullText.includes('slim') && fullText.includes('auditory')) && !fullText.includes('audiogram') && !fullText.includes('otosclerosis')) {
    if (curMod !== 307) {
      targetMod = 307;
      reason = 'Question tests sound transmission physiology (impedance matching mechanism, travelling wave, central auditory pathway) or clinical tuning fork tests (Rinne, Weber, Schwabach, Gelle), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).';
    }
  }

  // --- INTRA-ENT: AUDIOMETRIC & SPECIAL TESTS OF HEARING (Module 308) ---
  else if ((fullText.includes('pure tone audiometry') || fullText.includes('audiogram') || fullText.includes('tympanogram') || fullText.includes('stapedial reflex') || fullText.includes('acoustic reflex') || fullText.includes('berA') || fullText.includes('brainstem evoked response') || fullText.includes('otoacoustic emission') || fullText.includes('oae') || fullText.includes('sisi test') || fullText.includes('tone decay') || fullText.includes('rollover phenomenon') || fullText.includes('speech audiometry') || fullText.includes('retrocochlear hearing loss') || fullText.includes('recruitment')) && !fullText.includes('otosclerosis') && !fullText.includes('meniere') && !fullText.includes('effusion') && !fullText.includes('glue ear')) {
    if (curMod !== 308) {
      targetMod = 308;
      reason = 'Question tests audiometric evaluations (PTA, speech audiometry, tympanometry), electrophysiologic testing (BERA, OAE), or special tests of hearing (SISI, Tone decay, recruitment, rollover), belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).';
    }
  }

  // --- INTRA-ENT: NOSE ANATOMY (Module 309) ---
  else if ((fullText.includes('nasal septum') || fullText.includes('lateral nasal wall') || fullText.includes('turbinate') || fullText.includes('meatus') || fullText.includes('kiesselbach\'s plexus') || fullText.includes('little\'s area') || fullText.includes('woodruff\'s plexus')) && (fullText.includes('artery') || fullText.includes('nerve') || fullText.includes('cartilage') || fullText.includes('bone') || fullText.includes('anatomy') || fullText.includes('drainage') || fullText.includes('nasolacrimal duct')) && !fullText.includes('epistaxis') && !fullText.includes('septoplasty') && !fullText.includes('polyp') && !fullText.includes('fracture') && !fullText.includes('sinusitis')) {
    if (curMod !== 309) {
      targetMod = 309;
      reason = 'Question tests structural anatomy, arterial blood supply (Little\'s area, Kiesselbach\'s plexus), or meatal ostia of the nasal cavity, belonging to Module 309 (Anatomy of Nose).';
    }
  }

  // --- INTRA-ENT: PARANASAL SINUSES ANATOMY (Module 310) ---
  else if ((fullText.includes('maxillary sinus') || fullText.includes('frontal sinus') || fullText.includes('ethmoid sinus') || fullText.includes('sphenoid sinus') || fullText.includes('ostiomeatal complex') || fullText.includes('agger nasi') || fullText.includes('haller cell') || fullText.includes('onodi cell') || fullText.includes('water\'s view') || fullText.includes('caldwell view') || fullText.includes('anterior most ethmoidal cell')) && (fullText.includes('anatomy') || fullText.includes('boundary') || fullText.includes('drain') || fullText.includes('x-ray') || fullText.includes('radiograph') || fullText.includes('air cells')) && !fullText.includes('sinusitis') && !fullText.includes('carcinoma') && !fullText.includes('fracture') && !fullText.includes('polyp')) {
    if (curMod !== 310) {
      targetMod = 310;
      reason = 'Question tests paranasal sinus anatomical boundaries, ethmoid air cell variations (Agger nasi, Haller, Onodi), drainage ostia, or radiographic projections (Water\'s view), belonging to Module 310 (Anatomy of Paranasal Sinuses).';
    }
  }

  // --- INTRA-ENT: PHYSIOLOGY OF NOSE & PNS (Module 311) ---
  else if ((fullText.includes('nasal cycle') || fullText.includes('mucociliary clearance') || fullText.includes('saccharin test') || fullText.includes('olfaction') || fullText.includes('smell disturbance') || fullText.includes('bowman\'s glands')) && !fullText.includes('sinusitis') && !fullText.includes('rhinitis') && !fullText.includes('inverted papilloma')) {
    if (curMod !== 311) {
      targetMod = 311;
      reason = 'Question tests physiology of nasal mucosal functions, mucociliary transit (saccharin test), nasal cycle, or olfaction pathways, belonging to Module 311 (Physiology of Nose and Paranasal Sinuses).';
    }
  }

  // --- INTRA-ENT: EPISTAXIS (Module 312) ---
  else if ((fullText.includes('epistaxis') || fullText.includes('severe nosebleed') || fullText.includes('anterior nasal pack') || fullText.includes('posterior nasal pack') || fullText.includes('trotter\'s method') || fullText.includes('endoscopic sphenopalatine artery ligation') || fullText.includes('espal') || fullText.includes('rendu osler weber')) && !fullText.includes('angiofibroma') && !fullText.includes('inverted papilloma') && !fullText.includes('rhinosporidiosis') && !fullText.includes('carcinoma') && !fullText.includes('fracture')) {
    if (curMod !== 312) {
      targetMod = 312;
      reason = 'Question tests etiology, vascular sources, emergency management (packing, cautery), or surgical arterial ligation (ESPAL) for epistaxis, belonging to Module 312 (Epistaxis).';
    }
  }

  // --- INTRA-ENT: CONGENITAL ANOMALIES & SPECIFIC DISEASES OF NOSE (Module 313) ---
  else if (fullText.includes('rhinoscleroma') || fullText.includes('mikulicz') || fullText.includes('russell bodies') || fullText.includes('rhinosporidiosis') || fullText.includes('rhinosporidium') || fullText.includes('atrophic rhinitis') || fullText.includes('ozaena') || fullText.includes('ozena') || fullText.includes('merciful anosmia') || fullText.includes('lautenschlaeger') || fullText.includes('young\'s operation') || fullText.includes('choanal atresia') || fullText.includes('nasal dermoid') || fullText.includes('encephalocele') || (fullText.includes('unilateral, foul-smelling') && fullText.includes('nasal discharge') && fullText.includes('child')) || fullText.includes('disc battery in nose') || fullText.includes('rhinophyma') || fullText.includes('potato tumour')) {
    if (curMod !== 313) {
      targetMod = 313;
      reason = 'Question tests congenital nasal anomalies (choanal atresia, dermoids), specific chronic granulomatous nasal infections (rhinoscleroma, rhinosporidiosis, atrophic rhinitis / ozena), or nasal foreign body / rhinophyma, belonging to Module 313 (Congenital Anomalies of Nose and Disease of Nose).';
    }
  }

  // --- INTRA-ENT: RHINITIS (Module 314) ---
  else if ((fullText.includes('allergic rhinitis') || fullText.includes('vasomotor rhinitis') || fullText.includes('rhinitis medicamentosa') || fullText.includes('nasal allergy') || fullText.includes('allergic shiners') || fullText.includes('allergic salute') || fullText.includes('dennie-morgan')) && !fullText.includes('rhinoscleroma') && !fullText.includes('rhinosporidiosis') && !fullText.includes('atrophic rhinitis') && !fullText.includes('sinusitis') && !fullText.includes('polyp')) {
    if (curMod !== 314) {
      targetMod = 314;
      reason = 'Question tests allergic rhinitis pathophysiology/treatment (intranasal steroids, antihistamines), vasomotor rhinitis, or rhinitis medicamentosa, belonging to Module 314 (Rhinitis).';
    }
  }

  // --- INTRA-ENT: SEPTUM & NASAL POLYPOSIS (Module 315) ---
  else if (fullText.includes('deviated nasal septum') || fullText.includes('dns') && fullText.includes('septum') || fullText.includes('submucous resection') || fullText.includes('smr') && fullText.includes('septum') || fullText.includes('septoplasty') || fullText.includes('killian\'s incision') || fullText.includes('freer\'s incision') || fullText.includes('septal hematoma') || fullText.includes('septal abscess') || fullText.includes('septal perforation') || fullText.includes('antrochoanal polyp') || fullText.includes('ethmoidal polyp') || fullText.includes('nasal polypi') || fullText.includes('nasal polyposis') || fullText.includes('samter\'s triad') || fullText.includes('aspirin-exacerbated respiratory disease')) {
    if (curMod !== 315) {
      targetMod = 315;
      reason = 'Question tests nasal septum disorders (DNS, SMR, septoplasty, septal hematoma/perforation) or sinonasal polyposis (antrochoanal polyp, ethmoidal polyps, Samter\'s triad), belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).';
    }
  }

  // --- INTRA-ENT: TRAUMA OF NOSE AND FACE (Module 316) ---
  else if (fullText.includes('nasal bone fracture') || fullText.includes('walsham') || fullText.includes('asche forceps') || fullText.includes('blow-out fracture') || fullText.includes('blowout fracture') || fullText.includes('orbital floor fracture') || fullText.includes('le fort') || fullText.includes('zygomatic fracture') || fullText.includes('csf rhinorrhea') || fullText.includes('csf rhinorrhoea') || fullText.includes('target sign') || fullText.includes('double target sign') || fullText.includes('beta-2 transferrin') || fullText.includes('battle\'s sign') || fullText.includes('battle sign') || fullText.includes('fracture of temporal bone') || fullText.includes('fracture in middle cranial fos') || fullText.includes('frontal sinus fracture')) {
    if (curMod !== 316) {
      targetMod = 316;
      reason = 'Question tests maxillofacial trauma, nasal/orbital/zygomatic/temporal bone fractures, or post-traumatic CSF rhinorrhea, belonging to Module 316 (Trauma of Nose and Face).';
    }
  }

  // --- INTRA-ENT: TUMORS OF NOSE AND PNS (Module 317) ---
  else if (fullText.includes('inverted papilloma') || fullText.includes('ringertz tumor') || fullText.includes('esthesioneuroblastoma') || fullText.includes('olfactory neuroblastoma') || (fullText.includes('osteoma') && fullText.includes('sinus')) || fullText.includes('maxillary cancer') || fullText.includes('maxillary sinus carcinoma') || fullText.includes('ohngren\'s line') || fullText.includes('maxillectomy')) {
    if (curMod !== 317) {
      targetMod = 317;
      reason = 'Question tests benign or malignant tumors of the nose and paranasal sinuses (Inverted papilloma, Esthesioneuroblastoma, Maxillary sinus SCC, Osteoma, maxillectomy), belonging to Module 317 (Tumors of Nose and PNS).';
    }
  }

  // --- INTRA-ENT: SINUSITIS & ITS COMPLICATIONS (Module 318) ---
  else if ((fullText.includes('sinusitis') || fullText.includes('fess') || fullText.includes('functional endoscopic sinus surgery') || fullText.includes('pott\'s puffy tumour') || fullText.includes('pott\'s puffy tumor') || fullText.includes('orbital cellulitis') && fullText.includes('purulent nasal discharge') || fullText.includes('cavernous sinus thrombosis') || fullText.includes('mucormycosis') && fullText.includes('sinus') || fullText.includes('allergic fungal rhinosinusitis') || fullText.includes('sphenoid sinus surgery')) && !fullText.includes('inverted papilloma') && !fullText.includes('angiofibroma')) {
    if (curMod !== 318) {
      targetMod = 318;
      reason = 'Question tests acute/chronic rhinosinusitis, FESS, fungal sinusitis (mucormycosis, AFRS), or orbital/cranial complications of sinusitis (orbital cellulitis, cavernous sinus thrombosis, Pott\'s puffy tumor), belonging to Module 318 (Sinusitis and its Complication).';
    }
  }

  // --- INTRA-ENT: ANATOMY & PHYSIOLOGY OF PHARYNX & SPACES (Module 319) ---
  else if (fullText.includes('zenker\'s diverticulum') || fullText.includes('killian\'s dehiscence') || fullText.includes('retropharyngeal abscess') || fullText.includes('parapharyngeal space') || fullText.includes('ludwig\'s angina') || fullText.includes('ludwig s angina') || fullText.includes('pyriform fossa') || fullText.includes('pyriform sinus') || fullText.includes('passavant\'s ridge') || fullText.includes('waldeyer\'s ring') || fullText.includes('quiencke') || fullText.includes('angioedema of uvula') || fullText.includes('plummer-vinson') || fullText.includes('paterson-kelly') || fullText.includes('postcricoid web') || (fullText.includes('oropharynx') && fullText.includes('part of')) || (fullText.includes('laryngopharynx') && fullText.includes('part of'))) {
    if (curMod !== 319) {
      targetMod = 319;
      reason = 'Question tests pharyngeal anatomy, hypopharyngeal subsites (pyriform fossa), deep neck spaces (retropharyngeal, Ludwig\'s angina), or Zenker\'s diverticulum / Plummer-Vinson postcricoid web, belonging to Module 319 (Anatomy and Physiology of Pharynx).';
    }
  }

  // --- INTRA-ENT: ADENOIDS (Module 320) ---
  else if (fullText.includes('adenoid hypertrophy') || fullText.includes('adenoid facies') || fullText.includes('adenoidectomy') || fullText.includes('type of voice in adenoid hypertrophy') || (fullText.includes('mouth breathing') && fullText.includes('adenoid'))) {
    if (curMod !== 320) {
      targetMod = 320;
      reason = 'Question tests adenoid hypertrophy, adenoid facies, mouth breathing, or adenoidectomy indications/speech effects, belonging to Module 320 (Adenoids).';
    }
  }

  // --- INTRA-ENT: TONSILS (Module 321) ---
  else if (fullText.includes('tonsillitis') || fullText.includes('quinsy') || fullText.includes('peritonsillar abscess') || fullText.includes('tonsillectomy') || (fullText.includes('hot potato voice') && fullText.includes('trismus')) || fullText.includes('plummy voice') && fullText.includes('peritonsillar')) {
    if (curMod !== 321) {
      targetMod = 321;
      reason = 'Question tests palatine tonsil pathology (acute tonsillitis, peritonsillar abscess / quinsy) or tonsillectomy procedures and postoperative care, belonging to Module 321 (Tonsils).';
    }
  }

  // --- INTRA-ENT: NASOPHARYNGEAL ANGIOFIBROMA (Module 322) ---
  else if (fullText.includes('angiofibroma') || fullText.includes('juvenile nasopharyngeal angiofibroma') || fullText.includes('holman-miller') || fullText.includes('holman miller') || (fullText.includes('adolescent') && fullText.includes('recurrent epistaxis') && fullText.includes('mass') && (fullText.includes('sphenopalatine') || fullText.includes('internal maxillary') || fullText.includes('biopsy')))) {
    if (curMod !== 322) {
      targetMod = 322;
      reason = 'Question tests Juvenile Nasopharyngeal Angiofibroma (JNA triad, Holman-Miller sign, angiography, embolization, surgical approach), which has a dedicated ENT module: Module 322 (Nasopharyngeal Angiofibroma).';
    }
  }

  // --- INTRA-ENT: NASOPHARYNGEAL CARCINOMA (Module 323) ---
  else if (fullText.includes('nasopharyngeal carcinoma') || fullText.includes('trotter\'s triad') || fullText.includes('fossa of rosenmuller') || fullText.includes('fossa of rosenmüller') || (fullText.includes('nasopharynx') && fullText.includes('ebv') && fullText.includes('cervical node'))) {
    if (curMod !== 323) {
      targetMod = 323;
      reason = 'Question tests Nasopharyngeal Carcinoma (NPC site in fossa of Rosenmuller, EBV association, Trotter\'s triad, or cervical nodal metastasis), belonging to Module 323 (Nasopharyngeal Carcinoma).';
    }
  }

  // --- INTRA-ENT: LARYNX ANATOMY & PHYSIOLOGY (Module 324) ---
  else if ((fullText.includes('posterior cricoarytenoid') || fullText.includes('cricothyroid') || fullText.includes('lateral cricoarytenoid') || fullText.includes('tensors of vocal cord') || fullText.includes('adductor of the vocal cords') || fullText.includes('intrinsic muscles of larynx') || fullText.includes('nerve supply of larynx') || fullText.includes('pre-epiglottic space') || fullText.includes('paraglottic space') || fullText.includes('cricoid cartilage')) && !fullText.includes('paralysis') && !fullText.includes('palsy') && !fullText.includes('carcinoma') && !fullText.includes('stridor') && !fullText.includes('thyroidectomy')) {
    if (curMod !== 324) {
      targetMod = 324;
      reason = 'Question tests structural anatomy, cartilaginous framework, intrinsic muscles, or innervation of the larynx, belonging to Module 324 (Anatomy and Physiology of Larynx).';
    }
  }

  // --- INTRA-ENT: STRIDOR, CONGENITAL LARYNX & TRACHEOSTOMY (Module 325) ---
  else if (fullText.includes('laryngomalacia') || fullText.includes('omega-shaped epiglottis') || fullText.includes('congenital laryngeal stridor') || fullText.includes('acute epiglottitis') || fullText.includes('steeple sign') || fullText.includes('croup') || fullText.includes('acute laryngotracheobronchitis') || fullText.includes('laryngocele') || fullText.includes('trumpet blower') || fullText.includes('trumpet player') || fullText.includes('subglottic stenosis') || fullText.includes('tracheostomy') || fullText.includes('heimlich manoeuvre') || fullText.includes('audible thud') || (fullText.includes('choking') && fullText.includes('peanut'))) {
    if (curMod !== 325) {
      targetMod = 325;
      reason = 'Question tests pediatric airway emergencies, congenital laryngeal anomalies (laryngomalacia, laryngocele, croup, acute epiglottitis), tracheostomy, or airway foreign body aspiration, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).';
    }
  }

  // --- INTRA-ENT: VOICE & SPEECH DISORDERS (Module 326) ---
  else if (fullText.includes('vocal nodule') || fullText.includes('singer\'s node') || fullText.includes('vocal polyp') || fullText.includes('reinke\'s oedema') || fullText.includes('reinke\'s edema') || fullText.includes('contact ulcer') || fullText.includes('vocal process of arytenoid') || fullText.includes('vocal fold palsy') || fullText.includes('vocal cord palsy') || fullText.includes('vocal cord paralysis') || fullText.includes('semon\'s law') || fullText.includes('wagner-grossman') || fullText.includes('thyroplasty') || fullText.includes('puberphonia') || fullText.includes('spasmodic dysphonia') || fullText.includes('hysterical aphonia') || fullText.includes('functional aphonia') || fullText.includes('gutzmann')) {
    if (curMod !== 326) {
      targetMod = 326;
      reason = 'Question tests benign vocal fold lesions (nodules, polyps, Reinke\'s edema, contact ulcers), neurogenic vocal cord paralysis (Semon\'s law, thyroplasty), or functional voice disorders (puberphonia, spasmodic dysphonia), belonging to Module 326 (Voice and Speech Disorders).';
    }
  }

  // --- INTRA-ENT: LARYNGEAL CARCINOMA (Module 327) ---
  else if (fullText.includes('carcinoma larynx') || fullText.includes('laryngeal carcinoma') || fullText.includes('glottic cancer') || fullText.includes('supraglottic cancer') || fullText.includes('total laryngectomy') || fullText.includes('cordectomy') || fullText.includes('blom-singer') || fullText.includes('tracheoesophageal puncture') || fullText.includes('tep') || (fullText.includes('glottic') && fullText.includes('malignan')) || (fullText.includes('vocal cord') && fullText.includes('t1') && fullText.includes('stage'))) {
    if (curMod !== 327) {
      targetMod = 327;
      reason = 'Question tests staging, surgical/radiotherapeutic management, or voice rehabilitation (total laryngectomy, Blom-Singer valve) for laryngeal carcinoma, belonging to Module 327 (Laryngeal Carcinoma).';
    }
  }

  // --- INTRA-ENT: MIXED / MISCELLANEOUS (Module 328) ---
  else if ((fullText.includes('cochlear implant') || fullText.includes('bone anchored hearing aid') || fullText.includes('bone-anchored hearing aid') || fullText.includes('baha') || (fullText.includes('coin') || fullText.includes('disc battery') || fullText.includes('foreign body')) && (fullText.includes('esophagus') || fullText.includes('oesophagus') || fullText.includes('esophagoscopy') || fullText.includes('swallow') || fullText.includes('ingestion')) || fullText.includes('obstructive sleep apnea') || fullText.includes('muller\'s manoeuvre') || fullText.includes('lemperts mastoid retractor') || fullText.includes('siegel\'s pneumatic speculum')) && !fullText.includes('bronchus') && !fullText.includes('trachea')) {
    if (curMod !== 328) {
      targetMod = 328;
      reason = 'Question tests auditory rehabilitation devices (cochlear implants, BAHA), esophageal foreign bodies, ENT instruments, or obstructive sleep apnea, belonging to Module 328 (Mixed / Miscellaneous Topics).';
    }
  }

  if (targetMod && targetMod !== curMod) {
    flaggedMoves.push({
      id,
      fromModule: curMod,
      toModule: targetMod,
      reason
    });
  }
});

console.log(`Deep audit finished: Flagged ${flaggedMoves.length} questions out of ${qs.length}.`);

fs.writeFileSync('tools/verified_deep_moves.json', JSON.stringify(flaggedMoves, null, 2));
process.exit(0);
