const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

// Clean text helper
function cleanText(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

// We define specialized rule matchers
const rules = [
  // ==================== OTHER SUBJECTS ====================
  // PHARMACOLOGY
  {
    targetMod: 236, // Diuretics
    name: 'Diuretics Pharmacology',
    match: (q, text) => (text.includes('acetazolamide') || text.includes('furosemide') || text.includes('thiazide') || text.includes('spironolactone')) &&
      (text.includes('mechanism of action') || text.includes('diuretic') || text.includes('inhibits carbonic anhydrase')),
    reason: 'Diuretic pharmacology and mechanism of action -> Pharmacology (Mod 236: Diuretics)'
  },
  {
    targetMod: 265, // Anticancer Drugs
    name: 'Anticancer Drugs',
    match: (q, text) => (text.includes('methotrexate') || text.includes('cisplatin') || text.includes('doxorubicin') || text.includes('cyclophosphamide') || text.includes('vincristine') || text.includes('paclitaxel')) &&
      (text.includes('mechanism of action') || text.includes('adverse effect') || text.includes('toxicity') || text.includes('acts by inhibiting') || text.includes('resistance')),
    reason: 'Anticancer chemotherapy mechanism of action and toxicities -> Pharmacology (Mod 265: Anticancer Drugs)'
  },
  {
    targetMod: 240, // Drugs Affecting Coagulation / Bleeding
    name: 'Anticoagulants / Antiplatelets Pharm',
    match: (q, text) => (text.includes('warfarin') || text.includes('heparin') || text.includes('dabigatran') || text.includes('rivaroxaban') || text.includes('clopidogrel')) &&
      (text.includes('antidote') || text.includes('mechanism of action') || text.includes('inr monitoring') || text.includes('protamine')),
    reason: 'Anticoagulant and antiplatelet pharmacology and antidotes -> Pharmacology (Mod 240: Drugs Affecting Coagulation)'
  },
  {
    targetMod: 228, // Cholinergic / Anticholinergic
    name: 'Autonomic Pharm',
    match: (q, text) => (text.includes('atropine') || text.includes('pilocarpine') || text.includes('organophosphate poisoning')) &&
      (text.includes('antidote') || text.includes('pralidoxime') || text.includes('muscarinic receptor') || text.includes('atropine toxicity')),
    reason: 'Autonomic pharmacology and toxicology -> Pharmacology (Mod 228)'
  },

  // MICROBIOLOGY
  {
    targetMod: 191, // Morphology and Physiology of Bacteria
    name: 'Bacterial Morphology/Staining Micro',
    match: (q, text) => (text.includes('gram staining') || text.includes('culture medium') || text.includes('macconkey') || text.includes('blood agar') || text.includes('lowenstein-jensen') || text.includes('robertson cooked meat')) &&
      !text.includes('histopathology') && !text.includes('biopsy shows'),
    reason: 'Bacterial culture media and staining techniques -> Microbiology (Mod 191)'
  },
  {
    targetMod: 218, // Intestinal Protozoa / Nematodes
    name: 'Parasitology Micro',
    match: (q, text) => (text.includes('entamoeba histolytica') || text.includes('giardia lamblia') || text.includes('ascaris lumbricoides') || text.includes('taenia solium') || text.includes('echinococcus granulosus')) &&
      (text.includes('trophozoite') || text.includes('cyst morphology') || text.includes('intermediate host') || text.includes('definitive host') || text.includes('rhabditiform larva')),
    reason: 'Parasitic life cycles, cyst morphology, and intermediate hosts -> Microbiology (Parasitology)'
  },

  // SURGERY / ORTHOPAEDICS / OPHTHALMOLOGY / FORENSIC / PEDIATRICS
  {
    targetMod: 661, // Injuries of Elbow and Forearm
    name: 'Volkmann Contracture',
    match: (q, text) => text.includes('volkmann') && (text.includes('contracture') || text.includes('brachial artery')),
    reason: "Volkmann's ischemic contracture following supracondylar fracture/brachial artery injury -> Orthopaedics (Mod 661: Injuries of Elbow and Forearm)"
  },
  {
    targetMod: 347, // Optic Nerve
    name: 'Bilateral Optic Atrophy',
    match: (q, text) => text.includes('optic atrophy') && text.includes('bilateral'),
    reason: 'Bilateral optic atrophy etiology -> Ophthalmology (Mod 347: Optic Nerve)'
  },
  {
    targetMod: 330, // Diseases of Eyelids
    name: 'Eyelid Tumors',
    match: (q, text) => text.includes('eyelid') && text.includes('malignant tumour'),
    reason: 'Malignant tumours of the eyelid -> Ophthalmology (Mod 330: Diseases of Eyelids)'
  },
  {
    targetMod: 579, // Neonatal Disorders
    name: 'Bronchopulmonary Dysplasia',
    match: (q, text) => text.includes('bronchopulmonary dysplasia') && text.includes('definition'),
    reason: 'Bronchopulmonary dysplasia in preterm neonates -> Pediatrics (Mod 579: Neonatal Disorders)'
  },
  {
    targetMod: 503, // Intestinal Obstruction
    name: 'Volvulus Parrot Beak',
    match: (q, text) => text.includes('parrot beak') && text.includes('volvulus'),
    reason: 'Volvulus and radiological signs -> Surgery (Mod 503: Intestinal Obstruction)'
  },

  // ==================== INTRA-PATHOLOGY MOVES ====================
  // CNS Pathology (Mod 188)
  {
    targetMod: 188,
    name: 'CNS Pathology',
    fromExclude: [188],
    match: (q, text) => (
      (text.includes('spongiform degeneration') || text.includes('creutzfeldt-jakob') || text.includes('prion disease')) ||
      (text.includes('diffuse axonal injury') || text.includes('axonal shearing')) ||
      (text.includes('red neurons') && text.includes('hypoglycemic') && text.includes('hippocampus')) ||
      (text.includes('bacterial meningitis') && text.includes('csf findings') && text.includes('polymorphs')) ||
      (text.includes('epidural hematoma') || text.includes('subdural hematoma') || text.includes('subarachnoid hemorrhage')) ||
      (text.includes('negri bodies') || text.includes('rabies')) ||
      (text.includes('liquefactive necrosis') && text.includes('brain infarct') && text.includes('cerebral'))
    ),
    reason: 'Neuropathology, traumatic brain injury, prion disease, meningitis, or cerebral stroke -> CNS Pathology (Mod 188)'
  },

  // Skin Pathology (Mod 187)
  {
    targetMod: 187,
    name: 'Skin Pathology',
    fromExclude: [187],
    match: (q, text) => (
      (text.includes('actinic keratosis') && text.includes('dysplasia')) ||
      (text.includes('tzanck smear') && text.includes('multinucleated giant cells')) ||
      (text.includes('pemphigus vulgaris') || text.includes('bullous pemphigoid') || text.includes('acantholysis')) ||
      (text.includes('psoriasis') && (text.includes('munro') || text.includes('auspitz') || text.includes('rete ridges'))) ||
      (text.includes('lichen planus') && (text.includes('wickham') || text.includes('saw-tooth') || text.includes('civatte'))) ||
      (text.includes('malignant melanoma') && (text.includes('breslow') || text.includes('clark level') || text.includes('hmb-45'))) ||
      (text.includes('basal cell carcinoma') && (text.includes('peripheral palisading') || text.includes('basaloid nests'))) ||
      (text.includes('pilomatricoma') || text.includes('ghost cells')) ||
      (text.includes('seborrheic keratosis') && text.includes('horn cyst'))
    ),
    reason: 'Cutaneous pathology and dermatopathology -> Skin Pathology (Mod 187)'
  },

  // Joints and Soft Tissue Tumors (Mod 186)
  {
    targetMod: 186,
    name: 'Joints and Soft Tissue Tumors',
    fromExclude: [186],
    match: (q, text) => (
      (text.includes('pigmented villonodular synovitis') || text.includes('tenosynovial giant cell')) ||
      (text.includes('liposarcoma') && (text.includes('lipoblast') || text.includes('mdm2'))) ||
      (text.includes('rhabdomyosarcoma') && (text.includes('myogenin') || text.includes('desmin') || text.includes('myod1'))) ||
      (text.includes('synovial sarcoma') && text.includes('t(x;18)')) ||
      (text.includes('gout') && (text.includes('monosodium urate') || text.includes('negatively birefringent') || text.includes('tophi'))) ||
      (text.includes('pseudogout') && (text.includes('calcium pyrophosphate') || text.includes('positively birefringent'))) ||
      (text.includes('osteoarthritis') && (text.includes('eburnation') || text.includes('osteophytes') || text.includes('heberden')))
    ),
    reason: 'Soft tissue neoplasia, synovial lesions, or joint arthropathies -> Joints and Soft Tissue Tumors (Mod 186)'
  },

  // Bone Tumors and Diseases (Mod 185)
  {
    targetMod: 185,
    name: 'Bone Pathology',
    fromExclude: [185],
    match: (q, text) => (
      (text.includes('giant cell tumor') && (text.includes('bone') || text.includes('epiphysis') || text.includes('osteoclastoma') || text.includes('knee joint') || text.includes('multinucleated giant cells interspersed'))) ||
      (text.includes('osteosarcoma') && (text.includes('codman') || text.includes('sunburst') || text.includes('osteoid'))) ||
      (text.includes('ewing sarcoma') && (text.includes('onion skin') || text.includes('t(11;22)') || text.includes('cd99'))) ||
      (text.includes('osteogenesis imperfecta') && text.includes('type 1 collagen')) ||
      (text.includes('paget disease of bone') && (text.includes('mosaic pattern') || text.includes('cement lines'))) ||
      (text.includes('osteomyelitis') && (text.includes('sequestrum') || text.includes('involucrum'))) ||
      (text.includes('osteopetrosis') && text.includes('erlenmeyer flask')) ||
      (text.includes('avascular necrosis') && text.includes('bone'))
    ),
    reason: 'Bone neoplasia, osteomyelitis, or metabolic/developmental bone diseases -> Bone Pathology (Mod 185)'
  },

  // Breast Pathology (Mod 184)
  {
    targetMod: 184,
    name: 'Breast Pathology',
    fromExclude: [184],
    match: (q, text) => (
      (text.includes('breast') && (text.includes('fibroadenoma') || text.includes('phyllodes') || text.includes('ductal carcinoma') || text.includes('lobular carcinoma') || text.includes('paget disease of nipple') || text.includes('comedocarcinoma') || text.includes('subareolar swelling'))) ||
      (text.includes('e-cadherin') && text.includes('lobular carcinoma') && text.includes('breast')) ||
      (text.includes('her2') && text.includes('breast carcinoma') && text.includes('trastuzumab'))
    ),
    reason: 'Benign and malignant breast lesions -> The Breast (Mod 184)'
  },

  // Thyroid Pathology (Mod 183)
  {
    targetMod: 183,
    name: 'Thyroid Pathology',
    fromExclude: [183],
    match: (q, text) => (
      (text.includes('papillary thyroid carcinoma') || text.includes('orphan annie') || text.includes('psammoma bodies') && text.includes('thyroid')) ||
      (text.includes('medullary thyroid carcinoma') || (text.includes('medullary carcinoma') && text.includes('thyroid')) || (text.includes('calcitonin') && text.includes('amyloid') && text.includes('thyroid'))) ||
      (text.includes('hashimoto thyroiditis') || text.includes('hurthle cell') || text.includes('de quervain thyroiditis')) ||
      (text.includes('follicular thyroid') || (text.includes('follicular carcinoma') && text.includes('capsular invasion') && text.includes('thyroid'))) ||
      (text.includes('graves disease') && text.includes('thyroid'))
    ),
    reason: 'Thyroid neoplasms and inflammatory thyroiditis -> Thyroid Glands (Mod 183)'
  },

  // Pituitary, Parathyroid and Endocrine Pancreas (Mod 182)
  {
    targetMod: 182,
    name: 'Endocrine Pathology',
    fromExclude: [182],
    match: (q, text) => (
      (text.includes('prolactinoma') || (text.includes('pituitary adenoma') && (text.includes('sella') || text.includes('galactorrhea')))) ||
      (text.includes('parathyroid gland') && (text.includes('clear cell') || text.includes('adenoma') || text.includes('hyperparathyroidism'))) ||
      (text.includes('insulinoma') || text.includes('gastrinoma') || text.includes('vipoma') || text.includes('glucagonoma')) ||
      (text.includes('craniopharyngioma') && (text.includes('rathke') || text.includes('motor oil') || text.includes('adamantinomatous'))) ||
      (text.includes('sheehan syndrome') && text.includes('pituitary necrosis'))
    ),
    reason: 'Pituitary, parathyroid, and endocrine pancreatic pathology -> Endocrine Pathology (Mod 182)'
  },

  // Lung Tumors (Mod 181)
  {
    targetMod: 181,
    name: 'Lung Tumors',
    fromExclude: [181],
    match: (q, text) => (
      (text.includes('lung') && (text.includes('adenocarcinoma') || text.includes('squamous cell carcinoma') || text.includes('small cell') || text.includes('oat cell') || text.includes('large cell') || text.includes('bronchogenic carcinoma') || text.includes('carcinoid tumour of lung'))) ||
      (text.includes('mesothelioma') && (text.includes('pleura') || text.includes('asbestos') || text.includes('calretinin'))) ||
      (text.includes('keratin pearls') && text.includes('lung') && text.includes('smoker')) ||
      (text.includes('pancoast tumor') || text.includes('superior sulcus tumor'))
    ),
    reason: 'Primary lung carcinomas and pleural mesothelioma -> Lung Tumors (Mod 181)'
  },

  // Obstructive and Restrictive Lung Diseases (Mod 180)
  {
    targetMod: 180,
    name: 'Obstructive & Restrictive Lung',
    fromExclude: [180],
    match: (q, text) => (
      (text.includes('silicosis') || text.includes('silicotic nodule') || text.includes('eggshell calcification')) ||
      (text.includes('asbestosis') && (text.includes('ferruginous bodies') || text.includes('asbestos bodies'))) ||
      (text.includes('emphysema') && (text.includes('centriacinar') || text.includes('panacinar') || text.includes('alpha-1 antitrypsin'))) ||
      (text.includes('bronchiectasis') && (text.includes('dilation of bronchi') || text.includes('kartagener'))) ||
      (text.includes('asthma') && (text.includes('curschmann spirals') || text.includes('charcot-leyden') || text.includes('airway remodeling'))) ||
      (text.includes('usual interstitial pneumonitis') || text.includes('idiopathic pulmonary fibrosis') || text.includes('honeycombing')) ||
      (text.includes('farmer lung') || text.includes('hypersensitivity pneumonitis')) ||
      (text.includes('sarcoidosis') && (text.includes('noncaseating granuloma') || text.includes('asteroid bodies') || text.includes('schaumann bodies')) && (text.includes('lung') || text.includes('hilar lymphadenopathy') || text.includes('ace')))
    ),
    reason: 'COPD, asthma, bronchiectasis, pneumoconiosis, and restrictive lung disease -> Obstructive and Restrictive Lung Diseases (Mod 180)'
  },

  // Lung Infections, ARDS, Congenital (Mod 179)
  {
    targetMod: 179,
    name: 'Lung Infections, ARDS',
    fromExclude: [179],
    match: (q, text) => (
      (text.includes('lobar pneumonia') && (text.includes('gray hepatization') || text.includes('red hepatization') || text.includes('stages of pneumonia'))) ||
      (text.includes('aspiration pneumonia')) ||
      (text.includes('ards') || text.includes('diffuse alveolar damage') || text.includes('hyaline membranes in alveoli')) ||
      (text.includes('covid-19') && text.includes('post-mortem') && text.includes('lung')) ||
      (text.includes('pulmonary tuberculosis') && (text.includes('ghon focus') || text.includes('ghon complex') || text.includes('ranke complex') || text.includes('cavitary tuberculosis') || text.includes('caseating granuloma') && text.includes('lung')))
    ),
    reason: 'Pneumonia stages, lung tuberculosis, ARDS, and lung infections -> Congenital Anomalies, ARDS, Infections (Mod 179)'
  },

  // Large Intestine Non-Neoplastic (Mod 178)
  {
    targetMod: 178,
    name: 'Large Intestine Non-Neoplastic',
    fromExclude: [178],
    match: (q, text) => (
      (text.includes('crohn disease') || text.includes("crohn's disease") || text.includes('ulcerative colitis')) &&
      (text.includes('skip lesions') || text.includes('cobblestone') || text.includes('crypt abscess') || text.includes('pseudopolyp') || text.includes('lead pipe') || text.includes('bloody diarrhea') || text.includes('transmural')) ||
      (text.includes('hirschsprung disease') && (text.includes('aganglionic') || text.includes('meissner') || text.includes('auerbach'))) ||
      (text.includes('diverticulosis') || text.includes('diverticulitis')) ||
      (text.includes('pseudomembranous colitis') && (text.includes('difficile') || text.includes('volcano lesion'))) ||
      (text.includes('juvenile polyp') && text.includes('rectal bleeding'))
    ),
    reason: 'Inflammatory bowel disease, Hirschsprung disease, diverticular disease, and colonic polyps -> Large Intestine - Non Neoplastic Conditions (Mod 178)'
  },

  // Small Intestine (Mod 177)
  {
    targetMod: 177,
    name: 'Small Intestine',
    fromExclude: [177],
    match: (q, text) => (
      (text.includes('celiac disease') && (text.includes('villous atrophy') || text.includes('intraepithelial lymphocytosis') || text.includes('anti-ttg') || text.includes('gliadin'))) ||
      (text.includes('whipple disease') && (text.includes('tropheryma') || text.includes('foamy macrophages') || text.includes('pas positive'))) ||
      (text.includes('carcinoid tumour') && (text.includes('enterochromaffin') || text.includes('neuroendocrine') || text.includes('flushing') || text.includes('5-hiaa') || text.includes('dense-core neurosecretory'))) ||
      (text.includes('meckel diverticulum')) ||
      (text.includes('intussusception') && text.includes('bowel'))
    ),
    reason: 'Small intestinal diseases, celiac disease, Whipple disease, and carcinoid tumors -> Small Intestine (Mod 177)'
  },

  // Stomach (Mod 176)
  {
    targetMod: 176,
    name: 'Stomach',
    fromExclude: [176],
    match: (q, text) => (
      (text.includes('gastric adenocarcinoma') || text.includes('gastric cancer') || text.includes('linitis plastica') || text.includes('signet ring cell') && text.includes('stomach')) ||
      (text.includes('gastrointestinal stromal tumor') || text.includes('gist') && (text.includes('c-kit') || text.includes('cd117') || text.includes('cajal') || text.includes('dog-1'))) ||
      (text.includes('peptic ulcer') && (text.includes('gastric') || text.includes('duodenal'))) ||
      (text.includes('autoimmune gastritis') || (text.includes('anti-parietal') && text.includes('pernicious anemia') && text.includes('stomach'))) ||
      (text.includes('helicobacter pylori') && text.includes('gastritis'))
    ),
    reason: 'Gastric adenocarcinoma, GIST, peptic ulcer, and gastritis -> Stomach (Mod 176)'
  },

  // Esophagus (Mod 175)
  {
    targetMod: 175,
    name: 'Esophagus',
    fromExclude: [175],
    match: (q, text) => (
      (text.includes('barrett esophagus') || (text.includes('barrett') && text.includes('intestinal metaplasia'))) ||
      (text.includes('achalasia') && (text.includes('bird beak') || text.includes('myenteric plexus'))) ||
      (text.includes('mallory-weiss') || text.includes('boerhaave')) ||
      (text.includes('esophageal varices')) ||
      (text.includes('esophageal carcinoma') || text.includes('squamous cell carcinoma of esophagus')) ||
      (text.includes('eosinophilic esophagitis'))
    ),
    reason: 'Esophageal pathology, Barrett esophagus, achalasia, and esophageal neoplasms -> Esophagus (Mod 175)'
  },

  // Gall Bladder and Pancreas (Mod 174)
  {
    targetMod: 174,
    name: 'Gall Bladder and Pancreas',
    fromExclude: [174],
    match: (q, text) => (
      (text.includes('acute pancreatitis') && (text.includes('fat necrosis') || text.includes('saponification') || text.includes('amylase') || text.includes('lipase'))) ||
      (text.includes('chronic pancreatitis') && (text.includes('calcification') || text.includes('fibrosis') || text.includes('autoimmune pancreatitis') || text.includes('igg4'))) ||
      (text.includes('gall stones') || text.includes('cholelithiasis') || text.includes('cholecystitis') || text.includes('porcelain gallbladder')) ||
      (text.includes('pancreatic adenocarcinoma') && (text.includes('ca 19-9') || text.includes('trousseau sign') || text.includes('head of pancreas')))
    ),
    reason: 'Pancreatitis, pancreatic adenocarcinoma, cholelithiasis, and gallbladder disease -> Gall Bladder and Pancreas (Mod 174)'
  },

  // Neoplasms of Liver and Biliary Tract (Mod 173)
  {
    targetMod: 173,
    name: 'Liver Neoplasms',
    fromExclude: [173],
    match: (q, text) => (
      (text.includes('focal nodular hyperplasia') || (text.includes('central stellate scar') && text.includes('liver'))) ||
      (text.includes('hepatocellular carcinoma') || text.includes('fibrolamellar carcinoma') || (text.includes('hcc') && text.includes('liver'))) ||
      (text.includes('hepatic adenoma') && (text.includes('oral contraceptive') || text.includes('subcapsular'))) ||
      (text.includes('cholangiocarcinoma') && (text.includes('klatskin') || text.includes('biliary tract'))) ||
      (text.includes('angiosarcoma of liver') && (text.includes('vinyl chloride') || text.includes('thorotrast')))
    ),
    reason: 'Liver neoplasms, hepatocellular carcinoma, and focal nodular hyperplasia -> Neoplasms of Liver and Biliary Tract (Mod 173)'
  },

  // Autoimmune and Metabolic Liver Diseases (Mod 172)
  {
    targetMod: 172,
    name: 'Metabolic & Autoimmune Liver',
    fromExclude: [172],
    match: (q, text) => (
      (text.includes('primary biliary cholangitis') || text.includes('primary biliary cirrhosis') || (text.includes('antimitochondrial antibody') || text.includes('ama')) && text.includes('liver')) ||
      (text.includes('primary sclerosing cholangitis') || (text.includes('onion skin') && text.includes('bile duct') || text.includes('periductal fibrosis'))) ||
      (text.includes('hemochromatosis') && (text.includes('hfe') || text.includes('iron overload') || text.includes('bronze diabetes') || text.includes('prussian blue'))) ||
      (text.includes('wilson disease') && (text.includes('atp7b') || text.includes('ceruloplasmin') || text.includes('kayser-fleischer'))) ||
      (text.includes('alpha-1 antitrypsin deficiency') && (text.includes('pas-positive diastase-resistant') || text.includes('pizz')))
    ),
    reason: 'Autoimmune liver diseases (PBC, PSC) and metabolic storage diseases (Wilson, Hemochromatosis, AAT) -> Autoimmune and Metabolic Liver Diseases (Mod 172)'
  },

  // Alcoholic and Infectious Liver Diseases (Mod 171)
  {
    targetMod: 171,
    name: 'Alcoholic & Viral Liver',
    fromExclude: [171],
    match: (q, text) => (
      (text.includes('hepatitis b') || text.includes('hbv') || text.includes('hbsag') || text.includes('ground glass hepatocyte')) ||
      (text.includes('hepatitis c') || text.includes('hcv')) ||
      (text.includes('alcoholic hepatitis') || (text.includes('mallory-denk') || text.includes('mallory bodies')) && text.includes('liver')) ||
      (text.includes('gamma-glutamyl transferase') && text.includes('alcohol-related')) ||
      (text.includes('councilman bodies') || text.includes('apoptotic bodies in liver'))
    ),
    reason: 'Viral hepatitis, alcoholic steatohepatitis, and cirrhosis -> Alcoholic and Infectious Liver Diseases (Mod 171)'
  },

  // Male Genital Tract (Mod 170)
  {
    targetMod: 170,
    name: 'Male Genital Tract',
    fromExclude: [170],
    match: (q, text) => (
      (text.includes('seminoma') || (text.includes('germ cell tumor') && (text.includes('testis') || text.includes('testicular') || text.includes('oct3/4') || text.includes('spermatocytic')))) ||
      (text.includes('prostate') && (text.includes('gleason') || text.includes('bph') || text.includes('prostatic adenocarcinoma') || text.includes('acinar adenocarcinoma'))) ||
      (text.includes('leydig cell tumor') && (text.includes('reinke') || text.includes('testis'))) ||
      (text.includes('penis') && (text.includes('squamous cell') || text.includes('quevrat') || text.includes('bowen')))
    ),
    reason: 'Testicular tumors, prostate carcinoma/BPH, and male genital pathology -> Male Genital Tract (Mod 170)'
  },

  // Female Genital Tract (Mod 169)
  {
    targetMod: 169,
    name: 'Female Genital Tract',
    fromExclude: [169],
    match: (q, text) => (
      (text.includes('pap smear') && (text.includes('cervical') || text.includes('cin') || text.includes('dysplasia') || text.includes('fixative'))) ||
      (text.includes('cervical intraepithelial neoplasia') || text.includes('cin-1') || text.includes('cin-2') || text.includes('cin-3')) ||
      (text.includes('ovary') && (text.includes('clear cell carcinoma') || text.includes('granulosa cell') || text.includes('call-exner') || text.includes('dysgerminoma') || text.includes('brenner tumor') || text.includes('serous cystadenoma') || text.includes('mucinous cystadenoma'))) ||
      (text.includes('endometrial hyperplasia') || text.includes('endometrial carcinoma') || text.includes('adenomyosis') || text.includes('endometriosis')) ||
      (text.includes('hydatidiform mole') || text.includes('choriocarcinoma') && text.includes('gestational'))
    ),
    reason: 'Cervical lesions (Pap/CIN), ovarian tumors, endometrial and uterine pathology -> Female Genital Tract (Mod 169)'
  },

  // Lower Urinary Tract (Mod 168)
  {
    targetMod: 168,
    name: 'Lower Urinary Tract',
    fromExclude: [168],
    match: (q, text) => (
      (text.includes('urinary bladder') && (text.includes('urothelial') || text.includes('transitional cell') || text.includes('schistosoma') || text.includes('diverticulum'))) ||
      (text.includes('malakoplakia') && (text.includes('michaelis-gutmann') || text.includes('bladder'))) ||
      (text.includes('interstitial cystitis') || text.includes('hunner ulcer'))
    ),
    reason: 'Urinary bladder carcinomas and cystitis -> Lower Urinary Tract (Mod 168)'
  },

  // Renal Tumors (Mod 167)
  {
    targetMod: 167,
    name: 'Renal Tumors',
    fromExclude: [167],
    match: (q, text) => (
      (text.includes('renal cell carcinoma') || text.includes('clear cell rcc') || (text.includes('rcc') && text.includes('kidney'))) ||
      (text.includes('wilms tumour') || text.includes("wilms' tumor") || text.includes('nephroblastoma')) ||
      (text.includes('oncocytoma') && (text.includes('kidney') || text.includes('mitochondria') || text.includes('stellate scar'))) ||
      (text.includes('angiomyolipoma') && (text.includes('kidney') || text.includes('tuberous sclerosis')))
    ),
    reason: 'Renal cell carcinoma, Wilms tumor, and renal neoplasms -> Renal Tumors (Mod 167)'
  },

  // Tubulointerstitial, Vascular and Cystic Diseases (Mod 166)
  {
    targetMod: 166,
    name: 'Tubulointerstitial & Cystic Renal',
    fromExclude: [166],
    match: (q, text) => (
      (text.includes('acute tubular necrosis') || (text.includes('atn') && text.includes('kidney')) || text.includes('muddy brown granular casts')) ||
      (text.includes('acute interstitial nephritis') || (text.includes('ain') && text.includes('eosinophils') && text.includes('urine'))) ||
      (text.includes('chronic pyelonephritis') && text.includes('thyroidization')) ||
      (text.includes('polycystic kidney') || text.includes('adpkd') || text.includes('arpkd')) ||
      (text.includes('renal papillary necrosis'))
    ),
    reason: 'ATN, interstitial nephritis, pyelonephritis, and polycystic kidneys -> Tubulointerstitial, Vascular and Cystic Diseases (Mod 166)'
  },

  // Glomerular Diseases (Mod 165)
  {
    targetMod: 165,
    name: 'Glomerular Diseases',
    fromExclude: [165],
    match: (q, text) => (
      (text.includes('minimal change disease') || text.includes('effacement of foot processes') || text.includes('nil disease')) ||
      (text.includes('membranous nephropathy') || text.includes('spike and dome') || text.includes('pla2r')) ||
      (text.includes('focal segmental glomerulosclerosis') || text.includes('fsgs')) ||
      (text.includes('post-streptococcal glomerulonephritis') || text.includes('psgn') || text.includes('subepithelial humps')) ||
      (text.includes('membranoproliferative glomerulonephritis') || text.includes('mpgn') || text.includes('splitting of gbm') || text.includes('tram-track')) ||
      (text.includes('iga nephropathy') || text.includes('berger disease')) ||
      (text.includes('rapidly progressive glomerulonephritis') || text.includes('rpgn') || text.includes('crescentic glomerulonephritis')) ||
      (text.includes('goodpasture syndrome') && text.includes('anti-gbm')) ||
      (text.includes('alport syndrome') && (text.includes('basket-weave') || text.includes('type iv collagen')))
    ),
    reason: 'Glomerular diseases, nephrotic/nephritic syndromes, and glomerulonephritis -> Glomerular Diseases (Mod 165)'
  },

  // Rheumatic Fever and Endocarditis (Mod 164)
  {
    targetMod: 164,
    name: 'Rheumatic Fever & Endocarditis',
    fromExclude: [164],
    match: (q, text) => (
      (text.includes('rheumatic fever') || text.includes('rheumatic heart disease') || text.includes('aschoff bodies') || text.includes('anitschkow') || text.includes('maccallum patch')) ||
      (text.includes('infective endocarditis') || (text.includes('vegetations') && text.includes('valve') && (text.includes('duke') || text.includes('janeway') || text.includes('osler') || text.includes('roth')))) ||
      (text.includes('libman-sacks endocarditis')) ||
      (text.includes('nonbacterial thrombotic endocarditis') || text.includes('nbte'))
    ),
    reason: 'Rheumatic heart disease, Aschoff nodules, and infective/nonbacterial endocarditis -> Rheumatic Fever and Endocarditis (Mod 164)'
  },

  // Congenital and Valvular Heart Disease (Mod 163)
  {
    targetMod: 163,
    name: 'Congenital & Valvular Heart',
    fromExclude: [163],
    match: (q, text) => (
      (text.includes('tetralogy of fallot') || text.includes('ventricular septal defect') || text.includes('vsd') && text.includes('heart') || text.includes('patent ductus arteriosus') || text.includes('coarctation of aorta')) ||
      (text.includes('calcific aortic stenosis') || text.includes('bicuspid aortic valve') || text.includes('mitral valve prolapse'))
    ),
    reason: 'Congenital cardiovascular defects and valvular heart diseases -> Congenital and Valvular Heart Disease (Mod 163)'
  },

  // Myocardial and Pericardial Diseases and Cardiac Tumors (Mod 162)
  {
    targetMod: 162,
    name: 'Cardiomyopathy, Pericardial, Cardiac Tumors',
    fromExclude: [162],
    match: (q, text) => (
      (text.includes('takotsubo cardiomyopathy') || text.includes('broken heart syndrome')) ||
      (text.includes('hypertrophic cardiomyopathy') || text.includes('hocm') || text.includes('myofiber disarray')) ||
      (text.includes('dilated cardiomyopathy') || text.includes('restrictive cardiomyopathy')) ||
      (text.includes('myocarditis') && (text.includes('coxsackie') || text.includes('chagas') || text.includes('giant cell myocarditis'))) ||
      (text.includes('pericarditis') && (text.includes('bread-and-butter') || text.includes('fibrinous pericarditis') || text.includes('constrictive pericarditis'))) ||
      (text.includes('cardiac myxoma') || (text.includes('myxoma') && text.includes('fossa ovalis'))) ||
      (text.includes('rhabdomyoma') && (text.includes('spider cells') || (text.includes('cardiac') && text.includes('tuberous sclerosis')))) ||
      (text.includes('papillary fibroelastoma'))
    ),
    reason: 'Cardiomyopathies, myocarditis, pericarditis, and cardiac tumors (myxoma/rhabdomyoma) -> Myocardial and Pericardial Diseases and Cardiac Tumors (Mod 162)'
  },

  // Heart Failure and Ischemic Heart Disease (Mod 161)
  {
    targetMod: 161,
    name: 'Heart Failure & IHD',
    fromExclude: [161],
    match: (q, text) => (
      (text.includes('myocardial infarction') && (text.includes('troponin') || text.includes('ck-mb') || text.includes('contraction band necrosis') || text.includes('timeline of mi') || text.includes('papillary muscle rupture') || text.includes('dressler syndrome'))) ||
      (text.includes('ischemic heart disease') || (text.includes('heart failure') && (text.includes('eccentric hypertrophy') || text.includes('concentric hypertrophy') || text.includes('nutmeg liver'))))
    ),
    reason: 'Myocardial infarction timeline/morphology, cardiac biomarkers, and heart failure -> Heart Failure and Ischemic Heart Disease (Mod 161)'
  },

  // Vascular Tumors (Mod 160)
  {
    targetMod: 160,
    name: 'Vascular Tumors',
    fromExclude: [160],
    match: (q, text) => (
      (text.includes('hemangioma') && (text.includes('capillary') || text.includes('cavernous') || text.includes('strawberry') || text.includes('soft to firm reddish swelling'))) ||
      (text.includes('kaposi sarcoma') && (text.includes('hhv-8') || text.includes('spindle cells') || text.includes('slit-like spaces'))) ||
      (text.includes('glomus tumor') && (text.includes('subungual') || text.includes('painful'))) ||
      (text.includes('angiosarcoma') && text.includes('cd31')) ||
      (text.includes('bacillary angiomatosis') && text.includes('bartonella'))
    ),
    reason: 'Hemangioma, Kaposi sarcoma, angiosarcoma, and vascular neoplasms -> Vascular Tumors (Mod 160)'
  },

  // Aneurysm and Dissection (Mod 159)
  {
    targetMod: 159,
    name: 'Aneurysm & Dissection',
    fromExclude: [159],
    match: (q, text) => (
      (text.includes('aortic dissection') || (text.includes('dissecting aneurysm') || text.includes('cystic medial necrosis') || text.includes('stanford type a') || text.includes('stanford type b'))) ||
      (text.includes('abdominal aortic aneurysm') || (text.includes('aaa') && text.includes('aorta')) || text.includes('syphilitic aneurysm') || text.includes('mycotic aneurysm'))
    ),
    reason: 'Aortic dissection and aortic aneurysms -> Aneurysm and Dissection (Mod 159)'
  },

  // Hypertensive Vascular Disease, Atherosclerosis, Vasculitis (Mod 158)
  {
    targetMod: 158,
    name: 'Hypertension, Atherosclerosis, Vasculitis',
    fromExclude: [158],
    match: (q, text) => (
      (text.includes('polyarteritis nodosa') || (text.includes('pan') && text.includes('fibrinoid necrosis') && (text.includes('artery') || text.includes('vessel') || text.includes('hbsag')))) ||
      (text.includes('giant cell arteritis') || text.includes('temporal arteritis') || text.includes('jaw claudication')) ||
      (text.includes('takayasu arteritis') || text.includes('pulseless disease')) ||
      (text.includes('kawasaki disease') || text.includes('mucocutaneous lymph node syndrome')) ||
      (text.includes('granulomatosis with polyangiitis') || text.includes('wegener granulomatosis') || text.includes('c-anca')) ||
      (text.includes('microscopic polyangiitis') || text.includes('p-anca')) ||
      (text.includes('churg-strauss') || text.includes('egpa')) ||
      (text.includes('thromboangiitis obliterans') || text.includes('buerger disease')) ||
      (text.includes('benign nephrosclerosis') || text.includes('hyaline arteriolosclerosis') || text.includes('hyaline arteriosclerosis')) ||
      (text.includes('malignant hypertension') && (text.includes('hyperplastic arteriolosclerosis') || text.includes('onion-skin') || text.includes('flea-bitten kidney'))) ||
      (text.includes('atherosclerosis') && (text.includes('fatty streak') || text.includes('atheromatous plaque') || text.includes('fibrous cap')))
    ),
    reason: 'Vasculitis (PAN, GCA, Takayasu, GPA), arteriolosclerosis, and atherosclerosis -> Hypertensive Vascular Disease and Atherosclerosis (Mod 158)'
  },

  // Leukemoid, Leukocytosis and Lymphadenitis (Mod 157)
  {
    targetMod: 157,
    name: 'Leukemoid & Lymphadenitis',
    fromExclude: [157],
    match: (q, text) => (
      (text.includes('leukemoid reaction') && (text.includes('lap score') || text.includes('nap score') || text.includes('dohle bodies') || text.includes('toxic granulation'))) ||
      (text.includes('kikuchi disease') || text.includes('histiocytic necrotizing lymphadenitis')) ||
      (text.includes('rosai-dorfman') || text.includes('sinus histiocytosis with massive lymphadenopathy') || text.includes('emperipolesis')) ||
      (text.includes('cat-scratch') && text.includes('lymphadenitis'))
    ),
    reason: 'Leukemoid reaction, reactive leukocytosis, and lymphadenitis -> Leukemoid, Leukocytosis and Lymphadenitis (Mod 157)'
  },

  // Myeloproliferative Neoplasms, MDS, Histiocytosis (Mod 156)
  {
    targetMod: 156,
    name: 'MPN, MDS, Histiocytosis',
    fromExclude: [156],
    match: (q, text) => (
      (text.includes('chronic myeloid leukemia') || text.includes('cml') && (text.includes('bcr-abl') || text.includes('philadelphia') || text.includes('lap score') || text.includes('t(9;22)'))) ||
      (text.includes('polycythemia vera') && (text.includes('jak2') || text.includes('panmyelosis') || text.includes('erythropoietin'))) ||
      (text.includes('essential thrombocythemia') && (text.includes('jak2') || text.includes('calr') || text.includes('platelets >'))) ||
      (text.includes('primary myelofibrosis') || (text.includes('myelofibrosis') && (text.includes('teardrop') || text.includes('dry tap') || text.includes('leucoerythroblastosis')))) ||
      (text.includes('myelodysplastic syndrome') || (text.includes('mds') && (text.includes('pelger-huet') || text.includes('ring sideroblasts')))) ||
      (text.includes('langerhans cell histiocytosis') || text.includes('histiocytosis x') || (text.includes('birbeck granules') || text.includes('cd1a') && text.includes('langerin')))
    ),
    reason: 'Myeloproliferative neoplasms (CML, PV, ET, PMF), MDS, and Langerhans cell histiocytosis -> MPN, MDS and Histiocytosis (Mod 156)'
  },

  // Multiple Myeloma and Plasma Cell Disorders (Mod 155)
  {
    targetMod: 155,
    name: 'Multiple Myeloma',
    fromExclude: [155],
    match: (q, text) => (
      (text.includes('multiple myeloma') || (text.includes('plasma cell') && (text.includes('bence jones') || text.includes('m spike') || text.includes('crab criteria') || text.includes('lytic bone lesions') || text.includes('dutcher bodies') || text.includes('mott cells') || text.includes('flame cells')))) ||
      (text.includes('waldenstrom macroglobulinemia') || text.includes('lymphoplasmacytic lymphoma') || text.includes('igm paraprotein')) ||
      (text.includes('mgus') || text.includes('monoclonal gammopathy of undetermined significance'))
    ),
    reason: 'Multiple myeloma, plasma cell dyscrasias, and monoclonal gammopathies -> Multiple Myeloma and Plasma Cell Disorders (Mod 155)'
  },

  // Non-Hodgkin Lymphomas: High Grade (Mod 154)
  {
    targetMod: 154,
    name: 'High Grade NHL',
    fromExclude: [154],
    match: (q, text) => (
      (text.includes('burkitt lymphoma') || (text.includes('burkitt') && (text.includes('starry sky') || text.includes('t(8;14)') || text.includes('c-myc')))) ||
      (text.includes('diffuse large b-cell lymphoma') || text.includes('dlbcl'))
    ),
    reason: 'Diffuse large B-cell lymphoma and Burkitt lymphoma -> Non Hodgkin Lymphomas: High Grade (Mod 154)'
  },

  // Non-Hodgkin Lymphomas: Low Grade (Mod 153)
  {
    targetMod: 153,
    name: 'Low Grade NHL',
    fromExclude: [153],
    match: (q, text) => (
      (text.includes('follicular lymphoma') && (text.includes('t(14;18)') || text.includes('bcl-2') || text.includes('centrocytes'))) ||
      (text.includes('chronic lymphocytic leukemia') || text.includes('cll') && (text.includes('smudge cells') || text.includes('cd5') || text.includes('cd23'))) ||
      (text.includes('mantle cell lymphoma') && (text.includes('t(11;14)') || text.includes('cyclin d1'))) ||
      (text.includes('marginal zone lymphoma') || text.includes('maltoma') && text.includes('t(11;18)')) ||
      (text.includes('hairy cell leukemia') && (text.includes('trap') || text.includes('braf') || text.includes('dry tap') || text.includes('fried egg')))
    ),
    reason: 'Follicular, CLL/SLL, Mantle cell, MALT, and Hairy cell lymphomas -> Non Hodgkin Lymphomas: Low Grade (Mod 153)'
  },

  // Hodgkin Lymphoma (Mod 152)
  {
    targetMod: 152,
    name: 'Hodgkin Lymphoma',
    fromExclude: [152],
    match: (q, text) => (
      (text.includes('hodgkin') && (text.includes('lymphoma') || text.includes('reed-sternberg') || text.includes('lacunar cell') || text.includes('cd15') || text.includes('cd30') || text.includes('popcorn cell'))) ||
      (text.includes('reed-sternberg cell') || text.includes('reed sternberg cell'))
    ),
    reason: 'Reed-Sternberg cells and Hodgkin lymphoma subtypes -> Hodgkin\'s Lymphoma (Mod 152)'
  },

  // Acute Myeloid Leukemia (Mod 151)
  {
    targetMod: 151,
    name: 'AML',
    fromExclude: [151],
    match: (q, text) => (
      (text.includes('acute myeloid leukemia') || text.includes('acute myelogenous leukemia') || text.includes('aml')) &&
      (text.includes('auer rod') || text.includes('myeloblast') || text.includes('mpo') || text.includes('sudan black') || text.includes('t(15;17)') || text.includes('pml-rara') || text.includes('atra') || text.includes('fab m')) ||
      (text.includes('auer rod') && (text.includes('leukemia') || text.includes('blast')))
    ),
    reason: 'Myeloblasts, Auer rods, and acute myeloid leukemia subtypes -> Acute Myeloid Leukemia (AML) (Mod 151)'
  },

  // Acute Lymphocytic Leukemia (Mod 150)
  {
    targetMod: 150,
    name: 'ALL',
    fromExclude: [150],
    match: (q, text) => (
      (text.includes('acute lymphoblastic leukemia') || text.includes('acute lymphocytic leukemia') || (text.includes('all') && (text.includes('lymphoblast') || text.includes('tdt') || text.includes('calla') || text.includes('cd10') || text.includes('pas block positivity') || text.includes('mediastinal mass') && text.includes('thymoma'))))
    ),
    reason: 'Lymphoblasts, TdT, CD10, and acute lymphoblastic leukemia -> Acute Lymphocytic Leukemia (ALL) (Mod 150)'
  },

  // Blood Products and Transfusion Reactions (Mod 149)
  {
    targetMod: 149,
    name: 'Blood Transfusion Reactions',
    fromExclude: [149],
    match: (q, text) => (
      (text.includes('blood transfusion') || text.includes('transfusion reaction') || text.includes('trali') || text.includes('taco') || text.includes('packed red blood cells') || text.includes('fresh frozen plasma') || text.includes('cryoprecipitate')) &&
      (text.includes('reaction') || text.includes('alloimmunization') || text.includes('febrile') || text.includes('hemolytic transfusion') || text.includes('storage') || text.includes('not true regarding trali'))
    ),
    reason: 'Blood banking, blood components, and transfusion reactions (TRALI, TACO, hemolytic) -> Blood Products and Transfusion Reactions (Mod 149)'
  },

  // Coagulation Pathway Disorders (Mod 148)
  {
    targetMod: 148,
    name: 'Coagulation Disorders',
    fromExclude: [148],
    match: (q, text) => (
      (text.includes('hemophilia a') || text.includes('hemophilia b') || (text.includes('factor viii') || text.includes('factor ix')) && text.includes('deficiency')) ||
      (text.includes('von willebrand disease') || (text.includes('vwd') || text.includes('vwf')) && (text.includes('ristocetin') || text.includes('multimer') || text.includes('endothelial cells') && text.includes('produces vwf'))) ||
      (text.includes('disseminated intravascular coagulation') || (text.includes('dic') && (text.includes('d-dimer') || text.includes('consumption coagulopathy') || text.includes('fibrin split')))) ||
      (text.includes('coagulation pathway') || text.includes('prothrombin time') || text.includes('activated partial thromboplastin') || text.includes('tissue factor') && text.includes('factor 7')) ||
      (text.includes('factor v leiden') || text.includes('antithrombin iii deficiency') || text.includes('protein c deficiency') || text.includes('antiphospholipid syndrome') && text.includes('thrombosis'))
    ),
    reason: 'Coagulation cascade, factor deficiencies (Hemophilia, vWD), DIC, and thrombophilia -> Coagulation Pathway Disorders (Mod 148)'
  },

  // Platelet Disorders (Mod 147)
  {
    targetMod: 147,
    name: 'Platelet Disorders',
    fromExclude: [147],
    match: (q, text) => (
      (text.includes('immune thrombocytopenic purpura') || text.includes('itp') && text.includes('anti-platelet')) ||
      (text.includes('thrombotic thrombocytopenic purpura') || text.includes('ttp') && text.includes('adamts13')) ||
      (text.includes('hemolytic uremic syndrome') || text.includes('hus') && text.includes('shiga')) ||
      (text.includes('bernard-soulier') || (text.includes('gp ib') && text.includes('platelet'))) ||
      (text.includes('glanzmann thrombasthenia') || (text.includes('gp iib/iiia') && text.includes('platelet aggregation'))) ||
      (text.includes('heparin-induced thrombocytopenia') || text.includes('hit'))
    ),
    reason: 'Thrombocytopenia, platelet membrane glycoprotein defects (Glanzmann, Bernard-Soulier), ITP, and TTP -> Platelet Disorders (Mod 147)'
  },

  // G6PD and AIHA (Mod 146)
  {
    targetMod: 146,
    name: 'G6PD & AIHA',
    fromExclude: [146],
    match: (q, text) => (
      (text.includes('g6pd deficiency') && (text.includes('heinz bodies') || text.includes('bite cells') || text.includes('oxidative'))) ||
      (text.includes('autoimmune hemolytic anemia') || text.includes('aiha') || (text.includes('coombs test') && text.includes('hemolytic anemia')) || text.includes('warm aiha') || text.includes('cold agglutinin'))
    ),
    reason: 'G6PD deficiency and autoimmune hemolytic anemias -> G6PD Deficiency and Autoimmune Hemolytic Anemias (Mod 146)'
  },

  // Extravascular Hemolysis (Mod 145)
  {
    targetMod: 145,
    name: 'Extravascular Hemolysis',
    fromExclude: [145],
    match: (q, text) => (
      (text.includes('hereditary spherocytosis') && (text.includes('spectrin') || text.includes('ankyrin') || text.includes('osmotic fragility') || text.includes('spherocytes'))) ||
      (text.includes('sickle cell') && (text.includes('hbs') || text.includes('howell-jolly') || text.includes('vaso-occlusive') || text.includes('crew cut appearance') || text.includes('gamma gandy')))
    ),
    reason: 'Hereditary spherocytosis and sickle cell anemia -> Extravascular Hemolysis (Mod 145)'
  },

  // Intravascular Hemolysis & Hemolysis Basics (Mod 144)
  {
    targetMod: 144,
    name: 'Intravascular Hemolysis',
    fromExclude: [144],
    match: (q, text) => (
      (text.includes('paroxysmal nocturnal hemoglobinuria') || text.includes('pnh') && (text.includes('cd55') || text.includes('cd59') || text.includes('piga') || text.includes('ham test') || text.includes('flaer'))) ||
      (text.includes('microangiopathic hemolytic anemia') || text.includes('maha') && (text.includes('schistocytes') || text.includes('helmet cells'))) ||
      (text.includes('haptoglobin') && text.includes('hemosiderinuria') && text.includes('intravascular hemolysis'))
    ),
    reason: 'PNH, MAHA (schistocytes), and intravascular hemolytic mechanics -> Basics of Hemolysis and Intravascular Hemolysis (Mod 144)'
  },

  // Normocytic and Macrocytic Anemia (Mod 143)
  {
    targetMod: 143,
    name: 'Normocytic & Macrocytic Anemia',
    fromExclude: [143],
    match: (q, text) => (
      (text.includes('aplastic anemia') && (text.includes('hypocellular') || text.includes('bone marrow failure') || text.includes('pancytopenia') && !text.includes('leukemia'))) ||
      (text.includes('pure red cell aplasia') && (text.includes('diamond-blackfan') || text.includes('thymoma') || text.includes('parvovirus b19'))) ||
      (text.includes('megaloblastic anemia') || (text.includes('vitamin b12 deficiency') || text.includes('folate deficiency')) && (text.includes('hypersegmented neutrophils') || text.includes('homocysteine') || text.includes('methylmalonic acid') || text.includes('pernicious anemia')))
    ),
    reason: 'Aplastic anemia, pure red cell aplasia, and megaloblastic anemia -> Normocytic And Macrocytic Anemia (Mod 143)'
  },

  // Microcytic Anemia (Mod 142)
  {
    targetMod: 142,
    name: 'Microcytic Anemia',
    fromExclude: [142],
    match: (q, text) => (
      (text.includes('iron deficiency anemia') && (text.includes('ferritin') || text.includes('tibc') || text.includes('microcytic hypochromic'))) ||
      (text.includes('thalassemia') && (text.includes('alpha thalassemia') || text.includes('beta thalassemia') || text.includes('hba2') || text.includes('target cells'))) ||
      (text.includes('sideroblastic anemia') && (text.includes('ring sideroblasts') || text.includes('prussian blue stain on marrow'))) ||
      (text.includes('anemia of chronic disease') && (text.includes('hepcidin') || text.includes('iron trapped')))
    ),
    reason: 'Iron deficiency, thalassemia, and microcytic hypochromic anemias -> Microcytic Anemia (Mod 142)'
  },

  // Amyloidosis and Graft Rejection (Mod 141)
  {
    targetMod: 141,
    name: 'Amyloidosis & Graft Rejection',
    fromExclude: [141],
    match: (q, text) => (
      (text.includes('amyloidosis') && (text.includes('congo red') || text.includes('apple-green birefringence') || text.includes('beta-pleated') || text.includes('al amyloid') || text.includes('aa amyloid') || text.includes('dialysis-associated') || text.includes('beta2-microglobulin'))) ||
      (text.includes('graft rejection') && (text.includes('hyperacute') || text.includes('acute cellular') || text.includes('chronic rejection') || text.includes('graft-versus-host')))
    ),
    reason: 'Amyloidosis staining/classification and transplant graft rejection -> Amyloidosis and Graft Rejection (Mod 141)'
  },

  // Hypersensitivity and Autoimmunity (Mod 140)
  {
    targetMod: 140,
    name: 'Hypersensitivity & Autoimmunity',
    fromExclude: [140],
    match: (q, text) => (
      (text.includes('type 1 hypersensitivity') || text.includes('type i hypersensitivity') || text.includes('ige mediated') || (text.includes('aberrant immune reactions') && text.includes('allergen binds to antigen-specific ige'))) ||
      (text.includes('type 2 hypersensitivity') || text.includes('type ii hypersensitivity') || text.includes('antibody-mediated cytotoxicity')) ||
      (text.includes('type 3 hypersensitivity') || text.includes('type iii hypersensitivity') || text.includes('immune complex disease')) ||
      (text.includes('type 4 hypersensitivity') || text.includes('type iv hypersensitivity') || text.includes('delayed type hypersensitivity')) ||
      (text.includes('systemic lupus erythematosus') || text.includes('sle') && (text.includes('ana') || text.includes('anti-dsdna') || text.includes('anti-smith') || text.includes('lupus nephritis'))) ||
      (text.includes('sjogren syndrome') || text.includes('sicca syndrome') || (text.includes('keratoconjunctivitis sicca') && text.includes('xerostomia'))) ||
      (text.includes('systemic sclerosis') || text.includes('scleroderma') || text.includes('crest syndrome')) ||
      (text.includes('immune tolerance') && (text.includes('central anergy') || text.includes('peripheral anergy') || text.includes('clonal anergy')))
    ),
    reason: 'Hypersensitivity reactions (Type I-IV), autoimmunity, immune tolerance, and systemic autoimmune diseases -> Hypersensitivity and Autoimmunity (Mod 140)'
  },

  // Components of Immune System (Mod 139)
  {
    targetMod: 139,
    name: 'Immune System Components',
    fromExclude: [139],
    match: (q, text) => (
      (text.includes('pattern recognition receptors') && (text.includes('tlr') || text.includes('nod-like') || text.includes('c-type lectin'))) ||
      (text.includes('hyper igm syndrome') && text.includes('cd40')) ||
      (text.includes('natural killer cells') || text.includes('nk cells') && (text.includes('cd16') || text.includes('cd56'))) ||
      (text.includes('mhc class i') || text.includes('mhc class ii') || text.includes('hla antigens') && text.includes('antigen presenting'))
    ),
    reason: 'Innate immunity receptors, immunoglobulins, and immune cell subsets -> Components of Immune System (Mod 139)'
  },

  // Carcinogenesis, Paraneoplastic, Tumor Markers (Mod 138)
  {
    targetMod: 138,
    name: 'Carcinogenesis & Tumor Markers',
    fromExclude: [138],
    match: (q, text) => (
      (text.includes('radiosensitive tumour') || text.includes('radiosensitivity of tumour') || (text.includes('least radiosensitive') && text.includes('cell'))) ||
      (text.includes('chemical carcinogen') && (text.includes('aflatoxin') || text.includes('polycyclic aromatic') || text.includes('initiator') || text.includes('promoter'))) ||
      (text.includes('paraneoplastic syndrome') && (text.includes('hypercalcemia of malignancy') || text.includes('siadh') || text.includes('lambert-eaton'))) ||
      (text.includes('tumor marker') && (text.includes('alpha-fetoprotein') || text.includes('carcinoembryonic') || text.includes('ca-125') || text.includes('ca 19-9')))
    ),
    reason: 'Chemical/radiation carcinogenesis, radiosensitivity, paraneoplastic syndromes, and tumor markers -> Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers (Mod 138)'
  },

  // Molecular Basis of Cancer (Mod 137)
  {
    targetMod: 137,
    name: 'Molecular Basis of Cancer',
    fromExclude: [137],
    match: (q, text) => (
      (text.includes('guardian of the genome') && text.includes('p53')) ||
      (text.includes('governor of proliferation') && text.includes('rb')) ||
      (text.includes('tumour suppressor gene') && (text.includes('tp53') || text.includes('rb1') || text.includes('p21') || text.includes('p16') || text.includes('vhl') || text.includes('brca'))) ||
      (text.includes('oncogene') && (text.includes('ras') || text.includes('myc') || text.includes('her2') || text.includes('erbb2'))) ||
      (text.includes('hallmarks of cancer') || text.includes('cancer enabling inflammation') || text.includes('evade apoptosis') && text.includes('cancer cells')) ||
      (text.includes('gene silencing') && (text.includes('microrna') || text.includes('sirna') || text.includes('rnai'))) ||
      (text.includes('dna repair') && (text.includes('mismatch repair') || text.includes('microsatellite instability') || text.includes('lynch syndrome')))
    ),
    reason: 'Oncogenes, tumor suppressor genes (p53, Rb), hallmarks of cancer, and molecular oncology -> Molecular Basis of Cancer and Tumor Immunity (Mod 137)'
  },

  // Chromosomal Disorders and Other Genetic Diseases (Mod 135)
  {
    targetMod: 135,
    name: 'Chromosomal Disorders & Genetics',
    fromExclude: [135],
    match: (q, text) => (
      (text.includes('down syndrome') || text.includes('trisomy 21')) ||
      (text.includes('turner syndrome') || text.includes('45,x')) ||
      (text.includes('klinefelter syndrome') || text.includes('47,xxy')) ||
      (text.includes('edwards syndrome') || text.includes('trisomy 18')) ||
      (text.includes('patau syndrome') || text.includes('trisomy 13')) ||
      (text.includes('cri du chat') || text.includes('5p deletion') || text.includes('5p-')) ||
      (text.includes('fragile x syndrome') || text.includes('fmr1')) ||
      (text.includes('myotonic dystrophy') && (text.includes('ctg repeat') || text.includes('handshake') || text.includes('muscle weakness'))) ||
      (text.includes('marfan syndrome') && text.includes('fibrillin')) ||
      (text.includes('ehlers-danlos syndrome')) ||
      (text.includes('cystic fibrosis') && text.includes('cftr'))
    ),
    reason: 'Trisomies, chromosomal deletions, triplet repeat syndromes, and genetic disorders -> Chromosomal Disorders and Other Genetic Diseases (Mod 135)'
  },

  // Lysosomal and Glycogen Storage Diseases (Mod 134)
  {
    targetMod: 134,
    name: 'Storage Diseases',
    fromExclude: [134],
    match: (q, text) => (
      (text.includes('gaucher disease') && (text.includes('glucocerebrosidase') || text.includes('crumpled tissue paper'))) ||
      (text.includes('niemann-pick') && (text.includes('sphingomyelinase') || text.includes('foam cells'))) ||
      (text.includes('tay-sachs') && (text.includes('hexosaminidase') || text.includes('cherry-red spot'))) ||
      (text.includes('fabry disease') && text.includes('alpha-galactosidase')) ||
      (text.includes('glycogen storage disease') || text.includes('von gierke') || text.includes('pompe disease') || text.includes('mcardle disease'))
    ),
    reason: 'Lysosomal storage diseases and glycogen storage diseases -> Lysosomal and Glycogen Storage Diseases (Mod 134)'
  },

  // Hemodynamics and Hemostasis (Mod 132)
  {
    targetMod: 132,
    name: 'Hemodynamics, Shock, Embolism',
    fromExclude: [132],
    match: (q, text) => (
      (text.includes('types of shock') && (text.includes('hypovolemic shock') || text.includes('neurogenic shock') || text.includes('cardiogenic shock') || text.includes('septic shock'))) ||
      (text.includes('pulmonary embolism') || text.includes('pulmonary thromboembolism') || text.includes('fat embolism') || text.includes('air embolism') || text.includes('amniotic fluid embolism')) ||
      (text.includes('thrombus') && text.includes('lines of zahn')) ||
      (text.includes('infarction') && (text.includes('red infarct') || text.includes('white infarct')))
    ),
    reason: 'Shock classifications, thrombosis, embolism, and hemodynamics -> Disorders of Hemodynamics and Hemostasis (Mod 132)'
  },

  // Tissue Repair (Mod 131)
  {
    targetMod: 131,
    name: 'Tissue Repair',
    fromExclude: [131],
    match: (q, text) => (
      (text.includes('granulation tissue') && (text.includes('fibroblasts') || text.includes('neovascularization') || text.includes('capillaries'))) ||
      (text.includes('wound healing') && (text.includes('primary intention') || text.includes('secondary intention') || text.includes('wound contraction') || text.includes('myofibroblasts'))) ||
      (text.includes('keloid') || text.includes('hypertrophic scar')) ||
      (text.includes('collagen synthesis') && text.includes('repair')) ||
      (text.includes('angiogenesis') && (text.includes('vegf') || text.includes('fgf')) && text.includes('repair'))
    ),
    reason: 'Wound healing, granulation tissue, angiogenesis in repair, and scarring -> Tissue Repair (Mod 131)'
  },

  // Inflammatory Mediators & Chronic Inflammation (Mod 130)
  {
    targetMod: 130,
    name: 'Inflammatory Mediators & Granuloma',
    fromExclude: [130],
    match: (q, text) => (
      (text.includes('complement complex') && text.includes('membrane attack complex') || text.includes('c56789') || text.includes('c5b-9')) ||
      (text.includes('arachidonic acid metabolites') || text.includes('prostaglandins') || text.includes('leukotrienes') && text.includes('mediator')) ||
      (text.includes('macrophage activation') && (text.includes('m1') || text.includes('m2') || text.includes('classically activated') || text.includes('alternatively activated'))) ||
      (text.includes('granuloma') && (text.includes('epithelioid cells') || text.includes('langhans giant cells') || text.includes('foreign body giant cells') || text.includes('caseating granuloma') && !text.includes('lung') && !text.includes('tb lung')))
    ),
    reason: 'Chemical mediators of inflammation, complement system, macrophage subtypes, and granuloma morphology -> Inflammatory Mediators and Chronic Granulomatous Inflammation (Mod 130)'
  },

  // Acute Inflammation (Mod 129)
  {
    targetMod: 129,
    name: 'Acute Inflammation',
    fromExclude: [129],
    match: (q, text) => (
      (text.includes('neutrophilic extracellular trap') || text.includes('netosis') || (text.includes('citrulline') && text.includes('neutrophil extracellular traps'))) ||
      (text.includes('leukocyte rolling') || text.includes('selectin') && text.includes('endothelium')) ||
      (text.includes('leukocyte adhesion') || text.includes('integrin') && text.includes('icamm-1')) ||
      (text.includes('chemotaxis') && (text.includes('c5a') || text.includes('ltb4') || text.includes('il-8'))) ||
      (text.includes('phagocytosis') && (text.includes('opsonin') || text.includes('respiratory burst') || text.includes('nadph oxidase') || text.includes('chediak-higashi')))
    ),
    reason: 'Acute inflammation cellular events, adhesion molecules, phagocytosis, and NETs -> Acute Inflammation (Mod 129)'
  },

  // Intracellular Accumulations, Calcification, Cellular Ageing (Mod 128)
  {
    targetMod: 128,
    name: 'Accumulations, Calcification, Ageing',
    fromExclude: [128],
    match: (q, text) => (
      (text.includes('hayflick limit') && (text.includes('replicate') || text.includes('cellular ageing') || text.includes('senescence'))) ||
      (text.includes('cellular senescence') || text.includes('telomere shortening') || text.includes('sirtuins')) ||
      (text.includes('hemosiderin') && (text.includes('prussian blue') || text.includes('iron-storage pigment'))) ||
      (text.includes('lipofuscin') && (text.includes('wear and tear') || text.includes('brown atrophy'))) ||
      (text.includes('dystrophic calcification') || text.includes('metastatic calcification') && (text.includes('hypercalcemia') || text.includes('calcium deposits'))) ||
      (text.includes('steatosis') || text.includes('fatty change') && text.includes('intracellular accumulation'))
    ),
    reason: 'Intracellular pigments, pathological calcification, and cellular ageing mechanisms -> Intracellular Accumulations, Pathological Calcification and Cellular Ageing (Mod 128)'
  },

  // Cell Death (Mod 127)
  {
    targetMod: 127,
    name: 'Cell Death',
    fromExclude: [127],
    match: (q, text) => (
      (text.includes('apoptosis') && (text.includes('caspase') || text.includes('bax') || text.includes('bak') || text.includes('bcl-2') || text.includes('apoptotic bodies') || text.includes('cytochrome c') || text.includes('apaf-1') || text.includes('annexin v') || text.includes('dna laddering'))) ||
      (text.includes('pyknosis') || text.includes('karyorrhexis') || text.includes('karyolysis')) ||
      (text.includes('pyroptosis') || text.includes('ferroptosis') || text.includes('necroptosis') || text.includes('autophagy') && (text.includes('lc3') || text.includes('atg'))) ||
      (text.includes('coagulative necrosis') || text.includes('liquefactive necrosis') || text.includes('caseous necrosis') || text.includes('fat necrosis') || text.includes('fibrinoid necrosis')) &&
      !text.includes('pan') && !text.includes('tb lung') && !text.includes('pancreatitis')
    ),
    reason: 'Mechanisms of cell death (necrosis types, apoptotic pathways, caspases, autophagy) -> Cell Death (Mod 127)'
  },

  // Miscellaneous / Special Lab Techniques (Mod 189)
  {
    targetMod: 189,
    name: 'Misc / Lab Techniques',
    fromExclude: [189],
    match: (q, text) => (
      (text.includes('flow cytometry') && (text.includes('forward scatter') || text.includes('side scatter') || text.includes('principles of flow cytometry'))) ||
      (text.includes('immunohistochemistry') && text.includes('diagnostic marker')) ||
      (text.includes('special stains') && (text.includes('oil red o') || text.includes('sudan black') || text.includes('masson trichrome') || text.includes('fontana-masson')))
    ),
    reason: 'Laboratory diagnostic techniques, flow cytometry principles, and histopathological methods -> Mixed / Miscellaneous Topics (Mod 189)'
  }
];

console.log(`Defined ${rules.length} specialized medical classification rules.`);
