const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));

function clean(t) {
  if (!t) return '';
  return t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log(`Analyzing ${questions.length} questions...`);

// Let's create keyword profiles for FMT modules and cross-subject modules
const moduleRules = [
  // Cross-subject checks
  {
    name: 'Microbiology Parasitology',
    targetMod: 196, // Nematodes / Helminthology
    match: (q, text) => {
      if (text.includes('rhaditiform larvae') || text.includes('rhabditiform') || text.includes('wucheria bancrofti') || text.includes('wuchereria bancrofti') || text.includes('trichuris trichura') || text.includes('flame cells are seen in')) {
        return 'Pure microbiology/parasitology question on helminths/larvae';
      }
      return null;
    }
  },
  {
    name: 'Microbiology / Ophthalmology Keratitis',
    targetMod: 337, // Corneal Ulcers / Keratitis
    match: (q, text) => {
      if (text.includes('protozoan causing keratitis')) {
        return 'Ophthalmology question on Acanthamoeba keratitis';
      }
      return null;
    }
  },
  {
    name: 'Microbiology Trichomonas / Motility',
    targetMod: 198, // Protozoa
    match: (q, text) => {
      if (text.includes('hanging drop method is used for') && text.includes('trichomonas')) {
        return 'Microbiology diagnostic motility technique for Trichomonas';
      }
      return null;
    }
  },
  {
    name: 'General Pathology / Hemodynamics',
    targetMod: 132, // Disorders of Hemodynamics and Hemostasis
    match: (q, text) => {
      if (text.includes('lines of zahn occur in')) {
        return 'General pathology question on thrombus formation (Lines of Zahn)';
      }
      return null;
    }
  },
  {
    name: 'General Pathology / Inflammation',
    targetMod: 129, // Acute Inflammation
    match: (q, text) => {
      if (text.includes('dohle bodies') || (text.includes('selectin') && text.includes('family of selectin'))) {
        return 'General pathology question on acute inflammation / leukocyte morphology';
      }
      return null;
    }
  },
  {
    name: 'General Pathology / Tissue Repair',
    targetMod: 131, // Tissue Repair
    match: (q, text) => {
      if (text.includes('cell-matrix adhesions are mediated by')) {
        return 'General pathology / cell biology question on extracellular matrix and integrins';
      }
      return null;
    }
  },
  {
    name: 'Pathology / Atherosclerosis / Biochemistry',
    targetMod: 175, // Vascular pathology / Atherosclerosis or Biochem
    match: (q, text) => {
      if (text.includes('oxidised ldl is more athreogenic') || text.includes('oxidised ldl')) {
        return 'Pathology/Biochemistry question on oxidized LDL in atherogenesis';
      }
      return null;
    }
  },
  {
    name: 'Pathology / Surgery Vascular Neoplasms',
    targetMod: 176, // Vascular tumors
    match: (q, text) => {
      if (text.includes('glomus tumor is seen in')) {
        return 'Surgical pathology question on glomus tumor of nail bed';
      }
      return null;
    }
  },
  {
    name: 'Pharmacology Respiratory',
    targetMod: 265, // Pharmacology Respiratory System
    match: (q, text) => {
      if (text.includes('efficacy of salmeterol is increased if it is given along with')) {
        return 'Pharmacology question on beta-2 agonist and corticosteroid synergy in asthma';
      }
      return null;
    }
  },
  {
    name: 'Pharmacology Prostaglandins / Autacoids',
    targetMod: 260, // NSAIDs / Autacoids
    match: (q, text) => {
      if (text.includes('pge2 cause all except') || text.includes('pge2 causes all except')) {
        return 'Pharmacology / Physiology question on PGE2 systemic actions';
      }
      return null;
    }
  },
  {
    name: 'Pharmacology / Urology Erectile Dysfunction',
    targetMod: 258, // Androgens and Drugs for Erectile Dysfunction
    match: (q, text) => {
      if (text.includes('drugs act directly without sexual stimulation') && text.includes('alprostadil')) {
        return 'Pharmacology question on erectogenic drugs (alprostadil/PGE1)';
      }
      return null;
    }
  },
  {
    name: 'Pharmacology / OBG Uterotonic Drugs',
    targetMod: 259, // Drugs Acting on Uterus
    match: (q, text) => {
      if (text.includes('dinoprost is') && text.includes('pg f2 alpha')) {
        return 'Pharmacology / OBG question on uterine prostaglandins (Dinoprost/PGF2alpha)';
      }
      return null;
    }
  },
  {
    name: 'PSM Levels of Prevention',
    targetMod: 354, // Concept of Health and Disease / Epidemiological Principles
    match: (q, text) => {
      if (text.includes('secondary prevention is applicable to')) {
        return 'PSM / Community Medicine question on levels of disease prevention';
      }
      return null;
    }
  },
  {
    name: 'Medicine Nephrology',
    targetMod: 421, // Chronic Kidney Disease
    match: (q, text) => {
      if (text.includes('crf with anemia best treatment')) {
        return 'Internal Medicine question on management of anemia in chronic renal failure';
      }
      return null;
    }
  },
  {
    name: 'Orthopaedics / Rheumatology',
    targetMod: 546, // Osteoarthritis
    match: (q, text) => {
      if (text.includes('drug used in osteoarthritis')) {
        return 'Orthopaedics / Rheumatology question on pharmacotherapy of osteoarthritis';
      }
      return null;
    }
  },
  {
    name: 'OB & G Breech Delivery',
    targetMod: 488, // Malpresentations & Malpositions / Breech
    match: (q, text) => {
      if (text.includes('after- coming head of breech') || text.includes('after-coming head of breech')) {
        return 'Obstetrics question on delivery techniques for aftercoming head of breech';
      }
      return null;
    }
  },
  {
    name: 'OB & G Abnormal Uterine Bleeding / Contraception',
    targetMod: 470, // Contraception / AUB
    match: (q, text) => {
      if (text.includes('preferred iud for menorrhagea') || text.includes('preferred iud for menorrhagia') || text.includes('preferred treatment for menorrhagea in reproductive age group') || text.includes('drug not used commonly for menorrhagea')) {
        return 'Gynaecology question on management of menorrhagia / abnormal uterine bleeding';
      }
      return null;
    }
  },
  {
    name: 'Dermatology Benign Tumors',
    targetMod: 527, // Benign skin conditions / tumors
    match: (q, text) => {
      if (text.includes('not true about skin tag')) {
        return 'Dermatology question on skin tags (acrochordon)';
      }
      return null;
    }
  }
];

// Run preliminary check
const preliminaryResults = [];
questions.forEach(q => {
  const fullText = (clean(q.question_text) + ' ' + clean(q.option_a) + ' ' + clean(q.option_b) + ' ' + clean(q.option_c) + ' ' + clean(q.option_d) + ' ' + clean(q.explanation)).toLowerCase();
  for (const rule of moduleRules) {
    const reason = rule.match(q, fullText);
    if (reason) {
      preliminaryResults.push({
        id: q.id,
        fromModule: q.module_id,
        toModule: rule.targetMod,
        targetName: modMap[rule.targetMod] ? `${modMap[rule.targetMod].subjectName} > ${modMap[rule.targetMod].moduleName}` : 'Unknown',
        reason
      });
      break;
    }
  }
});

console.log(`Cross-subject detected: ${preliminaryResults.length}`);
console.log(preliminaryResults);

process.exit(0);
