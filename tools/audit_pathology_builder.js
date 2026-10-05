const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/pathology_questions_raw.json', 'utf8'));
const modules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map();
modules.forEach(m => modMap.set(m.moduleId, m));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&alpha;/g, 'alpha').replace(/&beta;/g, 'beta').replace(/\s+/g, ' ').toLowerCase();
}

// Map of moves
const moves = [];

// Specific ID-based overrides where manual expert review established clear target
const explicitOverrides = {
  // Module 126
  4894: { to: 661, reason: "Volkmann's ischemic contracture following supracondylar fracture/brachial artery injury -> Orthopaedics (Mod 661: Injuries of Elbow and Forearm)" },
  4901: { to: 188, reason: "Traumatic brain injury and diffuse axonal injury -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  4905: { to: 169, reason: "Pap smear cytology fixative -> Pathology (Mod 169: Female Genital Tract)" },
  4915: { to: 169, reason: "Cervical biopsy showing severe dysplasia / CIN-3 -> Pathology (Mod 169: Female Genital Tract)" },
  4918: { to: 173, reason: "Central stellate scar in focal nodular hyperplasia -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },
  4924: { to: 187, reason: "Actinic keratosis showing basal cell layer dysplasia -> Pathology (Mod 187: Skin Pathology)" },
  4944: { to: 187, reason: "Tzanck smear demonstrating multinucleated giant cells -> Pathology (Mod 187: Skin Pathology)" },
  4945: { to: 148, reason: "Endothelial injury tissue factor combining with Factor VII -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  4952: { to: 186, reason: "Pigmented villonodular synovitis / tenosynovial giant cell tumor -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  4960: { to: 158, reason: "Hyaline arteriolosclerosis in benign nephrosclerosis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  4970: { to: 455, reason: "Parkinson disease / Dementia with Lewy bodies (alpha-synuclein) -> Medicine (Mod 455: Movement Disorders)" },
  4977: { to: 135, reason: "Myotonic dystrophy (CTG repeat expansion) -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  4982: { to: 173, reason: "Gross liver specimen showing focal nodular hyperplasia with central stellate scar -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },
  4986: { to: 171, reason: "Gamma-glutamyl transferase (GGT) in alcohol-related liver disease -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  4996: { to: 158, reason: "Fibrinoid necrosis and hyperplastic arteriolosclerosis in malignant hypertension -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  4997: { to: 347, reason: "Bilateral optic atrophy etiology -> Ophthalmology (Mod 347: Optic Nerve)" },
  4998: { to: 579, reason: "Bronchopulmonary dysplasia in preterm infant -> Pediatrics (Mod 579: Neonatal Disorders)" },
  5001: { to: 127, reason: "Apoptosis vs necrosis intact cell membrane and absence of inflammation -> Pathology (Mod 127: Cell Death)" },
  5558: { to: 129, reason: "Citrulline in neutrophil extracellular trap (NET) formation -> Pathology (Mod 129: Acute Inflammation)" },
  5660: { to: 137, reason: "Gene silencing mechanisms (siRNA, miRNA, RNAi) -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5836: { to: 145, reason: "Crew cut appearance and Gamma-Gandy bodies in sickle cell anemia -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5947: { to: 188, reason: "Hypoglycemic/hypoxic ischemic neuronal necrosis (red neurons) in hippocampus -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6250: { to: 188, reason: "Spongiform degeneration of cerebral cortex in Creutzfeldt-Jakob disease -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6377: { to: 138, reason: "Radiosensitivity of testicular seminoma -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },

  // Module 127
  5013: { to: 330, reason: "Most common malignant tumour of eyelid (Basal cell carcinoma) -> Ophthalmology (Mod 330: Diseases of Eyelids)" },
  5014: { to: 158, reason: "Jaw claudication in Giant cell arteritis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5016: { to: 162, reason: "Takotsubo cardiomyopathy following emotional stress -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },
  5018: { to: 169, reason: "Clear cell carcinoma of ovary -> Pathology (Mod 169: Female Genital Tract)" },
  5019: { to: 170, reason: "Spermatocytic tumor not derived from GCNIS -> Pathology (Mod 170: Male Genital Tract)" },
  5020: { to: 170, reason: "IHC markers for seminoma (OCT3/4, KIT, Podoplanin) -> Pathology (Mod 170: Male Genital Tract)" },
  5021: { to: 170, reason: "Teratoma with somatic type malignant transformation -> Pathology (Mod 170: Male Genital Tract)" },
  5027: { to: 128, reason: "Hayflick limit and cellular replicative senescence -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  5029: { to: 137, reason: "Cancer cell survival, p53 suppression, BCL-2 overexpression -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5030: { to: 137, reason: "RB gene as the Governor of cellular proliferation in neoplasia -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5031: { to: 137, reason: "p53 gene as the Guardian of the Genome in neoplasia -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5032: { to: 137, reason: "G2/M cell cycle checkpoint function -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5033: { to: 137, reason: "Cell cycle regulators and p53 tumor suppressor -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5034: { to: 150, reason: "Differentiating anterior mediastinal mass: thymoma vs T-ALL (TdT, CD1a, cytokeratin) -> Pathology (Mod 150: Acute Lymphocytic Leukemia)" },
  5035: { to: 189, reason: "Forward scatter and side scatter in flow cytometry -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  5036: { to: 130, reason: "Membrane attack complex (MAC C5b-9) in complement cascade -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5038: { to: 137, reason: "Evasion of apoptosis mechanisms by cancer cells -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5043: { to: 153, reason: "BCL-2 overexpression in follicular lymphoma t(14;18) -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  5044: { to: 138, reason: "Relative radiosensitivity of blood cells (platelets least sensitive) -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  5045: { to: 137, reason: "p53-induced G1-S cell cycle arrest -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5046: { to: 137, reason: "RB tumor suppressor gene role in genomic stability -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5049: { to: 18, reason: "Oligodendrocytes producing central nervous system myelin -> Anatomy (Mod 18: White Matter of the Brain)" },
  5051: { to: 177, reason: "Carcinoid tumors arising from enterochromaffin cells -> Pathology (Mod 177: Small Intestine)" },
  5058: { to: 158, reason: "Polyarteritis nodosa (PAN) histology and stages -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5060: { to: 503, reason: "Parrot beak / bird beak sign in sigmoid volvulus -> Surgery (Mod 503: Intestinal Obstruction)" },
  5336: { to: 137, reason: "p53-mediated G1 cell cycle arrest -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5365: { to: 137, reason: "Cancer-enabling inflammation hallmark -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5382: { to: 158, reason: "Polyarteritis nodosa (PAN) with HBsAg and fibrinoid necrosis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5461: { to: 162, reason: "Spider cells in cardiac rhabdomyoma -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },
  5501: { to: 167, reason: "Histopathology as prognostic factor in Wilms tumor -> Pathology (Mod 167: Renal Tumors)" },
  5664: { to: 140, reason: "Central and peripheral anergy in immune tolerance -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5675: { to: 139, reason: "Pattern recognition receptors (TLRs, NLRs, CLRs) in innate immunity -> Pathology (Mod 139: Components of Immune System)" },
  5676: { to: 130, reason: "Caspase-1 activating IL-1 beta and IL-18 -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  6106: { to: 171, reason: "Ground-glass hepatocytes in chronic HBV (least likely in acute HBV) -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6449: { to: 170, reason: "Spermatocytic seminoma not arising from GCNIS -> Pathology (Mod 170: Male Genital Tract)" },
  6644: { to: 170, reason: "Gleason grade 5 acinar adenocarcinoma of prostate with central necrosis -> Pathology (Mod 170: Male Genital Tract)" },
  6707: { to: 185, reason: "Giant cell tumor of bone with multinucleated osteoclast-like giant cells -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },

  // Module 128
  5126: { to: 180, reason: "Eggshell calcification in silicosis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5140: { to: 182, reason: "Prolactinoma with galactorrhea and amenorrhea -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },
  5188: { to: 148, reason: "vWF synthesis in endothelial cells and platelets -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5208: { to: 179, reason: "Primary tuberculosis (Ghon focus) vs secondary cavitary TB -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  5367: { to: 131, reason: "Integrin binding to laminin in extracellular matrix -> Pathology (Mod 131: Tissue Repair)" },
  6503: { to: 186, reason: "Retroperitoneal liposarcoma with multivacuolated lipoblasts -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6504: { to: 180, reason: "Breathlessness, wheeze, emphysema/COPD -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6506: { to: 187, reason: "Pilomatricoma showing basaloid cells and ghost cells with calcification -> Pathology (Mod 187: Skin Pathology)" },
  6513: { to: 178, reason: "Juvenile polyp with rectal bleeding -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6530: { to: 172, reason: "Periductal 'onion-skin' fibrosis in Primary Sclerosing Cholangitis -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6547: { to: 187, reason: "Squamous cell carcinoma of skin with keratin pearls -> Pathology (Mod 187: Skin Pathology)" },
  6550: { to: 187, reason: "Basal cell carcinoma with peripheral palisading -> Pathology (Mod 187: Skin Pathology)" },
  6562: { to: 181, reason: "Squamous cell carcinoma of lung with intercellular bridges -> Pathology (Mod 181: Lung Tumors)" },
  6573: { to: 158, reason: "Flea-bitten kidney in malignant hypertension -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6584: { to: 181, reason: "Adenocarcinoma of lung showing malignant glandular structures -> Pathology (Mod 181: Lung Tumors)" },
  6585: { to: 181, reason: "Squamous cell carcinoma of lung causing hypercalcemia (PTHrP) -> Pathology (Mod 181: Lung Tumors)" },
  6587: { to: 173, reason: "Fibrolamellar hepatocellular carcinoma in young patient -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },
  6595: { to: 162, reason: "Cardiac myxoma histopathology -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },
  6599: { to: 186, reason: "Soft tissue tumor of the hand -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6647: { to: 183, reason: "Orphan Annie eye nuclei in Papillary thyroid carcinoma -> Pathology (Mod 183: Thyroid Glands)" },
  6648: { to: 183, reason: "Papillary thyroid carcinoma biopsy -> Pathology (Mod 183: Thyroid Glands)" },
  6650: { to: 183, reason: "Medullary thyroid carcinoma with amyloid stroma -> Pathology (Mod 183: Thyroid Glands)" },
  6653: { to: 183, reason: "Medullary thyroid carcinoma calcitonin amyloid deposits -> Pathology (Mod 183: Thyroid Glands)" },
  6660: { to: 170, reason: "Benign prostatic hyperplasia (BPH) histology -> Pathology (Mod 170: Male Genital Tract)" },
  6665: { to: 183, reason: "Ground-glass Orphan Annie nuclei in Papillary thyroid carcinoma -> Pathology (Mod 183: Thyroid Glands)" },
  6668: { to: 183, reason: "Medullary carcinoma of thyroid with amyloid -> Pathology (Mod 183: Thyroid Glands)" },
  6680: { to: 184, reason: "Fibroadenoma of breast -> Pathology (Mod 184: The Breast)" },
  6700: { to: 185, reason: "Avascular bone marrow infarction / osteonecrosis from corticosteroids -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6711: { to: 185, reason: "Giant cell tumor of bone in wrist -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6715: { to: 185, reason: "Giant cell tumor of distal femur / knee joint -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6721: { to: 160, reason: "Capillary hemangioma of chest -> Pathology (Mod 160: Vascular Tumors)" },
  6723: { to: 130, reason: "Membrane attack complex (MAC C5-C9) deficiency and Neisseria infections -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },

  // Module 130
  5685: { to: 140, reason: "Type 1 hypersensitivity IgE-allergen crosslinking -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5703: { to: 140, reason: "Th2 cells in Type 1 hypersensitivity -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5744: { to: 141, reason: "Dialysis-associated amyloidosis from beta-2 microglobulin -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  5961: { to: 149, reason: "Transfusion-related acute lung injury (TRALI) -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  6021: { to: 144, reason: "Acanthocytes (spur cells) in abetalipoproteinemia -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  6073: { to: 178, reason: "Crohn's disease noncaseating granuloma and bloody diarrhea -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6108: { to: 188, reason: "Bacterial meningitis CSF polymorphs and findings -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6124: { to: 174, reason: "Autoimmune pancreatitis with IgG4-secreting plasma cells -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6200: { to: 139, reason: "Hyper-IgM syndrome flow cytometry defective CD40 signaling -> Pathology (Mod 139: Components of Immune System)" },
  6254: { to: 140, reason: "Sjogren syndrome sicca complex (keratoconjunctivitis and xerostomia) -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  6256: { to: 156, reason: "Leukoerythroblastosis in primary myelofibrosis -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6269: { to: 159, reason: "Abdominal aortic aneurysm and TGF-beta vascular remodeling -> Pathology (Mod 159: Aneurysm and Dissection)" },
  6338: { to: 158, reason: "Giant cell arteritis / Takayasu arteritis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6343: { to: 179, reason: "Pulmonary tuberculosis with upper lobe cavitation and caseating granuloma -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6374: { to: 180, reason: "Bronchiectasis caused by cystic fibrosis CFTR defect -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6381: { to: 158, reason: "Granulomatosis with polyangiitis (Wegener) with crescentic glomerulonephritis -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6400: { to: 165, reason: "Membranoproliferative glomerulonephritis (MPGN) GBM splitting on silver stain -> Pathology (Mod 165: Glomerular Diseases)" },
  6409: { to: 179, reason: "Aspiration pneumonia diffuse infiltrates -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6425: { to: 171, reason: "Hepatitis B viral replication markers (HBeAg, HBV DNA) -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6510: { to: 180, reason: "Farmer's lung hypersensitivity pneumonitis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6535: { to: 174, reason: "Risk factors for gallstone formation -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6604: { to: 179, reason: "COVID-19 post-mortem lung findings (diffuse alveolar damage) -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6605: { to: 179, reason: "Duration of gray hepatization stage in lobar pneumonia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6606: { to: 179, reason: "Inflammatory stages of lobar pneumonia -> Pathology (Mod 179: Congenital Anomalies, ARDS, Infections)" },
  6628: { to: 180, reason: "Usual interstitial pneumonitis (UIP) restrictive lung disease -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6639: { to: 182, reason: "Clear cell hyperplasia of parathyroid gland in hyperparathyroidism -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },
  6685: { to: 184, reason: "Recurrent painful subareolar breast abscess / Zuska disease -> Pathology (Mod 184: The Breast)" },

  // Module 131
  5333: { to: 137, reason: "Xeroderma pigmentosum nucleotide excision repair defect -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5346: { to: 186, reason: "Liposarcoma malignant neoplasm of adipose tissue -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5347: { to: 27, reason: "Nasmyth's membrane / primary enamel cuticle covering newly erupted teeth -> Anatomy (Mod 27: Oral Cavity & Pharynx)" },
  5359: { to: 187, reason: "Melanocytic nevus histology and maturation -> Pathology (Mod 187: Skin Pathology)" },
  5369: { to: 137, reason: "Warburg metabolism (aerobic glycolysis) in cancer cells -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5371: { to: 137, reason: "BRCA1 and BRCA2 DNA repair tumor suppressors -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5376: { to: 186, reason: "Rheumatoid arthritis pannus and synovial hyperplasia in hand joints -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5495: { to: 137, reason: "Epithelial-mesenchymal transition (EMT) transcription factors (SNAIL, TWIST) -> Pathology (Mod 137: Molecular Basis of Cancer and Tumor Immunity)" },
  5564: { to: 138, reason: "Cancer cachexia mediated by TNF-alpha -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6688: { to: 184, reason: "Fibroadenoma ('breast mouse') in young female -> Pathology (Mod 184: The Breast)" },

  // Module 132
  5385: { to: 188, reason: "Cerebral abscess autopsy findings -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5387: { to: 148, reason: "Factor V Leiden mutation (Arg506Gln) -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5950: { to: 168, reason: "Schistosoma haematobium causing hematuria and bladder cancer risk -> Pathology (Mod 168: Lower Urinary Tract)" },

  // Module 133
  5196: { to: 135, reason: "NF1 neurofibromin mutation mechanisms -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  5458: { to: 135, reason: "Neurofibromatosis type 1 clinical presentation and neurofibromas -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  5891: { to: 129, reason: "Chediak-Higashi syndrome phagolysosome defect -> Pathology (Mod 129: Acute Inflammation)" },
  6194: { to: 135, reason: "Fibrillin-1 mutation in Marfan syndrome -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6240: { to: 135, reason: "Marfan syndrome fibrillin defect and arachnodactyly -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },

  // Module 134
  4906: { to: 169, reason: "Pap smear cytology Papanicolaou stain -> Pathology (Mod 169: Female Genital Tract)" },
  4921: { to: 127, reason: "Moth-eaten cytoplasm in necrotic cells -> Pathology (Mod 127: Cell Death)" },
  5098: { to: 127, reason: "Wet gangrene following trauma -> Pathology (Mod 127: Cell Death)" },
  5118: { to: 180, reason: "Asbestos bodies in asbestosis pneumoconiosis -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  5147: { to: 157, reason: "Emperipolesis in Rosai-Dorfman disease -> Pathology (Mod 157: Leukemoid, Leukocytosis and Lymphadenitis)" },
  5209: { to: 130, reason: "IL-6 acute phase response -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5304: { to: 133, reason: "Pedigree symbol for adopted child -> Pathology (Mod 133: Modes of Inheritance)" },
  5411: { to: 153, reason: "Hairy cell leukemia morphology -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  5416: { to: 133, reason: "Modes of Mendelian inheritance matching -> Pathology (Mod 133: Modes of Inheritance)" },
  5463: { to: 130, reason: "Virchow / lepra cells in lepromatous leprosy -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5511: { to: 344, reason: "Leukocoria in retinoblastoma -> Ophthalmology (Mod 344: Diseases of Retina)" },
  5653: { to: 138, reason: "Tumor markers and associated conditions -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  5659: { to: 170, reason: "Seminoma gross specimen -> Pathology (Mod 170: Male Genital Tract)" },
  5682: { to: 93, reason: "Zona fasciculata glucocorticoid production -> Physiology (Mod 93: Adrenal Gland)" },
  5694: { to: 126, reason: "Core aspects of disease process (etiology, pathogenesis, morphology) -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  5869: { to: 172, reason: "Alpha-1 antitrypsin deficiency PAS-positive diastase resistant globules -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  5874: { to: 135, reason: "Familial hypercholesterolemia protein misfolding -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6002: { to: 149, reason: "Malaria transmission via blood components -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  6116: { to: 153, reason: "Smudge cells in chronic lymphocytic leukemia (CLL) -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  6154: { to: 168, reason: "Michaelis-Gutmann bodies in malakoplakia -> Pathology (Mod 168: Lower Urinary Tract)" },
  6214: { to: 158, reason: "ANCA negativity in Henoch-Schonlein purpura -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6399: { to: 167, reason: "Chromophobe renal cell carcinoma histology -> Pathology (Mod 167: Renal Tumors)" },
  6479: { to: 170, reason: "Seminoma histology and scrotal mass -> Pathology (Mod 170: Male Genital Tract)" },
  6540: { to: 168, reason: "Malakoplakia of urinary bladder with Michaelis-Gutmann bodies -> Pathology (Mod 168: Lower Urinary Tract)" },
  6544: { to: 174, reason: "Cholesterolosis of gallbladder ('strawberry gallbladder') -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6563: { to: 181, reason: "TTF-1 immunohistochemical marker for lung adenocarcinoma -> Pathology (Mod 181: Lung Tumors)" },
  6672: { to: 183, reason: "Follicular thyroid carcinoma capsular invasion -> Pathology (Mod 183: Thyroid Glands)" },
  6675: { to: 184, reason: "Fibroadenoma of breast histology -> Pathology (Mod 184: The Breast)" },
  6699: { to: 185, reason: "Paget's disease of bone mosaic pattern -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6709: { to: 185, reason: "Giant cell tumor of bone with soap bubble appearance -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },
  6732: { to: 187, reason: "Pemphigus vulgaris with intraepidermal blisters and fishnet IF -> Pathology (Mod 187: Skin Pathology)" },

  // Module 135
  5546: { to: 170, reason: "Isochromosome 12p in testicular germ cell tumors -> Pathology (Mod 170: Male Genital Tract)" },
  5561: { to: 130, reason: "TACE (tumor necrosis factor-alpha converting enzyme) -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5576: { to: 153, reason: "CLL definitive diagnosis and immunophenotyping -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },
  5635: { to: 171, reason: "Cryoglobulinemia association with Hepatitis C -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  5857: { to: 148, reason: "Factor V Leiden mutation in inherited thrombophilia -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5894: { to: 147, reason: "Platelet adhesion mediated by vWF and GpIb -> Pathology (Mod 147: Platelet Disorders)" },
  5948: { to: 145, reason: "Sickle cell anemia missense point mutation -> Pathology (Mod 145: Extravascular Hemolysis)" },
  6031: { to: 182, reason: "Pancreatic neuroendocrine tumor (insulinoma) -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },
  6057: { to: 156, reason: "CML with t(9;22) Philadelphia chromosome -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6258: { to: 156, reason: "FISH for Philadelphia chromosome in CML -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  6366: { to: 186, reason: "Ganglion cyst of wrist tendon sheath -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6491: { to: 165, reason: "Rapidly progressive glomerulonephritis (RPGN) with GBM rupture -> Pathology (Mod 165: Glomerular Diseases)" },
  6505: { to: 172, reason: "Wilson's disease with low ceruloplasmin -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6517: { to: 141, reason: "HLA matching in living donor transplantation -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  6590: { to: 187, reason: "Bullous dermatoses classification -> Pathology (Mod 187: Skin Pathology)" },
  6690: { to: 131, reason: "Type 1 collagen distribution in extracellular matrix -> Pathology (Mod 131: Tissue Repair)" },

  // Module 143
  5801: { to: 144, reason: "CD59 deficiency in paroxysmal nocturnal hemoglobinuria -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  5806: { to: 144, reason: "Paroxysmal nocturnal hemoglobinuria (PNH) intravascular hemolysis -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  5810: { to: 144, reason: "Flow cytometry for CD55 and CD59 in PNH -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  5812: { to: 144, reason: "Diagnostic confirmation of PNH by flow cytometry -> Pathology (Mod 144: Basics of Hemolysis and Intravascular Hemolysis)" },
  6093: { to: 153, reason: "Dry tap on bone marrow in Hairy cell leukemia -> Pathology (Mod 153: Non Hodgkin Lymphomas: Low Grade)" },

  // Module 144
  5139: { to: 128, reason: "Anthracotic pigment in hilar lymph nodes -> Pathology (Mod 128: Intracellular Accumulations, Pathological Calcification and Cellular Ageing)" },
  5781: { to: 146, reason: "Direct Coombs test in autoimmune hemolytic anemia -> Pathology (Mod 146: G6PD Deficiency and Autoimmune Hemolytic Anemias)" },
  5808: { to: 148, reason: "Heparin use in disseminated intravascular coagulation (DIC) -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  5859: { to: 146, reason: "G6PD deficiency hemolysis following sulfamethoxazole -> Pathology (Mod 146: G6PD Deficiency and Autoimmune Hemolytic Anemias)" },
  5881: { to: 147, reason: "Hemolytic uremic syndrome (HUS) with schistocytes after diarrhea -> Pathology (Mod 147: Platelet Disorders)" },
  5908: { to: 147, reason: "Thrombotic thrombocytopenic purpura (TTP) pentad -> Pathology (Mod 147: Platelet Disorders)" },
  5909: { to: 147, reason: "Total plasma exchange in TTP targeting ADAMTS13 -> Pathology (Mod 147: Platelet Disorders)" },
  5982: { to: 149, reason: "Febrile non-hemolytic transfusion reaction (FNHTR) -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  6009: { to: 189, reason: "Phlebotomy sequence of tubes for blood collection -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6112: { to: 143, reason: "Low reticulocyte percentage in megaloblastic anemia -> Pathology (Mod 143: Normocytic And Macrocytic Anemia)" },

  // Module 147
  5825: { to: 156, reason: "BCR-ABL translocation in CML with massive splenomegaly -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  5898: { to: 158, reason: "Henoch-Schonlein purpura (IgA vasculitis) -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  5900: { to: 149, reason: "Plateletpheresis and apheresis platelet collections -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },
  5905: { to: 156, reason: "Polycythemia vera evaluation and LAP score -> Pathology (Mod 156: Myelodysplastic Syndrome, Myeloproliferative Neoplasms and Histiocytosis)" },
  5907: { to: 151, reason: "Granulocytic sarcoma / chloroma in acute myeloid leukemia -> Pathology (Mod 151: Acute Myeloid Leukemia)" },
  5914: { to: 187, reason: "Dermatofibrosarcoma protuberans COL1A1-PDGFB translocation -> Pathology (Mod 187: Skin Pathology)" },
  5928: { to: 148, reason: "Von Willebrand disease with prolonged BT and aPTT -> Pathology (Mod 148: Coagulation Pathway Disorders)" },
  6222: { to: 171, reason: "Budd-Chiari syndrome hepatic vein thrombosis -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6749: { to: 149, reason: "Circulatory life span of transfused platelets -> Pathology (Mod 149: Blood Products and Transfusion Reactions)" },

  // Module 158
  6470: { to: 188, reason: "Ependymoma ventricular neoplasm -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6518: { to: 171, reason: "Liver function tests in parenchymal liver disease -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6593: { to: 188, reason: "Hemangioblastoma of cerebellum in VHL -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6643: { to: 183, reason: "Follicular adenoma needing capsular evaluation on histology -> Pathology (Mod 183: Thyroid Glands)" },
  6691: { to: 182, reason: "Brown tumor of hyperparathyroidism -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },
  6704: { to: 185, reason: "Acute hematogenous osteomyelitis of long bone -> Pathology (Mod 185: Developmental Disorders, Infections and Tumors of Bone)" },

  // Module 159
  2622: { to: 161, reason: "Anterior wall myocardial infarction with ST elevation -> Pathology (Mod 161: Heart Failure and Ischemic Heart Disease)" },
  4959: { to: 188, reason: "Tabes dorsalis in neurosyphilis -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5470: { to: 184, reason: "Aneuploidy in breast carcinoma -> Pathology (Mod 184: The Breast)" },

  // Module 160
  6277: { to: 187, reason: "HMB-45 tumor marker for malignant melanoma -> Pathology (Mod 187: Skin Pathology)" },
  6279: { to: 173, reason: "Hepatocellular adenoma in liver -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },
  6290: { to: 173, reason: "Thorotrast-induced hepatic angiosarcoma -> Pathology (Mod 173: Neoplasms of Liver and Biliary Tract)" },

  // Module 161
  6392: { to: 165, reason: "Goodpasture syndrome anti-GBM crescentic glomerulonephritis -> Pathology (Mod 165: Glomerular Diseases)" },
  6404: { to: 166, reason: "Renal tuberculosis with sterile pyuria and caseous necrosis -> Pathology (Mod 166: Tubulointerstitial, Vascular and Cystic Diseases)" },
  6405: { to: 141, reason: "Chronic allograft rejection in renal transplant -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  6414: { to: 187, reason: "Erythema migrans in Lyme disease -> Pathology (Mod 187: Skin Pathology)" },

  // Module 162
  4975: { to: 126, reason: "Cardiac hypertrophy cellular adaptations -> Pathology (Mod 126: Cellular Adaptations and Injury)" },
  5313: { to: 132, reason: "Septic infarction from embolization of vegetations -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  5638: { to: 170, reason: "Gleason grade 1 adenocarcinoma of prostate -> Pathology (Mod 170: Male Genital Tract)" },
  5732: { to: 141, reason: "Cardiac amyloidosis Congo red birefringence -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  6176: { to: 130, reason: "Procalcitonin marker of bacterial sepsis -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  6178: { to: 170, reason: "Testicular Sertoli cell tumor in Carney complex -> Pathology (Mod 170: Male Genital Tract)" },
  6300: { to: 131, reason: "Permanent vs stable cells in tissue repair -> Pathology (Mod 131: Tissue Repair)" },
  6304: { to: 188, reason: "Vulnerability of cerebral neurons to hypoxia -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6310: { to: 164, reason: "Aschoff bodies in rheumatic pancarditis -> Pathology (Mod 164: Rheumatic Fever and Endocarditis)" },
  6311: { to: 169, reason: "Ayer's spatula and cytobrush for cervical Pap smear -> Pathology (Mod 169: Female Genital Tract)" },
  6332: { to: 164, reason: "Bulky friable vegetations in infective endocarditis -> Pathology (Mod 164: Rheumatic Fever and Endocarditis)" },

  // Module 163
  6246: { to: 135, reason: "Plexiform neurofibroma in NF1 -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6313: { to: 186, reason: "Nemaline myopathy / congenital myopathy histology -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },

  // Module 166
  6358: { to: 326, reason: "Warthin tumor of parotid salivary gland -> ENT (Mod 326: Salivary Gland Tumors)" },
  6359: { to: 188, reason: "Medulloblastoma of cerebellum in child -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6360: { to: 186, reason: "Schwannoma showing Antoni A and Verocay bodies -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6361: { to: 188, reason: "Pilocytic astrocytoma with mural nodule in cerebellum -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6364: { to: 326, reason: "Warthin tumor of parotid gland with oncocytic epithelium -> ENT (Mod 326: Salivary Gland Tumors)" },
  6368: { to: 174, reason: "Solid pseudopapillary neoplasm of pancreas with beta-catenin mutation -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6369: { to: 160, reason: "Hemangioma as most common benign tumor of infancy -> Pathology (Mod 160: Vascular Tumors)" },

  // Module 167
  6199: { to: 135, reason: "FBN1 mutation coding for fibrillin in Marfan syndrome -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6386: { to: 165, reason: "Membranoproliferative glomerulonephritis lobular accentuation -> Pathology (Mod 165: Glomerular Diseases)" },
  6394: { to: 165, reason: "Tramtrack appearance of GBM in MPGN -> Pathology (Mod 165: Glomerular Diseases)" },
  6397: { to: 158, reason: "Onion skin hyperplastic arteriolosclerosis in malignant hypertension -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6407: { to: 181, reason: "Malignant mesothelioma strongest association with asbestosis -> Pathology (Mod 181: Lung Tumors)" },
  6646: { to: 183, reason: "Medullary thyroid carcinoma RET gene mutation -> Pathology (Mod 183: Thyroid Glands)" },

  // Module 168
  6181: { to: 187, reason: "Sebaceous neoplasms in Muir-Torre syndrome -> Pathology (Mod 187: Skin Pathology)" },
  6245: { to: 186, reason: "Reactive arthritis (Reiter syndrome) association with HLA-B27 -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6393: { to: 165, reason: "Membranous nephropathy with subepithelial deposits -> Pathology (Mod 165: Glomerular Diseases)" },
  6398: { to: 165, reason: "Minimal change disease podocyte effacement -> Pathology (Mod 165: Glomerular Diseases)" },
  6401: { to: 165, reason: "Post-streptococcal glomerulonephritis hypercellularity -> Pathology (Mod 165: Glomerular Diseases)" },
  6411: { to: 188, reason: "Neural tube defect / myelomeningocele -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6415: { to: 331, reason: "Chlamydia trachomatis conjunctivitis -> Ophthalmology (Mod 331: Diseases of Conjunctiva)" },
  6416: { to: 189, reason: "Urine microscopy crystal identification -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6417: { to: 38, reason: "Supine foreign body aspiration into apical segment of RLL -> Anatomy (Mod 38: Lungs & Tracheobronchial Tree)" },
  6418: { to: 38, reason: "Peanut aspiration into right bronchus / RLL -> Anatomy (Mod 38: Lungs & Tracheobronchial Tree)" },
  6419: { to: 165, reason: "Post-streptococcal glomerulonephritis in child -> Pathology (Mod 165: Glomerular Diseases)" },

  // Module 170
  6480: { to: 178, reason: "Familial adenomatous polyposis (FAP) multiple colonic polyps -> Pathology (Mod 178: Large Intestine - Non Neoplastic Conditions)" },
  6492: { to: 165, reason: "Membranous glomerulopathy with subepithelial IgG deposits -> Pathology (Mod 165: Glomerular Diseases)" },
  6497: { to: 158, reason: "Strawberry gums in Granulomatosis with polyangiitis (Wegener) -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6500: { to: 187, reason: "Nodular melanoma vertical growth phase -> Pathology (Mod 187: Skin Pathology)" },
  6509: { to: 181, reason: "Lung carcinoma differentiation markers (TTF1, p40, p63) -> Pathology (Mod 181: Lung Tumors)" },
  6734: { to: 138, reason: "Acanthosis nigricans as paraneoplastic marker and skin manifestation -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },

  // Module 171
  5408: { to: 130, reason: "C1 esterase inhibitor deficiency in hereditary angioedema -> Pathology (Mod 130: Inflammatory Mediators and Chronic Granulomatous Inflammation)" },
  5697: { to: 140, reason: "Mantoux / tuberculin skin test Type IV delayed hypersensitivity -> Pathology (Mod 140: Hypersensitivity and Autoimmunity)" },
  5970: { to: 132, reason: "Active hyperemia and vascular dilation mechanisms -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  6437: { to: 169, reason: "Candidal vaginitis with budding cells and pseudohyphae -> Pathology (Mod 169: Female Genital Tract)" },
  6612: { to: 161, reason: "Nutmeg liver in chronic passive congestion from heart failure -> Pathology (Mod 161: Heart Failure and Ischemic Heart Disease)" },
  6657: { to: 183, reason: "RET proto-oncogene in Medullary thyroid carcinoma -> Pathology (Mod 183: Thyroid Glands)" },
  6728: { to: 172, reason: "Primary sclerosing cholangitis with pANCA and bile duct fibrosis -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },

  // Module 174
  5746: { to: 182, reason: "Islet amyloid polypeptide (amylin) in Type 2 Diabetes Mellitus -> Pathology (Mod 182: Pituitary, Parathyroid and Pancreas)" },

  // Module 175
  5527: { to: 138, reason: "Obesity-associated malignancies and hormonal/inflammatory mechanisms -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6196: { to: 174, reason: "Familial syndromes predisposing to pancreatic adenocarcinoma -> Pathology (Mod 174: Gall Bladder and Pancreas)" },
  6536: { to: 138, reason: "Smoking as chemical carcinogen in various malignancies -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },

  // Module 178
  5141: { to: 186, reason: "Pigmented villonodular synovitis of tendon sheaths -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  5449: { to: 127, reason: "Autophagy-related genes (Atg) and mechanisms in human diseases -> Pathology (Mod 127: Cell Death)" },
  5453: { to: 188, reason: "SOD1 gene mutation in amyotrophic lateral sclerosis (ALS) -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  5658: { to: 138, reason: "Paraneoplastic endocrine syndromes (hypoglycemia/hyperglycemia) -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  5733: { to: 141, reason: "Secondary amyloidosis (AA protein) in chronic inflammation -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  5968: { to: 201, reason: "Invasive bacillary and amoebic dysentery -> Microbiology (Mod 201: Enterobacteriaceae)" },
  5976: { to: 141, reason: "Living donor kidney transplant eligibility and HLA crossmatching -> Pathology (Mod 141: Amyloidosis and Graft Rejection)" },
  6087: { to: 176, reason: "Virchow's node from gastric adenocarcinoma -> Pathology (Mod 176: Stomach)" },
  6201: { to: 172, reason: "Dubin-Johnson syndrome conjugated hyperbilirubinemia -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6340: { to: 172, reason: "Primary sclerosing cholangitis ERCP beaded appearance -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6580: { to: 158, reason: "Microscopic polyangiitis with P-ANCA and pulmonary-renal syndrome -> Pathology (Mod 158: Hypertensive Vascular Disease and Atherosclerosis)" },
  6588: { to: 188, reason: "Glioblastoma multiforme serpentine pseudopalisading necrosis -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6591: { to: 184, reason: "Mucinous (colloid) carcinoma of breast -> Pathology (Mod 184: The Breast)" },
  6596: { to: 189, reason: "DNA microarrays in gene expression analysis -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6597: { to: 184, reason: "Invasive ductal carcinoma of breast histology -> Pathology (Mod 184: The Breast)" },
  6662: { to: 183, reason: "Papillary carcinoma of thyroid with clear Orphan Annie nuclei -> Pathology (Mod 183: Thyroid Glands)" },
  6703: { to: 151, reason: "Acute myeloid leukemia (AML M4/M5) with gingival hypertrophy and MPO positivity -> Pathology (Mod 151: Acute Myeloid Leukemia)" },

  // Module 179
  5824: { to: 145, reason: "Sickle cell anemia vaso-occlusive crisis and acute abdominal pain -> Pathology (Mod 145: Extravascular Hemolysis)" },
  5844: { to: 142, reason: "Beta-thalassemia major with severe anemia, jaundice and bone changes -> Pathology (Mod 142: Microcytic Anemia)" },
  6028: { to: 165, reason: "IgA nephropathy (Berger disease) recurrent hematuria after URI -> Pathology (Mod 165: Glomerular Diseases)" },
  6223: { to: 172, reason: "Dubin-Johnson and Rotor syndrome conjugated hyperbilirubinemia -> Pathology (Mod 172: Autoimmune and Metabolic Liver Diseases)" },
  6613: { to: 129, reason: "Leukocyte adhesion deficiency (LAD-1) with delayed umbilical cord separation -> Pathology (Mod 129: Acute Inflammation)" },

  // Module 183
  5655: { to: 138, reason: "Immunohistochemical markers for neuroendocrine tumors (synaptophysin, chromogranin) -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6221: { to: 162, reason: "Carney complex cardiac myxoma components -> Pathology (Mod 162: Myocardial and Pericardial Diseases and Cardiac Tumors)" },
  6641: { to: 169, reason: "Endometriosis causing cyclic abdominal pain and dysmenorrhea -> Pathology (Mod 169: Female Genital Tract)" },

  // Module 184
  5512: { to: 136, reason: "Routes of metastasis: lymphatic in carcinomas vs hematogenous in sarcomas -> Pathology (Mod 136: Characteristics of Neoplasms and Epidemiology)" },
  6436: { to: 165, reason: "Membranous nephropathy secondary to solid malignancies -> Pathology (Mod 165: Glomerular Diseases)" },
  6677: { to: 490, reason: "Latissimus dorsi flap for breast reconstruction after mastectomy -> Surgery (Mod 490: Breast Diseases)" },
  6683: { to: 189, reason: "DAB chromogen staining in immunohistochemistry -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },

  // Module 187
  6733: { to: 171, reason: "Palmar erythema from impaired estrogen metabolism in cirrhosis -> Pathology (Mod 171: Alcoholic and Infectious Liver Diseases)" },
  6737: { to: 165, reason: "Henoch-Schonlein purpura nephritis with mesangial IgA deposits -> Pathology (Mod 165: Glomerular Diseases)" },
  6739: { to: 131, reason: "Re-epithelialization of burn wounds from basal stem cells -> Pathology (Mod 131: Tissue Repair)" },
  6740: { to: 131, reason: "Epidermal stem cells in skin regeneration -> Pathology (Mod 131: Tissue Repair)" },
  6741: { to: 180, reason: "Sarcoidosis systemic organ involvement and pulmonary manifestations -> Pathology (Mod 180: Obstructive and Restrictive Lung Diseases)" },
  6742: { to: 138, reason: "UV-B pyrimidine dimer formation in carcinogenesis -> Pathology (Mod 138: Carcinogenesis, Paraneoplastic Syndromes and Tumor Markers)" },
  6754: { to: 189, reason: "10% buffered neutral formalin fixative in histopathology -> Pathology (Mod 189: Mixed / Miscellaneous Topics)" },
  6768: { to: 169, reason: "Adenomyosis diagnosis and clinical pathology -> Pathology (Mod 169: Female Genital Tract)" },

  // Module 188
  5921: { to: 135, reason: "Optic glioma in Neurofibromatosis type 1 -> Pathology (Mod 135: Chromosomal Disorders and Other Genetic Diseases)" },
  6303: { to: 132, reason: "Sympathetic and baroreceptor compensatory reflexes in nonprogressive shock -> Pathology (Mod 132: Disorders of Hemodynamics and Hemostasis)" },
  6744: { to: 209, reason: "Viral quantification by plaque assay -> Microbiology (Mod 209: General Virology)" },

  // Module 189
  6746: { to: 188, reason: "Ganglioglioma neuronal-glial CNS neoplasm -> Pathology (Mod 188: Infective and Vascular CNS Pathology)" },
  6747: { to: 129, reason: "NADPH oxidase (PHOX) in respiratory burst of neutrophils -> Pathology (Mod 129: Acute Inflammation)" },
  6750: { to: 169, reason: "Sequential steps of cervical Pap smear -> Pathology (Mod 169: Female Genital Tract)" },
  6751: { to: 169, reason: "Actinomyces colonies in Pap smear -> Pathology (Mod 169: Female Genital Tract)" },
  6752: { to: 187, reason: "Melanoma immunohistochemical markers (Melan-A, SOX10, S100) -> Pathology (Mod 187: Skin Pathology)" },
  6756: { to: 152, reason: "Nodular lymphocyte predominant Hodgkin lymphoma (NLPHL) -> Pathology (Mod 152: Hodgkin's Lymphoma)" },
  6757: { to: 157, reason: "Eosinophilia in parasitic infections -> Pathology (Mod 157: Leukemoid, Leukocytosis and Lymphadenitis)" },
  6758: { to: 186, reason: "Extra-articular manifestations of Rheumatoid arthritis -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6759: { to: 186, reason: "Anti-CCP and Rheumatoid factor antibodies -> Pathology (Mod 186: Joints and Soft Tissue Tumors)" },
  6760: { to: 187, reason: "Ribbon candy linear IF at basement membrane in Bullous pemphigoid -> Pathology (Mod 187: Skin Pathology)" },
  6764: { to: 259, reason: "Penicillin treatment for Actinomycosis -> Pharmacology (Mod 259: Penicillins)" },
  6765: { to: 389, reason: "Epidemiology of sexually transmitted infections (Chlamydia) -> PSM (Mod 389: National AIDS and STI Control)" },
  6766: { to: 262, reason: "Antimalarial therapeutics in malignant falciparum malaria -> Pharmacology (Mod 262: Antimalarial Drugs)" },
  6767: { to: 259, reason: "Ampicillin as drug of choice for Listeria meningitis -> Pharmacology (Mod 259: Penicillins)" }
};

// Now let's loop over all questions and check explicit overrides or general rules
const finalMoves = [];

questions.forEach(q => {
  if (explicitOverrides[q.id]) {
    const override = explicitOverrides[q.id];
    if (q.module_id !== override.to) {
      finalMoves.push({
        id: q.id,
        fromModule: q.module_id,
        toModule: override.to,
        reason: override.reason
      });
    }
  }
});

console.log(`Explicit verified overrides found: ${finalMoves.length}`);
