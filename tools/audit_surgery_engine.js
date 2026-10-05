const fs = require('fs');
const { clean, matchTerm, rawQuestions, modMap } = require('./surgery_auditor_base');

function classifyIntraSurgery(q) {
  const cur = q.module_id;
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
  const qAndAns = `${qText} ${ansText}`.toLowerCase();
  const stem = qText.toLowerCase();
  const ans = ansText.toLowerCase();

  const has = (...terms) => terms.some(t => matchTerm(full, t));
  const stemHas = (...terms) => terms.some(t => matchTerm(stem, t));
  const ansHas = (...terms) => terms.some(t => matchTerm(ans, t));
  const qAnsHas = (...terms) => terms.some(t => matchTerm(qAndAns, t));

  // -------------------------------------------------------------------------
  // SURGERY 529: Skin Malignancies
  // -------------------------------------------------------------------------
  if (has('melanoma', 'breslow thickness', 'clark level', 'hutchinson freckle', 'acral lentiginous', 'superficial spreading melanoma', 'nodular melanoma', 'braf v600e', 'vemurafenib', 'basal cell carcinoma', 'rodent ulcer', 'pearly border', 'telangiectasia', 'mohs micrographic surgery', 'marjolin ulcer', 'squamous cell carcinoma of skin', 'gorlin syndrome') &&
      !has('oral cavity', 'tongue', 'buccal', 'esophageal', 'cervical', 'anal canal', 'penile cancer')) {
    if (cur !== 529) {
      return { toModule: 529, reason: 'Tests cutaneous malignancies (melanoma staging/margins, basal cell carcinoma, Marjolin ulcer), belonging to Surgery under Module 529 (Skin Malignancies).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 528: Venous Diseases
  // -------------------------------------------------------------------------
  if (has('varicose vein', 'saphenofemoral junction', 'great saphenous vein', 'small saphenous vein', 'trendelenburg test', 'perthes test', 'bischof', 'ceap classification', 'lipodermatosclerosis', 'venous ulcer', 'gaiter zone', 'radiofrequency ablation of saphenous', 'evla', 'foam sclerotherapy', 'stripping of saphenous', 'phlegmasia alba dolens', 'phlegmasia cerulea dolens', 'deep vein thrombosis', 'dvt prophylaxis in surgery', 'virchow triad in dvt') &&
      !has('portal hypertension', 'esophageal varices', 'gastric varices', 'rectal varices', 'cirrhosis')) {
    if (cur !== 528) {
      return { toModule: 528, reason: 'Tests lower extremity venous pathology (varicose veins, CEAP classification, DVT, venous ulceration), belonging to Surgery under Module 528 (Venous Diseases).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 527: Arterial Aneurysms, Dissections and Malformations
  // -------------------------------------------------------------------------
  if (has('abdominal aortic aneurysm', 'aaa repair', 'evar', 'endoleak', 'ruptured abdominal aortic', 'pulsatile abdominal mass', 'aortic dissection stanford', 'type a aortic dissection', 'type b aortic dissection', 'pseudoaneurysm thrombin', 'arteriovenous fistula nicoladoni', 'av malformation') &&
      !has('trauma score', 'atls survey')) {
    if (cur !== 527) {
      return { toModule: 527, reason: 'Tests arterial aneurysms, aortic dissections, or vascular malformations, belonging to Surgery under Module 527 (Arterial Aneurysms, Dissections and Malformations).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 526: Ischemic Arterial Diseases
  // -------------------------------------------------------------------------
  if (has('intermittent claudication', 'fontaine classification', 'rutherford classification', 'ankle brachial index', 'abi <', 'critical limb ischemia', 'rest pain in foot', 'acute limb ischemia', '6 ps of acute ischemia', 'fogarty catheter', 'embolectomy', 'buerger disease', 'thromboangiitis obliterans', 'corkscrew collaterals', 'femoropopliteal bypass') &&
      !has('dvt', 'varicose vein', 'aortic aneurysm')) {
    if (cur !== 526) {
      return { toModule: 526, reason: 'Tests peripheral arterial disease, acute limb ischemia, or thromboangiitis obliterans, belonging to Surgery under Module 526 (Ischemic Arterial Diseases).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 525: Reconstructive Surgery
  // -------------------------------------------------------------------------
  if (has('split thickness skin graft', 'stsg', 'full thickness skin graft', 'ftsg', 'thiersch graft', 'wolfe graft', 'plasmatic imbibition', 'inosculation', 'graft take', 'humby knife', 'meshed graft', 'z-plasty', 'rotational flap', 'latissimus dorsi flap', 'tram flap', 'diep flap', 'pmmc flap', 'free fibula flap', 'radial forearm flap', 'tissue expander') &&
      !has('burn fluid', 'parkland formula', 'escharotomy', 'rule of nine')) {
    if (cur !== 525) {
      return { toModule: 525, reason: 'Tests plastic and reconstructive surgical techniques (skin grafts, flaps, tissue expansion), belonging to Surgery under Module 525 (Reconstructive Surgery).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 524: Wound Healing, Tissue Repair and Scar
  // -------------------------------------------------------------------------
  if (has('keloid', 'hypertrophic scar', 'wound dehiscence', 'burst abdomen', 'surgical site infection', 'ssi definition', 'clean-contaminated wound', 'phases of wound healing', 'hemostasis inflammation proliferation remodeling', 'granulation tissue', 'collagen type iii to type i', 'myofibroblasts in wound', 'primary intention', 'secondary intention', 'delayed primary closure', 'necrotising fasciitis', 'fournier gangrene') &&
      !has('burn resuscitation', 'parkland formula', 'flaps and grafts')) {
    if (cur !== 524) {
      return { toModule: 524, reason: 'Tests wound healing biology, abnormal scarring (keloid/hypertrophic scar), SSI or wound dehiscence, belonging to Surgery under Module 524 (Wound Healing, Tissue Repair and Scar).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 523: Burns
  // -------------------------------------------------------------------------
  if (has('parkland formula', 'baxter formula', 'rule of nine', 'lund and browder', 'burn resuscitation', 'silver sulfadiazine', 'mafenide acetate', 'escharotomy in burn', 'inhalation burn injury', 'curling ulcer in burn', 'full thickness burn', 'partial thickness burn') &&
      !has('chemical weapon', 'peptic ulcer disease without burn')) {
    if (cur !== 523) {
      return { toModule: 523, reason: 'Tests thermal burn management, TBSA estimation, Parkland resuscitation or topical antimicrobials, belonging to Surgery under Module 523 (Burns).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 522: Oral Cavity & Salivary glands
  // -------------------------------------------------------------------------
  if (has('pleomorphic adenoma', 'warthin tumour', 'warthin\'s tumor', 'adenoid cystic carcinoma', 'mucoepidermoid carcinoma', 'parotid gland', 'submandibular gland', 'superficial parotidectomy', 'frey syndrome', 'gustatory sweating', 'carcinoma tongue', 'carcinoma buccal mucosa', 'gingivobuccal sulcus', 'oral submucous fibrosis', 'osmf', 'leukoplakia', 'erythroplakia', 'radical neck dissection', 'modified radical neck dissection', 'mrnd type', 'levels of cervical lymph nodes') &&
      !has('thyroidectomy', 'papillary thyroid', 'medullary thyroid')) {
    if (cur !== 522) {
      return { toModule: 522, reason: 'Tests oral cavity precancerous/malignant lesions, salivary gland tumors, or neck dissection anatomy, belonging to Surgery under Module 522 (Oral Cavity & Salivary glands).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 521: Head Injury
  // -------------------------------------------------------------------------
  if (has('extradural hematoma', 'epidural hematoma', 'middle meningeal artery', 'lucid interval', 'subdural hematoma', 'bridging veins', 'battle sign', 'raccoon eyes', 'cribriform plate fracture', 'base of skull fracture', 'monro-kellie', 'intracranial pressure monitoring', 'cushing triad', 'diffuse axonal injury', 'uncal herniation', 'depressed skull fracture', 'burr hole craniotomy', 'ventriculoperitoneal shunt', 'vp shunt') &&
      !has('atls survey general', 'triage category')) {
    if (cur !== 521) {
      return { toModule: 521, reason: 'Tests traumatic brain injury, intracranial hematomas (EDH/SDH), skull base fractures or ICP physics, belonging to Surgery under Module 521 (Head Injury).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 520: Testes and Scrotum
  // -------------------------------------------------------------------------
  if (has('testicular torsion', 'torsion of testis', 'bell clapper deformity', 'prehn sign', 'orchidopexy for torsion', 'epididymo-orchitis', 'testicular tumor', 'seminoma', 'non-seminomatous germ cell', 'radical inguinal orchiectomy', 'varicocele', 'pampiniform plexus', 'bag of worms', 'hydrocele', 'jaboulay', 'lord procedure', 'cryptorchidism', 'undescended testis orchidopexy') &&
      !has('inguinal hernia sac', 'congenital diaphragmatic')) {
    if (cur !== 520) {
      return { toModule: 520, reason: 'Tests scrotal and testicular pathology (torsion, hydrocele, varicocele, testicular tumors, cryptorchidism), belonging to Surgery under Module 520 (Testes and Scrotum).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 519: Urethra and Penis
  // -------------------------------------------------------------------------
  if (has('urethral stricture', 'retrograde urethrogram', 'rug', 'optical internal urethrotomy', 'urethroplasty', 'buccal mucosa graft urethroplasty', 'posterior urethral valves in', 'phimosis', 'paraphimosis', 'priapism', 'peyronie disease', 'carcinoma penis', 'partial penectomy', 'buschke-lowenstein') &&
      !has('pelvic fracture urethral injury in atls', 'bladder cancer')) {
    if (cur !== 519) {
      return { toModule: 519, reason: 'Tests pathology of urethra and penis (strictures, urethroplasty, priapism, penile carcinoma), belonging to Surgery under Module 519 (Urethra and Penis).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 518: Prostate
  // -------------------------------------------------------------------------
  if (has('benign prostatic hyperplasia', 'bph', 'turp', 'turp syndrome', 'glycine toxicity', 'holep', 'tamsulosin in bph', 'finasteride in bph', 'carcinoma prostate', 'prostate cancer', 'psa', 'prostate specific antigen', 'gleason score', 'isup grade', 'radical prostatectomy', 'androgen deprivation therapy', 'bilateral orchiectomy for prostate') &&
      !has('rectal cancer examination', 'anal canal')) {
    if (cur !== 518) {
      return { toModule: 518, reason: 'Tests prostate disease, benign prostatic hyperplasia, TURP complications, or adenocarcinoma of prostate, belonging to Surgery under Module 518 (Prostate).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 517: Urinary Bladder and Ureters
  // -------------------------------------------------------------------------
  if (has('transitional cell carcinoma of bladder', 'urothelial carcinoma of bladder', 'turbt', 'intravesical bcg', 'radical cystectomy', 'ileal conduit', 'bricker', 'bladder rupture intraperitoneal', 'bladder rupture extraperitoneal', 'schistosoma haematobium bladder', 'ureteric injury in hysterectomy', 'boari flap', 'psoas hitch') &&
      !has('renal cell carcinoma', 'prostate cancer', 'urolithiasis stone composition')) {
    if (cur !== 517) {
      return { toModule: 517, reason: 'Tests urinary bladder carcinoma, bladder trauma/rupture, or ureteric reconstruction, belonging to Surgery under Module 517 (Urinary Bladder and Ureters).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 516: Infections and Tumors of Kidney
  // -------------------------------------------------------------------------
  if (has('renal cell carcinoma', 'rcc', 'clear cell renal', 'stauffer syndrome', 'von hippel-lindau rcc', 'radical nephrectomy', 'partial nephrectomy', 'renal angiomyolipoma', 'wunderlich syndrome', 'renal oncocytoma', 'xanthogranulomatous pyelonephritis', 'emphysematous pyelonephritis', 'perinephric abscess') &&
      !has('urinary calculi', 'eswl', 'staghorn composition', 'wilms tumor in infant')) {
    if (cur !== 516) {
      return { toModule: 516, reason: 'Tests renal parenchyma neoplasms (renal cell carcinoma, angiomyolipoma) or severe kidney infections, belonging to Surgery under Module 516 (Infections and Tumors of Kidney).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 515: Congenital Diseases of Kidney and Urinary Calculi
  // -------------------------------------------------------------------------
  if (has('nephrolithiasis', 'urolithiasis', 'renal calculus', 'ureteric calculus', 'calcium oxalate stone', 'struvite stone', 'staghorn calculus', 'triple phosphate', 'uric acid stone radiolucent', 'cystine stone', 'eswl', 'pcnl', 'percutaneous nephrolithotomy', 'rirs', 'horseshoe kidney', 'pelviureteric junction obstruction', 'puj obstruction', 'anderson-hynes pyeloplasty', 'adpkd') &&
      !has('gallstone', 'biliary calculi', 'salivary calculus')) {
    if (cur !== 515) {
      return { toModule: 515, reason: 'Tests nephrolithiasis, stone composition, lithotripsy (ESWL/PCNL), or congenital renal anomalies (PUJ/horseshoe kidney), belonging to Surgery under Module 515 (Congenital Diseases of Kidney and Urinary Calculi).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 514: Carcinoma Pancreas
  // -------------------------------------------------------------------------
  if (has('carcinoma head of pancreas', 'pancreatic ductal adenocarcinoma', 'whipple procedure', 'pancreaticoduodenectomy', 'courvoisier law', 'courvoisier sign', 'double duct sign', 'painless progressive jaundice in elderly', 'ca 19-9 in pancreatic cancer') &&
      !has('insulinoma', 'gastrinoma', 'acute pancreatitis')) {
    if (cur !== 514) {
      return { toModule: 514, reason: 'Tests pancreatic ductal adenocarcinoma, Courvoisier sign, staging and Whipple pancreaticoduodenectomy, belonging to Surgery under Module 514 (Carcinoma Pancreas).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 513: Chronic Pancreatitis
  // -------------------------------------------------------------------------
  if (has('chronic pancreatitis', 'pancreatic calcification', 'puestow procedure', 'frey procedure', 'beger procedure', 'partington rochelle', 'chain of lakes appearance', 'tropical pancreatitis', 'prss1 hereditary pancreatitis', 'steatorrhea and diabetes in pancreatitis') &&
      !has('acute pancreatitis atlanta', 'whipple for cancer')) {
    if (cur !== 513) {
      return { toModule: 513, reason: 'Tests chronic pancreatitis pathogenesis, calcification, and drainage/resection operations (Frey/Puestow), belonging to Surgery under Module 513 (Chronic Pancreatitis).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 512: Congenital Anomalies and Acute Pancreatitis
  // -------------------------------------------------------------------------
  if (has('acute pancreatitis', 'pancreas divisum', 'annular pancreas', 'atlanta classification of pancreatitis', 'ranson criteria', 'bisap score', 'pancreatic pseudocyst', 'cystogastrostomy', 'walled off necrosis', 'infected pancreatic necrosis', 'grey turner sign', 'cullen sign in pancreatitis', 'step up approach in pancreatitis') &&
      !has('chronic pancreatitis calcification', 'carcinoma pancreas')) {
    if (cur !== 512) {
      return { toModule: 512, reason: 'Tests congenital pancreatic anomalies, acute pancreatitis scoring, or necrotizing pancreatitis/pseudocyst management, belonging to Surgery under Module 512 (Congenital Anomalies and Acute Pancreatitis).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 511: Endocrine Pancreas
  // -------------------------------------------------------------------------
  if (has('insulinoma', 'whipple triad', '72 hour fasting test', 'gastrinoma', 'zollinger-ellison syndrome', 'zes', 'secretin stimulation test', 'gastrinoma triangle', 'glucagonoma', 'necrolytic migratory erythema', 'vipoma', 'wdha syndrome', 'verner-morrison', 'somatostatinoma', 'men 1 syndrome') &&
      !has('pancreatic ductal adenocarcinoma', 'whipple procedure for cancer')) {
    if (cur !== 511) {
      return { toModule: 511, reason: 'Tests functional neuroendocrine tumors of pancreas (insulinoma, gastrinoma/ZES, glucagonoma, VIPoma), belonging to Surgery under Module 511 (Endocrine Pancreas).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 510: Spleen
  // -------------------------------------------------------------------------
  if (has('splenectomy', 'indications for splenectomy', 'hereditary spherocytosis splenectomy', 'itp splenectomy', 'overwhelming post-splenectomy infection', 'opsi', 'vaccination after splenectomy', 'pneumococcal vaccine splenectomy', 'splenic artery aneurysm', 'accessory spleen', 'splenunculus') &&
      !has('splenic trauma in blunt abdomen', 'whipple procedure', 'gastrectomy')) {
    if (cur !== 510) {
      return { toModule: 510, reason: 'Tests splenic hematologic indications, post-splenectomy sepsis (OPSI), prophylaxis and anatomy, belonging to Surgery under Module 510 (Spleen).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 509: Bile Duct
  // -------------------------------------------------------------------------
  if (has('choledocholithiasis', 'common bile duct stone', 'reynold pentad', 'charcot triad in cholangitis', 'acute cholangitis', 'choledochal cyst', 'todani classification', 'klatskin tumor', 'perihilar cholangiocarcinoma', 'bismuth-corlette', 'biliary stricture', 'biliary atresia kasai in adult') &&
      !has('cholecystitis', 'gallstone ileus', 'cholecystectomy calot')) {
    if (cur !== 509) {
      return { toModule: 509, reason: 'Tests bile duct stones, acute cholangitis, choledochal cysts, or cholangiocarcinoma, belonging to Surgery under Module 509 (Bile Duct).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 508: Gall Bladder
  // -------------------------------------------------------------------------
  if (has('cholelithiasis', 'acute cholecystitis', 'chronic cholecystitis', 'murphy sign', 'laparoscopic cholecystectomy', 'calot triangle', 'critical view of safety', 'cystic artery', 'porcelain gallbladder', 'emphysematous cholecystitis', 'gallbladder polyp', 'carcinoma gallbladder', 'biliary colic') &&
      !has('common bile duct stone', 'cholangitis', 'gallstone ileus', 'acute pancreatitis')) {
    if (cur !== 508) {
      return { toModule: 508, reason: 'Tests gallbladder pathology, cholelithiasis, acute cholecystitis, or laparoscopic cholecystectomy technique, belonging to Surgery under Module 508 (Gall Bladder).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 507: Malignant Tumors of Liver
  // -------------------------------------------------------------------------
  if (has('hepatocellular carcinoma', 'hcc', 'alpha-fetoprotein in hcc', 'milan criteria', 'tace in hcc', 'radiofrequency ablation of liver tumor', 'fibrolamellar hcc', 'colorectal liver metastasis', 'future liver remnant', 'portal vein embolization') &&
      !has('hepatic hemangioma', 'fnh', 'liver abscess', 'hydatid cyst')) {
    if (cur !== 507) {
      return { toModule: 507, reason: 'Tests primary and secondary malignant hepatic neoplasms (HCC, Milan criteria, resection, metastases), belonging to Surgery under Module 507 (Malignant Tumors of Liver).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 506: Benign Tumors of Liver
  // -------------------------------------------------------------------------
  if (has('hepatic hemangioma', 'cavernous hemangioma of liver', 'focal nodular hyperplasia', 'fnh central stellate scar', 'hepatic adenoma', 'liver cell adenoma ocp') &&
      !has('hcc', 'abscess', 'hydatid')) {
    if (cur !== 506) {
      return { toModule: 506, reason: 'Tests benign liver neoplasms (hemangioma, FNH, hepatic adenoma), belonging to Surgery under Module 506 (Benign Tumors of Liver).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 505: Benign Conditions of Liver
  // -------------------------------------------------------------------------
  if (has('amebic liver abscess', 'anchovy sauce pus', 'pyogenic liver abscess', 'hydatid cyst of liver', 'echinococcus granulosus liver', 'pair technique hydatid', 'scolicidal agent', 'water lily sign liver', 'portal hypertension surgery', 'tips procedure in liver', 'distal splenorenal shunt') &&
      !has('hcc', 'gallbladder', 'bile duct')) {
    if (cur !== 505) {
      return { toModule: 505, reason: 'Tests benign liver conditions (amebic/pyogenic liver abscess, hydatid disease, surgical management of portal hypertension), belonging to Surgery under Module 505 (Benign Conditions of Liver).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 504: Hernia
  // -------------------------------------------------------------------------
  if (has('inguinal hernia', 'direct inguinal', 'indirect inguinal', 'hesselbach triangle', 'deep inguinal ring', 'femoral hernia', 'femoral canal', 'umbilical hernia', 'paraumbilical hernia', 'incisional hernia', 'epigastric hernia', 'richter hernia', 'littre hernia', 'maydl hernia', 'amyand hernia', 'obturator hernia', 'howship-romberg', 'spigelian hernia', 'lichtenstein repair', 'bassini repair', 'shouldice repair', 'tep repair', 'tapp repair', 'triangle of doom', 'triangle of pain') &&
      !has('congenital diaphragmatic hernia in neonate', 'scaphoid abdomen newborn', 'hiatus hernia gerd')) {
    if (cur !== 504) {
      return { toModule: 504, reason: 'Tests abdominal wall hernias (inguinal, femoral, umbilical, incisional) and surgical repairs (Lichtenstein/TEP/TAPP), belonging to Surgery under Module 504 (Hernia).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 503: Anus and Anal Canal
  // -------------------------------------------------------------------------
  if (has('anal fissure', 'lateral internal sphincterotomy', 'sentinel pile', 'fistula-in-ano', 'goodsall rule', 'ischiorectal abscess', 'perianal abscess', 'hemorrhoids', 'piles', 'rubber band ligation for piles', 'milligan-morgan', 'stapled hemorrhoidopexy', 'pilonidal sinus', 'anal canal carcinoma', 'nigro regimen') &&
      !has('rectal cancer tme', 'lar vs apr', 'hirschsprung')) {
    if (cur !== 503) {
      return { toModule: 503, reason: 'Tests anal canal diseases (fissure, fistula-in-ano, hemorrhoids, perianal abscess, pilonidal sinus, Nigro regimen), belonging to Surgery under Module 503 (Anus and Anal Canal).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 502: Rectum
  // -------------------------------------------------------------------------
  if (has('carcinoma rectum', 'rectal cancer', 'total mesorectal excision', 'tme', 'low anterior resection', 'lar', 'abdominoperineal resection', 'apr miles operation', 'rectal prolapse', 'delorme procedure', 'altemeier procedure', 'rectopexy') &&
      !has('anal fissure', 'hemorrhoids', 'fistula in ano', 'colon cancer right hemicolectomy')) {
    if (cur !== 502) {
      return { toModule: 502, reason: 'Tests rectal carcinoma, TME dissection, LAR vs APR, or rectal prolapse surgical repair, belonging to Surgery under Module 502 (Rectum).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 501: Polyps and Colorectal Carcinoma
  // -------------------------------------------------------------------------
  if (has('familial adenomatous polyposis', 'fap', 'apc gene', 'gardner syndrome', 'turcot syndrome', 'lynch syndrome', 'hnpcc', 'adenomatous polyp colonic', 'villous adenoma colon', 'colorectal adenocarcinoma', 'colon cancer staging', 'right hemicolectomy', 'left hemicolectomy', 'apple core lesion colon') &&
      !has('rectal cancer tme', 'appendix', 'diverticulitis', 'volvulus')) {
    if (cur !== 501) {
      return { toModule: 501, reason: 'Tests colonic polyposis syndromes (FAP, Lynch), colon cancer genetics, pathology, and colectomy, belonging to Surgery under Module 501 (Polyps and Colorectal Carcinoma).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 500: Appendix
  // -------------------------------------------------------------------------
  if (has('acute appendicitis', 'alvarado score', 'mantrels', 'mcburney point', 'rovsing sign', 'psoas sign', 'obturator sign', 'appendicular mass', 'appendicular lump', 'ochsner-sherren', 'appendicular abscess', 'mucocele of appendix', 'carcinoid of appendix', 'appendectomy') &&
      !has('amyand hernia', 'crohn disease')) {
    if (cur !== 500) {
      return { toModule: 500, reason: 'Tests appendiceal pathology, acute appendicitis clinical signs/scoring, appendicular mass or carcinoid, belonging to Surgery under Module 500 (Appendix).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 499: Large Intestine
  // -------------------------------------------------------------------------
  if (has('sigmoid volvulus', 'coffee bean sign', 'bent inner tube', 'cecal volvulus', 'diverticulitis', 'diverticulosis', 'hinchey classification', 'ogilvie syndrome', 'colonic pseudo-obstruction', 'toxic megacolon', 'total proctocolectomy with ipaa', 'hartmann procedure', 'ileostomy vs colostomy') &&
      !has('appendix', 'colon cancer staging', 'fap polyps', 'rectal cancer')) {
    if (cur !== 499) {
      return { toModule: 499, reason: 'Tests colonic volvulus, diverticular disease, toxic megacolon, or stoma management, belonging to Surgery under Module 499 (Large Intestine).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 498: Small Intestine
  // -------------------------------------------------------------------------
  if (has('small bowel obstruction', 'meckel diverticulum', 'rule of 2s meckel', 'technetium-99m pertechnetate meckel', 'acute mesenteric ischemia', 'superior mesenteric artery embolism', 'gallstone ileus', 'rigler triad', 'enterocutaneous fistula', 'short bowel syndrome', 'carcinoid of ileum') &&
      !has('duodenal ulcer', 'gastric bypass', 'pediatric intussusception', 'duodenal atresia')) {
    if (cur !== 498) {
      return { toModule: 498, reason: 'Tests small intestinal pathology (mechanical SBO, Meckel\'s diverticulum, mesenteric ischemia, enterocutaneous fistula, gallstone ileus), belonging to Surgery under Module 498 (Small Intestine).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 497: Metabolic & Bariatric Surgery
  // -------------------------------------------------------------------------
  if (has('bariatric surgery', 'sleeve gastrectomy', 'roux-en-y gastric bypass', 'rygb', 'mini gastric bypass', 'oagb', 'biliopancreatic diversion', 'duodenal switch', 'internal hernia after gastric bypass', 'petersen space', 'marginal ulcer after bypass', 'bmi criteria for bariatric') &&
      !has('gastric cancer resection', 'peptic ulcer disease')) {
    if (cur !== 497) {
      return { toModule: 497, reason: 'Tests bariatric and metabolic surgical procedures (Sleeve, RYGB), indications, and postoperative complications, belonging to Surgery under Module 497 (Metabolic & Bariatric Surgery).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 496: Carcinoma Stomach
  // -------------------------------------------------------------------------
  if (has('carcinoma stomach', 'gastric adenocarcinoma', 'linitis plastica', 'leather bottle stomach', 'lauren classification intestinal diffuse', 'signet ring cell carcinoma of stomach', 'virchow node', 'troisier sign', 'sister mary joseph nodule', 'krukenberg tumor of gastric origin', 'd2 gastrectomy', 'gastrointestinal stromal tumor of stomach', 'gist cd117', 'gastric maltoma') &&
      !has('peptic ulcer disease', 'bariatric surgery')) {
    if (cur !== 496) {
      return { toModule: 496, reason: 'Tests gastric adenocarcinoma, staging, metastatic signs (Virchow/Sister Mary Joseph), D2 gastrectomy, or gastric GIST, belonging to Surgery under Module 496 (Carcinoma Stomach).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 495: Stomach and Duodenum
  // -------------------------------------------------------------------------
  if (has('peptic ulcer disease', 'duodenal ulcer', 'gastric ulcer', 'perforated peptic ulcer', 'graham patch', 'bleeding peptic ulcer', 'dieulafoy lesion', 'gastric outlet obstruction', 'succussion splash', 'truncal vagotomy', 'highly selective vagotomy', 'early dumping syndrome', 'late dumping syndrome', 'afferent loop syndrome', 'alkaline reflux gastritis') &&
      !has('carcinoma stomach', 'bariatric surgery', 'hypertrophic pyloric stenosis in infant')) {
    if (cur !== 495) {
      return { toModule: 495, reason: 'Tests peptic ulcer disease, duodenal perforation/bleeding, vagotomy, or post-gastrectomy syndromes, belonging to Surgery under Module 495 (Stomach and Duodenum).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 494: Esophagus - GERD & Carcinoma
  // -------------------------------------------------------------------------
  if (has('gastroesophageal reflux disease', 'gerd', 'barrett esophagus', 'specialized intestinal metaplasia', 'nissen fundoplication', 'toupet fundoplication', 'esophageal adenocarcinoma', 'esophageal squamous cell carcinoma', 'siewert classification', 'ivor lewis esophagectomy', 'mckeown esophagectomy', 'transhiatal esophagectomy') &&
      !has('achalasia', 'zenker diverticulum', 'boerhaave')) {
    if (cur !== 494) {
      return { toModule: 494, reason: 'Tests GERD, Barrett\'s esophagus, esophageal adenocarcinoma/squamous carcinoma, and esophagectomy, belonging to Surgery under Module 494 (Esophagus - GERD & Carcinoma).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 493: Esophagus - Congenital, Motility & Inflammatory Disorders
  // -------------------------------------------------------------------------
  if (has('achalasia cardia', 'bird beak appearance on barium', 'heller myotomy', 'poem procedure', 'diffuse esophageal spasm', 'corkscrew esophagus', 'zenker diverticulum', 'killian dehiscence', 'cricopharyngeal myotomy', 'boerhaave syndrome', 'mackler triad', 'mallory-weiss tear', 'corrosive stricture of esophagus') &&
      !has('esophageal carcinoma', 'gerd nissen', 'tracheoesophageal fistula in neonate')) {
    if (cur !== 493) {
      return { toModule: 493, reason: 'Tests esophageal motility disorders (achalasia, DES), Zenker\'s diverticulum, or perforation (Boerhaave/Mallory-Weiss), belonging to Surgery under Module 493 (Esophagus - Congenital, Motility & Inflammatory Disorders).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 492: Thyroid Malignancies
  // -------------------------------------------------------------------------
  if (has('papillary thyroid carcinoma', 'orphan annie eye nuclei', 'psammoma bodies in thyroid', 'follicular thyroid carcinoma', 'medullary thyroid carcinoma', 'calcitonin in medullary', 'amyloid stroma in thyroid', 'ret proto-oncogene in thyroid', 'anaplastic thyroid carcinoma', 'radioiodine ablation i-131', 'serum thyroglobulin recurrence') &&
      !has('multinodular goiter', 'graves disease', 'subacute thyroiditis')) {
    if (cur !== 492) {
      return { toModule: 492, reason: 'Tests malignant thyroid neoplasms (papillary, follicular, medullary, anaplastic) and radioiodine ablation, belonging to Surgery under Module 492 (Thyroid Malignancies).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 491: Benign Lesions of Thyroid
  // -------------------------------------------------------------------------
  if (has('multinodular goiter', 'graves disease', 'toxic adenoma', 'hashimoto thyroiditis', 'de quervain thyroiditis', 'solitary thyroid nodule', 'bethesda classification thyroid', 'thyroidectomy complications', 'recurrent laryngeal nerve injury', 'external branch of superior laryngeal nerve', 'hypocalcemia after thyroidectomy', 'tetany after thyroidectomy', 'reactionary hemorrhage after thyroidectomy', 'retrosternal goiter') &&
      !has('papillary thyroid cancer', 'medullary thyroid cancer')) {
    if (cur !== 491) {
      return { toModule: 491, reason: 'Tests benign thyroid disorders (goiter, Graves, thyroiditis), thyroidectomy surgical anatomy and postop complications, belonging to Surgery under Module 491 (Benign Lesions of Thyroid).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 490: Carcinoma Breast - Treatment
  // -------------------------------------------------------------------------
  if (has('breast conservation surgery', 'lumpectomy', 'modified radical mastectomy', 'mrm', 'sentinel lymph node biopsy in breast', 'slnb', 'axillary lymph node dissection in breast', 'alnd', 'tamoxifen in breast cancer', 'aromatase inhibitors in breast cancer', 'letrozole in breast cancer', 'trastuzumab in her2', 'herceptin', 'post-mastectomy radiation', 'oncoplastic breast surgery') &&
      !has('fibroadenoma', 'breast cyst', 'mastitis', 'breast abscess', 'screening mammography bi-rads')) {
    if (cur !== 490) {
      return { toModule: 490, reason: 'Tests surgical, endocrine, and adjuvant/neoadjuvant therapy of breast cancer (BCS, MRM, SLNB, Tamoxifen, Trastuzumab), belonging to Surgery under Module 490 (Carcinoma Breast - Treatment).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 489: Carcinoma Breast - Staging, Prognosis & Molecular Types
  // -------------------------------------------------------------------------
  if (has('tnm staging of breast cancer', 'luminal a breast cancer', 'luminal b breast cancer', 'her2-enriched breast cancer', 'triple negative breast cancer', 'tnbc', 'nottingham prognostic index', 'oncotype dx', 'prognostic factors in breast cancer') &&
      !has('fibroadenoma', 'surgical technique of mrm')) {
    if (cur !== 489) {
      return { toModule: 489, reason: 'Tests breast cancer TNM staging, molecular subtypes (Luminal A/B, TNBC), and prognostic indexes, belonging to Surgery under Module 489 (Carcinoma Breast - Staging, Prognosis & Molecular Types).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 488: Investigations in Breast diseases
  // -------------------------------------------------------------------------
  if (has('screening mammography', 'bi-rads category', 'breast ultrasound in dense breast', 'breast mri indications', 'triple assessment of breast', 'stereotactic core biopsy of breast', 'microcalcifications on mammography') &&
      !has('fibroadenoma clinical features', 'mrm surgery', 'tamoxifen')) {
    if (cur !== 488) {
      return { toModule: 488, reason: 'Tests diagnostic imaging (mammography, BI-RADS, breast MRI) and biopsy modalities in breast diseases, belonging to Surgery under Module 488 (Investigations in Breast diseases).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 487: Carcinoma Breast - Risk Factors and Types
  // -------------------------------------------------------------------------
  if (has('infiltrating ductal carcinoma', 'infiltrating lobular carcinoma', 'indian file pattern', 'dcis', 'lcis', 'comedo necrosis', 'paget disease of the nipple', 'inflammatory breast cancer', 'brca1 in breast cancer', 'brca2 in breast cancer', 'li-fraumeni breast cancer', 'risk factors for breast cancer') &&
      !has('mrm treatment', 'tamoxifen', 'bi-rads', 'benign breast disease')) {
    if (cur !== 487) {
      return { toModule: 487, reason: 'Tests histopathological subtypes, genetic predisposition (BRCA), and risk factors for breast cancer, belonging to Surgery under Module 487 (Carcinoma Breast - Risk Factors and Types).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 486: Breast - Anatomy, Congenital and Benign Diseases
  // -------------------------------------------------------------------------
  if (has('fibroadenoma', 'breast mouse', 'phyllodes tumor', 'intraductal papilloma', 'bloody nipple discharge', 'andi', 'puerperal mastitis', 'breast abscess', 'galactocele', 'gynecomastia', 'mondor disease', 'cooper ligament anatomy of breast') &&
      !has('carcinoma breast', 'mastectomy', 'tamoxifen')) {
    if (cur !== 486) {
      return { toModule: 486, reason: 'Tests benign breast conditions (fibroadenoma, phyllodes, duct papilloma, mastitis, abscess, gynecomastia), belonging to Surgery under Module 486 (Breast - Anatomy, Congenital and Benign Diseases).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 485: Trauma - Spinal, Thoracic and Abdominal Injuries
  // -------------------------------------------------------------------------
  if (has('tension pneumothorax', 'needle thoracocentesis', 'tube thoracostomy', 'massive hemothorax', 'flail chest', 'cardiac tamponade in trauma', 'beck triad', 'traumatic aortic rupture', 'blunt trauma abdomen', 'splenic injury in trauma', 'liver injury in trauma', 'pringle maneuver in liver trauma', 'pelvic fracture retroperitoneal hemorrhage', 'reboa', 'emergency department thoracotomy', 'diaphragmatic rupture trauma', 'seat belt sign') &&
      !has('triage category in atls', 'glasgow coma scale calculation')) {
    if (cur !== 485) {
      return { toModule: 485, reason: 'Tests thoracic, abdominal, or pelvic organ injuries from acute trauma (tension pneumothorax, flail chest, splenic/liver trauma, REBOA), belonging to Surgery under Module 485 (Trauma - Spinal, Thoracic and Abdominal Injuries).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 484: Trauma - Scores, Investigations and Assessment
  // -------------------------------------------------------------------------
  if (has('atls primary survey', 'atls secondary survey', 'trauma triage', 'revised trauma score', 'injury severity score', 'iss score', 'triss', 'glasgow coma scale in trauma triage', 'fast exam in trauma', 'e-fast in trauma') &&
      !has('operative management of liver injury', 'tension pneumothorax treatment')) {
    if (cur !== 484) {
      return { toModule: 484, reason: 'Tests ATLS primary/secondary survey principles, trauma scoring (RTS/ISS), triage categories, or FAST ultrasound assessment, belonging to Surgery under Module 484 (Trauma - Scores, Investigations and Assessment).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 483: Paediatric Surgery
  // -------------------------------------------------------------------------
  if (has('infantile hypertrophic pyloric stenosis', 'ramstedt pyloromyotomy', 'hirschsprung disease', 'congenital aganglionic megacolon', 'anorectal malformation', 'imperforate anus', 'psarp', 'invertogram', 'congenital diaphragmatic hernia in newborn', 'bochdalek hernia', 'tracheoesophageal fistula in newborn', 'esophageal atresia', 'duodenal atresia double bubble', 'jejunal atresia', 'malrotation midgut volvulus', 'ladd procedure', 'meconium ileus', 'omphalocele', 'gastroschisis', 'biliary atresia kasai', 'choledochal cyst in infant', 'wilms tumor nephroblastoma', 'neuroblastoma in child', 'sacrococcygeal teratoma', 'intussusception in infant target sign') &&
      !has('adult inguinal hernia', 'adult gallstone', 'adult colon cancer')) {
    if (cur !== 483) {
      return { toModule: 483, reason: 'Tests congenital neonatal and pediatric surgical conditions (CDH, TEF, IHPS, Hirschsprung, ARM, atresias, Wilms), belonging to Surgery under Module 483 (Paediatric Surgery).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 482: Instruments & Sutures
  // -------------------------------------------------------------------------
  if (has('suture material', 'absorbable suture', 'non-absorbable suture', 'vicryl', 'polyglactin', 'catgut', 'prolene', 'polypropylene suture', 'pds suture', 'polydioxanone', 'nylon suture', 'ethilon', 'silk suture', 'surgical needle round bodied', 'reverse cutting needle', 'harmonic scalpel', 'ultrasonic scalpel', 'ligasure', 'monopolar diathermy', 'bipolar diathermy', 'babcock forceps', 'allis forceps', 'kocher forceps', 'debakey forceps', 'metzenbaum scissors', 'veress needle', 'trocar laparoscopy', 'surgical stapler') &&
      !has('hernia mesh repair technique', 'trauma survey')) {
    if (cur !== 482) {
      return { toModule: 482, reason: 'Tests suture materials, needles, surgical instruments, and energy devices (Harmonic, LigaSure, diathermy), belonging to Surgery under Module 482 (Instruments & Sutures).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 481: Shock and Blood Transfusion
  // -------------------------------------------------------------------------
  if (has('septic shock', 'sepsis-3 criteria', 'qsofa', 'hypovolemic shock', 'cardiogenic shock', 'neurogenic shock', 'massive transfusion protocol', '1:1:1 ratio prbc', 'cryoprecipitate factor viii', 'fresh frozen plasma ffp', 'platelet transfusion trigger', 'trali', 'taco', 'acute hemolytic transfusion reaction', 'thromboelastography', 'teg', 'mixed venous oxygen saturation scvo2', 'end points of resuscitation in shock', 'norepinephrine in septic shock', 'damage control resuscitation') &&
      !has('fluid deficit holiday segar', 'burn fluid parkland', 'instruments')) {
    if (cur !== 481) {
      return { toModule: 481, reason: 'Tests shock classification/management, endpoints of resuscitation, blood components, or transfusion reactions, belonging to Surgery under Module 481 (Shock and Blood Transfusion).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 480: Fluids, Electrolytes & Nutrition
  // -------------------------------------------------------------------------
  if (has('fluid replacement holiday-segar', 'maintenance fluids in surgery', 'crystalloid vs colloid', 'ringer lactate composition', 'hypokalemia on ecg', 'hyperkalemia emergency treatment', 'calcium gluconate in hyperkalemia', 'hyponatremia correction central pontine', 'refeeding syndrome hypophosphatemia', 'total parenteral nutrition', 'tpn complications', 'enteral nutrition', 'eras protocol', 'enhanced recovery after surgery', 'preoperative fasting guidelines npo', 'prealbumin half life', 'subjective global assessment') &&
      !has('shock resuscitation', 'blood transfusion reactions', 'burn parkland')) {
    if (cur !== 480) {
      return { toModule: 480, reason: 'Tests perioperative fluid/electrolyte balance, refeeding syndrome, surgical nutrition (TPN/Enteral), or ERAS fasting protocols, belonging to Surgery under Module 480 (Fluids, Electrolytes & Nutrition).' };
    }
  }

  // -------------------------------------------------------------------------
  // SURGERY 530: Mixed / Miscellaneous Topics
  // -------------------------------------------------------------------------
  if (has('who surgical safety checklist', 'sign in time out sign out', 'autoclave cycle 121', 'geobacillus stearothermophilus', 'ethylene oxide sterilization', 'cidex glutaraldehyde', 'pneumoperitoneum co2 pressure', 'gas embolism during laparoscopy', 'durant maneuver', 'robotic surgery da vinci degrees of freedom', 'surgical audit peer review') &&
      !has('instruments suture', 'wound infection')) {
    if (cur !== 530) {
      return { toModule: 530, reason: 'Tests operating theatre sterilization, surgical safety checklists, laparoscopy physics/gas embolism, or robotic surgery, belonging to Surgery under Module 530 (Mixed / Miscellaneous Topics).' };
    }
  }

  return null;
}

module.exports = {
  classifyIntraSurgery
};
