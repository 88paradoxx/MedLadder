const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

// Build indexed lookups
const moduleById = new Map();
allModules.forEach(m => moduleById.set(m.moduleId, m));

function auditSubject(subjectName, rawFile, subjectStart, subjectEnd) {
  const qs = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  const moves = [];

  for (const q of qs) {
    const text = (q.question_text || '').toLowerCase();
    const exp = (q.explanation || '').toLowerCase();
    const combined = text + ' ' + exp;
    let target = null;
    let reason = '';

    // Specialized medical ontology rules per subject
    if (subjectName === 'ENT') {
      // Cross-subject checks
      if (combined.includes('retinoblastoma') || combined.includes('cataract') || combined.includes('glaucoma') || combined.includes('visual acuity')) {
        target = 336; // Ophthalmology
        reason = 'Ophthalmology condition found in ENT';
      } else if (combined.includes('pneumonia') && combined.includes('curb') || combined.includes('myocardial infarction') || combined.includes('diabetic ketoacidosis')) {
        target = 439; // Medicine
        reason = 'Internal Medicine condition found in ENT';
      } else if (combined.includes('appendicitis') || combined.includes('cholecystitis') || combined.includes('inguinal hernia')) {
        target = 502; // Surgery
        reason = 'General surgery condition found in ENT';
      } else if (q.module_id >= 293 && q.module_id <= 308) {
        // Ear modules: check if larynx/pharynx/nose crept in
        if (text.includes('vocal cord') || text.includes('larynx') || text.includes('laryngeal') || text.includes('stridor')) {
          target = 320; // Larynx
          reason = 'Laryngeal pathology misplaced in Ear section';
        } else if (text.includes('epistaxis') || text.includes('nasal septum') || text.includes('rhinosporidiosis') || text.includes('paranasal sinus')) {
          target = 314; // Nose
          reason = 'Rhinology pathology misplaced in Ear section';
        } else if (text.includes('tonsil') || text.includes('adenoid') || text.includes('pharyngitis') || text.includes('quinsy')) {
          target = 318; // Pharynx
          reason = 'Pharynx pathology misplaced in Ear section';
        }
      } else if (q.module_id >= 309 && q.module_id <= 317) {
        // Nose modules: check if ear or larynx crept in
        if (text.includes('tympanic membrane') || text.includes('cholesteatoma') || text.includes('otosclerosis') || text.includes('mastoid')) {
          target = 301; // Ear
          reason = 'Otology condition misplaced in Nose section';
        } else if (text.includes('vocal cord') || text.includes('laryngeal') || text.includes('glottis')) {
          target = 320; // Larynx
          reason = 'Laryngeal pathology misplaced in Nose section';
        }
      } else if (q.module_id >= 318 && q.module_id <= 328) {
        // Throat/Larynx: check if ear or nose crept in
        if (text.includes('tympanic membrane') || text.includes('cholesteatoma') || text.includes('otosclerosis') || text.includes('meniere')) {
          target = 301; // Ear
          reason = 'Otology condition misplaced in Throat/Larynx section';
        }
      }
    } else if (subjectName === 'Ophthalmology') {
      if (combined.includes('tympanic') || combined.includes('mastoidectomy') || combined.includes('stapedectomy')) {
        target = 301; // ENT
        reason = 'ENT otology condition in Ophthalmology';
      } else if (combined.includes('asthma') || combined.includes('copd') || combined.includes('tuberculosis lung')) {
        target = 438; // Medicine
        reason = 'Pulmonology condition in Ophthalmology';
      } else if (q.module_id === 329 || q.module_id === 354) {
        // General or Misc Ophthalmology: assign to exact anatomy
        if (text.includes('cataract') || text.includes('lens')) {
          target = 338; // Lens
          reason = 'Cataract / Lens condition mapped from general module';
        } else if (text.includes('glaucoma') || text.includes('intraocular pressure') || text.includes('trabecular')) {
          target = 339; // Glaucoma
          reason = 'Glaucoma condition mapped from general module';
        } else if (text.includes('retina') || text.includes('macula') || text.includes('retinopathy')) {
          target = 343; // Retina
          reason = 'Retinal condition mapped from general module';
        } else if (text.includes('cornea') || text.includes('keratitis') || text.includes('keratoconus')) {
          target = 335; // Cornea
          reason = 'Cornea condition mapped from general module';
        } else if (text.includes('strabismus') || text.includes('squint') || text.includes('diplopia')) {
          target = 349; // Squint & Amblyopia
          reason = 'Strabismus / Squint mapped from general module';
        } else if (text.includes('optic nerve') || text.includes('papilledema')) {
          target = 347; // Neuro-ophthalmology
          reason = 'Neuro-ophthalmology condition mapped from general module';
        }
      }
    } else if (subjectName === 'Dermatology') {
      if (combined.includes('schizophrenia') || combined.includes('bipolar') || combined.includes('major depression')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry disorder in Dermatology';
      } else if (combined.includes('fracture') && combined.includes('bone') && !text.includes('skin')) {
        target = 658; // Orthopaedics
        reason = 'Orthopaedics bone fracture in Dermatology';
      } else if (q.module_id === 633 || q.module_id === 656) {
        // General / Misc derm
        if (text.includes('psoriasis')) {
          target = 636; // Psoriasis
          reason = 'Psoriasis question mapped to dedicated module';
        } else if (text.includes('leprosy') || text.includes('mycobacterium leprae')) {
          target = 642; // Leprosy
          reason = 'Leprosy question mapped to dedicated module';
        } else if (text.includes('acne') || text.includes('comedone')) {
          target = 639; // Acne & Rosacea
          reason = 'Acne question mapped to dedicated module';
        } else if (text.includes('pemphigus') || text.includes('bullous pemphigoid')) {
          target = 637; // Bullous Pemphigoid & Pemphigus
          reason = 'Vesiculobullous disease mapped to dedicated module';
        } else if (text.includes('alopecia') || text.includes('hair loss')) {
          target = 649; // Hair disorders
          reason = 'Hair pathology mapped to dedicated module';
        } else if (text.includes('melanoma') || text.includes('basal cell carcinoma')) {
          target = 654; // Skin tumors
          reason = 'Skin malignancy mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Psychiatry') {
      if (combined.includes('cardiac arrest') || combined.includes('myocardial infarction') || combined.includes('ecg st elevation')) {
        target = 459; // Medicine
        reason = 'Cardiology emergency in Psychiatry';
      } else if (combined.includes('strabismus') || combined.includes('glaucoma')) {
        target = 339; // Ophthalmology
        reason = 'Ophthalmology condition in Psychiatry';
      } else if (q.module_id === 687 || q.module_id === 719) {
        if (text.includes('schizophrenia') || text.includes('hallucination') && text.includes('delusion')) {
          target = 692; // Schizophrenia
          reason = 'Schizophrenia mapped to dedicated module';
        } else if (text.includes('depression') || text.includes('antidepressant') || text.includes('suicide')) {
          target = 697; // Depressive Disorders
          reason = 'Depression mapped to dedicated module';
        } else if (text.includes('bipolar') || text.includes('mania') || text.includes('lithium')) {
          target = 698; // Bipolar Disorders
          reason = 'Bipolar disorder mapped to dedicated module';
        } else if (text.includes('alcohol') && (text.includes('dependence') || text.includes('withdrawal') || text.includes('delirium tremens'))) {
          target = 699; // Alcohol-Related Disorders
          reason = 'Alcohol disorder mapped to dedicated module';
        } else if (text.includes('obsessive') || text.includes('compulsion') || text.includes('ocd')) {
          target = 702; // OCD
          reason = 'OCD mapped to dedicated module';
        } else if (text.includes('autism') || text.includes('asperger')) {
          target = 715; // ASD
          reason = 'Autism mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Anaesthesia') {
      if (combined.includes('schizophrenia') || combined.includes('depression') || combined.includes('psychosis')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry disorder in Anaesthesia';
      } else if (q.module_id === 609 || q.module_id === 632) {
        if (text.includes('spinal anaesthesia') || text.includes('epidural') || text.includes('subarachnoid block')) {
          target = 625; // Spinal & Epidural
          reason = 'Neuraxial block mapped to dedicated module';
        } else if (text.includes('cpr') || text.includes('defibrillation') || text.includes('cardiac arrest') || text.includes('bls') || text.includes('acls')) {
          target = 627; // Resuscitation
          reason = 'Resuscitation mapped to dedicated module';
        } else if (text.includes('vaporizer') || text.includes('anaesthesia machine') || text.includes('pin index') || text.includes('boyle')) {
          target = 612; // Anaesthetic Equipment
          reason = 'Equipment mapped to dedicated module';
        } else if (text.includes('airway') || text.includes('endotracheal') || text.includes('laryngeal mask') || text.includes('intubation')) {
          target = 618; // Airway Management
          reason = 'Airway mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Orthopaedics') {
      if (combined.includes('schizophrenia') || combined.includes('bipolar')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry in Ortho';
      } else if (q.module_id === 657 || q.module_id === 686) {
        if (text.includes('scoliosis') || text.includes('kyphosis') || text.includes('spondylolisthesis') || text.includes('disc herniation')) {
          target = 672; // Spine
          reason = 'Spine disorder mapped to dedicated module';
        } else if (text.includes('osteosarcoma') || text.includes('ewing') || text.includes('giant cell tumor') || text.includes('osteochondroma')) {
          target = 677; // Bone Tumors
          reason = 'Bone tumor mapped to dedicated module';
        } else if (text.includes('rickets') || text.includes('osteomalacia') || text.includes('osteoporosis') || text.includes('paget')) {
          target = 675; // Metabolic Bone Diseases
          reason = 'Metabolic bone disease mapped to dedicated module';
        } else if (text.includes('colles') || text.includes('scaphoid') || text.includes('radius fracture')) {
          target = 661; // Forearm and Wrist Injuries
          reason = 'Wrist fracture mapped to dedicated module';
        } else if (text.includes('femur') || text.includes('hip dislocation') || text.includes('neck of femur')) {
          target = 664; // Hip & Thigh Injuries
          reason = 'Hip / Femur injury mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Radiology') {
      if (combined.includes('schizophrenia') || combined.includes('delusion')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry in Radiology';
      } else if (q.module_id === 720 || q.module_id === 739) {
        if (text.includes('radiation protection') || text.includes('alara') || text.includes('sievert') || text.includes('dosimeter')) {
          target = 721; // Radiation Safety
          reason = 'Radiation safety mapped to dedicated module';
        } else if (text.includes('mri') || text.includes('t1') || text.includes('t2') || text.includes('flair') || text.includes('gadolinium')) {
          target = 724; // Magnetic Resonance Imaging
          reason = 'MRI physics/contrast mapped to dedicated module';
        } else if (text.includes('ultrasound') || text.includes('doppler') || text.includes('piezoelectric') || text.includes('acoustic')) {
          target = 723; // Ultrasound
          reason = 'Ultrasound physics mapped to dedicated module';
        } else if (text.includes('ct scan') || text.includes('hounsfield') || text.includes('computed tomography')) {
          target = 722; // CT
          reason = 'CT imaging mapped to dedicated module';
        }
      }
    } else if (subjectName === 'PSM') {
      if (combined.includes('schizophrenia') && !text.includes('prevalence') && !text.includes('program')) {
        target = 692; // Psychiatry
        reason = 'Pure clinical Psychiatry in PSM';
      } else if (q.module_id === 355 || q.module_id === 410) {
        if (text.includes('case control') || text.includes('cohort') || text.includes('odds ratio') || text.includes('relative risk') || text.includes('randomized controlled trial')) {
          target = 359; // Epidemiological Studies
          reason = 'Epidemiological study design mapped to dedicated module';
        } else if (text.includes('sensitivity') || text.includes('specificity') || text.includes('positive predictive value') || text.includes('screening test')) {
          target = 358; // Screening
          reason = 'Screening test metrics mapped to dedicated module';
        } else if (text.includes('vaccine') || text.includes('immunization') || text.includes('cold chain') || text.includes('national immunization schedule')) {
          target = 363; // Principles of Immunization
          reason = 'Vaccination & Cold Chain mapped to dedicated module';
        } else if (text.includes('biomedical waste') || text.includes('yellow bag') || text.includes('red bag') || text.includes('autoclave disposal')) {
          target = 394; // Hospital Waste Management
          reason = 'Biomedical waste management mapped to dedicated module';
        } else if (text.includes('mean') || text.includes('median') || text.includes('standard deviation') || text.includes('p value') || text.includes('chi square') || text.includes('t test')) {
          target = 405; // Biostatistics
          reason = 'Biostatistics mapped to dedicated module';
        }
      }
    }

    if (target && target !== q.module_id) {
      moves.push({
        id: q.id,
        fromModule: q.module_id,
        toModule: target,
        reason: reason
      });
    }
  }

  const result = {
    subject: subjectName,
    totalQuestions: qs.length,
    flaggedCount: moves.length,
    moves: moves
  };

  fs.writeFileSync('tools/audit_' + subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json', JSON.stringify(result, null, 2));
  console.log('✓ ' + subjectName.padEnd(16) + ': ' + qs.length + ' audited, ' + moves.length + ' flagged (' + (moves.length / qs.length * 100).toFixed(1) + '%)');
  return result;
}

console.log('=== RUNNING HIGH-SPEED COMPREHENSIVE AUDIT FOR BATCH 2 ===');
const entRes = auditSubject('ENT', 'tools/raw_ent.json', 293, 328);
const ophRes = auditSubject('Ophthalmology', 'tools/raw_ophthalmology.json', 329, 354);
const psmRes = auditSubject('PSM', 'tools/raw_psm.json', 355, 410);
const anaRes = auditSubject('Anaesthesia', 'tools/raw_anaesthesia.json', 609, 632);
const dermRes = auditSubject('Dermatology', 'tools/raw_dermatology.json', 633, 656);
const orthoRes = auditSubject('Orthopaedics', 'tools/raw_orthopaedics.json', 657, 686);
const psychRes = auditSubject('Psychiatry', 'tools/raw_psychiatry.json', 687, 719);
const radRes = auditSubject('Radiology', 'tools/raw_radiology.json', 720, 739);

const allAuditResults = [entRes, ophRes, psmRes, anaRes, dermRes, orthoRes, psychRes, radRes];
const totalBatch2Audited = allAuditResults.reduce((acc, r) => acc + r.totalQuestions, 0);
const totalBatch2Flagged = allAuditResults.reduce((acc, r) => acc + r.flaggedCount, 0);

console.log('\nBATCH 2 AUDIT COMPLETE: ' + totalBatch2Audited + ' audited, ' + totalBatch2Flagged + ' flagged (' + (totalBatch2Flagged / totalBatch2Audited * 100).toFixed(1) + '%)');
