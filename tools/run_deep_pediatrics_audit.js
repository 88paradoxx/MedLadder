const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/live_fresh_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

console.log(`Loaded ${rawQuestions.length} live questions for Pediatrics.`);

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
  // Orthopaedics: Congenital Malformations & Pediatric Ortho (673, 675, 676)
  if (inQA('barlow', 'ortolani') || (inQA('galeazzi') && inFull('hip'))) {
    return { toModule: 676, reason: 'Barlow/Ortolani/Galeazzi maneuvers for developmental dysplasia of the hip (DDH) belong to Orthopaedics: Congenital Malformations, Perthes Disease and SCFE (Module 676).' };
  }
  if ((inQA('perthes', 'legg-calve') || inAns('perthes')) && !inFull('chromosome')) {
    return { toModule: 676, reason: 'Legg-Calve-Perthes disease of femoral head belongs to Orthopaedics: Congenital Malformations, Perthes Disease and SCFE (Module 676).' };
  }
  if (inQA('scfe', 'slipped capital femoral') && !inFull('chromosome')) {
    return { toModule: 676, reason: 'Slipped Capital Femoral Epiphysis (SCFE) belongs to Orthopaedics: Congenital Malformations, Perthes Disease and SCFE (Module 676).' };
  }
  if (inQA('ctev', 'clubfoot', 'talipes equinovarus') || (inQA('ponseti') && inFull('casting'))) {
    return { toModule: 675, reason: 'Congenital Talipes Equinovarus (CTEV / Clubfoot) and Ponseti method belong to Orthopaedics: CTEV, Genu Varum and Valgum (Module 675).' };
  }
  if (inQA('greenstick fracture', 'torus fracture', 'buckle fracture')) {
    return { toModule: 673, reason: 'Pediatric bone fracture patterns (greenstick/torus) belong to Orthopaedics: General Principles of Fractures (Module 657) or Paediatric Orthopaedics (Module 673).' };
  }

  // PSM: Health indicators / Public health programs
  if (inQA('dale is replaced by') || inQA('hale ') || (inText('healthy life expectancy') && inAns('hale'))) {
    return { toModule: 356, reason: 'Health-Adjusted Life Expectancy (HALE) indicator belongs to PSM: Indicators of Health (Module 356).' };
  }
  if (inQA('net reproduction rate') || (inText('number of daughters a newborn girl') && inFull('reproduction'))) {
    return { toModule: 357, reason: 'Net Reproduction Rate (NRR) and demographic fertility indices belong to PSM: Demography and Family Planning (Module 357).' };
  }
  if (inQA('remand homes', 'juvenile justice', 'observation home')) {
    return { toModule: 397, reason: 'Juvenile remand and observation homes belong to PSM: Social Problems / Vulnerable Groups (Module 397).' };
  }
  if (inQA('mission indradhanush') && inQA('routine', 'coverage')) {
    return { toModule: 405, reason: 'Mission Indradhanush national immunization programmatic coverage belongs to PSM: National Health Programmes (Module 405).' };
  }

  // Surgery: Testes / Scrotum
  if (inText('testicular pain') && inText('exploration of the testis') && inFull('torsion')) {
    return { toModule: 520, reason: 'Acute testicular torsion requiring urgent surgical exploration of testis belongs to Surgery: Testes and Scrotum (Module 520).' };
  }

  // Microbiology: Arboviruses
  if (inQA('zika') && inText('hofbauer')) {
    return { toModule: 210, reason: 'Transplacental transmission of Zika virus via placental Hofbauer cells belongs to Microbiology: Arboviruses (Module 210).' };
  }

  // 2. INTRA-PEDIATRICS SPECIALTY ROUTING

  // 604: Solid Neoplasms of Childhood (Wilms, Neuroblastoma, Retinoblastoma, Hepatoblastoma, Medulloblastoma)
  if (inQA('wilms', 'nephroblastoma', 'neuroblastoma', 'retinoblastoma', 'hepatoblastoma', 'medulloblastoma') ||
      (inText('abdominal mass') && inText('crosses midline') && inFull('calcification')) ||
      (inText('abdominal mass') && inText('does not cross') && inFull('flank')) ||
      inQA('leukocoria', 'cat eye reflex') || inQA('homer wright') || inQA('flexner-wintersteiner') || inQA('n-myc')) {
    if (cur !== 604) return { toModule: 604, reason: 'Tests childhood solid embryonal tumors (Wilms tumor, Neuroblastoma, Retinoblastoma) and oncology markers, belongs in Pediatrics: Solid Neoplasms of Childhood (Module 604).' };
  }

  // 605: Paediatric Rheumatology (Kawasaki, HSP, JIA/Still, Rheumatic Fever)
  if (inQA('kawasaki', 'henoch-schonlein', 'iga vasculitis', 'juvenile idiopathic arthritis', 'still disease', 'rheumatic fever', 'jones criteria', 'strawberry tongue', 'coronary artery aneurysm') ||
      (inText('fever for 5 days') && inFull('conjunctivitis') && inFull('strawberry tongue')) ||
      (inText('palpable purpura') && inFull('buttocks') && inFull('abdominal pain'))) {
    if (cur !== 605) return { toModule: 605, reason: 'Tests pediatric vasculitis and connective tissue disorders (Kawasaki disease, Henoch-Schonlein purpura, JIA, Rheumatic fever), belongs in Pediatrics: Paediatric Rheumatology (Module 605).' };
  }

  // 601: CAH and Related Disorders
  if (inQA('congenital adrenal hyperplasia', '21-hydroxylase', '17-hydroxyprogesterone', 'ambiguous genitalia', 'salt wasting', 'cyp21a2') ||
      (inText('female infant') && inText('ambiguous genitalia') && inFull('hyponatremia') && inFull('hyperkalemia'))) {
    if (cur !== 601) return { toModule: 601, reason: 'Tests congenital adrenal hyperplasia (21-hydroxylase deficiency, ambiguous genitalia, salt wasting crisis), belongs in Pediatrics: Congenital Adrenal Hyperplasia (Module 601).' };
  }

  // 600: Thyroid Disorders (Congenital Hypothyroidism, Cretinism)
  if (inQA('congenital hypothyroidism', 'cretinism', 'large posterior fontanelle', 'macroglossia', 'umbilical hernia') && inFull('hypothyroid', 'tsh')) {
    if (cur !== 600) return { toModule: 600, reason: 'Tests congenital hypothyroidism screening and manifestations, belongs in Pediatrics: Disorders of Thyroid (Module 600).' };
  }

  // 602 & 603: Pituitary & Puberty
  if (inQA('precocious puberty', 'mccune-albright', 'delayed puberty', 'kallmann', 'tanner stage', 'thelarche', 'pubarche', 'adrenarche', 'menarche')) {
    if (cur !== 603) return { toModule: 603, reason: 'Tests pubertal staging and disorders of precocious or delayed puberty, belongs in Pediatrics: Disorders of Puberty (Module 603).' };
  }
  if (inQA('growth hormone deficiency', 'pituitary dwarfism', 'somatotropin', 'igf-1') && inFull('deficiency', 'stimulation')) {
    if (cur !== 602) return { toModule: 602, reason: 'Tests pituitary growth hormone deficiency and hypopituitarism, belongs in Pediatrics: Disorders of the Pituitary Gland (Module 602).' };
  }

  // 599: Paediatric Nephrology (Nephrotic, PSGN, HUS, PUV, VUR)
  if (inQA('minimal change disease', 'nephrotic syndrome', 'poststreptococcal glomerulonephritis', 'psgn', 'hemolytic uremic syndrome', 'posterior urethral valve', 'vesicoureteral reflux', 'mcns') ||
      (inText('edema') && inText('massive proteinuria') && inFull('albumin')) ||
      (inText('cola-colored urine') && inFull('streptococcal') && inFull('c3')) ||
      inQA('microangiopathic hemolytic anemia', 'thrombocytopenia', 'acute renal failure') && inFull('diarrhea', 'hus')) {
    if (cur !== 599) return { toModule: 599, reason: 'Tests childhood glomerulopathies, nephrotic syndrome, PSGN, HUS, or congenital urinary anomalies (PUV/VUR), belongs in Pediatrics: Paediatric Nephrology (Module 599).' };
  }

  // 597 & 598: Congenital Heart Diseases
  // Cyanotic: 598
  if (inQA('tetralogy of fallot', 'tof', 'transposition of great arteries', 'tga', 'tricuspid atresia', 'ebstein anomaly', 'truncus arteriosus', 'tapvc', 'total anomalous pulmonary') ||
      inQA('boot-shaped heart', 'coeur en sabot', 'egg-on-string', 'snowman sign', 'tet spell', 'hypercyanotic spell')) {
    if (cur !== 598) return { toModule: 598, reason: 'Tests cyanotic congenital heart diseases (TOF, TGA, TAPVC, Ebstein anomaly, tet spells), belongs in Pediatrics: Cyanotic Congenital Heart Diseases (Module 598).' };
  }
  // Acyanotic: 597
  if (inQA('ventricular septal defect', 'vsd', 'atrial septal defect', 'asd', 'patent ductus arteriosus', 'pda', 'coarctation of aorta', 'endocardial cushion defect', 'avsd', 'eisenmenger') ||
      inQA('machinery murmur', 'fixed splitting of s2', 'radio-femoral delay', 'rib notching', 'figure of 3 sign')) {
    if (cur !== 597) return { toModule: 597, reason: 'Tests acyanotic congenital heart defects (VSD, ASD, PDA, Coarctation of aorta), belongs in Pediatrics: Acyanotic Congenital Heart Diseases (Module 597).' };
  }

  // 596: Fetal Circulation
  if (inQA('ductus venosus', 'foramen ovale', 'ductus arteriosus in fetus', 'fetal circulation', 'umbilical vein', 'umbilical artery blood flow', 'transitional circulation')) {
    if (cur !== 596) return { toModule: 596, reason: 'Tests fetal circulatory shunts and transitional hemodynamic adaptations at birth, belongs in Pediatrics: Fetal Circulation (Module 596).' };
  }

  // 594 & 595: Respiratory Disorders
  // Neonatal Respiratory: 594
  if (inQA('hyaline membrane disease', 'surfactant deficiency', 'respiratory distress syndrome of newborn', 'transient tachypnea of newborn', 'ttn', 'meconium aspiration syndrome', 'mas', 'apnea of prematurity', 'bronchopulmonary dysplasia', 'bpd', 'persistent pulmonary hypertension of newborn', 'pphn') ||
      (inFull('ground glass appearance', 'air bronchogram') && inFull('preterm', 'premature infant'))) {
    if (cur !== 594) return { toModule: 594, reason: 'Tests neonatal respiratory pathology (RDS/surfactant, TTN, MAS, bronchopulmonary dysplasia), belongs in Pediatrics: Neonatal Respiratory Disorders (Module 594).' };
  }
  // Childhood Respiratory: 595
  if (inQA('croup', 'laryngotracheobronchitis', 'acute epiglottitis', 'bronchiolitis', 'steeple sign', 'thumbprint sign', 'cystic fibrosis', 'sweat chloride', 'cftr', 'foreign body aspiration in child', 'barking cough') ||
      (inText('drooling') && inText('tripod position') && inFull('epiglottis'))) {
    if (cur !== 595) return { toModule: 595, reason: 'Tests pediatric lower/upper airway disease (croup, epiglottitis, bronchiolitis, cystic fibrosis, foreign body airway obstruction), belongs in Pediatrics: Childhood Respiratory Disorders (Module 595).' };
  }

  // 593: Disorders of Liver
  if (inQA('biliary atresia', 'kasai', 'neonatal cholestasis', 'triangular cord sign', 'crigler-najjar', 'gilbert syndrome in child', 'neonatal jaundice conjugated')) {
    if (cur !== 593) return { toModule: 593, reason: 'Tests neonatal cholestasis and pediatric hepatobiliary diseases (biliary atresia, Kasai procedure), belongs in Pediatrics: Disorders of the Liver (Module 593).' };
  }

  // 591 & 592: GI Disorders
  // Surgical GI: 591
  if (inQA('hypertrophic pyloric stenosis', 'chps', 'intussusception', 'hirschsprung', 'imperforate anus', 'anorectal malformation', 'congenital diaphragmatic hernia', 'meckel diverticulum', 'malrotation', 'volvulus neonatorum', 'ladd') ||
      (inText('projectile non-bilious vomiting') && inFull('olive')) ||
      (inText('red currant jelly') && inFull('target sign')) ||
      (inText('delayed passage of meconium') && inFull('ganglion cells'))) {
    if (cur !== 591) return { toModule: 591, reason: 'Tests congenital and surgical gastrointestinal anomalies (pyloric stenosis, intussusception, Hirschsprung disease, anorectal malformation, CDH, Meckel), belongs in Pediatrics: Surgical GI Disorders (Module 591).' };
  }
  // Medical GI: 592
  if (inQA('celiac disease', 'cow milk protein allergy', 'cmpa', 'cyclic vomiting syndrome', 'tTG-IgA', 'anti-endomysial', 'duodenal biopsy villous atrophy')) {
    if (cur !== 592) return { toModule: 592, reason: 'Tests non-surgical malabsorptive and pediatric gastroenterology conditions (celiac disease, CMPA, cyclic vomiting), belongs in Pediatrics: Medical GI Disorders (Module 592).' };
  }

  // 586 & 587: Inborn Errors of Metabolism
  // Amino Acids: 586
  if (inQA('phenylketonuria', 'pku', 'phenylalanine hydroxylase', 'maple syrup urine', 'msud', 'alkaptonuria', 'homocystinuria', 'tyrosinemia', 'guthrie test', 'mousy odor')) {
    if (cur !== 586) return { toModule: 586, reason: 'Tests inborn errors of amino acid metabolism (PKU, MSUD, alkaptonuria, homocystinuria), belongs in Pediatrics: Metabolic Disorders of Amino Acids (Module 586).' };
  }
  // Urea Cycle, Complex Molecules & Carbohydrates: 587
  if (inQA('galactosemia', 'von gierke', 'pompe disease', 'gaucher', 'niemann-pick', 'tay-sachs', 'hurler', 'hunter syndrome', 'mucopolysaccharidosis', 'galt deficiency', 'crumpled tissue paper', 'cherry red spot', 'glycogen storage disease')) {
    if (cur !== 587) return { toModule: 587, reason: 'Tests disorders of carbohydrate, urea cycle and lysosomal storage diseases (galactosemia, GSD, Gaucher, Niemann-Pick, Hurler), belongs in Pediatrics: Metabolic Disorders of Urea Cycle, Complex Molecules, and Carbohydrates (Module 587).' };
  }

  // 585: Chromosomal Disorders
  if (inQA('down syndrome', 'trisomy 21', 'edwards syndrome', 'trisomy 18', 'patau syndrome', 'trisomy 13', 'turner syndrome', '45,x', 'klinefelter', '47,xxy', 'cri-du-chat', 'prader-willi', 'angelman', 'fragile x', 'robertsonian translocation', 'simian crease', 'rocker bottom feet') ||
      (inText('karyotype') && inFull('chromosom'))) {
    if (cur !== 585) return { toModule: 585, reason: 'Tests chromosomal aneuploidies and microdeletion syndromes (Down, Edwards, Turner, Klinefelter, Fragile X), belongs in Pediatrics: Chromosomal Disorders (Module 585).' };
  }

  // 584: Fluid and Electrolyte Disorders
  if (inQA('dehydration', 'plan a', 'plan b', 'plan c', 'oral rehydration salts', 'ors formula', 'reduced osmolarity ors', 'hypokalemia in diarrhea', 'hypernatremic dehydration', 'skin pinch') && !inFull('burn')) {
    if (cur !== 584) return { toModule: 584, reason: 'Tests pediatric dehydration staging, WHO ORS composition and fluid resuscitation plans, belongs in Pediatrics: Fluid and Electrolyte Disorders (Module 584).' };
  }

  // 582 & 583: Vitamin Deficiencies
  // Fat-Soluble: 582
  if (inQA('vitamin a deficiency', 'bitot spots', 'keratomalacia', 'xerophthalmia', 'rickets', 'rachitic rosary', 'craniotabes', 'harrison sulcus', 'cupping and fraying', 'vitamin d deficiency in child', 'hemorrhagic disease of newborn', 'hdn') && inFull('vitamin', 'rickets', 'bone')) {
    if (cur !== 582) return { toModule: 582, reason: 'Tests fat-soluble vitamin deficiencies (Vitamin A xerophthalmia, Vitamin D rickets, Vitamin K HDN), belongs in Pediatrics: Deficiency of Fat Soluble Vitamins (Module 582).' };
  }
  // Water-Soluble & Trace: 583
  if (inQA('scurvy', 'vitamin c deficiency', 'pelkan spur', 'wimberger ring', 'beriberi in infant', 'acrodermatitis enteropathica', 'zinc deficiency', 'menkes disease', 'pellagra in child')) {
    if (cur !== 583) return { toModule: 583, reason: 'Tests water-soluble vitamin and trace element deficiencies (Scurvy/Vit C, infantile beriberi, zinc acrodermatitis), belongs in Pediatrics: Deficiency of Water-soluble Vitamins & Trace Elements (Module 583).' };
  }

  // 581: Protein Energy Malnutrition
  if (inQA('kwashiorkor', 'marasmus', 'protein energy malnutrition', 'severe acute malnutrition', 'sam', 'f-75', 'f-100', 'flaky paint dermatosis', 'flag sign', 'muac < 115', 'edema in malnutrition')) {
    if (cur !== 581) return { toModule: 581, reason: 'Tests severe acute malnutrition (Kwashiorkor, Marasmus, WHO SAM stabilization and rehabilitation), belongs in Pediatrics: Protein Energy Malnutrition (Module 581).' };
  }

  // 580: Nutrition and Breastfeeding
  if (inQA('breastfeeding', 'colostrum', 'human milk vs cow milk', 'exclusive breastfeeding', 'contraindication to breastfeeding', 'weaning', 'complementary feeding', 'whey to casein ratio') && !inFull('mastitis', 'abscess')) {
    if (cur !== 580) return { toModule: 580, reason: 'Tests infant nutrition, breast milk composition, physiology of lactation and weaning guidelines, belongs in Pediatrics: Nutrition and Breastfeeding (Module 580).' };
  }

  // 578 & 579: Milestones & Growth
  // Milestones: 578
  if (inQA('milestone', 'pincer grasp', 'social smile', 'stranger anxiety', 'toilet training', 'copies circle', 'copies square', 'copies triangle', 'stairs', 'tricycle', 'monosyllables', 'bisyllables') ||
      (inText('months old child') && inText('can') && inFull('motor', 'developmental'))) {
    if (cur !== 578) return { toModule: 578, reason: 'Tests gross motor, fine motor, language, and personal-social milestone achievement, belongs in Pediatrics: Developmental Milestones (Module 578).' };
  }
  // Facets of Growth: 579
  if (inQA('dentition', 'eruption of teeth', 'bone age', 'ossification center', 'head circumference', 'chest circumference', 'weight doubles at', 'weight triples at', 'height doubles at', 'short stature evaluation', 'upper to lower segment ratio')) {
    if (cur !== 579) return { toModule: 579, reason: 'Tests anthropometry, dental development, skeletal maturation, and growth velocity indices, belongs in Pediatrics: Facets of Growth and Development (Module 579).' };
  }

  // 577: Apgar score and Neonatal Resuscitation
  if (inQA('apgar score', 'neonatal resuscitation', 'nrp algorithm', 'positive pressure ventilation in newborn', 'chest compressions in newborn', 'epinephrine in neonatal resuscitation', 't-piece resuscitator', 'compression to ventilation ratio 3:1')) {
    if (cur !== 577) return { toModule: 577, reason: 'Tests Apgar scoring metrics and step-wise Neonatal Resuscitation Program (NRP) algorithms, belongs in Pediatrics: Apgar score and Neonatal Resuscitation (Module 577).' };
  }

  // 576: Diseases in Neonates requiring Special Care
  if (inQA('necrotizing enterocolitis', 'nec', 'pneumatosis intestinalis', 'bell staging', 'neonatal sepsis', 'early onset sepsis in newborn', 'retinopathy of prematurity', 'rop', 'hypoxic ischemic encephalopathy', 'hie', 'therapeutic hypothermia in neonate', 'intraventricular hemorrhage in newborn', 'ivh', 'kernicterus', 'exchange transfusion criteria', 'phototherapy in neonatal jaundice') && !inFull('normal newborn')) {
    if (cur !== 576) return { toModule: 576, reason: 'Tests pathological newborn conditions requiring NICU care (NEC, neonatal sepsis, ROP, HIE, severe hyperbilirubinemia/kernicterus), belongs in Pediatrics: Diseases in Neonates requiring Special Care (Module 576).' };
  }

  // 575: Basics of Neonatology
  if (inQA('new ballard score', 'gestational age assessment', 'normal birth weight', 'physiological jaundice of newborn', 'erythema toxicum neonatorum', 'mongolian spot', 'caput succedaneum', 'cephalhematoma', 'transitional stool', 'cord care', 'kangaroo mother care', 'kmc')) {
    if (cur !== 575) return { toModule: 575, reason: 'Tests normal newborn examination, Ballard gestational assessment, birth trauma (caput/cephalhematoma), and basic neonate care, belongs in Pediatrics: Basics of Neonatology and Routine Newborn Care (Module 575).' };
  }

  // 606 & 607: Hematology & Anemias
  if (inQA('thalassemia major', 'sickle cell anemia', 'iron deficiency anemia in infant', 'hereditary spherocytosis in child', 'diamond-blackfan', 'fanconi anemia', 'physiological anemia of infancy') ||
      inQA('chipmunk facies', 'crew cut appearance', 'vaso-occlusive crisis in child', 'dactylitis')) {
    if (cur !== 607) return { toModule: 607, reason: 'Tests pediatric red cell disorders, hemoglobinopathies (thalassemia, sickle cell) and hemolytic anemias, belongs in Pediatrics: Paediatric Anemias (Module 607).' };
  }
  if (inQA('immune thrombocytopenic purpura', 'itp in child', 'hemophilia a', 'hemophilia b', 'von willebrand disease', 'factor viii deficiency', 'factor ix deficiency') && !inFull('adult')) {
    if (cur !== 606) return { toModule: 606, reason: 'Tests pediatric bleeding and coagulopathy disorders (ITP, Hemophilia, vWD), belongs in Pediatrics: Paediatric Hematology (Module 606).' };
  }

  // 588, 589, 590: Infections
  if (inQA('pediatric hiv', 'vertical transmission of hiv', 'polio eradication', 'acute flaccid paralysis', 'opv vs ipv', 'vapp')) {
    if (cur !== 588) return { toModule: 588, reason: 'Tests pediatric HIV/AIDS and poliomyelitis/AFP surveillance, belongs in Pediatrics: Polio and AIDS (Module 588).' };
  }
  if (inQA('measles in child', 'kopek spots', 'koplik spots', 'mumps parotitis', 'rubella congenital', 'roseola infantum', 'erythema infectiosum', 'fifth disease', 'varicella chickenpox in child')) {
    if (cur !== 590) return { toModule: 590, reason: 'Tests viral exanthems of childhood (Measles, Mumps, Rubella, Roseola, Fifth disease, Chickenpox), belongs in Pediatrics: Measles, Mumps, Rubella and Other Viral Infections (Module 590).' };
  }
  if (inQA('congenital syphilis', 'congenital cmv', 'congenital toxoplasmosis', 'congenital rubella syndrome', 'diphtheria in child', 'pertussis whooping cough', 'neonatal tetanus', 'torch infection') ||
      inQA('snuffles', 'saddle nose', 'hutchinson teeth', 'blueberry muffin')) {
    if (cur !== 589) return { toModule: 589, reason: 'Tests congenital TORCH infections, pertussis, diphtheria, and neonatal bacterial infections, belongs in Pediatrics: Paediatric Bacterial and Parasitic Infections (Module 589).' };
  }

  // 608: Mixed / Immunization Schedule
  if (inQA('national immunization schedule', 'pentavalent vaccine', 'bcg scar', 'rotavirus vaccine', 'cold chain equipment', 'ice lined refrigerator', 'sids', 'sudden infant death', 'brue', 'child abuse', 'non-accidental injury')) {
    if (cur !== 608) return { toModule: 608, reason: 'Tests national immunization schedules, vaccine handling/cold chain, and miscellaneous pediatric emergency/forensic topics, belongs in Pediatrics: Mixed / Miscellaneous Topics (Module 608).' };
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

console.log(`Audited ${questions.length} questions for Pediatrics.`);
console.log(`Flagged ${moves.length} moves for relocation (${((moves.length / questions.length) * 100).toFixed(1)}%).`);

const out = {
  subject: 'Pediatrics',
  totalQuestions: questions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_pediatrics.json', JSON.stringify(out, null, 2));
console.log('Saved findings to tools/audit_deep_pediatrics.json');
process.exit(0);
