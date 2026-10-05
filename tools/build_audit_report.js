const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));
const qMap = {};
questions.forEach(q => { qMap[q.id] = q; });

function clean(t) {
  if (!t) return '';
  return t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log(`Auditing ${questions.length} questions...`);

// Define moves array
const moves = [];

function addMove(id, targetMod, reason) {
  const q = qMap[id];
  if (!q) {
    console.error(`Question ${id} not found!`);
    return;
  }
  if (q.module_id === targetMod) {
    return; // Already in the right module
  }
  if (!modMap[targetMod]) {
    console.error(`Target module ${targetMod} does not exist in 740 modules!`);
    return;
  }
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: targetMod,
    reason: reason
  });
}

// ==========================================
// 1. NON-FORENSIC / CROSS-SUBJECT MOVES
// ==========================================
// Parasitology / Microbiology
addMove(9938, 217, 'Flame cells (solenocytes) are excretory structures of cestodes/trematodes, belonging to Microbiology (Helminthology - Cestodes & Trematodes).');
addMove(10571, 215, 'Hanging drop motility test for Trichomonas vaginalis belongs to Microbiology (Protozoa).');
addMove(10673, 218, 'Unsegmented barrel-shaped eggs with bipolar plugs of Trichuris trichiura belong to Microbiology (Helminthology - Nematodes).');
addMove(10935, 218, 'Rhabditiform larvae identification (Strongyloides) belongs to Microbiology (Helminthology - Nematodes).');
addMove(10936, 218, 'Wuchereria bancrofti life cycle and microfilarial morphology belong to Microbiology (Helminthology - Nematodes).');

// Ophthalmology
addMove(10938, 335, 'Acanthamoeba causing protozoan contact lens keratitis belongs to Ophthalmology (Basics of Cornea and Infectious Keratitis).');

// General Pathology
addMove(10915, 175, 'Atherogenicity of oxidized LDL in endothelial injury belongs to Pathology (Vascular Pathology / Atherosclerosis).');
addMove(10916, 132, 'Lines of Zahn in arterial thrombi belong to Pathology (Disorders of Hemodynamics and Hemostasis).');
addMove(10917, 129, 'Döhle bodies in neutrophils during systemic infection belong to Pathology (Acute Inflammation).');
addMove(10918, 129, 'Selectin family cell adhesion molecules in leukocyte rolling belong to Pathology (Acute Inflammation).');
addMove(10919, 131, 'Integrin-mediated cell-matrix adhesions in wound healing belong to Pathology (Tissue Repair).');
addMove(10920, 186, 'Glomus tumor of the subungual glomus body belongs to Pathology (Joints and Soft Tissue Tumors).');

// Pharmacology
addMove(10921, 265, 'Synergy of salmeterol (LABA) with corticosteroids upregulating beta-2 receptors belongs to Pharmacology (Respiratory System).');
addMove(10922, 260, 'Systemic and local vascular actions of Prostaglandin E2 belong to Pharmacology (NSAIDs / Autacoids).');
addMove(10667, 258, 'Alprostadil (PGE1) intracavernosal therapy for erectile dysfunction belongs to Pharmacology (Androgens and Drugs for Erectile Dysfunction).');
addMove(10668, 259, 'Dinoprost (PGF2alpha) uterotonic pharmacology belongs to Pharmacology (Drugs Acting on Uterus).');

// PSM / Community Medicine
addMove(10024, 363, 'Adult risk groups for Hepatitis B immunization belong to PSM (Principles of Immunization and Vaccination).');
addMove(10937, 357, 'Levels of prevention (secondary prevention via screening and early treatment) belong to PSM (Concepts of Disease and Prevention).');

// Internal Medicine
addMove(10939, 451, 'Management of anemia in chronic renal failure with erythropoietin belongs to Medicine (Chronic Kidney Disease).');

// Orthopaedics
addMove(10940, 680, 'Pharmacotherapy of osteoarthritis belongs to Orthopaedics (Rheumatoid Arthritis and Osteoarthritis).');

// Obstetrics & Gynaecology
addMove(10941, 541, 'Techniques for delivery of aftercoming head of breech (Burns-Marshall, Mauriceau) belong to OB & G (Abnormal Labour).');
addMove(10942, 563, 'Levonorgestrel intrauterine device (LNG-IUD) for menorrhagia belongs to OB & G (Contraception and Sterilization).');
addMove(10943, 563, 'First-line medical management of menorrhagia in reproductive age group belongs to OB & G (Contraception and Sterilization).');
addMove(10944, 563, 'Drugs used in abnormal uterine bleeding / menorrhagia belong to OB & G (Contraception and Sterilization).');

// Dermatology
addMove(10945, 656, 'Clinical pathology and features of skin tags (acrochordon) belong to Dermatology (Mixed / Miscellaneous Topics).');

console.log(`Processed cross-subject moves. Current count: ${moves.length}`);
fs.writeFileSync('tools/moves_checkpoint.json', JSON.stringify(moves, null, 2));
process.exit(0);
