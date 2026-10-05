const fs = require('fs');

const unhText = fs.readFileSync('tools/unhandled_questions.txt', 'utf8');
const qs = JSON.parse(fs.readFileSync('tools/ent_live_questions.json', 'utf8'));
const qMap = {};
qs.forEach(q => qMap[q.id] = q);

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

console.log('Writing script to inspect and catch ALL remaining misplaced questions...');

// Let's create an explicit array of additional moves by ID with exact educational rationale
const additionalMoves = [];

function addMove(id, toModule, reason) {
  const q = qMap[id];
  if (!q) return;
  if (q.module_id === toModule) return;
  additionalMoves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule,
    reason
  });
}

// Module 293 (Embryology of Ear) remaining:
addMove(11107, 294, 'Tests Arnold\'s nerve (auricular branch of vagus CN X) supplying the posterior meatal wall of EAC, which mediates the cough/syncope reflex during ear syringing, belonging to Module 294 (Anatomy of External Ear).');
addMove(11113, 310, 'Tests skull bone articulations of the maxilla with adjacent facial and paranasal bones, belonging to Module 310 (Anatomy of Paranasal Sinuses).');
addMove(11316, 300, 'Tests complications of suppurative ear infection presenting with trismus and muscle spasms (otogenic tetanus / mastoiditis complication), belonging to Module 300 (CSOM - Treatment and Complications).');
addMove(11784, 315, 'Tests Samter\'s triad / Aspirin-Exacerbated Respiratory Disease (nasal polyps, asthma, aspirin sensitivity), belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).');
addMove(11841, 316, 'Tests investigation of choice (HRCT temporal bone) for suspected temporal bone fracture following head injury with bleeding from the ear, belonging to Module 316 (Trauma of Nose and Face).');
addMove(12017, 522, 'Tests metastatic neck node with unknown primary origin in head and neck oncology, belonging to General Surgery under Module 522 (Oral Cavity & Salivary glands / Head and Neck Surgery).');
addMove(12168, 491, 'Tests symptoms produced by compressive goiter and benign thyroid enlargement on adjacent cervical structures, belonging to General Surgery under Module 491 (Benign Lesions of Thyroid).');
addMove(12273, 328, 'General examination preparation question not specific to ear embryology, belonging to Module 328 (Mixed / Miscellaneous Topics).');
addMove(12280, 325, 'Tests acute foreign body airway aspiration and choking management in a 3-year-old child, belonging to Module 325 (Stridor and Congenital Conditions of Larynx).');

// Module 300 (CSOM Treatment) remaining:
addMove(11514, 307, 'Tests pharmacologic management and treatment protocols for sudden sensorineural hearing loss (SSNHL), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).');
addMove(11774, 315, 'Tests emergency management of traumatic septal hematoma presenting with bilateral nasal obstruction after facial trauma, belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).');
addMove(11838, 315, 'Tests radiological diagnosis and surgical excision of Antrochoanal polyp (Killian\'s polyp), belonging to Module 315 (Disorder of Nasal Septum and Nasal Polyposis).');

// Module 301 (Otosclerosis) remaining:
addMove(11184, 296, 'Tests surgical incisions used for mastoid and middle ear access (Lempert / Endaural incision), belonging to Module 296 (Anatomy of Mastoid).');
addMove(11243, 307, 'Tests acoustic transmission loss and auditory physiology comparing degrees of hearing loss from ossicular discontinuity vs tympanic membrane defects, belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).');
addMove(11311, 300, 'Tests reservoir sign and mastoid tenderness indicative of acute coalescent mastoiditis (a complication of otitis media), belonging to Module 300 (CSOM - Treatment and Complications).');
addMove(11374, 306, 'Tests myringotomy and grommet ventilation tube placement for otitis media with effusion, belonging to Module 306 (Eustachian Tube).');
addMove(11395, 308, 'Tests acoustic/stapedial reflex arc pathway and diagnostic thresholds, belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).');
addMove(11409, 302, 'Tests Hennebert\'s sign (false-positive fistula test) seen in Meniere\'s disease and congenital syphilis, belonging to Module 302 (Meniere\'s Disease).');
addMove(11455, 307, 'Tests common etiology of sensorineural hearing loss (Presbycusis - age-related high frequency cochlear hair cell loss), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).');
addMove(11854, 316, 'Tests tympanic membrane rupture and barotrauma classification from blast injury, belonging to Module 316 (Trauma of Nose and Face).');

// Module 302 (Meniere's Disease) remaining:
addMove(11389, 308, 'Tests loudness recruitment phenomenon (abnormal rapid growth of loudness) characteristic of cochlear hearing loss, belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).');
addMove(11391, 308, 'Tests indications and utility of high-frequency audiometry (ototoxicity monitoring, acoustic trauma), belonging to Module 308 (Audiometric Tests and Special Tests of Hearing).');
addMove(11393, 301, 'Tests Paracusis Willisii (ability to hear better in noisy surroundings) and surgical candidacy in otosclerosis, belonging to Module 301 (Otosclerosis).');
addMove(11397, 307, 'Tests Presbycusis (sensorineural hearing loss of aging affecting high frequencies and speech understanding in noise), belonging to Module 307 (Physiology of Hearing and Tuning Fork Tests).');

// Module 303 (Tumors of Ear) remaining:
addMove(11441, 302, 'Tests evaluation of acute vertigo and horizontal spontaneous nystagmus (vestibular neuritis / acute peripheral vestibulopathy), belonging to Module 302 (Meniere\'s Disease and Peripheral Vestibular Disorders).');
addMove(11464, 302, 'Tests canalith repositioning maneuver (Epley / Dix-Hallpike maneuver) for Benign Paroxysmal Positional Vertigo, belonging to Module 302 (Meniere\'s Disease and Peripheral Vestibular Disorders).');

console.log(`Identified ${additionalMoves.length} explicit additional verified moves.`);

fs.writeFileSync('tools/additional_verified_moves.json', JSON.stringify(additionalMoves, null, 2));
process.exit(0);
