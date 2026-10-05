const fs = require('fs');
const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const fullAudit = require('./full_medicine_auditor');
const dumpMoves1 = JSON.parse(fs.readFileSync('tools/dump_categorized_moves.json', 'utf8'));
const dumpMoves2 = JSON.parse(fs.readFileSync('tools/dump_remaining_classified.json', 'utf8'));

const combinedMap = new Map();
rawQuestions.forEach(q => {
  const cleanedQ = {
    id: q.id,
    currentModule: q.module_id,
    text: fullAudit.clean(q.question_text),
    options: {
      A: fullAudit.clean(q.option_a),
      B: fullAudit.clean(q.option_b),
      C: fullAudit.clean(q.option_c),
      D: fullAudit.clean(q.option_d),
      E: fullAudit.clean(q.option_e)
    },
    ansLetter: (q.answer || '').trim().toUpperCase(),
    expl: fullAudit.clean(q.explanation)
  };
  let ansText = cleanedQ.options[cleanedQ.ansLetter] || '';
  cleanedQ.ansText = ansText;
  cleanedQ.full = (cleanedQ.text + ' ' + Object.values(cleanedQ.options).join(' ') + ' ' + cleanedQ.expl).toLowerCase();
  cleanedQ.qa = (cleanedQ.text + ' ' + ansText).toLowerCase();

  const res = fullAudit.audit(cleanedQ);
  if (res && res.toModule !== cleanedQ.currentModule) {
    combinedMap.set(q.id, { id: q.id, fromModule: cleanedQ.currentModule, toModule: res.toModule, reason: res.reason });
  }
});
dumpMoves1.forEach(m => combinedMap.set(m.id, m));
dumpMoves2.forEach(m => combinedMap.set(m.id, m));

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

const targetMods = [412, 452, 454, 470, 476, 477, 478];
const unflaggedTargets = rawQuestions.filter(q => targetMods.includes(q.module_id) && !combinedMap.has(q.id));
console.log(`Unflagged targets count: ${unflaggedTargets.length}`);

