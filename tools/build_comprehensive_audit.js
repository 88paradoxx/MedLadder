const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Running comprehensive deep audit builder...');

// Load existing validated moves
const baseMoves = JSON.parse(fs.readFileSync('tools/validated_moves.json', 'utf8'));
const addMoves = JSON.parse(fs.readFileSync('tools/additional_verified_moves.json', 'utf8'));

// Combine moves into a Map by ID
const movesMap = new Map();

baseMoves.forEach(m => {
  movesMap.set(m.id, m);
});

addMoves.forEach(m => {
  movesMap.set(m.id, m);
});

// Explicit cross-subject / misplaced questions (questions 12283 to 12309, 12043 to 12204, etc.)
const explicitMappings = [
  // Microbiology
  { id: 12284, to: 191, reason: 'Tests E-rosette formation with sheep erythrocytes by human T lymphocytes (CD2 marker), belonging to Microbiology under Module 191 (Components of Immune System).' },
  { id: 12285, to: 190, reason: 'Tests immunological mechanisms, barriers, and cellular effectors of innate immunity, belonging to Microbiology under Module 190 (General Microbiology / Innate Immunity).' },
  { id: 12286, to: 191, reason: 'Tests immunoglobulin structures and heavy/light chain pentameric assembly of IgM, belonging to Microbiology under Module 191 (Components of Immune System).' },
  { id: 12287, to: 191, reason: 'Tests classical and alternative complement pathways convergence at central component C3, belonging to Microbiology under Module 191 (Components of Immune System).' },
  { id: 12289, to: 217, reason: 'Tests classification of trematodes / blood flukes (Schistosoma species causing schistosomiasis), belonging to Microbiology under Module 217 (Helminthology - Cestodes & Trematodes).' },
  
  // PSM / Community Medicine
  { id: 12288, to: 403, reason: 'Tests graphical representation of continuous quantitative data using a histogram, belonging to PSM under Module 403 (Descriptive Statistics I - Probability and Data).' },
  { id: 12290, to: 377, reason: 'Tests post-exposure prophylaxis (PEP) protocols and 72-hour window period for HIV exposure, belonging to PSM under Module 377 (National Health Programmes II - NLEP, NTEP & NACO).' },
  { id: 12291, to: 358, reason: 'Tests epidemiological study designs for assessing disease prevalence (cross-sectional surveys), belonging to PSM under Module 358 (Principles of Epidemiology).' },
  { id: 12293, to: 358, reason: 'Tests population genetics and equilibrium principles of the Hardy-Weinberg law, belonging to PSM under Module 358 (Principles of Epidemiology).' },
  { id: 12294, to: 397, reason: 'Tests disaster triage color-coding (black code for dead or unsalvageable victims), belonging to PSM under Module 397 (Disaster Management).' },
  { id: 12295, to: 397, reason: 'Tests principles and triage protocols in mass casualty incident management, belonging to PSM under Module 397 (Disaster Management).' },
  { id: 12296, to: 396, reason: 'Tests quantification and proportions of infectious biomedical waste generated in healthcare facilities, belonging to PSM under Module 396 (Biomedical Waste Management).' },
  { id: 12297, to: 399, reason: 'Tests group communication methods and dynamics of a panel discussion, belonging to PSM under Module 399 (Communication for Health Education).' },
  
  // Biochemistry
  { id: 12292, to: 124, reason: 'Tests gene-environment interactions and modifications (epigenetics: DNA methylation, histone acetylation), belonging to Biochemistry under Module 124 (Genetics and Molecular Biology).' },
  
  // Ophthalmology
  { id: 12298, to: 339, reason: 'Tests metabolic ectopia lentis (downward and nasal subluxation of crystalline lens in homocystinuria), belonging to Ophthalmology under Module 339 (Lens - Introduction, Types of Cataract and Clinical Features).' },
  { id: 12299, to: 329, reason: 'Tests embryological cleft closure defects (typical inferonasal iris and uveal coloboma), belonging to Ophthalmology under Module 329 (Anatomy and Development of Eye).' },
  
  // Surgery & Salivary Glands
  { id: 12239, to: 522, reason: 'Tests epidemiology and pathology of the most common benign salivary gland tumor (Pleomorphic adenoma), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' },
  { id: 12265, to: 522, reason: 'Tests free fibular osteocutaneous microvascular flap based on peroneal artery for hemimandibulectomy reconstruction, belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' },
  { id: 12300, to: 522, reason: 'Tests etiology of acute suppurative parotitis (Staphylococcus aureus), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' },
  
  // Pediatrics
  { id: 12301, to: 605, reason: 'Tests maternal anti-Ro/SSA autoantibody transplacental passage causing congenital heart block in neonatal lupus, belonging to Pediatrics under Module 605 (Paediatric Rheumatology).' },
  { id: 12302, to: 604, reason: 'Tests incidence of posterior fossa neoplasms in children (pilocytic astrocytoma / medulloblastoma), belonging to Pediatrics under Module 604 (Solid Neoplasms of Childhood).' },
  { id: 12303, to: 597, reason: 'Tests diagnostic features and clinical presentation of congestive heart failure in infancy and childhood, belonging to Pediatrics under Module 597 (Acyanotic Congenital Heart Diseases).' },
  
  // Orthopaedics
  { id: 12304, to: 672, reason: 'Tests diagnostic synovial fluid aspiration and analysis for acute septic arthritis, belonging to Orthopaedics under Module 672 (Infections of the Bone and Joints).' },
  
  // OB & G
  { id: 12283, to: 531, reason: 'Tests anatomical location of Bartholin glands in the posterolateral aspect of the vaginal introitus, belonging to OB & G under Module 531 (Anatomy of Female Reproductive System).' },
  { id: 12305, to: 546, reason: 'Tests transvaginal ultrasonography and serum beta-hCG criteria for diagnosing unruptured ectopic pregnancy, belonging to OB & G under Module 546 (Ectopic Pregnancy).' },
  
  // Anaesthesia
  { id: 12306, to: 613, reason: 'Tests anatomical predictors and bedside assessments of a difficult airway (Mallampati, thyromental distance), belonging to Anaesthesia under Module 613 (Airway Devices).' },
  { id: 12307, to: 620, reason: 'Tests composition and gas cylinder pressure of Entonox (50% O2 and 50% N2O premix), belonging to Anaesthesia under Module 620 (Inhaled Anaesthetics - Properties, N2O and Halothane).' },
  { id: 12308, to: 620, reason: 'Tests physical properties and pseudocritical temperature of nitrous oxide (36.5 C), belonging to Anaesthesia under Module 620 (Inhaled Anaesthetics - Properties, N2O and Halothane).' },
  { id: 12309, to: 619, reason: 'Tests neuromuscular blocking agents undergoing organ-independent Hofmann elimination (Atracurium/Cisatracurium), belonging to Anaesthesia under Module 619 (Depolarising Muscle Relaxants / Neuromuscular Blockers).' },

  // Intra-ENT in 328:
  { id: 12250, to: 310, reason: 'Tests anatomical arrangement and pneumatization of anterior vs posterior ethmoid air cells, belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 12253, to: 325, reason: 'Tests adjuvant medical therapy (intralesional cidofovir) for Recurrent Respiratory Papillomatosis (RRP), belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' },
  { id: 12258, to: 319, reason: 'Tests boundaries and contents of the prevertebral space in deep cervical fascial anatomy, belonging to Module 319 (Anatomy and Physiology of Pharynx).' },
  { id: 12260, to: 321, reason: 'Tests tonsillectomy instrumentation (Eve\'s tonsillar snare / Negus knot tier), belonging to Module 321 (Tonsils).' },
  { id: 12262, to: 491, reason: 'Tests ultrasound differentiation of benign vs malignant thyroid nodules, belonging to General Surgery under Module 491 (Benign Lesions of Thyroid).' },
  { id: 12263, to: 136, reason: 'Tests oncogenic mechanisms of high-risk HPV types 16 and 18 via E6/p53 and E7/Rb inhibition, belonging to Pathology under Module 136 (Neoplasia).' },
  { id: 12270, to: 325, reason: 'Tests initial radiological evaluation (inspiratory/expiratory chest X-ray) for suspected tracheobronchial foreign body aspiration in children, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' },
  { id: 12278, to: 297, reason: 'Tests histology of cochlear canal membranes (Reissner\'s membrane separating scala vestibuli from scala media), belonging to Module 297 (Anatomy of Inner Ear).' },

  // Intra-ENT in 327:
  { id: 12043, to: 324, reason: 'Tests histology of laryngeal cartilages (elastic cartilage of epiglottis does not calcify), belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12044, to: 319, reason: 'Tests clinical significance of laryngeal crepitus on side-to-side movement of larynx against cervical spine, belonging to Module 319 (Anatomy and Physiology of Pharynx).' },
  { id: 12139, to: 326, reason: 'Tests bilateral recurrent laryngeal nerve injury symptoms following thyroidectomy (stridor, paramedian vocal cords), belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12167, to: 319, reason: 'Tests structures passing through the gap between superior and middle pharyngeal constrictors (stylopharyngeus muscle, glossopharyngeal nerve), belonging to Module 319 (Anatomy and Physiology of Pharynx).' },
  { id: 12184, to: 324, reason: 'Tests prelaryngeal lymphatic drainage and anatomical location of Delphian nodes on the cricothyroid membrane, belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12189, to: 324, reason: 'Tests anatomical boundaries and clinical significance of the paraglottic space of Tucker, belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12195, to: 324, reason: 'Tests histology and calcification susceptibility of laryngeal cartilages (epiglottis, corniculate, cuneiform are fibroelastic), belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12197, to: 319, reason: 'Tests Moure\'s sign (absence of laryngeal crepitus indicative of postcricoid hypopharyngeal malignancy), belonging to Module 319 (Anatomy and Physiology of Pharynx).' },
  { id: 12209, to: 326, reason: 'Tests laryngeal pseudosulcus (subglottic edema seen in laryngopharyngeal reflux disease), belonging to Module 326 (Voice and Speech Disorders).' },

  // Remaining in 313:
  { id: 11627, to: 297, reason: 'Tests cochlear histology (Reissner\'s membrane separating scala vestibuli and scala media), belonging to Module 297 (Anatomy of Inner Ear).' },
  { id: 11629, to: 297, reason: 'Tests physiology of peripheral vestibular sensory end organs (semicircular canals for angular acceleration, utricle/saccule for linear acceleration), belonging to Module 297 (Anatomy of Inner Ear).' },
  { id: 11632, to: 310, reason: 'Tests developmental timeline and radiological appearance of paranasal sinuses at birth, belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 11637, to: 325, reason: 'Tests local adjuvant pharmacotherapy (cidofovir) for juvenile-onset recurrent respiratory papillomatosis, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' },
  { id: 11640, to: 522, reason: 'Tests premalignant lesions of the oral tongue (leukoplakia, erythroplakia), belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' },
  { id: 11643, to: 328, reason: 'Tests optical and physical principles of using head mirror and Bull\'s eye lamp in ENT diagnostic examination, belonging to Module 328 (Mixed / Miscellaneous Topics - ENT Examination & Instruments).' },
  { id: 11647, to: 300, reason: 'Tests Crowe-Beck test for lateral sinus thrombosis complicating chronic otitis media, belonging to Module 300 (CSOM - Treatment and Complications).' },
  { id: 11648, to: 307, reason: 'Tests pharmacological ototoxicity affecting inner ear hair cells and hearing physiology, belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).' },
  { id: 11653, to: 325, reason: 'Tests clinical features and management of foreign body aspiration in the tracheobronchial air passage in pediatric patients, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' },
  { id: 11663, to: 328, reason: 'Tests focal length requirements of objective lenses in operating microscopes used for otologic microsurgery, belonging to Module 328 (Mixed / Miscellaneous Topics).' },
  { id: 11671, to: 317, reason: 'Tests clinical behavior and staging characteristics of sinonasal malignancies, belonging to Module 317 (Tumors of Nose and PNS).' },
  { id: 11672, to: 311, reason: 'Tests olfactory neuroepithelium and odor receptor distribution in the upper nasal cavity, belonging to Module 311 (Physiology of Nose and Paranasal Sinuses).' },
  { id: 11673, to: 309, reason: 'Tests structural osteocartilaginous framework and anatomy of the external nose, belonging to Module 309 (Anatomy of Nose).' },
  { id: 11707, to: 328, reason: 'Tests clinical indications for Auditory Brainstem Implantation (ABI) in bilateral retrocochlear or cochlear nerve absence, belonging to Module 328 (Mixed / Miscellaneous Topics - Auditory Implants).' },
  { id: 11708, to: 311, reason: 'Tests Kallmann syndrome (anosmia/hyposmia due to olfactory bulb hypoplasia with hypogonadotropic hypogonadism), belonging to Module 311 (Physiology of Nose and Paranasal Sinuses).' },
  { id: 11726, to: 304, reason: 'Tests surgical anatomy of the internal auditory meatus (Bill\'s bar separating facial nerve anterosuperiorly from superior vestibular nerve), belonging to Module 304 (Anatomy of Facial Nerve).' },
  { id: 11729, to: 305, reason: 'Tests aberrant autonomic reinnervation presenting as gustatory lacrimation (crocodile tears / Bogorad syndrome), belonging to Module 305 (Facial Nerve Disorders).' },
  { id: 11742, to: 309, reason: 'Tests anatomical landmarks of diagnostic nasal endoscopy (first pass along floor of nose and inferior meatus), belonging to Module 309 (Anatomy of Nose).' },
  { id: 11778, to: 654, reason: 'Tests clinical presentation of Basal Cell Carcinoma (rodent ulcer with rolled-out pearly borders), belonging to Dermatology under Module 654 (Skin Malignancies).' },
  { id: 11779, to: 316, reason: 'Tests nasal septal fractures (Chevallet\'s vertical fracture), belonging to Module 316 (Trauma of Nose and Face).' },
  { id: 11780, to: 309, reason: 'Tests anterior ethmoidal nerve neuralgia (Charlin\'s syndrome / Sluder\'s neuralgia), belonging to Module 309 (Anatomy of Nose).' },
  { id: 11797, to: 309, reason: 'Tests lymphatic drainage pathways of the lateral nasal wall and septum, belonging to Module 309 (Anatomy of Nose).' },
  { id: 11808, to: 645, reason: 'Tests facies leprosa and nasal mucosal/septal deformities in lepromatous leprosy, belonging to Dermatology under Module 645 (Mycobacterial Infections).' },
  { id: 11815, to: 316, reason: 'Tests diagnostic biomarkers for CSF leak (Beta-2 transferrin) following skull base trauma, belonging to Module 316 (Trauma of Nose and Face).' },
  { id: 11816, to: 309, reason: 'Tests nasal surface anatomy (rhinion at the osseocartilaginous junction of the nasal dorsum), belonging to Module 309 (Anatomy of Nose).' },
  { id: 11832, to: 328, reason: 'Tests identification and surgical application of Luc\'s forceps / Blakesley forceps, belonging to Module 328 (Mixed / Miscellaneous Topics - ENT Instruments).' },
  { id: 11863, to: 296, reason: 'Tests radiographic projections of the mastoid bone (Schuller\'s and Law\'s views), belonging to Module 296 (Anatomy of Mastoid).' },
  { id: 11864, to: 310, reason: 'Tests developmental pneumatization of paranasal sinuses continuing into adulthood (sphenoid sinus), belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 11872, to: 322, reason: 'Tests investigation of choice (contrast-enhanced CT / angiography) for juvenile nasopharyngeal angiofibroma presenting as a bleeding nasal mass in an adolescent male, belonging to Module 322 (Nasopharyngeal Angiofibroma).' },
  { id: 11881, to: 310, reason: 'Tests ostial drainage of posterior ethmoidal air cells into the superior meatus, belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 11884, to: 310, reason: 'Tests radiographic evaluation of the frontal sinuses using Caldwell projection (occipitofrontal view), belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 11888, to: 310, reason: 'Tests radiographic visibility of paranasal sinuses on occipitometal (Water\'s) projection, belonging to Module 310 (Anatomy of Paranasal Sinuses).' },
  { id: 11903, to: 317, reason: 'Tests Ohngren\'s line separating anteroinferior infrastructure from posterosuperior suprastructure in maxillary sinus malignancies, belonging to Module 317 (Tumors of Nose and PNS).' },
  { id: 11904, to: 317, reason: 'Tests occupational sinonasal adenocarcinoma among woodworkers and hardwood dust exposed individuals, belonging to Module 317 (Tumors of Nose and PNS).' },
  { id: 11911, to: 318, reason: 'Tests orbital cellulitis occurring most commonly as a complication of acute ethmoid sinusitis, belonging to Module 318 (Sinusitis and its Complication).' },
  { id: 11920, to: 318, reason: 'Tests frontal sinusitis presenting with characteristic morning exacerbation ("office headache"), belonging to Module 318 (Sinusitis and its Complication).' },
  { id: 12045, to: 319, reason: 'Tests Moure\'s sign (loss of normal laryngeal crepitus in postcricoid hypopharyngeal malignancy), belonging to Module 319 (Anatomy and Physiology of Pharynx).' },
  { id: 12093, to: 327, reason: 'Tests natural history and lymphatic drainage patterns of supraglottic laryngeal carcinoma, belonging to Module 327 (Laryngeal Carcinoma).' },
  { id: 12099, to: 326, reason: 'Tests Kashima\'s operation (posterior cordectomy) for bilateral abductor vocal fold paralysis, belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12100, to: 325, reason: 'Tests Montgomery T-tube stent used in the management of subglottic and tracheal stenosis, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).' },
  { id: 12101, to: 326, reason: 'Tests laryngeal signs and manifestations of laryngopharyngeal reflux (LPR), belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12107, to: 324, reason: 'Tests functional anatomy of laryngeal adductors (posterior triangular chink due to interarytenoid muscle weakness), belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12132, to: 522, reason: 'Tests ankyloglossia (tongue-tie due to short lingual frenulum) and frenotomy, belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands).' },
  { id: 12133, to: 326, reason: 'Tests phonatory mechanism of dysphonia plica ventricularis (ventricular band phonation), belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12135, to: 327, reason: 'Tests earliest presenting symptom of glottic laryngeal carcinoma (persistent hoarseness of voice), belonging to Module 327 (Laryngeal Carcinoma).' },
  { id: 12140, to: 327, reason: 'Tests tracheoesophageal puncture voice prosthesis (Blom-Singer valve) for post-laryngectomy voice rehabilitation, belonging to Module 327 (Laryngeal Carcinoma).' },
  { id: 12141, to: 327, reason: 'Tests methods of vocal rehabilitation following total laryngectomy (TEP, esophageal speech, electrolarynx), belonging to Module 327 (Laryngeal Carcinoma).' },
  { id: 12157, to: 326, reason: 'Tests gold standard diagnostic test (24-hour ambulatory double-probe pH monitoring) for laryngopharyngeal reflux, belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12159, to: 324, reason: 'Tests injury to the external branch of the superior laryngeal nerve (supplying cricothyroid muscle) causing loss of high-pitch vocal register, belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12171, to: 326, reason: 'Tests Kashima\'s laser posterior cordectomy for relieving airway obstruction in bilateral abductor vocal fold paralysis, belonging to Module 326 (Voice and Speech Disorders).' },
  { id: 12172, to: 324, reason: 'Tests indirect laryngoscopy visualization of laryngeal structures and blind areas, belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12173, to: 324, reason: 'Tests indirect laryngoscopy blind zones (anterior commissure, subglottis, ventricles), belonging to Module 324 (Anatomy and Physiology of Larynx).' },
  { id: 12201, to: 327, reason: 'Tests oncologic contraindications for conservative partial laryngectomy in laryngeal cancer, belonging to Module 327 (Laryngeal Carcinoma).' },
  { id: 12232, to: 326, reason: 'Tests etiology, presentation, and airway management in bilateral abductor vocal cord paralysis, belonging to Module 326 (Voice and Speech Disorders).' }
];

explicitMappings.forEach(m => {
  const q = qs.find(x => x.id === m.id);
  if (q && q.module_id !== m.to) {
    movesMap.set(m.id, {
      id: m.id,
      fromModule: q.module_id,
      toModule: m.to,
      reason: m.reason
    });
  }
});

// Convert map to array and sort by id
const finalMoves = Array.from(movesMap.values()).sort((a,b) => a.id - b.id);

console.log(`Total final moves: ${finalMoves.length}`);

const auditResult = {
  subject: 'ENT',
  totalQuestions: qs.length,
  flaggedCount: finalMoves.length,
  moves: finalMoves
};

fs.writeFileSync('tools/audit_deep_ent.json', JSON.stringify(auditResult, null, 2));
console.log('Saved final audit to tools/audit_deep_ent.json');
process.exit(0);
