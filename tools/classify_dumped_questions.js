const fs = require('fs');

const dumpQs = JSON.parse(fs.readFileSync('tools/unflagged_dump_only.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function classifyDumpQ(q) {
  const full = q.full;
  const text = q.text.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const qa = q.qa;

  const has = (t) => full.includes(t);
  const hasQA = (t) => qa.includes(t);
  const hasText = (t) => text.includes(t);

  // 1. ENDOCRINOLOGY
  // Anterior Pituitary (414)
  if (hasQA('hypopituitarism') || hasQA('growth hormone') || hasQA('prolactin') && (has('galactorrhea') || has('amenorrhea')) || hasQA('acromegaly') || hasQA('cabergoline') || hasQA('bromocriptine') || hasQA('empty sella') || hasQA('bitemporal hemianopia')) {
    return { toModule: 414, reason: 'Tests anterior pituitary physiology, prolactinoma, acromegaly, or hypopituitarism, belongs in Medicine: Disorders of Anterior Pituitary' };
  }
  // Posterior Pituitary (416)
  if (hasQA('diabetes insipidus') || hasQA('desmopressin') || hasQA('siadh') || hasQA('vasopressin') || hasQA('polyuria') && has('water deprivation')) {
    return { toModule: 416, reason: 'Tests posterior pituitary ADH axis, SIADH, or diabetes insipidus, belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus' };
  }
  // Thyroid Disorders (417/418)
  if (hasQA('thyroid') || hasQA('graves') || hasQA('hashimoto') || hasQA('goiter') || hasQA('tsh') || hasQA('free t4') || hasQA('free t3') || hasQA('myxedema') || hasQA('pendred') || hasQA('riedel') || hasQA('thyrotoxicosis') || hasQA('antithyroid') || hasQA('radioiodine') || hasQA('carbimazole') || hasQA('methimazole') || hasQA('propylthiouracil') || hasQA('subacute thyroiditis')) {
    if (hasText('treatment') || hasText('management') || hasText('pregnant') || hasText('radioiodine') || hasText('surgery') || hasText('antithyroid')) {
      return { toModule: 417, reason: 'Tests thyroid therapeutic management and drug selection, belongs in Medicine: Thyroid Disorders - Management' };
    }
    return { toModule: 418, reason: 'Tests thyroid clinical manifestations, laboratory evaluation, and pathology, belongs in Medicine: Thyroid Disorders - Clinical Features' };
  }
  // Cushing & Adrenal (420)
  if (hasQA('cushing') || hasQA('addison') || hasQA('adrenal') || hasQA('aldosterone') || hasQA('pheochromocytoma') || hasQA('cortisol') || hasQA('dexamethasone') || hasQA('hydrocortisone') || hasQA('conn syndrome') || hasQA('fludrocortisone') || hasQA('metanephrine') || hasQA('spironolactone') && has('aldosterone')) {
    return { toModule: 420, reason: 'Tests adrenal cortical and medullary disorders (Cushing, Addison, Conn, Pheochromocytoma), belongs in Medicine: Cushing Syndrome' };
  }
  // Diabetes Mellitus (421/422)
  if (hasQA('diabetes') || hasQA('diabetic') || hasQA('insulin') || hasQA('hba1c') || hasQA('glucose') || hasQA('metformin') || hasQA('hypoglycemia') || hasQA('c-peptide') || hasQA('dka') || hasQA('hhs') || hasQA('sulfonylurea') || hasQA('glp-1') || hasQA('sglt2')) {
    if (hasText('treatment') || hasText('management') || hasText('target') || hasText('complication') || hasText('retinopathy') || hasText('nephropathy') || hasText('neuropathy') || hasText('foot') || hasText('insulin') || hasText('drug')) {
      return { toModule: 422, reason: 'Tests diabetes mellitus medical management, glycemic targets, or systemic complications, belongs in Medicine: Diabetes Mellitus - Complications and Management' };
    }
    return { toModule: 421, reason: 'Tests diabetes mellitus diagnosis, classification, and clinical features, belongs in Medicine: Diabetes Mellitus - Clinical Features' };
  }
  // Reproductive Endocrinology (423)
  if (hasQA('kallmann') || hasQA('klinefelter') || hasQA('turner syndrome') || hasQA('hypogonadism') || hasQA('testosterone') || hasQA('amenorrhoea') || hasQA('amenorrhea') || hasQA('hirsutism') || hasQA('pcos') || hasQA('polycystic ovary') || hasQA('eunuchoid') || hasQA('loss of libido') && has('testosterone')) {
    return { toModule: 423, reason: 'Tests reproductive endocrinology, hypogonadism, amenorrhea, and PCOS workup, belongs in Medicine: Reproductive Endocrinology' };
  }
  // Calcium & Parathyroid (424)
  if (hasQA('calcium') || hasQA('parathyroid') || hasQA('hypercalcemia') || hasQA('hypocalcemia') || hasQA('osteoporosis') || hasQA('osteomalacia') || hasQA('rickets') || hasQA('bisphosphonate') || hasQA('alendronate') || hasQA('dexa') || hasQA('t-score') || hasQA('chvostek') || hasQA('trousseau') || hasQA('paget') || hasQA('pseudogout') || hasQA('bone pain') && has('calcium')) {
    return { toModule: 424, reason: 'Tests calcium homeostasis, parathyroid disorders, and metabolic bone disease, belongs in Medicine: Disorders of Parathyroid and Calcium' };
  }

  // 2. GASTROENTEROLOGY & HEPATOLOGY
  // Portal Hypertension (430)
  if (hasQA('varices') || hasQA('portal hypertension') || hasQA('splenomegaly') && has('portal') || hasQA('tips') || hasQA('octreotide') || hasQA('terlipressin') || hasQA('band ligation')) {
    return { toModule: 430, reason: 'Tests portal hypertension and variceal hemorrhage management, belongs in Medicine: Portal Hypertension' };
  }
  // Cirrhosis & Acute Liver Failure (428)
  if (hasQA('cirrhosis') || hasQA('ascites') || hasQA('paracentesis') || hasQA('child-pugh') || hasQA('meld') || hasQA('hepatic encephalopathy') || hasQA('asterixis') || hasQA('lactulose') || hasQA('sbp') || hasQA('spontaneous bacterial peritonitis') || hasQA('hepatorenal')) {
    return { toModule: 428, reason: 'Tests complications of cirrhosis (ascites, SBP, encephalopathy, HRS) and acute liver failure, belongs in Medicine: Acute Liver Failure and Complications of Cirrhosis' };
  }
  // Wilson's & Hemochromatosis (429)
  if (hasQA('wilson') || hasQA('hemochromatosis') || hasQA('copper') || hasQA('ceruloplasmin') || hasQA('kayser-fleischer') || hasQA('penicillamine') || hasQA('iron overload') || hasQA('ferritin') && has('hemochromatosis')) {
    return { toModule: 429, reason: 'Tests hereditary metabolic liver diseases (Wilson\'s disease / Hemochromatosis), belongs in Medicine: Hemochromatosis and Wilsons Disease' };
  }
  // Autoimmune Liver Diseases (427)
  if (hasQA('autoimmune hepatitis') || hasQA('primary biliary') || hasQA('primary sclerosing') || hasQA('pbc') || hasQA('psc') || hasQA('anti-mitochondrial') || hasQA('ama') || hasQA('ursodeoxycholic')) {
    return { toModule: 427, reason: 'Tests autoimmune cholestatic and parenchymal liver diseases (PBC, PSC, AIH), belongs in Medicine: Autoimmune Liver Diseases' };
  }
  // Alcoholic & NAFLD (426)
  if (hasQA('alcoholic liver') || hasQA('alcohol') && has('hepatitis') || hasQA('nafld') || hasQA('nash') || hasQA('fatty liver') || hasQA('steatohepatitis')) {
    return { toModule: 426, reason: 'Tests alcoholic and non-alcoholic fatty liver diseases (NAFLD/NASH), belongs in Medicine: Alcoholic Liver Diseases and Non-Alcoholic Fatty Liver Disease' };
  }
  // Jaundice & Bilirubin (425/431)
  if (hasQA('bilirubin') || hasQA('jaundice') || hasQA('gilbert') || hasQA('crigler') || hasQA('dubin-johnson') || hasQA('rotor')) {
    return { toModule: 425, reason: 'Tests bilirubin metabolism, hereditary hyperbilirubinemias, and jaundice workup, belongs in Medicine: Hyperbilirubinemia and Functions of Liver' };
  }
  // Malabsorption & Celiac (435)
  if (hasQA('celiac') || hasQA('malabsorption') || hasQA('d-xylose') || hasQA('whipple') || hasQA('sprue') || hasQA('villous atrophy') || hasQA('anti-ttg') || hasQA('short bowel') || hasQA('steatorrhea') && !has('pancreatitis')) {
    return { toModule: 435, reason: 'Tests intestinal malabsorption syndromes, celiac disease, and mucosal histology, belongs in Medicine: Malabsorption Syndrome' };
  }
  // IBS (432)
  if (hasQA('irritable bowel') || hasQA('ibs') || hasQA('rome criteria') || hasQA('low fodmap')) {
    return { toModule: 432, reason: 'Tests irritable bowel syndrome pathophysiology and clinical management, belongs in Medicine: Irritable Bowel Syndrome' };
  }
  // IBD (433/434)
  if (hasQA('crohn') || hasQA('ulcerative colitis') || hasQA('inflammatory bowel') || hasQA('ibd') || hasQA('toxic megacolon') || hasQA('calprotectin') || hasQA('mesalamine') || hasQA('sulfasalazine')) {
    if (hasText('treatment') || hasText('management') || hasText('therapy') || hasText('drug')) {
      return { toModule: 434, reason: 'Tests inflammatory bowel disease pharmacotherapy and acute flare management, belongs in Medicine: Inflammatory Bowel Disease - Complications and Treatment' };
    }
    return { toModule: 433, reason: 'Tests inflammatory bowel disease clinical features, endoscopy, and differential diagnosis, belongs in Medicine: Inflammatory Bowel Disease - Clinical Features and Diagnosis' };
  }

  // 3. SURGERY GI / HPB
  // Stomach & Duodenum (495)
  if (hasQA('peptic ulcer') || hasQA('duodenal ulcer') || hasQA('gastric ulcer') || hasQA('helicobacter pylori') || hasQA('h. pylori') || hasQA('gastritis') || hasQA('pantoprazole') || hasQA('proton pump inhibitor') || hasQA('haematemesis') && (has('stomach') || has('duodenum') || has('ulcer')) || hasQA('splenic artery') && has('bleed') || hasQA('gastroduodenal artery')) {
    return { toModule: 495, reason: 'Tests peptic ulcer disease, H. pylori, and upper gastrointestinal ulcer bleeding, belongs in Surgery: Stomach and Duodenum' };
  }
  // Esophagus (493/494)
  if (hasQA('mallory weiss') || hasQA('achalasia') || hasQA('dysphagia') && has('esophagus') || hasQA('gerd') || hasQA('barrett') || hasQA('esophageal')) {
    return { toModule: 493, reason: 'Tests esophageal motility disorders, Mallory-Weiss tears, and inflammatory pathology, belongs in Surgery: Esophagus - Congenital, Motility & Inflammatory Disorders' };
  }
  // Gastric Carcinoma (496)
  if (hasQA('gastric carcinoma') || hasQA('stomach cancer') || hasQA('linitis plastica') || hasQA('gastric adenocarcinoma')) {
    return { toModule: 496, reason: 'Tests gastric adenocarcinoma presentation and oncologic surgery, belongs in Surgery: Carcinoma Stomach' };
  }
  // Pancreas (512/513/514)
  if (hasQA('pancreatitis') || hasQA('pancreatic') || hasQA('amylase') || hasQA('lipase') || hasQA('whipple procedure')) {
    if (hasQA('chronic pancreatitis') || has('calcification') && has('pancreas')) {
      return { toModule: 513, reason: 'Tests chronic pancreatitis features and surgical ductal drainage, belongs in Surgery: Chronic Pancreatitis' };
    }
    if (hasQA('adenocarcinoma') && has('pancreas') || hasQA('whipple')) {
      return { toModule: 514, reason: 'Tests carcinoma of the pancreas and oncologic resections, belongs in Surgery: Carcinoma Pancreas' };
    }
    return { toModule: 512, reason: 'Tests acute pancreatitis etiology, complications, and surgical management, belongs in Surgery: Congenital Anomalies and Acute Pancreatitis' };
  }
  // Gallbladder & Bile Duct (508/509)
  if (hasQA('cholelithiasis') || hasQA('cholecystitis') || hasQA('murphy\'s sign') || hasQA('gallstone') || hasQA('biliary colic') || hasQA('cholangitis') || hasQA('choledocholithiasis')) {
    if (hasQA('cholangitis') || hasQA('choledocholithiasis') || hasQA('bile duct')) {
      return { toModule: 509, reason: 'Tests choledocholithiasis, cholangitis, and biliary ductal surgery, belongs in Surgery: Bile Duct' };
    }
    return { toModule: 508, reason: 'Tests gallbladder calculi, cholecystitis, and cholecystectomy, belongs in Surgery: Gall Bladder' };
  }
  // Colon & Rectum (499/501/503)
  if (hasQA('colorectal') || hasQA('colon polyps') || hasQA('adenoma') && has('colon') || hasQA('fap') || hasQA('lynch syndrome')) {
    return { toModule: 501, reason: 'Tests colorectal adenomas, polyposis syndromes, and colorectal cancer, belongs in Surgery: Polyps and Colorectal Carcinoma' };
  }
  if (hasQA('clostridium difficile') || hasQA('c.difficile') || hasQA('pseudomembranous colitis') || hasQA('diverticulitis') || hasQA('diverticulosis')) {
    return { toModule: 499, reason: 'Tests colonic diverticular disease and infectious colitis (C. difficile), belongs in Surgery: Large Intestine' };
  }

  // 4. CARDIOLOGY
  // Valvular Heart Diseases & Murmurs (458)
  if (hasQA('murmur') || hasQA('mitral') || hasQA('aortic stenosis') || hasQA('aortic regurgitation') || hasQA('endocarditis') || hasQA('rheumatic fever') || hasQA('vsd') || hasQA('ventricular septal defect') || hasQA('asd') || hasQA('atrial septal defect')) {
    return { toModule: 458, reason: 'Tests valvular heart diseases, structural heart lesions, and endocarditis, belongs in Medicine: Vascular Heart Diseases' };
  }
  // Ischemic Heart Disease (459/460)
  if (hasQA('angina') || hasQA('myocardial infarction') || hasQA('coronary') || hasQA('troponin') || hasQA('stemi') || hasQA('npremi') || hasQA('nstem') || hasQA('chest pain') && has('ecg') || hasQA('stent') || hasQA('pci') || hasQA('thrombolysis')) {
    if (hasText('treatment') || hasText('management') || hasText('complication') || hasText('pci') || hasText('stent') || hasText('antiplatelet')) {
      return { toModule: 460, reason: 'Tests ischemic heart disease reperfusion, pharmacotherapy, and post-MI management, belongs in Medicine: Ischemic Heart Disease - Complications and Management' };
    }
    return { toModule: 459, reason: 'Tests presentation, clinical diagnosis, and biomarkers of myocardial ischemia, belongs in Medicine: Ischemic Heart Disease - Presentation and Diagnosis' };
  }
  // Arrhythmias & Conduction (456/457)
  if (hasQA('arrhythmia') || hasQA('atrial fibrillation') || hasQA('atrial flutter') || hasQA('svt') || hasQA('ventricular tachycardia') || hasQA('ventricular fibrillation') || hasQA('heart block') || hasQA('qt prolongation') || hasQA('brugada') || hasQA('pacemaker')) {
    if (hasQA('atrial') || hasQA('svt') || hasQA('afib') || hasQA('supraventricular')) {
      return { toModule: 456, reason: 'Tests supraventricular arrhythmias and rate/rhythm control, belongs in Medicine: Supraventricular Arrhythmias' };
    }
    return { toModule: 457, reason: 'Tests ventricular arrhythmias, heart blocks, and sudden cardiac death risks, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks' };
  }
  // Heart Failure (462)
  if (hasQA('heart failure') || hasQA('chf') || hasQA('orthopnea') || hasQA('pnd') || hasQA('paroxysmal nocturnal dyspnea') || hasQA('bnp') || hasQA('sacubitril') || hasQA('pulmonary edema') && has('cardiac')) {
    return { toModule: 462, reason: 'Tests heart failure diagnosis, classifications, and guideline-directed therapy, belongs in Medicine: Heart Failure' };
  }
  // Cardiomyopathy & Pericardium (461)
  if (hasQA('cardiomyopathy') || hasQA('myocarditis') || hasQA('pericarditis') || hasQA('tamponade') || hasQA('pulsus paradoxus') || hasQA('beck\'s triad') || hasQA('kussmaul')) {
    return { toModule: 461, reason: 'Tests cardiomyopathies, pericarditis, cardiac tamponade, and myocarditis, belongs in Medicine: Cardiomyopathy and Myocarditis' };
  }
  // DVT & PE (463)
  if (hasQA('pulmonary embolism') || hasQA('deep vein thrombosis') || hasQA('dvt') || hasQA('pe') && has('embolism') || hasQA('wells score') || hasQA('ctpa') || hasQA('d-dimer')) {
    return { toModule: 463, reason: 'Tests venous thromboembolism, DVT, and pulmonary embolism protocols, belongs in Medicine: DVT and Pulmonary Embolism' };
  }
  // Cardiovascular Physical Exam (455)
  if (hasQA('jvp') || hasQA('jugular venous') || hasQA('heart sound') || hasQA('cardiac axis') || hasQA('pulse')) {
    return { toModule: 455, reason: 'Tests physical examination of the cardiovascular system, pulses, and JVP, belongs in Medicine: Diagnosis of cardiovascular disorders' };
  }

  // 5. PULMONOLOGY
  // Asthma & COPD (442)
  if (hasQA('asthma') || hasQA('copd') || hasQA('bronchitis') || hasQA('emphysema') || hasQA('wheeze') || hasQA('bronchodilator') || hasQA('fev1')) {
    return { toModule: 442, reason: 'Tests chronic obstructive airway diseases (Asthma and COPD), belongs in Medicine: Asthma & COPD' };
  }
  // Pneumonia & Pleural (443)
  if (hasQA('pneumonia') || hasQA('curb-65') || hasQA('streptococcus pneumoniae') || hasQA('pleural effusion') || hasQA('empyema') || hasQA('thoracocentesis') || hasQA('light\'s criteria')) {
    return { toModule: 443, reason: 'Tests pulmonary parenchymal infections, pneumonia, and pleural effusions, belongs in Medicine: Pneumonia' };
  }
  // ILD & Sarcoidosis (444)
  if (hasQA('sarcoidosis') || hasQA('pulmonary fibrosis') || hasQA('interstitial lung') || hasQA('ild') || hasQA('honeycombing') || hasQA('silicosis') || hasQA('asbestosis') || hasQA('bHL') || hasQA('bilateral hilar lymphadenopathy')) {
    return { toModule: 444, reason: 'Tests interstitial lung diseases, occupational pneumoconioses, and sarcoidosis, belongs in Medicine: Interstitial Lung Diseases and Sarcoidosis' };
  }
  // Bronchiectasis & Lung Abscess (445)
  if (hasQA('bronchiectasis') || hasQA('lung abscess') || hasQA('cftr') || hasQA('cystic fibrosis') || hasQA('kartagener')) {
    return { toModule: 445, reason: 'Tests bronchiectasis, cystic fibrosis, and cavitary lung abscesses, belongs in Medicine: Bronchiectasis and Lung Abscess' };
  }
  // Neoplasms of Lung (448)
  if (hasQA('lung cancer') || hasQA('lung tumor') || hasQA('nsclc') || hasQA('sclc') || hasQA('pancoast') || hasQA('superior vena cava syndrome') || hasQA('svc syndrome')) {
    return { toModule: 448, reason: 'Tests bronchogenic carcinomas, lung cancer staging, and paraneoplastic syndromes, belongs in Medicine: Neoplasms of the Lung' };
  }
  // Respiratory Failure & ARDS (447)
  if (hasQA('ards') || hasQA('respiratory failure') || hasQA('hypoxemia') && has('ventilation') || hasQA('pneumothorax')) {
    return { toModule: 447, reason: 'Tests respiratory failure, ARDS, and critical care ventilation mechanics, belongs in Medicine: Respiratory Failure and ARDS' };
  }
  // Sleep Apnea (449)
  if (hasQA('sleep apnea') || hasQA('osa') || hasQA('polysomnography') || hasQA('snoring') && has('apnea')) {
    return { toModule: 449, reason: 'Tests sleep-disordered breathing and obstructive sleep apnea, belongs in Medicine: Sleep Apnea' };
  }

  // 6. NEPHROLOGY
  // Acute Kidney Injury (450)
  if (hasQA('acute kidney injury') || hasQA('aki') || hasQA('acute tubular necrosis') || hasQA('atn') || hasQA('interstitial nephritis') || hasQA('prerenal') || hasQA('fena') || hasQA('rhabdomyolysis') || hasQA('uti') && has('kidney')) {
    return { toModule: 450, reason: 'Tests acute kidney injury differentiation, tubular necrosis, and nephrotoxicity, belongs in Medicine: Acute Kidney Injury' };
  }
  // Chronic Kidney Disease (451)
  if (hasQA('chronic kidney disease') || hasQA('ckd') || hasQA('chronic renal failure') || hasQA('uremia') || hasQA('uremic') || hasQA('renal osteodystrophy') || hasQA('crf with anemia')) {
    return { toModule: 451, reason: 'Tests chronic kidney disease progression, staging, and uremic syndrome, belongs in Medicine: Chronic Kidney Disease' };
  }
  // Renal Replacement Therapy (452)
  if (hasQA('dialysis') || hasQA('hemodialysis') || hasQA('peritoneal dialysis') || hasQA('kidney transplant') || hasQA('renal transplant') || hasQA('av fistula')) {
    return { toModule: 452, reason: 'Tests renal replacement therapy, dialysis modalities, and allograft care, belongs in Medicine: Renal Replacement Therapy' };
  }
  // Cysts & Inherited Kidney (453)
  if (hasQA('polycystic kidney') || hasQA('adpkd') || hasQA('alport') || hasQA('medullary cystic') || hasQA('medullary sponge')) {
    return { toModule: 453, reason: 'Tests cystic and inherited structural diseases of the kidney, belongs in Medicine: Cysts and Inherited Disorders of the Kidney' };
  }
  // Renal Tubular Diseases (454)
  if (hasQA('renal tubular') || hasQA('rta') || hasQA('fanconi') || hasQA('bartter') || hasQA('gitelman') || hasQA('liddle')) {
    return { toModule: 454, reason: 'Tests renal tubular acidosis and hereditary renal tubulopathies, belongs in Medicine: Renal Tubular Diseases of Kidney' };
  }
  // Glomerular Diseases (165)
  if (hasQA('glomerulonephritis') || hasQA('nephrotic syndrome') || hasQA('nephritic syndrome') || hasQA('minimal change') || hasQA('fsgs') || hasQA('membranous nephropathy') || hasQA('iga nephropathy') || hasQA('psgn') || hasQA('poststreptococcal')) {
    return { toModule: 165, reason: 'Tests glomerular diseases, nephrotic/nephritic syndromes, and renal biopsy pathology, belongs in Pathology: Glomerular Diseases' };
  }

  // 7. NEUROLOGY
  // Stroke / Cerebrovascular (473)
  if (hasQA('stroke') || hasQA('cerebrovascular') || hasQA('tpa') || hasQA('infarction') && has('artery') && (has('mca') || has('pca') || has('aca') || has('cerebral') || has('vertebral')) || hasQA('subarachnoid hemorrhage') || hasQA('berry aneurysm') || hasQA('lateral medullary syndrome') || hasQA('wallenberg') || hasQA('balint') || hasQA('hemiparesis') || hasQA('aphasia')) {
    return { toModule: 473, reason: 'Tests cerebrovascular accidents (stroke, SAH, brainstem syndromes) and neurovascular territories, belongs in Medicine: Cerebrovascular Disease' };
  }
  // Dementia & Cognitive (464)
  if (hasQA('dementia') || hasQA('alzheimer') || hasQA('lewy body') || hasQA('frontotemporal') || hasQA('pick disease') || hasQA('normal pressure hydrocephalus') || hasQA('gcs') || hasQA('coma') || hasQA('brain death') || hasQA('memory') && has('lobe') || hasQA('cortical blindness')) {
    return { toModule: 464, reason: 'Tests neurodegenerative dementias, higher cortical functions, and coma evaluation, belongs in Medicine: Cerebral Neurology: Dementia, Death and Coma' };
  }
  // Seizure & Epilepsy (465)
  if (hasQA('seizure') || hasQA('epilepsy') || hasQA('convulsion') || hasQA('status epilepticus') || hasQA('absence') || hasQA('tonic-clonic') || hasQA('antiepileptic')) {
    return { toModule: 465, reason: 'Tests seizure types, EEG semiology, and antiepileptic management, belongs in Medicine: Seizure and Epilepsy' };
  }
  // Movement Disorders (466)
  if (hasQA('parkinson') || hasQA('tremor') || hasQA('chorea') || hasQA('huntington') || hasQA('dystonia') || hasQA('levodopa') || hasQA('involuntary movement') || hasQA('hemiballismus') || hasQA('supranuclear palsy')) {
    return { toModule: 466, reason: 'Tests extrapyramidal disorders, parkinsonian syndromes, and hyperkinetic movement pathology, belongs in Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }
  // Neuromuscular & ALS (467)
  if (hasQA('myasthenia') || hasQA('tensilon') || hasQA('neuromuscular junction') || hasQA('lambert-eaton') || hasQA('amyotrophic lateral sclerosis') || hasQA('als') || hasQA('motor neuron disease') || hasQA('muscle weakness') && has('fatigable')) {
    return { toModule: 467, reason: 'Tests neuromuscular junction disorders (myasthenia gravis) and motor neuron disease (ALS), belongs in Medicine: Myasthenia Gravis and Other Neuromuscular Disorders' };
  }
  // Peripheral Neuropathies (468)
  if (hasQA('guillain-barre') || hasQA('gbs') || hasQA('neuropathy') || hasQA('polyneuropathy') || hasQA('carpal tunnel') || hasQA('foot drop') || hasQA('wrist drop') || hasQA('saturday night palsy') || hasQA('radial nerve') || hasQA('peroneal nerve') || hasQA('charcot-marie-tooth')) {
    return { toModule: 468, reason: 'Tests peripheral polyneuropathies, GBS, and focal nerve entrapment syndromes, belongs in Medicine: Guillain Barre Syndrome and Other Peripheral Neuropathies' };
  }
  // Multiple Sclerosis (469)
  if (hasQA('multiple sclerosis') || hasQA('optic neuritis') || hasQA('demyelinating') || hasQA('oligoclonal') || hasQA('internuclear ophthalmoplegia') || hasQA('lhermitte') || hasQA('central pontine myelinolysis')) {
    return { toModule: 469, reason: 'Tests central demyelinating disease (Multiple Sclerosis) and myelinolytic disorders, belongs in Medicine: Multiple Sclerosis and Other Demyelinating Disorders' };
  }
  // Headache (470)
  if (hasQA('headache') || hasQA('migraine') || hasQA('cluster headache') || hasQA('tension headache') || hasQA('trigeminal neuralgia') || hasQA('pseudotumor cerebri') || hasQA('intracranial hypertension')) {
    return { toModule: 470, reason: 'Tests primary and secondary headache disorders and facial pain syndromes, belongs in Medicine: Headache' };
  }
  // Spinal Cord Disorders (471)
  if (hasQA('spinal cord') || hasQA('myelitis') || hasQA('brown-sequard') || hasQA('syringomyelia') || hasQA('subacute combined degeneration') || hasQA('cord compression') || hasQA('cauda equina') || hasQA('conus medullaris') || hasQA('b12 deficiency') && has('neurological')) {
    return { toModule: 471, reason: 'Tests myelopathies, spinal cord transection syndromes, and cord compression, belongs in Medicine: Spinal Cord Disorders' };
  }
  // Cranial Nerves (472)
  if (hasQA('cranial nerve') || hasQA('bell\'s palsy') || hasQA('facial palsy') || hasQA('facial nerve') || hasQA('acoustic neuroma') || hasQA('diplopia') && has('nerve') || hasQA('jugular foramen')) {
    return { toModule: 472, reason: 'Tests isolated cranial nerve palsies and skull base foramen syndromes, belongs in Medicine: Cranial Nerve Disorders' };
  }
  // Meningitis & Encephalitis (474)
  if (hasQA('meningitis') || hasQA('encephalitis') || hasQA('csf') && (has('pleocytosis') || has('opening pressure') || has('glucose')) || hasQA('kernig') || hasQA('brudzinski')) {
    return { toModule: 474, reason: 'Tests CNS infections (meningitis, encephalitis) and CSF interpretation, belongs in Medicine: Meningitis Encephalitis' };
  }

  // 8. RHEUMATOLOGY & VASCULITIS
  // Vasculitis (436/437)
  if (hasQA('vasculitis') || hasQA('temporal arteritis') || hasQA('giant cell arteritis') || hasQA('takayasu') || hasQA('polyarteritis nodosa') || hasQA('pan') || hasQA('kawasaki') || hasQA('wegener') || hasQA('granulomatosis with polyangiitis') || hasQA('churg-strauss') || hasQA('henoch-schonlein') || hasQA('goodpasture') || hasQA('anca')) {
    if (hasQA('temporal') || hasQA('giant cell') || hasQA('takayasu') || hasQA('polyarteritis nodosa') || hasQA('kawasaki')) {
      return { toModule: 436, reason: 'Tests large and medium vessel systemic vasculitides, belongs in Medicine: Large and medium vessel vasculitis' };
    }
    return { toModule: 437, reason: 'Tests small vessel and ANCA-associated vasculitides, belongs in Medicine: Small vessel vasculitis' };
  }
  // Scleroderma & Sjogren (438)
  if (hasQA('scleroderma') || hasQA('systemic sclerosis') || hasQA('crest') || hasQA('sjogren') || hasQA('sicca') || hasQA('anti-ro') || hasQA('anti-la') || hasQA('schirmer') || hasQA('raynaud')) {
    return { toModule: 438, reason: 'Tests systemic sclerosis (scleroderma) and Sjogren syndrome, belongs in Medicine: Sjogrens Syndrome and Scleroderma' };
  }
  // Myositis (439)
  if (hasQA('dermatomyositis') || hasQA('polymyositis') || hasQA('myositis') || hasQA('gottron') || hasQA('heliotrope') || hasQA('jo-1')) {
    return { toModule: 439, reason: 'Tests autoimmune inflammatory myopathies (dermatomyositis/polymyositis), belongs in Medicine: Dermatomyositis and Related Disorders' };
  }
  // APLA (440)
  if (hasQA('antiphospholipid') || hasQA('apla') || hasQA('lupus anticoagulant') || hasQA('anticardiolipin')) {
    return { toModule: 440, reason: 'Tests antiphospholipid antibody syndrome and hypercoagulability, belongs in Medicine: Antiphospholipid Antibody Syndrome' };
  }
  // RA & Spondyloarthritis & Gout (441)
  if (hasQA('rheumatoid') || hasQA('anti-ccp') || hasQA('dmard') || hasQA('methotrexate') && has('arthritis') || hasQA('tofacitinib') || hasQA('ankylosing spondylitis') || hasQA('hla-b27') || hasQA('psoriatic arthritis') || hasQA('gout') || hasQA('uric acid') || hasQA('podagra') || hasQA('sle') || hasQA('systemic lupus')) {
    return { toModule: 441, reason: 'Tests rheumatoid arthritis, spondyloarthritis, SLE, and inflammatory arthritis, belongs in Medicine: Rheumatoid Arthritis' };
  }

  // 9. HEMATOLOGY & ONCOLOGY
  // Plasma Cell Disorders (475)
  if (hasQA('myeloma') || hasQA('plasma cell') || hasQA('bence jones') || hasQA('m-protein') || hasQA('m protein') || hasQA('mgus') || hasQA('waldenstrom') || hasQA('amyloidosis')) {
    return { toModule: 475, reason: 'Tests plasma cell dyscrasias, multiple myeloma, and amyloidosis, belongs in Medicine: Plasma Cell Disorders' };
  }
  // Leukemias & Lymphomas (476)
  if (hasQA('leukemia') || hasQA('cml') || hasQA('cll') || hasQA('philadelphia') || hasQA('bcr-abl') || hasQA('imatinib') || hasQA('smudge cell') || hasQA('hairy cell') || hasQA('lymphoma') || hasQA('tumor lysis syndrome') || hasQA('rasburicase')) {
    return { toModule: 476, reason: 'Tests chronic leukemias, lymphomas, and oncology emergencies (tumor lysis syndrome), belongs in Medicine: Chronic Myeloid Leukemia and Lymphoid Leukemias' };
  }

  // 10. INFECTIOUS DISEASES & HIV
  // HIV / AIDS (477/478)
  if (hasQA('hiv') || hasQA('aids') || hasQA('haart') || hasQA('antiretroviral') || hasQA('cd4') || hasQA('viral load')) {
    if (hasText('investigation') || hasText('test') || hasText('monitoring') || hasText('screen') || hasText('elisa') || hasText('western blot')) {
      return { toModule: 478, reason: 'Tests diagnostic algorithms, serology, and laboratory monitoring in HIV/AIDS, belongs in Medicine: HIV / AIDS - Investigations' };
    }
    return { toModule: 477, reason: 'Tests transmission, staging, and opportunistic infections in HIV/AIDS, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
  }
  // Tuberculosis (197 / 443)
  if (hasQA('tuberculosis') || hasQA('tubercular') || hasQA('mycobacterium tuberculosis') || hasQA('mantoux') || hasQA('att') || hasQA('anti-tubercular')) {
    if (hasQA('pleural') || hasQA('pulmonary')) {
      return { toModule: 443, reason: 'Tests pulmonary tuberculosis and tubercular pleural effusion, belongs in Medicine: Pneumonia' };
    }
    return { toModule: 197, reason: 'Tests Mycobacterium tuberculosis biology and systemic infections, belongs in Microbiology: Mycobacteria Tuberculosis' };
  }
  // Malaria & Parasites (240 / 216 / 217)
  if (hasQA('malaria') || hasQA('plasmodium') || hasQA('chloroquine') || hasQA('artemisinin')) {
    return { toModule: 240, reason: 'Tests malaria chemotherapy and Plasmodium biology, belongs in Pharmacology: Antimalarial Drugs' };
  }
  if (hasQA('schistosoma') || hasQA('schistosomiasis') || hasQA('paragonimus') || hasQA('praziquantel') || hasQA('amebiasis') || hasQA('entamoeba')) {
    return { toModule: 215, reason: 'Tests medical parasitology (protozoology and helminthology), belongs in Microbiology: Protozoology - Amoebae, Ciliates & Flagellates' };
  }

  // 11. ACID-BASE & FLUIDS (412)
  if (hasQA('anion gap') || hasQA('acidosis') || hasQA('alkalosis') || hasQA('abg') || (hasQA('ph') && (has('pco2') || has('hco3'))) || hasQA('sodium bicarbonate') || hasQA('base excess') || hasQA('effective osmoles') || hasQA('potassium chloride') || hasQA('hypokalemia') || hasQA('hyperkalemia')) {
    return { toModule: 412, reason: 'Tests acid-base balance interpretation, ABG calculations, and fluid-electrolyte disturbances, belongs in Medicine: Acid-Base Disorders' };
  }

  return null;
}

let movedCount = 0;
const results = [];
dumpQs.forEach(q => {
  const res = classifyDumpQ(q);
  if (res && res.toModule !== q.currentModule) {
    movedCount++;
    results.push({
      id: q.id,
      fromModule: q.currentModule,
      toModule: res.toModule,
      reason: res.reason
    });
  }
});

console.log(`Successfully categorized ${movedCount} out of ${dumpQs.length} dumped questions!`);
fs.writeFileSync('tools/dump_categorized_moves.json', JSON.stringify(results, null, 2));

process.exit(0);
