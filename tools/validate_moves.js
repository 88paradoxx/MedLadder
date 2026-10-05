const fs = require('fs');

const moves = JSON.parse(fs.readFileSync('tools/verified_deep_moves.json', 'utf8'));
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

console.log(`Checking all ${moves.length} candidate moves for valid retention in fromModule...`);

const validatedMoves = [];
const rejectedMoves = [];

moves.forEach(m => {
  const q = qMap[m.id];
  const curMod = m.fromModule;
  const targetMod = m.toModule;
  const qText = clean(q.question_text);
  const expl = clean(q.explanation);
  const ans = clean(q.answer);
  const full = `${qText} ${expl}`.toLowerCase();

  let keepInFrom = false;
  let rejectReason = '';

  // Check if current module is actually the right home:

  // If in 321 (Tonsils) and question is about tonsillitis, tonsillectomy, quinsy, tonsillar nerve supply:
  if (curMod === 321 && (full.includes('tonsil') || full.includes('quinsy') || full.includes('peritonsillar'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about tonsils/tonsillitis/tonsillectomy/quinsy.';
  }

  // If in 322 (JNA) and question is about juvenile angiofibroma:
  if (curMod === 322 && (full.includes('angiofibroma') || full.includes('holman-miller'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Juvenile Nasopharyngeal Angiofibroma.';
  }

  // If in 323 (NPC) and question is about nasopharyngeal carcinoma or fossa of rosenmuller:
  if (curMod === 323 && (full.includes('nasopharyngeal carcinoma') || full.includes('fossa of rosenmuller') || full.includes('trotter\'s triad'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Nasopharyngeal Carcinoma.';
  }

  // If in 326 (Voice and Speech Disorders) and question is about puberphonia, voice, vocal nodule, polyp, palsy:
  if (curMod === 326 && (full.includes('puberphonia') || full.includes('reinke') || full.includes('vocal') || full.includes('thyroplasty') || full.includes('spasmodic dysphonia') || full.includes('aphonia'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Voice and Speech Disorders.';
  }

  // If in 319 (Pharynx Anatomy & Phys) and question is about pharynx boundaries, deglutition, oropharynx, hypopharynx, pyriform fossa:
  if (curMod === 319 && (full.includes('pharynx extends') || full.includes('part of oropharynx') || full.includes('part of laryngopharynx') || full.includes('deglutition') || full.includes('pharyngeal'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Anatomy and Physiology of Pharynx.';
  }

  // If in 314 (Rhinitis) and question is about rhinitis:
  if (curMod === 314 && (full.includes('allergic rhinitis') || full.includes('vasomotor') || full.includes('rhinitis medicamentosa'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Rhinitis.';
  }

  // If in 315 (Septum & Polyposis) and question is about DNS, SMR, septoplasty, antrochoanal/ethmoidal polyp:
  if (curMod === 315 && (full.includes('septum') || full.includes('polyp') || full.includes('dns') || full.includes('smr') || full.includes('septoplasty'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Nasal Septum or Polyposis.';
  }

  // If in 318 (Sinusitis) and question is about sinusitis, FESS, sinus complications, fungal sinusitis:
  if (curMod === 318 && (full.includes('sinusitis') || full.includes('fess') || full.includes('pott\'s puffy') || full.includes('sinus surgery') || (full.includes('mucormycosis') && full.includes('sinus')))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Sinusitis and its Complications.';
  }

  // If in 301 (Otosclerosis) and question is about otosclerosis, carhart, schwartz, paracusis:
  if (curMod === 301 && (full.includes('otosclero') || full.includes('carhart') || full.includes('schwartz') || full.includes('paracusis') || full.includes('stapedectomy'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Otosclerosis.';
  }

  // If in 302 (Meniere's) and question is about meniere, endolymphatic hydrops, bppv, vestibular:
  if (curMod === 302 && (full.includes('meniere') || full.includes('endolymphatic hydrops') || full.includes('bppv') || full.includes('hallpike') || full.includes('epley') || full.includes('lermoyez') || full.includes('caloric'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Meniere\'s Disease or Vestibular disorders.';
  }

  // If in 306 (Eustachian tube) and question is about eustachian tube, glue ear, OME:
  if (curMod === 306 && (full.includes('eustachian') || full.includes('glue ear') || full.includes('effusion') || full.includes('grommet') || full.includes('serous otitis'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Eustachian Tube / OME.';
  }

  // If in 307 (Hearing Phys & Tuning Fork) and question is about tuning forks, impedance matching, travelling wave:
  if (curMod === 307 && (full.includes('rinne') || full.includes('weber') || full.includes('schwabach') || full.includes('tuning fork') || full.includes('impedance matching') || full.includes('travelling wave'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Physiology of Hearing and Tuning Fork Tests.';
  }

  // If in 308 (Audiometric Tests) and question is about PTA, audiogram, tympanogram, BERA, OAE:
  if (curMod === 308 && (full.includes('audiometr') || full.includes('audiogram') || full.includes('tympanogram') || full.includes('stapedial reflex') || full.includes('bera') || full.includes('oae') || full.includes('tone decay') || full.includes('sisi'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Audiometric Tests and Special Tests of Hearing.';
  }

  // If in 324 (Larynx Anat & Phys) and question is about laryngeal muscles, cartilages, nerves:
  if (curMod === 324 && (full.includes('cricoarytenoid') || full.includes('cricoid') || full.includes('thyroid cartilage') || full.includes('vocal cord') && full.includes('adductor') || full.includes('intrinsic muscles of larynx') || full.includes('nerve supply of larynx'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Anatomy and Physiology of Larynx.';
  }

  // If in 325 (Stridor, Congenital Larynx, Tracheostomy) and question is about stridor, laryngomalacia, croup, epiglottitis, tracheostomy:
  if (curMod === 325 && (full.includes('stridor') || full.includes('laryngomalacia') || full.includes('epiglottitis') || full.includes('croup') || full.includes('steeple sign') || full.includes('tracheostomy') || full.includes('laryngocele'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Stridor, Congenital Conditions of Larynx, or Tracheostomy.';
  }

  // If in 327 (Laryngeal Carcinoma) and question is about laryngeal cancer, cordectomy, laryngectomy:
  if (curMod === 327 && (full.includes('carcinoma larynx') || full.includes('laryngeal carcinoma') || full.includes('glottic cancer') || full.includes('cordectomy') || full.includes('laryngectomy') || full.includes('blom-singer'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Laryngeal Carcinoma.';
  }

  // If in 312 (Epistaxis) and question is specifically about epistaxis, packing, cautery, Little's area bleeding:
  if (curMod === 312 && (full.includes('epistaxis') || full.includes('nasal pack') || full.includes('trotter') || full.includes('sphenopalatine artery ligation') || full.includes('little\'s area') && full.includes('bleed'))) {
    // But exclude if it's explicitly JNA, Inverted papilloma, Rhinosporidiosis, Trauma
    if (!full.includes('angiofibroma') && !full.includes('inverted papilloma') && !full.includes('rhinosporidiosis') && !full.includes('blow-out') && !full.includes('fracture') && !full.includes('atrophic rhinitis')) {
      keepInFrom = true;
      rejectReason = 'Question is legitimately about Epistaxis management.';
    }
  }

  // If in 313 (Diseases of Nose) and question is about rhinoscleroma, rhinosporidiosis, atrophic rhinitis, choanal atresia, nasal dermoid:
  if (curMod === 313 && (full.includes('rhinoscleroma') || full.includes('rhinosporidiosis') || full.includes('atrophic rhinitis') || full.includes('ozaena') || full.includes('ozena') || full.includes('choanal atresia') || full.includes('nasal dermoid') || full.includes('encephalocele') || full.includes('foreign body in nose') || full.includes('rhinolith'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Congenital Anomalies or Specific Diseases of the Nose.';
  }

  // If in 294 (Anatomy of External Ear) and question is about auricle, pinna, EAC anatomy:
  if (curMod === 294 && (full.includes('fissures of santorini') || full.includes('greater auricular') || full.includes('arnold\'s nerve') || full.includes('concha') || full.includes('tragus') || full.includes('cartilaginous part of eac'))) {
    keepInFrom = true;
    rejectReason = 'Question is legitimately about Anatomy of External Ear.';
  }

  // If in 295 (Anatomy of Middle Ear) and question is about middle ear walls, ossicles, tympanic cavity, promontory, chorda tympani, stapedius:
  if (curMod === 295 && (full.includes('incus') || full.includes('malleus') || full.includes('stapes') || full.includes('incudomalleolar') || full.includes('incudostapedial') || full.includes('sinus tympani') || full.includes('ponticulus') || full.includes('stapedius') || full.includes('tensor tympani') || full.includes('pyramidal eminence') || full.includes('chorda tympani') || full.includes('promontory') || full.includes('tegmen tympani') || full.includes('tympanic membrane') && (full.includes('pars') || full.includes('layer') || full.includes('umbo') || full.includes('quadrant')))) {
    // Only if not CSOM, not trauma, not facial palsy, not tumor
    if (!full.includes('csom') && !full.includes('parotid') && !full.includes('fracture') && !full.includes('carcinoma') && !full.includes('glomus') && !full.includes('adenoma')) {
      keepInFrom = true;
      rejectReason = 'Question is legitimately about Anatomy of Middle Ear.';
    }
  }

  // If in 296 (Anatomy of Mastoid) and question is about mastoid antrum, MacEwen's triangle, mastoid surgery landmarks:
  if (curMod === 296 && (full.includes('macewen') || full.includes('suprameatal') || full.includes('mastoid antrum') || full.includes('sinodural angle') || full.includes('cortical mastoidectomy') && full.includes('photograph'))) {
    if (!full.includes('csom') && !full.includes('thrombosis') && !full.includes('fracture') && !full.includes('glomus')) {
      keepInFrom = true;
      rejectReason = 'Question is legitimately about Anatomy of Mastoid.';
    }
  }

  // If in 297 (Anatomy of Inner Ear) and question is about cochlea, semicircular canal, hair cells, organ of corti, cupula, macula:
  if (curMod === 297 && (full.includes('cochlea') || full.includes('ductus reuniens') || full.includes('cupula') || full.includes('macula') || full.includes('hair cells') || full.includes('scala media') || full.includes('scala vestibuli') || full.includes('organ of corti'))) {
    if (!full.includes('foreign body') && !full.includes('choking') && !full.includes('heimlich')) {
      keepInFrom = true;
      rejectReason = 'Question is legitimately about Anatomy of Inner Ear.';
    }
  }

  if (keepInFrom) {
    rejectedMoves.push({ ...m, rejectReason });
  } else {
    validatedMoves.push(m);
  }
});

console.log(`Validation complete:`);
console.log(`- Validated genuine moves: ${validatedMoves.length}`);
console.log(`- Filtered out false positives (kept in original module): ${rejectedMoves.length}`);

fs.writeFileSync('tools/validated_moves.json', JSON.stringify(validatedMoves, null, 2));
fs.writeFileSync('tools/rejected_moves.json', JSON.stringify(rejectedMoves, null, 2));
process.exit(0);
