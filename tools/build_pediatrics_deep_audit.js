const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/raw_pediatrics.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));
const qMap = new Map(rawQuestions.map(q => [q.id, q]));

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function hasWord(text, word) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(text);
}

const seenIds = new Set();
const moves = [];

function recordMove(id, toMod, reason) {
  if (seenIds.has(id)) {
    console.error(`DUPLICATE MOVE FOR ID: ${id}`);
    return;
  }
  const q = qMap.get(id);
  if (!q) {
    console.error(`ERROR: Question ID ${id} not found in raw questions!`);
    return;
  }
  if (q.module_id === toMod) {
    console.warn(`WARN: Question ID ${id} is already in module ${toMod}!`);
    return;
  }
  if (!modMap.has(toMod)) {
    console.error(`ERROR: Target module ${toMod} does not exist in 740 modules!`);
    return;
  }
  seenIds.add(id);
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: toMod,
    reason: reason
  });
}

// =========================================================================
// SECTION 1: CROSS-SUBJECT MOVES (OUTSIDE PEDIATRICS)
// =========================================================================

// PSM / Community Medicine
recordMove(23290, 356, 'Health-Adjusted Life Expectancy (HALE) replacing Disability-Adjusted Life Expectancy (DALE) is a standard population health indicator belonging to PSM (Module 356: Indicators of Health).');
recordMove(23335, 357, 'Net Reproduction Rate (NRR) and demographic fertility indices belong to PSM (Module 357: Demography and Family Planning).');
recordMove(23307, 397, 'Remand homes and juvenile reformatory placement homes belong to PSM (Module 397: Social Problems / Vulnerable Groups).');
recordMove(23973, 405, 'Mission Indradhanush national immunization programmatic coverage belongs to PSM (Module 405: National Health Programmes).');
recordMove(24017, 405, 'Intensified Mission Indradhanush (IMI 5.0) target age groups and programmatic operational guidelines belong to PSM (Module 405: National Health Programmes).');
recordMove(23514, 356, 'Global mortality statistics and leading causes of death in under-5 children belong to PSM (Module 356: Indicators of Health).');
recordMove(24581, 355, 'Florence Nightingale quotation on the secret of national health lying in homes belongs to PSM (Module 355: Concept of Health and Disease).');
recordMove(24585, 389, 'Heat stress index comfort threshold ranges belong to PSM (Module 389: Meteorological Environment, Radiation and Noise).');
recordMove(24586, 405, 'Mid-Day Meal Scheme daily cereal nutritional norms for primary students belong to PSM (Module 405: National Health Programmes).');

// Microbiology
recordMove(23522, 210, 'Transplacental transmission of Zika virus via placental Hofbauer cells causing microcephaly belongs to Microbiology (Module 210: Arboviruses and Picorna Viruses).');

// Obstetrics & Gynaecology
recordMove(9377, 549, 'Dopamine agonist cabergoline used for therapeutic lactation suppression in postpartum mothers belongs to OB & G (Module 549: Postpartum Haemorrhage and Puerperal Care).');
recordMove(24168, 534, 'Amniotic band sequence and limb constriction ring deformations resulting from rupture of fetal membranes belong to OB & G (Module 534: Placenta and Fetal Membranes).');
recordMove(24184, 550, 'Antenatal dexamethasone dosing schedule (6 mg IM 12-hourly for 4 doses) for prevention of prematurity-related RDS belongs to OB & G (Module 550: Preterm Labor and Postterm Pregnancy).');

// Surgery / Pediatric Surgery
recordMove(24251, 520, 'Acute testicular pain requiring emergency scrotal exploration to salvage a torted testis belongs to Surgery (Module 520: Testes and Scrotum).');
recordMove(23401, 504, 'Strangulated inguinal hernia with irreducibility and ischemic risk in a child belongs to Surgery (Module 504: Hernia).');
recordMove(23570, 483, 'Rule of 10s surgical timing for cheiloplasty in infant cleft lip belongs to Surgery (Module 483: Paediatric Surgery).');
recordMove(24145, 523, 'Inhalational thermal injury and flame exposure predicting burn-related mortality belongs to Surgery (Module 523: Burns).');
recordMove(23972, 521, 'Pediatric Glasgow Coma Scale (GCS) and head injury triage criteria belong to Surgery (Module 521: Head Injury).');

// Orthopaedics
recordMove(23586, 677, 'Osteogenesis imperfecta presenting with blue sclera, fragile bones, and recurrent fractures belongs to Orthopaedics (Module 677: Metabolic Bone Diseases in Children).');
recordMove(23925, 677, 'Osteogenesis imperfecta with extreme bone fragility and blue sclera belongs to Orthopaedics (Module 677: Metabolic Bone Diseases in Children).');
recordMove(24322, 672, 'Acute monoarticular limp and hip joint pain in a young child due to septic arthritis belongs to Orthopaedics (Module 672: Infections of the Bone / Septic Arthritis).');

// Dermatology
recordMove(24571, 636, 'Infantile scabies presenting with nocturnal pruritus, burrows, and topical permethrin management belongs to Dermatology (Module 636: Scabies and Pediculosis).');
recordMove(23591, 649, 'Xeroderma pigmentosum nucleotide excision repair defect and cutaneous photosensitivity belong to Dermatology (Module 649: Photodermatoses).');

// Anatomy
recordMove(23608, 1, 'Caudal regression and sirenomelia resulting from defective gastrulation belong to Anatomy (Module 1: Gametogenesis and Early Embryology).');
recordMove(24580, 33, 'Intramuscular injection landmark in the superolateral quadrant of the gluteus maximus to avoid the sciatic nerve belongs to Anatomy (Module 33: Gluteal Region and Back of Thigh).');

// Ophthalmology
recordMove(23609, 345, 'Congenital nasolacrimal duct obstruction (Hasner valve non-canalization) causing epiphora belongs to Ophthalmology (Module 345: Diseases of the Lacrimal Apparatus).');
recordMove(23427, 340, 'Ranibizumab anti-VEGF therapy in zone-based management of Retinopathy of Prematurity belongs to Ophthalmology (Module 340: Diseases of Retina).');

// Adult Medicine / Cardiology / Nephrology
recordMove(23519, 415, 'Hypertrophic cardiomyopathy (HOCM) as the leading cause of sudden cardiac arrest in young competitive athletes belongs to Medicine (Module 415: Cardiomyopathies & Myocarditis).');
recordMove(24407, 441, 'HLA-B27 enthesitis and adolescent axial sacroiliitis in ankylosing spondylitis belong to Medicine (Module 441: Rheumatoid Arthritis and Spondyloarthropathies).');
recordMove(23894, 453, 'Nephritic syndrome triad of cola-colored urine, oliguria, hypertension, and low C3 post-streptococcal glomerulonephritis belongs to Medicine (Module 453: Glomerular Diseases) / Pediatrics 599.');

// Radiology
recordMove(23868, 721, 'Iohexol non-ionic low-osmolar iodinated radiographic contrast media properties belong to Radiology (Module 721: Contrast Media in Radiology).');


// =========================================================================
// SECTION 2: INTRA-PEDIATRICS MOVES
// =========================================================================

