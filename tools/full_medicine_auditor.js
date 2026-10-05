const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const modMap = new Map();
allModules.forEach(m => modMap.set(m.moduleId, m));

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
  const text = clean(q.question_text);
  const optA = clean(q.option_a);
  const optB = clean(q.option_b);
  const optC = clean(q.option_c);
  const optD = clean(q.option_d);
  const optE = clean(q.option_e);
  const expl = clean(q.explanation);
  const ansLetter = (q.answer || '').trim().toUpperCase();
  let ansText = '';
  if (ansLetter === 'A') ansText = optA;
  else if (ansLetter === 'B') ansText = optB;
  else if (ansLetter === 'C') ansText = optC;
  else if (ansLetter === 'D') ansText = optD;
  else if (ansLetter === 'E') ansText = optE;

  const full = `${text} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase();
  const qa = `${text} ${ansText}`.toLowerCase();

  return {
    id: q.id,
    currentModule: q.module_id,
    text,
    options: { A: optA, B: optB, C: optC, D: optD, E: optE },
    ansLetter,
    ansText,
    expl,
    full,
    qa
  };
});

console.log(`Processing ${questions.length} questions...`);

// Let's create an evaluation function for every question
function audit(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const text = q.text.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  const hasQA = (t) => qa.includes(t);
  const hasFull = (t) => full.includes(t);
  const hasText = (t) => text.includes(t);

  // -------------------------------------------------------------
  // DUMPED MODULE REASSIGNMENTS (411, 419, 432, 433, 434, 479)
  // When a question is in one of these dumped modules, we aggressively
  // locate its specific disease home across Medicine or other subjects!
  // -------------------------------------------------------------

  // =============================================================
  // A. CROSS-SUBJECT CLASSIFIERS
  // =============================================================

  // 1. OBSTETRICS & GYNECOLOGY
  if (hasQA('amniotic fluid') || hasQA('cervical dilatation') || hasQA('cervical dilation') || hasQA('partograph') || hasQA('labour') && (hasFull('cervix') || hasFull('contraction')) || hasQA('labor') && (hasFull('cervix') || hasFull('contraction')) || hasQA('cardiotocography') || hasQA('bishop score') || hasQA('breech presentation')) {
    return { toModule: 540, reason: 'Tests normal or abnormal labour mechanisms, partograph, and cervical assessment, belongs in OB & G: Normal Labour / Abnormal Labour' };
  }
  if (hasQA('preeclampsia') || hasQA('eclampsia') || hasQA('hellp syndrome') || hasQA('magnesium sulphate in eclampsia') || hasQA('magnesium sulfate') && hasFull('eclampsia') || hasQA('hydralazine') && hasFull('pregnancy')) {
    return { toModule: 553, reason: 'Tests hypertensive disorders in pregnancy (preeclampsia, eclampsia, HELLP), belongs in OB & G: Hypertensive Disorders in Pregnancy' };
  }
  if (hasQA('hydatidiform mole') || hasQA('choriocarcinoma') || hasQA('gestational trophoblastic') || hasQA('snowstorm appearance') && hasFull('uterus')) {
    return { toModule: 551, reason: 'Tests gestational trophoblastic diseases (hydatidiform mole, choriocarcinoma), belongs in OB & G: Gestational Trophoblastic Diseases' };
  }
  if (hasQA('postpartum hemorrhage') || hasQA('postpartum haemorrhage') || hasQA('pph') && hasFull('uterus') || hasQA('uterine atony') || hasQA('methergin') || hasQA('methylergometrine') || hasQA('uterine rupture') && hasFull('scar')) {
    return { toModule: 549, reason: 'Tests postpartum hemorrhage, uterine atony management, and uterotonics, belongs in OB & G: Postpartum Haemorrhage' };
  }
  if (hasQA('ectopic pregnancy') || hasQA('tubal pregnancy') || hasQA('salpingostomy') || hasQA('culdocentesis')) {
    return { toModule: 546, reason: 'Tests ectopic pregnancy clinical presentation, diagnosis, and surgical management, belongs in OB & G: Ectopic Pregnancy' };
  }
  if (hasQA('placenta previa') || hasQA('abruptio placentae') || hasQA('accidental hemorrhage') && hasFull('pregnancy')) {
    return { toModule: 548, reason: 'Tests antepartum hemorrhage (placenta previa vs abruption), belongs in OB & G: Antepartum Hemorrhage' };
  }
  if (hasQA('fibroid') || hasQA('uterine leiomyoma') || hasQA('submucosal fibroid') || hasQA('myomectomy')) {
    return { toModule: 560, reason: 'Tests uterine leiomyoma (fibroid) diagnosis and surgical management, belongs in OB & G: Fibroid' };
  }
  if (hasQA('endometriosis') || hasQA('adenomyosis') || hasQA('chocolate cyst') || hasQA('powder burn lesions')) {
    return { toModule: 561, reason: 'Tests endometriosis and adenomyosis pathogenesis and clinical features, belongs in OB & G: Endometriosis and Adenomyosis' };
  }
  if (hasQA('carcinoma cervix') || hasQA('cervical intraepithelial') || hasQA('cin 1') || hasQA('cin 2') || hasQA('cin 3') || hasQA('pap smear') && hasFull('cervix')) {
    return { toModule: 572, reason: 'Tests cervical intraepithelial neoplasia and cervical cancer screening, belongs in OB & G: Carcinoma Cervix' };
  }
  if (hasQA('intrauterine device') || hasQA('copper t') || hasQA('iud') && hasFull('contraceptive') || hasQA('mirena') || hasQA('pearl index')) {
    return { toModule: 563, reason: 'Tests contraception mechanisms, IUCDs, and failure indices, belongs in OB & G: Contraception and Sterilization' };
  }
  if (hasQA('bacterial vaginosis') || hasQA('clue cells') || hasQA('trichomonas vaginalis') && hasFull('whiff') || hasQA('vulvovaginal candidiasis') && hasFull('cottage cheese')) {
    return { toModule: 564, reason: 'Tests vaginal infections, wet mount microscopy, and clinical differentiation, belongs in OB & G: Vaginal Infections' };
  }
  if (hasQA('anemia in pregnancy') || hasQA('pregnant') && hasQA('microcytic anemia') || hasQA('iron deficiency in pregnancy')) {
    if (cur !== 552) return { toModule: 552, reason: 'Tests maternal hematology and anemia management during pregnancy, belongs in OB & G: Anemia in Pregnancy' };
  }
  if (hasQA('gestational diabetes') || hasQA('gdm') && hasFull('pregnancy') || hasQA('diabetes in pregnancy') || hasQA('dipsi')) {
    if (cur !== 554) return { toModule: 554, reason: 'Tests screening and management of diabetes in pregnancy, belongs in OB & G: Diabetes in Pregnancy' };
  }
  if (hasQA('perimenopause') || hasQA('postmenopausal bleeding') || hasQA('hormone replacement therapy') && hasFull('menopause')) {
    return { toModule: 569, reason: 'Tests perimenopause, menopause symptoms, and postmenopausal bleeding workup, belongs in OB & G: Perimenopause, Menopause and Post-Menopausal Bleeding' };
  }

  // 2. PEDIATRICS
  if (hasQA('apgar score') || hasQA('neonatal resuscitation') || hasQA('bag and mask ventilation in newborn') || hasQA('chest compressions in newborn')) {
    return { toModule: 577, reason: 'Tests Apgar scoring criteria and neonatal resuscitation protocol, belongs in Pediatrics: Apgar score and Neonatal Resuscitation' };
  }
  if (hasQA('respiratory distress syndrome') && hasFull('surfactant') && hasFull('preterm') || hasQA('hyaline membrane disease') || hasQA('necrotizing enterocolitis') || hasQA('meconium aspiration syndrome')) {
    return { toModule: 576, reason: 'Tests neonatal intensive care respiratory and intestinal pathology, belongs in Pediatrics: Diseases in Neonates requiring Special Care' };
  }
  if (hasQA('developmental milestone') || hasQA('pincer grasp') || hasQA('social smile') || hasQA('neck holding') || hasQA('stranger anxiety') || hasQA('copies circle') || hasQA('copies triangle') || hasQA('trike') && hasFull('child')) {
    return { toModule: 578, reason: 'Tests normative pediatric developmental milestones, belongs in Pediatrics: Developmental Milestones' };
  }
  if (hasQA('kwashiorkor') || hasQA('marasmus') || hasQA('severe acute malnutrition') || hasQA('flaky paint dermatosis') || hasQA('flag sign of hair')) {
    return { toModule: 581, reason: 'Tests severe acute protein-energy malnutrition syndromes, belongs in Pediatrics: Protein Energy Malnutrition' };
  }
  if (hasQA('tetralogy of fallot') || hasQA('boot shaped heart') || hasQA('transposition of great arteries') || hasQA('egg on string') || hasQA('tricuspid atresia') || hasQA('tapvc') || hasQA('snow man sign') && hasFull('heart')) {
    return { toModule: 598, reason: 'Tests cyanotic congenital heart disease presentations and imaging, belongs in Pediatrics: Cyanotic Congenital Heart Diseases' };
  }
  if (hasQA('ventricular septal defect') && hasFull('infant') || hasQA('atrial septal defect') && hasFull('child') || hasQA('patent ductus arteriosus') && hasFull('premature') || hasQA('coarctation of aorta') && hasFull('child') || hasQA('indomethacin for pda')) {
    if (cur !== 458 && cur !== 462) {
      return { toModule: 597, reason: 'Tests acyanotic congenital heart disease in pediatric populations, belongs in Pediatrics: Acyanotic Congenital Heart Diseases' };
    }
  }
  if (hasQA('mumps') || hasQA('measles') || hasQA('koplik spots') || hasQA('rubella') || hasQA('parotitis in child') || hasQA('subacute sclerosing panencephalitis') || hasQA('sspe')) {
    return { toModule: 590, reason: 'Tests pediatric viral exanthems (measles, mumps, rubella), belongs in Pediatrics: Measles, Mumps, Rubella and Other Viral Infections' };
  }
  if (hasQA('congenital adrenal hyperplasia') || hasQA('21-hydroxylase deficiency') || hasQA('17-hydroxyprogesterone') || hasQA('ambiguous genitalia in newborn') || hasQA('salt wasting crisis')) {
    return { toModule: 601, reason: 'Tests congenital adrenal hyperplasia enzyme defects and neonatal management, belongs in Pediatrics: Congenital Adrenal Hyperplasia and Related Disorders' };
  }
  if (hasQA('down syndrome') || hasQA('trisomy 21') || hasQA('edwards syndrome') || hasQA('trisomy 18') || hasQA('patau syndrome') || hasQA('trisomy 13') || hasQA('cri du chat')) {
    return { toModule: 585, reason: 'Tests pediatric chromosomal aneuploidies and dysmorphic syndromes, belongs in Pediatrics: Chromosomal Disorders' };
  }
  if (hasQA('hypertrophic pyloric stenosis') && hasFull('olive') || hasQA('intussusception') && hasFull('target sign') && hasFull('child') || hasQA('hirschsprung')) {
    return { toModule: 591, reason: 'Tests pediatric surgical gastrointestinal conditions, belongs in Pediatrics: Surgical GI Disorders' };
  }
  if (hasQA('croup') || hasQA('laryngotracheobronchitis') || hasQA('steeple sign') || hasQA('acute epiglottitis') || hasQA('thumb sign') || hasQA('bronchiolitis') && hasFull('rsv')) {
    return { toModule: 595, reason: 'Tests childhood acute lower/upper respiratory tract infections, belongs in Pediatrics: Childhood Respiratory Disorders' };
  }

  // 3. SURGERY
  if (hasQA('inguinal hernia') || hasQA('femoral hernia') || hasQA('direct hernia') || hasQA('indirect hernia') || hasQA('hesselbach') || hasQA('hernioplasty') || hasQA('herniorrhaphy') || hasQA('strangulated hernia') || hasQA('incarcerated hernia')) {
    return { toModule: 504, reason: 'Tests abdominal wall hernias, anatomy, and surgical repair techniques, belongs in Surgery: Hernia' };
  }
  if (hasQA('acute appendicitis') || hasQA('mcburney') || hasQA('appendectomy') || hasQA('alvarado score') || hasQA('appendiceal')) {
    return { toModule: 500, reason: 'Tests acute appendicitis clinical signs and surgical management, belongs in Surgery: Appendix' };
  }
  if (hasQA('cholelithiasis') || hasQA('acute cholecystitis') || hasQA('murphy\'s sign') || hasQA('cholecystectomy') || hasQA('gallstone ileus') || hasQA('biliary colic') && !hasFull('cirrhosis')) {
    return { toModule: 508, reason: 'Tests gallbladder pathology, cholelithiasis, and cholecystitis surgical management, belongs in Surgery: Gall Bladder' };
  }
  if (hasQA('choledochal cyst') || hasQA('cholangitis') && hasFull('charcot') || hasQA('choledocholithiasis') || hasQA('common bile duct stone')) {
    return { toModule: 509, reason: 'Tests bile duct obstruction, stones, and surgical procedures, belongs in Surgery: Bile Duct' };
  }
  if (hasQA('acute pancreatitis') && (hasQA('ranson') || hasQA('balthazar') || hasQA('ctsi') || hasQA('pancreatic necrosis') || hasQA('pseudocyst of pancreas') || hasQA('necrosectomy'))) {
    return { toModule: 512, reason: 'Tests acute pancreatitis complications, severity scoring, and surgical intervention, belongs in Surgery: Congenital Anomalies and Acute Pancreatitis' };
  }
  if (hasQA('chronic pancreatitis') && (hasQA('calcification') || hasQA('frey procedure') || hasQA('puestow procedure') || hasQA('steatorrhea') && hasFull('pancreatitis'))) {
    return { toModule: 513, reason: 'Tests chronic pancreatitis complications and surgical drainage procedures, belongs in Surgery: Chronic Pancreatitis' };
  }
  if (hasQA('pancreatic adenocarcinoma') || hasQA('whipple procedure') || hasQA('pancreaticoduodenectomy') || hasQA('courvoisier law') && hasFull('pancreas') || hasQA('double duct sign')) {
    return { toModule: 514, reason: 'Tests pancreatic head adenocarcinoma staging and Whipple resection, belongs in Surgery: Carcinoma Pancreas' };
  }
  if (hasQA('renal calculi') || hasQA('nephrolithiasis') || hasQA('kidney stone') || hasQA('eswl') || hasQA('pcnl') || hasQA('ureteroscopy') || hasQA('staghorn calculus') || hasQA('calcium oxalate stone') && hasFull('colic')) {
    return { toModule: 515, reason: 'Tests nephrolithiasis, stone composition, and urological interventions (ESWL/PCNL), belongs in Surgery: Congenital Diseases of Kidney and Urinary Calculi' };
  }
  if (hasQA('renal cell carcinoma') || hasQA('clear cell carcinoma') && hasFull('kidney') || hasQA('radical nephrectomy') || hasQA('wilms tumor') && hasFull('surgery')) {
    return { toModule: 516, reason: 'Tests renal cell carcinoma presentation and oncologic surgery, belongs in Surgery: Infections and Tumors of Kidney' };
  }
  if (hasQA('benign prostatic hyperplasia') || hasQA('bph') && hasFull('prostate') || hasQA('turp') || hasQA('transurethral resection of prostate') || hasQA('prostate cancer') || hasQA('gleason score') && hasFull('prostate')) {
    return { toModule: 518, reason: 'Tests prostatic hyperplasia and prostate cancer diagnosis and surgery, belongs in Surgery: Prostate' };
  }
  if (hasQA('burns') && (hasQA('rule of nines') || hasQA('parkland formula') || hasQA('escharotomy') || hasQA('curling ulcer') || hasQA('fluid resuscitation in burns'))) {
    return { toModule: 523, reason: 'Tests burn injury surface area estimation, fluid resuscitation, and surgical care, belongs in Surgery: Burns' };
  }
  if (hasQA('epidural hematoma') || hasQA('extradural hematoma') || hasQA('middle meningeal artery') || hasQA('subdural hematoma') || hasQA('lucid interval') || hasQA('crescent shaped hematoma') || hasQA('biconvex hematoma')) {
    return { toModule: 521, reason: 'Tests traumatic intracranial hematomas and emergent neurosurgical decompression, belongs in Surgery: Head Injury' };
  }
  if (hasQA('splenic rupture') || hasQA('kehr\'s sign') || hasQA('splenectomy') && hasFull('trauma') || hasQA('post splenectomy sepsis') && hasFull('surgery')) {
    return { toModule: 510, reason: 'Tests splenic trauma, grading, and surgical splenectomy, belongs in Surgery: Spleen' };
  }
  if (hasQA('carcinoma stomach') || hasQA('gastric adenocarcinoma') || hasQA('linitis plastica') || hasQA('virchow node') && hasFull('stomach') || hasQA('sister mary joseph nodule') && hasFull('stomach') || hasQA('krukenberg tumor') && hasFull('gastric')) {
    return { toModule: 496, reason: 'Tests gastric adenocarcinoma presentation, metastatic patterns, and gastrectomy, belongs in Surgery: Carcinoma Stomach' };
  }
  if (hasQA('peptic ulcer') && (hasQA('perforation') || hasQA('graham patch') || hasQA('bleeding duodenal ulcer') && hasFull('gastroduodenal artery') || hasQA('gastric outlet obstruction') && hasFull('vomiting') && hasFull('succussion'))) {
    return { toModule: 495, reason: 'Tests peptic ulcer complications (perforation, gastric outlet obstruction) and surgical management, belongs in Surgery: Stomach and Duodenum' };
  }
  if (hasQA('colorectal carcinoma') || hasQA('colon cancer') || hasQA('familial adenomatous polyposis') || hasQA('apple core sign') && hasFull('colon') || hasQA('adenomatous polyps') && hasFull('colon')) {
    return { toModule: 501, reason: 'Tests colorectal cancer screening, staging, and surgical resection, belongs in Surgery: Polyps and Colorectal Carcinoma' };
  }
  if (hasQA('hemorrhoids') || hasQA('piles') || hasQA('anal fissure') || hasQA('fistula-in-ano') || hasQA('goodsall rule') || hasQA('perianal abscess') && !hasFull('crohn')) {
    return { toModule: 503, reason: 'Tests proctology disorders (hemorrhoids, fissure, fistula) and operative treatments, belongs in Surgery: Anus and Anal Canal' };
  }
  if (hasQA('fibroadenoma') || hasQA('benign breast') || hasQA('carcinoma breast') || hasQA('sentinel lymph node') && hasFull('breast') || hasQA('mastectomy') || hasQA('triple assessment') && hasFull('breast')) {
    return { toModule: 487, reason: 'Tests breast carcinoma diagnosis, pathology, and surgical management, belongs in Surgery: Carcinoma Breast - Risk Factors and Types / Treatment' };
  }
  if (hasQA('wound healing') || hasQA('keloid') || hasQA('hypertrophic scar') || hasQA('collagen synthesis') && hasFull('scar') || hasQA('primary intention') || hasQA('secondary intention')) {
    return { toModule: 524, reason: 'Tests surgical wound healing phases, abnormal scars (keloids), and closure, belongs in Surgery: Wound Healing, Tissue Repair and Scar' };
  }
  if (hasQA('aortic dissection') && (hasQA('stanford type a') || hasQA('emergency surgery') || hasQA('intimal tear')) || hasQA('abdominal aortic aneurysm') && hasFull('surgery')) {
    return { toModule: 527, reason: 'Tests aortic aneurysms and dissection surgical classifications and repair, belongs in Surgery: Arterial Aneurysms, Dissections and Malformations' };
  }
  if (hasQA('varicose veins') || hasQA('trendelenburg test') && hasFull('vein') || hasQA('saphenofemoral junction') || hasQA('vein stripping')) {
    return { toModule: 528, reason: 'Tests venous insufficiency, varicose veins clinical testing, and vascular surgery, belongs in Surgery: Venous Diseases' };
  }

  // 4. PSYCHIATRY
  if (hasQA('schizophrenia') || hasQA('auditory hallucination') && hasFull('schizophrenia') || hasQA('kurt schneider') || hasQA('first rank symptoms') || hasQA('thought insertion') || hasQA('thought broadcasting')) {
    return { toModule: 692, reason: 'Tests diagnostic criteria and phenomenology of schizophrenia, belongs in Psychiatry: Schizophrenia' };
  }
  if (hasQA('bipolar disorder') || hasQA('bipolar affective') || hasQA('mania') && (hasFull('grandiosity') || hasFull('flight of ideas') || hasFull('decreased need for sleep'))) {
    return { toModule: 698, reason: 'Tests bipolar affective disorder and manic symptom clusters, belongs in Psychiatry: Bipolar and Related Disorders' };
  }
  if (hasQA('major depressive disorder') || hasQA('dysthymia') || hasQA('melancholia') || hasQA('anhedonia') && hasFull('depression') || hasQA('beck depression')) {
    return { toModule: 697, reason: 'Tests diagnostic criteria and manifestations of depressive disorders, belongs in Psychiatry: Depressive Disorders' };
  }
  if (hasQA('panic disorder') || hasQA('agoraphobia') || hasQA('generalized anxiety disorder') || hasQA('social phobia') || hasQA('social anxiety')) {
    return { toModule: 701, reason: 'Tests primary anxiety and panic disorders, belongs in Psychiatry: Anxiety Disorders' };
  }
  if (hasQA('obsessive compulsive disorder') || hasQA('ocd') && hasFull('compulsion') || hasQA('exposure and response prevention') || hasQA('trichotillomania') || hasQA('body dysmorphic disorder')) {
    return { toModule: 702, reason: 'Tests obsessive-compulsive spectrum and related disorders, belongs in Psychiatry: Obsessive-Compulsive and Related Disorders' };
  }
  if (hasQA('post traumatic stress disorder') || hasQA('ptsd') || hasQA('flashbacks') && hasFull('trauma') || hasQA('acute stress disorder')) {
    return { toModule: 703, reason: 'Tests post-traumatic stress disorder and acute stress reaction, belongs in Psychiatry: Trauma and Stress-Related Disorders' };
  }
  if (hasQA('borderline personality') || hasQA('antisocial personality') || hasQA('histrionic personality') || hasQA('narcissistic personality') || hasQA('schizoid') && hasFull('personality') || hasQA('splitting') && hasFull('personality')) {
    return { toModule: 704, reason: 'Tests personality disorder diagnostic clusters, belongs in Psychiatry: Personality Disorders' };
  }
  if (hasQA('conversion disorder') || hasQA('functional neurological symptom') || hasQA('la belle indifference') || hasQA('somatization disorder') || hasQA('illness anxiety disorder')) {
    return { toModule: 705, reason: 'Tests somatoform, conversion, and illness anxiety disorders, belongs in Psychiatry: Somatoform Disorders' };
  }
  if (hasQA('anorexia nervosa') || hasQA('bulimia nervosa') || hasQA('binge eating disorder') || hasQA('russell sign') && hasFull('purging')) {
    return { toModule: 709, reason: 'Tests eating disorder criteria and medical complications, belongs in Psychiatry: Eating Disorders' };
  }
  if (hasQA('phantom limb pain') || hasQA('pain in the missing limb') || hasQA('feels the pain in the amputated')) {
    return { toModule: 69, reason: 'Tests phantom limb sensation and central pain pathways, belongs in Physiology: Pain and Temperature (or Psychiatry: Somatoform)' };
  }

  // 5. DERMATOLOGY
  if (hasQA('pemphigus vulgaris') || hasQA('bullous pemphigoid') || hasQA('nikolsky sign') || hasQA('anti-desmoglein') || hasQA('tombstone appearance') || hasQA('acantholysis') || hasQA('dermatitis herpetiformis') && hasFull('blister')) {
    return { toModule: 644, reason: 'Tests immunobullous skin disorders (pemphigus/pemphigoid/dermatitis herpetiformis), belongs in Dermatology: Vesiculobullous Diseases' };
  }
  if (hasQA('psoriasis') && (hasQA('auspitz sign') || hasQA('koebner phenomenon') || hasQA('silvery scale') || hasQA('munro microabscess') || hasQA('oil drop sign'))) {
    return { toModule: 643, reason: 'Tests psoriasis morphology, clinical signs, and histopathology, belongs in Dermatology: Psoriasis' };
  }
  if (hasQA('lichen planus') || hasQA('wickham striae') || hasQA('violaceous papules') || hasQA('sawtooth rete ridges') || hasQA('pityriasis rosea') || hasQA('herald patch')) {
    return { toModule: 642, reason: 'Tests papulosquamous dermatoses (lichen planus, pityriasis rosea), belongs in Dermatology: Papulosquamous Disorders' };
  }
  if (hasQA('leprosy') || hasQA('hansen disease') || hasQA('lepromatous leprosy') || hasQA('tuberculoid leprosy') || hasQA('erythema nodosum leprosum') || hasQA('slit skin smear') || hasQA('ridley jopling') || hasQA('clofazimine') && hasFull('leprosy')) {
    return { toModule: 645, reason: 'Tests leprosy classification, reactions, and multidrug therapy regimens, belongs in Dermatology: Mycobacterial Infections' };
  }
  if (hasQA('steven johnson syndrome') || hasQA('stevens-johnson syndrome') || hasQA('toxic epidermal necrolysis') || hasQA('erythema multiforme') || hasQA('target lesion') && hasFull('skin') || hasQA('fixed drug eruption')) {
    return { toModule: 641, reason: 'Tests severe cutaneous adverse reactions and reactive dermatoses, belongs in Dermatology: Reactive Skin Diseases and Drug Eruptions' };
  }
  if (hasQA('acne vulgaris') || hasQA('comedone') || hasQA('isotretinoin') && hasFull('acne') || hasQA('rosacea') || hasQA('rhinophyma')) {
    return { toModule: 636, reason: 'Tests acne vulgaris and rosacea pathophysiology and dermatotherapy, belongs in Dermatology: Acne, Rosacea and Others' };
  }
  if (hasQA('alopecia areata') || hasQA('exclamation mark hair') || hasQA('androgenetic alopecia') || hasQA('telogen effluvium') || hasQA('onychomycosis')) {
    return { toModule: 637, reason: 'Tests disorders of hair and nails, belongs in Dermatology: Disorders of Hair and Nails' };
  }
  if (hasQA('scabies') || hasQA('burrow') && hasFull('itch') || hasQA('permethrin 5%') || hasQA('sarcoptes scabiei')) {
    return { toModule: 649, reason: 'Tests cutaneous parasitic infestations (scabies), belongs in Dermatology: Arthropod and Parasitic Infections' };
  }
  if (hasQA('primary chancre') || hasQA('condyloma lata') || hasQA('gumma') && hasFull('syphilis') || hasQA('tabes dorsalis') && hasFull('syphilis')) {
    if (cur !== 650 && cur !== 471) {
      return { toModule: 650, reason: 'Tests syphilitic cutaneous and clinical lesions across stages, belongs in Dermatology: Syphilis' };
    }
  }

  // 6. OPHTHALMOLOGY
  if (hasQA('cataract') || hasQA('phacoemulsification') || hasQA('intraocular lens') || hasQA('senile cataract')) {
    return { toModule: 336, reason: 'Tests cataract morphology and surgical management, belongs in Ophthalmology: Cataract' };
  }
  if (hasQA('glaucoma') || hasQA('intraocular pressure') || hasQA('cup to disc ratio') || hasQA('tonometry') || hasQA('angle closure') || hasQA('trabeculectomy') || hasQA('open angle glaucoma')) {
    return { toModule: 338, reason: 'Tests glaucoma classifications, gonioscopy, and tonometry, belongs in Ophthalmology: Glaucoma' };
  }
  if (hasQA('retinal detachment') || hasQA('central retinal artery occlusion') || hasQA('cherry red spot') && hasFull('retina') || hasQA('central retinal vein occlusion') || hasQA('blood and thunder appearance')) {
    return { toModule: 337, reason: 'Tests retinal vascular occlusive diseases and detachment, belongs in Ophthalmology: Retinal Vascular Disorders and Retinal Detachment' };
  }
  if (hasQA('myopia') || hasQA('hypermetropia') || hasQA('astigmatism') || hasQA('presbyopia') || hasQA('retinoscopy') || hasQA('snellen chart')) {
    return { toModule: 331, reason: 'Tests optics, visual acuity, and refractive errors, belongs in Ophthalmology: Myopia and Hypermetropia' };
  }
  if (hasQA('uveitis') || hasQA('hypopyon') && hasFull('anterior chamber') || hasQA('posterior synechiae') || hasQA('keratic precipitates')) {
    return { toModule: 339, reason: 'Tests uveitis, anterior uveal tract inflammation, and ocular findings, belongs in Ophthalmology: Uvea' };
  }

  // 7. ENT
  if (hasQA('otitis media') || hasQA('acute otitis media') || hasQA('asom') || hasQA('csom') || hasQA('cholesteatoma') || hasQA('tympanic membrane perforation') || hasQA('myringotomy')) {
    return { toModule: 301, reason: 'Tests middle ear inflammatory diseases and cholesteatoma, belongs in ENT: Diseases of Middle Ear' };
  }
  if (hasQA('otosclerosis') || hasQA('carhart notch') || hasQA('stapedectomy') || hasQA('schwartze sign')) {
    return { toModule: 302, reason: 'Tests otosclerosis audiology and stapedial otology, belongs in ENT: Otosclerosis' };
  }
  if (hasQA('meniere disease') || hasQA('endolymphatic hydrops') || hasQA('low frequency sensorineural hearing loss') && hasFull('vertigo')) {
    return { toModule: 305, reason: 'Tests Meniere disease vestibular pathology, belongs in ENT: Meniere\'s Disease and Vestibular Disorders' };
  }
  if (hasQA('rhinosinusitis') || hasQA('sinusitis') && hasFull('nasal discharge') || hasQA('nasal polyp') || hasQA('epistaxis') && (hasFull('little area') || hasFull('kiesselbach'))) {
    return { toModule: 310, reason: 'Tests nasal and paranasal sinus conditions (sinusitis, epistaxis, polyps), belongs in ENT: Non-Specific and Specific Rhinitis / Sinusitis' };
  }
  if (hasQA('vocal cord nodule') || hasQA('singer node') || hasQA('vocal cord polyp') || hasQA('laryngeal carcinoma')) {
    return { toModule: 323, reason: 'Tests laryngeal pathology, vocal cord lesions, and phonosurgery, belongs in ENT: Voice & Speech Disorders / Laryngeal Carcinoma' };
  }

  // 8. ORTHOPAEDICS
  if (hasQA('colles fracture') || hasQA('dinner fork deformity') || hasQA('smith fracture') || hasQA('monteggia fracture') || hasQA('galeazzi fracture') || hasQA('scaphoid fracture') || hasQA('anatomical snuffbox')) {
    return { toModule: 661, reason: 'Tests forearm and wrist fracture management, belongs in Orthopaedics: Injuries of Elbow and Forearm' };
  }
  if (hasQA('neck of femur fracture') || hasQA('garden classification') || hasQA('intertrochanteric fracture') || hasQA('avascular necrosis of femoral head')) {
    return { toModule: 664, reason: 'Tests proximal femoral fractures and avascular necrosis, belongs in Orthopaedics: Injuries of Hip and Thigh' };
  }
  if (hasQA('compartment syndrome') && (hasQA('volkmann ischemic contracture') || hasQA('fasciotomy') || hasQA('pain on passive stretch') || hasQA('intracompartmental pressure'))) {
    return { toModule: 658, reason: 'Tests acute compartment syndrome pathophysiology and emergency fasciotomy, belongs in Orthopaedics: Complications of Fracture' };
  }
  if (hasQA('anterior cruciate ligament') || hasQA('acl tear') || hasQA('lachman test') || hasQA('pivot shift') || hasQA('meniscus tear') || hasQA('mcmurray test')) {
    return { toModule: 685, reason: 'Tests knee sports injuries, cruciate ligaments, and meniscal tears, belongs in Orthopaedics: Sports Injury' };
  }
  if (hasQA('osteosarcoma') || hasQA('sunburst appearance') || hasQA('codman triangle') || hasQA('ewing sarcoma') || hasQA('onion peel appearance') || hasQA('giant cell tumor') || hasQA('soap bubble appearance')) {
    return { toModule: 677, reason: 'Tests primary malignant and aggressive bone neoplasms, belongs in Orthopaedics: Bone Tumors' };
  }

  // 9. FORENSIC MEDICINE
  if (hasQA('rigor mortis') || hasQA('algor mortis') || hasQA('livor mortis') || hasQA('postmortem staining') || hasQA('adipocere') || hasQA('mummification') || hasQA('cadaveric spasm')) {
    return { toModule: 276, reason: 'Tests thanatology and postmortem interval determination, belongs in Forensic Medicine: Death and Post-Mortem Changes' };
  }
  if (hasQA('gunshot residue') || hasQA('entry wound') && hasFull('bullet') || hasQA('rifling') || hasQA('tattooing') && hasFull('firearm')) {
    return { toModule: 286, reason: 'Tests forensic ballistics and firearm wound morphology, belongs in Forensic Medicine: Firearm Injuries' };
  }
  if (hasQA('section 376') || hasQA('bns') || hasQA('bharatiya nyaya sanhita') || hasQA('medical jurisprudence') || hasQA('inquest') || hasQA('expert witness')) {
    return { toModule: 275, reason: 'Tests forensic legal procedures and Indian criminal jurisprudence, belongs in Forensic Medicine: BNS, BNSS, and BSA' };
  }
  if (hasQA('organophosphate poisoning') && (hasFull('postmortem') || hasFull('garlic odour') || hasFull('toxicology')) || hasQA('aluminum phosphide') && hasFull('celphos') || hasQA('snake bite') && hasFull('neurotoxic venom') && (hasFull('elapidae') || hasFull('viperidae'))) {
    if (cur === 450 || cur === 411) {
      return { toModule: 289, reason: 'Tests forensic toxicology of poisons and venoms, belongs in Forensic Medicine: Toxicology' };
    }
  }

  // 10. ANAESTHESIA
  if (hasQA('mallampati classification') || hasQA('laryngoscope blade') || hasQA('endotracheal tube') && hasFull('cuff') || hasQA('laryngeal mask airway') || hasQA('difficult airway algorithm')) {
    return { toModule: 613, reason: 'Tests airway management devices and pre-intubation assessment, belongs in Anaesthesia: Airway Devices' };
  }
  if (hasQA('minimum alveolar concentration') || hasQA('mac of halothane') || hasQA('blood gas partition coefficient') || hasQA('malignant hyperthermia') && hasFull('dantrolene')) {
    return { toModule: 615, reason: 'Tests volatile inhalational anesthetics and malignant hyperthermia, belongs in Anaesthesia: Inhalational Anaesthetic Agents' };
  }
  if (hasQA('spinal anaesthesia') || hasQA('subarachnoid block') || hasQA('post dural puncture headache') || hasQA('ligamentum flavum') && hasFull('epidural')) {
    return { toModule: 618, reason: 'Tests neuraxial anesthesia techniques and complications, belongs in Anaesthesia: Spinal and Epidural Anaesthesia' };
  }

  // 11. PSM
  if (hasQA('odds ratio') || hasQA('relative risk') || hasQA('case control study') || hasQA('cohort study') || hasQA('randomized controlled trial') || hasQA('selection bias') || hasQA('confounding factor')) {
    return { toModule: 359, reason: 'Tests epidemiological study methodology and risk association, belongs in PSM: Analytical Epidemiology' };
  }
  if (hasQA('sensitivity and specificity') || hasQA('positive predictive value') || hasQA('negative predictive value') || hasQA('roc curve')) {
    return { toModule: 362, reason: 'Tests screening test metrics, sensitivity, and predictive values, belongs in PSM: Screening for Disease' };
  }
  if (hasQA('biomedical waste') || hasQA('yellow bag') && hasFull('waste') || hasQA('red bag') && hasFull('waste') || hasQA('blue container') && hasFull('glassware')) {
    return { toModule: 405, reason: 'Tests bio-medical waste segregation guidelines, belongs in PSM: Healthcare Waste Management' };
  }

  // 12. BIOCHEMISTRY
  if (hasQA('glycolysis') && (hasQA('phosphofructokinase-1') || hasQA('hexokinase') || hasQA('pyruvate kinase'))) {
    return { toModule: 100, reason: 'Tests glycolysis regulatory enzymes and energetics, belongs in Biochemistry: Glycolysis and Gluconeogenesis' };
  }
  if (hasQA('glycogen storage disease') || hasQA('von gierke') || hasQA('pompe disease') || hasQA('cori disease') || hasQA('mcardle disease') || hasQA('glucose-6-phosphatase deficiency') || hasQA('acid alpha-glucosidase')) {
    return { toModule: 101, reason: 'Tests inborn errors of glycogen metabolism and enzyme deficiencies, belongs in Biochemistry: Glycogen Metabolism and Glycogen Storage Disorders' };
  }
  if (hasQA('urea cycle') && (hasQA('carbamoyl phosphate synthetase') || hasQA('ornithine transcarbamylase') || hasQA('citrulline') || hasQA('argininosuccinate'))) {
    return { toModule: 108, reason: 'Tests urea cycle pathway and hyperammonemia enzyme defects, belongs in Biochemistry: Urea Cycle and its Disorders' };
  }
  if (hasQA('porphyria cutanea tarda') && hasFull('uroporphyrinogen decarboxylase') || hasQA('acute intermittent porphyria') && hasFull('porphobilinogen deaminase') || hasQA('ala synthase') || hasQA('the most common porphyria')) {
    return { toModule: 114, reason: 'Tests heme biosynthesis pathway and porphyrias, belongs in Biochemistry: Porphyrins and Bile Pigments' };
  }
  if (hasQA('michaelis menten') || hasQA('lineweaver burk') || hasQA('km and vmax') || hasQA('competitive inhibitor') && hasFull('vmax')) {
    return { toModule: 116, reason: 'Tests enzyme kinetics, Km, Vmax, and modes of inhibition, belongs in Biochemistry: Enzyme Kinetics and Regulation of Activity' };
  }
  if (hasQA('alkaptonuria') || hasQA('homogentisic acid') || hasQA('urine blackening on exposure to air') || hasQA('phenylketonuria') && hasFull('phenylalanine hydroxylase') || hasQA('maple syrup urine disease')) {
    return { toModule: 106, reason: 'Tests inborn errors of amino acid metabolism (alkaptonuria, PKU, MSUD), belongs in Biochemistry: Amino Acid: Metabolic Disorder' };
  }

  // 13. PHARMACOLOGY
  if (hasQA('mechanism of action of ranolazine') || hasQA('ranolazine') && (hasText('late sodium current') || hasText('ina') || hasText('mechanism of action'))) {
    return { toModule: 225, reason: 'Tests mechanism of action of ranolazine (late INa blocker), belongs in Pharmacology: Anti-Anginal Drugs' };
  }
  if (hasQA('remdesivir') && hasText('mechanism of action')) {
    return { toModule: 251, reason: 'Tests antiviral pharmacology (RNA-dependent RNA polymerase inhibitor), belongs in Pharmacology: Anti-virals (Non-retroviral)' };
  }
  if (hasQA('bioavailability') && (hasText('area under the curve') || hasText('volume of distribution') || hasText('clearance formula') || hasText('half life formula'))) {
    return { toModule: 221, reason: 'Tests basic pharmacokinetics principles and equations, belongs in Pharmacology: Pharmacokinetics' };
  }
  if (hasQA('metronidazole should not be used with') || hasQA('disulfiram-like reaction') && hasFull('metronidazole')) {
    return { toModule: 246, reason: 'Tests antiprotozoal drug interactions (metronidazole disulfiram-like reaction), belongs in Pharmacology: Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // 14. PATHOLOGY
  if (hasQA('reed sternberg') || hasQA('owl eye appearance') && hasFull('lymphoma') || hasQA('nodular lymphocyte predominant hodgkin') || hasQA('nlphl')) {
    return { toModule: 152, reason: 'Tests histopathology and cytogenetics of Hodgkin lymphoma, belongs in Pathology: Hodgkin\'s Lymphoma' };
  }
  if (hasQA('auer rods') || hasQA('acute promyelocytic leukemia') && hasFull('t(15;17)') || hasQA('myeloperoxidase positive') && hasFull('blast')) {
    return { toModule: 151, reason: 'Tests bone marrow morphology and cytogenetics of AML, belongs in Pathology: Acute Myeloid Leukemia (AML)' };
  }
  if (hasQA('burkitt lymphoma') && (hasQA('starry sky appearance') || hasQA('t(8;14)') || hasQA('c-myc'))) {
    return { toModule: 154, reason: 'Tests high-grade lymphoma cytogenetics and starry-sky morphology, belongs in Pathology: Non Hodgkin Lymphomas: High Grade' };
  }
  if (hasQA('hemophilia a') && hasText('factor 8') && (hasText('deficiency') || hasText('severity') || hasText('clotting factor'))) {
    if (cur !== 476 && cur !== 475) {
      return { toModule: 148, reason: 'Tests coagulation pathway cascade and factor VIII deficiency classification, belongs in Pathology: Coagulation Pathway Disorders' };
    }
  }
  if (hasQA('sickle cell anemia') && hasText('amino acid substitution') || hasQA('glutamic acid to valine') && hasFull('hemoglobin')) {
    return { toModule: 145, reason: 'Tests sickle cell disease molecular pathology and hemoglobinopathy, belongs in Pathology: Extravascular Hemolysis' };
  }

  // 15. MICROBIOLOGY
  if (hasQA('bacillus cereus') && (hasFull('fried rice') || hasFull('food poisoning') || hasFull('buffet')) || hasQA('clostridium botulinum') && hasFull('flaccid paralysis')) {
    if (cur !== 443 && cur !== 474) {
      return { toModule: 196, reason: 'Tests spore-forming Gram-positive bacilli toxins and food poisoning, belongs in Microbiology: Clostridium and Bacillus' };
    }
  }
  if (hasQA('hepatitis b serology') || hasQA('hbsag') && hasFull('igm anti-hbc') && (hasFull('window period') || hasFull('positive')) || hasQA('anti lkm 3') || hasQA('hepatitis e') && hasFull('percutaneous')) {
    if (cur !== 425 && cur !== 426 && cur !== 428) {
      return { toModule: 209, reason: 'Tests viral hepatitis serological markers, transmission, and antigens, belongs in Microbiology: Hepatitis' };
    }
  }
  if (hasQA('leptospirosis') || hasQA('leptospira') || hasQA('weil disease') && hasFull('spirochete')) {
    if (cur !== 425 && cur !== 450) {
      return { toModule: 207, reason: 'Tests spirochetes biology and zoonotic Leptospira infections, belongs in Microbiology: Spirochetes' };
    }
  }
  if (hasQA('proteus infection') && hasFull('urinary tract') || hasQA('swarming motility') && hasFull('proteus')) {
    return { toModule: 199, reason: 'Tests Gram-negative enteric bacilli (Proteus) characteristics and virulence, belongs in Microbiology: Escherichia, Proteus and Klebsiella' };
  }
  if (hasQA('otitis externa') && hasFull('pseudomonas') || hasQA('swimmer\'s ear') || hasQA('malignant otitis externa')) {
    return { toModule: 202, reason: 'Tests Pseudomonas aeruginosa infections (swimmer\'s ear / otitis externa), belongs in Microbiology: Pseudomonas and Burkholderiales' };
  }

  // =============================================================
  // B. INTRA-MEDICINE CLASSIFIERS (Within Modules 411 to 479)
  // =============================================================

  // 1. ENDOCRINOLOGY
  // Anterior Pituitary (414)
  if (hasQA('acromegaly') || hasQA('growth hormone') || hasQA('igf-1') || hasQA('octreotide') && hasFull('acromegaly') || hasQA('pegvisomant') || hasQA('transsphenoidal') && hasFull('gh')) {
    if (cur !== 414 && cur !== 415) {
      return { toModule: 414, reason: 'Tests acromegaly clinical presentation, IGF-1 diagnosis, and medical management, belongs in Medicine: Disorders of Anterior Pituitary' };
    }
  }
  if (hasQA('prolactinoma') || hasQA('hyperprolactinemia') || hasQA('cabergoline') || hasQA('bromocriptine') || hasQA('galactorrhea') && hasFull('prolactin')) {
    if (cur !== 414 && cur !== 415) {
      return { toModule: 414, reason: 'Tests hyperprolactinemia and prolactinoma diagnosis and dopamine agonist treatment, belongs in Medicine: Disorders of Anterior Pituitary' };
    }
  }

  // Pituitary Tumors & Sheehan (415)
  if (hasQA('sheehan syndrome') || hasQA('pituitary apoplexy') || hasQA('bitemporal hemianopia') && hasFull('pituitary adenoma') || hasQA('nelson syndrome') || hasQA('empty sella')) {
    if (cur !== 415) {
      return { toModule: 415, reason: 'Tests pituitary adenoma mass effects, apoplexy, or Sheehan syndrome, belongs in Medicine: Pituitary Tumors and Sheehan Syndrome' };
    }
  }

  // Posterior Pituitary (416)
  if (hasQA('siadh') || hasQA('syndrome of inappropriate antidiuretic') || hasQA('diabetes insipidus') || hasQA('central diabetes insipidus') || hasQA('nephrogenic diabetes insipidus') || hasQA('water deprivation test') || hasQA('desmopressin response') || hasQA('vaptans') || hasQA('tolvaptan') && hasFull('hyponatremia') || hasQA('polyuria') && hasFull('urine osmolarity') && hasFull('desmopressin')) {
    if (cur !== 416) {
      return { toModule: 416, reason: 'Tests posterior pituitary ADH pathology (SIADH / Diabetes Insipidus), belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus' };
    }
  }

  // Thyroid Management (417)
  if (hasQA('antithyroid drug') || hasQA('methimazole') || hasQA('carbimazole') || hasQA('propylthiouracil') || hasQA('radioactive iodine') || hasQA('thyroid storm') && (hasText('treatment') || hasText('management') || hasText('preferred drug')) || hasQA('levothyroxine') && (hasText('dose') || hasText('monitoring') || hasText('pregnancy'))) {
    if (cur !== 417) {
      return { toModule: 417, reason: 'Tests thyroid therapeutics, antithyroid drug selection, storm management, or levothyroxine monitoring, belongs in Medicine: Thyroid Disorders - Management' };
    }
  }

  // Thyroid Clinical Features (418)
  if (hasQA('graves disease') || hasQA('hashimoto thyroiditis') || hasQA('subacute thyroiditis') || hasQA('de quervain') || hasQA('pretibial myxedema') || hasQA('exophthalmos') && hasFull('thyroid') || hasQA('myxedema coma') || hasQA('toxic multinodular goiter') || hasQA('tsh receptor antibody') || hasQA('anti-tpo antibody') || hasQA('thyrotoxicosis') && (hasText('feature') || hasText('sign') || hasText('manifestation')) || hasQA('elevated tsh') && hasFull('low free t4') || hasQA('goiter') && hasFull('hypothyroid')) {
    if (cur !== 418 && cur !== 417) {
      return { toModule: 418, reason: 'Tests thyroid clinical syndromes, autoimmune thyroiditis, and manifestations, belongs in Medicine: Thyroid Disorders - Clinical Features' };
    }
  }

  // Cushing & Adrenal (420)
  if (hasQA('cushing syndrome') || hasQA('cushing disease') || hasQA('dexamethasone suppression test') || hasQA('urinary free cortisol') || hasQA('ectopic acth') || hasQA('addison disease') || hasQA('primary adrenal insufficiency') || hasQA('adrenal crisis') || hasQA('cosyntropin') || hasQA('pheochromocytoma') || hasQA('urinary metanephrines') || hasQA('primary aldosteronism') || hasQA('conn syndrome') || hasQA('aldosterone renin ratio') || hasQA('adrenal gland') && (hasFull('steroidogenesis') || hasFull('zona') || hasFull('androgen'))) {
    if (cur !== 420) {
      return { toModule: 420, reason: 'Tests adrenal cortical or medullary disorders (Cushing, Addison, Pheochromocytoma, Conn syndrome), belongs in Medicine: Cushing Syndrome' };
    }
  }

  // Diabetes Clinical Features (421)
  if (hasQA('hba1c') && (hasText('diagnostic criteria') || hasText('ada criteria') || hasText('screening') || hasText('prediabetes')) || hasQA('fasting blood glucose') && hasText('criteria') || hasQA('oral glucose tolerance test') && hasText('diagnosis') || hasQA('mody') || hasQA('latent autoimmune diabetes') || hasQA('type 1 vs type 2 diabetes') || hasQA('dka vs hhs') && hasText('features')) {
    if (cur !== 421 && cur !== 422) {
      return { toModule: 421, reason: 'Tests diabetes mellitus diagnostic criteria, clinical presentation, or phenotypes, belongs in Medicine: Diabetes Mellitus - Clinical Features' };
    }
  }

  // Diabetes Complications & Management (422)
  if (hasQA('metformin') || hasQA('sglt2 inhibitor') || hasQA('dapagliflozin') || hasQA('empagliflozin') || hasQA('glp-1 receptor agonist') || hasQA('semaglutide') || hasQA('liraglutide') || hasQA('sulfonylurea') || hasQA('dpp-4 inhibitor') || hasQA('insulin glargine') || hasQA('insulin lispro') || hasQA('regular insulin') || hasQA('intermediate acting insulin') || hasQA('diabetic ketoacidosis') && (hasText('management') || hasText('treatment') || hasText('fluid') || hasText('potassium') || hasText('insulin regimen')) || hasQA('diabetic retinopathy') && hasFull('laser') || hasQA('diabetic nephropathy') && (hasText('microalbuminuria') || hasText('ace inhibitor')) || hasQA('diabetic foot') || hasQA('hypoglycemia management') || hasQA('ada treatment goal') || hasQA('glycemic target') && hasFull('diabetes')) {
    if (cur !== 422) {
      return { toModule: 422, reason: 'Tests diabetes mellitus management, insulin/oral regimens, or systemic complications, belongs in Medicine: Diabetes Mellitus - Complications and Management' };
    }
  }

  // Reproductive Endocrinology (423)
  if (hasQA('polycystic ovary syndrome') && hasFull('rotterdam') || hasQA('pcos') && hasFull('hirsutism') || hasQA('kallmann syndrome') || hasQA('klinefelter syndrome') && hasFull('hypogonadism') || hasQA('turner syndrome') && hasFull('amenorrhea') || hasQA('hirsutism') && hasFull('ferriman') || hasQA('gynecomastia workup') || hasQA('hypogonadism') && (hasFull('testosterone') || hasFull('eunuchoid'))) {
    if (cur !== 423 && cur !== 558) {
      return { toModule: 423, reason: 'Tests reproductive endocrinology, hypogonadism, or PCOS diagnostic workup, belongs in Medicine: Reproductive Endocrinology' };
    }
  }

  // Parathyroid & Calcium (424)
  if (hasQA('hypercalcemia') || hasQA('hypocalcemia') || hasQA('primary hyperparathyroidism') || hasQA('hypoparathyroidism') || hasQA('pseudohypoparathyroidism') || hasQA('chvostek sign') || hasQA('trousseau sign') || hasQA('osteoporosis') && (hasText('dexa') || hasText('bisphosphonate') || hasText('t-score') || hasText('alendronate') || hasText('teriparatide')) || hasQA('cinacalcet') || hasQA('osteomalacia') && hasFull('vitamin d') || hasQA('pseudogout') || hasQA('calcium pyrophosphate') || hasQA('paget disease of bone')) {
    if (cur !== 424) {
      return { toModule: 424, reason: 'Tests disorders of calcium, parathyroid hormone, pseudogout, or metabolic bone disease, belongs in Medicine: Disorders of Parathyroid and Calcium' };
    }
  }

  // General Principles & MEN (413)
  if (hasQA('multiple endocrine neoplasia') || hasQA('men 1') || hasQA('men 2a') || hasQA('men 2b') || hasQA('carcinoid syndrome') && (hasFull('5-hiaa') || hasFull('flushing'))) {
    if (cur !== 413) {
      return { toModule: 413, reason: 'Tests multiple endocrine neoplasia (MEN) syndromes or carcinoid neuroendocrine tumors, belongs in Medicine: General Principles of Endocrinology' };
    }
  }

  // 2. GASTROENTEROLOGY & HEPATOLOGY
  // Hyperbilirubinemia & Liver Function (425)
  if (hasQA('gilbert syndrome') || hasQA('crigler najjar') || hasQA('dubin johnson') || hasQA('rotor syndrome') || hasQA('unconjugated hyperbilirubinemia') || hasQA('conjugated hyperbilirubinemia') || hasQA('alanine aminotransferase') && hasText('liver function test')) {
    if (cur !== 425 && cur !== 431) {
      return { toModule: 425, reason: 'Tests bilirubin metabolism, hereditary hyperbilirubinemias, and LFT interpretation, belongs in Medicine: Hyperbilirubinemia and Functions of Liver' };
    }
  }

  // Alcoholic Liver Disease & NAFLD/NASH (426)
  if (hasQA('alcoholic hepatitis') || hasQA('ast:alt ratio') && hasFull('alcoholic') || hasQA('maddrey discriminant') || hasQA('mallory denk') || hasQA('non alcoholic fatty liver') || hasQA('nafld') || hasQA('nash') || hasQA('hepatic steatosis') || hasQA('alcoholic liver')) {
    if (cur !== 426) {
      return { toModule: 426, reason: 'Tests alcoholic liver disease and non-alcoholic fatty liver disease (NAFLD/NASH), belongs in Medicine: Alcoholic Liver Diseases and Non-Alcoholic Fatty Liver Disease' };
    }
  }

  // Autoimmune Liver Diseases (427)
  if (hasQA('autoimmune hepatitis') || hasQA('primary biliary cholangitis') || hasQA('primary sclerosing cholangitis') || hasQA('anti-mitochondrial antibody') || hasQA('ama') && hasFull('cholangitis') || hasQA('anti-smooth muscle antibody') || hasQA('asma') && hasFull('hepatitis') || hasQA('ursodeoxycholic acid')) {
    if (cur !== 427) {
      return { toModule: 427, reason: 'Tests autoimmune liver and biliary diseases (AIH, PBC, PSC), belongs in Medicine: Autoimmune Liver Diseases' };
    }
  }

  // Acute Liver Failure & Cirrhosis Complications (428)
  if (hasQA('spontaneous bacterial peritonitis') || hasQA('sbp') && hasFull('ascitic fluid') || hasQA('hepatic encephalopathy') || hasQA('lactulose') && hasFull('encephalopathy') || hasQA('hepatorenal syndrome') || hasQA('child pugh') || hasQA('meld score') || hasQA('serum ascites albumin gradient') || hasQA('saag') || hasQA('acute liver failure') && hasFull('inr') || hasQA('cirrhosis') && (hasFull('ascites') || hasFull('decompensation'))) {
    if (cur !== 428) {
      return { toModule: 428, reason: 'Tests acute liver failure, cirrhosis decompensation, SBP, HRS, or hepatic encephalopathy, belongs in Medicine: Acute Liver Failure and Complications of Cirrhosis' };
    }
  }

  // Hemochromatosis & Wilson's Disease (429)
  if (hasQA('hemochromatosis') || hasQA('bronze diabetes') || hasQA('hfe gene') || hasQA('transferrin saturation') && hasFull('iron overload') || hasQA('wilson disease') || hasQA('kayser fleischer') || hasQA('ceruloplasmin') || hasQA('atp7b') || hasQA('penicillamine') && hasFull('copper')) {
    if (cur !== 429) {
      return { toModule: 429, reason: 'Tests inherited metabolic liver diseases (Hemochromatosis and Wilson\'s disease), belongs in Medicine: Hemochromatosis and Wilsons Disease' };
    }
  }

  // Portal Hypertension (430)
  if (hasQA('esophageal varices') || hasQA('variceal bleeding') || hasQA('octreotide') && hasFull('variceal') || hasQA('endoscopic band ligation') || hasQA('terlipressin') && hasFull('variceal') || hasQA('tips') && hasFull('portal hypertension') || hasQA('budd chiari')) {
    if (cur !== 430) {
      return { toModule: 430, reason: 'Tests portal hypertension, esophageal varices, and acute bleeding management, belongs in Medicine: Portal Hypertension' };
    }
  }

  // Evaluation of Jaundice (431)
  if (hasQA('evaluation of jaundice') || hasQA('obstructive jaundice') && hasFull('ercp') || hasQA('approach to jaundice')) {
    if (cur !== 431) {
      return { toModule: 431, reason: 'Tests systematic clinical evaluation and imaging approach to jaundice, belongs in Medicine: Evaluation of Jaundice' };
    }
  }

  // Irritable Bowel Syndrome (432)
  if (hasQA('irritable bowel syndrome') || hasQA('rome iv criteria') || hasQA('rome criteria') || hasQA('ibs-d') || hasQA('ibs-c') || hasQA('low fodmap') || hasQA('visceral hypersensitivity') && hasFull('bowel')) {
    if (cur !== 432) {
      return { toModule: 432, reason: 'Tests irritable bowel syndrome diagnosis (Rome criteria) and management, belongs in Medicine: Irritable Bowel Syndrome' };
    }
  }

  // IBD Clinical Features & Diagnosis (433)
  if (hasQA('crohn') || hasQA('ulcerative colitis') || hasQA('inflammatory bowel disease') || hasQA('fecal calprotectin') || hasQA('cobblestone mucosa') || hasQA('skip lesions') || hasQA('lead pipe colon') || hasQA('toxic megacolon') || hasQA('pseudopolyps') && hasFull('colitis') || hasQA('string sign of kantor')) {
    if (hasText('treatment') || hasText('management') || hasText('5-asa') || hasText('mesalamine') || hasText('infliximab') || hasText('colectomy indication') || hasText('surveillance')) {
      if (cur !== 434) return { toModule: 434, reason: 'Tests IBD complications and medical/biological management, belongs in Medicine: Inflammatory Bowel Disease - Complications and Treatment' };
    } else {
      if (cur !== 433) return { toModule: 433, reason: 'Tests IBD clinical features, differentiation, and diagnostic endoscopy, belongs in Medicine: Inflammatory Bowel Disease - Clinical Features and Diagnosis' };
    }
  }

  // Malabsorption Syndrome (435)
  if (hasQA('celiac disease') || hasQA('anti-tissue transglutaminase') || hasQA('anti-ttg') || hasQA('anti-endomysial') || hasQA('villous atrophy') || hasQA('d-xylose test') || hasQA('tropical sprue') || hasQA('whipple disease') || hasQA('tropheryma whipplei') || hasQA('small intestinal bacterial overgrowth') || hasQA('sibo') || hasQA('short bowel syndrome') || hasQA('ileal resection') && hasFull('malabsorption')) {
    if (cur !== 435) {
      return { toModule: 435, reason: 'Tests malabsorption syndromes (Celiac, Whipple, tropical sprue, SIBO, short bowel), belongs in Medicine: Malabsorption Syndrome' };
    }
  }

  // 3. RHEUMATOLOGY & VASCULITIS
  // Large & Medium Vessel Vasculitis (436)
  if (hasQA('giant cell arteritis') || hasQA('temporal arteritis') || hasQA('jaw claudication') || hasQA('polymyalgia rheumatica') || hasQA('takayasu arteritis') || hasQA('pulseless disease') || hasQA('polyarteritis nodosa') || hasQA('kawasaki disease') && hasFull('coronary')) {
    if (cur !== 436) {
      return { toModule: 436, reason: 'Tests large and medium vessel vasculitis (GCA, Takayasu, PAN, Kawasaki), belongs in Medicine: Large and medium vessel vasculitis' };
    }
  }

  // Small Vessel Vasculitis (437)
  if (hasQA('granulomatosis with polyangiitis') || hasQA('wegener') || hasQA('c-anca') || hasQA('pr3-anca') || hasQA('microscopic polyangiitis') || hasQA('p-anca') && hasFull('vasculitis') || hasQA('eosinophilic granulomatosis with polyangiitis') || hasQA('churg strauss') || hasQA('henoch schonlein') || hasQA('iga vasculitis') || hasQA('cryoglobulinemic vasculitis') || hasQA('goodpasture') || hasQA('anti-gbm')) {
    if (cur !== 437) {
      return { toModule: 437, reason: 'Tests ANCA-associated or immune-complex small vessel vasculitides, belongs in Medicine: Small vessel vasculitis' };
    }
  }

  // Sjogren's & Scleroderma (438)
  if (hasQA('sjogren syndrome') || hasQA('xerostomia') && hasFull('sicca') || hasQA('anti-ro') || hasQA('anti-la') || hasQA('anti-ssa') || hasQA('anti-ssb') || hasQA('schirmer test') || hasQA('systemic sclerosis') || hasQA('scleroderma') || hasQA('crest syndrome') || hasQA('anti-centromere') || hasQA('anti-scl-70') || hasQA('scleroderma renal crisis') || hasQA('tightening of the skin around her hands and mouth') || hasQA('raynaud phenomenon') && (hasFull('scleroderma') || hasFull('crest'))) {
    if (cur !== 438) {
      return { toModule: 438, reason: 'Tests Sjogren syndrome and Systemic Sclerosis (Scleroderma), belongs in Medicine: Sjogrens Syndrome and Scleroderma' };
    }
  }

  // Dermatomyositis & Polymyositis (439)
  if (hasQA('dermatomyositis') || hasQA('polymyositis') || hasQA('heliotrope rash') || hasQA('gottron papules') || hasQA('shawl sign') || hasQA('anti-jo-1') || hasQA('anti-mi-2') || hasQA('inclusion body myositis') || hasQA('creatine kinase') && hasFull('proximal muscle weakness')) {
    if (cur !== 439) {
      return { toModule: 439, reason: 'Tests inflammatory myopathies (dermatomyositis/polymyositis), belongs in Medicine: Dermatomyositis and Related Disorders' };
    }
  }

  // Antiphospholipid Syndrome (440)
  if (hasQA('antiphospholipid') || hasQA('apla') || hasQA('lupus anticoagulant') || hasQA('anticardiolipin') || hasQA('anti-beta-2-glycoprotein') || hasQA('catastrophic antiphospholipid')) {
    if (cur !== 440) {
      return { toModule: 440, reason: 'Tests antiphospholipid antibody syndrome and thrombotic/obstetric complications, belongs in Medicine: Antiphospholipid Antibody Syndrome' };
    }
  }

  // Rheumatoid Arthritis (441)
  if (hasQA('rheumatoid arthritis') || hasQA('anti-ccp') || hasQA('rheumatoid factor') && hasFull('polyarthritis') || hasQA('swan neck deformity') || hasQA('boutonniere deformity') || hasQA('morning stiffness') && hasFull('mcp') || hasQA('dmard') || hasQA('felty syndrome') || hasQA('ankylosing spondylitis') || hasQA('sacroiliitis') && hasFull('hla-b27') || hasQA('gout') && hasFull('monoarthritis') && cur !== 261) {
    if (cur !== 441) {
      return { toModule: 441, reason: 'Tests inflammatory arthritis (Rheumatoid arthritis, Spondyloarthritis, Gouty arthritis), belongs in Medicine: Rheumatoid Arthritis' };
    }
  }

  // 4. PULMONOLOGY
  // Asthma & COPD (442)
  if (hasQA('asthma') || hasQA('copd') || hasQA('chronic bronchitis') || hasQA('emphysema') || hasQA('salmeterol') && hasFull('broncho') || hasQA('tiotropium') || hasQA('fev1/fvc < 0.7') || hasQA('bronchodilator reversibility') || hasQA('gold staging') || hasQA('gina guidelines')) {
    if (cur !== 442 && cur !== 446) {
      return { toModule: 442, reason: 'Tests obstructive lung diseases (Asthma & COPD) pathophysiology and guidelines, belongs in Medicine: Asthma & COPD' };
    }
  }

  // Pneumonia (443)
  if (hasQA('community acquired pneumonia') || hasQA('curb-65') || hasQA('streptococcus pneumoniae') && hasFull('pneumonia') || hasQA('mycoplasma pneumoniae') && hasFull('pneumonia') || hasQA('legionella pneumophila') || hasQA('klebsiella pneumoniae') && hasFull('pneumonia') || hasQA('pneumocystis jirovecii') || hasQA('pneumonia') && hasFull('consolidation') || hasQA('pleural effusion') && hasFull('light\'s criteria')) {
    if (cur !== 443 && cur !== 477) {
      return { toModule: 443, reason: 'Tests community/hospital-acquired pneumonia pathogens, severity scores, and pleural effusion analysis, belongs in Medicine: Pneumonia' };
    }
  }

  // Interstitial Lung Diseases & Sarcoidosis (444)
  if (hasQA('idiopathic pulmonary fibrosis') || hasQA('usual interstitial pneumonia') || hasQA('honeycombing') && hasFull('lung') || hasQA('sarcoidosis') || hasQA('bilateral hilar lymphadenopathy') || hasQA('lofgren syndrome') || hasQA('heerfordt') || hasQA('hypersensitivity pneumonitis') || hasQA('silicosis') || hasQA('asbestosis') || hasQA('noncaseating granuloma') && hasFull('lung')) {
    if (cur !== 444) {
      return { toModule: 444, reason: 'Tests interstitial lung diseases, pulmonary fibrosis, and sarcoidosis, belongs in Medicine: Interstitial Lung Diseases and Sarcoidosis' };
    }
  }

  // Bronchiectasis & Lung Abscess (445)
  if (hasQA('bronchiectasis') || hasQA('signet ring sign') && hasFull('ct chest') || hasQA('tram track') && hasFull('bronchi') || hasQA('kartagener syndrome') || hasQA('lung abscess') || hasQA('air-fluid level') && hasFull('cavity') && hasFull('lung')) {
    if (cur !== 445) {
      return { toModule: 445, reason: 'Tests bronchiectasis and lung abscess presentation and imaging, belongs in Medicine: Bronchiectasis and Lung Abscess' };
    }
  }

  // Pulmonary Function Tests (446)
  if (hasQA('pulmonary function test') || hasQA('spirometry') || hasQA('dlco') || hasQA('total lung capacity') || hasQA('residual volume') || hasQA('flow volume loop') || hasQA('fev1/fvc ratio') && !hasFull('copd treatment')) {
    if (cur !== 446) {
      return { toModule: 446, reason: 'Tests pulmonary function testing, spirometry interpretation, and DLCO mechanics, belongs in Medicine: Pulmonary Function Tests' };
    }
  }

  // Respiratory Failure & ARDS (447)
  if (hasQA('ards') || hasQA('acute respiratory distress syndrome') || hasQA('berlin definition') || hasQA('pao2/fio2 ratio') || hasQA('low tidal volume ventilation') || hasQA('type 1 respiratory failure') || hasQA('type 2 respiratory failure') || hasQA('hypercapnic respiratory failure') || hasQA('pneumothorax') && hasFull('tension')) {
    if (cur !== 447) {
      return { toModule: 447, reason: 'Tests respiratory failure types and ARDS diagnostic criteria / lung-protective ventilation, belongs in Medicine: Respiratory Failure and ARDS' };
    }
  }

  // Neoplasms of Lung (448)
  if (hasQA('small cell lung cancer') || hasQA('non small cell lung cancer') || hasQA('adenocarcinoma of lung') || hasQA('squamous cell lung carcinoma') || hasQA('pancoast tumor') || hasQA('superior sulcus tumor') || hasQA('horner syndrome') && hasFull('apical lung') || hasQA('svc syndrome') && hasFull('bronchogenic') || hasQA('lung cancer') && hasFull('histology')) {
    if (cur !== 448) {
      return { toModule: 448, reason: 'Tests pulmonary neoplasms, histology, and paraneoplastic syndromes, belongs in Medicine: Neoplasms of the Lung' };
    }
  }

  // Sleep Apnea (449)
  if (hasQA('obstructive sleep apnea') || hasQA('sleep apnea') || hasQA('polysomnography') && hasFull('apnea') || hasQA('apnea hypopnea index') || hasQA('ahi') && hasFull('sleep') || hasQA('cpap') && hasFull('apnea') || hasQA('stop-bang')) {
    if (cur !== 449) {
      return { toModule: 449, reason: 'Tests obstructive sleep apnea evaluation, polysomnography, and CPAP management, belongs in Medicine: Sleep Apnea' };
    }
  }

  // 5. NEPHROLOGY
  // Acute Kidney Injury (450)
  if (hasQA('acute kidney injury') || hasQA('kdigo criteria') || hasQA('acute tubular necrosis') || hasQA('prerenal azotemia') || hasQA('fena') || hasQA('fractional excretion of sodium') || hasQA('muddy brown casts') || hasQA('acute interstitial nephritis') || hasQA('contrast induced nephropathy') || hasQA('rhabdomyolysis') && hasFull('myoglobin')) {
    if (cur !== 450) {
      return { toModule: 450, reason: 'Tests acute kidney injury differentiation (prerenal/ATN/AIN) and management, belongs in Medicine: Acute Kidney Injury' };
    }
  }

  // Chronic Kidney Disease (451)
  if (hasQA('chronic kidney disease') || hasQA('kdigo staging') && hasFull('gfr') || hasQA('uremic syndrome') || hasQA('uremic pericarditis') || hasQA('anemia of ckd') || hasQA('erythropoietin in ckd') || hasQA('renal osteodystrophy') || hasQA('calciphylaxis') || hasQA('chronic renal failure')) {
    if (cur !== 451) {
      return { toModule: 451, reason: 'Tests chronic kidney disease staging, uremic complications, and conservative management, belongs in Medicine: Chronic Kidney Disease' };
    }
  }

  // Renal Replacement Therapy (452)
  if (hasQA('hemodialysis') || hasQA('peritoneal dialysis') || hasQA('arteriovenous fistula') || hasQA('av fistula') || hasQA('dialysis disequilibrium') || hasQA('indications for dialysis') || hasQA('renal transplant rejection') || hasQA('calcineurin inhibitor toxicity')) {
    if (cur !== 452) {
      return { toModule: 452, reason: 'Tests renal replacement therapy (dialysis access, complications, transplantation), belongs in Medicine: Renal Replacement Therapy' };
    }
  }

  // Cysts & Inherited Kidney Disorders (453)
  if (hasQA('autosomal dominant polycystic kidney') || hasQA('adpkd') || hasQA('pkd1') || hasQA('arpkd') || hasQA('medullary cystic kidney') || hasQA('medullary sponge kidney') || hasQA('alport syndrome')) {
    if (cur !== 453) {
      return { toModule: 453, reason: 'Tests cystic and inherited genetic disorders of the kidney, belongs in Medicine: Cysts and Inherited Disorders of the Kidney' };
    }
  }

  // Renal Tubular Diseases (454)
  if (hasQA('renal tubular acidosis') || hasQA('rta type 1') || hasQA('rta type 2') || hasQA('rta type 4') || hasQA('fanconi syndrome') || hasQA('bartter syndrome') || hasQA('gitelman syndrome') || hasQA('liddle syndrome') || hasQA('apparent mineralocorticoid excess')) {
    if (cur !== 454) {
      return { toModule: 454, reason: 'Tests renal tubular acidosis and tubulopathies (Bartter, Gitelman, Liddle), belongs in Medicine: Renal Tubular Diseases of Kidney' };
    }
  }

  // 6. CARDIOLOGY
  // Cardiovascular Diagnosis (455)
  if (hasQA('jugular venous pulse') || hasQA('jvp waveform') || hasQA('cannon a wave') || hasQA('heart sound') && (hasFull('s3') || hasFull('s4') || hasFull('opening snap')) || hasQA('murmur grading') || hasQA('austin flint murmur') || hasQA('graham steell murmur')) {
    if (cur !== 455 && cur !== 458) {
      return { toModule: 455, reason: 'Tests cardiovascular physical examination, JVP waveforms, and heart sounds, belongs in Medicine: Diagnosis of cardiovascular disorders' };
    }
  }

  // Supraventricular Arrhythmias (456)
  if (hasQA('atrial fibrillation') || hasQA('atrial flutter') || hasQA('avnrt') || hasQA('avrt') || hasQA('wolff parkinson white') || hasQA('wpw syndrome') || hasQA('cha2ds2-vasc') || hasQA('supraventricular tachycardia') || hasQA('svt')) {
    if (cur !== 456) {
      return { toModule: 456, reason: 'Tests supraventricular arrhythmias, AFib anticoagulation, and pre-excitation (WPW), belongs in Medicine: Supraventricular Arrhythmias' };
    }
  }

  // Ventricular Arrhythmias & Conduction (457)
  if (hasQA('ventricular tachycardia') || hasQA('ventricular fibrillation') || hasQA('torsades de pointes') || hasQA('long qt syndrome') || hasQA('brugada syndrome') || hasQA('complete heart block') || hasQA('third degree av block') || hasQA('mobitz type') || hasQA('wenckebach') || hasQA('pacemaker indication')) {
    if (cur !== 457) {
      return { toModule: 457, reason: 'Tests ventricular arrhythmias, channelopathies (Long QT, Brugada), and conduction blocks, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks' };
    }
  }

  // Valvular Heart Diseases & Endocarditis (458)
  if (hasQA('mitral stenosis') || hasQA('mitral regurgitation') || hasQA('aortic stenosis') || hasQA('aortic regurgitation') || hasQA('infective endocarditis') || hasQA('duke criteria') || hasQA('rheumatic fever') || hasQA('jones criteria') || hasQA('prosthetic valve') || hasQA('water hammer pulse')) {
    if (cur !== 458) {
      return { toModule: 458, reason: 'Tests valvular heart disease, infective endocarditis, and rheumatic fever, belongs in Medicine: Vascular Heart Diseases' };
    }
  }

  // Ischemic Heart Disease Diagnosis (459)
  if (hasQA('stemi') || hasQA('npremi') || hasQA('nstem') || hasQA('unstable angina') || hasQA('stable angina') || hasQA('cardiac troponin') || hasQA('st elevation myocardial infarction') || hasQA('ecg in myocardial infarction') || hasQA('reciprocal changes') && hasFull('infarction')) {
    if (cur !== 459 && cur !== 460) {
      return { toModule: 459, reason: 'Tests presentation, biomarkers, and ECG diagnosis of ischemic heart disease, belongs in Medicine: Ischemic Heart Disease - Presentation and Diagnosis' };
    }
  }

  // Ischemic Heart Disease Management & Complications (460)
  if (hasQA('primary pci') || hasQA('percutaneous coronary intervention') || hasQA('thrombolysis in mi') || hasQA('post-mi complication') || hasQA('ventricular septal rupture') || hasQA('papillary muscle rupture') || hasQA('dressler syndrome') || hasQA('dual antiplatelet therapy') && hasFull('stent')) {
    if (cur !== 460) {
      return { toModule: 460, reason: 'Tests ischemic heart disease reperfusion management and post-infarction complications, belongs in Medicine: Ischemic Heart Disease - Complications and Management' };
    }
  }

  // Cardiomyopathy & Myocarditis (461)
  if (hasQA('dilated cardiomyopathy') || hasQA('hypertrophic cardiomyopathy') || hasQA('hocm') || hasQA('systolic anterior motion') || hasQA('restrictive cardiomyopathy') || hasQA('myocarditis') || hasQA('takotsubo') || hasQA('cardiac amyloidosis') || hasQA('pericarditis') && (hasFull('ecg') || hasFull('friction rub')) || hasQA('cardiac tamponade') || hasQA('pulsus paradoxus') || hasQA('kussmaul sign') && hasFull('pericard')) {
    if (cur !== 461) {
      return { toModule: 461, reason: 'Tests cardiomyopathies (DCM, HOCM, RCM), pericarditis, tamponade, and myocarditis, belongs in Medicine: Cardiomyopathy and Myocarditis' };
    }
  }

  // Heart Failure (462)
  if (hasQA('congestive heart failure') || hasQA('heart failure') || hasQA('hfref') || hasQA('hfpef') || hasQA('nyha class') || hasQA('bnp') || hasQA('nt-probnp') || hasQA('guideline directed medical therapy') || hasQA('arni') || hasQA('sacubitril/valsartan') || hasQA('spironolactone in heart failure') || hasQA('acute pulmonary edema') && hasFull('cardiac')) {
    if (cur !== 462) {
      return { toModule: 462, reason: 'Tests heart failure pathophysiology, classification, and guideline-directed medical therapy, belongs in Medicine: Heart Failure' };
    }
  }

  // DVT & Pulmonary Embolism (463)
  if (hasQA('deep vein thrombosis') || hasQA('dvt') || hasQA('pulmonary embolism') || hasQA('wells score') || hasQA('ct pulmonary angiography') || hasQA('ctpa') || hasQA('s1q3t3') || hasQA('d-dimer in pe')) {
    if (cur !== 463) {
      return { toModule: 463, reason: 'Tests deep vein thrombosis and pulmonary embolism diagnosis and anticoagulation, belongs in Medicine: DVT and Pulmonary Embolism' };
    }
  }

  // 7. NEUROLOGY
  // Dementia, Death & Coma (464)
  if (hasQA('alzheimer disease') || hasQA('vascular dementia') || hasQA('lewy body dementia') || hasQA('frontotemporal dementia') || hasQA('normal pressure hydrocephalus') || hasQA('glasgow coma scale') || hasQA('gcs') || hasQA('brain death criteria') || hasQA('coma examination') || hasQA('kluver bucy') || hasQA('prosopagnosia') || hasQA('unable to consolidate long term memory')) {
    if (cur !== 464) {
      return { toModule: 464, reason: 'Tests dementia subtypes, neurocognitive decline, memory circuits, and coma assessment, belongs in Medicine: Cerebral Neurology: Dementia, Death and Coma' };
    }
  }

  // Seizure & Epilepsy (465)
  if (hasQA('epilepsy') || hasQA('status epilepticus') || hasQA('absence seizure') || hasQA('3 hz spike') || hasQA('tonic-clonic seizure') || hasQA('antiepileptic drug') || hasQA('levetiracetam') && hasFull('seizure') || hasQA('sodium valproate') && hasFull('epilepsy') || hasQA('convulsions') && hasFull('seizure') || hasQA('witnessed fit')) {
    if (cur !== 465) {
      return { toModule: 465, reason: 'Tests seizure classifications, EEG signatures, and epilepsy/status epilepticus management, belongs in Medicine: Seizure and Epilepsy' };
    }
  }

  // Extrapyramidal & Movement Disorders (466)
  if (hasQA('parkinson disease') || hasQA('resting tremor') && hasFull('rigidity') || hasQA('levodopa') || hasQA('carbidopa') || hasQA('huntington disease') || hasQA('chorea') || hasQA('essential tremor') || hasQA('progressive supranuclear palsy') || hasQA('multiple system atrophy') || hasQA('dystonia') || hasQA('hemiballismus') || hasQA('involuntary movements') && (hasFull('tremor') || hasFull('jerky') || hasFull('writhing'))) {
    if (cur !== 466) {
      return { toModule: 466, reason: 'Tests movement disorders, parkinsonism, chorea, hemiballismus, and tremor, belongs in Medicine: Extrapyramidal Syndromes and Movement Disorders' };
    }
  }

  // Neuromuscular & ALS (467)
  if (hasQA('myasthenia gravis') || hasQA('acetylcholine receptor antibody') || hasQA('anti-achr') || hasQA('tensilon test') || hasQA('edrophonium') || hasQA('ice pack test') || hasQA('thymoma') && hasFull('myasthenia') || hasQA('lambert eaton') || hasQA('amyotrophic lateral sclerosis') || hasQA('als') && hasFull('motor neuron') || hasQA('riluzole') || hasQA('botulism') && hasFull('flaccid paralysis')) {
    if (cur !== 467) {
      return { toModule: 467, reason: 'Tests neuromuscular junction disorders (Myasthenia gravis, Lambert-Eaton, Botulism) and ALS, belongs in Medicine: Myasthenia Gravis and Other Neuromuscular Disorders' };
    }
  }

  // Peripheral Neuropathies & GBS (468)
  if (hasQA('guillain barre syndrome') || hasQA('gbs') || hasQA('albuminocytological dissociation') || hasQA('acute inflammatory demyelinating polyneuropathy') || hasQA('campylobacter jejuni') && hasFull('weakness') || hasQA('charcot marie tooth') || hasQA('diabetic peripheral neuropathy') || hasQA('mononeuritis multiplex') || hasQA('carpal tunnel syndrome') && hasFull('nerve') || hasQA('saturday night palsy') || hasQA('radial nerve palsy') || hasQA('peroneal nerve palsy') || hasQA('absent ankle jerks and gait disturbance')) {
    if (cur !== 468) {
      return { toModule: 468, reason: 'Tests peripheral neuropathies, Guillain-Barré syndrome, and entrapment syndromes, belongs in Medicine: Guillain Barre Syndrome and Other Peripheral Neuropathies' };
    }
  }

  // Multiple Sclerosis & Demyelinating (469)
  if (hasQA('multiple sclerosis') || hasQA('optic neuritis') && hasFull('ms') || hasQA('oligoclonal bands') || hasQA('dawson fingers') || hasQA('internuclear ophthalmoplegia') || hasQA('lhermitte sign') || hasQA('uhthoff phenomenon') || hasQA('neuromyelitis optica') || hasQA('anti-aqp4')) {
    if (cur !== 469) {
      return { toModule: 469, reason: 'Tests central demyelinating diseases (Multiple Sclerosis, NMO) and diagnostic markers, belongs in Medicine: Multiple Sclerosis and Other Demyelinating Disorders' };
    }
  }

  // Headache (470)
  if (hasQA('migraine') || hasQA('tension type headache') || hasQA('cluster headache') || hasQA('trigeminal neuralgia') || hasQA('idiopathic intracranial hypertension') || hasQA('pseudotumor cerebri') || hasQA('triptans') || hasQA('cgrp')) {
    if (cur !== 470) {
      return { toModule: 470, reason: 'Tests primary headache syndromes (Migraine, Cluster, Tension, Trigeminal neuralgia, IIH), belongs in Medicine: Headache' };
    }
  }

  // Spinal Cord Disorders (471)
  if (hasQA('spinal cord compression') || hasQA('transverse myelitis') || hasQA('brown sequard') || hasQA('subacute combined degeneration') || hasQA('anterior spinal artery syndrome') || hasQA('syringomyelia') || hasQA('cauda equina syndrome') || hasQA('conus medullaris') || hasQA('penetrating spinal cord injury')) {
    if (cur !== 471) {
      return { toModule: 471, reason: 'Tests myelopathies, spinal cord transection syndromes, and cord compression, belongs in Medicine: Spinal Cord Disorders' };
    }
  }

  // Cranial Nerve Disorders (472)
  if (hasQA('bell palsy') || hasQA('facial nerve palsy') || hasQA('facial palsy') && hasFull('infectious') || hasQA('ramsay hunt') || hasQA('cranial nerve examination') || hasQA('third nerve palsy') || hasQA('abducens nerve palsy') || hasQA('sixth nerve palsy') || hasQA('trochlear nerve') || hasQA('acoustic neuroma') || hasQA('vestibular schwannoma')) {
    if (cur !== 472) {
      return { toModule: 472, reason: 'Tests isolated cranial neuropathies (Bell\'s palsy, CN III/VI/VIII palsies), belongs in Medicine: Cranial Nerve Disorders' };
    }
  }

  // Cerebrovascular Disease (473)
  if (hasQA('ischemic stroke') || hasQA('acute ischemic stroke') || hasQA('tissue plasminogen activator') || hasQA('thrombectomy') && hasFull('stroke') || hasQA('middle cerebral artery infarction') || hasQA('lacunar stroke') || hasQA('subarachnoid hemorrhage') || hasQA('berry aneurysm') || hasQA('intracerebral hemorrhage') || hasQA('stroke') && (hasFull('hemiparesis') || hasFull('aphasia') || hasFull('tpa'))) {
    if (cur !== 473) {
      return { toModule: 473, reason: 'Tests cerebrovascular accidents (ischemic stroke, ICH, SAH) and acute revascularization, belongs in Medicine: Cerebrovascular Disease' };
    }
  }

  // Meningitis & Encephalitis (474)
  if (hasQA('bacterial meningitis') || hasQA('csf analysis in meningitis') || hasQA('neisseria meningitidis') && hasFull('meningitis') || hasQA('hsv encephalitis') || hasQA('temporal lobe encephalitis') || hasQA('cryptococcal meningitis') || hasQA('kernig sign') || hasQA('brudzinski sign') || hasQA('viral meningitis')) {
    if (cur !== 474) {
      return { toModule: 474, reason: 'Tests central nervous system infections (meningitis, encephalitis) and CSF interpretation, belongs in Medicine: Meningitis Encephalitis' };
    }
  }

  // 8. HEMATOLOGY
  // Plasma Cell Disorders (475)
  if (hasQA('multiple myeloma') || hasQA('crab criteria') || hasQA('bence jones protein') || hasQA('m spike') || hasQA('mgus') || hasQA('monoclonal gammopathy of undetermined') || hasQA('waldenstrom macroglobulinemia') || hasQA('al amyloidosis')) {
    if (cur !== 475) {
      return { toModule: 475, reason: 'Tests plasma cell disorders (Multiple Myeloma, MGUS, Waldenstrom), belongs in Medicine: Plasma Cell Disorders' };
    }
  }

  // Chronic Myeloid Leukemia & Lymphoid Leukemias (476)
  if (hasQA('chronic myeloid leukemia') || hasQA('cml') || hasQA('philadelphia chromosome') || hasQA('bcr-abl') || hasQA('imatinib') || hasQA('chronic lymphocytic leukemia') || hasQA('cll') || hasQA('smudge cells') || hasQA('hairy cell leukemia')) {
    if (cur !== 476) {
      return { toModule: 476, reason: 'Tests chronic leukemias (CML, CLL, HCL) clinical staging and targeted kinase inhibitors, belongs in Medicine: Chronic Myeloid Leukemia and Lymphoid Leukemias' };
    }
  }

  // 9. INFECTIOUS DISEASES / HIV
  if (hasQA('hiv') || hasQA('haart') || hasQA('antiretroviral therapy') || hasQA('cd4 count') || hasQA('opportunistic infection in hiv') || hasQA('who clinical staging of hiv') || hasQA('hiv screening')) {
    if (hasText('investigation') || hasText('monitoring') || hasText('cd4 monitoring') || hasText('viral load') || hasText('western blot') || hasText('elisa test') || hasText('testing interval')) {
      if (cur !== 478) return { toModule: 478, reason: 'Tests laboratory evaluation, monitoring, and diagnostic assays for HIV/AIDS, belongs in Medicine: HIV / AIDS - Investigations' };
    } else {
      if (cur !== 477) return { toModule: 477, reason: 'Tests HIV/AIDS transmission, epidemiology, staging, and opportunistic infections, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
    }
  }

  // 10. ACID-BASE DISORDERS (412)
  if (hasQA('anion gap') || hasQA('metabolic acidosis') || hasQA('metabolic alkalosis') || hasQA('respiratory acidosis') || hasQA('respiratory alkalosis') || hasQA('winter formula') || hasQA('abg interpretation') || hasQA('base excess') || hasQA('sodium bicarbonate tablets') && hasFull('meq')) {
    if (cur !== 412) {
      return { toModule: 412, reason: 'Tests arterial blood gas (ABG) interpretation and acid-base disorder calculations, belongs in Medicine: Acid-Base Disorders' };
    }
  }

  return null;
}

module.exports = { audit, clean };

if (require.main === module) {
  console.log('Testing auditor on all questions...');
  const moves = [];
  questions.forEach(q => {
    const result = audit(q);
    if (result && result.toModule !== q.currentModule) {
      moves.push({
        id: q.id,
        fromModule: q.currentModule,
        toModule: result.toModule,
        reason: result.reason
      });
    }
  });

  console.log(`Audited ${questions.length} questions.`);
  console.log(`Flagged ${moves.length} moves.`);

  process.exit(0);
}
