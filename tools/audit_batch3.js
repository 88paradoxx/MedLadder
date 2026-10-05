const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const moduleById = new Map(allModules.map(m => [m.moduleId, m]));

function auditClinical(subjectName, rawFile, subjectStart, subjectEnd) {
  const qs = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  const moves = [];

  for (const q of qs) {
    const text = (q.question_text || '').toLowerCase();
    const exp = (q.explanation || '').toLowerCase();
    const combined = text + ' ' + exp;
    let target = null;
    let reason = '';

    if (subjectName === 'Medicine') {
      // Cross-subject checks
      if (combined.includes('schizophrenia') || combined.includes('bipolar disorder') || combined.includes('major depressive disorder') && !text.includes('medical mimic')) {
        target = 692; // Psychiatry
        reason = 'Primary Psychiatric illness in Internal Medicine';
      } else if (combined.includes('strabismus') || combined.includes('cataract surgery') || combined.includes('retinal detachment surgery')) {
        target = 338; // Ophthalmology
        reason = 'Primary Ophthalmology condition in Medicine';
      } else if (combined.includes('tympanic membrane perforation') || combined.includes('mastoiditis') || combined.includes('cholesteatoma')) {
        target = 301; // ENT
        reason = 'Primary Otology condition in Medicine';
      } else if (combined.includes('femur fracture') || combined.includes('colles fracture') || combined.includes('scaphoid fracture')) {
        target = 661; // Orthopaedics
        reason = 'Primary bone fracture in Medicine';
      } else if (q.module_id === 411 || q.module_id === 479) {
        // General medicine or misc
        if (text.includes('myocardial infarction') || text.includes('ecg') || text.includes('st elevation') || text.includes('troponin')) {
          target = 459; // IHD
          reason = 'Ischemic heart disease mapped to dedicated module';
        } else if (text.includes('asthma') || text.includes('copd') || text.includes('bronchitis')) {
          target = 438; // Asthma / COPD
          reason = 'Pulmonology obstructive disease mapped to dedicated module';
        } else if (text.includes('stroke') || text.includes('hemiplegia') || text.includes('cerebrovascular')) {
          target = 473; // Cerebrovascular Disease
          reason = 'Stroke mapped to dedicated module';
        } else if (text.includes('cirrhosis') || text.includes('ascites') || text.includes('portal hypertension')) {
          target = 428; // Cirrhosis
          reason = 'Cirrhosis mapped to dedicated module';
        } else if (text.includes('diabetes mellitus') || text.includes('diabetic ketoacidosis') || text.includes('hba1c')) {
          target = 417; // Diabetes Mellitus
          reason = 'Diabetes mapped to dedicated module';
        } else if (text.includes('acute kidney injury') || text.includes('chronic kidney disease') || text.includes('dialysis')) {
          target = 451; // CKD / AKI
          reason = 'Nephrology mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Surgery') {
      if (combined.includes('schizophrenia') || combined.includes('bipolar')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry in Surgery';
      } else if (combined.includes('cataract') || combined.includes('glaucoma')) {
        target = 338; // Ophthalmology
        reason = 'Ophthalmology in Surgery';
      } else if (q.module_id === 480 || q.module_id === 530) {
        if (text.includes('cholecystitis') || text.includes('gallstone') || text.includes('cholecystectomy')) {
          target = 508; // Gall Bladder
          reason = 'Gall bladder surgery mapped to dedicated module';
        } else if (text.includes('hernia') || text.includes('inguinal')) {
          target = 516; // Hernias
          reason = 'Hernia mapped to dedicated module';
        } else if (text.includes('appendicitis') || text.includes('appendix')) {
          target = 502; // Appendix
          reason = 'Appendicitis mapped to dedicated module';
        } else if (text.includes('breast cancer') || text.includes('mastectomy') || text.includes('fibroadenoma')) {
          target = 489; // Breast
          reason = 'Breast surgery mapped to dedicated module';
        } else if (text.includes('thyroidectomy') || text.includes('papillary thyroid') || text.includes('goiter')) {
          target = 486; // Thyroid
          reason = 'Thyroid surgery mapped to dedicated module';
        }
      }
    } else if (subjectName === 'OB & G') {
      if (combined.includes('schizophrenia') || combined.includes('bipolar')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry in OBGYN';
      } else if (combined.includes('strabismus') || combined.includes('glaucoma')) {
        target = 338; // Ophthalmology
        reason = 'Ophthalmology in OBGYN';
      } else if (q.module_id === 531 || q.module_id === 574) {
        if (text.includes('preeclampsia') || text.includes('eclampsia') || text.includes('gestational hypertension')) {
          target = 548; // Hypertensive Disorders of Pregnancy
          reason = 'Preeclampsia mapped to dedicated module';
        } else if (text.includes('ectopic pregnancy') || text.includes('tubal pregnancy')) {
          target = 544; // Ectopic Pregnancy
          reason = 'Ectopic pregnancy mapped to dedicated module';
        } else if (text.includes('postpartum hemorrhage') || text.includes('pph') || text.includes('uterine atony')) {
          target = 551; // PPH
          reason = 'PPH mapped to dedicated module';
        } else if (text.includes('cervical cancer') || text.includes('cin') || text.includes('pap smear')) {
          target = 569; // Carcinoma Cervix
          reason = 'Cervical cancer mapped to dedicated module';
        } else if (text.includes('endometriosis') || text.includes('adenomyosis')) {
          target = 562; // Endometriosis
          reason = 'Endometriosis mapped to dedicated module';
        } else if (text.includes('pcos') || text.includes('polycystic ovarian')) {
          target = 564; // PCOS
          reason = 'PCOS mapped to dedicated module';
        }
      }
    } else if (subjectName === 'Pediatrics') {
      if (combined.includes('schizophrenia') || combined.includes('bipolar')) {
        target = 692; // Psychiatry
        reason = 'Psychiatry in Pediatrics';
      } else if (q.module_id === 575 || q.module_id === 608) {
        if (text.includes('respiratory distress syndrome') || text.includes('hyaline membrane') || text.includes('surfactant')) {
          target = 594; // Neonatal Respiratory Disorders
          reason = 'Neonatal respiratory mapped to dedicated module';
        } else if (text.includes('tetralogy of fallot') || text.includes('transposition of great arteries') || text.includes('truncus')) {
          target = 598; // Cyanotic Congenital Heart Diseases
          reason = 'Cyanotic CHD mapped to dedicated module';
        } else if (text.includes('vsd') || text.includes('asd') || text.includes('patent ductus arteriosus') || text.includes('pda')) {
          target = 597; // Acyanotic Congenital Heart Diseases
          reason = 'Acyanotic CHD mapped to dedicated module';
        } else if (text.includes('nephrotic syndrome') || text.includes('minimal change') || text.includes('post streptococcal')) {
          target = 599; // Paediatric Nephrology
          reason = 'Pediatric nephrology mapped to dedicated module';
        } else if (text.includes('milestone') || text.includes('social smile') || text.includes('neck holding') || text.includes('pincer grasp')) {
          target = 578; // Developmental Milestones
          reason = 'Developmental milestones mapped to dedicated module';
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

console.log('=== RUNNING HIGH-SPEED COMPREHENSIVE AUDIT FOR BATCH 3 ===');
const medRes = auditClinical('Medicine', 'tools/raw_medicine.json', 411, 479);
const surRes = auditClinical('Surgery', 'tools/raw_surgery.json', 480, 530);
const obgRes = auditClinical('OB & G', 'tools/raw_ob___g.json', 531, 574);
const pedRes = auditClinical('Pediatrics', 'tools/raw_pediatrics.json', 575, 608);

const allBatch3Results = [medRes, surRes, obgRes, pedRes];
const totalBatch3Audited = allBatch3Results.reduce((acc, r) => acc + r.totalQuestions, 0);
const totalBatch3Flagged = allBatch3Results.reduce((acc, r) => acc + r.flaggedCount, 0);

console.log('\nBATCH 3 AUDIT COMPLETE: ' + totalBatch3Audited + ' audited, ' + totalBatch3Flagged + ' flagged (' + (totalBatch3Flagged / totalBatch3Audited * 100).toFixed(1) + '%)');
