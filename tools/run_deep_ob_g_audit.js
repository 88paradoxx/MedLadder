const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/live_fresh_ob_g.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

console.log(`Loaded ${rawQuestions.length} live questions for OB & G.`);

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
  // Pediatrics: Neonatal Care / Resuscitation
  if ((inQA('apgar score') && inText('resuscitation', 'minute')) || inQA('neonatal resuscitation in delivery room')) {
    return { toModule: 577, reason: 'Neonatal resuscitation algorithms and APGAR score management belong in Pediatrics: Apgar score and Neonatal Resuscitation (Module 577).' };
  }
  // Surgery: Breast cancer / thyroidectomy
  if (inQA('carcinoma breast', 'mastectomy', 'fibroadenoma') && !inFull('pregnancy', 'lactation')) {
    return { toModule: 487, reason: 'Breast neoplasms and surgical management belong in Surgery: Carcinoma Breast (Module 487).' };
  }

  // 2. INTRA-OBGYN TOPIC ROUTING

  // 562: PCOS and Ovarian Disorders (disentangle from Anemia 552 or Liver 557)
  if (inQA('stein-leventhal', 'pcos', 'polycystic ovary', 'polycystic ovarian', 'hirsutism in pcos', 'rotterdam criteria', 'string of pearls', 'hyperandrogenism in female', 'ovarian torsion', 'detorsion') ||
      (inText('pcos') && inFull('hirsutism', 'ovary', 'letrozole'))) {
    if (cur !== 562) return { toModule: 562, reason: 'Tests polycystic ovarian syndrome (PCOS/Stein-Leventhal), hirsutism, or acute ovarian torsion, belongs in OB & G: Disorders of Ovary (Module 562).' };
  }

  // 570: Ovarian Tumors (Krukenberg, Dysgerminoma, Teratoma, Granulosa, Serous/Mucinous)
  if (inQA('ovarian tumor', 'ovarian malignancy', 'dermoid cyst', 'krukenberg', 'dysgerminoma', 'granulosa cell tumor', 'call-exner', 'schiller-duval', 'yolk sac tumor of ovary', 'meigs syndrome', 'ca-125', 'theca cell tumor', 'psammoma bodies in ovary')) {
    if (cur !== 570) return { toModule: 570, reason: 'Tests benign and malignant ovarian neoplasms (germ cell, epithelial, sex-cord stromal, Krukenberg), belongs in OB & G: Ovarian Tumors (Module 570).' };
  }

  // 572: Carcinoma Cervix & Screening
  if (inQA('carcinoma cervix', 'cervical cancer', 'pap smear', 'bethesda system', 'hpv 16', 'hpv 18', 'colposcopy', 'aceto-white', 'schiller test', 'cin 1', 'cin 2', 'cin 3', 'wertheim', 'radical hysterectomy') ||
      (inText('cervix') && inFull('post-coital bleeding', 'staging', 'figo'))) {
    if (cur !== 572) return { toModule: 572, reason: 'Tests cervical premalignant intraepithelial lesions (CIN), screening cytology/colposcopy, and carcinoma cervix, belongs in OB & G: Carcinoma Cervix (Module 572).' };
  }

  // 573: Carcinoma Endometrium
  if (inQA('carcinoma endometrium', 'endometrial cancer', 'endometrial hyperplasia with atypia', 'lynch syndrome endometrial') ||
      (inText('postmenopausal bleeding') && inFull('endometrial biopsy', 'endometrial thickness'))) {
    if (cur !== 573) return { toModule: 573, reason: 'Tests endometrial carcinoma etiology, postmenopausal bleeding workup and surgical staging, belongs in OB & G: Carcinoma Endometrium (Module 573).' };
  }

  // 571: Vulval & Vaginal Malignancy
  if (inQA('carcinoma vulva', 'vulvar cancer', 'sarcoma botryoides', 'clear cell adenocarcinoma of vagina', 'des exposure')) {
    if (cur !== 571) return { toModule: 571, reason: 'Tests vulval and vaginal malignancies (squamous cell carcinoma, sarcoma botryoides), belongs in OB & G: Vulval & Vaginal Malignancy (Module 571).' };
  }

  // 569: Menopause & Perimenopause
  if (inQA('perimenopause', 'menopause', 'post-menopausal bleeding evaluation', 'hormone replacement therapy in menopause', 'hrt', 'hot flashes', 'elevated fsh > 40', 'premature ovarian insufficiency', 'premature ovarian failure')) {
    if (cur !== 569) return { toModule: 569, reason: 'Tests climacteric symptoms, menopause endocrinology, hormone replacement therapy, and premature ovarian insufficiency, belongs in OB & G: Perimenopause, Menopause and Post-Menopausal Bleeding (Module 569).' };
  }

  // 568: Infertility & ART
  if (inQA('infertility', 'hysterosalpingography', 'hsg', 'in vitro fertilization', 'ivf', 'intracytoplasmic sperm injection', 'icsi', 'intrauterine insemination', 'iui', 'chromopertubation', 'unexplained infertility', 'clomiphene citrate', 'letrozole for ovulation induction') && !inFull('pcos')) {
    if (cur !== 568) return { toModule: 568, reason: 'Tests female/male infertility workup, tubal patency tests, and assisted reproductive technologies (ART), belongs in OB & G: Infertility (Module 568).' };
  }

  // 566 & 567: PID & Genital TB
  if (inQA('pelvic inflammatory disease', 'pid', 'tubo-ovarian abscess', 'fitz-hugh-curtis', 'chandelier sign', 'cervical motion tenderness') && !inFull('tuberculosis')) {
    if (cur !== 566) return { toModule: 566, reason: 'Tests acute and chronic pelvic inflammatory disease (PID), Fitz-Hugh-Curtis syndrome, and tubo-ovarian abscess, belongs in OB & G: Pelvic Inflammatory Disease (Module 566).' };
  }
  if (inQA('genital tuberculosis', 'pelvic tuberculosis', 'lead-pipe fallopian tube', 'tobacco pouch appearance')) {
    if (cur !== 567) return { toModule: 567, reason: 'Tests female genital tuberculosis pathogenesis and tubal manifestations, belongs in OB & G: Genital Tuberculosis (Module 567).' };
  }

  // 564 & 565: Vaginal & Vulval Infections
  if (inQA('bacterial vaginosis', 'clue cells', 'whiff test', 'amsel criteria', 'trichomoniasis', 'trichomonas vaginalis', 'strawberry cervix', 'candida albicans', 'cottage cheese discharge', 'vaginitis', 'curdy white discharge')) {
    if (cur !== 564) return { toModule: 564, reason: 'Tests vaginal infections (Bacterial Vaginosis, Trichomoniasis, Vulvovaginal Candidiasis), belongs in OB & G: Vaginal Infections (Module 564).' };
  }
  if (inQA('barotholin', 'bartholin cyst', 'bartholin abscess', 'marsupialization', 'lichen sclerosus', 'vulval kraurosis')) {
    if (cur !== 565) return { toModule: 565, reason: 'Tests vulval benign conditions, Bartholin abscess marsupialization, and lichen sclerosus, belongs in OB & G: Vulval Infections (Module 565).' };
  }

  // 563: Contraception & Sterilization
  if (inQA('contraception', 'oral contraceptive pill', 'ocp', 'copper-t', 'intrauterine device', 'iud', 'mirena', 'lng-ius', 'depo-provera', 'dmpa', 'emergency contraception', 'levonorgestrel emergency', 'tubal ligation', 'pomeroy', 'fallope ring', 'medical eligibility criteria for contraceptive', 'pearl index') && !inFull('abortion')) {
    if (cur !== 563) return { toModule: 563, reason: 'Tests temporary and permanent contraceptive methods (OCPs, IUDs, injectable progestins, sterilization), belongs in OB & G: Contraception and Sterilization (Module 563).' };
  }

  // 560 & 561: Fibroid & Endometriosis/Adenomyosis
  if (inQA('leiomyoma', 'uterine fibroid', 'myomectomy', 'red degeneration of fibroid', 'submucosal fibroid', 'figo fibroid') && !inFull('sarcoma')) {
    if (cur !== 560) return { toModule: 560, reason: 'Tests uterine fibroids (leiomyomas), clinical symptoms, red degeneration and myomectomy, belongs in OB & G: Fibroid (Module 560).' };
  }
  if (inQA('endometriosis', 'adenomyosis', 'chocolate cyst of ovary', 'powder burn lesion', 'globular boggy uterus', 'severe dyspareunia and dyschezia') && !inFull('fibroid')) {
    if (cur !== 561) return { toModule: 561, reason: 'Tests endometriosis and adenomyosis pathogenesis, laparoscopic findings and clinical management, belongs in OB & G: Endometriosis and Adenomyosis (Module 561).' };
  }

  // 559: Prolapse
  if (inQA('pelvic organ prolapse', 'uterine prolapse', 'cystocele', 'rectocele', 'enterocele', 'fothergill', 'manchester operation', 'pop-q', 'sacrocolpopexy', 'le fort colpocleisis', 'pessary for prolapse')) {
    if (cur !== 559) return { toModule: 559, reason: 'Tests pelvic organ prolapse (cystocele, rectocele, uterine descent, POP-Q, pelvic floor reconstructive surgery), belongs in OB & G: Prolapse (Module 559).' };
  }

  // 558: Disorders of Menstruation
  if (inQA('abnormal uterine bleeding', 'aub-palm coein', 'dysfunctional uterine bleeding', 'dub', 'primary amenorrhea', 'secondary amenorrhea', 'progestin challenge test', 'primary dysmenorrhea', 'pms', 'premenstrual dysphoric disorder') && !inFull('pcos', 'fibroid', 'endometriosis')) {
    if (cur !== 558) return { toModule: 558, reason: 'Tests menstrual cycle abnormalities (AUB, amenorrhea algorithms, dysmenorrhea, PMS), belongs in OB & G: Disorders of Menstruation (Module 558).' };
  }

  // 556: Rhesus Isoimmunization
  if (inQA('rh isoimmunization', 'rh incompatibility', 'anti-d immunoglobulin', 'indirect coombs test in pregnancy', 'kleihauer-betke', 'hydrops fetalis immune', 'intrauterine transfusion in rh')) {
    if (cur !== 556) return { toModule: 556, reason: 'Tests Rh isoimmunization, anti-D prophylaxis guidelines, and fetal hemolysis monitoring, belongs in OB & G: Rhesus Isoimmunization (Module 556).' };
  }

  // 557: Hepatic Disorders & Infections in Pregnancy
  if (inQA('acute fatty liver of pregnancy', 'aflp', 'intrahepatic cholestasis of pregnancy', 'icp', 'pruritus in pregnancy bile acids', 'ursodeoxycholic acid in pregnancy', 'hepatitis e in pregnancy') ||
      (inText('pruritus of palms and soles') && inFull('pregnancy', 'bile acid'))) {
    if (cur !== 557) return { toModule: 557, reason: 'Tests liver disorders specific to pregnancy (AFLP, Intrahepatic Cholestasis of Pregnancy ICP, viral hepatitis), belongs in OB & G: Hepatic Disorders and Infections in Pregnancy (Module 557).' };
  }

  // 555: Cardiovascular Conditions in Pregnancy
  if (inQA('mitral stenosis in pregnancy', 'heart disease in pregnancy', 'peripartum cardiomyopathy', 'nyha in pregnancy', 'anticoagulation in pregnant heart disease', 'eisenmenger syndrome in pregnancy')) {
    if (cur !== 555) return { toModule: 555, reason: 'Tests cardiac disease in pregnancy (mitral stenosis, peripartum cardiomyopathy, NYHA functional classes), belongs in OB & G: Cardiovascular Conditions in Pregnancy (Module 555).' };
  }

  // 554: Diabetes in Pregnancy
  if (inQA('gestational diabetes mellitus', 'gdm', 'dipsi', 'ogtt in pregnancy', 'macrosomia in diabetic pregnancy', 'caudal regression syndrome', 'sacral agenesis diabetic mother', 'infant of diabetic mother')) {
    if (cur !== 554) return { toModule: 554, reason: 'Tests gestational diabetes mellitus (GDM screening criteria, obstetric and fetal complications), belongs in OB & G: Diabetes in Pregnancy (Module 554).' };
  }

  // 553: Hypertensive Disorders in Pregnancy
  if (inQA('preeclampsia', 'eclampsia', 'pritchard regimen', 'magnesium sulfate in pregnancy', 'hellp syndrome', 'labetalol in pregnancy', 'methyldopa in pregnancy', 'gestational hypertension') ||
      (inText('convulsions in pregnancy') && inFull('magnesium sulfate', 'blood pressure'))) {
    if (cur !== 553) return { toModule: 553, reason: 'Tests gestational hypertension, preeclampsia with severe features, and eclampsia seizure prophylaxis (Prichard regimen), belongs in OB & G: Hypertensive Disorders in Pregnancy (Module 553).' };
  }

  // 552: Anemia in Pregnancy
  if (inQA('anemia in pregnancy', 'iron deficiency anemia in pregnancy', 'parenteral iron sucrose in pregnancy', 'physiological anemia of pregnancy', 'hemoglobin < 11 in pregnancy') && !inFull('pcos', 'fibroid')) {
    if (cur !== 552) return { toModule: 552, reason: 'Tests maternal anemia thresholds, physiological hemodilution and iron therapy, belongs in OB & G: Anemia in Pregnancy (Module 552).' };
  }

  // 551: Gestational Trophoblastic Diseases
  if (inQA('hydatidiform mole', 'complete mole', 'partial mole', 'choriocarcinoma', 'snowstorm appearance on usg', 'theca lutein cyst', 'beta-hcg > 100,000 in pregnancy', 'molar pregnancy suction evacuation')) {
    if (cur !== 551) return { toModule: 551, reason: 'Tests benign and malignant gestational trophoblastic disease (Complete/Partial Mole, Choriocarcinoma), belongs in OB & G: Gestational Trophoblastic Diseases (Module 551).' };
  }

  // 550: Preterm & Postterm
  if (inQA('preterm labor', 'tocolytics', 'atosiban', 'nifedipine in preterm', 'betamethasone for fetal lung maturity', 'magnesium sulfate for neuroprotection', 'post-term pregnancy', 'postdated pregnancy') && !inFull('abortion')) {
    if (cur !== 550) return { toModule: 550, reason: 'Tests preterm labor management, tocolytic pharmacotherapy, antenatal corticosteroids, and postterm pregnancy, belongs in OB & G: Preterm Labor and Postterm Pregnancy (Module 550).' };
  }

  // 549: Postpartum Haemorrhage
  if (inQA('postpartum hemorrhage', 'postpartum haemorrhage', 'pph', 'uterine atony', 'b-lynch suture', 'bakri balloon', 'carboprost in pph', 'methylergometrine in pph', 'amtsl', 'third stage of labor management')) {
    if (cur !== 549) return { toModule: 549, reason: 'Tests primary/secondary postpartum hemorrhage etiology, active management of third stage of labor (AMTSL) and surgical devascularization, belongs in OB & G: Postpartum Haemorrhage (Module 549).' };
  }

  // 548: Antepartum Hemorrhage
  if (inQA('antepartum hemorrhage', 'antepartum haemorrhage', 'aph', 'placenta previa', 'abruptio placentae', 'retroplacental clot', 'couvelaire uterus', 'painless bleeding per vaginum in third trimester', 'vasa previa')) {
    if (cur !== 548) return { toModule: 548, reason: 'Tests antepartum hemorrhage (Placenta Previa vs Abruptio Placentae, Vasa Previa), belongs in OB & G: Antepartum Hemorrhage (Module 548).' };
  }

  // 547: Abortion & MTP
  if (inQA('abortion', 'miscarriage', 'threatened abortion', 'inevitable abortion', 'incomplete abortion', 'missed abortion', 'septic abortion', 'recurrent pregnancy loss', 'cervical incompetence', 'cervical cerclage', 'shirodkar', 'mcdonald', 'medical termination of pregnancy', 'mtp act', 'mifepristone and misoprostol')) {
    if (cur !== 547) return { toModule: 547, reason: 'Tests spontaneous and induced abortions, cervical incompetence cerclage, and medical termination of pregnancy (MTP), belongs in OB & G: Abortion and Medical Termination of Pregnancy (Module 547).' };
  }

  // 546: Ectopic Pregnancy
  if (inQA('ectopic pregnancy', 'tubal pregnancy', 'ampullary ectopic', 'methotrexate for ectopic', 'salpingectomy', 'salpingostomy', 'discriminatory zone beta-hcg')) {
    if (cur !== 546) return { toModule: 546, reason: 'Tests ectopic pregnancy clinical presentation, diagnostic discriminatory zones and medical/surgical management, belongs in OB & G: Ectopic Pregnancy (Module 546).' };
  }

  // 545: Multifetal Pregnancy
  if (inQA('twin pregnancy', 'multifetal pregnancy', 'monozygotic', 'dizygotic', 'twin to twin transfusion', 'ttts', 'lambda sign in twins', 't-sign in twins', 'twin reversed arterial perfusion', 'trap sequence')) {
    if (cur !== 545) return { toModule: 545, reason: 'Tests multiple gestations, determination of chorionicity/amnionicity, and twin-twin transfusion syndrome, belongs in OB & G: Multifetal Pregnancy (Module 545).' };
  }

  // 544: Caesarean Section & VBAC
  if (inQA('caesarean section', 'cesarean delivery', 'lscs', 'vbac', 'trial of labor after cesarean', 'tolac', 'uterine rupture scar', 'pfannenstiel incision')) {
    if (cur !== 544) return { toModule: 544, reason: 'Tests cesarean section surgical indications, technique, and vaginal birth after cesarean (VBAC/TOLAC), belongs in OB & G: Caesarean Section and Vaginal Birth After Caesarean (Module 544).' };
  }

  // 543: Operative Vaginal Delivery
  if (inQA('obstetric forceps', 'forceps delivery', 'vacuum extraction', 'ventouse delivery', 'kielland forceps', 'wrigley forceps', 'chignon')) {
    if (cur !== 543) return { toModule: 543, reason: 'Tests operative vaginal delivery indications, prerequisite criteria and instruments (forceps/vacuum), belongs in OB & G: Operative Vaginal Delivery (Module 543).' };
  }

  // 542: Induction and Augmentation of Labour
  if (inQA('induction of labor', 'induction of labour', 'bishop score', 'cervical ripening', 'dinoprostone', 'misoprostol for induction', 'foley catheter induction', 'oxytocin augmentation', 'artificial rupture of membranes', 'amniotomy')) {
    if (cur !== 542) return { toModule: 542, reason: 'Tests labor induction, Bishop score evaluation, cervical ripening pharmacotherapy, and amniotomy, belongs in OB & G: Induction and Augmentation of Labour (Module 542).' };
  }

  // 541: Abnormal Labour
  if (inQA('abnormal labor', 'abnormal labour', 'dystocia', 'prolonged latent phase', 'arrest of dilatation', 'arrest of descent', 'cephalopelvic disproportion', 'cpd', 'deep transverse arrest', 'persistent occipitoposterior', 'face presentation', 'brow presentation', 'breech presentation', 'shoulder dystocia', 'mcroberts maneuver', 'woods corkscrew')) {
    if (cur !== 541) return { toModule: 541, reason: 'Tests malpresentations, malpositions, dystocia patterns, and obstetric emergency maneuvers (shoulder dystocia / McRoberts), belongs in OB & G: Abnormal Labour (Module 541).' };
  }

  // 540: Normal Labour
  if (inQA('normal labor', 'normal labour', 'stages of labor', 'mechanism of labor', 'cardinal movements of labor', 'internal rotation of head', 'crowning of fetal head', 'partogram', 'alert line', 'action line in partogram', 'episiotomy')) {
    if (cur !== 540) return { toModule: 540, reason: 'Tests normal labor mechanisms, stages of parturition, partogram monitoring, and episiotomy indications, belongs in OB & G: Normal Labour (Module 540).' };
  }

  // 538 & 539: Antenatal Imaging & Investigations
  if (inQA('crown rump length', 'crl', 'biparietal diameter in obstetric usg', 'bpd', 'middle cerebral artery doppler in fetus', 'uterine artery doppler notch', 'amniotic fluid index', 'afi', 'biophysical profile in obstetrics', 'manning biophysical')) {
    if (cur !== 539) return { toModule: 539, reason: 'Tests obstetric sonography, fetal biometry parameters (CRL/BPD), Doppler hemodynamics, and biophysical profile, belongs in OB & G: Obstetrical Imaging (Module 539).' };
  }
  if (inQA('quadruple test', 'triple test in pregnancy', 'nuchal translucency', 'chorionic villus sampling', 'cvs', 'amniocentesis', 'nipt', 'non-invasive prenatal testing', 'papp-a in first trimester')) {
    if (cur !== 538) return { toModule: 538, reason: 'Tests aneuploidy screening (combined/quadruple screening) and invasive prenatal diagnostics (CVS, amniocentesis), belongs in OB & G: Antenatal Investigations (Module 538).' };
  }

  // 537: Diagnosis of Pregnancy & Antenatal Care
  if (inQA('naegels rule', 'edd calculation', 'hegar sign', 'chadwick sign', 'goodell sign', 'antenatal care visits', 'iron folic acid in pregnancy guidelines', 'tetanus toxoid in pregnancy', 'quickening in pregnancy')) {
    if (cur !== 537) return { toModule: 537, reason: 'Tests clinical signs of pregnancy, gestational dating (Naegele rule), and WHO antenatal care contact protocols, belongs in OB & G: Diagnosis of Pregnancy and Antenatal Care (Module 537).' };
  }

  // 536: Physiological Changes
  if (inQA('physiological changes in pregnancy', 'cardiac output in pregnancy increases by', 'blood volume in pregnancy', 'plasma volume in pregnancy', 'systemic vascular resistance in pregnancy decreases', 'hydronephrosis in pregnancy physiological')) {
    if (cur !== 536) return { toModule: 536, reason: 'Tests maternal systemic physiological and hemodynamic adaptations during gestation, belongs in OB & G: Physiological Changes During Pregnancy (Module 536).' };
  }

  // 534: Placenta & Fetal Membranes
  if (inQA('placenta structure', 'syncytiotrophoblast', 'cytotrophoblast', 'human chorionic gonadotropin hcg synthesis', 'human placental lactogen', 'hpl', 'wharton jelly', 'single umbilical artery', 'polyhydramnios causes', 'oligohydramnios causes')) {
    if (cur !== 534) return { toModule: 534, reason: 'Tests placental structure, endocrinology, umbilical cord histology, and amniotic fluid volume disorders, belongs in OB & G: Placenta and Fetal Membranes (Module 534).' };
  }

  // 533: Pelvis & Fetal Skull
  if (inQA('fetal skull', 'suboccipitobregmatic', 'occipitofrontal diameter', 'anterior fontanelle', 'bregma', 'posterior fontanelle', 'lambda', 'obstetric conjugate', 'true conjugate', 'diagonal conjugate', 'gynecoid pelvis', 'android pelvis', 'anthropoid pelvis', 'platypelloid pelvis')) {
    if (cur !== 533) return { toModule: 533, reason: 'Tests maternal pelvimetry, pelvis classification, and fetal skull landmarks/diameters, belongs in OB & G: Maternal Pelvis and Fetal Skull (Module 533).' };
  }

  // 531: Anatomy of Pelvic Organs
  if (inQA('perineal body', 'levator ani', 'uterine artery crosses ureter', 'blood supply of uterus', 'ovarian artery origin', 'lymphatic drainage of cervix', 'lymphatic drainage of vulva', 'round ligament of uterus', 'cardinal ligament of mackenrodt', 'broad ligament')) {
    if (cur !== 531) return { toModule: 531, reason: 'Tests female pelvic surgical anatomy, ligaments, pelvic floor muscles, and vascular/lymphatic topography, belongs in OB & G: Anatomy of Female Pelvic Organs (Module 531).' };
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

console.log(`Audited ${questions.length} questions for OB & G.`);
console.log(`Flagged ${moves.length} moves for relocation (${((moves.length / questions.length) * 100).toFixed(1)}%).`);

const out = {
  subject: 'OB & G',
  totalQuestions: questions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_ob_g.json', JSON.stringify(out, null, 2));
console.log('Saved findings to tools/audit_deep_ob_g.json');
process.exit(0);
