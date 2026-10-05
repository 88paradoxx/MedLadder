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

console.log(`Loaded ${questions.length} questions.`);

// Audit Engine
function auditQuestion(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const text = q.text.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  const hasQA = (t) => qa.includes(t);
  const hasFull = (t) => full.includes(t);
  const hasText = (t) => text.includes(t);

  // =========================================================================
  // 1. OUTSIDE SUBJECT AUDIT
  // =========================================================================

  // OB & GYN
  if (hasQA('amniotic fluid') || hasQA('gestational age') || hasQA('cervical dilation') || hasQA('uterine contraction') || hasQA('partograph') || hasQA('breech presentation') || hasQA('fetal distress') || hasQA('labour') || hasQA('labor') || hasQA('cardiotocography') || hasQA('bishop score') || hasQA('crown rump length') || hasQA('first trimester scan') || hasQA('antenatal checkup')) {
    if (hasQA('labor') || hasQA('labour') || hasQA('partograph') || hasQA('delivery') || hasQA('cervical dilatation') || hasQA('oxytocin') || hasQA('head engagement')) {
      return { toModule: 540, reason: 'Tests normal or abnormal labor mechanisms and monitoring, belongs in OB & G: Normal Labour / Abnormal Labour' };
    }
  }
  if (hasQA('preeclampsia') || hasQA('eclampsia') || hasQA('hellp syndrome') || hasQA('magnesium sulphate in eclampsia') || hasQA('magnesium sulfate') && hasFull('eclampsia')) {
    return { toModule: 553, reason: 'Tests hypertensive disorders of pregnancy (preeclampsia/eclampsia/HELLP), belongs in OB & G: Hypertensive Disorders in Pregnancy' };
  }
  if (hasQA('hydatidiform mole') || hasQA('choriocarcinoma') || hasQA('snowstorm appearance') && hasFull('uterus') || hasQA('molar pregnancy') || hasQA('gestational trophoblastic')) {
    return { toModule: 551, reason: 'Tests gestational trophoblastic disease (molar pregnancy / choriocarcinoma), belongs in OB & G: Gestational Trophoblastic Diseases' };
  }
  if (hasQA('postpartum hemorrhage') || hasQA('postpartum haemorrhage') || hasQA('uterine atony') || hasQA('methergin') || hasQA('methylergometrine') || hasQA('placenta accreta') || hasQA('uterine rupture')) {
    return { toModule: 549, reason: 'Tests postpartum hemorrhage, uterine atony or rupture management, belongs in OB & G: Postpartum Haemorrhage' };
  }
  if (hasQA('ectopic pregnancy') || hasQA('tubal pregnancy') || hasQA('salpingostomy') || hasQA('ruptured ectopic')) {
    return { toModule: 546, reason: 'Tests ectopic pregnancy diagnosis and management, belongs in OB & G: Ectopic Pregnancy' };
  }
  if (hasQA('placenta previa') || hasQA('abruptio placentae') || hasQA('accidental hemorrhage') || hasQA('retroplacental clot')) {
    return { toModule: 548, reason: 'Tests antepartum hemorrhage (placenta previa/abruption), belongs in OB & G: Antepartum Hemorrhage' };
  }
  if (hasQA('fibroid') || hasQA('leiomyoma') && hasFull('uterus') || hasQA('submucosal fibroid') || hasQA('myomectomy')) {
    return { toModule: 560, reason: 'Tests uterine fibroid / leiomyoma, belongs in OB & G: Fibroid' };
  }
  if (hasQA('endometriosis') || hasQA('chocolate cyst') || hasQA('adenomyosis') || hasQA('powder burn lesions')) {
    return { toModule: 561, reason: 'Tests endometriosis / adenomyosis, belongs in OB & G: Endometriosis and Adenomyosis' };
  }
  if (hasQA('cervical intraepithelial') || hasQA('cin 1') || hasQA('cin 2') || hasQA('cin 3') || hasQA('carcinoma cervix') || hasQA('cervical screening') && hasFull('pap smear') || hasQA('pap smear') && hasFull('cervix')) {
    return { toModule: 572, reason: 'Tests cervical neoplasia / carcinoma cervix screening and staging, belongs in OB & G: Carcinoma Cervix' };
  }
  if (hasQA('copper t') || hasQA('iud') || hasQA('iucd') || hasQA('mirena') || hasQA('levonorgestrel intrauterine') || hasQA('barrier method') || hasQA('condom') || hasQA('contraceptive failure') || hasQA('pearl index')) {
    return { toModule: 563, reason: 'Tests contraception mechanisms and failure rates, belongs in OB & G: Contraception and Sterilization' };
  }
  if (hasQA('bacterial vaginosis') || hasQA('clue cells') || hasQA('trichomonas vaginalis') && hasFull('whiff test') || hasQA('vulvovaginal candidiasis') && hasFull('cottage cheese')) {
    return { toModule: 564, reason: 'Tests vaginal infections and discharge examination, belongs in OB & G: Vaginal Infections' };
  }

  // PEDIATRICS
  if (hasQA('apgar score') || hasQA('neonatal resuscitation') || hasQA('positive pressure ventilation in newborn') || hasQA('chest compressions in neonate')) {
    return { toModule: 577, reason: 'Tests Apgar score and neonatal resuscitation algorithms, belongs in Pediatrics: Apgar score and Neonatal Resuscitation' };
  }
  if (hasQA('respiratory distress syndrome') && hasFull('surfactant') && hasFull('preterm') || hasQA('hyaline membrane disease') || hasQA('necrotizing enterocolitis') || hasQA('meconium aspiration syndrome')) {
    return { toModule: 576, reason: 'Tests neonatal respiratory and gastrointestinal diseases in special care unit, belongs in Pediatrics: Diseases in Neonates requiring Special Care' };
  }
  if (hasQA('developmental milestone') || hasQA('pincer grasp') || hasQA('social smile') || hasQA('neck holding') || hasQA('stranger anxiety') || hasQA('walks without support') || hasQA('speaks 2 word sentences') || hasQA('trike') || hasQA('copies circle') || hasQA('copies cross')) {
    return { toModule: 578, reason: 'Tests normal pediatric developmental milestones, belongs in Pediatrics: Developmental Milestones' };
  }
  if (hasQA('kwashiorkor') || hasQA('marasmus') || hasQA('severe acute malnutrition') || hasQA('edema in malnutrition') || hasQA('flag sign of hair')) {
    return { toModule: 581, reason: 'Tests protein-energy malnutrition, belongs in Pediatrics: Protein Energy Malnutrition' };
  }
  if (hasQA('tetralogy of fallot') || hasQA('boot shaped heart') || hasQA('transposition of great arteries') || hasQA('egg on string') || hasQA('tricuspid atresia') || hasQA('total anomalous pulmonary venous')) {
    return { toModule: 598, reason: 'Tests cyanotic congenital heart disease, belongs in Pediatrics: Cyanotic Congenital Heart Diseases' };
  }
  if (hasQA('ventricular septal defect') && hasFull('infant') || hasQA('atrial septal defect') && hasFull('child') || hasQA('patent ductus arteriosus') && hasFull('premature') || hasQA('indomethacin for pda') || hasQA('coarctation of aorta') && hasFull('child')) {
    if (cur !== 458 && cur !== 462) {
      return { toModule: 597, reason: 'Tests acyanotic congenital heart disease, belongs in Pediatrics: Acyanotic Congenital Heart Diseases' };
    }
  }
  if (hasQA('mumps') || hasQA('measles') || hasQA('koplik spots') || hasQA('rubella') || hasQA('parotitis in child') || hasQA('sspe') || hasQA('subacute sclerosing panencephalitis')) {
    return { toModule: 590, reason: 'Tests pediatric viral exanthems (measles, mumps, rubella), belongs in Pediatrics: Measles, Mumps, Rubella and Other Viral Infections' };
  }
  if (hasQA('congenital adrenal hyperplasia') || hasQA('21-hydroxylase deficiency') || hasQA('17-hydroxyprogesterone') || hasQA('ambiguous genitalia in newborn') || hasQA('salt wasting crisis')) {
    return { toModule: 601, reason: 'Tests congenital adrenal hyperplasia and steroid 21-hydroxylase deficiency, belongs in Pediatrics: Congenital Adrenal Hyperplasia and Related Disorders' };
  }
  if (hasQA('down syndrome') || hasQA('trisomy 21') || hasQA('edwards syndrome') || hasQA('trisomy 18') || hasQA('patau syndrome') || hasQA('trisomy 13') || hasQA('cri du chat')) {
    return { toModule: 585, reason: 'Tests pediatric chromosomal disorders and genetics, belongs in Pediatrics: Chromosomal Disorders' };
  }
  if (hasQA('intussusception') && hasFull('target sign') && hasFull('child') || hasQA('hypertrophic pyloric stenosis') && hasFull('olive') || hasQA('hirschsprung')) {
    return { toModule: 591, reason: 'Tests pediatric surgical gastrointestinal conditions, belongs in Pediatrics: Surgical GI Disorders' };
  }

  // SURGERY
  if (hasQA('inguinal hernia') || hasQA('femoral hernia') || hasQA('direct hernia') || hasQA('indirect hernia') || hasQA('hesselbach') || hasQA('hernioplasty') || hasQA('herniorrhaphy') || hasQA('strangulated hernia')) {
    return { toModule: 504, reason: 'Tests abdominal wall hernias and anatomy of the inguinal canal, belongs in Surgery: Hernia' };
  }
  if (hasQA('acute appendicitis') || hasQA('mcburney') || hasQA('appendectomy') || hasQA('appendicitis') && hasFull('right iliac fossa pain') && !hasFull('crohn')) {
    return { toModule: 500, reason: 'Tests acute appendicitis diagnosis and surgical management, belongs in Surgery: Appendix' };
  }
  if (hasQA('cholelithiasis') || hasQA('cholecystitis') || hasQA('murphy\'s sign') || hasQA('cholecystectomy') || hasQA('gallstone ileus') || hasQA('biliary colic') && !hasFull('cirrhosis')) {
    return { toModule: 508, reason: 'Tests gallbladder pathology (calculi, cholecystitis, cholecystectomy), belongs in Surgery: Gall Bladder' };
  }
  if (hasQA('choledochal cyst') || hasQA('cholangitis') && hasFull('charcot\'s triad') || hasQA('common bile duct stone') || hasQA('choledocholithiasis')) {
    return { toModule: 509, reason: 'Tests bile duct conditions and surgical management, belongs in Surgery: Bile Duct' };
  }
  if (hasQA('acute pancreatitis') && (hasQA('ranson') || hasQA('balthazar') || hasQA('ctsi') || hasQA('pancreatic necrosis') || hasQA('pseudocyst of pancreas') || hasQA('necrosectomy'))) {
    return { toModule: 512, reason: 'Tests acute pancreatitis complications, severity scoring, and surgical management, belongs in Surgery: Congenital Anomalies and Acute Pancreatitis' };
  }
  if (hasQA('pancreatic adenocarcinoma') || hasQA('whipple procedure') || hasQA('pancreaticoduodenectomy') || hasQA('courvoisier law') && hasFull('pancreas')) {
    return { toModule: 514, reason: 'Tests carcinoma of the pancreas and pancreatic resections, belongs in Surgery: Carcinoma Pancreas' };
  }
  if (hasQA('renal calculi') || hasQA('nephrolithiasis') || hasQA('kidney stone') || hasQA('eswl') || hasQA('pcnl') || hasQA('ureteroscopy') || hasQA('staghorn calculus') || hasQA('calcium oxalate stone') && hasFull('colic')) {
    return { toModule: 515, reason: 'Tests urinary calculi diagnosis, composition, and surgical/interventional management, belongs in Surgery: Congenital Diseases of Kidney and Urinary Calculi' };
  }
  if (hasQA('renal cell carcinoma') || hasQA('clear cell carcinoma') && hasFull('kidney') || hasQA('von hippel lindau') && hasFull('rcc') || hasQA('radical nephrectomy')) {
    return { toModule: 516, reason: 'Tests renal cell carcinoma and surgical management, belongs in Surgery: Infections and Tumors of Kidney' };
  }
  if (hasQA('benign prostatic hyperplasia') || hasQA('bph') || hasQA('turp') || hasQA('transurethral resection') || hasQA('prostate cancer') || hasQA('gleason score') && hasFull('prostate')) {
    return { toModule: 518, reason: 'Tests prostate disease (BPH and prostate cancer) surgical management, belongs in Surgery: Prostate' };
  }
  if (hasQA('burns') && (hasQA('rule of nines') || hasQA('parkland formula') || hasQA('escharotomy') || hasQA('curling ulcer') || hasQA('fluid resuscitation in burns'))) {
    return { toModule: 523, reason: 'Tests burn wound evaluation, fluid formulas, and surgical management, belongs in Surgery: Burns' };
  }
  if (hasQA('epidural hematoma') || hasQA('extradural hematoma') || hasQA('middle meningeal artery') || hasQA('subdural hematoma') || hasQA('lucid interval') || hasQA('crescent shaped hematoma') || hasQA('biconvex hematoma')) {
    return { toModule: 521, reason: 'Tests acute intracranial traumatic hematomas and neurosurgical management, belongs in Surgery: Head Injury' };
  }
  if (hasQA('splenic rupture') || hasQA('kehr\'s sign') || hasQA('splenectomy') && hasFull('trauma') || hasQA('overwhelming post splenectomy infection') && hasFull('surgery')) {
    return { toModule: 510, reason: 'Tests splenic trauma, rupture, and surgical indications, belongs in Surgery: Spleen' };
  }
  if (hasQA('carcinoma stomach') || hasQA('gastric cancer') || hasQA('linitis plastica') || hasQA('virchow node') && hasFull('gastric') || hasQA('sister mary joseph nodule') && hasFull('stomach') || hasQA('krukenberg tumor') && hasFull('stomach')) {
    return { toModule: 496, reason: 'Tests gastric adenocarcinoma presentation, spread, and surgical oncology, belongs in Surgery: Carcinoma Stomach' };
  }
  if (hasQA('colorectal carcinoma') || hasQA('colon cancer') || hasQA('familial adenomatous polyposis') || hasQA('apple core sign') && hasFull('colon') || hasQA('adenomatous polyps') && hasFull('colon')) {
    return { toModule: 501, reason: 'Tests colorectal polyps, malignant transformation, and surgical management, belongs in Surgery: Polyps and Colorectal Carcinoma' };
  }
  if (hasQA('hemorrhoids') || hasQA('piles') || hasQA('anal fissure') || hasQA('fistula-in-ano') || hasQA('goodsall rule') || hasQA('perianal abscess') && !hasFull('crohn')) {
    return { toModule: 503, reason: 'Tests anorectal disorders (hemorrhoids, fissure, fistula), belongs in Surgery: Anus and Anal Canal' };
  }
  if (hasQA('fibroadenoma') || hasQA('benign breast') || hasQA('carcinoma breast') || hasQA('sentinel lymph node') && hasFull('breast') || hasQA('mastectomy') || hasQA('triple assessment') && hasFull('breast')) {
    return { toModule: 487, reason: 'Tests breast pathology, carcinoma breast diagnosis, and surgical management, belongs in Surgery: Carcinoma Breast' };
  }
  if (hasQA('wound healing') || hasQA('keloid') || hasQA('hypertrophic scar') || hasQA('collagen synthesis') && hasFull('scar') || hasQA('primary intention') || hasQA('secondary intention')) {
    return { toModule: 524, reason: 'Tests surgical wound healing, scarring, and complications, belongs in Surgery: Wound Healing, Tissue Repair and Scar' };
  }

  // PSYCHIATRY
  if (hasQA('schizophrenia') || hasQA('auditory hallucination') && hasFull('schizophrenia') || hasQA('delusion of persecution') || hasQA('kurt schneider') || hasQA('first rank symptoms') || hasQA('thought insertion') || hasQA('thought withdrawal') || hasQA('thought broadcasting')) {
    return { toModule: 692, reason: 'Tests core symptoms and diagnostic criteria of schizophrenia, belongs in Psychiatry: Schizophrenia' };
  }
  if (hasQA('bipolar disorder') || hasQA('bipolar affective') || hasQA('mania') && (hasFull('grandiosity') || hasFull('flight of ideas') || hasFull('decreased need for sleep'))) {
    return { toModule: 698, reason: 'Tests bipolar affective disorder and mania features, belongs in Psychiatry: Bipolar and Related Disorders' };
  }
  if (hasQA('major depressive disorder') || hasQA('dysthymia') || hasQA('melancholia') || hasQA('anhedonia') && hasFull('depression') || hasQA('beck depression')) {
    return { toModule: 697, reason: 'Tests unipolar depressive disorders and diagnostic features, belongs in Psychiatry: Depressive Disorders' };
  }
  if (hasQA('panic disorder') || hasQA('agoraphobia') || hasQA('generalized anxiety disorder') || hasQA('social anxiety') || hasQA('social phobia')) {
    return { toModule: 701, reason: 'Tests primary anxiety and panic disorders, belongs in Psychiatry: Anxiety Disorders' };
  }
  if (hasQA('obsessive compulsive disorder') || hasQA('ocd') && hasFull('compulsion') || hasQA('exposure and response prevention') || hasQA('trichotillomania') || hasQA('body dysmorphic disorder')) {
    return { toModule: 702, reason: 'Tests obsessive-compulsive and related disorders, belongs in Psychiatry: Obsessive-Compulsive and Related Disorders' };
  }
  if (hasQA('post traumatic stress disorder') || hasQA('ptsd') || hasQA('flashbacks') && hasFull('trauma') || hasQA('acute stress disorder')) {
    return { toModule: 703, reason: 'Tests trauma and stressor-related disorders (PTSD), belongs in Psychiatry: Trauma and Stress-Related Disorders' };
  }
  if (hasQA('borderline personality') || hasQA('antisocial personality') || hasQA('histrionic personality') || hasQA('narcissistic personality') || hasQA('schizoid') && hasFull('personality') || hasQA('splitting') && hasFull('personality')) {
    return { toModule: 704, reason: 'Tests personality disorder clusters and defense mechanisms, belongs in Psychiatry: Personality Disorders' };
  }
  if (hasQA('conversion disorder') || hasQA('functional neurological symptom') || hasQA('la belle indifference') || hasQA('hypochondriasis') || hasQA('illness anxiety disorder') || hasQA('somatization disorder')) {
    return { toModule: 705, reason: 'Tests somatic symptom and related/conversion disorders, belongs in Psychiatry: Somatoform Disorders' };
  }
  if (hasQA('anorexia nervosa') || hasQA('bulimia nervosa') || hasQA('binge eating disorder') || hasQA('russell sign') && hasFull('purging')) {
    return { toModule: 709, reason: 'Tests eating disorders (anorexia/bulimia), belongs in Psychiatry: Eating Disorders' };
  }
  if (hasQA('alcohol dependence') || hasQA('cage questionnaire') || hasQA('delirium tremens') && hasFull('psychiatry') || hasQA('disulfiram') && hasFull('dependence') || hasQA('acamprosate') || hasQA('naltrexone') && hasFull('craving')) {
    if (cur !== 426) {
      return { toModule: 699, reason: 'Tests alcohol dependence criteria and psychiatric addiction management, belongs in Psychiatry: Alcohol-Related Disorders' };
    }
  }

  // DERMATOLOGY
  if (hasQA('pemphigus vulgaris') || hasQA('bullous pemphigoid') || hasQA('nikolsky sign') || hasQA('anti-desmoglein') || hasQA('tombstone appearance') || hasQA('acantholysis') || hasQA('dermatitis herpetiformis') && hasFull('blister')) {
    return { toModule: 644, reason: 'Tests autoimmune blistering diseases (pemphigus/pemphigoid), belongs in Dermatology: Vesiculobullous Diseases' };
  }
  if (hasQA('psoriasis') && (hasQA('auspitz sign') || hasQA('koebner phenomenon') || hasQA('silvery scale') || hasQA('munro microabscess') || hasQA('oil drop sign'))) {
    return { toModule: 643, reason: 'Tests psoriasis morphology, clinical signs, and dermatopathology, belongs in Dermatology: Psoriasis' };
  }
  if (hasQA('lichen planus') || hasQA('wickham striae') || hasQA('violaceous papules') || hasQA('sawtooth rete ridges') || hasQA('pityriasis rosea') || hasQA('herald patch')) {
    return { toModule: 642, reason: 'Tests papulosquamous disorders (lichen planus, pityriasis rosea), belongs in Dermatology: Papulosquamous Disorders' };
  }
  if (hasQA('leprosy') || hasQA('hansen disease') || hasQA('lepromatous leprosy') || hasQA('tuberculoid leprosy') || hasQA('erythema nodosum leprosum') || hasQA('slit skin smear') || hasQA('ridley jopling') || hasQA('clofazimine') && hasFull('leprosy')) {
    return { toModule: 645, reason: 'Tests leprosy classification, reactions, and multidrug therapy, belongs in Dermatology: Mycobacterial Infections' };
  }
  if (hasQA('steven johnson syndrome') || hasQA('stevens-johnson syndrome') || hasQA('toxic epidermal necrolysis') || hasQA('erythema multiforme') || hasQA('target lesion') && hasFull('skin') || hasQA('fixed drug eruption')) {
    return { toModule: 641, reason: 'Tests severe cutaneous adverse reactions and drug eruptions, belongs in Dermatology: Reactive Skin Diseases and Drug Eruptions' };
  }
  if (hasQA('acne vulgaris') || hasQA('comedone') || hasQA('isotretinoin') && hasFull('acne') || hasQA('rosacea') || hasQA('rhinophyma')) {
    return { toModule: 636, reason: 'Tests acne and rosacea pathology and therapeutics, belongs in Dermatology: Acne, Rosacea and Others' };
  }
  if (hasQA('alopecia areata') || hasQA('exclamation mark hair') || hasQA('androgenetic alopecia') || hasQA('telogen effluvium') || hasQA('onychomycosis')) {
    return { toModule: 637, reason: 'Tests disorders of hair and nails, belongs in Dermatology: Disorders of Hair and Nails' };
  }
  if (hasQA('scabies') || hasQA('burrow') && hasFull('itch') || hasQA('permethrin 5%') || hasQA('sarcoptes scabiei')) {
    return { toModule: 649, reason: 'Tests parasitic infestations of skin (scabies), belongs in Dermatology: Arthropod and Parasitic Infections' };
  }

  // OPHTHALMOLOGY
  if (hasQA('cataract') || hasQA('phacoemulsification') || hasQA('intraocular lens') || hasQA('senile cataract')) {
    return { toModule: 336, reason: 'Tests cataract pathophysiology and ophthalmological management, belongs in Ophthalmology: Cataract' };
  }
  if (hasQA('glaucoma') || hasQA('intraocular pressure') || hasQA('cup to disc ratio') || hasQA('tonometry') || hasQA('angle closure') || hasQA('trabeculectomy') || hasQA('open angle glaucoma')) {
    return { toModule: 338, reason: 'Tests glaucoma classification, intraocular pressure, and management, belongs in Ophthalmology: Glaucoma' };
  }
  if (hasQA('retinal detachment') || hasQA('central retinal artery occlusion') || hasQA('cherry red spot') && hasFull('retina') || hasQA('central retinal vein occlusion') || hasQA('blood and thunder appearance')) {
    return { toModule: 337, reason: 'Tests retinal vascular occlusions and retinal detachment, belongs in Ophthalmology: Retinal Vascular Disorders and Retinal Detachment' };
  }
  if (hasQA('myopia') || hasQA('hypermetropia') || hasQA('astigmatism') || hasQA('presbyopia') || hasQA('retinoscopy') || hasQA('snellen chart')) {
    return { toModule: 331, reason: 'Tests optics, refraction, and visual acuity assessment, belongs in Ophthalmology: Myopia and Hypermetropia' };
  }

  // ENT
  if (hasQA('otitis media') || hasQA('acute otitis media') || hasQA('asom') || hasQA('csom') || hasQA('cholesteatoma') || hasQA('tympanic membrane perforation') || hasQA('myringotomy')) {
    return { toModule: 301, reason: 'Tests middle ear infections and cholesteatoma, belongs in ENT: Anatomy of Middle Ear / Diseases of Middle Ear' };
  }
  if (hasQA('otosclerosis') || hasQA('carhart notch') || hasQA('stapedectomy') || hasQA('flamingo pink') || hasQA('schwartze sign')) {
    return { toModule: 302, reason: 'Tests otosclerosis diagnosis and stapes surgery, belongs in ENT: Otosclerosis' };
  }
  if (hasQA('meniere disease') || hasQA('endolymphatic hydrops') || hasQA('low frequency sensorineural hearing loss') && hasFull('vertigo')) {
    return { toModule: 305, reason: 'Tests Meniere disease clinical triad and vestibular pathology, belongs in ENT: Meniere\'s Disease and Vestibular Disorders' };
  }
  if (hasQA('rhinosinusitis') || hasQA('sinusitis') && hasFull('nasal discharge') || hasQA('nasal polyp') || hasQA('ethmoidal polyp') || hasQA('epistaxis') && (hasFull('little area') || hasFull('kiesselbach'))) {
    return { toModule: 310, reason: 'Tests nasal and sinus pathology (epistaxis, polyps, sinusitis), belongs in ENT: Non-Specific and Specific Rhinitis / Sinusitis' };
  }
  if (hasQA('vocal cord nodule') || hasQA('vocal nodule') || hasQA('singer node') || hasQA('vocal cord polyp') || hasQA('laryngeal carcinoma') || hasQA('laryngoscopy')) {
    return { toModule: 323, reason: 'Tests voice disorders, vocal cord lesions, and laryngeal pathology, belongs in ENT: Voice & Speech Disorders / Laryngeal Carcinoma' };
  }

  // ORTHOPAEDICS
  if (hasQA('colles fracture') || hasQA('dinner fork deformity') || hasQA('smith fracture') || hasQA('monteggia fracture') || hasQA('galeazzi fracture') || hasQA('scaphoid fracture') || hasQA('anatomical snuffbox')) {
    return { toModule: 661, reason: 'Tests upper limb fractures and specific deformities, belongs in Orthopaedics: Injuries of Elbow and Forearm' };
  }
  if (hasQA('neck of femur fracture') || hasQA('garden classification') || hasQA('intertrochanteric fracture') || hasQA('avascular necrosis of femoral head')) {
    return { toModule: 664, reason: 'Tests hip and femoral fractures, classification, and avascular necrosis, belongs in Orthopaedics: Injuries of Hip and Thigh' };
  }
  if (hasQA('compartment syndrome') && (hasQA('volkmann ischemic contracture') || hasQA('fasciotomy') || hasQA('pain on passive stretch') || hasQA('intracompartmental pressure'))) {
    return { toModule: 658, reason: 'Tests compartment syndrome etiology, diagnosis, and emergency fasciotomy, belongs in Orthopaedics: Complications of Fracture' };
  }
  if (hasQA('anterior cruciate ligament') || hasQA('acl tear') || hasQA('lachman test') || hasQA('pivot shift') || hasQA('meniscus tear') || hasQA('mcmurray test') || hasQA('bucket handle tear')) {
    return { toModule: 685, reason: 'Tests knee ligamentous and meniscal sports injuries, belongs in Orthopaedics: Sports Injury' };
  }
  if (hasQA('osteosarcoma') || hasQA('sunburst appearance') || hasQA('codman triangle') || hasQA('ewing sarcoma') || hasQA('onion peel appearance') || hasQA('giant cell tumor') || hasQA('soap bubble appearance')) {
    return { toModule: 677, reason: 'Tests malignant bone tumors, radiological signatures, and management, belongs in Orthopaedics: Bone Tumors' };
  }

  // FORENSIC MEDICINE
  if (hasQA('rigor mortis') || hasQA('algor mortis') || hasQA('livor mortis') || hasQA('postmortem staining') || hasQA('adipocere') || hasQA('mummification') || hasQA('cadaveric spasm')) {
    return { toModule: 276, reason: 'Tests thanatology and postmortem interval changes, belongs in Forensic Medicine: Death and Post-Mortem Changes' };
  }
  if (hasQA('gunshot residue') || hasQA('entry wound') && hasFull('bullet') || hasQA('rifling') || hasQA('choke of shotgun') || hasQA('tattooing') && hasFull('firearm')) {
    return { toModule: 286, reason: 'Tests firearm injuries and ballistic forensics, belongs in Forensic Medicine: Firearm Injuries' };
  }
  if (hasQA('section 376') || hasQA('bns') || hasQA('bharatiya nyaya sanhita') || hasQA('medical jurisprudence') || hasQA('inquest') || hasQA('expert witness') || hasQA('drunkenness certificate')) {
    return { toModule: 275, reason: 'Tests Indian legal system, criminal law sections, and forensic jurisprudence, belongs in Forensic Medicine: BNS, BNSS, and BSA' };
  }

  // ANAESTHESIA
  if (hasQA('mallampati classification') || hasQA('laryngoscope blade') || hasQA('endotracheal tube') && hasFull('cuff') || hasQA('laryngeal mask airway') || hasQA('lma') && hasFull('airway') || hasQA('difficult airway')) {
    return { toModule: 613, reason: 'Tests airway management devices and intubation assessment, belongs in Anaesthesia: Airway Devices' };
  }
  if (hasQA('minimum alveolar concentration') || hasQA('mac of halothane') || hasQA('blood gas partition coefficient') || hasQA('malignant hyperthermia') && hasFull('dantrolene') && hasFull('succinylcholine')) {
    return { toModule: 615, reason: 'Tests volatile inhalational anesthetics and malignant hyperthermia, belongs in Anaesthesia: Inhalational Anaesthetic Agents' };
  }
  if (hasQA('spinal anaesthesia') || hasQA('epidural anaesthesia') || hasQA('subarachnoid block') || hasQA('post dural puncture headache') || hasQA('ligamentum flavum') && hasFull('epidural')) {
    return { toModule: 618, reason: 'Tests central neuraxial blocks and complications, belongs in Anaesthesia: Spinal and Epidural Anaesthesia' };
  }

  // PSM
  if (hasQA('odds ratio') || hasQA('relative risk') || hasQA('case control study') || hasQA('cohort study') || hasQA('randomized controlled trial') || hasQA('selection bias') || hasQA('confounding factor') || hasQA('blinding')) {
    return { toModule: 359, reason: 'Tests epidemiological study designs and measure of association, belongs in PSM: Analytical Epidemiology' };
  }
  if (hasQA('sensitivity and specificity') || hasQA('positive predictive value') || hasQA('negative predictive value') || hasQA('receiver operating characteristic') || hasQA('roc curve')) {
    return { toModule: 362, reason: 'Tests screening tests, sensitivity, specificity, and predictive values, belongs in PSM: Screening for Disease' };
  }
  if (hasQA('biomedical waste') || hasQA('yellow bag') && hasFull('waste') || hasQA('red bag') && hasFull('waste') || hasQA('blue container') && hasFull('glassware') || hasQA('white translucent container')) {
    return { toModule: 405, reason: 'Tests bio-medical waste management categories and color-coding, belongs in PSM: Healthcare Waste Management' };
  }
  if (hasQA('national tuberculosis elimination program') || hasQA('ntep') || hasQA('nikshay') || hasQA('nvbdcp') || hasQA('national health mission') || hasQA('anganwadi')) {
    return { toModule: 395, reason: 'Tests national health programs and public health implementations, belongs in PSM: National Health Programs' };
  }

  // BIOCHEMISTRY
  if (hasQA('glycolysis') && (hasQA('phosphofructokinase-1') || hasQA('rate limiting enzyme of glycolysis') || hasQA('hexokinase') || hasQA('pyruvate kinase'))) {
    return { toModule: 100, reason: 'Tests biochemical enzymatic steps and regulation of glycolysis, belongs in Biochemistry: Glycolysis and Gluconeogenesis' };
  }
  if (hasQA('glycogen storage disease') || hasQA('von gierke') || hasQA('pompe disease') || hasQA('cori disease') || hasQA('mcardle disease') || hasQA('glucose-6-phosphatase deficiency')) {
    return { toModule: 101, reason: 'Tests glycogen metabolism and inborn storage enzyme deficiencies, belongs in Biochemistry: Glycogen Metabolism and Glycogen Storage Disorders' };
  }
  if (hasQA('hmp shunt') || hasQA('glucose-6-phosphate dehydrogenase deficiency') && hasFull('pentose phosphate') || hasQA('transketolase') || hasQA('nadph production')) {
    return { toModule: 102, reason: 'Tests hexose monophosphate shunt pathway and NADPH biochemistry, belongs in Biochemistry: HMP Shunt Pathway, Fructose, Galactose Metabolism' };
  }
  if (hasQA('urea cycle') && (hasQA('carbamoyl phosphate synthetase') || hasQA('ornithine transcarbamylase') || hasQA('citrulline') || hasQA('argininosuccinate'))) {
    return { toModule: 108, reason: 'Tests urea cycle pathway and hyperammonemia enzyme defects, belongs in Biochemistry: Urea Cycle and its Disorders' };
  }
  if (hasQA('porphyria cutanea tarda') && hasFull('uroporphyrinogen decarboxylase') || hasQA('acute intermittent porphyria') && hasFull('porphobilinogen deaminase') || hasQA('ala synthase') || hasQA('ferrochelatase')) {
    return { toModule: 114, reason: 'Tests heme biosynthesis pathway and porphyria enzymatic deficiencies, belongs in Biochemistry: Porphyrins and Bile Pigments' };
  }
  if (hasQA('michaelis menten') || hasQA('lineweaver burk') || hasQA('km and vmax') || hasQA('competitive inhibitor') && hasFull('vmax') || hasQA('noncompetitive inhibitor') && hasFull('km')) {
    return { toModule: 116, reason: 'Tests enzyme kinetics, Km, Vmax, and modes of inhibition, belongs in Biochemistry: Enzyme Kinetics and Regulation of Activity' };
  }

  // PHARMACOLOGY
  if (hasQA('mechanism of action of ranolazine') || hasQA('ranolazine') && (hasText('late sodium current') || hasText('ina') || hasText('mechanism of action'))) {
    return { toModule: 225, reason: 'Tests mechanism of action of ranolazine (anti-anginal), belongs in Pharmacology: Anti-Anginal Drugs' };
  }
  if (hasQA('remdesivir') && hasText('mechanism of action')) {
    return { toModule: 251, reason: 'Tests antiviral pharmacology (RNA-dependent RNA polymerase inhibitor), belongs in Pharmacology: Anti-virals (Non-retroviral)' };
  }
  if (hasQA('methotrexate') && (hasText('dihydrofolate reductase') || hasText('adverse effect of methotrexate') && !hasFull('rheumatoid'))) {
    return { toModule: 268, reason: 'Tests cytotoxic pharmacology and folate antagonism mechanism, belongs in Pharmacology: Cell Cycle Specific Cytotoxic Drugs' };
  }
  if (hasQA('bioavailability') && (hasText('area under the curve') || hasText('volume of distribution') || hasText('clearance formula') || hasText('half life formula') || hasText('first order kinetics') || hasText('zero order kinetics'))) {
    return { toModule: 221, reason: 'Tests pharmacokinetics mathematical principles and formulas, belongs in Pharmacology: Pharmacokinetics' };
  }

  // PATHOLOGY
  if (hasQA('reed sternberg') || hasQA('owl eye appearance') && hasFull('lymphoma') || hasQA('hodgkin lymphoma') && (hasFull('nodular sclerosis') || hasFull('mixed cellularity'))) {
    return { toModule: 152, reason: 'Tests histopathology and Reed-Sternberg cells of Hodgkin lymphoma, belongs in Pathology: Hodgkin\'s Lymphoma' };
  }
  if (hasQA('auer rods') || hasQA('acute promyelocytic leukemia') && hasFull('t(15;17)') || hasQA('myeloperoxidase positive') && hasFull('blast')) {
    return { toModule: 151, reason: 'Tests histopathology and cytogenetics of acute myeloid leukemia, belongs in Pathology: Acute Myeloid Leukemia (AML)' };
  }
  if (hasQA('burkitt lymphoma') && (hasQA('starry sky appearance') || hasQA('t(8;14)') || hasQA('c-myc'))) {
    return { toModule: 154, reason: 'Tests high-grade lymphoma cytogenetics and starry-sky morphology, belongs in Pathology: Non Hodgkin Lymphomas: High Grade' };
  }
  if (hasQA('hemophilia a') && hasText('factor 8') && (hasText('deficiency') || hasText('severity') || hasText('clotting factor'))) {
    if (cur !== 476 && cur !== 475) {
      return { toModule: 148, reason: 'Tests coagulation pathway cascade and factor VIII deficiency classification, belongs in Pathology: Coagulation Pathway Disorders' };
    }
  }

  // =========================================================================
  // 2. MEDICINE INTRA-SUBJECT AUDIT
  // =========================================================================

  // --- ENDOCRINOLOGY ---
  // Pituitary:
  if (hasQA('acromegaly') || hasQA('growth hormone') || hasQA('igf-1') || hasQA('octreotide') && hasFull('acromegaly') || hasQA('pegvisomant') || hasQA('transsphenoidal') && hasFull('gh')) {
    if (cur !== 414 && cur !== 415) {
      return { toModule: 414, reason: 'Tests clinical features, diagnosis, and management of acromegaly, belongs in Medicine: Disorders of Anterior Pituitary' };
    }
  }
  if (hasQA('prolactinoma') || hasQA('hyperprolactinemia') || hasQA('cabergoline') || hasQA('bromocriptine') || hasQA('galactorrhea') && hasFull('prolactin')) {
    if (cur !== 414 && cur !== 415) {
      return { toModule: 414, reason: 'Tests hyperprolactinemia and prolactinoma diagnosis/treatment, belongs in Medicine: Disorders of Anterior Pituitary' };
    }
  }
  if (hasQA('sheehan syndrome') || hasQA('pituitary apoplexy') || hasQA('bitemporal hemianopia') && hasFull('pituitary adenoma') || hasQA('nelson syndrome') || hasQA('empty sella')) {
    if (cur !== 415) {
      return { toModule: 415, reason: 'Tests pituitary adenoma complications, apoplexy, or Sheehan syndrome, belongs in Medicine: Pituitary Tumors and Sheehan Syndrome' };
    }
  }
  if (hasQA('siadh') || hasQA('syndrome of inappropriate antidiuretic') || hasQA('diabetes insipidus') || hasQA('central diabetes insipidus') || hasQA('nephrogenic diabetes insipidus') || hasQA('water deprivation test') || hasQA('desmopressin response') || hasQA('vaptans') || hasQA('tolvaptan') && hasFull('hyponatremia')) {
    if (cur !== 416) {
      return { toModule: 416, reason: 'Tests posterior pituitary ADH pathology (SIADH / Diabetes Insipidus), belongs in Medicine: Posterior Pituitary - ADH, Diabetes Insipidus' };
    }
  }

  // Thyroid:
  if (hasQA('antithyroid drug') || hasQA('methimazole') || hasQA('carbimazole') || hasQA('propylthiouracil') || hasQA('radioactive iodine') || hasQA('thyroid storm') && (hasText('treatment') || hasText('management') || hasText('preferred drug')) || hasQA('levothyroxine') && (hasText('dose') || hasText('monitoring') || hasText('pregnancy'))) {
    if (cur !== 417) {
      return { toModule: 417, reason: 'Tests thyroid therapeutics, antithyroid drug selection, storm management, or levothyroxine monitoring, belongs in Medicine: Thyroid Disorders - Management' };
    }
  }
  if (hasQA('graves disease') || hasQA('hashimoto thyroiditis') || hasQA('subacute thyroiditis') || hasQA('de quervain') || hasQA('pretibial myxedema') || hasQA('exophthalmos') && hasFull('thyroid') || hasQA('myxedema coma') || hasQA('toxic multinodular goiter') || hasQA('tsh receptor antibody') || hasQA('anti-tpo antibody')) {
    if (cur !== 418 && cur !== 417) {
      return { toModule: 418, reason: 'Tests thyroid clinical syndromes, autoimmune thyroiditis, and manifestations, belongs in Medicine: Thyroid Disorders - Clinical Features' };
    }
  }

  // Adrenal:
  if (hasQA('cushing syndrome') || hasQA('cushing disease') || hasQA('dexamethasone suppression test') || hasQA('urinary free cortisol') || hasQA('ectopic acth') || hasQA('addison disease') || hasQA('primary adrenal insufficiency') || hasQA('adrenal crisis') || hasQA('cosyntropin') || hasQA('pheochromocytoma') || hasQA('urinary metanephrines') || hasQA('primary aldosteronism') || hasQA('conn syndrome') || hasQA('aldosterone renin ratio')) {
    if (cur !== 420) {
      return { toModule: 420, reason: 'Tests adrenal cortical or medullary disorders (Cushing, Addison, Pheochromocytoma, Conn syndrome), belongs in Medicine: Cushing Syndrome' };
    }
  }

  // Diabetes:
  if (hasQA('metformin') || hasQA('sglt2 inhibitor') || hasQA('dapagliflozin') || hasQA('empagliflozin') || hasQA('glp-1 receptor agonist') || hasQA('semaglutide') || hasQA('liraglutide') || hasQA('sulfonylurea') || hasQA('dpp-4 inhibitor') || hasQA('insulin glargine') || hasQA('insulin lispro') || hasQA('regular insulin') || hasQA('diabetic ketoacidosis') && (hasText('management') || hasText('treatment') || hasText('fluid') || hasText('potassium') || hasText('insulin regimen')) || hasQA('diabetic retinopathy') && hasFull('laser') || hasQA('diabetic nephropathy') && (hasText('microalbuminuria') || hasText('ace inhibitor')) || hasQA('diabetic foot') || hasQA('hypoglycemia management')) {
    if (cur !== 422) {
      return { toModule: 422, reason: 'Tests diabetes mellitus management, insulin/oral regimens, or systemic complications, belongs in Medicine: Diabetes Mellitus - Complications and Management' };
    }
  }
  if (hasQA('hba1c') && (hasText('diagnostic criteria') || hasText('ada criteria') || hasText('screening') || hasText('prediabetes')) || hasQA('fasting blood glucose') && hasText('criteria') || hasQA('oral glucose tolerance test') && hasText('diagnosis') || hasQA('mody') || hasQA('latent autoimmune diabetes') || hasQA('type 1 vs type 2 diabetes') || hasQA('dka vs hhs') && hasText('features')) {
    if (cur !== 421 && cur !== 422) {
      return { toModule: 421, reason: 'Tests diabetes mellitus diagnostic criteria, clinical presentation, or phenotypes, belongs in Medicine: Diabetes Mellitus - Clinical Features' };
    }
  }

  // Parathyroid & Calcium:
  if (hasQA('hypercalcemia') || hasQA('hypocalcemia') || hasQA('primary hyperparathyroidism') || hasQA('hypoparathyroidism') || hasQA('pseudohypoparathyroidism') || hasQA('chvostek sign') || hasQA('trousseau sign') || hasQA('osteoporosis') && (hasText('dexa') || hasText('bisphosphonate') || hasText('t-score') || hasText('alendronate') || hasText('teriparatide')) || hasQA('cinacalcet') || hasQA('osteomalacia') && hasFull('vitamin d')) {
    if (cur !== 424) {
      return { toModule: 424, reason: 'Tests disorders of calcium, parathyroid hormone, or metabolic bone disease (osteoporosis), belongs in Medicine: Disorders of Parathyroid and Calcium' };
    }
  }

  // Reproductive Endocrinology:
  if (hasQA('polycystic ovary syndrome') && hasFull('rotterdam') || hasQA('pcos') && hasFull('hirsutism') || hasQA('kallmann syndrome') || hasQA('klinefelter syndrome') && hasFull('hypogonadism') || hasQA('turner syndrome') && hasFull('amenorrhea') || hasQA('hirsutism') && hasFull('ferriman') || hasQA('gynecomastia workup')) {
    if (cur !== 423 && cur !== 558) {
      return { toModule: 423, reason: 'Tests reproductive endocrinology, hypogonadism, or PCOS diagnostic workup, belongs in Medicine: Reproductive Endocrinology' };
    }
  }

  // --- GASTROENTEROLOGY & HEPATOLOGY ---
  if (hasQA('gilbert syndrome') || hasQA('crigler najjar') || hasQA('dubin johnson') || hasQA('rotor syndrome') || hasQA('unconjugated hyperbilirubinemia') || hasQA('conjugated hyperbilirubinemia') || hasQA('alanine aminotransferase') && hasText('liver function test')) {
    if (cur !== 425 && cur !== 431) {
      return { toModule: 425, reason: 'Tests bilirubin metabolism, hereditary hyperbilirubinemias, and LFT interpretation, belongs in Medicine: Hyperbilirubinemia and Functions of Liver' };
    }
  }
  if (hasQA('alcoholic hepatitis') || hasQA('ast:alt ratio') && hasFull('alcoholic') || hasQA('maddrey discriminant') || hasQA('mallory denk') || hasQA('non alcoholic fatty liver') || hasQA('nafld') || hasQA('nash') || hasQA('hepatic steatosis')) {
    if (cur !== 426) {
      return { toModule: 426, reason: 'Tests alcoholic liver disease and non-alcoholic fatty liver disease (NAFLD/NASH), belongs in Medicine: Alcoholic Liver Diseases and Non-Alcoholic Fatty Liver Disease' };
    }
  }
  if (hasQA('autoimmune hepatitis') || hasQA('primary biliary cholangitis') || hasQA('primary sclerosing cholangitis') || hasQA('anti-mitochondrial antibody') || hasQA('ama') && hasFull('cholangitis') || hasQA('anti-smooth muscle antibody') || hasQA('asma') && hasFull('hepatitis') || hasQA('ursodeoxycholic acid')) {
    if (cur !== 427) {
      return { toModule: 427, reason: 'Tests autoimmune liver and biliary diseases (AIH, PBC, PSC), belongs in Medicine: Autoimmune Liver Diseases' };
    }
  }
  if (hasQA('spontaneous bacterial peritonitis') || hasQA('sbp') && hasFull('ascitic fluid') || hasQA('hepatic encephalopathy') || hasQA('lactulose') && hasFull('encephalopathy') || hasQA('hepatorenal syndrome') || hasQA('child pugh') || hasQA('meld score') || hasQA('serum ascites albumin gradient') || hasQA('saag') || hasQA('acute liver failure') && hasFull('inr')) {
    if (cur !== 428) {
      return { toModule: 428, reason: 'Tests acute liver failure, cirrhosis decompensation, SBP, HRS, or hepatic encephalopathy, belongs in Medicine: Acute Liver Failure and Complications of Cirrhosis' };
    }
  }
  if (hasQA('hemochromatosis') || hasQA('bronze diabetes') || hasQA('hfe gene') || hasQA('transferrin saturation') && hasFull('iron overload') || hasQA('wilson disease') || hasQA('kayser fleischer') || hasQA('ceruloplasmin') || hasQA('atp7b') || hasQA('penicillamine') && hasFull('copper')) {
    if (cur !== 429) {
      return { toModule: 429, reason: 'Tests inherited metabolic liver diseases (Hemochromatosis and Wilson\'s disease), belongs in Medicine: Hemochromatosis and Wilsons Disease' };
    }
  }
  if (hasQA('esophageal varices') || hasQA('variceal bleeding') || hasQA('octreotide') && hasFull('variceal') || hasQA('endoscopic band ligation') || hasQA('terlipressin') && hasFull('variceal') || hasQA('tips') && hasFull('portal hypertension') || hasQA('budd chiari')) {
    if (cur !== 430) {
      return { toModule: 430, reason: 'Tests portal hypertension, esophageal varices, and acute bleeding management, belongs in Medicine: Portal Hypertension' };
    }
  }
  if (hasQA('irritable bowel syndrome') || hasQA('rome iv criteria') || hasQA('ibs-d') || hasQA('ibs-c') || hasQA('low fodmap') || hasQA('visceral hypersensitivity') && hasFull('bowel')) {
    if (cur !== 432) {
      return { toModule: 432, reason: 'Tests irritable bowel syndrome diagnosis (Rome criteria) and management, belongs in Medicine: Irritable Bowel Syndrome' };
    }
  }
  if (hasQA('crohn') || hasQA('ulcerative colitis') || hasQA('inflammatory bowel disease') || hasQA('fecal calprotectin') || hasQA('cobblestone mucosa') || hasQA('skip lesions') || hasQA('lead pipe colon') || hasQA('toxic megacolon') || hasQA('pseudopolyps') && hasFull('colitis') || hasQA('string sign of kantor')) {
    if (hasText('treatment') || hasText('management') || hasText('5-asa') || hasText('mesalamine') || hasText('infliximab') || hasText('colectomy indication') || hasText('surveillance')) {
      if (cur !== 434) return { toModule: 434, reason: 'Tests IBD complications and medical/biological management, belongs in Medicine: Inflammatory Bowel Disease - Complications and Treatment' };
    } else {
      if (cur !== 433) return { toModule: 433, reason: 'Tests IBD clinical features, differentiation, and diagnostic endoscopy, belongs in Medicine: Inflammatory Bowel Disease - Clinical Features and Diagnosis' };
    }
  }
  if (hasQA('celiac disease') || hasQA('anti-tissue transglutaminase') || hasQA('anti-ttg') || hasQA('anti-endomysial') || hasQA('villous atrophy') || hasQA('d-xylose test') || hasQA('tropical sprue') || hasQA('whipple disease') || hasQA('tropheryma whipplei') || hasQA('small intestinal bacterial overgrowth') || hasQA('sibo') || hasQA('short bowel syndrome')) {
    if (cur !== 435) {
      return { toModule: 435, reason: 'Tests malabsorption syndromes (Celiac, Whipple, tropical sprue, SIBO), belongs in Medicine: Malabsorption Syndrome' };
    }
  }

  // --- RHEUMATOLOGY & VASCULITIS ---
  if (hasQA('giant cell arteritis') || hasQA('temporal arteritis') || hasQA('jaw claudication') || hasQA('polymyalgia rheumatica') || hasQA('takayasu arteritis') || hasQA('pulseless disease') || hasQA('polyarteritis nodosa') || hasQA('kawasaki disease') && hasFull('coronary')) {
    if (cur !== 436) {
      return { toModule: 436, reason: 'Tests large and medium vessel vasculitis (GCA, Takayasu, PAN, Kawasaki), belongs in Medicine: Large and medium vessel vasculitis' };
    }
  }
  if (hasQA('granulomatosis with polyangiitis') || hasQA('wegener') || hasQA('c-anca') || hasQA('pr3-anca') || hasQA('microscopic polyangiitis') || hasQA('p-anca') && hasFull('vasculitis') || hasQA('eosinophilic granulomatosis with polyangiitis') || hasQA('churg strauss') || hasQA('henoch schonlein') || hasQA('iga vasculitis') || hasQA('cryoglobulinemic vasculitis') || hasQA('goodpasture') || hasQA('anti-gbm')) {
    if (cur !== 437) {
      return { toModule: 437, reason: 'Tests ANCA-associated or immune-complex small vessel vasculitides, belongs in Medicine: Small vessel vasculitis' };
    }
  }
  if (hasQA('sjogren syndrome') || hasQA('xerostomia') && hasFull('sicca') || hasQA('anti-ro') || hasQA('anti-la') || hasQA('anti-ssa') || hasQA('anti-ssb') || hasQA('schirmer test') || hasQA('systemic sclerosis') || hasQA('scleroderma') || hasQA('crest syndrome') || hasQA('anti-centromere') || hasQA('anti-scl-70') || hasQA('scleroderma renal crisis') || hasQA('raynaud phenomenon') && (hasFull('scleroderma') || hasFull('crest'))) {
    if (cur !== 438) {
      return { toModule: 438, reason: 'Tests Sjogren syndrome and Systemic Sclerosis (Scleroderma), belongs in Medicine: Sjogrens Syndrome and Scleroderma' };
    }
  }
  if (hasQA('dermatomyositis') || hasQA('polymyositis') || hasQA('heliotrope rash') || hasQA('gottron papules') || hasQA('shawl sign') || hasQA('anti-jo-1') || hasQA('anti-mi-2') || hasQA('inclusion body myositis') || hasQA('creatine kinase') && hasFull('proximal muscle weakness')) {
    if (cur !== 439) {
      return { toModule: 439, reason: 'Tests inflammatory myopathies (dermatomyositis/polymyositis), belongs in Medicine: Dermatomyositis and Related Disorders' };
    }
  }
  if (hasQA('antiphospholipid') || hasQA('apla') || hasQA('lupus anticoagulant') || hasQA('anticardiolipin') || hasQA('anti-beta-2-glycoprotein') || hasQA('catastrophic antiphospholipid')) {
    if (cur !== 440) {
      return { toModule: 440, reason: 'Tests antiphospholipid antibody syndrome and thrombotic/obstetric complications, belongs in Medicine: Antiphospholipid Antibody Syndrome' };
    }
  }
  if (hasQA('rheumatoid arthritis') || hasQA('anti-ccp') || hasQA('rheumatoid factor') && hasFull('polyarthritis') || hasQA('swan neck deformity') || hasQA('boutonniere deformity') || hasQA('morning stiffness') && hasFull('mcp') || hasQA('dmard') || hasQA('felty syndrome')) {
    if (cur !== 441) {
      return { toModule: 441, reason: 'Tests rheumatoid arthritis clinical features, serology, and DMARD therapeutics, belongs in Medicine: Rheumatoid Arthritis' };
    }
  }

  // --- PULMONOLOGY ---
  if (hasQA('asthma') || hasQA('copd') || hasQA('chronic bronchitis') || hasQA('emphysema') || hasQA('salmeterol') && hasFull('broncho') || hasQA('tiotropium') || hasQA('fev1/fvc < 0.7') || hasQA('bronchodilator reversibility') || hasQA('gold staging') || hasQA('gina guidelines')) {
    if (cur !== 442 && cur !== 446) {
      return { toModule: 442, reason: 'Tests obstructive lung diseases (Asthma & COPD) pathophysiology and guidelines, belongs in Medicine: Asthma & COPD' };
    }
  }
  if (hasQA('community acquired pneumonia') || hasQA('curb-65') || hasQA('streptococcus pneumoniae') && hasFull('pneumonia') || hasQA('mycoplasma pneumoniae') && hasFull('pneumonia') || hasQA('legionella pneumophila') || hasQA('klebsiella pneumoniae') && hasFull('pneumonia') || hasQA('pneumocystis jirovecii') || hasQA('pneumonia') && hasFull('consolidation')) {
    if (cur !== 443 && cur !== 477) {
      return { toModule: 443, reason: 'Tests community/hospital-acquired pneumonia pathogens, severity scores, and antibiotics, belongs in Medicine: Pneumonia' };
    }
  }
  if (hasQA('idiopathic pulmonary fibrosis') || hasQA('usual interstitial pneumonia') || hasQA('honeycombing') && hasFull('lung') || hasQA('sarcoidosis') || hasQA('bilateral hilar lymphadenopathy') || hasQA('lofgren syndrome') || hasQA('heerfordt') || hasQA('hypersensitivity pneumonitis') || hasQA('silicosis') || hasQA('asbestosis') || hasQA('noncaseating granuloma') && hasFull('lung')) {
    if (cur !== 444) {
      return { toModule: 444, reason: 'Tests interstitial lung diseases, pulmonary fibrosis, and sarcoidosis, belongs in Medicine: Interstitial Lung Diseases and Sarcoidosis' };
    }
  }
  if (hasQA('bronchiectasis') || hasQA('signet ring sign') && hasFull('ct chest') || hasQA('tram track') && hasFull('bronchi') || hasQA('kartagener syndrome') || hasQA('lung abscess') || hasQA('air-fluid level') && hasFull('cavity') && hasFull('lung')) {
    if (cur !== 445) {
      return { toModule: 445, reason: 'Tests bronchiectasis and lung abscess presentation and imaging, belongs in Medicine: Bronchiectasis and Lung Abscess' };
    }
  }
  if (hasQA('pulmonary function test') || hasQA('spirometry') || hasQA('dlco') || hasQA('total lung capacity') || hasQA('residual volume') || hasQA('flow volume loop') || hasQA('fev1/fvc ratio') && !hasFull('copd treatment')) {
    if (cur !== 446) {
      return { toModule: 446, reason: 'Tests pulmonary function testing, spirometry interpretation, and DLCO mechanics, belongs in Medicine: Pulmonary Function Tests' };
    }
  }
  if (hasQA('ards') || hasQA('acute respiratory distress syndrome') || hasQA('berlin definition') || hasQA('pao2/fio2 ratio') || hasQA('low tidal volume ventilation') || hasQA('type 1 respiratory failure') || hasQA('type 2 respiratory failure') || hasQA('hypercapnic respiratory failure')) {
    if (cur !== 447) {
      return { toModule: 447, reason: 'Tests respiratory failure types and ARDS diagnostic criteria / lung-protective ventilation, belongs in Medicine: Respiratory Failure and ARDS' };
    }
  }
  if (hasQA('small cell lung cancer') || hasQA('non small cell lung cancer') || hasQA('adenocarcinoma of lung') || hasQA('squamous cell lung carcinoma') || hasQA('pancoast tumor') || hasQA('superior sulcus tumor') || hasQA('horner syndrome') && hasFull('apical lung') || hasQA('svc syndrome') && hasFull('bronchogenic')) {
    if (cur !== 448) {
      return { toModule: 448, reason: 'Tests pulmonary neoplasms, histology, and paraneoplastic syndromes, belongs in Medicine: Neoplasms of the Lung' };
    }
  }
  if (hasQA('obstructive sleep apnea') || hasQA('sleep apnea') || hasQA('polysomnography') && hasFull('apnea') || hasQA('apnea hypopnea index') || hasQA('ahi') && hasFull('sleep') || hasQA('cpap') && hasFull('apnea') || hasQA('stop-bang')) {
    if (cur !== 449) {
      return { toModule: 449, reason: 'Tests obstructive sleep apnea evaluation, polysomnography, and CPAP management, belongs in Medicine: Sleep Apnea' };
    }
  }

  // --- NEPHROLOGY ---
  if (hasQA('acute kidney injury') || hasQA('kdigo criteria') || hasQA('acute tubular necrosis') || hasQA('prerenal azotemia') || hasQA('fena') || hasQA('fractional excretion of sodium') || hasQA('muddy brown casts') || hasQA('acute interstitial nephritis') || hasQA('contrast induced nephropathy') || hasQA('rhabdomyolysis') && hasFull('myoglobin')) {
    if (cur !== 450) {
      return { toModule: 450, reason: 'Tests acute kidney injury differentiation (prerenal/ATN/AIN) and management, belongs in Medicine: Acute Kidney Injury' };
    }
  }
  if (hasQA('chronic kidney disease') || hasQA('kdigo staging') && hasFull('gfr') || hasQA('uremic syndrome') || hasQA('uremic pericarditis') || hasQA('anemia of ckd') || hasQA('erythropoietin in ckd') || hasQA('renal osteodystrophy') || hasQA('calciphylaxis')) {
    if (cur !== 451) {
      return { toModule: 451, reason: 'Tests chronic kidney disease staging, uremic complications, and conservative management, belongs in Medicine: Chronic Kidney Disease' };
    }
  }
  if (hasQA('hemodialysis') || hasQA('peritoneal dialysis') || hasQA('arteriovenous fistula') || hasQA('av fistula') || hasQA('dialysis disequilibrium') || hasQA('indications for dialysis') || hasQA('renal transplant rejection') || hasQA('calcineurin inhibitor toxicity')) {
    if (cur !== 452) {
      return { toModule: 452, reason: 'Tests renal replacement therapy (dialysis access, complications, transplantation), belongs in Medicine: Renal Replacement Therapy' };
    }
  }
  if (hasQA('autosomal dominant polycystic kidney') || hasQA('adpkd') || hasQA('pkd1') || hasQA('arpkd') || hasQA('medullary cystic kidney') || hasQA('medullary sponge kidney') || hasQA('alport syndrome')) {
    if (cur !== 453) {
      return { toModule: 453, reason: 'Tests cystic and inherited genetic disorders of the kidney, belongs in Medicine: Cysts and Inherited Disorders of the Kidney' };
    }
  }
  if (hasQA('renal tubular acidosis') || hasQA('rta type 1') || hasQA('rta type 2') || hasQA('rta type 4') || hasQA('fanconi syndrome') || hasQA('bartter syndrome') || hasQA('gitelman syndrome') || hasQA('liddle syndrome') || hasQA('apparent mineralocorticoid excess')) {
    if (cur !== 454) {
      return { toModule: 454, reason: 'Tests renal tubular acidosis and tubulopathies (Bartter, Gitelman, Liddle), belongs in Medicine: Renal Tubular Diseases of Kidney' };
    }
  }

  // --- CARDIOLOGY ---
  if (hasQA('jugular venous pulse') || hasQA('jvp waveform') || hasQA('cannon a wave') || hasQA('heart sound') && (hasFull('s3') || hasFull('s4') || hasFull('opening snap')) || hasQA('murmur grading') || hasQA('austin flint murmur') || hasQA('graham steell murmur')) {
    if (cur !== 455 && cur !== 458) {
      return { toModule: 455, reason: 'Tests cardiovascular physical examination, JVP waveforms, and heart sounds, belongs in Medicine: Diagnosis of cardiovascular disorders' };
    }
  }
  if (hasQA('atrial fibrillation') || hasQA('atrial flutter') || hasQA('avnrt') || hasQA('avrt') || hasQA('wolff parkinson white') || hasQA('wpw syndrome') || hasQA('cha2ds2-vasc') || hasQA('supraventricular tachycardia') || hasQA('svt')) {
    if (cur !== 456) {
      return { toModule: 456, reason: 'Tests supraventricular arrhythmias, AFib anticoagulation, and pre-excitation (WPW), belongs in Medicine: Supraventricular Arrhythmias' };
    }
  }
  if (hasQA('ventricular tachycardia') || hasQA('ventricular fibrillation') || hasQA('torsades de pointes') || hasQA('long qt syndrome') || hasQA('brugada syndrome') || hasQA('complete heart block') || hasQA('third degree av block') || hasQA('mobitz type') || hasQA('wenckebach') || hasQA('pacemaker indication')) {
    if (cur !== 457) {
      return { toModule: 457, reason: 'Tests ventricular arrhythmias, channelopathies (Long QT, Brugada), and conduction blocks, belongs in Medicine: Ventricular Arrhythmias and Heart Blocks' };
    }
  }
  if (hasQA('mitral stenosis') || hasQA('mitral regurgitation') || hasQA('aortic stenosis') || hasQA('aortic regurgitation') || hasQA('infective endocarditis') || hasQA('duke criteria') || hasQA('rheumatic fever') || hasQA('jones criteria') || hasQA('prosthetic valve')) {
    if (cur !== 458) {
      return { toModule: 458, reason: 'Tests valvular heart disease, infective endocarditis, and rheumatic fever, belongs in Medicine: Vascular Heart Diseases' };
    }
  }
  if (hasQA('stemi') || hasQA('npremi') || hasQA('nstem') || hasQA('unstable angina') || hasQA('stable angina') || hasQA('cardiac troponin') || hasQA('st elevation myocardial infarction') || hasQA('ecg in myocardial infarction') || hasQA('reciprocal changes') && hasFull('infarction')) {
    if (cur !== 459 && cur !== 460) {
      return { toModule: 459, reason: 'Tests presentation, biomarkers, and ECG diagnosis of ischemic heart disease, belongs in Medicine: Ischemic Heart Disease - Presentation and Diagnosis' };
    }
  }
  if (hasQA('primary pci') || hasQA('percutaneous coronary intervention') || hasQA('thrombolysis in mi') || hasQA('post-mi complication') || hasQA('ventricular septal rupture') || hasQA('papillary muscle rupture') || hasQA('dressler syndrome') || hasQA('dual antiplatelet therapy') && hasFull('stent')) {
    if (cur !== 460) {
      return { toModule: 460, reason: 'Tests ischemic heart disease reperfusion management and post-infarction complications, belongs in Medicine: Ischemic Heart Disease - Complications and Management' };
    }
  }
  if (hasQA('dilated cardiomyopathy') || hasQA('hypertrophic cardiomyopathy') || hasQA('hocm') || hasQA('systolic anterior motion') || hasQA('restrictive cardiomyopathy') || hasQA('myocarditis') || hasQA('takotsubo') || hasQA('cardiac amyloidosis')) {
    if (cur !== 461) {
      return { toModule: 461, reason: 'Tests cardiomyopathies (DCM, HOCM, RCM) and acute myocarditis, belongs in Medicine: Cardiomyopathy and Myocarditis' };
    }
  }
  if (hasQA('congestive heart failure') || hasQA('heart failure') || hasQA('hfref') || hasQA('hfpef') || hasQA('nyha class') || hasQA('bnp') || hasQA('nt-probnp') || hasQA('guideline directed medical therapy') || hasQA('arni') || hasQA('sacubitril/valsartan') || hasQA('spironolactone in heart failure') || hasQA('acute pulmonary edema') && hasFull('cardiac')) {
    if (cur !== 462) {
      return { toModule: 462, reason: 'Tests heart failure pathophysiology, classification, and guideline-directed medical therapy, belongs in Medicine: Heart Failure' };
    }
  }
  if (hasQA('deep vein thrombosis') || hasQA('dvt') || hasQA('pulmonary embolism') || hasQA('wells score') || hasQA('ct pulmonary angiography') || hasQA('ctpa') || hasQA('s1q3t3') || hasQA('d-dimer in pe')) {
    if (cur !== 463) {
      return { toModule: 463, reason: 'Tests deep vein thrombosis and pulmonary embolism diagnosis and anticoagulation, belongs in Medicine: DVT and Pulmonary Embolism' };
    }
  }

  // --- NEUROLOGY ---
  if (hasQA('alzheimer disease') || hasQA('vascular dementia') || hasQA('lewy body dementia') || hasQA('frontotemporal dementia') || hasQA('normal pressure hydrocephalus') || hasQA('glasgow coma scale') || hasQA('gcs') || hasQA('brain death criteria') || hasQA('coma examination')) {
    if (cur !== 464) {
      return { toModule: 464, reason: 'Tests dementia subtypes, neurocognitive decline, coma assessment, and brain death, belongs in Medicine: Cerebral Neurology: Dementia, Death and Coma' };
    }
  }
  if (hasQA('epilepsy') || hasQA('status epilepticus') || hasQA('absence seizure') || hasQA('3 hz spike') || hasQA('tonic-clonic seizure') || hasQA('antiepileptic drug') || hasQA('levetiracetam') && hasFull('seizure') || hasQA('sodium valproate') && hasFull('epilepsy')) {
    if (cur !== 465) {
      return { toModule: 465, reason: 'Tests seizure classifications, EEG signatures, and epilepsy/status epilepticus management, belongs in Medicine: Seizure and Epilepsy' };
    }
  }
  if (hasQA('parkinson disease') || hasQA('resting tremor') && hasFull('rigidity') || hasQA('levodopa') || hasQA('carbidopa') || hasQA('huntington disease') || hasQA('chorea') || hasQA('essential tremor') || hasQA('progressive supranuclear palsy') || hasQA('multiple system atrophy') || hasQA('dystonia')) {
    if (cur !== 466) {
      return { toModule: 466, reason: 'Tests movement disorders, parkinsonism, Huntington disease, and tremor, belongs in Medicine: Extrapyramidal Syndromes and Movement Disorders' };
    }
  }
  if (hasQA('myasthenia gravis') || hasQA('acetylcholine receptor antibody') || hasQA('anti-achr') || hasQA('tensilon test') || hasQA('edrophonium') || hasQA('ice pack test') || hasQA('thymoma') && hasFull('myasthenia') || hasQA('lambert eaton') || hasQA('amyotrophic lateral sclerosis') || hasQA('als') && hasFull('motor neuron') || hasQA('riluzole')) {
    if (cur !== 467) {
      return { toModule: 467, reason: 'Tests neuromuscular junction disorders (Myasthenia gravis, Lambert-Eaton) and ALS, belongs in Medicine: Myasthenia Gravis and Other Neuromuscular Disorders' };
    }
  }
  if (hasQA('guillain barre syndrome') || hasQA('gbs') || hasQA('albuminocytological dissociation') || hasQA('acute inflammatory demyelinating polyneuropathy') || hasQA('campylobacter jejuni') && hasFull('weakness') || hasQA('charcot marie tooth') || hasQA('diabetic peripheral neuropathy') || hasQA('mononeuritis multiplex') || hasQA('carpal tunnel syndrome') && hasFull('nerve')) {
    if (cur !== 468) {
      return { toModule: 468, reason: 'Tests peripheral neuropathies, Guillain-Barré syndrome, and polyneuropathies, belongs in Medicine: Guillain Barre Syndrome and Other Peripheral Neuropathies' };
    }
  }
  if (hasQA('multiple sclerosis') || hasQA('optic neuritis') && hasFull('ms') || hasQA('oligoclonal bands') || hasQA('dawson fingers') || hasQA('internuclear ophthalmoplegia') || hasQA('lhermitte sign') || hasQA('uhthoff phenomenon') || hasQA('neuromyelitis optica') || hasQA('anti-aqp4')) {
    if (cur !== 469) {
      return { toModule: 469, reason: 'Tests central demyelinating diseases (Multiple Sclerosis, NMO) and diagnostic markers, belongs in Medicine: Multiple Sclerosis and Other Demyelinating Disorders' };
    }
  }
  if (hasQA('migraine') || hasQA('tension type headache') || hasQA('cluster headache') || hasQA('trigeminal neuralgia') || hasQA('idiopathic intracranial hypertension') || hasQA('pseudotumor cerebri') || hasQA('triptans') || hasQA('cgrp')) {
    if (cur !== 470) {
      return { toModule: 470, reason: 'Tests primary headache syndromes (Migraine, Cluster, Tension, Trigeminal neuralgia), belongs in Medicine: Headache' };
    }
  }
  if (hasQA('spinal cord compression') || hasQA('transverse myelitis') || hasQA('brown sequard') || hasQA('subacute combined degeneration') || hasQA('anterior spinal artery syndrome') || hasQA('syringomyelia') || hasQA('cauda equina syndrome') || hasQA('conus medullaris')) {
    if (cur !== 471) {
      return { toModule: 471, reason: 'Tests myelopathies, spinal cord transection syndromes, and cord compression, belongs in Medicine: Spinal Cord Disorders' };
    }
  }
  if (hasQA('bell palsy') || hasQA('facial nerve palsy') || hasQA('ramsay hunt') || hasQA('cranial nerve examination') || hasQA('third nerve palsy') || hasQA('abducens nerve palsy') || hasQA('sixth nerve palsy') || hasQA('trochlear nerve')) {
    if (cur !== 472) {
      return { toModule: 472, reason: 'Tests isolated cranial neuropathies and cranial nerve clinical lesions, belongs in Medicine: Cranial Nerve Disorders' };
    }
  }
  if (hasQA('ischemic stroke') || hasQA('acute ischemic stroke') || hasQA('tissue plasminogen activator') || hasQA('thrombectomy') && hasFull('stroke') || hasQA('middle cerebral artery infarction') || hasQA('lacunar stroke') || hasQA('subarachnoid hemorrhage') || hasQA('berry aneurysm') || hasQA('intracerebral hemorrhage')) {
    if (cur !== 473) {
      return { toModule: 473, reason: 'Tests cerebrovascular accidents (ischemic stroke, ICH, SAH) and acute revascularization, belongs in Medicine: Cerebrovascular Disease' };
    }
  }
  if (hasQA('bacterial meningitis') || hasQA('csf analysis in meningitis') || hasQA('neisseria meningitidis') && hasFull('meningitis') || hasQA('hsv encephalitis') || hasQA('temporal lobe encephalitis') || hasQA('cryptococcal meningitis') || hasQA('kernig sign') || hasQA('brudzinski sign')) {
    if (cur !== 474) {
      return { toModule: 474, reason: 'Tests central nervous system infections (meningitis, encephalitis) and CSF interpretation, belongs in Medicine: Meningitis Encephalitis' };
    }
  }

  // --- HEMATOLOGY ---
  if (hasQA('multiple myeloma') || hasQA('crab criteria') || hasQA('bence jones protein') || hasQA('m spike') || hasQA('mgus') || hasQA('monoclonal gammopathy of undetermined') || hasQA('waldenstrom macroglobulinemia') || hasQA('al amyloidosis')) {
    if (cur !== 475) {
      return { toModule: 475, reason: 'Tests plasma cell disorders (Multiple Myeloma, MGUS, Waldenstrom), belongs in Medicine: Plasma Cell Disorders' };
    }
  }
  if (hasQA('chronic myeloid leukemia') || hasQA('cml') || hasQA('philadelphia chromosome') || hasQA('bcr-abl') || hasQA('imatinib') || hasQA('chronic lymphocytic leukemia') || hasQA('cll') || hasQA('smudge cells') || hasQA('hairy cell leukemia')) {
    if (cur !== 476) {
      return { toModule: 476, reason: 'Tests chronic leukemias (CML, CLL, HCL) clinical staging and targeted kinase inhibitors, belongs in Medicine: Chronic Myeloid Leukemia and Lymphoid Leukemias' };
    }
  }

  // --- INFECTIOUS DISEASES / HIV ---
  if (hasQA('hiv') || hasQA('haart') || hasQA('antiretroviral therapy') || hasQA('cd4 count') || hasQA('opportunistic infection in hiv') || hasQA('who clinical staging of hiv') || hasQA('hiv screening')) {
    if (hasText('investigation') || hasText('monitoring') || hasText('cd4 monitoring') || hasText('viral load') || hasText('western blot') || hasText('elisa test')) {
      if (cur !== 478) return { toModule: 478, reason: 'Tests laboratory evaluation, monitoring, and diagnostic assays for HIV/AIDS, belongs in Medicine: HIV / AIDS - Investigations' };
    } else {
      if (cur !== 477) return { toModule: 477, reason: 'Tests HIV/AIDS transmission, epidemiology, staging, and opportunistic infections, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
    }
  }

  // --- ACID-BASE ---
  if (hasQA('anion gap') || hasQA('metabolic acidosis') || hasQA('metabolic alkalosis') || hasQA('respiratory acidosis') || hasQA('respiratory alkalosis') || hasQA('winter formula') || hasQA('abg interpretation') || hasQA('base excess')) {
    if (cur !== 412) {
      return { toModule: 412, reason: 'Tests arterial blood gas (ABG) interpretation and acid-base disorder calculations, belongs in Medicine: Acid-Base Disorders' };
    }
  }

  return null;
}

module.exports = { auditQuestion, clean };

if (require.main === module) {
  console.log('Testing auditor on all questions...');
  const moves = [];
  questions.forEach(q => {
    const result = auditQuestion(q);
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
