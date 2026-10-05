const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));
const qMap = new Map();
questions.forEach(q => qMap.set(q.id, q));

// Extract existing overrides from audit_pathology_builder.js
const builderContent = fs.readFileSync('tools/audit_pathology_builder.js', 'utf8');
const allOverrides = {};

const lines = builderContent.split('\n');
lines.forEach(line => {
  const m = line.match(/^\s*(\d+):\s*\{\s*to:\s*(\d+),\s*reason:\s*("([^"]+)"|'([^']+)')\s*\}/);
  if (m) {
    const id = parseInt(m[1], 10);
    const to = parseInt(m[2], 10);
    const reason = m[4] || m[5];
    allOverrides[id] = { to, reason };
  }
});

console.log('Extracted from builder:', Object.keys(allOverrides).length);

// Fix ID 6480: Cardiac myxoma belongs in Module 162, not 178
allOverrides[6480] = {
  to: 162,
  reason: "Most common primary cardiac neoplasm (Atrial myxoma) -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)"
};

// Newly verified overrides from systematic module audit
const newOverrides = {
  // Module 172
  5131: { to: 128, reason: "Hemosiderin reaction with potassium ferrocyanide (Prussian blue stain) -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  5134: { to: 128, reason: "Prussian blue stain confirming hemosiderin pigment -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  5298: { to: 140, reason: "Autoimmune disorder classification (Influenza is viral infection) -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5712: { to: 140, reason: "Autoimmune diseases mediated by antibodies vs cell-mediated (Multiple sclerosis is T-cell mediated) -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  6182: { to: 186, reason: "Anti-CCP autoantibody in Rheumatoid arthritis -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6235: { to: 187, reason: "Cutaneous manifestations of metabolic syndrome (acanthosis nigricans, acrochordons, skin tags) -> Pathology (Mod 187: Skin Pathology)" },
  6526: { to: 128, reason: "Sirtuin protein functions in cellular ageing and metabolism -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  6621: { to: 180, reason: "Alpha-1 antitrypsin deficiency causing panacinar emphysema -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },

  // Module 173
  4987: { to: 131, reason: "Labile vs stable cells (liver hepatocytes are stable cells) -> Pathology (Mod 131: Tissue Repair)" },
  6058: { to: 176, reason: "Gastrointestinal stromal tumor (GIST) immunohistochemical markers (KIT, DOG1, PDGFRA, SDH) -> Pathology (Mod 176: Stomach)" },
  6072: { to: 153, reason: "Primary extranodal non-Hodgkin lymphoma classification -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6524: { to: 171, reason: "Mallory hyaline bodies in alcoholic liver cirrhosis, HCC, and PBC -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6531: { to: 172, reason: "Infant with neonatal hepatitis and PAS-positive diastase-resistant globules in alpha-1 antitrypsin deficiency -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6532: { to: 172, reason: "Primary sclerosing cholangitis (PSC) with onion-skin periductal fibrosis -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6533: { to: 131, reason: "Hepatocyte growth factor (HGF / scatter factor) mitogen in tissue repair -> Pathology (Mod 131: Tissue Repair)" },

  // Module 176
  5232: { to: 128, reason: "Caloric restriction extending lifespan through sirtuins -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  6408: { to: 137, reason: "ERBB proto-oncogene associations in malignancies -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  6556: { to: 83, reason: "Activation of pancreatic digestive proenzymes by enteropeptidase in duodenum -> Physiology (Mod 83: Gastrointestinal Physiology)" },
  6558: { to: 174, reason: "Pancreatic adenocarcinoma distant metastasis to bones and lungs -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6559: { to: 499, reason: "Gastrotomy definition as surgical opening of stomach -> Surgery (Mod 499: Stomach and Duodenum)" },

  // Module 177
  5654: { to: 181, reason: "Bronchial carcinoid tumor IHC neuroendocrine markers (Synaptophysin, Chromogranin, NSE) -> Pathology (Mod 181: Lung Tumors)" },
  5872: { to: 176, reason: "Vitamin B12 supplementation following gastrectomy due to intrinsic factor loss -> Pathology (Mod 176: Stomach)" },
  6170: { to: 178, reason: "Familial adenomatous polyposis (FAP) APC mutation and prophylactic colectomy -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6520: { to: 171, reason: "Acetaminophen hepatotoxicity centrilobular necrosis -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6561: { to: 137, reason: "KRAS GTP-binding protein in cell signaling -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  6565: { to: 170, reason: "Cryptorchidism undescended testis histopathology -> Pathology (Mod 170: Male Genital Tract)" },
  6567: { to: 182, reason: "Zellballen pattern in Paraganglioma / Pheochromocytoma -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },
  6575: { to: 158, reason: "Microscopic polyangiitis small-vessel vasculitis with P-ANCA -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },

  // Module 180
  1834: { to: 73, reason: "Gas exchange by diffusion impairment in emphysema -> Physiology (Mod 73: Mechanism of Respiration / Gas Exchange)" },
  2838: { to: 2, reason: "Kartagener syndrome ciliary defect -> Anatomy (Mod 2: Cell Biology & Cytoskeleton)" },
  4955: { to: 126, reason: "Vitamin A / retinoic acid deficiency inducing squamous metaplasia -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  4989: { to: 188, reason: "AIDS dementia complex microglial nodules and encephalitis -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5396: { to: 161, reason: "Heart failure cells in left-sided congestive heart failure -> Pathology (Mod 161: Heart Failure and Ischemic Heart Disease)" },
  5403: { to: 132, reason: "Post-traumatic pulmonary fat embolism -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  6541: { to: 168, reason: "Bladder botryoid embryonal rhabdomyosarcoma in child -> Pathology (Mod 168: Lower Urinary Tract)" },
  6581: { to: 181, reason: "Small cell lung carcinoma IHC positivity for NSE -> Pathology (Mod 181: Lung Tumors)" },
  6582: { to: 179, reason: "Miliary tuberculosis granulomatous lung pattern -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6583: { to: 179, reason: "Cytomegalovirus (CMV) pneumonitis with intranuclear inclusions -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6615: { to: 179, reason: "Diffuse alveolar damage (DAD) / ARDS in patient with hypoxemia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6616: { to: 179, reason: "Red hepatization stage of lobar pneumonia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6629: { to: 181, reason: "Small cell carcinoma of lung cytology and histology -> Pathology (Mod 181: Lung Tumors)" },
  6631: { to: 181, reason: "Pleural malignant mesothelioma electron microscopy long microvilli -> Pathology (Mod 181: Lung Tumors)" },

  // Module 181
  2844: { to: 74, reason: "Removal of alveolar particulate matter by alveolar macrophage phagocytosis -> Physiology (Mod 74: Defense mechanisms of respiratory system / Respiration)" },
  5520: { to: 138, reason: "Thymoma associated with pure red cell aplasia -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  5678: { to: 186, reason: "Dermatomyositis paraneoplastic inflammatory myopathy with perifascicular atrophy -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6546: { to: 330, reason: "Basal cell carcinoma with rolled edges at medial canthus of eyelid -> Ophthalmology (Mod 330: Diseases of Eyelids)" },

  // Module 182
  5097: { to: 184, reason: "Fat necrosis of breast following trauma/resection -> Pathology (Mod 184: The Breast)" },
  6632: { to: 130, reason: "Procalcitonin as a systemic marker for severe bacterial sepsis -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  6636: { to: 94, reason: "Inhibin function inhibiting FSH secretion -> Physiology (Mod 94: Male and Female Reproductive Physiology)" },

  // Module 185
  2408: { to: 113, reason: "Gs alpha subunit gain-of-function mutation causing increased cAMP -> Biochemistry (Mod 113: Signal Transduction)" },
  5323: { to: 129, reason: "Chronic granulomatous disease with recurrent catalase-positive infections -> Pathology (Mod 129: Acute Inflammation)" },
  5750: { to: 142, reason: "Iron deficiency anemia with low iron, low ferritin, high TIBC -> Pathology (Mod 142: Microcytic Anemia)" },
  5771: { to: 142, reason: "Pica (eating sand) in iron deficiency anemia -> Pathology (Mod 142: Microcytic Anemia)" },
  5788: { to: 150, reason: "Child with lymphadenopathy and bone marrow lymphoblasts in ALL -> Pathology (Mod 150: Acute Lymphocytic Leukemia)" },
  5793: { to: 134, reason: "Gaucher disease with crumpled tissue paper histiocytes and glucocerebroside accumulation -> Pathology (Mod 134: Lysosomal and Glycogen Storage Diseases)" },
  6012: { to: 129, reason: "Axial streaming of RBCs in center of vessel lumen in acute inflammation -> Pathology (Mod 129: Acute Inflammation)" },
  6243: { to: 143, reason: "Shwachman-Diamond syndrome bone marrow failure and pancreatic exocrine deficiency -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },
  6689: { to: 142, reason: "DMT-1 mediated iron absorption across apical membrane of enterocytes -> Pathology (Mod 142: Microcytic Anemia)" },
  6706: { to: 141, reason: "Chimeric DNA analysis in bone marrow / organ transplantation -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },

  // Module 186
  5211: { to: 176, reason: "NSAID-induced acute erosive hemorrhagic gastritis -> Pathology (Mod 176: Stomach)" },
  5318: { to: 238, reason: "Tocilizumab monoclonal antibody against IL-6 receptor in RA -> Pharmacology (Mod 238: Disease Modifying Anti-Rheumatic Drugs)" },
  5913: { to: 140, reason: "Systemic lupus erythematosus with anti-Smith antibody and malar rash -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  6059: { to: 151, reason: "Granulocytic sarcoma / chloroma extramedullary blast proliferation in AML -> Pathology (Mod 151: Acute Myeloid Leukemia)" },
  6667: { to: 140, reason: "Sjogren syndrome with anti-Ro/La and lymphocytic exocrine gland destruction -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  6717: { to: 307, reason: "Schwannoma (Acoustic neuroma) presenting with SNHL and tinnitus -> ENT (Mod 307: Diseases of Middle and Inner Ear)" },

  // Module 187
  4891: { to: 132, reason: "Causes of deep vein thrombosis (Virchow triad) -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  4892: { to: 148, reason: "Prothrombin time (PT/INR) monitoring for oral warfarin anticoagulant therapy -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  4896: { to: 138, reason: "Ames test for mutagenic and carcinogenic potential -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  4897: { to: 188, reason: "Cerebellum as most common site for juvenile pilocytic astrocytoma -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  4908: { to: 179, reason: "Mycoplasma pneumoniae causing atypical pneumonia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  4909: { to: 177, reason: "Enterokinase/enteropeptidase in small intestine activating digestive zymogens -> Pathology (Mod 177: Small Intestine)" },
  4910: { to: 166, reason: "Gross pathology of polycystic kidney disease -> Pathology (Mod 166: Tubulointerstitial, Vascular and Cystic Diseases)" },
  4911: { to: 188, reason: "Metastasis as most common brain tumour in adults -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  4912: { to: 188, reason: "Medulloblastoma as most common malignant brain tumour in children -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  4978: { to: 158, reason: "Benign nephrosclerosis gross features with fine cortical granularity -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  4979: { to: 186, reason: "Gastrocnemius muscle biopsy showing denervation atrophy -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5048: { to: 137, reason: "Cyclin-dependent kinase inhibitors (CDKIs) in cell cycle regulation -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5050: { to: 180, reason: "Emphysema causing permanent enlargement and destruction of alveolar acini -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5052: { to: 330, reason: "Basal cell carcinoma as most common malignancy of eyelid -> Ophthalmology (Mod 330: Diseases of Eyelids)" },
  5257: { to: 183, reason: "Hashimoto thyroiditis with Hurthle cell metaplasia and lymphocytic infiltrate -> Pathology (Mod 183: Thyroid Glands)" },
  5363: { to: 179, reason: "Cotton candy intra-alveolar foamy exudates in Pneumocystis pneumonia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  5364: { to: 137, reason: "Xeroderma pigmentosum nucleotide excision repair defect -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5374: { to: 171, reason: "Mallory-Denk hyaline intermediate filament skeins in cirrhosis -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  5593: { to: 180, reason: "Asbestosis pleural thickening and interstitial pulmonary fibrosis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5625: { to: 157, reason: "Calculation of absolute neutrophil count (ANC) in leukopenia -> Pathology (Mod 157: Leukemoid, Leukocytosis and Lymphadenitis)" },
  5627: { to: 186, reason: "Rhabdomyoma benign skeletal muscle tumor -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5631: { to: 165, reason: "Diabetic nephropathy with Kimmelstiel-Wilson nodular glomerulosclerosis -> Pathology (Mod 165: Glomerular Diseases)" },
  5634: { to: 180, reason: "Asbestos-related pleural plaques and asbestosis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5645: { to: 344, reason: "Retinoblastoma with Flexner-Wintersteiner rosettes -> Ophthalmology (Mod 344: Diseases of Retina)" },
  5670: { to: 189, reason: "Flow cytometry for cell surface CD marker characterization -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  5794: { to: 148, reason: "Disseminated intravascular coagulation (DIC) consumptive coagulopathy -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5867: { to: 148, reason: "Warfarin-induced skin necrosis due to rapid protein C depletion -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5936: { to: 148, reason: "Coagulation factor deficiency vs platelet disorder features -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5958: { to: 172, reason: "Autoimmune hepatitis with elevated IgG, transaminases and jaundice -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  5977: { to: 148, reason: "Thromboelastography (TEG) global hemostatic assessment -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5989: { to: 149, reason: "Lewis blood group system antigen characteristics -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  6004: { to: 156, reason: "Primary myelofibrosis with leukoerythroblastosis and dacrocytes (BCR-ABL negative) -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6006: { to: 44, reason: "Dual blood supply of liver from portal vein and hepatic artery -> Anatomy (Mod 44: Stomach, Liver & Spleen)" },
  6107: { to: 174, reason: "Pancreatic adenocarcinoma with migratory thrombophlebitis (Trousseau syndrome) -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6119: { to: 179, reason: "Reactivated secondary tuberculosis localization to lung apex -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6171: { to: 180, reason: "Silicosis pulmonary nodules histopathology matching -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6278: { to: 160, reason: "Hemangiopericytoma staghorn / fish-hook vascular branching pattern -> Pathology (Mod 160: Vascular Tumors)" },
  6281: { to: 181, reason: "Malignant mesothelioma following asbestos exposure -> Pathology (Mod 181: Lung Tumors)" },
  6286: { to: 188, reason: "Childhood CNS tumors posterior fossa / infratentorial predilection -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6315: { to: 186, reason: "Bible bump / ganglion cyst of joint and tendon sheath -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6334: { to: 165, reason: "Post-streptococcal glomerulonephritis hypercellular glomeruli following impetigo -> Pathology (Mod 165: Glomerular Diseases)" },
  6339: { to: 164, reason: "Rheumatic mitral stenosis fish-mouth deformity and Aschoff bodies -> Pathology (Mod 164: Rheumatic Fever and Endocarditis)" },
  6352: { to: 165, reason: "Post-streptococcal glomerulonephritis enlarged hypercellular glomeruli following skin infection -> Pathology (Mod 165: Glomerular Diseases)" },
  6379: { to: 166, reason: "Acute pyelonephritis with glomerular sparing in early stages -> Pathology (Mod 166: Tubulointerstitial, Vascular and Cystic Diseases)" },
  6380: { to: 158, reason: "Malignant hypertension hyperplastic arteriolosclerosis and necrotizing arteriolitis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6389: { to: 165, reason: "Rapidly progressive glomerulonephritis with glomerular crescent formation on PAS -> Pathology (Mod 165: Glomerular Diseases)" },
  6406: { to: 167, reason: "Wilms tumor (nephroblastoma) commonest pediatric primary renal neoplasm -> Pathology (Mod 167: Renal Tumors)" },
  6431: { to: 188, reason: "Oligodendroglioma fried-egg appearance and chicken-wire capillaries -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6440: { to: 169, reason: "Dysgerminoma solid ovarian neoplasm with elevated LDH -> Pathology (Mod 169: Female Genital Tract)" },
  6466: { to: 169, reason: "Granulosa cell tumor of ovary with elevated inhibin levels -> Pathology (Mod 169: Female Genital Tract)" },
  6487: { to: 135, reason: "SRY sex-determining region gene location on Y chromosome -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6499: { to: 165, reason: "Diabetic nephropathy with nodular glomerulosclerosis and visual blurring -> Pathology (Mod 165: Glomerular Diseases)" },
  6551: { to: 181, reason: "Squamous cell lung carcinoma causing paraneoplastic hypercalcemia via PTHrP -> Pathology (Mod 181: Lung Tumors)" },
  6577: { to: 186, reason: "Duchenne muscular dystrophy with absence of dystrophin on muscle biopsy -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6589: { to: 177, reason: "Carcinoid syndrome flushing, diarrhea and bronchospasm from small bowel carcinoid -> Pathology (Mod 177: Small Intestine)" },
  6598: { to: 169, reason: "Mature cystic teratoma / dermoid cyst of ovary -> Pathology (Mod 169: Female Genital Tract)" },
  6674: { to: 188, reason: "Brain metastases most commonly originating from lung carcinoma -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6697: { to: 139, reason: "Thymus lack of reticular fibers in structural framework -> Pathology (Mod 139: Components of Immune System)" },
  6722: { to: 138, reason: "Ionizing radiation induced leukemias and thyroid neoplasms -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6726: { to: 188, reason: "Myelomeningocele lumbar neural tube defect -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },

  // Module 136
  4917: { to: 169, reason: "Pap smear cytology cervical dysplasia -> Pathology (Mod 169: Female Genital Tract)" },
  5104: { to: 170, reason: "Leydig cell testicular tumor with Reinke crystals -> Pathology (Mod 170: Male Genital Tract)" },
  5500: { to: 165, reason: "Post-streptococcal glomerulonephritis following impetigo -> Pathology (Mod 165: Glomerular Diseases)" },
  5507: { to: 187, reason: "Breslow thickness and Clark level for melanoma depth of invasion -> Pathology (Mod 187: Skin Pathology)" },
  5510: { to: 185, reason: "Osteosarcoma of distal femur / knee bone pain -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  5515: { to: 188, reason: "Glioblastoma WHO grade IV high grade glioma -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5650: { to: 153, reason: "Chronic lymphocytic leukemia (CLL) generalized lymphadenopathy and smudge cells -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6102: { to: 324, reason: "Erythroplakia persistent premalignant red lesion of lateral tongue -> ENT (Mod 324: Oral Cavity & Oropharyngeal Tumors)" },
  6224: { to: 170, reason: "Leydig / Sertoli germ cell testicular tumor evaluation -> Pathology (Mod 170: Male Genital Tract)" },
  6375: { to: 174, reason: "Serous cystic neoplasm of pancreas -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6586: { to: 181, reason: "Bronchogenic lung carcinoma presenting with chronic cough and hoarseness -> Pathology (Mod 181: Lung Tumors)" },
  6659: { to: 170, reason: "Prostate adenocarcinoma Gleason microscopic architectural grading -> Pathology (Mod 170: Male Genital Tract)" },

  // Module 138
  6372: { to: 173, reason: "Choledochal cyst congenital cystic dilatation of biliary tree -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },
  6652: { to: 183, reason: "Medullary thyroid carcinoma presenting as thyroid swelling with amyloid stroma -> Pathology (Mod 183: Thyroid Glands)" },
  6654: { to: 183, reason: "Thyroglossal duct cyst midline anterior neck swelling -> Pathology (Mod 183: Thyroid Glands)" },

  // Module 139
  5674: { to: 140, reason: "Systemic lupus erythematosus malar rash and ANA -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5690: { to: 149, reason: "CMV transmission risk via all cellular blood components -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  5692: { to: 170, reason: "Testicular dysgenesis syndrome components -> Pathology (Mod 170: Male Genital Tract)" },
  5860: { to: 130, reason: "Neisseria susceptibility in terminal complement component (C5-C9) deficiency -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5939: { to: 130, reason: "Membrane attack complex (MAC C5b-9) in terminal complement pathway -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  6227: { to: 135, reason: "DiGeorge syndrome (22q11 deletion) with thymic and parathyroid hypoplasia -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },

  // Module 141
  4943: { to: 170, reason: "Corpora amylacea in benign prostatic hyperplasia -> Pathology (Mod 170: Male Genital Tract)" },
  5718: { to: 130, reason: "Albumin and transferrin as negative acute-phase reactants -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5734: { to: 142, reason: "Iron absorption, DMT-1, and ferroportin in iron metabolism -> Pathology (Mod 142: Microcytic Anemia)" },
  5745: { to: 165, reason: "Diabetic nephropathy microalbuminuria in early glomerular disease -> Pathology (Mod 165: Glomerular Diseases)" },

  // Module 142
  4739: { to: 145, reason: "Sickle cell painful vaso-occlusive bone crisis -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5757: { to: 168, reason: "Gross painless hematuria in urothelial bladder carcinoma -> Pathology (Mod 168: Lower Urinary Tract)" },
  5759: { to: 143, reason: "Vitamin B12 malabsorption and macrocytic anemia following terminal ileal resection -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },
  6382: { to: 167, reason: "Painless hematuria in renal cell carcinoma -> Pathology (Mod 167: Renal Tumors)" },

  // Module 146
  5720: { to: 139, reason: "Severe combined immunodeficiency (SCID) absent T and B cell function -> Pathology (Mod 139: Components of Immune System)" },
  5767: { to: 145, reason: "Howell-Jolly bodies in sickle cell functional autosplenectomy -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5827: { to: 145, reason: "Hereditary spherocytosis with elevated MCHC and extravascular hemolysis -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5848: { to: 144, reason: "Babesia intra-erythrocytic tetrads ('Maltese cross') causing hemolysis -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  5858: { to: 143, reason: "Subacute combined degeneration of spinal cord in vitamin B12 deficiency -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },
  5861: { to: 142, reason: "Reduced transferrin saturation in iron deficiency anemia -> Pathology (Mod 142: Microcytic Anemia)" },
  5863: { to: 142, reason: "Serum transferrin saturation reduction in iron deficiency -> Pathology (Mod 142: Microcytic Anemia)" },
  5864: { to: 148, reason: "Factor XII (Hageman factor) deficiency prolonged aPTT without bleeding in vivo -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5866: { to: 148, reason: "Factor XIII deficiency presenting with umbilical stump bleeding -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5870: { to: 145, reason: "Spherocytes on peripheral smear in hereditary spherocytosis -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5871: { to: 145, reason: "Howell-Jolly bodies following splenectomy -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5922: { to: 148, reason: "Hemophilia A/B presenting with hemarthrosis and retroperitoneal bleed -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5964: { to: 153, reason: "Chronic lymphocytic leukemia (CLL) with fatigue and absolute lymphocytosis -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6044: { to: 143, reason: "Parvovirus B19 pure red cell aplasia / aplastic crisis -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },

  // Module 150
  4936: { to: 174, reason: "Gallstone disease and acute calculous cholecystitis -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  4961: { to: 187, reason: "Dysplastic nevi architectural disorder and cytological atypia -> Pathology (Mod 187: Skin Pathology)" },
  5220: { to: 171, reason: "Masson trichrome blue collagen staining in hepatic cirrhosis -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  5254: { to: 156, reason: "BCR-ABL fusion protein kinase activity in CML -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  5901: { to: 189, reason: "Jamshidi bone marrow aspiration and biopsy needle -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6050: { to: 151, reason: "All-trans retinoic acid (ATRA) differentiation therapy in acute promyelocytic leukemia (APL) -> Pathology (Mod 151: Acute Myeloid Leukemia)" },
  6065: { to: 185, reason: "Ewing sarcoma small round blue cell bone tumor in child -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6095: { to: 153, reason: "Tartrate-resistant acid phosphatase (TRAP) positivity in Hairy cell leukemia -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6096: { to: 153, reason: "Hairy cell leukemia with splenomegaly and dry tap on bone marrow -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6117: { to: 154, reason: "Burkitt lymphoma presenting as jaw tumor in African child -> Pathology (Mod 154: Non Hodgkin Lymphomas: High Grade)" },
  6276: { to: 138, reason: "Oncogenic DNA viruses (HPV, EBV, HBV, KSHV) vs RNA viruses -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6280: { to: 160, reason: "CD31 and CD34 endothelial markers in Angiosarcoma -> Pathology (Mod 160: Vascular Tumors)" },
  6318: { to: 185, reason: "Fracture callus formation in bone healing -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6514: { to: 178, reason: "Juvenile hamartomatous retention polyp of rectum / colon -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6645: { to: 183, reason: "Anaplastic thyroid carcinoma presenting as rapidly enlarging midline neck mass -> Pathology (Mod 183: Thyroid Glands)" },

  // Module 151
  5839: { to: 156, reason: "Chronic myeloid leukemia massive splenomegaly with left-shifted granulocytosis -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  5840: { to: 156, reason: "Chronic myeloid leukemia presentation and Philadelphia chromosome -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6046: { to: 129, reason: "H2O2-MPO-halide system primary bactericidal mechanism of neutrophils -> Pathology (Mod 129: Acute Inflammation)" },
  6052: { to: 152, reason: "Reed-Sternberg cells in classic Hodgkin lymphoma lymph node biopsy -> Pathology (Mod 152: Hodgkin's Lymphoma)" },
  6053: { to: 156, reason: "Chronic myeloid leukemia with basophilia and t(9;22) BCR-ABL -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6056: { to: 153, reason: "Small lymphocytic lymphoma / CLL cervical lymphadenopathy in elderly -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6153: { to: 155, reason: "Multiple myeloma bone marrow aspirate showing neoplastic plasma cells -> Pathology (Mod 155: Multiple Myeloma and Plasma Cell Disorders)" },
  6184: { to: 156, reason: "Polycythemia vera presenting with aquagenic pruritus and erythrocytosis -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },

  // Module 152
  5780: { to: 138, reason: "Thymoma paraneoplastic pure red cell aplasia -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6061: { to: 186, reason: "Orbital rhabdomyosarcoma with desmin positivity in child -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6062: { to: 186, reason: "Embryonal rhabdomyosarcoma presenting with childhood proptosis -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6063: { to: 179, reason: "Pneumocystis jirovecii pneumonia opportunist infection in HIV/AIDS -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6064: { to: 138, reason: "AIDS-defining malignancies (Kaposi sarcoma, non-Hodgkin lymphoma, cervical ca) -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6069: { to: 153, reason: "Stomach as most common extranodal site of non-Hodgkin lymphoma (MALT lymphoma) -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6071: { to: 138, reason: "Epstein-Barr virus oncogenic associations in malignancies -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6074: { to: 154, reason: "Burkitt lymphoma jaw mass with t(8;14) c-MYC translocation -> Pathology (Mod 154: Non Hodgkin Lymphomas: High Grade)" },
  6080: { to: 154, reason: "Diffuse large B-cell lymphoma (DLBCL) as most common primary testicular lymphoma -> Pathology (Mod 154: Non Hodgkin Lymphomas: High Grade)" },
  6081: { to: 154, reason: "Anaplastic large cell lymphoma / Mycosis fungoides as T-cell lymphoma -> Pathology (Mod 154: Non Hodgkin Lymphomas: High Grade)" },
  6086: { to: 153, reason: "MALT lymphoma / Hashimoto thyroiditis-associated lymphoma -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },

  // Module 153
  4893: { to: 151, reason: "Non-specific esterase (NSE) positivity in acute monoblastic/monocytic leukemia (AML M4/M5) -> Pathology (Mod 151: Acute Myeloid Leukemia)" },
  5514: { to: 188, reason: "Pilocytic astrocytoma WHO grade I histology with Rosenthal fibers -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5554: { to: 126, reason: "Heat shock proteins and molecular chaperones in cellular injury response -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  5878: { to: 146, reason: "G6PD deficiency acute hemolytic crisis following oxidant stress -> Pathology (Mod 146: G6PD Deficiency and Autoimmune Hemolytic Anemias)" },
  6015: { to: 150, reason: "B-cell acute lymphoblastic leukemia (ALL) with t(12;21) in 12yo child -> Pathology (Mod 150: Acute Lymphocytic Leukemia)" },
  6016: { to: 156, reason: "Polycythemia vera clinical features and JAK2 mutation -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6083: { to: 150, reason: "B-cell acute lymphoblastic leukemia (B-ALL) in young child -> Pathology (Mod 150: Acute Lymphocytic Leukemia)" },
  6323: { to: 157, reason: "Infectious mononucleosis with atypical reactive CD8+ T lymphocytes (Downey cells) -> Pathology (Mod 157: Leukemoid, Leukocytosis and Lymphadenitis)" },
  6391: { to: 187, reason: "Diabetic neuropathic plantar foot ulceration -> Pathology (Mod 187: Skin Pathology)" },
  6539: { to: 168, reason: "Urothelial (transitional cell) carcinoma commonest bladder cancer -> Pathology (Mod 168: Lower Urinary Tract)" },

  // Module 154
  6110: { to: 167, reason: "Wilms tumor (nephroblastoma) abdominal mass in young child -> Pathology (Mod 167: Renal Tumors)" },
  6114: { to: 150, reason: "T-ALL presenting as anterior mediastinal mass in young adult male -> Pathology (Mod 150: Acute Lymphocytic Leukemia)" },
  6115: { to: 169, reason: "Complete hydatidiform mole with markedly elevated beta-hCG -> Pathology (Mod 169: Female Genital Tract)" },

  // Module 155
  5192: { to: 127, reason: "Phosphatidylserine exposure on outer membrane leaflet in apoptosis -> Pathology (Mod 127: Cell Death)" },
  5440: { to: 137, reason: "Inherited genetic syndromes predisposing to cancer -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5598: { to: 180, reason: "Pneumoconiosis and occupational lung diseases matching -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5777: { to: 143, reason: "Fanconi anemia aplastic anemia with congenital skeletal anomalies -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },
  6001: { to: 189, reason: "Phlebotomy blood collection procedures and tube order -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6120: { to: 186, reason: "Gouty tophi with monosodium urate crystals in joint pathology -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6121: { to: 130, reason: "Complement system proteins in acute inflammatory response -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  6122: { to: 138, reason: "Chemical carcinogenesis initiation and promotion stages -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6123: { to: 187, reason: "Dermatosis papulosa nigra seborrheic keratosis variant -> Pathology (Mod 187: Skin Pathology)" },
  6127: { to: 189, reason: "Flow cytometry applications in hematopathology -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6156: { to: 142, reason: "Hepcidin blocking ferroportin iron export in enterocytes -> Pathology (Mod 142: Microcytic Anemia)" },
  6157: { to: 169, reason: "Mature cystic teratoma / dermoid cyst of ovary in 25yo female -> Pathology (Mod 169: Female Genital Tract)" },
  6162: { to: 187, reason: "Pityriasis versicolor / macular skin lesions -> Pathology (Mod 187: Skin Pathology)" },
  6190: { to: 137, reason: "Gorlin syndrome (Nevoid basal cell carcinoma syndrome) PTCH mutation -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  6387: { to: 166, reason: "Autosomal dominant polycystic kidney disease (ADPKD) with berry aneurysm -> Pathology (Mod 166: Tubulointerstitial, Vascular and Cystic Diseases)" },
  6579: { to: 187, reason: "Molluscum contagiosum Henderson-Paterson viral inclusion bodies -> Pathology (Mod 187: Skin Pathology)" },
  6622: { to: 166, reason: "Tamm-Horsfall uromodulin protein forming urinary hyaline casts -> Pathology (Mod 166: Tubulointerstitial, Vascular and Cystic Diseases)" },
  6623: { to: 180, reason: "Bronchial asthma with bronchospasm and mucous plugging -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6642: { to: 183, reason: "Papillary thyroid carcinoma FNAC with Orphan Annie eyes -> Pathology (Mod 183: Thyroid Glands)" },
  6649: { to: 183, reason: "Hashimoto thyroiditis with autoimmune lymphocytic infiltration -> Pathology (Mod 183: Thyroid Glands)" },
  6743: { to: 132, reason: "Post-traumatic systemic fat embolism syndrome -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },

  // Module 156
  3168: { to: 308, reason: "Meniere disease / vestibular vertigo -> ENT (Mod 308: Vestibular System & Its Disorders)" },
  5386: { to: 148, reason: "Hereditary thrombophilias (Factor V Leiden, Prothrombin G20210A) -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5439: { to: 187, reason: "Dysplastic nevi syndrome clinical and histological features -> Pathology (Mod 187: Skin Pathology)" },
  5761: { to: 142, reason: "Sideroblastic anemia response to Pyridoxine (Vitamin B6) -> Pathology (Mod 142: Microcytic Anemia)" },
  5883: { to: 147, reason: "Bernard-Soulier syndrome defective platelet GpIb-IX-V receptor -> Pathology (Mod 147: Platelet Disorders)" },
  6175: { to: 186, reason: "Reactive arthritis clinical tetrad (urethritis, conjunctivitis, arthritis, balanitis) -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6177: { to: 140, reason: "Anti-Smith (Sm) autoantibody specificity for Systemic Lupus Erythematosus -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  6179: { to: 165, reason: "Lupus nephritis full-house immunofluorescence on kidney biopsy -> Pathology (Mod 165: Glomerular Diseases)" },
  6193: { to: 135, reason: "Turner syndrome (45,XO) short stature and streak ovaries -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6202: { to: 183, reason: "Anti-TPO and anti-thyroglobulin autoantibodies in autoimmune thyroiditis -> Pathology (Mod 183: Thyroid Glands)" },
  6208: { to: 158, reason: "c-ANCA (PR3-ANCA) specificity in Granulomatosis with polyangiitis (Wegener) -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6209: { to: 185, reason: "McCune-Albright syndrome with GNAS1 mutation and polyostotic fibrous dysplasia -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6212: { to: 135, reason: "Turner syndrome (45,XO) somatic karyotype features -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6213: { to: 186, reason: "Desmoid tumor (deep fibromatosis) APC/beta-catenin mutation -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6215: { to: 180, reason: "Yellow nail syndrome with bronchiectasis and pleural effusion -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6217: { to: 336, reason: "Anterior uveitis with raised intraocular pressure -> Ophthalmology (Mod 336: Glaucoma)" },
  6228: { to: 137, reason: "Bloom syndrome defective BLM DNA helicase and genomic instability -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  6232: { to: 165, reason: "Minimal change disease nephrotic syndrome in 10yo child -> Pathology (Mod 165: Glomerular Diseases)" },
  6241: { to: 187, reason: "Muir-Torre syndrome sebaceous neoplasms and internal malignancies -> Pathology (Mod 187: Skin Pathology)" },
  6244: { to: 169, reason: "Meigs syndrome triad of ovarian fibroma, ascites, and hydrothorax -> Pathology (Mod 169: Female Genital Tract)" },

  // Module 157
  5841: { to: 156, reason: "Primary myelofibrosis with leukoerythroblastosis and JAK2V617F mutation -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  5995: { to: 179, reason: "Cytomegalovirus (CMV) owl-eye inclusion bodies -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6321: { to: 179, reason: "Cytomegalovirus (CMV) pneumonia in immunocompromised patient -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },

  // Module 161
  4904: { to: 126, reason: "Disuse muscular atrophy following immobilization in plaster cast -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  5015: { to: 162, reason: "Hypertrophic cardiomyopathy (HCM) causing sudden cardiac death in athlete -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },
  5093: { to: 158, reason: "Polyarteritis nodosa (PAN) transmural necrotizing vasculitis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5391: { to: 132, reason: "Deep veins of leg as commonest site of venous thrombosis -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  5717: { to: 165, reason: "Rapidly progressive glomerulonephritis (Goodpasture syndrome) evaluation -> Pathology (Mod 165: Glomerular Diseases)" },
  5742: { to: 141, reason: "Cardiac amyloidosis with systemic organ involvement -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  5807: { to: 148, reason: "Sepsis and obstetric complications as common causes of DIC -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  6079: { to: 180, reason: "Chylothorax etiology and pleural fluid analysis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6132: { to: 155, reason: "Multiple myeloma presenting with low back pain and lytic bone lesions -> Pathology (Mod 155: Multiple Myeloma and Plasma Cell Disorders)" },
  6293: { to: 158, reason: "Eosinophilic granulomatosis with polyangiitis (Churg-Strauss) vasculitis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6295: { to: 178, reason: "Hirschsprung disease congenital absence of ganglion cells in rectal submucosa -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6298: { to: 179, reason: "Secondary pulmonary tuberculosis apical fibrocaseous granuloma -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6305: { to: 162, reason: "Hypertrophic cardiomyopathy (HCM) asymmetric septal hypertrophy and myofiber disarray -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },

  // Module 164
  6320: { to: 141, reason: "Cytomegalovirus (CMV) infection opportunistic pathogen post solid-organ transplant -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  6324: { to: 157, reason: "Kikuchi-Fujimoto histiocytic necrotizing lymphadenitis -> Pathology (Mod 157: Leukemoid, Leukocytosis and Lymphadenitis)" },
  6328: { to: 186, reason: "Acute septic arthritis of knee requiring urgent arthrocentesis -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },

  // Module 165
  5821: { to: 188, reason: "Creutzfeldt-Jakob disease (CJD) prion protein misfolding encephalopathy -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6353: { to: 158, reason: "Flea-bitten kidney appearance in malignant nephrosclerosis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },

  // Module 169
  4931: { to: 126, reason: "Endometrial hyperplasia as example of hormonal pathological hyperplasia -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  6446: { to: 183, reason: "Thyroid nodule multinodular goiter gross examination -> Pathology (Mod 183: Thyroid Glands)" },

  // Module 170
  6463: { to: 344, reason: "Retinoblastoma with Flexner-Wintersteiner rosettes -> Ophthalmology (Mod 344: Diseases of Retina)" },
  6471: { to: 188, reason: "Psammoma bodies in meningioma brain tumor -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6482: { to: 167, reason: "Renal cell carcinoma presenting with hematuria and flank mass -> Pathology (Mod 167: Renal Tumors)" },
  6485: { to: 179, reason: "Pneumocystis jirovecii pneumonia in HIV-positive patient -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6486: { to: 186, reason: "Duchenne muscular dystrophy with pseudohypertrophy of calf muscle -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6489: { to: 178, reason: "Pseudomembranous colitis (C. difficile) following antibiotic intake -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6490: { to: 178, reason: "Gardner syndrome colonic polyposis and osteomas -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },

  // Module 129
  6024: { to: 171, reason: "Alcoholic hepatitis with AST:ALT ratio > 2:1 and elevated GGT -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6314: { to: 164, reason: "Fish-mouth deformity of mitral valve in rheumatic heart disease -> Pathology (Mod 164: Rheumatic Fever and Endocarditis)" },
  6424: { to: 174, reason: "Acute calculous cholecystitis in patient with female 40 fertile obese risk profile -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6603: { to: 179, reason: "Interleukin-8 neutrophil recruitment in ARDS pathogenesis -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },

  // Module 137
  6367: { to: 326, reason: "Adenoid cystic / mucoepidermoid carcinoma of salivary glands -> ENT (Mod 326: Salivary Gland Tumors)" },
  6718: { to: 186, reason: "Retroperitoneal liposarcoma malignant soft tissue tumor -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },

  // Module 147
  6238: { to: 139, reason: "Wiskott-Aldrich syndrome with thrombocytopenia and eczema -> Pathology (Mod 139: Components of Immune System)" },

  // Module 148
  6047: { to: 151, reason: "Acute promyelocytic leukemia (AML M3) with PML-RARA t(15;17) and DIC -> Pathology (Mod 151: Acute Myeloid Leukemia)" },

  // Module 149
  6005: { to: 158, reason: "Henoch-Schonlein purpura (IgA vasculitis) with palpable purpura and abdominal pain -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6008: { to: 142, reason: "Beta-thalassemia major confirmation by hemoglobin HPLC -> Pathology (Mod 142: Microcytic Anemia)" },
  6019: { to: 144, reason: "Spur cells (acanthocytes) in abetalipoproteinemia and severe liver disease -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  6025: { to: 171, reason: "Hepatic lobular architecture and microvascular zones 1, 2, 3 -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },

  // Module 162
  6312: { to: 164, reason: "Infective endocarditis with septic embolus causing cerebral infarction -> Pathology (Mod 164: Rheumatic Fever and Endocarditis)" },

  // Module 135
  5037: { to: 137, reason: "p53 tumor suppressor gene cell cycle regulation and apoptosis -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5096: { to: 158, reason: "Benign vs malignant nephrosclerosis (fibrinoid necrosis) -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5103: { to: 137, reason: "Telomerase enzyme activation and telomere maintenance in neoplasia -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5349: { to: 137, reason: "Xeroderma pigmentosum defective nucleotide excision repair in carcinogenesis -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5350: { to: 137, reason: "Hereditary nonpolyposis colorectal cancer (Lynch syndrome) mismatch repair defect -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5353: { to: 137, reason: "Homologous recombination DNA repair defects in cancer syndromes -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5468: { to: 137, reason: "G1/S cell cycle checkpoint mechanism and cyclin-CDK regulation -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5469: { to: 186, reason: "Gout pathogenesis and predisposing factors to urate crystallization -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5472: { to: 137, reason: "Chromothripsis mutational process in cancer genomics -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5479: { to: 184, reason: "BRCA genetic testing in familial breast cancer -> Pathology (Mod 184: The Breast)" },
  5481: { to: 170, reason: "TMPRSS2-ERG gene fusion rearrangement in prostate carcinoma -> Pathology (Mod 170: Male Genital Tract)" },
  6125: { to: 137, reason: "N-MYC oncogene amplification (double minutes / HSR) in neuroblastoma -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" }
};

// Merge newOverrides into allOverrides
Object.assign(allOverrides, newOverrides);

console.log('Total combined overrides to process:', Object.keys(allOverrides).length);

// Build validated moves list
const moves = [];
const seenIds = new Set();
let invalidCount = 0;

for (const [idStr, data] of Object.entries(allOverrides)) {
  const id = parseInt(idStr, 10);
  const q = qMap.get(id);
  if (!q) {
    console.warn('Question ID not found in dataset:', id);
    invalidCount++;
    continue;
  }
  if (!modMap.has(data.to)) {
    console.warn('Target module does not exist:', data.to, 'for question', id);
    invalidCount++;
    continue;
  }
  if (q.module_id === data.to) {
    console.warn('Target module is same as source module:', q.module_id, 'for question', id);
    continue;
  }
  if (seenIds.has(id)) {
    console.warn('Duplicate question ID:', id);
    continue;
  }
  seenIds.add(id);

  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: data.to,
    reason: data.reason
  });
}

// Sort moves by question id for clean determinism
moves.sort((a, b) => a.id - b.id);

console.log('Final validated moves count:', moves.length);
console.log('Total questions in dataset:', questions.length);

const auditResult = {
  subject: "Pathology",
  totalQuestions: questions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_pathology.json', JSON.stringify(auditResult, null, 2), 'utf8');
console.log('Saved to tools/audit_pathology.json');

// Statistics
let intraPathCount = 0;
let crossSubjectCount = 0;
const crossSubjects = {};

moves.forEach(m => {
  const targetMod = modMap.get(m.toModule);
  if (targetMod.subjectName === 'Pathology') {
    intraPathCount++;
  } else {
    crossSubjectCount++;
    crossSubjects[targetMod.subjectName] = (crossSubjects[targetMod.subjectName] || 0) + 1;
  }
});

console.log('\n--- AUDIT SUMMARY ---');
console.log('Total Questions Audited:', questions.length);
console.log('Total Misplaced Questions Flagged:', moves.length);
console.log('Intra-Pathology Moves:', intraPathCount);
console.log('Cross-Subject Moves:', crossSubjectCount);
console.log('Cross-Subject Breakdown:', JSON.stringify(crossSubjects, null, 2));
