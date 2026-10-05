const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/live_fresh_surgery.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

console.log(`Loaded ${rawQuestions.length} live questions for Surgery.`);

function clean(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const questions = rawQuestions.map(q => {
  const qText = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const optE = clean(q.option_e || '');
  const expl = clean(q.explanation);
  const ansLetter = (q.answer || '').trim().toUpperCase();
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;
  else if (ansLetter === 'E') ansText = optE;

  const full = `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${qText} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    qText,
    ansLetter,
    ansText,
    expl,
    qa,
    full
  };
});

function audit(q) {
  const cur = q.currentModule;
  const id = q.id;
  const qa = q.qa;
  const full = q.full;
  const text = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();

  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inText = (...terms) => terms.some(t => text.includes(t.toLowerCase()));
  const inAns = (...terms) => terms.some(t => ans.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // 1. CROSS-SUBJECT CHECKS
  // OB & G: Menstrual bleeding, fibroids, pregnancy complications
  if (inQA('heavy menstrual bleeding', 'abnormal uterine bleeding', 'adenomyosis in uterus', 'uterine fibroid', 'ectopic pregnancy', 'placenta previa', 'preeclampsia in pregnancy')) {
    return { toModule: 558, reason: 'Tests abnormal uterine bleeding and gynecological disorders, belonging to OB & G: Disorders of Menstruation (Module 558).' };
  }
  // Orthopaedics: Fractures, hip dislocation, bone tumors
  if (inQA('supracondylar fracture of humerus', 'colles fracture', 'smith fracture', 'scaphoid fracture', 'femoral neck fracture', 'intertrochanteric fracture', 'osteosarcoma', 'ewing sarcoma', 'giant cell tumor of bone', 'ddh in child', 'ctev clubfoot')) {
    return { toModule: 661, reason: 'Tests orthopaedic bone fractures, dislocations, or primary bone neoplasms, belonging to Orthopaedics.' };
  }
  // Anaesthesia: Airway assessment, intubation devices, muscle relaxants
  if (inQA('mallampati score', 'cormack-lehane', 'laryngeal mask airway in anaesthesia', 'rapid sequence induction', 'succinylcholine in anaesthesia', 'vecuronium in anaesthesia', 'malignant hyperthermia treatment', 'dantrolene', 'spinal anaesthesia hypotension', 'epidural anaesthesia space')) {
    return { toModule: 613, reason: 'Tests anaesthetic airway assessment, pharmacological neuromuscular blockade, and neuraxial techniques, belonging to Anaesthesia.' };
  }
  // PSM: Biomedical waste segregation
  if (inQA('biomedical waste management', 'yellow bag waste', 'red bag waste', 'blue container waste', 'sharp waste disposal') && !inFull('wound', 'who checklist')) {
    return { toModule: 396, reason: 'Tests biomedical waste segregation categories and disposal rules, belonging to PSM: Biomedical Waste Management (Module 396).' };
  }

  // 2. INTRA-SURGERY SPECIALTY ROUTING

  // 522: Oral Cavity & Salivary Glands
  if (inQA('oral cavity', 'buccal mucosa', 'tongue carcinoma', 'pleomorphic adenoma', 'warthin tumor', 'parotid', 'submandibular gland', 'salivary gland', 'ranula', 'leukoplakia', 'erythroplakia', 'sublingual gland', 'superficial parotidectomy', 'frey syndrome', 'sialolithiasis') &&
      !inFull('head injury', 'thyroid')) {
    if (cur !== 522) return { toModule: 522, reason: 'Tests oral cavity cancers, premalignant lesions, and salivary gland pathology/surgery, belongs in Surgery: Oral Cavity & Salivary glands (Module 522).' };
  }

  // 521: Head Injury (EDH, SDH, SAH, skull fractures)
  if (inQA('extradural hematoma', 'edh', 'subdural hematoma', 'sdh', 'middle meningeal artery', 'lucid interval', 'biconvex', 'lentiform', 'crescentic hematoma', 'pterion', 'depressed skull fracture', 'diffuse axonal injury', 'basilar skull fracture', 'battle sign', 'raccoon eyes') ||
      (inText('head injury') && inFull('hematoma', 'ct head', 'coma'))) {
    if (cur !== 521) return { toModule: 521, reason: 'Tests traumatic brain injury, intracranial hemorrhages (EDH, SDH), and skull fractures, belongs in Surgery: Head Injury (Module 521).' };
  }

  // 520: Testes and Scrotum
  if (inQA('testicular torsion', 'orchidopexy', 'cremasteric reflex in torsion', 'prehn sign', 'seminoma', 'non-seminomatous germ cell', 'hydrocele', 'varicocele', 'bag of worms', 'orchiectomy inguinal', 'undescended testis', 'cryptorchidism')) {
    if (cur !== 520) return { toModule: 520, reason: 'Tests testicular emergencies (torsion), neoplasms (seminoma/NSGCT), and scrotal swelling (hydrocele/varicocele), belongs in Surgery: Testes and Scrotum (Module 520).' };
  }

  // 518 & 519: Prostate, Urethra, Penis
  if (inQA('benign prostatic hyperplasia', 'bph', 'turp', 'prostate cancer', 'gleason score', 'psa level in prostate', 'tamsulosin in bph', 'finasteride in bph')) {
    if (cur !== 518) return { toModule: 518, reason: 'Tests benign and malignant prostate pathology (BPH, TURP, Prostate adenocarcinoma), belongs in Surgery: Prostate (Module 518).' };
  }
  if (inQA('urethral stricture', 'retrograde urethrogram', 'urethroplasty', 'carcinoma penis', 'phimosis', 'paraphimosis', 'hypospadias in surgery', 'epispadias in surgery', 'posterior urethral distraction')) {
    if (cur !== 519) return { toModule: 519, reason: 'Tests diseases of urethra and penis (urethral trauma, strictures, penile cancer), belongs in Surgery: Urethra and Penis (Module 519).' };
  }

  // 517: Bladder and Ureters
  if (inQA('bladder cancer', 'transitional cell carcinoma of bladder', 'urothelial carcinoma', 'turbt', 'cystectomy', 'ileal conduit', 'ureteric injury in pelvic surgery', 'painless gross hematuria in smoker')) {
    if (cur !== 517) return { toModule: 517, reason: 'Tests diseases of urinary bladder and ureters (bladder urothelial carcinoma, ureteric surgical trauma), belongs in Surgery: Urinary Bladder and Ureters (Module 517).' };
  }

  // 515 & 516: Kidney Calculi & Tumors
  if (inQA('renal cell carcinoma', 'rcc', 'clear cell renal', 'von hippel lindau rcc', 'radical nephrectomy', 'partial nephrectomy', 'triad of rcc') ||
      (inText('flank mass') && inFull('hematuria', 'renal cell'))) {
    if (cur !== 516) return { toModule: 516, reason: 'Tests renal parenchyma infections and malignancies (Renal Cell Carcinoma), belongs in Surgery: Infections and Tumors of Kidney (Module 516).' };
  }
  if (inQA('renal calculi', 'kidney stone', 'calcium oxalate stone', 'struvite stone', 'staghorn calculus', 'eswl', 'pcnl', 'rirs', 'ureteric stone', 'hydronephrosis calculi', 'pu-junction obstruction', 'anderson hynes')) {
    if (cur !== 515) return { toModule: 515, reason: 'Tests urolithiasis (renal/ureteric stones, PCNL/ESWL) and congenital PUJ obstruction, belongs in Surgery: Congenital Diseases of Kidney and Urinary Calculi (Module 515).' };
  }

  // 512, 513, 514: Pancreas
  if (inQA('carcinoma pancreas', 'pancreatic adenocarcinoma', 'whipple procedure', 'pancreaticoduodenectomy', 'courvoisier sign', 'double duct sign', 'ca 19-9 in pancreas', 'painless jaundice in elderly')) {
    if (cur !== 514) return { toModule: 514, reason: 'Tests pancreatic head ductal adenocarcinoma, Courvoisier sign, and Whipple operation, belongs in Surgery: Carcinoma Pancreas (Module 514).' };
  }
  if (inQA('chronic pancreatitis', 'pancreatic calcification', 'frey procedure', 'puestow procedure', 'chain of lakes')) {
    if (cur !== 513) return { toModule: 513, reason: 'Tests chronic pancreatitis, pancreatic lithiasis, and surgical drainage/resection procedures, belongs in Surgery: Chronic Pancreatitis (Module 513).' };
  }
  if (inQA('acute pancreatitis', 'pancreatic pseudocyst', 'cystogastrostomy', 'atlanta classification', 'bisap score in pancreatitis', 'pancreatic necrosis debridement', 'lipase in pancreatitis')) {
    if (cur !== 512) return { toModule: 512, reason: 'Tests acute pancreatitis complications, scoring systems, and pseudocyst surgical management, belongs in Surgery: Congenital Anomalies and Acute Pancreatitis (Module 512).' };
  }
  if (inQA('insulinoma in pancreas', 'whipple triad', 'gastrinoma in surgery', 'zollinger-ellison surgery', 'neuroendocrine tumor of pancreas', 'vipoma')) {
    if (cur !== 511) return { toModule: 511, reason: 'Tests functional neuroendocrine tumors of pancreas (insulinoma, gastrinoma), belongs in Surgery: Endocrine Pancreas (Module 511).' };
  }

  // 508 & 509: Gallbladder and Bile Ducts
  if (inQA('gallbladder carcinoma', 'cholelithiasis', 'cholecystitis', 'murphy sign', 'laparoscopic cholecystectomy', 'gallstone ileus', 'rigler triad', 'porcelain gallbladder', 'calot triangle', 'cystic artery')) {
    if (cur !== 508) return { toModule: 508, reason: 'Tests gallstone disease, cholecystitis, Calot anatomy, and gallbladder carcinoma, belongs in Surgery: Gall Bladder (Module 508).' };
  }
  if (inQA('choledocholithiasis', 'common bile duct stone', 'cholangitis', 'charcot triad', 'reynolds pentad', 'choledochal cyst', 'todani', 'klatskin tumor', 'cholangiocarcinoma', 'biliary stricture', 'strasberg')) {
    if (cur !== 509) return { toModule: 509, reason: 'Tests bile duct stones, ascending cholangitis, choledochal cysts, and cholangiocarcinoma, belongs in Surgery: Bile Duct (Module 509).' };
  }

  // 505, 506, 507: Liver
  if (inQA('hepatocellular carcinoma', 'hcc', 'alpha-fetoprotein in liver', 'milan criteria', 'tace in hcc', 'liver metastasis resection', 'radiofrequency ablation of liver')) {
    if (cur !== 507) return { toModule: 507, reason: 'Tests primary malignant liver neoplasms (HCC) and liver metastases, belongs in Surgery: Malignant Tumors of Liver (Module 507).' };
  }
  if (inQA('hepatic hemangioma', 'focal nodular hyperplasia', 'hepatic adenoma', 'cavernous hemangioma of liver')) {
    if (cur !== 506) return { toModule: 506, reason: 'Tests benign solid neoplasms of liver (hemangioma, FNH, adenoma), belongs in Surgery: Benign Tumors of Liver (Module 506).' };
  }
  if (inQA('amebic liver abscess', 'pyogenic liver abscess', 'hydatid cyst of liver', 'echinococcus liver', 'anchovy sauce pus', 'pair procedure for hydatid')) {
    if (cur !== 505) return { toModule: 505, reason: 'Tests infective and parasitic liver lesions (abscesses, hydatid cysts), belongs in Surgery: Benign Conditions of Liver (Module 505).' };
  }

  // 504: Hernias
  if (inQA('inguinal hernia', 'indirect inguinal', 'direct inguinal', 'hesselbach triangle', 'lichtenstein repair', 'femoral hernia', 'umbilical hernia in adult', 'incisional hernia', 'strangulated hernia', 'obstructed hernia', 'tapp repair', 'tep repair', 'inferior epigastric vessels hernia')) {
    if (cur !== 504) return { toModule: 504, reason: 'Tests groin and abdominal wall hernias (inguinal, femoral, incisional, strangulated), belongs in Surgery: Hernia (Module 504).' };
  }

  // 503: Anus and Anal Canal
  if (inQA('hemorrhoids', 'piles', 'anal fissure', 'fistula-in-ano', 'goodsall rule', 'perianal abscess', 'pilonidal sinus', 'sphincterotomy', 'fistulotomy', 'sentinel pile', 'ischiorectal abscess')) {
    if (cur !== 503) return { toModule: 503, reason: 'Tests perianal and anorectal benign conditions (hemorrhoids, fissure, fistula, abscess), belongs in Surgery: Anus and Anal Canal (Module 503).' };
  }

  // 501 & 502: Rectum, Polyps & Colorectal Cancer
  if (inQA('colorectal cancer', 'colon cancer', 'adenomatous polyposis coli', 'fap', 'lynch syndrome colorectal', 'apple core lesion on barium', 'total mesorectal excision', 'tme', 'abdominoperineal resection', 'apr miles', 'low anterior resection', 'lar in rectal', 'rectal prolapse')) {
    if (cur !== 501 && cur !== 502) return { toModule: 501, reason: 'Tests colorectal polyps, inherited polyposis syndromes, and colorectal cancer, belongs in Surgery: Polyps and Colorectal Carcinoma (Module 501).' };
  }

  // 500: Appendix
  if (inQA('acute appendicitis', 'mcburney point', 'alvarado score', 'appendectomy', 'appendicolith', 'rovsing sign', 'psoas sign in appendicitis', 'obturator sign in appendicitis')) {
    if (cur !== 500) return { toModule: 500, reason: 'Tests acute appendicitis clinical diagnosis, signs, Alvarado score, and appendectomy, belongs in Surgery: Appendix (Module 500).' };
  }

  // 498 & 499: Small & Large Intestine
  if (inQA('small bowel obstruction', 'adhesive intestinal obstruction', 'step ladder pattern', 'diverticulitis', 'hinchey classification', 'sigmoid volvulus', 'coffee bean sign', 'hartmann procedure', 'crohn strictureplasty', 'ileostomy')) {
    if (cur !== 498 && cur !== 499) return { toModule: 498, reason: 'Tests mechanical intestinal obstruction, volvulus, diverticulitis, and stomas, belongs in Surgery: Small/Large Intestine.' };
  }

  // 495 & 496: Stomach & Duodenum
  if (inQA('gastric cancer', 'carcinoma stomach', 'linitis plastica', 'virchow node', 'sister mary joseph', 'd2 gastrectomy', 'signet ring cell in stomach')) {
    if (cur !== 496) return { toModule: 496, reason: 'Tests gastric adenocarcinoma, metastases, and surgical resection, belongs in Surgery: Carcinoma Stomach (Module 496).' };
  }
  if (inQA('peptic ulcer perforation', 'graham patch', 'gastroduodenal artery bleeding', 'gastric outlet obstruction', 'duodenal ulcer surgical', 'vagotomy and drainage')) {
    if (cur !== 495) return { toModule: 495, reason: 'Tests peptic ulcer disease surgical complications (perforation, hemorrhage, outlet obstruction), belongs in Surgery: Stomach and Duodenum (Module 495).' };
  }

  // 497: Bariatric Surgery
  if (inQA('bariatric surgery', 'roux-en-y gastric bypass', 'sleeve gastrectomy', 'dumping syndrome post bariatric', 'metabolic surgery for obesity')) {
    if (cur !== 497) return { toModule: 497, reason: 'Tests bariatric and metabolic surgical procedures for morbid obesity, belongs in Surgery: Metabolic & Bariatric Surgery (Module 497).' };
  }

  // 493 & 494: Esophagus
  if (inQA('esophageal cancer', 'carcinoma esophagus', 'barrett esophagus surgery', 'siewert classification', 'ivor lewis esophagectomy', 'adenocarcinoma of esophagus')) {
    if (cur !== 494) return { toModule: 494, reason: 'Tests Barrett esophagus adenocarcinoma and esophageal malignancies, belongs in Surgery: Esophagus - GERD & Carcinoma (Module 494).' };
  }
  if (inQA('achalasia cardia', 'bird beak sign', 'heller myotomy', 'diffuse esophageal spasm', 'corkscrew esophagus', 'zenker diverticulum', 'killian dehiscence', 'boerhaave syndrome', 'mackler triad')) {
    if (cur !== 493) return { toModule: 493, reason: 'Tests esophageal motility disorders (achalasia, DES), diverticula (Zenker), and perforation (Boerhaave), belongs in Surgery: Esophagus - Congenital, Motility & Inflammatory Disorders (Module 493).' };
  }

  // 491 & 492: Thyroid
  if (inQA('papillary thyroid carcinoma', 'follicular thyroid carcinoma', 'medullary thyroid carcinoma', 'anaplastic thyroid carcinoma', 'psammoma bodies in thyroid', 'orphan annie', 'calcitonin in medullary', 'ret proto-oncogene in thyroid', 'post-thyroidectomy hypocalcemia', 'recurrent laryngeal nerve injury')) {
    if (cur !== 492) return { toModule: 492, reason: 'Tests thyroid malignancies (PTC, FTC, MTC, ATC) and post-thyroidectomy complications, belongs in Surgery: Thyroid Malignancies (Module 492).' };
  }
  if (inQA('multinodular goiter', 'thyroglossal cyst', 'sistrunk', 'toxic adenoma of thyroid', 'graves disease surgery', 'solitary thyroid nodule fnac', 'bethesda thyroid')) {
    if (cur !== 491) return { toModule: 491, reason: 'Tests benign thyroid disorders, multinodular goiter, thyroglossal cyst Sistrunk operation, belongs in Surgery: Benign Lesions of Thyroid (Module 491).' };
  }

  // 487-490: Breast
  if (inQA('carcinoma breast', 'breast cancer', 'ductal carcinoma in situ', 'dcis', 'invasive ductal carcinoma', 'paget disease of nipple', 'peau d orange', 'brca1 in breast', 'brca2 in breast', 'birads in mammography', 'triple assessment of breast', 'modified radical mastectomy', 'mrm', 'breast conserving surgery', 'sentinel lymph node in breast', 'tamoxifen in breast', 'trastuzumab in breast')) {
    if (cur < 487 || cur > 490) return { toModule: 487, reason: 'Tests breast carcinoma diagnosis, staging, histopathology and surgical management, belongs in Surgery: Carcinoma Breast (Modules 487-490).' };
  }
  if (inQA('fibroadenoma of breast', 'fibrocystic breast', 'phylloides tumor', 'intraductal papilloma of breast', 'bloody nipple discharge', 'breast abscess', 'mastitis', 'mondor disease')) {
    if (cur !== 486) return { toModule: 486, reason: 'Tests benign breast conditions (fibroadenoma, intraductal papilloma, phylloides), belongs in Surgery: Breast - Anatomy, Congenital and Benign Diseases (Module 486).' };
  }

  // 484 & 485: Trauma
  if (inQA('tension pneumothorax needle', 'flail chest paradoxical', 'cardiac tamponade beck triad', 'pericardiocentesis in trauma', 'splenic injury trauma', 'liver trauma laceration', 'blunt abdominal trauma fast', 'pelvic fracture hemorrhage binder')) {
    if (cur !== 485) return { toModule: 485, reason: 'Tests thoracic, abdominal and pelvic traumatic visceral injuries and emergency decompression, belongs in Surgery: Trauma - Spinal, Thoracic and Abdominal Injuries (Module 485).' };
  }
  if (inQA('atls primary survey', 'glasgow coma scale in trauma', 'injury severity score', 'revised trauma score', 'fast ultrasound in trauma', 'diagnostic peritoneal lavage dpl')) {
    if (cur !== 484) return { toModule: 484, reason: 'Tests ATLS trauma resuscitation protocols, GCS, FAST scan, and trauma triage scoring, belongs in Surgery: Trauma - Scores, Investigations and Assessment (Module 484).' };
  }

  // 483: Paediatric Surgery
  if (inQA('omphalocele vs gastroschisis', 'congenital diaphragmatic hernia in surgery', 'bochdalek hernia surgery', 'tracheoesophageal fistula tef', 'pyloric stenosis ramstedt', 'hirschsprung surgery', 'anorectal malformation invertogram')) {
    if (cur !== 483) return { toModule: 483, reason: 'Tests pediatric surgical conditions (omphalocele, gastroschisis, CDH, TEF, anorectal malformations), belongs in Surgery: Paediatric Surgery (Module 483).' };
  }

  // 482: Instruments & Sutures
  if (inQA('suture material', 'absorbable suture', 'non-absorbable suture', 'vicryl', 'catgut', 'prolene in surgery', 'silk suture', 'pds suture', 'babcock forceps', 'allis forceps', 'kocher clamp', 'harmonic scalpel', 'electrocautery diathermy')) {
    if (cur !== 482) return { toModule: 482, reason: 'Tests surgical instruments, suture materials, needle profiles, and energy devices, belongs in Surgery: Instruments & Sutures (Module 482).' };
  }

  // 481: Shock & Blood Transfusion
  if (inQA('hypovolemic shock in trauma', 'septic shock resuscitation', 'massive blood transfusion protocol', 'taco vs trali', 'atls hemorrhage classes', 'blood transfusion reactions in surgery', 'thromboelastography')) {
    if (cur !== 481) return { toModule: 481, reason: 'Tests shock classification, ATLS hemorrhage stages, and massive transfusion protocols, belongs in Surgery: Shock and Blood Transfusion (Module 481).' };
  }

  // 480: Fluids, Electrolytes & Nutrition
  if (inQA('refeeding syndrome in surgical patient', 'total parenteral nutrition tpn', 'hypophosphatemia in tpn', 'fluid requirement in surgery', 'holliday segar', 'eras protocol in surgery')) {
    if (cur !== 480) return { toModule: 480, reason: 'Tests perioperative fluid/electrolyte balance, refeeding syndrome, and surgical nutrition (TPN/ERAS), belongs in Surgery: Fluids, Electrolytes & Nutrition (Module 480).' };
  }

  // 523: Burns
  if (inQA('burn injury', 'rule of nines', 'parkland formula in burns', 'escharotomy', 'inhalation injury burns', 'curling ulcer in burns', 'marjolin ulcer in burn scar', 'tbsa burn calculation')) {
    if (cur !== 523) return { toModule: 523, reason: 'Tests thermal burns assessment (Rule of 9s, Parkland formula), inhalation injury, and Marjolin ulcer, belongs in Surgery: Burns (Module 523).' };
  }

  // 524: Wound Healing
  if (inQA('wound healing phases', 'keloid vs hypertrophic scar', 'surgical site infection ssi', 'wound dehiscence', 'burst abdomen', 'granulation tissue in wound')) {
    if (cur !== 524) return { toModule: 524, reason: 'Tests physiology of tissue repair, wound complications, and SSI surveillance, belongs in Surgery: Wound Healing, Tissue Repair and Scar (Module 524).' };
  }

  // 525: Reconstructive Surgery
  if (inQA('split thickness skin graft', 'stsg', 'full thickness skin graft', 'ftsg', 'skin graft take', 'microvascular free flap', 'latissimus dorsi flap', 'diep flap in reconstruction')) {
    if (cur !== 525) return { toModule: 525, reason: 'Tests plastic and reconstructive techniques (skin grafts, pedicled/free tissue flaps), belongs in Surgery: Reconstructive Surgery (Module 525).' };
  }

  // 526, 527, 528: Vascular
  if (inQA('varicose veins', 'great saphenous vein', 'trendelenburg test in varicose', 'deep vein thrombosis in surgery', 'dvt prophylaxis in surgery', 'venous ulcer medial malleolus')) {
    if (cur !== 528) return { toModule: 528, reason: 'Tests venous diseases (varicose veins, venous ulcers, DVT/thromboembolism prophylaxis), belongs in Surgery: Venous Diseases (Module 528).' };
  }
  if (inQA('abdominal aortic aneurysm', 'aaa rupture', 'evar in aaa', 'aortic dissection stanford')) {
    if (cur !== 527) return { toModule: 527, reason: 'Tests arterial aneurysms (AAA screening/rupture, EVAR) and aortic dissection, belongs in Surgery: Arterial Aneurysms, Dissections and Malformations (Module 527).' };
  }
  if (inQA('acute limb ischemia', 'fogarty catheter embolectomy', 'peripheral arterial disease', 'intermittent claudication', 'ankle brachial index', 'leriche syndrome')) {
    if (cur !== 526) return { toModule: 526, reason: 'Tests peripheral arterial occlusive disease and acute limb ischemia (6Ps, Fogarty embolectomy), belongs in Surgery: Ischemic Arterial Diseases (Module 526).' };
  }

  // 529: Skin Malignancies
  if (inQA('basal cell carcinoma', 'rodent ulcer of skin', 'squamous cell carcinoma of skin', 'malignant melanoma', 'breslow depth', 'clark level in melanoma', 'abcde of melanoma')) {
    if (cur !== 529) return { toModule: 529, reason: 'Tests cutaneous malignancies (BCC rodent ulcer, SCC, Melanoma staging/Breslow depth), belongs in Surgery: Skin Malignancies (Module 529).' };
  }

  return null;
}

const moves = [];
questions.forEach(q => {
  const res = audit(q);
  if (res && res.toModule !== q.currentModule) {
    moves.push({
      id: q.id,
      fromModule: q.currentModule,
      toModule: res.toModule,
      reason: res.reason
    });
  }
});

console.log(`Audited ${questions.length} questions for Surgery.`);
console.log(`Flagged ${moves.length} moves for relocation (${((moves.length / questions.length) * 100).toFixed(1)}%).`);

const out = {
  subject: 'Surgery',
  totalQuestions: questions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_surgery.json', JSON.stringify(out, null, 2));
console.log('Saved findings to tools/audit_deep_surgery.json');
process.exit(0);