// Helper for deep classification of misfiled questions
function classifyRemaining(q) {
  const cur = q.module_id;
  const text = fullAudit.clean(q.question_text).toLowerCase();
  const expl = fullAudit.clean(q.explanation).toLowerCase();
  const ansLetter = (q.answer || '').trim().toUpperCase();
  const optA = fullAudit.clean(q.option_a).toLowerCase();
  const optB = fullAudit.clean(q.option_b).toLowerCase();
  const optC = fullAudit.clean(q.option_c).toLowerCase();
  const optD = fullAudit.clean(q.option_d).toLowerCase();
  const optE = fullAudit.clean(q.option_e).toLowerCase();
  const ansText = (ansLetter === 'A' ? optA : ansLetter === 'B' ? optB : ansLetter === 'C' ? optC : ansLetter === 'D' ? optD : optE);
  const full = `${text} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`;
  const qa = `${text} ${ansText}`;

  const has = (t) => full.includes(t);
  const hasQA = (t) => qa.includes(t);
  const hasText = (t) => text.includes(t);

  // Module 470: Headache
  // Real headache questions in 470: migraine, tension headache, cluster headache, medication overuse headache, temporal arteritis (giant cell), pseudotumor cerebri, trigeminal neuralgia, subarachnoid hemorrhage (worst headache of life).
  if (cur === 470) {
    // If not about headache/craniofacial pain:
    if (hasQA('breast enlargement') || hasQA('gynecomastia')) {
      return { toModule: 423, reason: "Tests gynecomastia pathophysiology and estrogen metabolism, belongs in Medicine: Reproductive Endocrinology (Module 423)." };
    }
    if (hasQA('cerebral edema') && hasQA('potassium')) {
      return { toModule: 412, reason: "Tests electrolyte imbalance and complications in gastroenteritis, belongs in Medicine: Acid-Base & Electrolyte Disorders (Module 412)." };
    }
    if (hasQA('melas') || (has('stroke-like') && has('mitochondrial'))) {
      return { toModule: 473, reason: "Tests MELAS mitochondrial encephalomyopathy presenting with stroke-like episodes, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('wilm') || hasQA('wilms tumor')) {
      return { toModule: 580, reason: "Tests Wilms tumor clinical presentation in children, belongs in Pediatrics: Pediatric Oncology (Module 580)." };
    }
    if (hasQA('carbon monoxide') || hasQA('co poisoning') || hasQA('cherry red')) {
      return { toModule: 262, reason: "Tests carbon monoxide poisoning toxicology and carboxyhemoglobinemia, belongs in Forensic Medicine: Toxicology (Module 262)." };
    }
    if (hasQA('progestin-only pill') || (has('migraine') && has('thickens cervical mucus'))) {
      return { toModule: 529, reason: "Tests progestin-only oral contraceptive mechanism of action, belongs in Obstetrics & Gynecology: Contraception (Module 529)." };
    }
    if (hasQA('botulinum toxin') && hasText('achalasia')) {
      return { toModule: 489, reason: "Tests achalasia cardia management with endoscopic intrasphincteric botulinum toxin, belongs in Surgery: Esophagus (Module 489)." };
    }
    if (hasQA('mycoplasma pneumonia') || (has('walking pneumonia') && has('cold agglutinin'))) {
      return { toModule: 443, reason: "Tests Mycoplasma pneumoniae atypical pneumonia with extrapulmonary manifestations, belongs in Medicine: Pneumonia (Module 443)." };
    }
    if (hasQA('farmers lung') || hasQA("farmer's lung")) {
      return { toModule: 444, reason: "Tests hypersensitivity pneumonitis (farmer's lung), belongs in Medicine: Interstitial Lung Diseases (Module 444)." };
    }
    if (hasQA('dengue virus') || hasQA('dengue hemorrhagic fever')) {
      return { toModule: 219, reason: "Tests dengue viral infection pathophysiology and hemorrhagic manifestations, belongs in Microbiology: RNA Viruses (Module 219)." };
    }
    if (hasQA('infectious mononucleosis') || (has('epstein-barr') && has('ampicillin'))) {
      return { toModule: 218, reason: "Tests infectious mononucleosis (EBV) pharyngitis and post-antibiotic rash, belongs in Microbiology: DNA Viruses - Herpesviruses (Module 218)." };
    }
    if (hasQA('cerebellopontine angle') || hasQA('acoustic neuroma') || hasQA('vestibular schwannoma')) {
      return { toModule: 618, reason: "Tests cerebellopontine angle tumor (acoustic neuroma) vestibular and cochlear signs, belongs in ENT: Otology - Inner Ear (Module 618)." };
    }
    if (hasQA('glioblastoma') || hasQA('astrocytoma')) {
      return { toModule: 507, reason: "Tests malignant brain tumors (glioblastoma multiforme) presenting with seizures, belongs in Surgery: Neurosurgery (Module 507)." };
    }
    if (hasQA('crushing chest pain') && (has('aortic') || has('diastolic murmur') || has('dissection'))) {
      return { toModule: 458, reason: "Tests acute aortic dissection with retrograde aortic regurgitation, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('heat stroke') || hasQA('sweating') && hasText('42')) {
      return { toModule: 260, reason: "Tests heat stroke / environmental hyperthermia pathophysiology, belongs in Forensic Medicine: Physical Injuries & Heat (Module 260)." };
    }
    if (hasQA('vertebrobasilar insufficiency') || (hasText('dizziness') && hasText('turns her head'))) {
      return { toModule: 473, reason: "Tests vertebrobasilar insufficiency transient ischemic attacks, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('herpes simplex') && (hasText('encephalitis') || hasText('temporal') || hasQA('acyclovir'))) {
      return { toModule: 474, reason: "Tests herpes simplex encephalitis diagnosis and intravenous acyclovir therapy, belongs in Medicine: Meningitis & Encephalitis (Module 474)." };
    }
    if (hasQA('ceftriaxone + vancomycin') && (hasText('meningitis') || hasText('neck stiffness'))) {
      return { toModule: 474, reason: "Tests bacterial meningitis empiric antibiotic regimen, belongs in Medicine: Meningitis & Encephalitis (Module 474)." };
    }
    if (hasQA('optic chiasma') && has('pituitar')) {
      return { toModule: 414, reason: "Tests pituitary macroadenoma suprasellar extension and bitemporal visual field deficits, belongs in Medicine: Disorders of Anterior Pituitary (Module 414)." };
    }
    if (hasQA('cushing') && (hasText('hypertension') || hasText('difficult to treat'))) {
      return { toModule: 420, reason: "Tests secondary hypertension caused by hypercortisolemia, belongs in Medicine: Cushing Syndrome (Module 420)." };
    }
    if (hasQA('cerebellar haemorrhage') || (hasText('occipital headache') && hasText('unsteadiness of her gait'))) {
      return { toModule: 473, reason: "Tests acute cerebellar hemorrhage clinical features and mass effect, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('sagittal sinus thrombosis') || hasQA('cortical venous thrombosis')) {
      return { toModule: 473, reason: "Tests cerebral venous sinus thrombosis presenting with severe nocturnal headache and seizures, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
  }

  // Module 476: Chronic Myeloid Leukemia and Lymphoid Leukemias
  // Questions in 476 that are NOT CML / CLL / Hairy Cell Leukemia / Mantle cell lymphoma:
  if (cur === 476) {
    if (hasQA('ranolazine')) {
      return { toModule: 161, reason: "Tests antianginal pharmacology of late sodium channel blocker ranolazine, belongs in Pharmacology: Cardiovascular Drugs (Module 161)." };
    }
    if (hasQA('aristocholic acid') || hasQA('crystalluria')) {
      return { toModule: 454, reason: "Tests drug- and toxin-induced nephrotoxicity and crystalluria, belongs in Medicine: Renal Tubular Diseases of Kidney (Module 454)." };
    }
    if (hasQA('sputum for acid and alcohol fast bacilli') || hasText('alcohol fast bacilli')) {
      return { toModule: 442, reason: "Tests diagnostic evaluation of pulmonary tuberculosis with AFB sputum microscopy, belongs in Medicine: Asthma & COPD / Tuberculosis (Module 442)." };
    }
    if (hasQA('ct-guided biopsy') && (hasText('smoker') || hasText('hemoptysis'))) {
      return { toModule: 448, reason: "Tests diagnostic tissue biopsy for lung cancer evaluation, belongs in Medicine: Neoplasms of the Lung (Module 448)." };
    }
    if (hasQA('jejunal polyp') || (hasText('constipation') && hasText('children'))) {
      return { toModule: 569, reason: "Tests etiology of chronic constipation in children, belongs in Pediatrics: Pediatric Gastroenterology & Hepatology (Module 569)." };
    }
    if (hasQA('hyperparathyroidism') && hasText('renal insufficiency')) {
      return { toModule: 424, reason: "Tests secondary hyperparathyroidism and renal osteodystrophy in chronic kidney disease, belongs in Medicine: Disorders of Parathyroid and Calcium (Module 424)." };
    }
    if (hasQA('piecemeal necrosis') || hasQA('chronic alcoholism')) {
      return { toModule: 426, reason: "Tests histopathological manifestations of alcoholic liver disease, belongs in Medicine: Alcoholic Liver Diseases (Module 426)." };
    }
    if (hasQA('hepatitis a') || hasQA('viral hepatitis a')) {
      return { toModule: 425, reason: "Tests hepatitis A virus transmission and fecal-oral acute hepatitis, belongs in Medicine: Hyperbilirubinemia & Liver Infections (Module 425)." };
    }
    if (hasQA('acute hepatitis b') || hasQA('hbeag') || hasQA('anti-hbc igm') || hasQA('hdv coinfection')) {
      return { toModule: 427, reason: "Tests viral hepatitis serological markers, infectivity, and HDV co-infection, belongs in Medicine: Autoimmune & Viral Liver Diseases (Module 427)." };
    }
    if (hasQA('cefotaxime') && hasText('spontaneous bacterial peritonitis')) {
      return { toModule: 428, reason: "Tests spontaneous bacterial peritonitis treatment with third-generation cephalosporins, belongs in Medicine: Acute Liver Failure & Cirrhosis Complications (Module 428)." };
    }
    if (hasQA('mixed essential cryoglobulinemia') || hasQA('cryoglobulinemia')) {
      return { toModule: 437, reason: "Tests cryoglobulinemic vasculitis associated with chronic hepatitis C, belongs in Medicine: Small vessel vasculitis (Module 437)." };
    }
    if (hasQA('pangenotypic antivirals') || (has('sofosbuvir') && has('velpatasvir'))) {
      return { toModule: 428, reason: "Tests direct-acting antiviral therapy for chronic hepatitis C cirrhosis, belongs in Medicine: Complications of Cirrhosis (Module 428)." };
    }
    if (hasQA('watermelon stomach') || hasQA('gave')) {
      return { toModule: 438, reason: "Tests gastric antral vascular ectasia (watermelon stomach) in systemic sclerosis, belongs in Medicine: Scleroderma (Module 438)." };
    }
    if (hasQA('putamen') && hasText('hypertension')) {
      return { toModule: 473, reason: "Tests hypertensive intracerebral hemorrhage anatomical site (putamen / basal ganglia), belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('procyclidine') || hasQA('oculogyric crisis')) {
      return { toModule: 466, reason: "Tests acute dystonic reaction (oculogyric crisis) and anticholinergic therapy, belongs in Medicine: Extrapyramidal Syndromes and Movement Disorders (Module 466)." };
    }
    if (hasQA('urease breath test') || hasQA('h. pylori eradication')) {
      return { toModule: 426, reason: "Tests confirmation of Helicobacter pylori eradication, belongs in Medicine: Peptic & Alcoholic GI Diseases (Module 426)." };
    }
    if (hasQA('graded exercise programme') || hasQA('chronic fatigue syndrome')) {
      return { toModule: 479, reason: "Tests chronic fatigue syndrome management with graded exercise therapy, belongs in Medicine: Mixed / Miscellaneous Topics (Module 479)." };
    }
    if (hasQA('dexamethasone') && hasText('apml')) {
      return { toModule: 475, reason: "Tests differentiation syndrome in acute promyelocytic leukemia treated with dexamethasone, belongs in Medicine: Plasma Cell & Hematologic Malignancies (Module 475)." };
    }
    if (hasQA('ct abdomen with contrast') && (hasText('chronic abdominal pain') || hasText('passage of greasy'))) {
      return { toModule: 426, reason: "Tests chronic pancreatitis evaluation with contrast-enhanced CT, belongs in Medicine: Pancreatic & Liver Diseases (Module 426)." };
    }
    if (hasQA('probenecid') || (hasText('haemodialysis') && hasText('gout'))) {
      return { toModule: 164, reason: "Tests uricosuric agent probenecid mechanism of action and contraindication in renal impairment, belongs in Pharmacology: Drugs for Gout & Hyperuricemia (Module 164)." };
    }
    if (hasQA('pulmonary fibrosis') && (hasText('rheumatoid') || hasText('ulnar deviation'))) {
      return { toModule: 441, reason: "Tests rheumatoid lung disease and interstitial pulmonary fibrosis, belongs in Medicine: Rheumatoid Arthritis (Module 441)." };
    }
    if (hasQA('high resolution ct') && hasText('bronchiectasis')) {
      return { toModule: 445, reason: "Tests high-resolution computed tomography (HRCT) in diagnostic confirmation of bronchiectasis, belongs in Medicine: Bronchiectasis and Lung Abscess (Module 445)." };
    }
    if (hasQA('elevated gh') || (has('acromegaly') && has('obesity'))) {
      return { toModule: 414, reason: "Tests growth hormone regulation and paradoxically suppressed GH in obesity, belongs in Medicine: Disorders of Anterior Pituitary (Module 414)." };
    }
    if (hasQA('anaemia') && hasText('chronic renal insufficiency')) {
      return { toModule: 451, reason: "Tests anemia of chronic kidney disease and erythropoietin deficiency, belongs in Medicine: Chronic Kidney Disease (Module 451)." };
    }
    if (hasQA('chronic hepatitis b') || hasQA('entecavir') || hasQA('tenofovir')) {
      return { toModule: 427, reason: "Tests nucleoside/nucleotide reverse transcriptase inhibitor therapy for chronic hepatitis B, belongs in Medicine: Autoimmune & Viral Liver Diseases (Module 427)." };
    }
    if (hasQA('cholangiocarcinoma') || hasQA('o. viverrini')) {
      return { toModule: 216, reason: "Tests Opisthorchis viverrini liver fluke infection and cholangiocarcinogenesis, belongs in Microbiology: Helminthology - Trematodes (Module 216)." };
    }
    if (hasQA('chronic pancreatitis') || hasQA('tigar-o')) {
      return { toModule: 426, reason: "Tests chronic pancreatitis etiology and TIGAR-O classification, belongs in Medicine: Alcoholic & Pancreatic Diseases (Module 426)." };
    }
    if (hasQA('avascular necrosis') && hasText('steroids')) {
      return { toModule: 611, reason: "Tests steroid-induced avascular necrosis of the femoral head, belongs in Orthopedics: Hip & Femur (Module 611)." };
    }
    if (hasQA('paradoxical movement of the left hemi diaphragm') || (hasText('phrenic') && hasText('smoker'))) {
      return { toModule: 448, reason: "Tests lung neoplasm invading the phrenic nerve causing diaphragmatic paralysis, belongs in Medicine: Neoplasms of the Lung (Module 448)." };
    }
    if (hasQA('basophilic stippling') && hasText('lead')) {
      return { toModule: 262, reason: "Tests chronic lead poisoning with microcytic anemia and basophilic stippling, belongs in Forensic Medicine: Toxicology (Module 262)." };
    }
    if (hasQA('pharyngeal pouch') || hasQA('zenker')) {
      return { toModule: 624, reason: "Tests Zenker diverticulum / pharyngeal pouch clinical presentation, belongs in ENT: Pharynx & Esophagus (Module 624)." };
    }
    if (hasQA('nazer prognostic index') || hasQA("wilson's disease")) {
      return { toModule: 429, reason: "Tests Wilson disease prognosis and Nazer index score, belongs in Medicine: Hemochromatosis and Wilsons Disease (Module 429)." };
    }
    if (hasQA('hypokalemia') && hasQA('acidosis')) {
      return { toModule: 412, reason: "Tests systemic electrolyte disturbances and shifts causing hypokalemia, belongs in Medicine: Acid-Base Disorders (Module 412)." };
    }
    if (hasQA('essential thrombocytosis') || hasQA('polycythemia rubra vera') || hasQA('jak 2') || hasQA('jak2')) {
      // These are myeloproliferative disorders. Module 476 is titled "Chronic Myeloid Leukemia and Lymphoid Leukemias". MPNs (ET, PV, PMF) are directly related or could stay in 476 or move to hematology. Since 476 is CML & Leukemias, and ET/PV are classic BCR-ABL negative MPNs, they are closely aligned with CML under MPNs. We can keep ET/PV in 476 or reclassify. Let's see if 476 is the official home for MPNs. Yes, CML is an MPN! So CML, CLL, HCL, ET, PV, myelofibrosis fit nicely.
      return null;
    }
    if (hasQA('c-myc') || hasQA('burkitt')) {
      return { toModule: 475, reason: "Tests Burkitt lymphoma t(8;14) c-myc translocation, belongs in Medicine: Plasma Cell Disorders & Lymphomas (Module 475)." };
    }
    if (hasQA('mantle cell lymphoma') || hasQA('t (11:14)') || hasQA('triple hit lymphoma')) {
      return { toModule: 475, reason: "Tests B-cell non-Hodgkin lymphoma cytogenetics, belongs in Medicine: Plasma Cell Disorders & Lymphomas (Module 475)." };
    }
  }

  // Module 478: HIV / AIDS - Investigations
  // Questions in 478 that have NOTHING to do with HIV:
  if (cur === 478) {
    if (hasQA('kallman') || hasQA("kallmann's syndrome")) {
      return { toModule: 414, reason: "Tests hypogonadotropic hypogonadism with anosmia (Kallmann syndrome), belongs in Medicine: Disorders of Anterior Pituitary (Module 414)." };
    }
    if (hasQA('urinary 5-hydroxyindoleacetic acid') || hasQA('carcinoid')) {
      return { toModule: 423, reason: "Tests carcinoid syndrome diagnostic confirmation with 24-hour urinary 5-HIAA, belongs in Medicine: Reproductive Endocrinology & Neuroendocrine Tumors (Module 423)." };
    }
    if (hasQA('visual loss') && (hasText('headaches') && hasText('menstrual irregulari'))) {
      return { toModule: 414, reason: "Tests pituitary prolactinoma causing headache, amenorrhea, and visual field deficits, belongs in Medicine: Disorders of Anterior Pituitary (Module 414)." };
    }
    if (hasQA('lithium') && hasText('polyuria')) {
      return { toModule: 416, reason: "Tests lithium-induced nephrogenic diabetes insipidus, belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus (Module 416)." };
    }
    if (hasQA('short synacthen test') || (has('addison') && has('pigment'))) {
      return { toModule: 413, reason: "Tests primary adrenal insufficiency (Addison disease) diagnostic confirmation with ACTH stimulation (Synacthen) test, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('hydrocortisone + fludrocortisone')) {
      return { toModule: 413, reason: "Tests hormone replacement in primary adrenal failure with glucocorticoid and mineralocorticoid, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('paget') || hasQA("paget's disease")) {
      return { toModule: 424, reason: "Tests Paget disease of bone metabolic parameters and skeletal symptoms, belongs in Medicine: Disorders of Parathyroid and Calcium (Module 424)." };
    }
    if (hasQA('serum protein electrophoresis') && (has('bence jones') || has('multiple myeloma') || has('polyuria'))) {
      return { toModule: 475, reason: "Tests multiple myeloma diagnostic workup with serum protein electrophoresis, belongs in Medicine: Plasma Cell Disorders (Module 475)." };
    }
    if (hasQA('folic acid deficiency') && hasText('alcohol')) {
      return { toModule: 435, reason: "Tests macrocytic megaloblastic anemia secondary to alcoholic folate deficiency, belongs in Medicine: Malabsorption Syndrome & Nutritional Anemias (Module 435)." };
    }
    if (hasQA('escherichia coli o157') || hasQA('e. coli o157')) {
      return { toModule: 213, reason: "Tests enterohemorrhagic E. coli O157:H7 dysentery and hemolytic uremic syndrome risk, belongs in Microbiology: Enterobacteriaceae (Module 213)." };
    }
    if (hasQA('dexa') && hasText('osteoporosis')) {
      return { toModule: 424, reason: "Tests bone mineral density quantification using dual-energy X-ray absorptiometry (DEXA), belongs in Medicine: Disorders of Parathyroid and Calcium (Module 424)." };
    }
    if (hasQA('cervical spondylosis') && hasText('neck pains')) {
      return { toModule: 610, reason: "Tests cervical spondylosis clinical features and radiculopathy, belongs in Orthopedics: Spine (Module 610)." };
    }
    if (hasQA('post streptococcal') || hasQA('psgn')) {
      return { toModule: 450, reason: "Tests post-streptococcal glomerulonephritis nephritic syndrome, belongs in Medicine: Acute Kidney Injury & Glomerular Disorders (Module 450)." };
    }
    if (hasQA('prednisolone') && hasText('minimal change')) {
      return { toModule: 450, reason: "Tests minimal change nephrotic syndrome in children treated with corticosteroids, belongs in Medicine: Acute Kidney Injury & Glomerular Disorders (Module 450)." };
    }
    if (hasQA('oral metronidazole') && hasText('giardia')) {
      return { toModule: 215, reason: "Tests giardiasis treatment with metronidazole following freshwater exposure, belongs in Microbiology: Protozoology (Module 215)." };
    }
    if (hasQA('cholesterol emboli') && (hasText('thrombolysis') || hasText('livedo'))) {
      return { toModule: 458, reason: "Tests atheroembolic renal disease / cholesterol crystal embolization post-cardiac intervention, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('alzheimer') || hasQA("alzheimer's dementia")) {
      return { toModule: 464, reason: "Tests progressive insidious memory decline in Alzheimer's dementia, belongs in Medicine: Cerebral Neurology: Dementia, Death and Coma (Module 464)." };
    }
    if (hasQA('hellp') || (has('pregnant') && has('hemolysis') && has('liver'))) {
      return { toModule: 539, reason: "Tests HELLP syndrome complications in severe preeclampsia, belongs in Obstetrics: Hypertensive Disorders of Pregnancy (Module 539)." };
    }
    if (hasQA('hb electrophoresis') && hasText('child')) {
      return { toModule: 573, reason: "Tests pediatric hemoglobinopathy diagnostic confirmation via hemoglobin electrophoresis, belongs in Pediatrics: Pediatric Hematology (Module 573)." };
    }
    if (hasQA('fibromyalgia') && (hasText('back pain') || hasText('tender points'))) {
      return { toModule: 441, reason: "Tests fibromyalgia chronic widespread musculoskeletal pain and central sensitization, belongs in Medicine: Rheumatoid Arthritis & Pain Syndromes (Module 441)." };
    }
    if (hasQA('acute intermittent porphyria') || hasQA('porphyria')) {
      return { toModule: 124, reason: "Tests acute intermittent porphyria porphobilinogen deaminase defect and abdominal crises, belongs in Biochemistry: Heme Synthesis & Porphyrias (Module 124)." };
    }
    if (hasQA('potts disease') || hasQA("pott's disease") || (hasText('tenderness') && hasText('spine') && hasText('tuberculosis'))) {
      return { toModule: 609, reason: "Tests tuberculous spondylitis (Pott disease) of the spine, belongs in Orthopedics: Bone & Joint Tuberculosis (Module 609)." };
    }
    if (hasQA('upper gi endoscopy and colonoscopy') && hasText('weight loss')) {
      return { toModule: 435, reason: "Tests endoscopic bidirectional evaluation for occult gastrointestinal malignancy and malabsorption, belongs in Medicine: Malabsorption Syndrome (Module 435)." };
    }
    if (hasQA('achlorhydria') && (hasText('watery diarrhea') || hasText('vipoma'))) {
      return { toModule: 423, reason: "Tests WDHA syndrome (VIPoma) features of watery diarrhea, hypokalemia, and achlorhydria, belongs in Medicine: Reproductive Endocrinology & Neuroendocrine Tumors (Module 423)." };
    }
    if (hasQA('thrombi from an atheromatous aorta') || (hasText('acute pain') && hasText('absent pulses'))) {
      return { toModule: 458, reason: "Tests acute lower extremity arterial occlusion from macroemboli, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('mri and mra of head and neck') && hasText('vertigo')) {
      return { toModule: 473, reason: "Tests vertebral artery dissection evaluation with neurovascular imaging, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('methysergide') && hasText('retroperitoneal fibrosis')) {
      return { toModule: 453, reason: "Tests drug-induced retroperitoneal fibrosis (methysergide), belongs in Medicine: Cysts and Inherited Disorders of the Kidney (Module 453)." };
    }
    if (hasQA('dual-energy x-ray absorptiometry') || hasQA('dexa')) {
      return { toModule: 424, reason: "Tests bone densitometry in secondary osteopenia and amenorrhea, belongs in Medicine: Disorders of Parathyroid and Calcium (Module 424)." };
    }
    if (hasQA('hepatitis b virus') && hasText('thailand') && hasText('mass in the right upper')) {
      return { toModule: 428, reason: "Tests hepatitis B oncogenesis leading to hepatocellular carcinoma, belongs in Medicine: Complications of Cirrhosis (Module 428)." };
    }
    if (hasQA('igm elisa') && (hasText('farmer') || hasText('leptospirosis') || hasText('dengue'))) {
      return { toModule: 214, reason: "Tests serological diagnosis of acute zoonotic infections, belongs in Microbiology: Spirochetes / Serology (Module 214)." };
    }
    if (hasQA('raised lh level') || hasQA('ovulation is imminent')) {
      return { toModule: 110, reason: "Tests physiology of mid-cycle LH surge triggering ovulation, belongs in Physiology: Endocrine & Reproduction (Module 110)." };
    }
    if (hasQA('g cells of gastric antrum') || (hasText('severe indigestion') && hasText('zollinger-ellison'))) {
      return { toModule: 423, reason: "Tests gastrinoma (Zollinger-Ellison syndrome) gastrin secretion by G cells / islet cells, belongs in Medicine: Neuroendocrine Tumors (Module 423)." };
    }
    if (hasQA('transoesophageal echocardiography') && hasText('sudden onset right-sided weakness')) {
      return { toModule: 455, reason: "Tests cardioembolic stroke evaluation using transesophageal echocardiography, belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('thromboelastography')) {
      return { toModule: 483, reason: "Tests point-of-care viscoelastic coagulation assessment (thromboelastography) in acute trauma, belongs in Surgery: Shock, Resuscitation & Trauma (Module 483)." };
    }
    if (hasQA('sleep paralysis')) {
      return { toModule: 449, reason: "Tests narcolepsy tetrad and isolated sleep paralysis, belongs in Medicine: Sleep Apnea & Sleep Disorders (Module 449)." };
    }
    if (hasQA('miliary tuberculosis')) {
      return { toModule: 442, reason: "Tests miliary tuberculosis disseminated lymphohematogenous spread, belongs in Medicine: Asthma & COPD / Tuberculosis (Module 442)." };
    }
    if (hasQA('horner') || hasQA("horner's syndrome")) {
      return { toModule: 448, reason: "Tests Pancoast superior sulcus lung carcinoma producing Horner syndrome, belongs in Medicine: Neoplasms of the Lung (Module 448)." };
    }
    if (hasQA('non-cardiogenic pulmonary edema') && hasText('pancreatitis')) {
      return { toModule: 447, reason: "Tests acute respiratory distress syndrome (ARDS) secondary to acute pancreatitis, belongs in Medicine: Respiratory Failure and ARDS (Module 447)." };
    }
    if (hasQA('ct scan of the lung') && hasText('hemoptysis')) {
      return { toModule: 448, reason: "Tests diagnostic thoracic imaging in persistent hemoptysis and suspected bronchogenic carcinoma, belongs in Medicine: Neoplasms of the Lung (Module 448)." };
    }
    if (hasQA('behcet') || hasQA("behcet's syndrome")) {
      return { toModule: 437, reason: "Tests Behcet disease multisystem vasculitis with recurrent oral and genital ulcerations, belongs in Medicine: Small vessel vasculitis (Module 437)." };
    }
    if (hasQA('anti cardiolipin antibody') || hasQA('anticardiolipin')) {
      return { toModule: 440, reason: "Tests antiphospholipid syndrome diagnostics (anticardiolipin antibodies, livedo reticularis, renal infarction), belongs in Medicine: Antiphospholipid Antibody Syndrome (Module 440)." };
    }
    if (hasQA('adult onset still') || hasQA("still's disease")) {
      return { toModule: 441, reason: "Tests Adult-onset Still disease swinging high-spiking fevers, salmon rash, and arthritis, belongs in Medicine: Rheumatoid Arthritis & Systemic Inflammatory Disorders (Module 441)." };
    }
    if (hasQA('juvenile chronic arthritis') || hasQA('juvenile idiopathic arthritis')) {
      return { toModule: 576, reason: "Tests systemic juvenile idiopathic arthritis clinical manifestations, belongs in Pediatrics: Pediatric Rheumatology (Module 576)." };
    }
    if (hasQA('joint fluid aspirate for microscopy') && (hasText('severe pain in his right big toe') || hasText('gout'))) {
      return { toModule: 441, reason: "Tests acute podagra and arthrocentesis for polarized light microscopy, belongs in Medicine: Rheumatoid Arthritis & Crystal Arthropathies (Module 441)." };
    }
    if (hasQA('blood transfusion') && (hasText('pallor') || hasText('dyspnoea'))) {
      return { toModule: 479, reason: "Tests acute symptomatic anemia and transfusion thresholds, belongs in Medicine: Mixed / Miscellaneous Topics (Module 479)." };
    }
  }

  // Module 477: HIV / AIDS - Epidemiology and Diagnosis
  // Check questions in 477 that are NOT about HIV:
  if (cur === 477) {
    if (hasQA('wheeze and an extensive rash after') || (hasText('anaphylaxis') && hasText('peanut'))) {
      return { toModule: 483, reason: "Tests acute anaphylactic shock management with intramuscular epinephrine, belongs in Surgery: Shock & Resuscitation (Module 483)." };
    }
    if (hasQA('heberden') || (hasText('bony swellings of the dip joints') && hasText('hands'))) {
      return { toModule: 441, reason: "Tests osteoarthritis Heberden nodes at distal interphalangeal joints, belongs in Medicine: Rheumatoid Arthritis & Osteoarthritis (Module 441)." };
    }
    if (hasQA('gene xpert') || hasQA('rifampicin resistance')) {
      return { toModule: 442, reason: "Tests GeneXpert MTB/RIF molecular diagnosis of Mycobacterium tuberculosis and rpoB gene resistance, belongs in Medicine: Asthma & COPD / Tuberculosis (Module 442)." };
    }
    if (hasQA('coarctation of the aorta') || (hasText('feeble femoral pulses') && hasText('upper limb bp'))) {
      return { toModule: 458, reason: "Tests coarctation of aorta radiofemoral delay and rib notching on CXR, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('guillain-barre') || (hasText('paralysis in both legs') && hasText('progresses to invo'))) {
      return { toModule: 468, reason: "Tests acute inflammatory demyelinating polyneuropathy (Guillain-Barre syndrome), belongs in Medicine: Guillain Barre Syndrome and Other Peripheral Neuropathies (Module 468)." };
    }
    if (hasQA('supraspinatus') || (hasText('tennis player') && hasText('shoulder pains'))) {
      return { toModule: 610, reason: "Tests rotator cuff tendinopathy in athletes, belongs in Orthopedics: Shoulder & Arm (Module 610)." };
    }
  }

  // Module 452: Renal Replacement Therapy
  // Check questions in 452 that are NOT about Dialysis / Renal Transplantation:
  if (cur === 452) {
    if (hasQA('methysergide') && hasText('renal failure')) {
      return { toModule: 453, reason: "Tests drug-induced retroperitoneal fibrosis leading to ureteral obstruction, belongs in Medicine: Cysts and Inherited Disorders of the Kidney (Module 453)." };
    }
    if (hasQA('cortisol deficiency') && hasText('adrenalectomy')) {
      return { toModule: 413, reason: "Tests acute post-adrenalectomy adrenal crisis and glucocorticoid insufficiency, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('v2r') || (hasText('vasopressin') && hasText('collecting'))) {
      return { toModule: 416, reason: "Tests vasopressin V2 receptor mediation of aquaporin-2 water reabsorption, belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus (Module 416)." };
    }
    if (hasQA('norepinephrine') && hasText('septic shock')) {
      return { toModule: 483, reason: "Tests first-line vasopressor therapy (norepinephrine) in septic shock resuscitation, belongs in Surgery: Shock, Resuscitation & Trauma (Module 483)." };
    }
    if (hasQA('doubled') && hasText('hydrocortisone')) {
      return { toModule: 413, reason: "Tests stress-dose glucocorticoid adjustments in adrenal insufficiency during illness, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('sex hormone-binding globulin') || (hasText('pcos') && hasText('hirsutism'))) {
      return { toModule: 423, reason: "Tests polycystic ovary syndrome (PCOS) endocrine parameters and SHBG suppression, belongs in Medicine: Reproductive Endocrinology (Module 423)." };
    }
    if (hasQA('men-2a') || (hasText('phaeochromocytoma') && hasText('running'))) {
      return { toModule: 413, reason: "Tests multiple endocrine neoplasia type 2A (MEN-2A) pheochromocytoma paroxysms, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('calcium gluconate') && hasText('broad complexes on the ecg')) {
      return { toModule: 412, reason: "Tests cardiac membrane stabilization with intravenous calcium gluconate in severe hyperkalemia, belongs in Medicine: Acid-Base Disorders & Electrolytes (Module 412)." };
    }
    if (hasQA('hypokalemia') && hasText('diuretic therapy')) {
      return { toModule: 412, reason: "Tests loop and thiazide diuretic-induced hypokalemia and flattened T waves, belongs in Medicine: Acid-Base Disorders & Electrolytes (Module 412)." };
    }
    if (hasQA('plasma aldosterone / renin') || hasQA('aldosterone: renin ratio')) {
      return { toModule: 413, reason: "Tests primary aldosteronism (Conn syndrome) screening with aldosterone-to-renin ratio, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
    if (hasQA('magnetic resonance angiography') && hasText('renal bruits')) {
      return { toModule: 458, reason: "Tests renovascular hypertension and renal artery stenosis diagnostic imaging, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('flash pulmonary oedema') && hasText('renal artery')) {
      return { toModule: 462, reason: "Tests flash pulmonary edema (Pickering syndrome) from bilateral renal artery stenosis, belongs in Medicine: Heart Failure (Module 462)." };
    }
    if (hasQA('anti scl 70') || hasQA('scleroderma')) {
      return { toModule: 438, reason: "Tests systemic sclerosis (scleroderma) autoantibodies (anti-Scl-70 / topoisomerase I), belongs in Medicine: Sjogrens Syndrome and Scleroderma (Module 438)." };
    }
    if (hasQA('hyperuricemia') && hasText('antihypertensives')) {
      return { toModule: 161, reason: "Tests thiazide diuretic metabolic side effects (hyperuricemia), belongs in Pharmacology: Cardiovascular Drugs (Module 161)." };
    }
    if (hasQA('rifampicin decreases the efficacy of oral contraceptives')) {
      return { toModule: 153, reason: "Tests CYP3A4 hepatic enzyme induction by rifampicin interacting with oral contraceptives, belongs in Pharmacology: General Pharmacology & Drug Interactions (Module 153)." };
    }
    if (hasQA('diffuse proliferative glomerulonephritis') || (hasText('lupus nephritis') && has('deposits'))) {
      return { toModule: 450, reason: "Tests class IV diffuse proliferative lupus nephritis histopathology and immunofluorescence, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('membranous glomerulonephritis') && hasText('hepatitis b')) {
      return { toModule: 450, reason: "Tests hepatitis B-associated membranous nephropathy, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('sickle cell anemia') && hasText('renal vein thrombosis')) {
      return { toModule: 450, reason: "Tests secondary causes and associations of renal vein thrombosis in nephrotic syndrome, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('iga nephropathy') || hasQA('berger')) {
      return { toModule: 450, reason: "Tests IgA nephropathy (Berger disease) presentation with recurrent hematuria, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('oliguria is defined as')) {
      return { toModule: 450, reason: "Tests quantitative definition of oliguria (<400 mL/24 hr) in acute kidney injury, belongs in Medicine: Acute Kidney Injury (Module 450)." };
    }
    if (hasQA('falciparum malaria') && hasText('renal failure')) {
      return { toModule: 215, reason: "Tests Plasmodium falciparum blackwater fever and acute tubular necrosis, belongs in Microbiology: Protozoology - Malaria (Module 215)." };
    }
    if (hasQA('mr with as') && hasText('continuous murmur')) {
      return { toModule: 458, reason: "Tests cardiovascular physical examination differential of continuous murmurs, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('sepsis-3') || hasQA('sofa points')) {
      return { toModule: 483, reason: "Tests Sepsis-3 diagnostic criteria using sequential organ failure assessment (SOFA), belongs in Surgery: Shock & Critical Care (Module 483)." };
    }
    if (hasQA('methyldopa') && hasText('pregnant')) {
      return { toModule: 539, reason: "Tests antihypertensive therapy in pregnancy (methyldopa), belongs in Obstetrics: Hypertensive Disorders of Pregnancy (Module 539)." };
    }
    if (hasQA('aspirin') && hasText('bioprosthetic aortic valve')) {
      return { toModule: 458, reason: "Tests antithrombotic regimens following bioprosthetic valve replacement, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('xerostomia') && hasText('radiation therapy to the head and neck')) {
      return { toModule: 657, reason: "Tests complications of radiotherapy to salivary glands (radiation xerostomia), belongs in Radiology: Radiotherapy Principles (Module 657)." };
    }
    if (hasQA('implantable cardiac defibrillator') || (hasText('myocardial infarction') && hasText('syncope'))) {
      return { toModule: 457, reason: "Tests secondary prevention of sudden cardiac death with ICD, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks (Module 457)." };
    }
    if (hasQA('stop warfarin and start intravenous heparin') && hasText('aortic valve replacement')) {
      return { toModule: 458, reason: "Tests anticoagulation reversal and bridging in embolic stroke with mechanical valve, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('dorsal columns') && hasText('pernicious anemia')) {
      return { toModule: 471, reason: "Tests subacute combined degeneration of the spinal cord dorsal and lateral columns, belongs in Medicine: Spinal Cord Disorders (Module 471)." };
    }
    if (hasQA('mibg') || (hasText('panic attacks') && hasText('palpitations') && hasText('sweating'))) {
      return { toModule: 413, reason: "Tests pheochromocytoma anatomical localization with 123I/131I-MIBG scintigraphy, belongs in Medicine: General Principles of Endocrinology (Module 413)." };
    }
  }

  // Module 454: Renal Tubular Diseases of Kidney
  // Questions in 454 that are NOT renal tubular disorders (RTA, Bartter, Gitelman, Fanconi):
  if (cur === 454) {
    if (hasQA('renal sodium excretion is likely to be normal') && hasText('depression')) {
      return { toModule: 416, reason: "Tests psychogenic polydipsia vs SIADH urinary sodium dynamics, belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus (Module 416)." };
    }
    if (hasQA('high adh, high aldosterone, high renin') && hasText('urinary stream')) {
      return { toModule: 450, reason: "Tests neurohumoral activation in post-renal bilateral urinary outflow obstruction, belongs in Medicine: Acute Kidney Injury (Module 450)." };
    }
    if (hasQA('basement membrane thickening and mesangial widening') || hasText('kimmelstiel-wilson')) {
      return { toModule: 422, reason: "Tests diabetic glomerulosclerosis histopathology (Kimmelstiel-Wilson nodules), belongs in Medicine: Diabetes Mellitus - Complications (Module 422)." };
    }
    if (hasQA('amyloidosis') && (hasText('nephrotic') || hasText('congo red'))) {
      return { toModule: 450, reason: "Tests renal amyloidosis apple-green birefringence and nephrotic proteinuria, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('cmv') && hasText('renal transplant')) {
      return { toModule: 452, reason: "Tests cytomegalovirus opportunistic infection following kidney transplantation, belongs in Medicine: Renal Replacement Therapy (Module 452)." };
    }
    if (hasQA('mesangial deposits of iga') || hasQA('henoch')) {
      return { toModule: 437, reason: "Tests IgA vasculitis (Henoch-Schonlein purpura) renal and cutaneous manifestations, belongs in Medicine: Small vessel vasculitis (Module 437)." };
    }
    if (hasQA('sub acute bacterial endocarditis') || hasQA('bacterial endocarditis')) {
      return { toModule: 458, reason: "Tests infective endocarditis complications in intravenous drug users, belongs in Medicine: Vascular Heart Diseases / Infective Endocarditis (Module 458)." };
    }
    if (hasQA('renal tract tuberculosis') || (hasText('sterile pyuria') && hasText('tuberculosis'))) {
      return { toModule: 512, reason: "Tests genitourinary tuberculosis pathology and sterile pyuria, belongs in Surgery: Urology - Genitourinary Infections (Module 512)." };
    }
    if (hasQA('loss of tubular cells') && hasText('thrombolysed')) {
      return { toModule: 450, reason: "Tests acute tubular necrosis histopathology following cardiogenic shock, belongs in Medicine: Acute Kidney Injury (Module 450)." };
    }
    if (hasQA('mesangiocapillary glomerulonephritis') || hasQA('membranoproliferative')) {
      return { toModule: 450, reason: "Tests MPGN nephritic-nephrotic syndrome histopathology, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('acute renal allograft rejection') && hasText('transplantation')) {
      return { toModule: 452, reason: "Tests acute cellular and antibody-mediated allograft rejection surveillance, belongs in Medicine: Renal Replacement Therapy (Module 452)." };
    }
    if (hasQA('phospholipase a2') || (has('pla2r') && has('membranous'))) {
      return { toModule: 450, reason: "Tests primary membranous nephropathy anti-PLA2R autoantibody diagnostics, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('anderson fabry') || hasQA('fabry disease')) {
      return { toModule: 574, reason: "Tests alpha-galactosidase A deficiency (Fabry disease) lysosomal storage, belongs in Pediatrics: Inborn Errors of Metabolism (Module 574)." };
    }
    if (hasQA('uric acid stone') || hasQA('radiolucent stone')) {
      return { toModule: 513, reason: "Tests uric acid nephrolithiasis and urinary alkalinization, belongs in Surgery: Urology - Urinary Calculi (Module 513)." };
    }
    if (hasQA('von hippel lindau') || hasQA('clear cell rcc')) {
      return { toModule: 514, reason: "Tests von Hippel-Lindau disease renal cysts and renal cell carcinoma, belongs in Surgery: Urology - Genitourinary Tumours (Module 514)." };
    }
    if (hasQA('muscle') && hasText('insulin is essential for glucose entry')) {
      return { toModule: 108, reason: "Tests insulin regulation of GLUT4 translocation in skeletal muscle and adipose tissue, belongs in Physiology: Endocrine Physiology (Module 108)." };
    }
    if (hasQA('na cotransport') && hasText('glucose is transported in renal tubular')) {
      return { toModule: 106, reason: "Tests secondary active transport via sodium-glucose cotransporter (SGLT2), belongs in Physiology: Renal Physiology (Module 106)." };
    }
    if (hasQA('continue cpr while the aed is being attached') || hasQA('cpr')) {
      return { toModule: 483, reason: "Tests cardiopulmonary resuscitation (CPR) and AED deployment algorithms, belongs in Surgery: Shock, Resuscitation & Trauma (Module 483)." };
    }
    if (hasQA('microcytic hypochromic anemia') && hasText('ileal resection')) {
      return { toModule: 435, reason: "Tests post-resection malabsorption syndromes, belongs in Medicine: Malabsorption Syndrome (Module 435)." };
    }
    if (hasQA('fibromuscular dysplasia')) {
      return { toModule: 458, reason: "Tests fibromuscular dysplasia renovascular hypertension in young females, belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('glut2') && hasText('beta cell')) {
      return { toModule: 122, reason: "Tests glucose sensing and transport into pancreatic beta cells via GLUT2, belongs in Biochemistry: Carbohydrate Metabolism (Module 122)." };
    }
  }

  // Module 412: Acid-Base Disorders
  // Questions in 412 that are NOT acid-base:
  if (cur === 412) {
    if (hasQA('anemic') && hasText('cyanosis')) {
      return { toModule: 105, reason: "Tests hypoxia and cyanosis physiological mechanisms, belongs in Physiology: Respiratory Physiology (Module 105)." };
    }
    if (hasQA('azathioprine') && hasText('pancreatitis')) {
      return { toModule: 165, reason: "Tests immunosuppressant drug adverse reactions (azathioprine-induced acute pancreatitis), belongs in Pharmacology: Immunopharmacology (Module 165)." };
    }
    if (hasQA('uric acid excretion is reflected in serum uric acid levels')) {
      return { toModule: 125, reason: "Tests purine metabolism and uric acid excretion kinetics, belongs in Biochemistry: Nucleotide Metabolism (Module 125)." };
    }
    if (hasQA('alt of 350 u/l') && hasText('pancreatitis')) {
      return { toModule: 494, reason: "Tests acute gallstone pancreatitis diagnostic criteria and liver enzyme elevation, belongs in Surgery: Pancreas (Module 494)." };
    }
    if (hasQA('stage iva: t1n2cm0') || hasText('lateral border of tongue')) {
      return { toModule: 485, reason: "Tests oral cavity squamous cell carcinoma TNM staging, belongs in Surgery: Oral Cavity & Salivary Glands (Module 485)." };
    }
    if (hasQA('chloride') && hasText('pct')) {
      return { toModule: 106, reason: "Tests tubular reabsorption along proximal convoluted tubule, belongs in Physiology: Renal Physiology (Module 106)." };
    }
    if (hasQA('gastrin') || hasQA('prostaglandins') && hasText('gastric acid')) {
      return { toModule: 107, reason: "Tests physiological regulation of gastric parietal cell acid secretion, belongs in Physiology: Gastrointestinal Physiology (Module 107)." };
    }
    if (hasQA('folate deficiency') && hasText('software engineer')) {
      return { toModule: 435, reason: "Tests nutritional megaloblastic anemia from dietary folate deficiency, belongs in Medicine: Malabsorption Syndrome (Module 435)." };
    }
    if (hasQA('medullary thyroid carcinoma')) {
      return { toModule: 418, reason: "Tests calcitonin-secreting medullary thyroid carcinoma, belongs in Medicine: Thyroid Disorders - Clinical Features (Module 418)." };
    }
    if (hasQA('perineum and leg') && hasText('sagittal section of the brain')) {
      return { toModule: 109, reason: "Tests anterior cerebral artery motor homunculus distribution, belongs in Physiology: Central Nervous System (Module 109)." };
    }
    if (hasQA('indirect van den bergh') && hasText('hemolytic anemia')) {
      return { toModule: 425, reason: "Tests unconjugated hyperbilirubinemia in hemolytic states, belongs in Medicine: Hyperbilirubinemia and Functions of Liver (Module 425)." };
    }
    if (hasQA('2d echo') && hasText('mitral stenosis')) {
      return { toModule: 455, reason: "Tests echocardiographic evaluation of rheumatic mitral stenosis, belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('50% of boys of carrier mother are affected')) {
      return { toModule: 129, reason: "Tests Mendelian inheritance patterns of X-linked recessive genetic disorders, belongs in Biochemistry: Molecular Biology & Genetics (Module 129)." };
    }
    if (hasQA('hemispatial neglect') || hasText('face of a clock')) {
      return { toModule: 464, reason: "Tests non-dominant parietal lobe lesions causing hemispatial neglect, belongs in Medicine: Cerebral Neurology: Dementia, Death and Coma (Module 464)." };
    }
    if (hasQA('pcos') || hasQA('polycystic ovary')) {
      return { toModule: 423, reason: "Tests polycystic ovarian syndrome etiology of chronic anovulation, belongs in Medicine: Reproductive Endocrinology (Module 423)." };
    }
    if (hasQA('epsilon amino caproic acid')) {
      return { toModule: 160, reason: "Tests antifibrinolytic pharmacology (epsilon-aminocaproic acid / tranexamic acid), belongs in Pharmacology: Drugs Acting on Blood (Module 160)." };
    }
    if (hasQA('permanent pacemaker') && hasText('inferior-wall')) {
      return { toModule: 457, reason: "Tests complete heart block indications for permanent pacemaker implantation, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks (Module 457)." };
    }
    if (hasQA('control of fever') && hasText('febrile convulsion')) {
      return { toModule: 577, reason: "Tests management of simple febrile seizures in pediatrics, belongs in Pediatrics: Pediatric Neurology (Module 577)." };
    }
    if (hasQA('clubbing') || hasText('clinical sign shown in the image')) {
      return { toModule: 446, reason: "Tests physical examination signs in chronic respiratory disease, belongs in Medicine: Pulmonary Function Tests & Signs (Module 446)." };
    }
    if (hasQA('thoracic mass') && (hasText('white-out lung') || hasText('contralateral tracheal deviation'))) {
      return { toModule: 448, reason: "Tests radiological white-out hemithorax differential diagnosis, belongs in Medicine: Neoplasms of the Lung (Module 448)." };
    }
    if (hasQA('blood culture') && hasText('enteric fever')) {
      return { toModule: 213, reason: "Tests laboratory diagnosis of Salmonella enterica serotype Typhi in the first week, belongs in Microbiology: Enterobacteriaceae (Module 213)." };
    }
    if (hasQA('5-6 mg/dl') && hasText('uric acid lowering agent in gout')) {
      return { toModule: 164, reason: "Tests target serum urate levels in chronic gout management, belongs in Pharmacology: Drugs for Gout (Module 164)." };
    }
    if (hasQA('propranolol') && hasText('overdose')) {
      return { toModule: 262, reason: "Tests beta-blocker overdose clinical toxicology and glucagon therapy, belongs in Forensic Medicine: Toxicology (Module 262)." };
    }
    if (hasQA('loud s1') && (hasText('chest pain') || hasText('mitral stenosis'))) {
      return { toModule: 455, reason: "Tests cardiac auscultatory findings, belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('silica') && hasText('miner')) {
      return { toModule: 444, reason: "Tests silicosis pneumoconiosis occupational lung disease, belongs in Medicine: Interstitial Lung Diseases and Sarcoidosis (Module 444)." };
    }
    if (hasQA('postural drainage') && hasText('bronchiectasis')) {
      return { toModule: 445, reason: "Tests chest physiotherapy and airway clearance in bronchiectasis, belongs in Medicine: Bronchiectasis and Lung Abscess (Module 445)." };
    }
    if (hasQA('rbcs in urine') && hasText('psgn')) {
      return { toModule: 450, reason: "Tests acute post-streptococcal glomerulonephritis urinary sediment findings, belongs in Medicine: Acute Kidney Injury (Module 450)." };
    }
    if (hasQA('adenosine') && hasText('svt')) {
      return { toModule: 456, reason: "Tests acute termination of paroxysmal supraventricular tachycardia with intravenous adenosine, belongs in Medicine: Supraventricular Arrhythmias (Module 456)." };
    }
    if (hasQA('normal sinus rhythm') || (hasText('rhythm strip') && hasText('sinus'))) {
      return { toModule: 455, reason: "Tests baseline surface electrocardiographic interpretation, belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('bundle of his') || hasQA('his bundle electrogram')) {
      return { toModule: 455, reason: "Tests electrophysiologic HV interval measurement, belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('ventricular bigeminy')) {
      return { toModule: 457, reason: "Tests ventricular bigeminy ectopy on electrocardiography, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks (Module 457)." };
    }
    if (hasQA('tof') || hasQA('tetralogy of fallot')) {
      return { toModule: 567, reason: "Tests tetralogy of Fallot cyanotic spells and boot-shaped heart on CXR, belongs in Pediatrics: Pediatric Cardiology (Module 567)." };
    }
    if (hasQA('primary raynaud') || hasQA("raynaud's phenomenon")) {
      return { toModule: 458, reason: "Tests vasospastic peripheral vascular disorders (Raynaud phenomenon), belongs in Medicine: Vascular Heart Diseases (Module 458)." };
    }
    if (hasQA('ganglion cyst')) {
      return { toModule: 610, reason: "Tests wrist ganglion cyst anatomy and clinical diagnosis, belongs in Orthopedics: Hand & Wrist (Module 610)." };
    }
    if (hasQA('anterior wall') && hasText('myocardium')) {
      return { toModule: 459, reason: "Tests anterior wall myocardial infarction ECG localization (V1-V4), belongs in Medicine: Ischemic Heart Disease - Presentation and Diagnosis (Module 459)." };
    }
    if (hasQA('primary angioplasty') && hasText('stemi')) {
      return { toModule: 460, reason: "Tests primary percutaneous coronary intervention (PCI) in acute STEMI, belongs in Medicine: Ischemic Heart Disease - Complications and Management (Module 460)." };
    }
    if (hasQA('nephrotic syndrome') && (hasText('palpitations') || hasText('weight loss'))) {
      return { toModule: 450, reason: "Tests systemic features and complications of nephrotic syndrome, belongs in Medicine: Acute Kidney Injury & Glomerular Diseases (Module 450)." };
    }
    if (hasQA('d-b-a-c') && hasText('iron toxicity')) {
      return { toModule: 262, reason: "Tests acute iron poisoning clinical stages, belongs in Forensic Medicine: Toxicology (Module 262)." };
    }
    if (hasQA('autosomal dominant') && hasText('hocm')) {
      return { toModule: 461, reason: "Tests hypertrophic cardiomyopathy sarcomeric mutations and autosomal dominant inheritance, belongs in Medicine: Cardiomyopathy and Myocarditis (Module 461)." };
    }
    if (hasQA('occipital lobe') && hasText('visual field')) {
      return { toModule: 109, reason: "Tests cortical retinotopic organization of the primary visual cortex in the occipital lobe, belongs in Physiology: Central Nervous System (Module 109)." };
    }
    if (hasQA('diarrhea & memory problems') && hasText('pellagra')) {
      return { toModule: 126, reason: "Tests niacin deficiency (pellagra 4Ds: diarrhea, dermatitis, dementia, death), belongs in Biochemistry: Vitamins (Module 126)." };
    }
    if (hasQA('artesunate') && hasText('cerebral malaria')) {
      return { toModule: 166, reason: "Tests severe falciparum malaria treatment with intravenous artesunate, belongs in Pharmacology: Antimalarial Drugs (Module 166)." };
    }
    if (hasQA('anterior cerebral artery') && hasText('weakness')) {
      return { toModule: 473, reason: "Tests anterior cerebral artery stroke cortical localization (contralateral leg > arm weakness), belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('heparin') && hasText('seizure') && hasText('dural sinus')) {
      return { toModule: 473, reason: "Tests cerebral venous sinus thrombosis anticoagulation with heparin, belongs in Medicine: Cerebrovascular Disease (Module 473)." };
    }
    if (hasQA('lithium') && hasText('overdose')) {
      return { toModule: 262, reason: "Tests acute lithium toxicity and dialytic clearance, belongs in Forensic Medicine: Toxicology (Module 262)." };
    }
    if (hasQA('umn') && hasText('ankle jerk')) {
      return { toModule: 109, reason: "Tests hyperreflexia and upper motor neuron lesion signs, belongs in Physiology: Central Nervous System (Module 109)." };
    }
    if (hasQA('babinski sign')) {
      return { toModule: 109, reason: "Tests extensor plantar response (Babinski sign) neurophysiology, belongs in Physiology: Central Nervous System (Module 109)." };
    }
    if (hasQA('lower motor neuron (lmn) lesion on the right side') || hasText('bell palsy')) {
      return { toModule: 472, reason: "Tests Bell's palsy lower motor neuron seventh cranial nerve palsy, belongs in Medicine: Cranial Nerve Disorders (Module 472)." };
    }
    if (hasQA('j-wave') || hasQA('osborn wave')) {
      return { toModule: 455, reason: "Tests hypothermia electrocardiographic changes (Osborn / J wave), belongs in Medicine: Diagnosis of cardiovascular disorders (Module 455)." };
    }
    if (hasQA('nmr spectroscopy')) {
      return { toModule: 121, reason: "Tests analytical techniques in molecular medicine (NMR spectroscopy), belongs in Biochemistry: Biochemical Techniques (Module 121)." };
    }
  }

  return null;
}

let extraMoves = 0;
const newMoves = [];
unflaggedTargets.forEach(q => {
  const move = classifyRemaining(q);
  if (move && move.toModule !== q.module_id) {
    extraMoves++;
    newMoves.push({
      id: q.id,
      fromModule: q.module_id,
      toModule: move.toModule,
      reason: move.reason
    });
  }
});

console.log(`Discovered ${extraMoves} additional verified moves from targeted modules!`);
fs.writeFileSync('tools/target_additional_moves.json', JSON.stringify(newMoves, null, 2));