// --- Moves from Module 575 (Basics of Neonatology and Routine Newborn Care) ---
recordMove(23288, 597, 'Pre- and post-ductal SpO2 monitoring for differential cyanosis in persistent patent ductus arteriosus belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23289, 576, 'Venous hematocrit cutoff of 65% diagnostic of neonatal polycythemia requiring partial exchange transfusion belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23293, 604, 'Dinutuximab anti-GD2 monoclonal antibody immunotherapy for high-risk neuroblastoma belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23294, 595, 'Acute foreign body aspiration with unilateral hyperinflation and mediastinal shift requiring rigid bronchoscopy belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23296, 608, 'Infantile motor delay with family history of muscular dystrophy requiring serum creatine kinase testing belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23297, 579, 'Physical growth milestone of birth weight doubling by 5 to 6 months belongs to Module 579 (Facets of Growth and Development).');
recordMove(23299, 607, 'Neonatal hemolytic jaundice due to hereditary spherocytosis diagnosed by osmotic fragility testing belongs to Module 607 (Paediatric Anemias).');
recordMove(23304, 591, 'Congenital pyloric atresia presenting with non-bilious projectile emesis on day 1 of life belongs to Module 591 (Surgical GI Disorders).');
recordMove(23306, 589, 'Household contact chemoprophylaxis with erythromycin for Corynebacterium diphtheriae exposure belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23308, 582, 'IAP recommended routine Vitamin D3 daily supplementation of 400 IU/day in infants belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23313, 576, 'Sarnat and Sarnat clinical staging for Hypoxic Ischemic Encephalopathy (HIE) belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23315, 576, 'Neonatal hypoglycemia in an infant of a diabetic mother managed with IV dextrose bolus belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23318, 576, 'Prolonged neonatal unconjugated hyperbilirubinemia in Gilbert syndrome belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23319, 585, '22q11.2 microdeletion in DiGeorge syndrome causing cleft palate, dysmorphism, and hypocalcemia belongs to Module 585 (Chromosomal Disorders).');
recordMove(23320, 608, 'Annual influenza vaccination indications in pediatric high-risk groups belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23321, 595, 'Emergency airway clearance with alternating back blows and chest thrusts for foreign body choking in infants belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23322, 585, 'DiGeorge syndrome microdeletion on chromosome 22q11.2 belongs to Module 585 (Chromosomal Disorders).');
recordMove(23323, 577, 'Heart rate cutoff <60 bpm indicating initiation of chest compressions during neonatal resuscitation belongs to Module 577 (Apgar score and Neonatal Resuscitation).');
recordMove(23324, 599, 'Urine-to-plasma creatinine ratio <40 distinguishing acute intrinsic tubular injury from prerenal azotemia belongs to Module 599 (Paediatric Nephrology).');
recordMove(23326, 599, 'Multicystic dysplastic kidney (MCDK) as the most common congenital cystic renal mass in a neonate belongs to Module 599 (Paediatric Nephrology).');
recordMove(23333, 590, 'Congenital Cytomegalovirus (CMV) infection presenting with hepatomegaly and sensorineural hearing loss belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23336, 607, 'Hereditary spherocytosis presenting with early neonatal hyperbilirubinemia confirmed by osmotic fragility belongs to Module 607 (Paediatric Anemias).');
recordMove(23347, 576, 'Neonatal hypoglycemia secondary to depleted hepatic glycogen stores in SGA infants belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23351, 592, 'Physiological gastroesophageal reflux (GER) in infants exacerbated by overfeeding belongs to Module 592 (Medical GI Disorders).');
recordMove(23352, 607, 'Nutritional iron deficiency anemia in a 2-year-old child managed with oral iron supplements belongs to Module 607 (Paediatric Anemias).');
recordMove(23372, 597, 'Subaortic discrete stenosis causing left ventricular outflow tract obstruction belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23374, 590, 'Congenital CMV maternal serology and risk of fetal transmission belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23377, 579, 'Physical growth parameter of birth weight quadrupling at 24 months of age belongs to Module 579 (Facets of Growth and Development).');
recordMove(23381, 576, 'Modified Bell staging Stage 2B of necrotizing enterocolitis (NEC) belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23407, 576, 'Primary peritoneal drainage (PPD) for perforated Stage IIIB NEC in unstable ELBW infants belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23409, 594, 'Preterm neonate with apnea on caffeine citrate managed with bag-mask ventilation belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23428, 576, 'Hematologic indices and immature platelet fraction in neonatal sepsis evaluation belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23451, 577, 'Contraindication of self-inflating bag for free-flow oxygen delivery during resuscitation belongs to Module 577 (Apgar score and Neonatal Resuscitation).');
recordMove(23619, 576, 'Etiologies and clinical workup of prolonged neonatal jaundice belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(24091, 593, 'Neonatal hepatitis presenting with conjugated hyperbilirubinemia and cholestasis belongs to Module 593 (Disorders of the Liver).');
recordMove(24114, 594, 'Transient Tachypnea of the Newborn (TTN / wet lung) in late preterm delivered by C-section belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(24189, 590, 'Congenital CMV infection as the leading non-syndromic infectious cause of SNHL belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24226, 590, 'PP65 antigenemia assay for therapeutic monitoring in severe congenital CMV infection belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24227, 589, 'Clutton joints (painless bilateral knee hydrarthrosis) as late manifestation of congenital syphilis belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24263, 600, 'Dried blood spot TSH newborn screening for congenital hypothyroidism belongs to Module 600 (Disorders of Thyroid).');
recordMove(24270, 600, 'Prolonged unconjugated jaundice as the earliest physical finding of congenital hypothyroidism belongs to Module 600 (Disorders of Thyroid).');
recordMove(24271, 600, 'Optimal timing of heel-prick screening for congenital hypothyroidism at 72 hours of life belongs to Module 600 (Disorders of Thyroid).');
recordMove(24277, 601, '46,XX newborn with ambiguous genitalia and nonpalpable gonads due to CAH belongs to Module 601 (Congenital Adrenal Hyperplasia and Related Disorders).');
recordMove(24283, 601, '21-hydroxylase deficiency in a female newborn with ambiguous genitalia and elevated 17-OHP belongs to Module 601 (Congenital Adrenal Hyperplasia and Related Disorders).');
recordMove(24304, 604, 'Neuroblastoma and Wilms tumor differential diagnosis for pediatric abdominal mass belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24382, 601, 'Multidisciplinary diagnostic approach to ambiguous genitalia and Disorders of Sex Development (DSD) belongs to Module 601 (Congenital Adrenal Hyperplasia and Related Disorders).');
recordMove(24430, 576, 'Sarnat Stage 2 moderate hypoxic ischemic encephalopathy (HIE) belongs to Module 576 (Diseases in Neonates requiring Special Care).');


// --- Moves from Module 576 (Diseases in Neonates requiring Special Care) ---
recordMove(17563, 605, '14-year-old with daily spiking fevers, polyarticular joint pains, and JIA belongs to Module 605 (Paediatric Rheumatology).');
recordMove(23383, 590, 'Neonatal varicella post-exposure prophylaxis with VZIG to baby and acyclovir to mother belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23384, 590, 'Neonatal varicella management and safety of intravenous acyclovir belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23388, 594, 'Early rescue exogenous surfactant administration via InSurE in RDS belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23390, 594, 'Diagnostic definition of apnea of prematurity (>20 seconds or with bradycardia/cyanosis) belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23392, 595, 'Metered-dose inhaler with spacer and face mask for asthma management in infants belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23393, 608, 'Myotonic dystrophy congenital form with facial diplegia and tented upper lip belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23394, 589, 'Atypical subtle presentations of bacterial meningitis in infancy without classic nuchal rigidity belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23395, 607, 'Parvovirus B19 causing pure red cell aplastic crisis in Sickle Cell Anemia belongs to Module 607 (Paediatric Anemias).');
recordMove(23396, 604, 'Burkitt lymphoma predisposing to acute tumor lysis syndrome in children belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23397, 608, 'Pediatric endotracheal intubation, cuffed vs uncuffed tube considerations belong to Module 608 (Mixed / Miscellaneous Topics: Emergency / Airway).');
recordMove(23398, 597, 'Coarctation of the aorta presenting with absent femoral pulses and upper extremity hypertension belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23400, 604, 'Varicella-zoster immune globulin post-exposure prophylaxis in a child with ALL on chemotherapy belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23402, 584, 'Fluid physiological differences with higher ECF to ICF ratio in infants predisposing to rapid dehydration belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23404, 608, 'Packed red blood cell transfusion dosing (10 mL/kg) in pediatric hemorrhagic shock belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency/Shock).');
recordMove(23418, 593, 'Persistent neonatal conjugated hyperbilirubinemia beyond 2 weeks indicating biliary atresia belongs to Module 593 (Disorders of the Liver).');
recordMove(23424, 593, 'Biliary atresia presenting with conjugated hyperbilirubinemia, acholic stools, and dark urine belongs to Module 593 (Disorders of the Liver).');
recordMove(23435, 607, 'Automated exchange transfusion indications for acute chest syndrome in sickle cell disease belong to Module 607 (Paediatric Anemias).');
recordMove(23440, 595, 'Cystic fibrosis multisystem features and distinguishing it from biliary atresia belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(23441, 593, 'Persistent neonatal cholestasis and pale stools in extrahepatic biliary atresia belong to Module 593 (Disorders of the Liver).');
recordMove(23443, 597, 'Patent ductus arteriosus hemodynamics, pulmonary overcirculation, and pulse pressure belong to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23446, 591, 'Congenital hypertrophic pyloric stenosis non-bilious projectile emesis in a 24-day-old belongs to Module 591 (Surgical GI Disorders).');
recordMove(23672, 608, 'Absence of sarcolemmal dystrophin protein in Duchenne Muscular Dystrophy belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23821, 585, 'Congenital heart disease (AVSD) as the major determinant of reduced longevity in Down syndrome belongs to Module 585 (Chromosomal Disorders).');
recordMove(23858, 586, 'Maple syrup urine disease branched-chain amino acid dietary restriction (leucine, isoleucine, valine) belongs to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23876, 608, 'MECP2 mutation in Rett syndrome causing developmental regression belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular / Neurodevelopmental).');
recordMove(24033, 590, 'Congenital Parvovirus B19 infection causing hydrops fetalis, severe anemia, and fetal death belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24040, 590, 'Hand, Foot, and Mouth Disease (HFMD) vesicles caused by Coxsackievirus A16 belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24044, 591, 'Absolute contraindication of bag-and-mask ventilation in congenital diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24063, 591, 'Olive-shaped pyloric mass in the epigastrium/RUQ in congenital hypertrophic pyloric stenosis belongs to Module 591 (Surgical GI Disorders).');
recordMove(24089, 593, 'Optimal timing of Kasai portoenterostomy before 60 days in neonatal cholestasis belongs to Module 593 (Disorders of the Liver).');
recordMove(24165, 608, 'Intravenous diazepam/lorazepam first-line abortive management of status epilepticus belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24336, 605, 'Bilateral non-exudative bulbar conjunctival injection sparing the limbus in Kawasaki disease belongs to Module 605 (Paediatric Rheumatology).');


// --- Moves from Module 577 (Apgar score and Neonatal Resuscitation) ---
recordMove(17264, 608, 'Thermal control and antipyretics for simple febrile convulsions in children belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(17381, 608, 'Complete absence of dystrophin and myofiber degeneration in DMD belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(18531, 608, 'Cannabinoid therapies in refractory childhood epilepsies (Dravet/Lennox-Gastaut) belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(18570, 608, 'Periventricular leukomalacia (PVL) leading to spastic cerebral palsy belongs to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');
recordMove(23346, 575, 'Normal developmental timeline of primitive neonatal reflexes (ATNR/STNR) belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(23366, 575, 'Maternal and neonatal morbidities associated with post-term birth belong to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(23413, 576, 'Acinetobacter baumannii and Klebsiella as leading pathogens of neonatal sepsis in India belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23414, 576, 'Cranial neurosonography (USG) for intracranial hemorrhage in neonatal seizures belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23415, 599, 'Classic clinical image of bladder exstrophy in a newborn belongs to Module 599 (Paediatric Nephrology).');
recordMove(23417, 576, 'Acute bilirubin encephalopathy stage 1 (lethargy, hypotonia, poor sucking) in Rh hemolytic disease belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23420, 576, 'Group B Streptococcus (GBS) as the leading cause of early-onset neonatal sepsis globally belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23421, 576, 'Neutropenia and immature-to-total neutrophil ratio (I:T ratio) in neonatal sepsis screen belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23423, 576, 'Visual assessment of skin color unreliable for monitoring serum bilirubin under phototherapy belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23450, 591, 'Congenital diaphragmatic hernia presenting with scaphoid abdomen and dextroposition of heart sounds belongs to Module 591 (Surgical GI Disorders).');
recordMove(23455, 590, 'Congenital Cytomegalovirus (CMV) presenting with periventricular calcification and hepatosplenomegaly belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23460, 579, 'Cranial sutures and fontanelles (anterior fontanelle formed by sagittal, frontal, coronal sutures) belong to Module 579 (Facets of Growth and Development).');
recordMove(23467, 576, 'Phenobarbital as first-line anticonvulsant for acute neonatal seizures belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23471, 594, 'Preterm gestational age as the predominant predisposing risk factor for Neonatal RDS belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23480, 608, 'Crystalloid fluid bolus administration in pediatric hemorrhagic and hypovolemic shock belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency / Shock).');
recordMove(23482, 576, 'Definition and biochemical threshold of neonatal hyperglycemia (>125 mg/dL) in NICU belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23483, 576, 'Multifactorial etiologies of neonatal seizures (HIE, hypocalcemia, hypoglycemia) belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23484, 608, 'Fluid bolus management for oliguria in pediatric acute burns belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Trauma / Shock).');
recordMove(23523, 590, 'Congenital varicella syndrome features (cicatricial skin lesions, hypoplastic limbs, chorioretinitis) belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23936, 589, 'Penicillin G / Metronidazole and supportive care for neonatal tetanus (Clostridium tetani) belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24264, 600, 'Postnatal timing of cord blood and heel-prick blood spot sampling for congenital hypothyroidism belongs to Module 600 (Disorders of Thyroid).');
recordMove(24265, 600, 'Sampling at 72 hours of life to avoid maternal TSH surge in congenital hypothyroidism screening belongs to Module 600 (Disorders of Thyroid).');


// --- Moves from Module 578 (Developmental Milestones) ---
recordMove(23496, 608, 'Hypsarrhythmia on EEG and ACTH therapy in infantile spasms (West syndrome) belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23497, 608, 'First-line hormonal therapy with high-dose ACTH for epileptic spasms in West syndrome belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23498, 604, 'Birbeck granules in Langerhans Cell Histiocytosis (LCH) belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23505, 608, 'Epileptic jackknife flexion spasms and ACTH management in West syndrome belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23510, 608, 'ACTH therapy for infantile spasms with neurodevelopmental regression belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23516, 608, 'Lead toxicity presenting with constipation, abdominal colic, and developmental delay belongs to Module 608 (Mixed / Miscellaneous Topics: Poisoning).');
recordMove(23518, 585, 'PTPN11 gene mutation and phenotypic characteristics in Noonan syndrome belong to Module 585 (Chromosomal Disorders).');
recordMove(23525, 608, 'Rett syndrome with MECP2 mutation causing deceleration of head growth and stereotypic hand movements belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular / Neurodevelopmental).');
recordMove(23528, 603, 'Thelarche (breast budding) as the first secondary sexual characteristic of normal female puberty belongs to Module 603 (Disorders of Puberty).');
recordMove(23529, 579, 'Head circumference growth rate of 2 cm/month in the first 3 months of infancy belongs to Module 579 (Facets of Growth and Development).');
recordMove(23552, 597, 'Embryological failure of alignment and fusion of the muscular and membranous ventricular septum in VSD belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23790, 585, 'Noonan syndrome with webbed neck, pulmonary stenosis, and normal karyotype belongs to Module 585 (Chromosomal Disorders).');
recordMove(23819, 585, 'Noonan syndrome clinical phenotype and distinguishing from Turner syndrome belong to Module 585 (Chromosomal Disorders).');
recordMove(23874, 587, 'Sphingomyelinase deficiency in Niemann-Pick disease presenting with cherry red spot and hepatosplenomegaly belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(24034, 590, 'Congenital Rubella Syndrome classic triad of cataracts, SNHL, and patent ductus arteriosus belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24074, 591, 'Chest radiograph showing bowel loops in hemithorax in Congenital Diaphragmatic Hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24269, 600, 'Congenital hypothyroidism presenting with coarse facies, macroglossia, and umbilical hernia belongs to Module 600 (Disorders of Thyroid).');


// --- Moves from Module 579 (Facets of Growth and Development) ---
recordMove(4998, 594, 'Bronchopulmonary dysplasia (BPD) severity staging in extreme preterms on oxygen support belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23305, 592, 'Secondary transient lactose intolerance following acute viral diarrhea in infants belongs to Module 592 (Medical GI Disorders).');
recordMove(23357, 590, 'Congenital Rubella Syndrome presenting with cataracts, petechiae, and PDA belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23500, 578, 'Commando crawl gross motor developmental milestone at 9 to 12 months belongs to Module 578 (Developmental Milestones).');
recordMove(23515, 608, 'Early hand dominance before 12 months indicative of contralateral hemiplegic cerebral palsy belongs to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');
recordMove(23524, 578, 'Principles of child development sequence (cephalocaudal and proximodistal) belong to Module 578 (Developmental Milestones).');
recordMove(23526, 608, 'Rett syndrome stereotypic midline hand-wringing and loss of purposeful hand skills belong to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23527, 578, 'Fine motor milestone of copying a circle at 3 years of age belongs to Module 578 (Developmental Milestones).');
recordMove(23532, 585, 'Down syndrome (Trisomy 21) clinical manifestations and negative associations belong to Module 585 (Chromosomal Disorders).');
recordMove(23533, 602, 'Side effect profile of recombinant human growth hormone therapy belongs to Module 602 (Disorders of the Pituitary Gland).');
recordMove(23536, 603, 'Tanner staging of female sexual maturity (Breast stage 3, Pubic hair stage 3) belongs to Module 603 (Disorders of Puberty).');
recordMove(23537, 603, 'Tanner staging of male pubertal development (Genital stage 2, Pubic hair stage 2) belongs to Module 603 (Disorders of Puberty).');
recordMove(23538, 608, 'Definite hand preference before 1 year of age suggesting hemiparesis/cerebral palsy belongs to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');
recordMove(23545, 608, 'Landau-Kleffner syndrome (acquired epileptic aphasia) presenting with receptive aphasia and CSWS belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23547, 608, 'Clinical risk factors for recurrent febrile seizures and future epilepsy belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23549, 578, 'Language developmental milestone of singing a nursery song at 3 to 4 years belongs to Module 578 (Developmental Milestones).');
recordMove(23550, 608, 'X-linked agammaglobulinemia (XLA / Bruton tyrosine kinase defect) belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23551, 585, 'HOXA13 mutation in hand-foot-genital syndrome with carpal fusion belongs to Module 585 (Chromosomal Disorders).');
recordMove(23553, 585, 'Fragile X syndrome FMR1 triplet CGG expansion with macroorchidism, large ears, and ASD belongs to Module 585 (Chromosomal Disorders).');
recordMove(23557, 576, 'Complications of infant of diabetic mother (hypoglycemia, polycythemia, hypocalcemia) belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23560, 608, 'Moyamoya disease presenting with recurrent transient ischemic attacks and puff-of-smoke collaterals belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23561, 608, 'Embryological neural tube defect timing resulting in anencephaly belongs to Module 608 (Mixed / Miscellaneous Topics: CNS Malformations).');
recordMove(23562, 585, 'Turner syndrome 45,X clinical phenotype with short stature and webbed neck belongs to Module 585 (Chromosomal Disorders).');
recordMove(23563, 608, 'Tuberous sclerosis complex ash leaf hypopigmented macules and subependymal nodules belong to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(23565, 599, 'Post-streptococcal glomerulonephritis with cola-colored urine and transient low C3 complement belongs to Module 599 (Paediatric Nephrology).');
recordMove(23568, 599, 'Serum C3 complement depression diagnostic of acute post-infectious glomerulonephritis belongs to Module 599 (Paediatric Nephrology).');
recordMove(23569, 582, 'Nutritional vitamin D deficiency rickets presenting with delayed physical growth and widening of wrists belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23571, 585, 'Prader-Willi syndrome (15q11-q13 paternal deletion) with neonatal hypotonia, hyperphagia, and hypogonadism belongs to Module 585 (Chromosomal Disorders).');
recordMove(23578, 608, 'Diagnostic criteria of Neurofibromatosis-1 (NF-1 / von Recklinghausen disease) belong to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(23590, 592, 'Celiac disease serological testing with anti-tissue transglutaminase (tTG) IgA belongs to Module 592 (Medical GI Disorders).');
recordMove(23594, 589, 'Congenital toxoplasmosis classic triad of chorioretinitis, hydrocephalus, and intracranial calcifications belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23595, 608, 'Dandy-Walker malformation presenting with cystic 4th ventricular dilatation and vermian hypoplasia belongs to Module 608 (Mixed / Miscellaneous Topics: CNS Malformations).');
recordMove(23599, 608, 'Fetal alcohol syndrome facial dysmorphism (smooth philtrum, thin vermilion, short palpebral fissures) belongs to Module 608 (Mixed / Miscellaneous Topics).');
recordMove(23607, 608, 'Sturge-Weber syndrome port-wine stain (nevus flammeus) in V1 distribution with leptomeningeal angioma belongs to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(23610, 608, 'Clinical examination findings of acute raised intracranial pressure in infants belong to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus / Raised ICP).');
recordMove(23611, 585, 'Treacher Collins syndrome (TCOF1 gene defect) with first and second branchial arch dysostosis belongs to Module 585 (Chromosomal Disorders).');
recordMove(23612, 608, 'Congenital hydrocephalus clinical signs in infants with bulging fontanelle and Macewen cracked-pot sign belongs to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus).');
recordMove(23613, 585, 'Rubinstein-Taybi syndrome (CREBBP gene mutation) with microcephaly and broad thumbs/halluces belongs to Module 585 (Chromosomal Disorders).');
recordMove(23614, 607, 'Fanconi anemia constitutional aplastic anemia and androgen/G-CSF therapy belong to Module 607 (Paediatric Anemias).');
recordMove(23642, 580, 'Nutritional biochemical composition of human colostrum vs mature breast milk belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(23675, 580, 'Nutrient and protein comparison between buffalo milk, cow milk, and human breast milk belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(23751, 584, 'Hypernatremic dehydration pathophysiology, neurological complications, and fluid management belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23788, 585, 'Annual thyroid function screening (TSH/free T4) in children with Down syndrome belongs to Module 585 (Chromosomal Disorders).');
recordMove(23789, 585, 'Fragile X syndrome FMR1 gene triplet repeat mutation phenotype belongs to Module 585 (Chromosomal Disorders).');
recordMove(23792, 585, 'Down syndrome characteristic phenotypic features and anomalies belongs to Module 585 (Chromosomal Disorders).');
recordMove(23793, 585, 'Klinefelter syndrome 47,XXY karyotype with hypergonadotropic hypogonadism belongs to Module 585 (Chromosomal Disorders).');
recordMove(23798, 591, 'Male sex predominance (4:1) as a classic epidemiological feature of CHPS belongs to Module 591 (Surgical GI Disorders).');
recordMove(23818, 607, 'Fanconi anemia DNA repair defect predisposing to progressive pancytopenia and leukemia belongs to Module 607 (Paediatric Anemias).');
recordMove(23828, 595, 'Congenital bilateral absence of the vas deferens (CBAVD) in cystic fibrosis CFTR mutations belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23850, 586, 'Phenylketonuria (PKU) untreated clinical features (mousy odor, hypopigmentation, microcephaly) belong to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23851, 586, 'Maternal PKU syndrome teratogenic effects (congenital heart defects, microcephaly) belong to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23871, 586, 'Maternal phenylketonuria teratogenic embryopathy due to elevated maternal phenylalanine levels belongs to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23959, 608, 'Neuroimaging features of Dandy-Walker malformation belong to Module 608 (Mixed / Miscellaneous Topics: CNS Malformations).');
recordMove(23983, 582, 'Vitamin A mega-dose supplementation of 100,000 IU given at 9 months alongside measles vaccination belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(24038, 590, 'Congenital Cytomegalovirus (CMV) with periventricular calcification and chorioretinitis belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24051, 591, 'Omphalocele midline abdominal wall defect covered by peritoneal sac containing umbilical cord belongs to Module 591 (Surgical GI Disorders).');
recordMove(24151, 595, 'Atopic dermatitis/eczema as major predictive risk factor for persistent childhood asthma belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24185, 594, 'Antenatal betamethasone for accelerating fetal surfactant synthesis and preventing HMD belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(24266, 600, 'Irreversible severe neurodevelopmental impairment as the chief sequela of delayed congenital hypothyroidism diagnosis belongs to Module 600 (Disorders of Thyroid).');
recordMove(24295, 585, '22q11.2 deletion syndrome with third and fourth pharyngeal pouch hypoplasia in DiGeorge syndrome belongs to Module 585 (Chromosomal Disorders).');
recordMove(24296, 585, 'DiGeorge anomaly with thymic aplasia and congenital hypocalcemia belongs to Module 585 (Chromosomal Disorders).');
recordMove(24408, 608, 'Levine clinical diagnostic criteria for classification of Cerebral Palsy belong to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');


// --- Moves from Module 580 (Nutrition and Breastfeeding) ---
recordMove(18725, 604, 'Asymptomatic palpable abdominal flank mass as the classic initial presentation of Wilms tumor belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23430, 576, 'Management of significant neonatal hyperbilirubinemia on day 2 of life with phototherapy belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23574, 579, 'Evaluation of short stature consistent with mid-parental height target in familial short stature belongs to Module 579 (Facets of Growth and Development).');
recordMove(23585, 582, 'Nutritional vitamin D deficiency rickets biochemical urinary calcium-to-creatinine excretion profile belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23618, 575, 'Normal newborn voiding physiology within 24 hours of birth belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(23623, 588, 'Dried blood spot HIV DNA PCR / NAT testing in exposed infants <18 months belongs to Module 588 (Polio and AIDS).');
recordMove(23625, 605, 'Indications for systemic corticosteroid therapy in Henoch-Schönlein Purpura (severe gastrointestinal colic/bleeding) belong to Module 605 (Paediatric Rheumatology).');
recordMove(23626, 583, 'Ascorbic acid heat lability, collagen hydroxylation, and clinical scurvy belong to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23631, 584, 'Clinical assessment and dehydration scoring for acute diarrhea in children belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23634, 599, 'Postnatal follow-up protocol and serial ultrasonography for antenatally detected multicystic dysplastic kidney belong to Module 599 (Paediatric Nephrology).');
recordMove(23638, 587, 'Galactose-1-phosphate uridylyltransferase (GALT) deficiency in classic galactosemia belongs to Module 587 (Metabolic Disorders of Carbohydrates).');
recordMove(23645, 589, 'Early congenital syphilis rhinitis ("snuffles") and nasal mucosal ulceration belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23648, 581, 'Stabilization to rehabilitation transition timeline in WHO severe acute malnutrition management belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23649, 581, 'WHO SAM protocol step 6: withholding iron supplements during the initial stabilization phase belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23650, 581, 'Discharge and recovery criteria in inpatient management of severe acute malnutrition belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23651, 581, 'WHO anthropometric definition of wasting (weight-for-height Z-score < -2 SD) belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23652, 581, 'Endocrine alterations in severe acute malnutrition (low insulin, high cortisol, high GH) belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23653, 581, 'Appetite test and outpatient management of uncomplicated SAM with MUAC <115 mm belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23663, 595, 'Lower chest wall indrawing as an indicator for hospital admission in childhood pneumonia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23668, 581, 'Mid-upper arm circumference (MUAC) threshold <115 mm defining severe acute malnutrition belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23676, 581, 'WHO diagnostic criteria for Severe Acute Malnutrition (WHZ < -3 SD or bipedal edema) belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23677, 581, 'Height-for-age stunting indicating chronic child undernutrition belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23678, 581, 'Differential diagnostic criteria of acute wasting vs chronic stunting in malnutrition belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23679, 581, 'Indicators of primary failure of inpatient therapeutic feeding recovery in SAM belong to Module 581 (Protein Energy Malnutrition).');
recordMove(23688, 581, 'Stunting (height-for-age) as the primary population index of chronic undernutrition belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23689, 579, 'BMI percentile cutoffs between 85th and 95th percentile defining childhood overweight belong to Module 579 (Facets of Growth and Development).');
recordMove(23699, 581, 'Fluid resuscitation using half-strength Darrow or Ringer lactate with 5% dextrose in malnourished children with shock belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23701, 608, 'Febrile seizures as the most prevalent etiology of convulsions in children aged 6 months to 5 years belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23731, 582, 'PHEX gene mutation on chromosome Xp22.11 in X-linked hypophosphatemic rickets belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23770, 581, 'ReSoMal reduced sodium formulation (45 mmol/L) in dehydrated malnourished children belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23797, 592, 'Celiac disease enteropathy with crypt hyperplasia and duodenal villous blunting belongs to Module 592 (Medical GI Disorders).');
recordMove(23883, 587, 'Acid alpha-glucosidase deficiency in Pompe disease presenting with cardiomegaly and severe hypotonia belongs to Module 587 (Metabolic Disorders of Carbohydrates / Glycogen Storage).');
recordMove(23935, 589, 'Macrolide therapy (azithromycin) for Bordetella pertussis or Chlamydia infant pneumonia belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23988, 590, 'Classic measles clinical presentation (fever, 3 Cs, cephalocaudal maculopapular rash) and supportive isolation belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');


// --- Moves from Module 581 (Protein Energy Malnutrition) ---
recordMove(23543, 579, 'Length-for-age below -2 SD defining moderate stunting belongs to Module 579 (Facets of Growth and Development).');
recordMove(23566, 599, 'Chronic kidney disease mineral-bone disorder and acidosis correction in children belong to Module 599 (Paediatric Nephrology).');
recordMove(23654, 606, 'LYST gene mutation causing giant lysosomal granules in Chediak-Higashi syndrome belongs to Module 606 (Paediatric Hematology).');
recordMove(23655, 608, 'Recombinant HBsAg vaccine production and hepatitis B immunization belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23656, 605, 'Henoch-Schönlein purpura palpable purpuric rash and conservative management belong to Module 605 (Paediatric Rheumatology).');
recordMove(23657, 590, 'Aseptic meningitis CSF profile with lymphocytic pleocytosis and normal glucose belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23658, 608, 'Serum creatine kinase marked elevation in early stages of Duchenne muscular dystrophy belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23659, 589, 'Tuberculous meningitis CSF findings (marked pleocytosis, protein elevation, hypoglycorrhachia) belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23660, 589, 'Adjuvant corticosteroid indications to reduce mortality and basilar arachnoiditis in pediatric TBM belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23661, 592, 'Empiric proton pump inhibitor (PPI) trial in adolescent gastroesophageal reflux disease belongs to Module 592 (Medical GI Disorders).');
recordMove(23662, 604, 'Ewing sarcoma translocation t(11;22)(q24;q12) producing EWSR1-FLI1 fusion transcript belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23664, 608, 'Spinal muscular atrophy type 1 (Werdnig-Hoffmann) with SMN1 deletion and tongue fasciculations belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23665, 600, 'Autoimmune polyglandular syndrome screening for Hashimoto hypothyroidism in type 1 diabetes belongs to Module 600 (Disorders of Thyroid).');
recordMove(23666, 592, 'IgE-mediated cow milk protein allergy (CMPA) presenting with immediate urticaria and emesis belongs to Module 592 (Medical GI Disorders).');
recordMove(23681, 595, 'Abnormal CFTR chloride channel function in sweat gland duct in Cystic Fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23683, 590, 'Coxsackievirus aseptic meningitis and Hand-Foot-and-Mouth disease lesions belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23685, 580, 'Biochemical comparison of human breast milk vs cow milk (lower calcium and phosphorus preventing high renal solute load) belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(23690, 599, 'Minimal Change Disease (MCD) presenting with selective proteinuria, periorbital puffiness, and normal BP belongs to Module 599 (Paediatric Nephrology).');
recordMove(23691, 599, 'Steroid responsiveness and standard tapering regimen in childhood nephrotic syndrome belong to Module 599 (Paediatric Nephrology).');
recordMove(23692, 599, 'Post-streptococcal glomerulonephritis following pyoderma with gross hematuria and low C3 belongs to Module 599 (Paediatric Nephrology).');
recordMove(23693, 599, 'Urine dipstick 3+ proteinuria quantification (300-1000 mg/dL) in nephrotic syndrome evaluation belongs to Module 599 (Paediatric Nephrology).');
recordMove(23694, 599, 'Idiopathic nephrotic syndrome in a 4-year-old boy presenting with dependent edema belongs to Module 599 (Paediatric Nephrology).');
recordMove(23695, 599, 'Diagnostic triad of childhood nephrotic syndrome (massive proteinuria, hypoalbuminemia, hypercholesterolemia) belongs to Module 599 (Paediatric Nephrology).');
recordMove(23697, 599, 'Hypercoagulability and mesenteric venous thrombosis in nephrotic syndrome due to antithrombin III urinary loss belong to Module 599 (Paediatric Nephrology).');
recordMove(23941, 589, 'Pediatric tuberculous meningitis presenting with basilar cranial nerve palsies and CSF pleocytosis belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23971, 599, 'Minimal change disease corticosteroid responsiveness and histologic features belong to Module 599 (Paediatric Nephrology).');
recordMove(24318, 605, 'Polyarticular-onset juvenile idiopathic arthritis (JIA) presenting with symmetrical joint involvement belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24319, 605, 'Multisystem Inflammatory Syndrome in Children (MIS-C / PIMS-TS) following COVID-19 belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24410, 599, 'Child presenting with tea-colored urine, periorbital puffiness, and nephritic syndrome belongs to Module 599 (Paediatric Nephrology).');


// --- Moves from Module 582 (Deficiency of Fat Soluble Vitamins) ---
recordMove(23410, 595, 'Sweat chloride testing (>60 mmol/L) as the definitive diagnostic standard for Cystic Fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23432, 582, 'Vitamin E deficiency spinocerebellar degeneration and hemolytic anemia belong to Module 582 (Deficiency of Fat Soluble Vitamins).'); // Already in 582!
recordMove(23433, 587, 'Classic galactosemia presenting with vomiting and cataract after initiating breastfeeding belongs to Module 587 (Metabolic Disorders of Carbohydrates).');
recordMove(23544, 579, 'Evaluation of short stature in girls with mid-parental height target calculation belongs to Module 579 (Facets of Growth and Development).');
recordMove(23582, 583, 'Nutritional zinc deficiency clinical features, impaired wound healing, and dermatitis belong to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23714, 583, 'Keshan disease dilated cardiomyopathy caused by selenium trace element deficiency belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23715, 583, 'Wernicke encephalopathy classic triad of ataxia, ophthalmoplegia, and confusion due to thiamine deficiency belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23719, 601, 'Adrenal salt-wasting crisis in a 4-week-old male with 21-hydroxylase deficiency and elevated 17-OHP belongs to Module 601 (Congenital Adrenal Hyperplasia and Related Disorders).');
recordMove(23721, 592, 'Serological diagnostic algorithm using anti-tissue transglutaminase (tTG) IgA for Celiac disease belongs to Module 592 (Medical GI Disorders).');
recordMove(23722, 607, 'Dietary vitamin B12 deficiency megaloblastic anemia with macrocytosis in strict vegan children belongs to Module 607 (Paediatric Anemias).');
recordMove(23723, 607, 'Anemia of chronic disease characterized by low iron, high/normal ferritin, and low TIBC belongs to Module 607 (Paediatric Anemias).');
recordMove(23724, 607, 'Reticulocyte response timing (5-7 days) following oral iron therapy in iron deficiency anemia belongs to Module 607 (Paediatric Anemias).');
recordMove(23725, 607, 'Beta-thalassemia major presenting with microcytic hemolytic anemia and chipmunk facies belongs to Module 607 (Paediatric Anemias).');
recordMove(23726, 608, 'Emergency intraosseous (IO) vascular access in pediatric cardiopulmonary arrest belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency / PALS).');
recordMove(23729, 607, 'Glucose-6-phosphate dehydrogenase (G6PD) deficiency acute intravascular hemolysis triggered by oxidant stress belongs to Module 607 (Paediatric Anemias).');
recordMove(23853, 583, 'Leukocyte ascorbate concentration as the most accurate biochemical indicator of tissue vitamin C stores belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23854, 586, 'Homogentisic acid oxidase deficiency in alkaptonuria with dark urine on standing belongs to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23856, 586, 'Phenylalanine hydroxylase deficiency causing severe hyperphenylalaninemia in PKU belongs to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23875, 608, 'Terminal complement component deficiency (C5-C9) predisposing to recurrent invasive meningococcemia belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23877, 587, 'Glucocerebrosidase deficiency in Gaucher disease presenting with Erlenmeyer flask deformity and organomegaly belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(23880, 583, 'Angular stomatitis, cheilosis, and magenta glossitis caused by riboflavin (Vitamin B2) deficiency belong to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23881, 587, 'Gaucher disease with crumpled-tissue-paper histiocytes due to glucocerebrosidase deficiency belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(23910, 608, 'Varicella live-attenuated vaccine schedule at 12 to 15 months belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23939, 608, 'Absolute contraindication to live viral vaccines (MMR, OPV, BCG) in Severe Combined Immunodeficiency (SCID) belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(24092, 587, 'Galactose-1-phosphate uridylyltransferase deficiency in classic galactosemia belongs to Module 587 (Metabolic Disorders of Carbohydrates).');
recordMove(24094, 587, 'Glucose-6-phosphatase deficiency in von Gierke disease (GSD type I) with fasting hypoglycemia and hepatomegaly belongs to Module 587 (Metabolic Disorders of Carbohydrates / Glycogen Storage).');
recordMove(24379, 608, 'Complete blood count with differential and absolute lymphocyte count as the initial primary immunodeficiency screening test belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');


// --- Moves from Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements) ---
recordMove(23741, 582, 'Epidemiological prevalence and public health burden of Vitamin A xerophthalmia in preschool children belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23742, 592, 'First-line behavioral feeding management (avoiding overfeeding) for infantile gastroesophageal reflux belongs to Module 592 (Medical GI Disorders).');
recordMove(23878, 595, 'Fat-soluble vitamin supplementation (A, D, E, K) in cystic fibrosis due to exocrine pancreatic insufficiency belongs to Module 595 (Childhood Respiratory Disorders).');


// --- Moves from Module 584 (Fluid and Electrolyte Disorders) ---
recordMove(3351, 608, 'Cerebral edema as the primary mechanism of fatal complication in pediatric Diabetic Ketoacidosis (DKA) belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(3728, 595, 'CFTR defect producing elevated sweat chloride and thick pancreatic secretions in cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(9572, 598, 'Prostaglandin E1 (PGE1) infusion for maintaining ductal patency in duct-dependent cyanotic congenital heart lesions belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(23680, 589, 'Tuberculous meningitis CSF findings (cobweb coagulum, marked lymphocytosis, elevated protein) belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23750, 594, 'Biophysical mechanisms in infant RDS (increased alveolar surface tension and low lung compliance) belong to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23754, 595, 'CFTR gene mutation testing for cystic fibrosis presenting with recurrent bronchopneumonia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23755, 595, 'Right upper lobe lobar consolidation in pediatric community-acquired bacterial pneumonia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23759, 595, 'Acute foreign body aspiration emergency recognition and initial management belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(23761, 608, 'Fluid bolus protocol (normal saline 10-20 mL/kg) and low-dose IV insulin infusion in severe pediatric DKA belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23764, 590, 'Neonatal Herpes Simplex Virus (HSV-2) vesicular mucocutaneous lesions and transmission risk belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23765, 608, 'Calculation of fluid deficit and maintenance fluid therapy in pediatric DKA belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23766, 608, 'Autoimmune beta-cell destruction in juvenile Type 1 Diabetes Mellitus belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Endocrinology).');
recordMove(23773, 581, 'Pathophysiology of refeeding syndrome (insulin-driven intracellular shifts of phosphate and potassium) in malnourished children belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23777, 608, 'Behavioral therapy and enuresis alarm conditioning for primary nocturnal enuresis belong to Module 608 (Mixed / Miscellaneous Topics: Child Psychiatry / Development).');
recordMove(23778, 576, 'Dopamine and inotrope infusion for neonatal cardiogenic/septic shock in NICU belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23779, 608, 'Bell-and-pad classical conditioning alarm as the most effective long-term intervention for nocturnal enuresis belongs to Module 608 (Mixed / Miscellaneous Topics).');
recordMove(23780, 599, 'Renal sodium retention and altered capillary permeability in minimal change nephrotic syndrome belong to Module 599 (Paediatric Nephrology).');
recordMove(23866, 604, 'Aggressive hyperhydration and rasburicase/allopurinol therapy for tumor lysis syndrome in childhood leukemia belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24150, 595, 'Single-dose oral dexamethasone therapy for viral croup (laryngotracheobronchitis) belongs to Module 595 (Childhood Respiratory Disorders).');


// --- Moves from Module 585 (Chromosomal Disorders) ---
recordMove(2047, 608, 'Dystrophin gene deletion on Xp21 in Duchenne Muscular Dystrophy with Gowers sign belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23300, 608, 'T-cell receptor excision circles (TREC) newborn screening for severe combined immunodeficiency belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23426, 576, 'Beta-glucuronidase in breast milk deconjugating intestinal bilirubin in breast milk jaundice belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23520, 608, 'Early red flags for autism spectrum disorder (absence of social smile, lack of joint attention) belong to Module 608 (Mixed / Miscellaneous Topics: Child Development / Autism).');
recordMove(23567, 599, 'Elevated Fibroblast Growth Factor 23 (FGF-23) as an early biomarker of chronic kidney disease mineral bone disorder belongs to Module 599 (Paediatric Nephrology).');
recordMove(23637, 583, 'Acrodermatitis enteropathica due to SLC39A4 zinc transporter defect presenting with periorificial dermatitis and diarrhea belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23718, 608, 'CD40L defect impairing immunoglobulin class-switch recombination in Hyper-IgM syndrome belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23727, 608, 'CD18 integrin beta-2 subunit mutation in Leukocyte Adhesion Deficiency (LAD-1) with delayed umbilical cord separation belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23799, 604, 'Translocation t(15;17)(q24;q21) PML-RARA in acute promyelocytic leukemia belongs to Module 604 (Solid Neoplasms of Childhood) / Pathology 139.');
recordMove(23806, 600, 'Congenital hypothyroidism as the most common preventable etiology of intellectual disability belongs to Module 600 (Disorders of Thyroid).');
recordMove(23809, 599, 'Definition of steroid-resistant nephrotic syndrome (failure of remission after 4-6 weeks of daily prednisone) belongs to Module 599 (Paediatric Nephrology).');
recordMove(23816, 599, 'COL4A5 type IV collagen alpha-5 chain mutation in Alport syndrome presenting with hematuria and sensorineural hearing loss belongs to Module 599 (Paediatric Nephrology).');
recordMove(23855, 587, 'Lesch-Nyhan syndrome HGPRT deficiency with hyperuricemia, self-mutilation, and gouty arthritis belongs to Module 587 (Metabolic Disorders of Urea Cycle, Complex Molecules, and Carbohydrates).');
recordMove(23882, 608, 'Rett syndrome MECP2 X-linked dominant mutation with neurodevelopmental regression belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23915, 605, 'Pediatric Autoimmune Neuropsychiatric Disorders Associated with Streptococcal Infections (PANDAS) belong to Module 605 (Paediatric Rheumatology).');
recordMove(23958, 608, 'Temper tantrums as emotional behavioral outbursts distinguishing from repetitive habit spasms belong to Module 608 (Mixed / Miscellaneous Topics: Child Psychiatry / Behavior).');
recordMove(23985, 590, 'Erythema infectiosum slapped-cheek rash caused by human Parvovirus B19 belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23989, 590, 'Subacute sclerosing panencephalitis (SSPE) as a late neurodegenerative sequela of measles virus with elevated CSF anti-measles IgG belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24019, 606, 'Immune thrombocytopenic purpura (ITP) presenting with sudden post-viral mucosal and cutaneous petechiae belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24086, 579, 'Target mid-parental height calculation for girls based on parental stature belongs to Module 579 (Facets of Growth and Development).');
recordMove(24101, 595, 'Adenoviral necrotizing bronchiolitis leading to post-infectious bronchiolitis obliterans belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24353, 606, 'Bernard-Soulier syndrome GP Ib/IX/V platelet receptor deficiency with giant platelets belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24362, 606, 'Wiskott-Aldrich syndrome triad of thrombocytopenia with small platelets, eczema, and immunodeficiency belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24364, 606, 'Intravenous immunoglobulin (IVIG) and systemic corticosteroids for severe pediatric acute ITP belong to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24387, 578, 'Risk factors for developmental speech and language delay belong to Module 578 (Developmental Milestones).');
recordMove(24458, 608, 'Ataxia-telangiectasia ATM gene mutation distinguishing from primary phagocytic defects belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(24529, 608, 'Persistent thumb sucking behavior and dental malocclusion belong to Module 608 (Mixed / Miscellaneous Topics: Child Development).');
recordMove(24530, 608, 'Autism spectrum disorder typical age of clinical identification (2-4 years) belongs to Module 608 (Mixed / Miscellaneous Topics: Child Psychiatry / Autism).');


// --- Moves from Module 586 (Metabolic Disorders of Amino Acids) ---
recordMove(23342, 576, 'Breastfeeding jaundice due to inadequate milk intake in the first week of life belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23412, 576, 'Hyperinsulinemic hypoglycemia in neonates requiring high glucose infusion rate (>10 mg/kg/min) belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23429, 608, 'Risk factors and non-risk etiologies for cerebral palsy in pediatric populations belong to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');
recordMove(23436, 576, 'Clinical and radiographic hallmark signs of necrotizing enterocolitis (NEC) belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23437, 576, 'Metabolic derangements and laboratory signs in neonatal NEC belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23442, 593, 'Biliary atresia as the leading indication for pediatric orthotopic liver transplantation belongs to Module 593 (Disorders of the Liver).');
recordMove(23564, 584, 'Refractory hypokalemia secondary to hypomagnesemia in severe acute diarrhea belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23583, 582, 'Radiological cupping, fraying, and metaphyseal splaying in nutritional rickets belong to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23641, 587, 'Classic galactosemia presenting with vomiting and non-glucose reducing sugars in urine (Benedict positive) belongs to Module 587 (Metabolic Disorders of Carbohydrates).');
recordMove(23686, 581, 'Nutritional marasmus characterized by severe calorie deficit with loss of subcutaneous fat belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23700, 599, 'Renal Fanconi syndrome presenting with proximal tubular wasting of phosphate, glucose, and amino acids belongs to Module 599 (Paediatric Nephrology).');
recordMove(23744, 584, 'Electrolyte imbalances and severe dehydration in pediatric acute gastroenteritis belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23749, 584, 'Hypovolemic dehydration assessment and fluid management in infant diarrhea belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23762, 608, 'Insulin infusion adjustment and glucose monitoring in pediatric DKA belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23783, 591, 'Congenital hypertrophic pyloric stenosis with hypochloremic hypokalemic metabolic alkalosis belongs to Module 591 (Surgical GI Disorders).');
recordMove(23796, 592, 'Celiac disease management with strict lifelong gluten-free diet belongs to Module 592 (Medical GI Disorders).');
recordMove(23810, 608, 'Multicystic encephalomalacia on brain MRI in spastic quadriplegic cerebral palsy belongs to Module 608 (Mixed / Miscellaneous Topics: Cerebral Palsy).');
recordMove(23860, 576, 'Screening for hypocalcemia and hypoglycemia in infants of diabetic mothers belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23861, 595, 'Delta-F508 mutation deletion of phenylalanine at position 508 in CFTR gene belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23862, 608, 'Trofinetide synthetic IGF-1 analogue approved for Rett syndrome belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23865, 607, 'Sickle cell disease point mutation (glutamic acid to valine at codon 6 of beta-globin) belongs to Module 607 (Paediatric Anemias).');
recordMove(23867, 608, 'Diagnostic criteria and clinical presentation of simple febrile seizures belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23869, 599, 'Pseudohypoaldosteronism type II (Gordon syndrome) with hyperkalemic renal tubular acidosis belongs to Module 599 (Paediatric Nephrology).');
recordMove(23870, 599, 'Bartter syndrome thick ascending limb sodium-potassium-chloride transporter defect belongs to Module 599 (Paediatric Nephrology).');
recordMove(23902, 587, 'Alpha-galactosidase A deficiency in Fabry disease with angiokeratomas and neuropathic pain belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(23906, 587, 'Iduronate-2-sulfatase deficiency in Hunter syndrome (MPS II) with X-linked inheritance belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(24056, 591, 'Hypochloremic hypokalemic metabolic alkalosis in infant hypertrophic pyloric stenosis belongs to Module 591 (Surgical GI Disorders).');
recordMove(24057, 591, 'Electrolyte pathophysiology of prolonged gastric emesis in infantile pyloric stenosis belongs to Module 591 (Surgical GI Disorders).');
recordMove(24058, 591, 'Clinical and radiographic triad in congenital hypertrophic pyloric stenosis belongs to Module 591 (Surgical GI Disorders).');
recordMove(24059, 591, 'Paradoxical aciduria and metabolic alkalosis in pyloric stenosis belong to Module 591 (Surgical GI Disorders).');
recordMove(24100, 587, 'Classic galactosemia presenting with E. coli sepsis and jaundice belongs to Module 587 (Metabolic Disorders of Carbohydrates).');
recordMove(24191, 597, 'Duct-dependent coarctation of aorta or critical aortic stenosis requiring alprostadil belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24267, 608, 'Acute iron poisoning toxicity stages, abdominal pain, and shock belong to Module 608 (Mixed / Miscellaneous Topics: Poisoning).');


// --- Moves from Module 587 (Metabolic: Urea Cycle, Complex Molecules, Carbohydrates) ---
recordMove(23354, 608, 'First-line abortive therapy with IV/rectal diazepam for acute prolonged febrile convulsions belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23485, 608, 'Acute iron poisoning antidote deferoxamine chelation therapy belongs to Module 608 (Mixed / Miscellaneous Topics: Poisoning).');
recordMove(23884, 608, 'Complex febrile seizure defining characteristics (focal onset, duration >15 min, recurrence within 24h) belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23887, 594, 'Bilateral choanal atresia presenting with cyclical cyanosis relieved by crying in newborns belongs to Module 594 (Neonatal Respiratory Disorders).');
recordMove(23888, 608, 'Recurrence risk factors for febrile seizures in young children belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23889, 608, 'Vigabatrin first-line therapy for infantile spasms (West syndrome) in tuberous sclerosis belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23890, 608, 'Overall risk of febrile seizure recurrence (30-50%) in young children belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23892, 608, 'Osborn J waves on electrocardiogram in accidental hypothermia in children belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23893, 608, 'PALS guidelines for synchronized cardioversion (0.5-1 J/kg) in pediatric unstable supraventricular tachycardia belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23895, 608, 'Intravenous adenosine (0.1 mg/kg rapid push) for terminating stable SVT in children belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23896, 599, 'Steroid responsiveness as the hallmark diagnostic feature of minimal change nephrotic syndrome belongs to Module 599 (Paediatric Nephrology).');
recordMove(23898, 599, 'Updated Schwartz formula for estimating glomerular filtration rate (eGFR) in children belongs to Module 599 (Paediatric Nephrology).');
recordMove(23904, 597, 'Wolff-Parkinson-White (WPW) syndrome accessory pathway and SVT in pediatric patients belong to Module 597 (Acyanotic Congenital Heart Diseases) / Medicine 418.');
recordMove(24182, 607, 'Hydroxyurea therapy for increasing fetal hemoglobin (HbF) and reducing vaso-occlusive crises in Sickle Cell Anemia belongs to Module 607 (Paediatric Anemias).');


// --- Moves from Module 588 (Polio and AIDS) ---
recordMove(23912, 591, 'Rotavirus vaccine (Rotashield) predisposing to ileocolic intussusception belongs to Module 591 (Surgical GI Disorders).');


// --- Moves from Module 589 (Paediatric Bacterial and Parasitic Infections) ---
recordMove(23301, 608, 'Post-splenectomy encapsulated bacterial vaccination schedule (PCV, Hib, meningococcal) belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23367, 590, 'Congenital Cytomegalovirus (CMV) asymptomatic presentation and late sensorineural hearing loss belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23371, 585, 'DiGeorge syndrome cardiac conotruncal anomalies, parathyroid hypoplasia, and 22q11.2 deletion belong to Module 585 (Chromosomal Disorders).');
recordMove(23439, 608, 'Leukocyte adhesion deficiency type 1 with delayed umbilical cord falling belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23592, 608, 'Bruton X-linked agammaglobulinemia with recurrent pyogenic sinopulmonary infections belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23687, 581, 'Stunting indicating chronic undernutrition in community child anthropometric surveys belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23702, 595, 'Cystic fibrosis presenting with meconium ileus, distal intestinal obstruction syndrome, and bronchiectasis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23703, 590, 'Viral aseptic meningitis presenting with acute high fever, meningismus, and clear CSF belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23705, 595, 'IMNCI assessment of fast breathing (RR >=50 in 2-11 months) and normal age cutoffs belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23728, 607, 'Bite cells and Heinz bodies on peripheral blood film in G6PD deficiency belongs to Module 607 (Paediatric Anemias).');
recordMove(23774, 584, 'Acute severe dehydration secondary to viral/bacterial diarrhea with altered sensorium belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23781, 592, 'Shiga toxin-producing E. coli (STEC) dysentery with risk of HUS managed supportively without antimotility agents belongs to Module 592 (Medical GI Disorders).');
recordMove(23795, 585, 'Down syndrome (Trisomy 21) clinical manifestations and negative associations belongs to Module 585 (Chromosomal Disorders).');
recordMove(23901, 587, 'Hurler syndrome (MPS I) autosomal recessive inheritance and alpha-L-iduronidase deficiency belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(23917, 608, 'Chronic Granulomatous Disease (CGD) diagnosed by Dihydrorhodamine 123 (DHR) flow cytometry belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23918, 608, 'Infected ventriculoperitoneal (VP) shunt evaluation in pediatric hydrocephalus belongs to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus).');
recordMove(23922, 588, 'Pneumocystis jirovecii pneumonia (PJP) in pediatric HIV/AIDS and cotrimoxazole prophylaxis belong to Module 588 (Polio and AIDS).');
recordMove(23932, 599, 'Urinary tract infection pathophysiology and association with functional constipation in children belong to Module 599 (Paediatric Nephrology).');
recordMove(23933, 599, 'Imaging protocol (USG, MCUG/VCUG, DMSA) following first febrile UTI in young infants belongs to Module 599 (Paediatric Nephrology).');
recordMove(23937, 583, 'Vitamin B12 ileal absorption, intrinsic factor, and cobalamin transport physiology belong to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23938, 595, 'Bordetella pertussis catarrhal and paroxysmal stage with inspiratory whoop belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23940, 595, 'Acute bacterial tracheitis (Staphylococcus aureus) as a life-threatening pediatric upper airway infection belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23944, 608, 'Bruton X-linked agammaglobulinemia (XLA) with absent mature B cells and recurrent lobar pneumonias belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23947, 607, 'Functional asplenia in sickle cell disease predisposing to encapsulated bacterial sepsis belongs to Module 607 (Paediatric Anemias).');
recordMove(23950, 598, 'Infective endocarditis high-risk cardiac lesions including uncorrected cyanotic CHD (TOF) belong to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(23951, 595, 'IMNCI outpatient classification and oral amoxicillin treatment of non-severe fast-breathing pneumonia belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(23952, 608, 'Intranasal/buccal midazolam as first-line rapid abortive therapy for pediatric febrile seizures belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23964, 599, 'Etiology and bacteriology of pediatric UTIs (E. coli >80%) belong to Module 599 (Paediatric Nephrology).');
recordMove(23970, 592, 'Vibrio cholerae severe secretory rice-water diarrhea and rehydration belong to Module 592 (Medical GI Disorders).');
recordMove(23975, 597, 'Infective endocarditis vegetative lesion risk across congenital heart lesions (VSD most common) belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23976, 599, 'Allergic acute interstitial nephritis (AIN) with eosinophiluria and periorbital edema belongs to Module 599 (Paediatric Nephrology).');
recordMove(23977, 608, 'Components of Pentavalent vaccine (DPT + Hep B + Hib) administered at 6, 10, 14 weeks belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23978, 608, 'Diphtheria toxoid content (25 Lf) in pediatric DT vs adult Td formulations belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23984, 608, 'Selective IgG subclass deficiency and clinical immunodeficiency associations belong to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(24085, 599, 'Peritoneal dialysis catheter placement in pediatric acute kidney injury with anuria belongs to Module 599 (Paediatric Nephrology).');
recordMove(24095, 605, 'Anemia of chronic disease in systemic/polyarticular juvenile idiopathic arthritis belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24138, 595, 'Primary ciliary dyskinesia (Kartagener syndrome) with dynein arm defect causing chronic wet cough and sinusitis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24152, 608, 'Severe Combined Immunodeficiency (SCID) presentations and exclusion of non-associated eczema belongs to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(24261, 599, 'Escherichia coli as the most frequent uropathogen in childhood urinary tract infections belongs to Module 599 (Paediatric Nephrology).');
recordMove(24300, 595, 'Congenital bilateral absence of vas deferens in cystic fibrosis (CFTR gene defect) belongs to Module 595 (Childhood Respiratory Disorders).');


// --- Moves from Module 590 (Measles, Mumps, Rubella and Other Viral Infections) ---
recordMove(23330, 589, 'Congenital Cytomegalovirus (CMV) or Toxoplasmosis shell vial culture and viral PCR belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23331, 576, 'Neonatal herpes simplex virus (HSV) infection with vesicles requiring urgent hospitalization and high-dose IV acyclovir belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23355, 580, 'Breastfeeding benefits in reducing neonatal diarrheal and respiratory infections belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(23369, 598, 'Congenital rubella syndrome associated with patent ductus arteriosus and peripheral pulmonary artery stenosis belongs to Module 598 / 590.'); // Wait, if CRS has cataracts + PDA, 590 is viral infections! So 23369 can STAY in 590!
recordMove(23376, 599, 'Micturating cystourethrography (MCUG) diagnostic protocol for vesicoureteral reflux (VUR) in recurrent UTIs belongs to Module 599 (Paediatric Nephrology).');
recordMove(23391, 595, 'Palivizumab monoclonal antibody RSV prophylaxis in high-risk infants with congenital heart disease belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23425, 593, 'Extrahepatic portal vein obstruction (EHPVO) with portal hypertension secondary to umbilical vein catheterization belongs to Module 593 (Disorders of the Liver).');
recordMove(23581, 581, 'Stunting (height-for-age < -2 SD) indicating chronic undernutrition belongs to Module 581 (Protein Energy Malnutrition).');
recordMove(23598, 589, 'Congenital toxoplasmosis classic Sabin tetrad (chorioretinitis, hydrocephalus, diffuse intracranial calcifications, convulsions) belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23601, 585, 'DiGeorge syndrome (22q11.2 deletion) with thymic aplasia causing T-cell deficiency and chronic candidiasis belongs to Module 585 (Chromosomal Disorders).');
recordMove(23606, 589, 'Congenital Toxoplasma gondii infection with diffuse parenchymal cerebral calcifications belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23632, 588, 'Prevention of Mother-to-Child Transmission (PMTCT) of HIV with dual maternal-infant antiretroviral regimens belongs to Module 588 (Polio and AIDS).');
recordMove(23633, 575, 'Components of Kangaroo Mother Care (continuous skin-to-skin contact and exclusive breastfeeding) belong to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(23643, 588, 'Early infant HIV diagnosis using dried blood spot (DBS) for HIV DNA PCR belongs to Module 588 (Polio and AIDS).');
recordMove(23644, 595, 'Epidemiological risk factors for acute viral bronchiolitis in infants belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(23782, 595, 'Quantitative sweat chloride pilocarpine iontophoresis for diagnosis of cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23784, 595, 'Young syndrome (bronchiectasis, chronic rhinosinusitis, and azoospermia) belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23791, 599, 'Classic clinical image of bladder exstrophy in a pediatric patient belongs to Module 599 (Paediatric Nephrology).');
recordMove(23857, 595, 'Cystic fibrosis presenting with recurrent bronchopneumonia, bronchiectasis, and failure to thrive belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23873, 587, 'Gaucher disease with glucocerebrosidase deficiency and splenic/skeletal involvement belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(23894, 599, 'Post-streptococcal glomerulonephritis with dark urine, facial puffiness, hypertension, and transient hypocomplementemia belongs to Module 599 (Paediatric Nephrology).');
recordMove(23914, 607, 'Splenic autoinfarction and encapsulated bacterial sepsis (Streptococcus pneumoniae) in sickle cell anemia belong to Module 607 (Paediatric Anemias).');
recordMove(23916, 606, 'Wiskott-Aldrich syndrome WASp gene mutation with microthrombocytopenia and atopic eczema belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(23919, 607, 'Infection risks in asplenic sickle cell anemia patients (pneumococcal sepsis, Salmonella osteomyelitis) belong to Module 607 (Paediatric Anemias).');
recordMove(23920, 599, 'Minimal change nephrotic syndrome presenting with facial puffiness and massive proteinuria belongs to Module 599 (Paediatric Nephrology).');
recordMove(23921, 605, 'Henoch-Schönlein purpura (IgA vasculitis) with colicky abdominal pain and non-thrombocytopenic purpura belongs to Module 605 (Paediatric Rheumatology).');
recordMove(23923, 608, 'Varicella immunization timing and live viral vaccine schedules belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23982, 589, 'Cerebral malaria (Plasmodium falciparum) in pediatric patients presenting with encephalopathy and seizures belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24005, 608, 'Toxic shock syndrome from bacterial contamination of reconstituted measles vaccine belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(24007, 608, 'Duchenne muscular dystrophy progressive pelvic girdle weakness and Gowers maneuver belong to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(24010, 606, 'Post-viral acute immune thrombocytopenic purpura (ITP) presenting with generalized petechiae belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24011, 604, 'Hodgkin lymphoma Reed-Sternberg cells and cervical lymphadenopathy belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24018, 591, 'Pneumatic or hydrostatic air-contrast enema reduction for ileocolic intussusception belongs to Module 591 (Surgical GI Disorders).');
recordMove(24024, 608, 'Duchenne muscular dystrophy motor progression and wheelchair dependency by age 12 belong to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(24025, 595, 'Parainfluenza virus type 1 as the primary viral etiology of acute laryngotracheobronchitis (croup) belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24028, 608, 'Measles post-exposure prophylaxis timing and vaccine schedule belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(24031, 605, 'Post-infectious reactive arthritis in pediatric patients belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24035, 589, 'Congenital Toxoplasma gondii infection producing obstructive hydrocephalus belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24036, 597, 'Pediatric dilated cardiomyopathy etiologies, echocardiography, and heart failure belong to Module 597 (Acyanotic Congenital Heart Diseases) / 415.');
recordMove(24060, 595, 'Congenital pulmonary airway malformation (CPAM / CCAM) presenting with recurrent respiratory distress belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24155, 595, 'Respiratory Syncytial Virus (RSV) as the most frequent etiology of viral bronchiolitis in young infants belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24179, 607, 'Packed red blood cell transfusion management for severe chronic childhood anemia belongs to Module 607 (Paediatric Anemias).');
recordMove(24250, 599, 'Posterior urethral valves (PUV) presenting with bladder distension, urinary ascites, and hydronephrosis belongs to Module 599 (Paediatric Nephrology).');
recordMove(24299, 608, 'Childhood absence epilepsy with 3 Hz spike-and-wave discharges on EEG belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24354, 605, 'Henoch-Schönlein purpura (IgA vasculitis) with dependent non-blanching purpura and arthralgia belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24355, 606, 'Wiskott-Aldrich syndrome WAS gene mutation and clinical features belong to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24422, 588, 'Antiretroviral prophylaxis regimens (Nevirapine + Zidovudine) for neonates born to untreated HIV-positive mothers belong to Module 588 (Polio and AIDS).');


// --- Moves from Module 591 (Surgical GI Disorders) ---
recordMove(24061, 608, 'Lead poisoning plumbism in young children presenting with pica, abdominal colic, and behavioral irritability belongs to Module 608 (Mixed / Miscellaneous Topics: Poisoning).');
recordMove(24064, 591, 'Failure of physiological umbilical herniation return in gastroschisis and omphalocele belongs to Module 591 (Surgical GI Disorders).'); // Already in 591!
recordMove(24077, 591, 'Unconjugated hyperbilirubinemia association with congenital hypertrophic pyloric stenosis belongs to Module 591 (Surgical GI Disorders).'); // Already in 591!
recordMove(24201, 608, 'Infected ventriculoperitoneal (VP) shunt with fever and peritonitis in hydrocephalus belongs to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus).');
recordMove(24225, 599, 'Duplicated renal collecting system conservative observational management belongs to Module 599 (Paediatric Nephrology).');
recordMove(24237, 598, 'Post-operative follow-up and evaluation after total surgical intracardiac repair of Tetralogy of Fallot belong to Module 598 (Cyanotic Congenital Heart Diseases).');


// --- Moves from Module 592 (Medical GI Disorders) ---
recordMove(23358, 597, 'Contraindications to pharmacologic closure of patent ductus arteriosus (severe thrombocytopenia <60,000, NEC, active bleed) belong to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24084, 606, 'Factor IX deficiency in Hemophilia B (Christmas disease) belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24087, 599, 'Differential diagnosis of dependent pitting edema in pediatric nephrotic syndrome vs cardiac failure belongs to Module 599 (Paediatric Nephrology).');
recordMove(24088, 592, 'Functional constipation and encopresis managed with osmotic laxatives (PEG) belong to Module 592 (Medical GI Disorders).'); // Already in 592!


// --- Moves from Module 593 (Disorders of the Liver) ---
recordMove(23309, 575, 'Initial enteral feeding fluid volume calculation (60 mL/kg/day) on day 1 of life in a term infant belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24093, 587, 'Glucose-6-phosphatase enzyme deficiency in von Gierke disease (GSD type I) belongs to Module 587 (Metabolic Disorders of Carbohydrates / Glycogen Storage).');
recordMove(24097, 582, 'Vitamin A hypervitaminosis, hepatic stellate cell toxicity, and hyperostosis belong to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(24099, 607, 'Hemosiderosis and secondary iron overload in chronically transfused pediatric patients belong to Module 607 (Paediatric Anemias).');
recordMove(24102, 604, 'Metaiodobenzylguanidine (MIBG) and skeletal scintigraphy for staging neuroblastoma belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24103, 604, 'Wilms tumor triphasic histology and characteristic pulmonary metastasis belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24104, 592, 'Total serum IgA baseline testing when screening for Celiac disease with IgA anti-tTG belongs to Module 592 (Medical GI Disorders).');
recordMove(24109, 587, 'Skin fibroblast culture and biochemical enzyme assays for lysosomal storage diseases belong to Module 587 (Metabolic Disorders of Complex Molecules).');


// --- Moves from Module 594 (Neonatal Respiratory Disorders) ---
recordMove(2517, 608, 'Congenital central hypoventilation syndrome (Ondine curse / PHOX2B mutation) belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23328, 599, 'Autosomal recessive polycystic kidney disease (ARPKD) causing oligohydramnios sequence and pulmonary hypoplasia belongs to Module 599 (Paediatric Nephrology).');
recordMove(23329, 599, 'Persistent hypocomplementemia beyond 8 weeks suggesting membranoproliferative glomerulonephritis (MPGN) belongs to Module 599 (Paediatric Nephrology).');
recordMove(23332, 591, 'Congenital diaphragmatic hernia (CDH) presenting with respiratory distress, scaphoid abdomen, and mediastinal shift belongs to Module 591 (Surgical GI Disorders).');
recordMove(23338, 608, 'Emergency needle thoracostomy in the 2nd intercostal space for tension pneumothorax in an adolescent belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency).');
recordMove(23339, 595, 'Back blows and chest thrusts for foreign body choking management in an infant belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23360, 576, 'Hyperoxia exposure, extreme prematurity, and pathogenetic staging of Retinopathy of Prematurity belong to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(23362, 599, 'Potter sequence secondary to bilateral renal agenesis or severe ARPKD resulting in fatal pulmonary hypoplasia belongs to Module 599 (Paediatric Nephrology).');
recordMove(23363, 599, 'Prognostic risk of end-stage renal disease and hypertension in pediatric ARPKD belongs to Module 599 (Paediatric Nephrology).');
recordMove(23364, 605, 'Systemic corticosteroid therapy for severe renal/gastrointestinal involvement in Henoch-Schönlein purpura belongs to Module 605 (Paediatric Rheumatology).');
recordMove(23472, 577, 'Room air (21% O2) initiation in term neonates during resuscitation to prevent hyperoxic oxidative injury belongs to Module 577 (Apgar score and Neonatal Resuscitation).');
recordMove(23495, 608, 'Duchenne muscular dystrophy X-linked recessive dystrophin deficiency presenting with proximal weakness belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23646, 608, 'Guillain-Barré Syndrome (acute inflammatory demyelinating polyneuropathy) therapy with IVIG/plasmapheresis belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23696, 599, 'Dietary phosphorus restriction and calcium-based phosphate binders in pediatric chronic kidney disease belong to Module 599 (Paediatric Nephrology).');
recordMove(23704, 595, 'IMNCI clinical criteria for fast-breathing non-severe pneumonia in a 3-month-old belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23730, 595, 'Laryngomalacia with floppy arytenoids and omega-shaped epiglottis as the most common cause of congenital stridor belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23736, 582, 'Harrison groove due to chronic diaphragmatic traction on softened rachitic ribs in Vitamin D deficiency belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23760, 588, 'Pneumocystis jirovecii pneumonia (PJP) as the leading opportunistic respiratory infection in pediatric HIV belongs to Module 588 (Polio and AIDS).');
recordMove(23769, 591, 'Gastroschisis eviscerated bowel loops without covering membrane managed with a preformed silo belongs to Module 591 (Surgical GI Disorders).');
recordMove(23785, 597, 'Echocardiographic workup for exertional fatigue and suspected uncorrected congenital heart disease belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23815, 608, 'Becker muscular dystrophy in-frame dystrophin mutation with milder clinical phenotype belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(23943, 595, 'Symptom duration >10 days distinguishing acute bacterial rhinosinusitis from viral URTI in children belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(23949, 608, 'Recurrent encapsulated pyogenic sino-pulmonary infections in Bruton X-linked agammaglobulinemia belong to Module 608 (Mixed / Miscellaneous Topics: Primary Immunodeficiency).');
recordMove(23974, 589, 'Bordetella pertussis paroxysmal staccato whooping cough treated with oral azithromycin belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24002, 595, 'Viral respiratory pathogens (RSV, parainfluenza, influenza, adenovirus) causing childhood pneumonia belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24003, 595, 'IMNCI cough without fast breathing or danger signs managed supportively with home remedies belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24009, 606, 'Benign natural history and spontaneous recovery within 6 months in acute childhood ITP belong to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24032, 595, 'Acute epiglottitis (Haemophilus influenzae type b) with high fever, toxic appearance, drooling, and stridor belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24042, 591, 'Esophageal atresia with tracheoesophageal fistula presenting with copious oral secretions and frothing belongs to Module 591 (Surgical GI Disorders).');
recordMove(24052, 591, 'Degree of pulmonary hypoplasia as the primary determinant of mortality in Congenital Diaphragmatic Hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24062, 590, 'Varicella-zoster immune globulin (VZIG) prophylaxis for immunocompromised nephrotic children exposed to chickenpox belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24065, 591, 'Immediate physical inspection of abdomen for scaphoid contour in suspected neonatal diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24067, 591, 'Absolute contraindication of bag-mask ventilation in congenital diaphragmatic hernia to prevent GI distension belongs to Module 591 (Surgical GI Disorders).');
recordMove(24068, 591, 'Contraindication to positive-pressure mask ventilation in neonates with Bochdalek hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24069, 591, 'Immediate endotracheal intubation at delivery for neonates with suspected congenital diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24070, 591, 'Nasogastric tube decompression in neonates with diaphragmatic hernia to prevent gastric distension belongs to Module 591 (Surgical GI Disorders).');
recordMove(24071, 591, 'Bochdalek posterolateral congenital diaphragmatic hernia with intrathoracic herniation of bowel belongs to Module 591 (Surgical GI Disorders).');
recordMove(24072, 591, 'Type C proximal esophageal atresia with distal tracheoesophageal fistula presenting with frothing and coughing belongs to Module 591 (Surgical GI Disorders).');
recordMove(24076, 591, 'Posterolateral Bochdalek hernia as the most common anatomical variety of congenital diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24116, 595, 'Pseudomonas aeruginosa mucoid colonization in cystic fibrosis lung disease belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24117, 595, 'Pediatric Acute Respiratory Distress Syndrome (PARDS) diagnostic criteria and oxygenation index belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24118, 591, 'Airway security and emergency surgical consultation for esophageal atresia with distal fistula belong to Module 591 (Surgical GI Disorders).');
recordMove(24119, 589, 'Myocarditis and toxin-mediated conduction block as the leading causes of fatality in Corynebacterium diphtheriae belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24123, 595, 'Congenital laryngomalacia natural history of benign resolution by 12 to 18 months belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24124, 595, 'Allergic rhinitis in children managed with intranasal corticosteroids (fluticasone) belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24125, 595, 'Oral amoxicillin outpatient therapy for pediatric community-acquired fast-breathing pneumonia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24126, 595, 'Emergency airway stabilization and endotracheal intubation in acute severe epiglottitis belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24127, 595, 'Pathology of cystic fibrosis bronchiectasis without diffuse primary alveolitis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24128, 595, 'Azithromycin macrolide therapy for atypical community-acquired pneumonia in school-aged children belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24129, 595, 'Normal and tachypneic respiratory rate cutoffs by age group according to IMNCI guidelines belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24130, 605, 'Peak age incidence (4-8 years) of Henoch-Schönlein purpura (IgA vasculitis) belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24131, 598, 'Alprostadil (prostaglandin E1) maintenance of ductal patency in critical congenital heart disease belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24133, 595, 'Humidified supplemental oxygen and supportive therapy for acute viral bronchiolitis belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24134, 595, 'Biphasic inspiratory/expiratory stridor in severe croup requiring nebulized epinephrine and intubation readiness belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24135, 608, 'Intercostal drainage tube insertion site in the 5th intercostal space mid-axillary line for pneumothorax belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Trauma / Surgery).');
recordMove(24136, 595, 'Central cyanosis and chest wall retractions indicating impending respiratory failure in severe pneumonia belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24137, 595, 'Distinguishing stridor in supraglottic epiglottitis from lower airway wheezing belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24139, 608, 'Clinical absence of hemiplegia in symmetrical muscular dystrophies (Duchenne) belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(24140, 597, 'Furosemide and afterload reduction for congestive heart failure in large VSD belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24141, 595, 'IMNCI tachypnea cutoff >50/min defining pneumonia in a 4-month-old infant belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24142, 595, 'High-concentration oxygen and inhaled short-acting beta-agonists (SABA) for acute severe asthma exacerbations belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24144, 595, 'Defective CFTR epithelial regulation of sweat and pancreatic duct chloride transport in CF belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24146, 595, 'Aspiration of volatile hydrocarbons/albuterol nebulization considerations belongs to Module 595 (Childhood Respiratory Disorders) or 608.');
recordMove(24147, 595, 'IMNCI fast breathing in an 18-month-old treated with home oral amoxicillin belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24148, 595, 'Normal respiratory rate ranges (20-30 bpm in a 4-year-old child) belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24149, 576, 'Group B Streptococcus (GBS) early-onset vertical sepsis in a neonate presenting with respiratory distress belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(24154, 595, 'Single-dose oral dexamethasone for viral croup symptom relief belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24156, 595, 'Steeple sign on AP neck radiograph in acute laryngotracheobronchitis (viral croup) belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24157, 595, 'Subglottic narrowing steeple sign on neck X-ray diagnostic of viral croup belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24158, 595, 'Nebulized racemic/L-epinephrine for moderate-to-severe croup with stridor at rest belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24159, 595, 'Respiratory syncytial virus (RSV) as the foremost cause of bronchiolitis in young children belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24173, 608, 'PALS systematic approach (Airway, Breathing, Circulation, Disability) belongs to Module 608 (Mixed / Miscellaneous Topics: PALS).');
recordMove(24240, 594, 'Oropharyngeal airway placement for neonatal upper airway obstruction in micrognathia/choanal atresia belongs to Module 594 (Neonatal Respiratory Disorders).'); // Stays in 594!
recordMove(24243, 576, 'Hypoglycemia and transient tachypnea management in infant of gestational diabetic mother belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(24378, 607, 'Parvovirus B19 aplastic crisis in a child with sickle cell disease belongs to Module 607 (Paediatric Anemias).');
recordMove(24383, 595, 'Anatomical localizing significance of biphasic stridor to the subglottis and cervical trachea belongs to Module 595 (Childhood Respiratory Disorders).');


// --- Moves from Module 595 (Childhood Respiratory Disorders) ---
recordMove(23987, 607, 'Parvovirus B19 triggering transient pure red cell aplasia belongs to Module 607 (Paediatric Anemias).');
recordMove(24053, 592, 'Physiological gastroesophageal reflux disease (GERD) in a 3-week-old presenting with effortless non-bilious vomiting belongs to Module 592 (Medical GI Disorders).');
recordMove(24160, 589, 'Corticosteroids as adjunctive therapy in severe tuberculous pleural effusion belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');


// --- Moves from Module 596 (Fetal Circulation) ---
recordMove(23438, 576, 'Rh and ABO isoimmunization cytotoxic Type II hypersensitivity leading to erythroblastosis fetalis belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(24166, 608, 'Sudden cardiac arrest during sports in an adolescent and emergency automated external defibrillator (AED) utilization belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency / PALS).');
recordMove(24169, 607, 'Beta-thalassemia trait with microcytic hypochromic indices and elevated HbA2 belongs to Module 607 (Paediatric Anemias).');
recordMove(24174, 606, 'Desmopressin (DDAVP) relative contraindication in Type 2B von Willebrand disease due to platelet aggregation and thrombocytopenia belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24175, 607, 'Hemoglobin electrophoresis pattern in Sickle Cell Trait (HbA 60%, HbS 40%, normal HbF) belongs to Module 607 (Paediatric Anemias).');
recordMove(24178, 608, 'Neurocardiogenic / vasovagal syncope as the most prevalent cause of syncope in adolescents belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Cardiology / Neurology).');


// --- Moves from Module 597 (Acyanotic Congenital Heart Diseases) ---
recordMove(23368, 590, 'Congenital Cytomegalovirus (CMV) asymptomatic majority and potential late hearing loss belong to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(23444, 576, 'Crigler-Najjar and Gilbert unconjugated hyperbilirubinemia distinguishing from Rotor conjugated hyperbilirubinemia belongs to Module 576 (Diseases in Neonates requiring Special Care) / 593.');
recordMove(23602, 585, 'DiGeorge syndrome cleft palate, micrognathia, refractory hypocalcemia, and thymic hypoplasia belong to Module 585 (Chromosomal Disorders).');
recordMove(23698, 583, 'Defective post-translational hydroxylation of proline and lysine in scurvy belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(23706, 599, 'NPHS1 gene mutation encoding nephrin in congenital nephrotic syndrome of the Finnish type belongs to Module 599 (Paediatric Nephrology).');
recordMove(23786, 589, 'Manifestations of early and late congenital syphilis belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(23903, 589, 'HLA-DQ3 association with severity of congenital toxoplasmosis belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24029, 590, 'Congenital rubella syndrome classic triad (SNHL, nuclear cataracts, patent ductus arteriosus) belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24043, 591, 'Defective closure of the pleuroperitoneal canal in Bochdalek congenital diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24073, 591, 'Fetoscopic endoluminal tracheal occlusion (FETO) for severe congenital diaphragmatic hernia belongs to Module 591 (Surgical GI Disorders).');
recordMove(24075, 591, 'Prognostic stratification in congenital diaphragmatic hernia based on onset beyond 48 hours of life belongs to Module 591 (Surgical GI Disorders).');
recordMove(24111, 598, 'Transposition of the Great Arteries (d-TGA) presenting with cyanosis and parallel circuits at birth belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24112, 598, 'Transposition of Great Arteries egg-on-a-string appearance and cyanosis belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24187, 598, 'Hypoplastic left heart syndrome (HLHS) presenting with ductal closure, cardiogenic shock, and poor systemic perfusion belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24188, 605, 'Complete congenital heart block associated with transplacental anti-Ro/SSA antibodies in neonatal lupus belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24194, 577, 'Immediate bag-mask positive pressure ventilation (PPV) for an apneic neonate during NRP belongs to Module 577 (Apgar score and Neonatal Resuscitation).');
recordMove(24195, 585, 'Turner syndrome cardiovascular associations (Bicuspid aortic valve, Coarctation of aorta) belongs to Module 585 (Chromosomal Disorders).');
recordMove(24196, 595, 'Laryngomalacia as the most common congenital laryngeal anomaly producing inspiratory stridor belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24197, 606, 'Pediatric hypereosinophilic syndrome hematologic criteria and multi-organ infiltration belong to Module 606 (Paediatric Hematology).');
recordMove(24198, 608, 'Aqueductal stenosis as the most common cause of non-communicating congenital hydrocephalus belongs to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus).');
recordMove(24199, 608, 'Nusinersen antisense oligonucleotide targeting SMN2 splicing in Spinal Muscular Atrophy belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');
recordMove(24200, 608, 'Sturge-Weber syndrome leptomeningeal venous angioma, facial port-wine stain, and focal seizures belong to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(24202, 608, 'Embryological failure of anterior neuropore closure at day 24-26 producing anencephaly belongs to Module 608 (Mixed / Miscellaneous Topics: CNS Malformations).');
recordMove(24203, 608, 'Dandy-Walker malformation posterior fossa cyst, cerebellar vermis agenesis, and elevated torcula belong to Module 608 (Mixed / Miscellaneous Topics: CNS Malformations).');
recordMove(24204, 598, 'Hypoplastic left heart syndrome presentation with circulatory collapse on ductal closure belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24208, 598, 'Tetralogy of Fallot protected from pulmonary overcirculation and heart failure by RVOT obstruction belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24209, 598, 'Cyanosis in Transposition of the Great Arteries with VSD belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24211, 607, 'Diamond-Blackfan anemia congenital pure red cell aplasia with triphalangeal thumbs belongs to Module 607 (Paediatric Anemias).');
recordMove(24212, 608, 'Basic Life Support (BLS) sequence: verifying scene safety and shouting for nearby help belongs to Module 608 (Mixed / Miscellaneous Topics: PALS / BLS).');
recordMove(24214, 598, 'Total Anomalous Pulmonary Venous Return (TAPVR) associated with Ellis-van Creveld chondroectodermal dysplasia belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24216, 605, 'Neonatal lupus erythematosus transplacental anti-Ro/La antibodies causing congenital permanent AV block belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24221, 599, 'Posterior urethral valves (PUV) as the most frequent structural etiology of bladder outlet obstruction in males belongs to Module 599 (Paediatric Nephrology).');
recordMove(24222, 595, 'Bronchopulmonary sequestration left lower lobe predilection and aberrant systemic arterial supply belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24223, 599, 'Subureteric Teflon/Deflux injection (STING procedure) for endoscopic correction of vesicoureteral reflux belongs to Module 599 (Paediatric Nephrology).');
recordMove(24224, 599, 'Podocyte slit-diaphragm mutations (NPHS1, NPHS2) in congenital nephrotic syndrome belong to Module 599 (Paediatric Nephrology).');
recordMove(24232, 598, 'Transposition of great arteries and total anomalous pulmonary venous return demonstrating increased pulmonary blood flow belong to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24234, 598, 'Total anomalous pulmonary venous connection (TAPVC) having identical oxygen saturations in all four cardiac chambers belongs to Module 598 (Cyanotic Congenital Heart Diseases).');
recordMove(24273, 600, 'Thyroid dysgenesis (ectopy, agenesis, hypoplasia) as the most common etiology of permanent congenital hypothyroidism belongs to Module 600 (Disorders of Thyroid).');
recordMove(24275, 600, 'Thyroid dyshormonogenesis enzyme defects in congenital hypothyroidism belong to Module 600 (Disorders of Thyroid).');


// --- Moves from Module 598 (Cyanotic Congenital Heart Diseases) ---
recordMove(23375, 597, 'Evaluation of asymptomatic innocent murmur with normal echocardiogram in a newborn belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24235, 575, 'Cold stress and neonatal thermoregulation assessment belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24247, 608, 'Cyanotic breath-holding spells provoked by anger or crying in toddlers belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24248, 597, 'Endocardial cushion defect (atrioventricular septal defect) "goose-neck" deformity on LV angiography belongs to Module 597 (Acyanotic Congenital Heart Diseases).');


// --- Moves from Module 599 (Paediatric Nephrology) ---
recordMove(24256, 608, 'Bedwetting moisture-sensing alarm (bell-and-pad) conditioning therapy for nocturnal enuresis belongs to Module 608 (Mixed / Miscellaneous Topics: Child Development / Behavioral).');
recordMove(24305, 604, 'Wilms tumor hematogenous metastatic predilection to the pulmonary parenchyma belongs to Module 604 (Solid Neoplasms of Childhood).');


// --- Moves from Module 601 (Congenital Adrenal Hyperplasia and Related Disorders) ---
recordMove(2960, 599, 'Gitelman syndrome hypokalemic metabolic alkalosis with hypocalciuria and hypomagnesemia belongs to Module 599 (Paediatric Nephrology).');
recordMove(23817, 585, 'Bloom syndrome BLM gene helicase mutation with short stature and chromosomal instability belongs to Module 585 (Chromosomal Disorders).');
recordMove(23829, 585, 'Turner syndrome (45,X) associated cystic hygroma and coarctation of the aorta belong to Module 585 (Chromosomal Disorders).');
recordMove(23872, 586, 'Phenylketonuria phenylacetate accumulation causing classic mousy/musty urinary odor belongs to Module 586 (Metabolic Disorders of Amino Acids).');
recordMove(23965, 595, 'Delta-F508 deletion of phenylalanine at codon 508 in CFTR gene in cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24228, 597, 'Ostium primum Atrial Septal Defect with left axis deviation on ECG belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24278, 575, 'Erythema toxicum neonatorum self-limiting papulopustular eruption with eosinophilic smear belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24284, 587, 'Lysosomal acid lipase deficiency in Wolman disease with hepatosplenomegaly and adrenal calcification belongs to Module 587 (Metabolic Disorders of Complex Molecules).');
recordMove(24285, 576, 'Hyperinsulinemic hypoglycemia in neonates born to diabetic mothers belongs to Module 576 (Diseases in Neonates requiring Special Care).');
recordMove(24286, 599, 'Calcineurin inhibitors (tacrolimus / cyclosporine) for steroid-resistant nephrotic syndrome belong to Module 599 (Paediatric Nephrology).');
recordMove(24288, 607, 'Hereditary spherocytosis with recurrent jaundice, splenomegaly, and increased osmotic fragility belongs to Module 607 (Paediatric Anemias).');
recordMove(24289, 575, 'Standard newborn dried blood spot metabolic and endocrinologic screening panel belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24293, 591, 'Midgut volvulus with malrotation presenting with acute intestinal ischemia and melena belongs to Module 591 (Surgical GI Disorders).');
recordMove(24307, 599, 'Immunization schedule and pneumococcal vaccination prior to pediatric renal transplantation belong to Module 599 (Paediatric Nephrology).');
recordMove(24388, 585, 'Pleiotropy single gene defect producing multiple diverse phenotypic manifestations belongs to Module 585 (Chromosomal Disorders).');
recordMove(24389, 585, 'Genetic principle of pleiotropy in monogenic syndromic conditions belongs to Module 585 (Chromosomal Disorders).');


// --- Moves from Module 602 (Disorders of the Pituitary Gland) ---
recordMove(24297, 590, 'Epstein-Barr virus infectious mononucleosis transmission via salivary contact belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');


// --- Moves from Module 603 (Disorders of Puberty) ---
recordMove(24301, 608, 'Neurofibromatosis type 1 diagnostic criteria and associated complications belong to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(24302, 608, 'PALS 2020 chest compression rate of 100-120/min during pediatric CPR belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency / PALS).');
recordMove(24303, 608, 'Neurofibromatosis type 1 diagnostic criteria and clinical complications belong to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');


// --- Moves from Module 604 (Solid Neoplasms of Childhood) ---
recordMove(9336, 585, 'Fragile X syndrome FMR1 mutation as the leading inherited genetic cause of intellectual disability belongs to Module 585 (Chromosomal Disorders).');
recordMove(23356, 584, 'Oral rehydration salts (ORS) with elemental zinc supplementation for childhood acute diarrhea belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23475, 584, 'WHO dehydration classification (severe dehydration needing Plan C IV fluids) belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23521, 607, 'Diamond-Blackfan congenital hypoplastic anemia distinguishing from neonatal hemorrhagic anemia belongs to Module 607 (Paediatric Anemias).');
recordMove(23740, 584, 'IMNCI yellow-coded some dehydration management with Plan B ORS belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23924, 608, 'Childhood absence epilepsy 3 Hz spike-wave discharges responsive to ethosuximide or valproate belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23926, 592, 'Contraindication of antimotility agents (loperamide) in pediatric acute infectious dysentery belongs to Module 592 (Medical GI Disorders).');
recordMove(23927, 608, 'Benign childhood epilepsy with centrotemporal spikes (BECTS / Rolandic epilepsy) belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23928, 599, 'Pediatric urinary tract infection etiology and bacterial pathogens belong to Module 599 (Paediatric Nephrology).');
recordMove(23929, 599, 'Time duration (4 to 6 weeks) defining steroid-resistant nephrotic syndrome in children belongs to Module 599 (Paediatric Nephrology).');
recordMove(23930, 599, 'Severe hypoalbuminemia and selective proteinuria in minimal change nephrotic syndrome belong to Module 599 (Paediatric Nephrology).');
recordMove(23931, 599, 'Normal serum C3 complement levels in minimal change disease vs hypocomplementemic glomerulonephritides belongs to Module 599 (Paediatric Nephrology).');
recordMove(23960, 608, 'Ataxia-telangiectasia with ATM mutation, progressive cerebellar ataxia, and elevated alpha-fetoprotein belongs to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular / Neurocutaneous).');
recordMove(24306, 591, 'Meckel diverticulum with heterotopic gastric mucosa as an incidental finding during appendectomy belongs to Module 591 (Surgical GI Disorders).');
recordMove(24320, 605, 'Kawasaki disease genetic susceptibility loci including ITPKC gene mutations belongs to Module 605 (Paediatric Rheumatology).');


// --- Moves from Module 605 (Paediatric Rheumatology) ---
recordMove(23337, 604, 'Burkitt lymphoma jaw mass presenting with rapidly enlarging mandibular osteolytic lesion belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23340, 599, 'Sequential diagnostic imaging algorithm (USG, MCUG, DMSA scan) for recurrent pediatric UTIs belongs to Module 599 (Paediatric Nephrology).');
recordMove(23373, 597, 'Secundum Atrial Septal Defect wide fixed split S2 and pulmonary systolic flow murmur belong to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(23454, 608, 'Pediatric CPR chest compression depth (at least one-third anterior-posterior diameter of the chest) belongs to Module 608 (Mixed / Miscellaneous Topics: Emergency / PALS).');
recordMove(23517, 578, 'Establishment of true motor handedness by 3 years of age belongs to Module 578 (Developmental Milestones).');
recordMove(23556, 579, 'Laron dwarfism growth hormone receptor insensitivity with elevated GH and low IGF-1 belongs to Module 579 (Facets of Growth and Development).');
recordMove(23593, 579, 'Anterior fontanelle closure timing between 9 and 18 months belongs to Module 579 (Facets of Growth and Development).');
recordMove(23732, 582, 'X-linked hypophosphatemic rickets defective renal tubular phosphate reabsorption belongs to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(23733, 606, 'Hemophilia A factor VIII deficiency, X-linked recessive inheritance, and prolonged aPTT belong to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(23734, 607, 'Nutritional vitamin B12 deficiency megaloblastic anemia with elevated MCV belongs to Module 607 (Paediatric Anemias).');
recordMove(23743, 584, 'IMNCI Plan B oral rehydration therapy for some dehydration in acute diarrhea belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23746, 584, 'Hypernatremic dehydration manifestations (doughy skin, irritability, hypertonia) belong to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23757, 608, 'Behavioral conditioning and bell-and-pad alarm therapy for pediatric nocturnal enuresis belong to Module 608 (Mixed / Miscellaneous Topics: Child Development).');
recordMove(23808, 604, 'Testicular sanctuary relapse in childhood Acute Lymphoblastic Leukemia (ALL) belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(23820, 585, 'Turner syndrome (45,XO) with pedal lymphedema, short stature, and webbed neck belongs to Module 585 (Chromosomal Disorders).');
recordMove(23897, 599, 'Bedside Schwartz formula for estimated glomerular filtration rate calculation in pediatric renal failure belongs to Module 599 (Paediatric Nephrology).');
recordMove(23954, 608, 'Ventriculoperitoneal (VP) shunt colonization and CSF culture in pediatric hydrocephalus belong to Module 608 (Mixed / Miscellaneous Topics: Hydrocephalus).');
recordMove(23955, 608, 'Catch-up vaccination for unimmunized 10-year-old child with Td tetanus-diphtheria toxoid belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23956, 596, 'Premature constriction and closure of fetal ductus arteriosus caused by antenatal maternal indomethacin belongs to Module 596 (Fetal Circulation).');
recordMove(23957, 584, 'Respiratory alkalosis secondary to hyperventilation inducing acute carpopedal spasm belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(23961, 608, 'Minimum 4-week interval between non-simultaneously administered live parenteral vaccines belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(23962, 608, 'Risk factors for recurrence of simple and complex febrile seizures belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(23966, 595, 'High-dose inhaled SABA, ipratropium, and systemic steroids for life-threatening acute asthma exacerbation belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(23968, 599, 'Ectopic ureter inserting below the external urethral sphincter causing continuous dribbling of urine in females belongs to Module 599 (Paediatric Nephrology).');
recordMove(23969, 608, 'Plexiform neurofibroma as a pathognomonic diagnostic feature of Neurofibromatosis-1 belongs to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(24170, 597, 'Post-ductal coarctation of the aorta presenting with upper limb hypertension and delayed femoral pulses belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24183, 607, 'Sickle cell disease disease-modifying therapies and monoclonal antibodies belong to Module 607 (Paediatric Anemias).');
recordMove(24220, 584, 'Emergency management of hyperkalemia (calcium gluconate, insulin-dextrose, salbutamol) belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(24233, 597, 'Radio-femoral delay and upper vs lower limb blood pressure gradient in Coarctation of the Aorta belong to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24311, 604, 'Bronchial carcinoid tumor as the most common primary malignant pulmonary neoplasm in children belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24403, 608, 'Corticotropin (ACTH) as the first-line therapeutic agent for epileptic spasms in West syndrome belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24419, 608, 'Two-dose human papillomavirus (HPV) vaccination schedule for girls aged 9 to 14 years belongs to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(24557, 604, 'Peripheral blood smear and complete blood counts as initial diagnostic investigation in suspected acute lymphoblastic leukemia belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24574, 585, 'Mendelian modes of inheritance (autosomal dominant, autosomal recessive, X-linked) belong to Module 585 (Chromosomal Disorders).');
recordMove(24576, 580, 'Pasteurized donor human milk (DHM) as the optimal feeding alternative when maternal breast milk is unavailable belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(24577, 608, 'Catch-up vaccination guidelines for missed primary DPT doses belong to Module 608 (Mixed / Miscellaneous Topics: Immunization).');
recordMove(24578, 608, 'Tongue fasciculations resulting from anterior horn cell degeneration in Spinal Muscular Atrophy belong to Module 608 (Mixed / Miscellaneous Topics: Neuromuscular).');


// --- Moves from Module 606 (Paediatric Hematology - Introduction, Bleeding, and Clotting Disorders) ---
recordMove(23431, 592, 'Cow milk protein-induced allergic proctocolitis presenting with painless rectal bleeding in a formula-fed infant belongs to Module 592 (Medical GI Disorders).');
recordMove(23787, 608, 'Severe dehydration secondary to acute diarrhea as the leading cause of shock in pediatric patients belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Emergency / Shock).');
recordMove(24348, 608, 'Post-varicella acute cerebellitis presenting with sudden-onset truncal ataxia in young children belongs to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24352, 583, 'Nutritional scurvy presenting with subperiosteal hematoma, bleeding spongy gums, and corkscrew hairs belongs to Module 583 (Deficiency of Water-soluble Vitamins & Trace Elements).');
recordMove(24356, 591, 'Ectopic gastric mucosa in Meckel diverticulum predisposing to painless massive lower GI hemorrhage belongs to Module 591 (Surgical GI Disorders).');
recordMove(24360, 590, 'Dengue hemorrhagic fever presenting with petechiae and positive capillary fragility tourniquet test belongs to Module 590 (Measles, Mumps, Rubella and Other Viral Infections).');
recordMove(24365, 595, 'Rigid bronchoscopy under general anesthesia as the gold standard for tracheobronchial foreign body extraction belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24366, 608, 'Intracranial space-occupying lesions causing pediatric headache, morning vomiting, and papilledema belong to Module 608 (Mixed / Miscellaneous Topics: Pediatric Neurology).');
recordMove(24371, 607, 'Aplastic anemia pancytopenia and hypocellular bone marrow belong to Module 607 (Paediatric Anemias).');
recordMove(24375, 607, 'Secondary hemochromatosis and iron overload complications in beta-thalassemia major belong to Module 607 (Paediatric Anemias).');
recordMove(24376, 607, 'Sickle cell dactylitis (hand-foot syndrome) as the earliest vaso-occlusive manifestation in infants belongs to Module 607 (Paediatric Anemias).');


// --- Moves from Module 607 (Paediatric Anemias) ---
recordMove(2502, 576, 'Rhesus isoimmunization erythroblastosis fetalis presenting with severe neonatal anemia and hydrops fetalis belongs to Module 576 (Diseases in Neonates requiring Special Care).');


// --- Moves from Module 608 (Mixed / Miscellaneous Topics) ---
recordMove(24386, 579, 'Left wrist and hand radiography (Greulich and Pyle atlas) for bone age skeletal assessment belongs to Module 579 (Facets of Growth and Development).');
recordMove(24390, 595, 'Leukotriene receptor antagonists (montelukast) maintenance therapy vs acute SABA relievers in asthma belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24391, 605, 'Juvenile Dermatomyositis with Gottron papules, heliotrope rash, proximal muscle weakness, and elevated CK belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24392, 605, 'Single-dose intravenous immunoglobulin (IVIG 2 g/kg) and high-dose aspirin first-line therapy for Kawasaki Disease belong to Module 605 (Paediatric Rheumatology).');
recordMove(24397, 593, 'Wilson disease ATP7B copper transport mutation, low ceruloplasmin, and Kayser-Fleischer rings belong to Module 593 (Disorders of the Liver).');
recordMove(24399, 605, 'High-dose oral aspirin therapy for acute migratory polyarthritis in Acute Rheumatic Fever belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24400, 597, 'Viridans group streptococci (Streptococcus viridans) as the predominant etiology of infective endocarditis in CHD belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24401, 591, 'Etiological lead points and risk factors for ileocolic intussusception (Meckel diverticulum, polyp, lymphoma) belong to Module 591 (Surgical GI Disorders).');
recordMove(24404, 604, 'Birbeck pentalaminar tennis-racket granules in Langerhans Cell Histiocytosis belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24411, 599, 'Diagnostic imaging sequence (USG, MCUG, DMSA) in children following recurrent febrile UTIs belongs to Module 599 (Paediatric Nephrology).');
recordMove(24413, 599, 'pRIFLE and KDIGO staging of pediatric acute kidney injury based on oliguria urine output belongs to Module 599 (Paediatric Nephrology).');
recordMove(24414, 599, 'Vesicoureteral reflux (VUR) as the primary predisposing structural anomaly in recurrent pediatric UTIs belongs to Module 599 (Paediatric Nephrology).');
recordMove(24415, 599, 'Bladder exstrophy exposed posterior bladder mucosa and epispadias in a newborn belongs to Module 599 (Paediatric Nephrology).');
recordMove(24418, 584, 'Elemental zinc supplementation (20 mg/day for 14 days) in acute childhood diarrhea belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(24420, 605, 'Juvenile Dermatomyositis proximal muscle weakness, Gowers sign, and elevated muscle enzymes belong to Module 605 (Paediatric Rheumatology).');
recordMove(24421, 589, 'Scrub typhus (Orientia tsutsugamushi) with eschar, hepatosplenomegaly, and oral doxycycline therapy belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24423, 589, 'Erythromycin or penicillin G chemoprophylaxis for close household contacts of respiratory diphtheria belongs to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24424, 589, 'Oral third-generation cephalosporins (cefixime) for uncomplicated enteric fever (Salmonella Typhi) belong to Module 589 (Paediatric Bacterial and Parasitic Infections).');
recordMove(24425, 579, 'WHO chronological definition of adolescence (10 to 19 years) belongs to Module 579 (Facets of Growth and Development).');
recordMove(24426, 578, 'Gross motor milestone of crawling on hands and knees at 8 to 9 months belongs to Module 578 (Developmental Milestones).');
recordMove(24428, 578, 'Milestones of independent running and stranger/separation anxiety (18-20 months) belong to Module 578 (Developmental Milestones).');
recordMove(24429, 578, 'Fine motor milestone of established cerebral hand preference by 36 months belongs to Module 578 (Developmental Milestones).');
recordMove(24431, 575, 'Asymmetric Moro reflex etiologies (clavicular fracture, brachial plexus Erb palsy) belong to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24433, 580, 'Safe storage duration guidelines for expressed breast milk at room temperature belongs to Module 580 (Nutrition and Breastfeeding).');
recordMove(24434, 575, 'Benign subperiosteal cephalhematoma spontaneously resorbing without aspiration belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24435, 585, 'Turner syndrome short stature, low posterior hairline, and webbed neck belong to Module 585 (Chromosomal Disorders).');
recordMove(24436, 585, 'Klinefelter syndrome (47,XXY) elevated FSH and LH with testicular atrophy belongs to Module 585 (Chromosomal Disorders).');
recordMove(24437, 585, 'Klinefelter syndrome 47,XXY hypergonadotropic hypogonadism and azoospermic male infertility belong to Module 585 (Chromosomal Disorders).');
recordMove(24438, 585, 'Prophylactic laparoscopic gonadectomy in Turner mosaicism with Y chromosome material (45,X/46,XY) belongs to Module 585 (Chromosomal Disorders).');
recordMove(24439, 595, 'Right main bronchus anatomical verticality predisposing to pediatric aspirated foreign bodies belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24441, 595, 'Acute severe childhood asthma presentation with wheeze, tachypnea, and accessory muscle use belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24443, 595, 'Sweat and exocrine pancreatic secretion chloride elevation in cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24444, 595, 'Oral amoxicillin (80-90 mg/kg/day) as first-line outpatient therapy for fast-breathing chest-indrawing pneumonia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24445, 595, 'Staphylococcus aureus empyema thoracis in young children requiring chest tube drainage belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24446, 595, 'Cystic fibrosis malabsorption, steatorrhea, and elevated sweat chloride belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24447, 595, 'Nasal nitric oxide (nNO) measurement as screening tool for primary ciliary dyskinesia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24448, 595, 'Inspiratory stridor exacerbated by crying and supine posture in congenital laryngomalacia belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24449, 595, 'Status asthmaticus acute therapy (high-flow O2, continuous nebulized albuterol, systemic methylprednisolone) belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24450, 595, 'Pediatric spirometry and bronchodilator reversibility criteria (FEV1 increase >=12%) in asthma belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24451, 595, 'Sweat chloride iontophoresis testing in cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24452, 595, 'Class II CFTR folding mutation (Delta-F508) in cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24453, 595, 'CFTR potentiators (ivacaftor) vs correctors (lumacaftor, tezacaftor, elexacaftor) belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24454, 595, 'Kartagener syndrome triad of situs inversus, chronic sinusitis, and bronchiectasis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24455, 595, 'Low-dose inhaled budesonide daily controller therapy for persistent pediatric asthma belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24467, 605, 'Absence of thrombocytopenia (normal or elevated platelet count) distinguishing HSP from ITP belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24468, 605, 'Gottron papules over metacarpophalangeal and proximal interphalangeal joints in Juvenile Dermatomyositis belong to Module 605 (Paediatric Rheumatology).');
recordMove(24469, 605, 'Palpable non-thrombocytopenic purpura on dependent lower extremities in IgA vasculitis (HSP) belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24470, 605, 'Long-term risk of progressive chronic glomerulonephritis and renal impairment in HSP belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24498, 587, 'Acid alpha-glucosidase (acid maltase) lysosomal deficiency in Pompe disease (GSD type II) belongs to Module 587 (Metabolic Disorders of Carbohydrates / Glycogen Storage).');
recordMove(24500, 592, 'Gluten-containing cereals (wheat, semolina, rye, barley) to strictly avoid in Celiac disease belong to Module 592 (Medical GI Disorders).');
recordMove(24503, 584, 'WHO reduced-osmolarity oral rehydration solution equimolar 1:1 sodium and glucose ratio belongs to Module 584 (Fluid and Electrolyte Disorders).');
recordMove(24504, 591, 'Ileocolic intussusception presenting with colicky abdominal pain, red currant jelly stool, and sausage mass belongs to Module 591 (Surgical GI Disorders).');
recordMove(24505, 604, 'Syndromic associations of Wilms tumor (WAGR, Denys-Drash, Beckwith-Wiedemann) belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24506, 607, 'Beta-thalassemia major "crew-cut" / "hair-on-end" appearance on skull radiograph belongs to Module 607 (Paediatric Anemias).');
recordMove(24507, 607, 'WHO threshold criteria defining childhood anemia in children aged 5 to 11 years (Hb <11.5 g/dL) belongs to Module 607 (Paediatric Anemias).');
recordMove(24508, 604, 'Brentuximab vedotin anti-CD30 antibody-drug conjugate for relapsed pediatric Hodgkin lymphoma belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24510, 604, 'Trilateral retinoblastoma (bilateral ocular retinoblastomas plus pinealoblastoma) belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24511, 607, 'Severe acquired aplastic anemia in an adolescent managed with allogeneic hematopoietic stem cell transplantation belongs to Module 607 (Paediatric Anemias).');
recordMove(24512, 604, 'Nephroblastoma (Wilms tumor) as the most prevalent intra-abdominal solid organ malignancy in preschool children belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24513, 604, 'Chang operative staging system for pediatric medulloblastoma based on tumor extent and CSF dissemination belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24514, 604, 'Favorable prognostic factors in childhood B-ALL (age 1-9 years, hyperdiploidy, low initial WBC) belong to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24516, 606, 'Severe Type 3 von Willebrand disease mimicking Hemophilia A with markedly reduced Factor VIII and severe mucosal bleeding belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24517, 606, 'Platelet-type pseudo-von Willebrand disease with gain-of-function GP Ib mutation belongs to Module 606 (Paediatric Hematology: Bleeding & Clotting).');
recordMove(24518, 607, 'Sickle cell disease management with hydroxyurea and supportive care belongs to Module 607 (Paediatric Anemias).');
recordMove(24520, 604, 'Granulocytic sarcoma (chloroma) presenting as extramedullary proptosis in pediatric acute myeloid leukemia belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24521, 607, 'Globin gene DNA sequencing for definitive diagnosis of complex thalassemia syndromes belongs to Module 607 (Paediatric Anemias).');
recordMove(24524, 605, 'Duration of secondary penicillin chemoprophylaxis (5 years or until age 21) in Acute Rheumatic Fever without carditis belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24525, 597, 'Tender congestive hepatomegaly as the most sensitive early clinical sign of infant congestive heart failure belongs to Module 597 (Acyanotic Congenital Heart Diseases).');
recordMove(24534, 585, 'Turner syndrome dermatologic features (pigmented melanocytic nevi, low posterior hairline) belong to Module 585 (Chromosomal Disorders).');
recordMove(24535, 595, 'Anatomical predilection for right main bronchus foreign body impaction in children belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24536, 595, 'Congenital laryngomalacia inspiratory stridor worsening in supine position belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24537, 595, 'Staphylococcus aureus as the predominant respiratory pathogen in young children with cystic fibrosis belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24538, 595, 'Oropharyngeal candidiasis (oral thrush) as the most frequent local side effect of inhaled corticosteroids belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24539, 588, 'Pneumocystis jirovecii pneumonia opportunistic presentation in pediatric HIV belongs to Module 588 (Polio and AIDS).');
recordMove(24540, 595, 'Pre-exercise warm-up and short-acting beta-2 agonist (SABA) premedication for exercise-induced bronchoconstriction belong to Module 595 (Childhood Respiratory Disorders).');
recordMove(24549, 604, 'Medulloblastoma posterior fossa midline cerebellar vermis origin with drop metastasis risk belongs to Module 604 (Solid Neoplasms of Childhood).');
recordMove(24554, 592, 'Anti-tissue transglutaminase (tTG) IgA serology for diagnostic evaluation of Celiac disease belongs to Module 592 (Medical GI Disorders).');
recordMove(24556, 607, 'Transcranial Doppler (TCD) arterial velocity annual screening for primary stroke prevention in sickle cell anemia belongs to Module 607 (Paediatric Anemias).');
recordMove(24558, 605, 'Migratory flitting polyarthritis of large joints adhering to modified Jones criteria in Acute Rheumatic Fever belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24559, 605, 'Intramuscular benzathine penicillin G every 3 to 4 weeks for secondary prophylaxis in Acute Rheumatic Fever belongs to Module 605 (Paediatric Rheumatology).');
recordMove(24560, 575, 'Cephalhematoma subperiosteal blood collection strictly limited by cranial suture margins belongs to Module 575 (Basics of Neonatology and Routine Newborn Care).');
recordMove(24561, 578, 'Fine motor milestones of building a tower of 6 cubes and turning a doorknob at 24 months belong to Module 578 (Developmental Milestones).');
recordMove(24562, 582, 'Vitamin D-dependent rickets (VDDR type 1: 1-alpha-hydroxylase defect vs type 2: VDR receptor mutation) biochemical profiles belong to Module 582 (Deficiency of Fat Soluble Vitamins).');
recordMove(24565, 608, 'Isolated or plexiform neurofibroma in Neurofibromatosis type 1 belongs to Module 608 (Mixed / Miscellaneous Topics: Neurocutaneous).');
recordMove(24566, 607, 'Beta-globin gene sequencing in transfusion-dependent thalassemia major belongs to Module 607 (Paediatric Anemias).');
recordMove(24568, 578, 'Fine motor milestone of voluntary bidextrous reach for objects emerging at 3 to 4 months belongs to Module 578 (Developmental Milestones).');
recordMove(24569, 595, 'Acute epiglottitis caused by Haemophilus influenzae type b presenting with toxic fever and respiratory distress belongs to Module 595 (Childhood Respiratory Disorders).');
recordMove(24570, 585, 'Fragile X syndrome FMR1 trinucleotide repeat expansion and clinical features belong to Module 585 (Chromosomal Disorders).');
recordMove(24572, 599, 'Distal (type 1), proximal (type 2), and hyperkalemic (type 4) renal tubular acidosis in children belong to Module 599 (Paediatric Nephrology).');
recordMove(24579, 604, 'Peripheral blood film and bone marrow biopsy for chloroma / myeloid sarcoma in pediatric AML belong to Module 604 (Solid Neoplasms of Childhood).');


// =========================================================================
// OUTPUT GENERATION & AUDIT VALIDATION
// =========================================================================

console.log(`\n========================================================`);
console.log(`AUDIT RESULTS FOR PEDIATRICS (Modules 575 to 608):`);
console.log(`Total questions audited: ${rawQuestions.length}`);
console.log(`Total flagged questions to move: ${moves.length}`);
console.log(`========================================================\n`);

// Cross-subject count
const crossSubjectMoves = moves.filter(m => m.toModule < 575 || m.toModule > 608);
const intraPedsMoves = moves.filter(m => m.toModule >= 575 && m.toModule <= 608);
console.log(`Cross-subject moves: ${crossSubjectMoves.length}`);
console.log(`Intra-Pediatrics moves: ${intraPedsMoves.length}`);

// Breakdown by destination subject
const destSubjects = {};
moves.forEach(m => {
  const mod = modMap.get(m.toModule);
  destSubjects[mod.subjectName] = (destSubjects[mod.subjectName] || 0) + 1;
});
console.log('\nMoves by destination subject:', destSubjects);

// Save to tools/audit_deep_pediatrics.json
const outputData = {
  subject: 'Pediatrics',
  totalQuestions: rawQuestions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_pediatrics.json', JSON.stringify(outputData, null, 2), 'utf8');
console.log('\nSuccessfully saved findings to tools/audit_deep_pediatrics.json');

process.exit(0);
