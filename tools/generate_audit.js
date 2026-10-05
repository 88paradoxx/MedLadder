const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('tools/anaesthesia_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

const moduleMap = {};
allModules.forEach(m => {
  moduleMap[m.moduleId] = m;
});

// Let's create an explicit map of decisions for each question that needs to be moved.
// Each move will have: { id, fromModule, toModule, reason }

const movesMap = new Map();

function proposeMove(id, toModule, reason) {
  const q = questions.find(item => item.id === id);
  if (!q) {
    console.error(`Warning: question ${id} not found.`);
    return;
  }
  if (q.module_id === toModule) {
    // Already in target module
    return;
  }
  movesMap.set(id, {
    id: q.id,
    fromModule: q.module_id,
    toModule: toModule,
    reason: reason
  });
}

// ==========================================
// MODULE 609 (History and Ethical Aspects)
// ==========================================
proposeMove(18963, 673, "Presents a clinical case of tuberculous spondylodiscitis (Pott's spine) with D5-D6 discitis, vertebral collapse, and paraspinal cold abscess; belongs to Orthopaedics under Skeletal Tuberculosis (Module 673).");
proposeMove(24589, 610, "Focuses on preoperative smoking cessation timelines (4-8 weeks) to optimize perioperative respiratory and ciliary function; core topic of Preoperative Evaluation (Module 610).");
proposeMove(24590, 610, "Evaluates clinical predictors of Obstructive Sleep Apnoea (OSA) such as daytime somnolence during preoperative assessment for bariatric surgery; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24597, 457, "Deals with ECG diagnosis and management of sinus bradycardia/heart block presenting with syncope; belongs to Medicine under Ventricular Arrhythmias and Heart Blocks (Module 457).");
proposeMove(24598, 631, "Identifies female gender and history as major independent risk factors for Postoperative Nausea and Vomiting (PONV, Apfel score); belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24800, 629, "Evaluates Tensilon (edrophonium) test to differentiate myasthenic crisis from cholinergic crisis in myasthenia gravis; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(24878, 618, "Addresses arterial blood gas analysis and optimization of myocardial oxygen delivery via packed RBC transfusion in a post-op CAD/COPD patient; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25104, 620, "Discusses avoidance of halothane in patients with a history of unexplained post-anaesthetic jaundice (halothane hepatitis); belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25127, 631, "Addresses safe induction agents in patients with family history of Malignant Hyperthermia (MH); belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25201, 622, "Tests contraindications and safety profile of thiopentone in acute intermittent porphyria; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25202, 622, "Focuses on selection of propofol as safe intravenous induction agent that does not prolong QT interval in congenital long QT syndrome; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25203, 619, "Tests the pharmacological duration mismatch between pyridostigmine and atropine during reversal of neuromuscular blockade leading to late bradycardia; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade Reversal (Module 619).");
proposeMove(25274, 623, "Focuses on ketamine as the intravenous induction agent of choice in acute trauma/hypovolemic shock due to sympathomimetic support; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25286, 622, "Identifies propofol as safe intravenous anaesthetic agent in acute porphyria; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25294, 623, "Evaluates cardiovascular stability and minimal hemodynamic alteration of etomidate in coronary disease and aortic stenosis; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25301, 623, "Tests avoidance of ketamine due to increased cerebral blood flow and intracranial pressure in traumatic acute subdural hematoma; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25306, 623, "Focuses on ketamine as the preferred analgesic and induction agent for pediatric burn debridement and dressings; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25514, 624, "Differentiates allergic reactions between ester and amide local anesthetics based on PABA metabolism; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25582, 631, "Presents clinical presentation of TURP syndrome (hypertension, bradycardia, fluid overload, restlessness) during transurethral prostatic resection under spinal anesthesia; belongs to Complications of Anaesthesia (Module 631).");

// ==========================================
// MODULE 610 (Preoperative Evaluation)
// ==========================================
proposeMove(16218, 660, "Clinical vignette of painful abduction (painful arc 60-120°) due to supraspinatus tendonitis/rotator cuff pathology; belongs to Orthopaedics under Injuries of Clavicle, Shoulder and Arm (Module 660).");
proposeMove(16464, 685, "Presents shoulder pain during tennis serve diagnosed as supraspinatus tendinitis; belongs to Orthopaedics under Sports Injury (Module 685).");
proposeMove(17375, 659, "Features neck pain and occipital headache with degenerative cervical spine changes (cervical spondylosis); belongs to Orthopaedics under Regional Conditions of Neck (Module 659).");
proposeMove(18353, 662, "Presents dorsal wrist swelling fluctuating in size diagnosed as ganglion cyst; belongs to Orthopaedics under Injuries of Hand (Module 662).");
proposeMove(24623, 609, "Focuses on informed consent and medicolegal aspects of anaesthesia practice; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(24626, 629, "Addresses contraindication of laparoscopic surgery and pneumoperitoneum in patients with moderate to severe cardiac disease; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(24629, 630, "Covers replacement fluid calculation and isotonic crystalloid (Lactated Ringer's) administration in pediatric surgery; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24638, 619, "Tests the addition of atropine to neostigmine to block muscarinic side effects during reversal of neuromuscular blockade; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade (Module 619).");
proposeMove(24946, 619, "Focuses on sugammadex for rapid pharmacological encapsulation and reversal of steroidal neuromuscular blocker rocuronium; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade (Module 619).");
proposeMove(24954, 629, "Evaluates safe analgesics and avoidance of histamine-releasing agents in bronchial asthma during anesthesia; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25057, 629, "Evaluates drug contraindications (succinylcholine, pethidine, sevoflurane) in end-stage renal disease with hyperkalemia; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25058, 629, "Evaluates drug precautions and muscle relaxant choice in end-stage renal disease with hyperkalemia; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25407, 629, "Covers intraoperative hemodynamics and hypertensive triggers during laparoscopic adrenalectomy for pheochromocytoma; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25580, 627, "Addresses clinical characteristics of post-dural puncture headache (PDPH) improving in supine posture; belongs to Regional Anaesthesia: Complications and Contraindications (Module 627).");
proposeMove(25581, 627, "Focuses on timing of urgent surgical evacuation (within 6-8 hours) for spinal epidural hematoma following epidural anesthesia; belongs to Regional Anaesthesia: Complications and Contraindications (Module 627).");
proposeMove(25603, 632, "Covers indications for spinal cord stimulation (SCS) in neuropathic, phantom, and complex regional pain syndromes; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// ==========================================
// MODULE 611 (CNS and CVS Monitoring)
// ==========================================
proposeMove(18567, 667, "Presents avascular necrosis (AVN) of femoral head following chronic steroid use; belongs to Orthopaedics under AVN and Regional Conditions of Lower Limb (Module 667).");
proposeMove(24592, 614, "Explains denitrogenation of FRC during preoxygenation prior to tracheal intubation; belongs to Intubation (Module 614).");
proposeMove(24593, 237, "Tests active metabolites of synthetic and natural opioids (morphine-6-glucuronide, normeperidine); belongs to Pharmacology under Synthetic Opioids (Module 237).");
proposeMove(24596, 616, "Compares vacuum-insulated evaporator (VIE) liquid oxygen bulk supply to cylinder manifolds; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24649, 612, "Analyzes carboxyhemoglobin causing falsely elevated SaO2 on dual-wavelength pulse oximetry; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24650, 612, "Analyzes dyshemoglobins causing falsely elevated SaO2 readings on pulse oximetry; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24654, 612, "Evaluates technical features and disadvantages of sidestream capnography; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24655, 612, "Interprets capnograph waveform showing expiratory upstroke prolongation (shark-fin pattern) in bronchospasm; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24656, 614, "Identifies continuous waveform capnography as the gold-standard confirmation of endotracheal tube placement; belongs to Intubation (Module 614).");
proposeMove(24657, 614, "Defines endpoint of adequate preoxygenation (EtO2 > 90% or EtN2 < 5%) before intubation; belongs to Intubation (Module 614).");
proposeMove(24826, 617, "Tests chest compression rate (100-120/min) and depth as components of high-quality CPR; belongs to ACLS (Module 617).");
proposeMove(24879, 630, "Covers signs and symptoms of amniotic fluid embolism in obstetric anaesthesia; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25138, 616, "Explains electrical heating requirement and pressurized vaporization in the Tec 6 desflurane vaporizer; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25544, 624, "Defines tumescent local anesthesia solution and technique used in liposuction; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25706, 632, "Describes stellate ganglion sympathetic block for post-arterial cannulation vasospasm and complex regional pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// ==========================================
// MODULE 612 (Respiratory Monitoring)
// ==========================================
proposeMove(24620, 610, "Assigns ASA physical status classification (ASA II) for elective cesarean delivery in uncomplicated pregnancy; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24652, 611, "Presents pneumothorax as a mechanical complication of subclavian central venous line cannulation; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24661, 623, "Covers side effects of alpha-2 agonist dexmedetomidine (hypotension, bradycardia); belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(24662, 623, "Tests pharmacological effects and clinical indications of dexmedetomidine sedation; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(24670, 630, "Covers pathophysiology and risk factors of retinopathy of prematurity (ROP) in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24678, 616, "Tests pressure unit conversion in anaesthesia machines and breathing circuits (1 kPa = 10 cmH2O); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24680, 630, "Evaluates fluid resuscitation and electrolyte correction for infant with bowel obstruction; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24681, 630, "Discusses preductal arterial line cannulation (right radial artery) in congenital diaphragmatic hernia repair; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24683, 630, "Identifies heart rate as the primary determinant of cardiac output in infants due to non-compliant ventricles; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24694, 618, "Evaluates oxygen delivery devices and caution with uncontrolled high-flow O2 in acute asthmatic/COPD exacerbation; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24881, 41, "Covers physiological mechanisms of high-altitude acclimatization (hypoxic ventilatory drive and hyperventilation); belongs to Physiology under Respiratory Physiology (Module 41).");
proposeMove(24882, 618, "Calculates oxygen flow rate and entrainment ratio for 28% oxygen delivery via Venturi mask in COPD; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25204, 622, "Tests respiratory depressant effects and decrease in hypoxic ventilatory drive with midazolam; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25206, 622, "Tests dose-dependent medullary respiratory depression and apnea produced by thiopentone; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");

// ==========================================
// MODULE 613 (Airway Devices)
// ==========================================
proposeMove(24695, 610, "Focuses on diabetic stiff joint syndrome ('prayer sign') as a preoperative bedside predictor of difficult airway; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24696, 621, "Discusses inhalational induction with sweet-smelling, non-pungent sevoflurane in pediatric surgery; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(24699, 618, "Classifies variable-performance oxygen delivery devices (nasal prongs, simple face masks); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24700, 618, "Identifies contraindications to non-invasive positive pressure ventilation (BiPAP); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24705, 614, "Presents airway management and rapid sequence induction (RSI) in acute traumatic abdominal stab wound with full stomach; belongs to Intubation (Module 614).");
proposeMove(24706, 481, "Covers fluid resuscitation and transfusion goals in hemorrhagic hypovolemic shock following trauma; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(24709, 614, "Evaluates vocal cord mobility on extubation after thyroidectomy to assess recurrent laryngeal nerve injury; belongs to Intubation (Module 614).");
proposeMove(24719, 618, "Covers systemic and pulmonary oxygen toxicity associated with prolonged hyperoxia; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24729, 631, "Presents acute intraoperative hypoxemia during laparoscopic surgery due to pneumothorax or gas embolism; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24755, 614, "Calculates uncuffed endotracheal tube internal diameter in a 4-year-old child using Motoyama/Cole formula; belongs to Intubation (Module 614).");
proposeMove(24813, 618, "Differentiates fixed-performance (Venturi) from variable-performance oxygen delivery devices; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24814, 618, "Covers passive airway humidification methods using Heat and Moisture Exchangers (HME); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24886, 618, "Matches various oxygen delivery devices with their respective maximum delivered FiO2 percentages; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24887, 618, "Identifies Venturi mask as a fixed-performance device providing accurate, predictable FiO2 (24-60%); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24889, 618, "Explains principles of High Air Flow Oxygen Enriched (HAFOE) Venturi devices; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24947, 619, "Evaluates neuromuscular blockers with minimal histamine release (vecuronium, rocuronium) safe in reactive airway disease; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockers (Module 619).");
proposeMove(24948, 619, "Covers absolute contraindication of succinylcholine in burns contractures due to lethal receptor upregulation hyperkalemia; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(24949, 619, "Presents profound sinus bradycardia following repeat or rapid bolus of succinylcholine during RSI; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25133, 621, "Identifies sevoflurane as the agent of choice for inhalational induction due to pleasant odor and lack of airway irritation; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25167, 632, "Details principles, lockout intervals, and benefits of patient-controlled analgesia (PCA); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25406, 416, "Presents post-pituitary resection central diabetes insipidus with hypernatremia and dilute polyuria; belongs to Medicine under Posterior Pituitary - ADH, Diabetes Insipidus (Module 416).");
proposeMove(25442, 632, "Details the WHO three-step analgesic ladder for cancer pain management; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25475, 630, "Describes sudden cardiovascular collapse, hypoxia, and coagulopathy from amniotic fluid embolism in labor; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25536, 624, "Presents cardiac arrest from local anesthetic systemic toxicity (LAST) treated with 20% lipid emulsion; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25594, 481, "Explains Poiseuille's law regarding large-bore peripheral cannula versus central lines for rapid fluid resuscitation; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25630, 624, "Presents accidental intravenous injection of epidural bupivacaine causing LAST and resuscitation protocol with lipid rescue; belongs to Local Anaesthetics - General Properties (Module 624).");

// ==========================================
// MODULE 614 (Intubation)
// ==========================================
proposeMove(24711, 613, "Covers functions of the cuff, pilot balloon, and obturator on a tracheostomy tube; belongs to Airway Devices (Module 613).");
proposeMove(24715, 613, "Identifies specialized supraglottic/intubating airway device from image; belongs to Airway Devices (Module 613).");
proposeMove(24716, 630, "Covers clinical signs of acute epiglottitis and stridor in pediatric airway emergencies; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24717, 613, "Lists limitations and disadvantages of the classic Laryngeal Mask Airway (LMA); belongs to Airway Devices (Module 613).");
proposeMove(24752, 628, "Describes hemidiaphragmatic paresis and Horner's syndrome following interscalene brachial plexus block; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(24753, 630, "Presents hypochloremic hypokalemic metabolic alkalosis in infantile hypertrophic pyloric stenosis; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24754, 630, "Covers NRP guidelines for neonatal resuscitation with meconium-stained amniotic fluid; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24765, 610, "Focuses on ramped positioning and preoperative airway preparation in morbid obesity; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24766, 484, "Details ATLS primary survey priorities in poly-trauma management; belongs to Surgery under Trauma - Scores, Investigations and Assessment (Module 484).");
proposeMove(24769, 610, "Explains the clinical objective and execution of the modified Mallampati test; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24773, 612, "Tests clinical conditions promptly detected by capnography monitoring; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24774, 630, "Identifies anatomical position of the glottis (C3 level) in premature neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24775, 630, "Details airway emergency management and inhalational induction for pediatric acute epiglottitis; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24776, 631, "Presents intraoperative subcutaneous emphysema and pneumoperitoneum complications during laparoscopy; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24777, 631, "Presents masseter muscle spasm following succinylcholine as a harbinger of malignant hyperthermia; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24778, 630, "Discusses techniques of general anesthesia induction in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24779, 630, "Identifies failed intubation and aspiration as the leading cause of maternal mortality under general anesthesia; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24788, 630, "Explains post-intubation subglottic edema and croup in pediatric airway anatomy; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24789, 612, "Interprets capnograph waveform showing cardiac oscillations; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24790, 612, "Interprets capnograph waveform showing esophageal intubation (rapid loss of CO2 waveform); belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(24791, 613, "Covers clinical indications and contraindications for emergency needle and surgical cricothyroidotomy; belongs to Airway Devices (Module 613).");
proposeMove(24793, 630, "Evaluates choice of airway management (LMA vs ETT) in pediatric elective inguinal hernia repair; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24794, 630, "Defines acceptable endotracheal tube leak pressure (20-25 cmH2O) to prevent subglottic stenosis in children; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24802, 629, "Addresses anaesthetic considerations in chronic liver disease and coagulopathy; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(24803, 611, "Discusses hemodynamic shifts and invasive arterial line monitoring in hypertensive patients during laparoscopy; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24807, 630, "Evaluates regional vs general anaesthetic choice for cesarean delivery in severe pre-eclampsia; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24808, 630, "Discusses advantages of spinal anaesthesia over general anaesthesia in pregnant patients; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24815, 618, "Details physiological mechanisms of High-Flow Nasal Oxygen (HFNO) therapy in ICU; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24883, 618, "Identifies non-rebreathing reservoir mask with filter for oxygen therapy in COVID-19; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24890, 630, "Explains left lateral uterine displacement to prevent aortocaval compression syndrome in parturient; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24950, 619, "Covers contraindications of succinylcholine (hyperkalemia, burns, denervation injury, muscular dystrophies); belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(24951, 619, "Evaluates choice of neuromuscular blocker in emergency trauma laparotomy; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(24952, 630, "Focuses on drug of choice for routine pediatric intubation and muscle relaxant safety; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25135, 621, "Discusses sevoflurane as a sole inhalational agent for induction and facilitating intubation without relaxants; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25155, 628, "Discusses supraclavicular/infraclavicular brachial plexus block for distal radius fracture fixation; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25315, 623, "Discusses ketamine induction in hemorrhagic shock with hypotension; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25373, 630, "Calculates neonatal maintenance and replacement fluids in a 14-day-old infant undergoing laparotomy; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25508, 624, "Presents systemic toxicity (LAST) with bupivacaine during supraclavicular brachial plexus block; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25564, 626, "Covers spinal anaesthesia technique, landmarks, and dermatomal block level for inguinal hernia repair; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25574, 609, "Matches foundational pioneers of anaesthesia (Priestley, Koller, Morton, Simpson) with their discoveries; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25575, 630, "Discusses anaesthetic technique in HELLP syndrome and platelet count threshold for neuraxial blockade; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25687, 630, "Covers general anaesthetic induction and airway management in emergency cesarean section for preeclampsia; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25699, 629, "Lists anaesthetic implications of Down syndrome (atlantoaxial instability, subglottic stenosis, congenital heart disease); belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");

// ==========================================
// MODULE 615 (Breathing Systems)
// ==========================================
proposeMove(24722, 484, "Presents ATLS initial resuscitation and primary survey protocol in multiple trauma fractures; belongs to Surgery under Trauma - Scores, Investigations and Assessment (Module 484).");
proposeMove(24724, 617, "Identifies recovery position used for unconscious but spontaneously breathing patients in BLS/CPR; belongs to ACLS (Module 617).");
proposeMove(24816, 617, "Details indication for recovery position in resuscitation of an unconscious breathing victim; belongs to ACLS (Module 617).");
proposeMove(24817, 617, "Explains the purpose and timing of the recovery position in cardiac life support; belongs to ACLS (Module 617).");
proposeMove(24823, 632, "Describes systemic neuroendocrine and sympathetic responses to acute trauma pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(24824, 621, "Discusses xenon as an inert carrier gas alternative to nitrous oxide; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(24825, 631, "Presents delayed emergence from anaesthesia secondary to intraoperative hypothermia in prolonged laparotomy; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24828, 611, "Identifies 2% chlorhexidine in 70% alcohol as the preferred skin antiseptic for central line insertion; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24829, 630, "Discusses caudal epidural block for postoperative analgesia in infant hydrocele repair; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24831, 614, "Covers features, indication, and preformed angles of oral and nasal RAE (Ring-Adair-Elwyn) tubes; belongs to Intubation (Module 614).");
proposeMove(24844, 618, "Covers design, non-rebreathing valve, and ventilation mechanics of the self-inflating manual resuscitation bag (Ambu bag); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24875, 617, "Tests standard guidelines for adult cardiopulmonary resuscitation (compression:ventilation ratio 30:2, depth 5-6 cm); belongs to ACLS (Module 617).");
proposeMove(24892, 618, "Explains the Bernoulli principle and jet-entrainment mechanism of the Venturi oxygen mask; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(24925, 618, "Covers continuous positive airway pressure (CPAP) applied during spontaneous respiration; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25095, 621, "Discusses corrosive and rubber-dissolving chemical properties of halogenated ethers; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");

// ==========================================
// MODULE 616 (Anaesthesia Workstation)
// ==========================================
proposeMove(25014, 629, "Discusses anaesthetic induction and avoidance of succinylcholine to prevent raised IOP in open globe injury; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25561, 626, "Identifies spinal needles (pencil-point Whitacre/Sprotte vs cutting Quincke) from image; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25665, 614, "Covers principles, tidal volume breathing versus vital capacity breaths during preoxygenation; belongs to Intubation (Module 614).");

// ==========================================
// MODULE 617 (ACLS)
// ==========================================
proposeMove(24874, 481, "Presents hemodynamic resuscitation of hemorrhagic/distributive shock with vasopressors in ICU poly-trauma; belongs to Surgery under Shock and Blood Transfusion (Module 481).");

// ==========================================
// MODULE 618 (Ventilation and O2 Delivery Systems)
// ==========================================
proposeMove(18704, 326, "Clinical presentation of unilateral sensorineural hearing loss, vertigo, and absent corneal reflex due to acoustic neuroma / vestibular schwannoma; belongs to ENT under Acoustic Neuroma (Module 326).");
proposeMove(24594, 610, "Focuses on preoperative fasting guidelines (2-4-6-8 rule) and pulmonary risk assessment; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24635, 610, "Covers preoperative pulmonary function and cervical spine flexion-extension evaluation in rheumatoid arthritis; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24721, 614, "Explains Hagen-Poiseuille equation determinants of endotracheal tube airflow resistance (radius to 4th power, length); belongs to Intubation (Module 614).");
proposeMove(24737, 613, "Covers indications, sizing, and contraindications of nasopharyngeal airways; belongs to Airway Devices (Module 613).");
proposeMove(24738, 613, "Covers anatomy and dual-lumen function of the Esophageal-Tracheal Combitube; belongs to Airway Devices (Module 613).");
proposeMove(24739, 613, "Identifies second-generation supraglottic airway device (i-gel) from image; belongs to Airway Devices (Module 613).");
proposeMove(24741, 613, "Lists defining features of second-generation LMAs (gastric drainage port, higher seal pressure); belongs to Airway Devices (Module 613).");
proposeMove(24746, 613, "Details airway maneuvers (jaw thrust, two-person technique) for difficult bag-mask ventilation; belongs to Airway Devices (Module 613).");
proposeMove(24783, 613, "Discusses gastric distension and pulmonary aspiration risks following vigorous mask ventilation; belongs to Airway Devices (Module 613).");
proposeMove(24792, 613, "Covers surgical versus percutaneous dilatational tracheostomy indications in prolonged ICU intubation; belongs to Airway Devices (Module 613).");
proposeMove(24827, 615, "Identifies the standard position of the fresh gas inlet in circle breathing systems; belongs to Breathing Systems (Module 615).");
proposeMove(24835, 615, "Analyzes fresh gas flow requirements to prevent rebreathing in Mapleson systems; belongs to Breathing Systems (Module 615).");
proposeMove(24838, 615, "Calculates fresh gas flow requirements (2.5-3x minute ventilation) for Jackson-Rees circuit (Mapleson F); belongs to Breathing Systems (Module 615).");
proposeMove(24839, 615, "Explains why Mapleson A is the most efficient circuit for spontaneous breathing; belongs to Breathing Systems (Module 615).");
proposeMove(24842, 615, "Identifies Mapleson A (Magill attachment) as having the fresh gas inlet most distant from the patient; belongs to Breathing Systems (Module 615).");
proposeMove(24845, 615, "Identifies Mapleson E (Ayre's T-piece) as lacking a reservoir bag; belongs to Breathing Systems (Module 615).");
proposeMove(24858, 616, "Explains oxygen failure safety device (fail-safe valve / Ritchie whistle) cut-off mechanism; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24876, 617, "Details BLS assessment and chest compression initiation in adult cardiac arrest; belongs to ACLS (Module 617).");
proposeMove(24877, 617, "Identifies agonal gasps as a sign of cardiac arrest requiring immediate CPR in BLS protocol; belongs to ACLS (Module 617).");
proposeMove(24900, 610, "Lists clinical predictors of difficult mask ventilation (BONES mnemonic: Beard, Obese, No teeth, Elderly, Snorer); belongs to Preoperative Evaluation (Module 610).");
proposeMove(24902, 617, "Details management of acute foreign body airway obstruction and choking (Heimlich maneuver / BLS); belongs to ACLS (Module 617).");
proposeMove(24904, 616, "Identifies circuit disconnection as the most common mechanical delivery failure on anaesthesia workstations; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24908, 630, "Interprets normal physiological transitional oxygen saturation in neonate at 5 minutes; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24909, 616, "Details anaesthesia workstation checklist and equipment for Non-Operating Room Anaesthesia (NORA); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24910, 614, "Covers preoxygenation goals and denitrogenation kinetics before tracheal intubation; belongs to Intubation (Module 614).");
proposeMove(24911, 632, "Covers transdermal fentanyl delivery pharmacokinetics in chronic cancer pain management; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(24912, 632, "Describes intrathecal catheter tip granuloma (inflammatory mass) in chronic intrathecal opioid therapy; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(24928, 615, "Identifies Bain's coaxial circuit (modified Mapleson D) as a universal circuit; belongs to Breathing Systems (Module 615).");
proposeMove(24930, 617, "Tests standard AHA recommendations for effective adult CPR metrics; belongs to ACLS (Module 617).");
proposeMove(24932, 610, "Focuses on primary risk factors predicting difficult bag-mask ventilation (edentulous, beard, high BMI); belongs to Preoperative Evaluation (Module 610).");
proposeMove(24933, 611, "Tests the critical threshold of cerebral blood flow (18-20 mL/100g/min) below which cerebral ischemia ensues; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24935, 619, "Details the higher mg/kg dosage requirement of succinylcholine in infants due to larger volume of distribution; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(24936, 630, "Tests average quantitative blood loss during cesarean delivery; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24955, 619, "Details management of prolonged succinylcholine apnea due to atypical plasma pseudocholinesterase; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25025, 631, "Presents clinical signs and acute hypermetabolic state of malignant hyperthermia during general anesthesia; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25074, 620, "Explains avoidance of nitrous oxide following intraocular sulfur hexafluoride (SF6) gas bubble injection; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25136, 621, "Discusses low density and laminar flow properties of heliox gas mixture in airway obstruction; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25270, 623, "Selects ketamine for dissociative anesthesia and analgesia during painful burn contracture dressing; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25478, 624, "Identifies bupivacaine cardiotoxicity and refractory ventricular arrhythmias following accidental IV injection; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25652, 630, "Covers neonatal resuscitation and airway management for meconium-stained amniotic fluid at post-term delivery; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25691, 630, "Covers resuscitation protocols for maternal cardiac arrest, aortocaval decompression, and perimortem cesarean section; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25700, 615, "Evaluates advantages and mechanical simplicity of Mapleson breathing circuits; belongs to Breathing Systems (Module 615).");

// ==========================================
// MODULE 619 (Depolarising Muscle Relaxants)
// ==========================================
proposeMove(24958, 236, "Describes opioid-induced chest wall rigidity ('wooden chest syndrome') caused by high-dose fentanyl bolus; belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(24959, 29, "Defines myocardial afterload as the tension required to overcome aortic pressure before ventricular ejection; belongs to Physiology under Cardiac Electrophysiology, Cardiac Cycle and Cardiac Output (Module 29).");
proposeMove(24977, 611, "Describes anatomical landmarks of Sedillot's triangle for internal jugular vein cannulation; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24978, 631, "Presents severe accidental intraoperative hypothermia (28°C) during prolonged abdominal surgery; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24992, 631, "Compares clinical features and pathophysiology of Malignant Hyperthermia versus Neuroleptic Malignant Syndrome; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24993, 630, "Tests total body water percentage (75-80%) and fluid distribution in term neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25006, 632, "Covers definitions and neurobiological features of acute versus chronic pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25007, 470, "Presents tight band-like bilateral frontal headache diagnosed as tension-type headache; belongs to Medicine under Headache (Module 470).");
proposeMove(25016, 658, "Evaluates late signs of acute limb compartment syndrome (pulselessness); belongs to Orthopaedics under Complications of Fracture (Module 658).");
proposeMove(25614, 628, "Describes piercing and anatomical course of the musculocutaneous nerve through coracobrachialis muscle in axillary nerve blocks; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25623, 628, "Describes ultrasound scanning and anatomical relationships during axillary brachial plexus block; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25651, 611, "Identifies ulnar nerve stimulation at the wrist as the standard site for peripheral neuromuscular monitoring; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25701, 631, "Explains mechanism of dantrolene sodium blocking ryanodine receptor type 1 (RYR1) in malignant hyperthermia treatment; belongs to Complications of Anaesthesia (Module 631).");

// ==========================================
// MODULE 620 (Inhaled Anaesthetics - Properties, N2O and Halothane)
// ==========================================
proposeMove(25028, 619, "Details pharmacological comparison and stereoisomerism of cisatracurium versus atracurium; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockers (Module 619).");
proposeMove(25029, 619, "Compares organ-independent Hofmann elimination and histamine release of atracurium and cisatracurium; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockers (Module 619).");
proposeMove(25064, 616, "Identifies medical gas cylinder color-coding standards (oxygen, nitrous oxide, air); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25071, 616, "Covers NIOSH standards for operating room trace gas exposure limits (halothane < 0.5 ppm, N2O < 25 ppm); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25076, 631, "Presents acute intraoperative atelectasis and lung collapse during general anesthesia; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25096, 609, "Covers historic milestone of WTG Morton's public demonstration of ether at the Ether Dome (1846); belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25108, 609, "Identifies Joseph Priestley as the discoverer of nitrous oxide (1772); belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25112, 616, "Tests international color coding of medical air cylinders (white body with black and white shoulder / yellow); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25116, 616, "Explains why oxygen flowmeter is placed downstream nearest to the common gas outlet to prevent hypoxia; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25117, 616, "Tests capacity and volume of a full oxygen E-cylinder (660 L at 2000 psi); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25118, 616, "Explains why nitrous oxide cylinder pressure remains 745 psi until liquid is exhausted; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25119, 616, "Identifies black body with white shoulder cylinder (oxygen) for COVID-19 therapy; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25141, 621, "Identifies desflurane as having the lowest blood-gas partition coefficient (0.42) among volatile halogenated agents; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25142, 621, "Identifies epileptogenic spike-and-wave EEG activity associated with enflurane; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25143, 621, "Identifies methoxyflurane as causing fluoride-induced high-output renal failure; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25144, 621, "Covers inorganic fluoride ion liberation among fluorinated volatile anaesthetics; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25145, 621, "Compares structural isomers isoflurane and enflurane; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25148, 621, "Tests blood:gas partition coefficient of desflurane (0.42) determining rapid recovery; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25152, 621, "Explains coronary steal syndrome through dilation of resistance arterioles by isoflurane; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25197, 621, "Identifies sevoflurane as the inhalational agent of choice for mask induction in pediatric patients; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25199, 621, "Explains degradation of sevoflurane by desiccated soda lime to produce nephrotoxic Compound A; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25595, 623, "Covers pharmacological properties of dexmedetomidine as an anesthetic adjuvant for conscious sedation; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25702, 631, "Identifies volatile inhalational agents and succinylcholine as triggers of malignant hyperthermia; belongs to Complications of Anaesthesia (Module 631).");

// ==========================================
// MODULE 621 (Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases)
// ==========================================
proposeMove(24847, 615, "Explains chemical reaction of trichloroethylene (Trilene) with soda lime generating cranial nerve toxic dichloroacetylene and phosgene; belongs to Breathing Systems (Module 615).");
proposeMove(24982, 619, "Covers succinylcholine-induced fasciculations and muscle relaxation pharmacology; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25032, 619, "Discusses extrahepatic Hofmann degradation of atracurium and cisatracurium; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockers (Module 619).");
proposeMove(25035, 619, "Covers succinylcholine-induced hyperkalemia (0.5 mEq/L rise in normal, massive in denervation); belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25054, 619, "Covers atypical pseudocholinesterase variants metabolizing succinylcholine and mivacurium; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25056, 629, "Discusses doxorubicin cardiotoxicity and preoperative echocardiographic assessment in pediatric oncology; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25123, 620, "Explains the Second Gas Effect produced by rapid uptake of high-volume nitrous oxide; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25137, 616, "Explains pressure-regulated heated vaporization at 39°C and 2 atmospheres in the Tec 6 desflurane vaporizer; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25146, 616, "Identifies electrically heated specialized vaporizer (Tec 6) required for desflurane; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25159, 616, "Explains Charles's law governing gas volume and temperature relationships in anaesthetic equipment; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25160, 147, "Defines physical and chemical sterilization of surgical equipment; belongs to Microbiology under Sterilization and Disinfection (Module 147).");
proposeMove(25168, 616, "Analyzes flowmeter crack and hypoxic gas mixture hazard in workstation pneumatic systems; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25169, 616, "Tests standard operating pressure of medical gas pipeline systems (50-55 psi / 4 bar); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25170, 616, "Tests NIOSH recommended upper limit for waste anesthetic nitrous oxide in operating rooms (25 ppm); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25171, 632, "Covers pharmacological therapies for neuropathic pain (gabapentinoids, SNRIs, TCAs); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25172, 620, "Explains rapid expansion of air-filled spaces (pulmonary bullae) caused by nitrous oxide diffusion; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25174, 631, "Details risk scoring and antiemetic prophylaxis for postoperative nausea and vomiting (PONV); belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25175, 630, "Explains rapid inhalational induction in neonates due to high minute ventilation to FRC ratio; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25176, 630, "Covers mechanisms of heat loss (radiation, convection, evaporation) in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25177, 630, "Covers organogenesis (weeks 3-8) as the period of maximum fetal susceptibility to teratogens; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25178, 620, "Identifies nitrous oxide as not causing uterine muscle relaxation compared to volatile halogenated agents; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25179, 616, "Analyzes variable-bypass Tec vaporizer output compensation at high altitude; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25182, 630, "Discusses NSAID (ketorolac) avoidance in third trimester pregnancy due to premature closure of ductus arteriosus; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25185, 623, "Covers short-acting analgesics and NSAIDs suitable for outpatient/OPD day-care surgery analgesia; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25192, 620, "Explains pseudocritical temperature (-7°C) and Poynting effect during storage of Entonox cylinders; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25195, 481, "Details hypocalcemia, hyperkalemia, and hypothermia during massive blood transfusion; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25213, 622, "Lists clinical applications of midazolam (sedation, anxiolysis, anterograde amnesia, anticonvulsant); belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25215, 622, "Explains the Robin Hood (reverse steal) phenomenon produced by intravenous barbiturates in focal cerebral ischemia; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25217, 622, "Details inverse steal phenomenon during barbiturate vasoconstriction of normal cerebral vessels; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25265, 622, "Identifies methohexital as an epileptogenic barbiturate used for electroconvulsive therapy; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25293, 622, "Details safe and contraindicated induction agents in porphyria; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25335, 623, "Explains direct myocardial depression unmasked by ketamine in catecholamine-depleted ICU patients; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25483, 628, "Discusses cutaneous innervation and nerve localization techniques for ankle block; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25484, 624, "Compares allergic potential between ester and amide local anesthetics; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25666, 620, "Defines MAC (Minimum Alveolar Concentration) as the standard measure of inhalational anesthetic potency; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25703, 631, "Lists earliest clinical indicators of malignant hyperthermia (unexplained rise in end-tidal CO2, tachycardia, masseter spasm); belongs to Complications of Anaesthesia (Module 631).");

// ==========================================
// MODULE 622 (Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol)
// ==========================================
proposeMove(24600, 609, "Celebrates World Anaesthesia Day (October 16, 1846) marking Morton's demonstration; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(24601, 616, "Explains physical principles of volatility, vapor pressure, and vaporization in anaesthesia; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24602, 616, "Lists performance criteria and temperature compensation features of an ideal vaporizer; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24603, 616, "Tests mechanical quality and pressure safety tests performed on medical gas cylinders; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24604, 616, "Identifies components of variable-bypass vaporizers and workstations from image; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24605, 632, "Lists clinical etiologies and diagnostic differentiation of chronic low back pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(24606, 632, "Defines hyperpathia as an abnormally painful reaction to a painful stimulus, especially with repetitive stimuli; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(24607, 616, "Explains workstation safety rule requiring cylinder valves to be closed when pipeline supply is connected; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(24608, 652, "Presents selective photothermolysis with pulsed dye laser for treating large port-wine stain (capillary malformation); belongs to Dermatology under Genodermatoses & Nutritional Disorders (Module 652).");
proposeMove(25271, 623, "Identifies etomidate as a carboxylated imidazole derivative; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25295, 625, "Discusses intravenous lidocaine to suppress cough reflex and prevent laryngospasm during extubation; belongs to Local Anaesthetics - Specific Drugs (Module 625).");
proposeMove(25296, 623, "Covers minimal respiratory depressant and ventilatory drive effects of etomidate; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25297, 623, "Lists clinical contraindications to ketamine (raised ICP, severe ischemic heart disease, psychiatric illness); belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25299, 623, "Explains myoclonus and disinhibitory motor activity during etomidate induction; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25300, 623, "Evaluates cardiovascular stability and maintenance of coronary perfusion with etomidate in aortic stenosis; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25303, 623, "Discusses benzodiazepine premedication (midazolam) to prevent ketamine-induced emergence delirium; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25309, 623, "Discusses hemodynamic preservation and potent somatic analgesia of ketamine compared to propofol/etomidate; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25310, 623, "Identifies etomidate as the most hemodynamically stable intravenous induction agent; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25311, 623, "Lists characteristic side effects of ketamine (salivation, emergence delirium, nystagmus, raised ICP); belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25314, 623, "Discusses avoidance of etomidate in Addisonian crisis due to inhibition of 11-beta-hydroxylase; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25316, 623, "Evaluates pharmacological properties and bronchodilator activity of ketamine; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25318, 623, "Explains why etomidate infusion is contraindicated for ICU sedation due to adrenocortical suppression; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25319, 623, "Identifies non-competitive NMDA receptor phencyclidine site blockade as ketamine's primary site of action; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25320, 623, "Covers clinical precautions and adrenal suppression with etomidate in critical illness; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25321, 623, "Details central nervous system effects of ketamine (dissociative state, catatonia, amnesia); belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25322, 623, "Identifies propylene glycol solvent in etomidate formulation responsible for pain on injection and thrombophlebitis; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25323, 623, "Covers lack of antiplatelet effect of ketamine; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25324, 623, "Tests pharmacological statements concerning etomidate metabolism and kinetics; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25325, 623, "Explains decrease in cerebral metabolic rate (CMRO2) and intracranial pressure produced by etomidate; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25326, 623, "Selects etomidate as induction agent for emergency ruptured abdominal aortic aneurysm repair; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25328, 623, "Evaluates true/false statements regarding sympathomimetic and cardiovascular actions of ketamine; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25329, 623, "Explains paradoxical hypotension induced by ketamine in end-stage catecholamine-depleted shock; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25332, 623, "Discusses subanesthetic ketamine infusions to reduce postoperative opioid consumption; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25333, 623, "Details adverse effects of etomidate including adrenocortical suppression and myoclonus; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25334, 623, "Covers ester hydrolysis metabolism and pharmacokinetic profile of etomidate; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25336, 623, "Covers reversible inhibition of 11-beta-hydroxylase by etomidate causing suppression of cortisol synthesis; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25338, 623, "Identifies ketamine as the intravenous anaesthetic that raises intracranial pressure; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25342, 623, "Evaluates false pharmacological assertions concerning ketamine; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25344, 623, "Defines dissociative anaesthesia (electrophysiological dissociation between limbic and cortical systems) produced by ketamine; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25345, 623, "Explains NMDA receptor antagonism responsible for ketamine-induced dissociative anaesthesia; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25346, 623, "Highlights cardiovascular stability as the primary clinical indication for etomidate; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25352, 623, "Details criteria for ambulatory/day-care surgery patient selection and safe discharge; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");

// ==========================================
// MODULE 623 (Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery)
// ==========================================
proposeMove(24636, 631, "Presents oculocardiac reflex (trigeminovagal bradycardia) during pediatric strabismus extraocular muscle traction; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(24637, 628, "Details sensory-sparing adductor canal block for postoperative analgesia following ACL reconstruction; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(24692, 629, "Presents intraoperative management of thyroid storm triggered by trauma/surgery in a hyperthyroid patient; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(24708, 613, "Identifies airway adjunct/supraglottic device from image; belongs to Airway Devices (Module 613).");
proposeMove(24730, 614, "Details systematic five-point auscultation protocol to verify tracheal intubation and exclude endobronchial intubation; belongs to Intubation (Module 614).");
proposeMove(24832, 614, "Covers Nerve Integrity Monitor (NIM) electromyographic endotracheal tube placement for recurrent laryngeal nerve monitoring in thyroid surgery; belongs to Intubation (Module 614).");
proposeMove(24943, 611, "Interprets pulmonary artery wedge pressure tracing on PAC monitor during cardiac surgery; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(24945, 619, "Covers reversal of steroidal long-acting neuromuscular blocker pancuronium with neostigmine/sugammadex; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade (Module 619).");
proposeMove(24953, 630, "Covers emergency cesarean section preparation in post-eclamptic seizures; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(24981, 631, "Explains opioid-induced pruritus mediated by central mu-opioid activation and spinal cord itch circuitry; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25021, 620, "Explains graft displacement in tympanoplasty caused by nitrous oxide diffusing into the closed middle ear cavity; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25051, 631, "Presents fat embolism syndrome (hypoxemia, petechial rash, confusion) following long bone fracture; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25065, 614, "Details difficult airway management and awake fiberoptic intubation in mandibular fracture; belongs to Intubation (Module 614).");
proposeMove(25070, 631, "Presents pulmonary aspiration of gastric contents (Mendelson's syndrome) causing acute desaturation and basal crepitations; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25075, 631, "Describes acute hypermetabolic presentation of malignant hyperthermia during orthopedic surgery; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25115, 609, "Recalls first successful public demonstration of surgical ether anesthesia on October 16, 1846; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25120, 620, "Lists clinical contraindications to nitrous oxide (pneumothorax, air embolism, bowel obstruction, inner ear surgery); belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25125, 621, "Identifies isoflurane as volatile agent of choice in cirrhotic liver disease due to preservation of hepatic arterial buffer response; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25154, 631, "Covers safe non-triggering anaesthesia protocol in patients with previous malignant hyperthermia; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25194, 621, "Discusses volatile agents that maintain autoregulation and reduce ICP during craniotomy for intracranial space-occupying lesions; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25200, 621, "Discusses choice of isoflurane for prolonged 4-6 hour surgical procedures due to low cost and metabolic stability; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25222, 631, "Presents venous air embolism detection and management in posterior fossa surgery in the sitting position; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25228, 622, "Details induction characteristics, arm-brain circulation time, and redistribution kinetics of thiopentone; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25252, 622, "Selects propofol as intravenous induction agent of choice in patients with prior PONV due to intrinsic antiemetic properties; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25257, 622, "Covers microbial growth risks and strict aseptic handling of propofol lipid emulsion; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25258, 622, "Discusses thiopentone/propofol dosage and rapid clearance for cesarean section induction; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25282, 622, "Covers dosing scalars (lean body weight for induction, total body weight for maintenance) of propofol in morbid obesity; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25289, 622, "Describes transient garlic or onion taste experienced during thiopentone induction; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25307, 622, "Identifies thiopentone as causing the characteristic garlic taste upon intravenous injection; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25340, 622, "Identifies propofol vial from image and covers its first-line status for induction and total intravenous anesthesia; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25343, 622, "Covers recovery from thiopentone anaesthesia predominantly mediated by tissue redistribution rather than metabolism; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25348, 622, "Re-identifies thiopentone producing garlicky taste during induction; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25351, 630, "Identifies neuromuscular blockers (succinylcholine, vecuronium) as ionized quaternary ammonium compounds that do not readily cross placenta; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25384, 630, "Covers the FLACC behavioral pain assessment scale used in post-operative pediatric patients; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25386, 610, "Evaluates STOP-BANG screening questionnaire and perioperative OSA risk assessment in bariatric surgery; belongs to Preoperative Evaluation (Module 610).");
proposeMove(25387, 481, "Covers platelet transfusion triggers (<50,000/mcL for major surgery, <10,000/mcL prophylactic) in surgical patients; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25389, 528, "Identifies the great saphenous vein as the standard venous conduit for coronary artery bypass graft surgery; belongs to Surgery under Venous Diseases (Module 528).");
proposeMove(25397, 626, "Describes landmarks of the sacral hiatus and sacral cornua for pediatric caudal epidural block; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25398, 481, "Details timing of low-molecular-weight heparin (enoxaparin) initiation for postoperative thromboprophylaxis; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25409, 629, "Discusses acute angle-closure glaucoma and avoiding drugs that increase intraocular pressure (ketamine, succinylcholine); belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25411, 611, "Compares distal esophagus, nasopharynx, and tympanic membrane as accurate sites for intraoperative core body temperature monitoring; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25520, 610, "Details preoperative cessation intervals for antiplatelet drugs (clopidogrel 5-7 days, ticlopidine 10-14 days); belongs to Preoperative Evaluation (Module 610).");
proposeMove(25538, 610, "Covers elective surgery postponement guidelines (minimum 30 days) following bare-metal coronary stent placement; belongs to Preoperative Evaluation (Module 610).");
proposeMove(25542, 610, "Covers preoperative medication continuation (antihypertensives, statins, levothyroxine) versus discontinuation; belongs to Preoperative Evaluation (Module 610).");
proposeMove(25543, 609, "Identifies pioneers acknowledged as founding fathers of modern anaesthesia; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25579, 626, "Identifies lumbar puncture / subarachnoid block procedure and midline spinal anatomy from image; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25599, 628, "Describes phrenic nerve blockade causing ipsilateral diaphragmatic paralysis following interscalene brachial block; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25613, 628, "Describes the need for separate injection into coracobrachialis for musculocutaneous nerve blockade during axillary block; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25664, 626, "Tests expected dermatomal sensory level required for bilateral lower limb varicose vein surgery (T10); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25709, 632, "Details retroperitoneal anatomy, neurolytic agent injection, and pain relief indications for celiac plexus block; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// ==========================================
// MODULE 624 (Local Anaesthetics - General Properties)
// ==========================================
proposeMove(9436, 495, "Presents severe acute epigastric pain radiating to back in an alcoholic diagnosed as acute pancreatitis; belongs to Surgery under Stomach and Duodenum / Acute Pancreatitis (Module 512).");
proposeMove(18676, 323, "Presents progressive bilateral sensorineural hearing loss in elderly female diagnosed as presbycusis; belongs to ENT under Sensorineural Hearing Loss and Presbycusis (Module 323).");
proposeMove(24682, 624, "This is saxitoxin voltage-gated Na+ channel blockade, fits LA mechanism or Toxicology. Can stay or move.");
proposeMove(24804, 237, "Lists clinical applications and routes of administration for synthetic opioid fentanyl; belongs to Pharmacology under Synthetic Opioids (Module 237).");
proposeMove(25020, 631, "Identifies neuromuscular blocking agents as the leading cause of perioperative anaphylaxis, followed by latex and antibiotics; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25189, 626, "Analyzes factors causing high/excessive dermatomal spread of local anesthetic during spinal anesthesia; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25298, 622, "Discusses methohexital for activation of epileptogenic focus during electrocorticography and seizure mapping; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25353, 609, "Recalls WTG Morton naming ether 'Letheon' to conceal its chemical identity; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25354, 613, "Identifies Guedel oropharyngeal airway named after Arthur Guedel; belongs to Airway Devices (Module 613).");
proposeMove(25355, 632, "Details endogenous neurotransmitters with inhibitory antinociceptive action (GABA, glycine, serotonin, enkephalins); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25356, 611, "Explains effect of non-invasive blood pressure cuff width (40% of arm circumference) on readings; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25357, 611, "Discusses intraoperative transesophageal echocardiography (TEE) monitoring during mitral valve surgery; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25358, 611, "Identifies peaked/tented T waves, widening QRS, and PR prolongation of hyperkalemia on intraoperative ECG; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25359, 456, "Presents short PR interval and delta wave of Wolff-Parkinson-White syndrome on 12-lead ECG; belongs to Medicine under Supraventricular Arrhythmias (Module 456).");
proposeMove(25360, 612, "Explains dual-wavelength spectrophotometry (660 nm red and 940 nm infrared) in pulse oximetry; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(25362, 626, "Tests required sensory block height (T10 dermatome) for transurethral resection of prostate (TURP) under spinal; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25363, 626, "Covers combined spinal-epidural (CSE) needle-through-needle technique for total knee replacement; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25364, 630, "Calculates preoperative fluid deficit, maintenance, and third-space fluid losses in a 4-year-old child; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25365, 630, "Describes immature non-compliant myocardium, low stroke volume reserve, and heart-rate dependent cardiac output in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25366, 630, "Defines blood glucose thresholds (<40 mg/dL) for neonatal hypoglycemia requiring urgent treatment; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25367, 630, "Covers transition and hepatic glucose homeostasis in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25368, 631, "Covers oculocardiac reflex triggers, afferent (ophthalmic V1) and efferent (vagus) pathways during eye enucleation; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25369, 630, "Discusses maternal hyperoxia limitations to avoid fetal hypoxemia/retrolental changes; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25370, 630, "Identifies lower termination of the spinal cord (L3 level at birth) in neonates and infants; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25371, 630, "Identifies prematurity (<60 weeks post-conceptual age) as the greatest risk factor for postoperative apnea in infants; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25372, 611, "Analyzes components of central venous pressure (CVP) waveform (a, c, v waves and x, y descents); belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25374, 481, "Identifies factor VII (half-life 4-6 hours) as having the shortest half-life of clotting factors; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25375, 481, "Details strategies to reduce transfusion-related acute lung injury (TRALI) using male-only or nulliparous plasma donors; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25376, 481, "Explains rationale for storing platelets at room temperature (20-24°C) with continuous agitation to maintain function; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25377, 481, "Covers coagulopathy induced by synthetic hydroxyethyl starch colloids via reduction in von Willebrand factor and factor VIII; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25378, 481, "Tests shelf-life of whole blood stored in citrate-phosphate-dextrose (CPD) solution (21 days); belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25379, 481, "Identifies transfusion-related acute lung injury (TRALI) and hemolytic transfusion reactions as leading causes of transfusion mortality; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25380, 623, "Lists criteria of the Post-Anesthetic Discharge Scoring System (PADSS) for daycare ambulatory surgery; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25381, 618, "Covers ventilator weaning criteria and tracheostomy timing for prolonged mechanical ventilation after poly-trauma; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25383, 632, "Defines persistent post-surgical pain (PPSP) as pain persisting for at least 3 months following surgery; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25385, 626, "Matches dermatomal sensory block levels required for various surgical procedures (T4 for CS, T10 for TURP/hip, L1 for knee); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25388, 150, "Identifies bacteria entering through cutaneous abrasions versus intact skin; belongs to Microbiology under Gram Positive Bacilli / Bacterial Infections (Module 150).");
proposeMove(25390, 612, "Explains pulse oximetry reading falsely fixed at 85% in methemoglobinemia due to equal 1:1 absorbance at 660 nm and 940 nm; belongs to Respiratory Monitoring in Anaesthesia (Module 612).");
proposeMove(25391, 630, "Identifies sinus bradycardia as the most common adverse cardiac event in pediatric anesthesia; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25392, 308, "Covers timing and management of secondary reactionary hemorrhage following tonsillectomy; belongs to ENT under Pharynx - Diseases of Tonsils and Adenoids (Module 308).");
proposeMove(25400, 628, "Details tourniquet duration and deflation protocols in intravenous regional anesthesia (Bier's block); belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25405, 611, "Details multimodal intracranial pressure reduction (mannitol, hyperventilation, head elevation) during emergency acute SDH decompression; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25410, 623, "Identifies intractable postoperative nausea, vomiting, and inadequate pain relief as top reasons for unanticipated hospital admission after ambulatory surgery; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25412, 221, "Defines drug clearance as the theoretical volume of plasma completely cleared of drug per unit time; belongs to Pharmacology under Pharmacokinetics (Module 221).");
proposeMove(25413, 447, "Covers physiological and pathological triggers that elevate pulmonary vascular resistance (hypoxia, acidosis, hypercapnia); belongs to Medicine under Respiratory Failure and ARDS (Module 447).");
proposeMove(25414, 30, "Details four hemodynamic and blood pressure phases of the Valsalva maneuver; belongs to Physiology under Hemodynamics and Blood Pressure (Module 30).");
proposeMove(25415, 33, "Describes conduction velocity and functions of large myelinated A-alpha nerve fibers (motor and proprioception); belongs to Physiology under Sensory System (Module 33).");
proposeMove(25416, 222, "Covers non-dose-dependent, idiosyncratic Type B adverse drug reactions; belongs to Pharmacology under Clinical Trials and Miscellaneous (Module 222).");
proposeMove(25417, 615, "Applies the Hagen-Poiseuille equation to laminar gas flow through rigid breathing circuit tubes; belongs to Breathing Systems (Module 615).");
proposeMove(25418, 482, "Explains catheter gauge conversions and French scale calculations for surgical cannulae; belongs to Surgery under Instruments & Sutures (Module 482).");
proposeMove(25419, 611, "Covers the Seldinger catheter-over-guidewire technique for central venous catheterization; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25420, 614, "Identifies dimensions of the cricoid cartilage ring as the narrowest anatomical point of the upper airway; belongs to Intubation (Module 614).");
proposeMove(25421, 618, "Tests normal respiratory chest wall compliance value (~200 mL/cmH2O) in healthy adults; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25422, 618, "Tests normal functional residual capacity (~30 mL/kg or 2100-2400 mL) in adults; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25423, 618, "Applies Laplace's law (P = 2T/r) to alveolar surface tension and surfactant stability; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25424, 621, "Discusses high lipid solubility and fluoride-induced polyuric nephrotoxicity of methoxyflurane; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25425, 622, "Identifies lipid vehicle constituents (soybean oil, egg lecithin, glycerol) of propofol emulsion; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25426, 619, "Covers neuromuscular blocking mechanisms, ganglion blockade, and histamine release of d-tubocurarine; belongs to Depolarising Muscle Relaxants / Neuromuscular Blockers (Module 619).");
proposeMove(25428, 630, "Covers pharmacokinetic alterations, elimination half-life, and clearance of opioid narcotics in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25429, 618, "Covers pulmonary oxygen toxicity (Lorrain Smith effect) caused by high inspired oxygen fractions; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25430, 618, "Lists hyperbaric oxygen therapy indications (carbon monoxide poisoning, decompression sickness, gas gangrene); belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25431, 616, "Details components of the workstation hanger yoke assembly (pins, retaining screw, Bodok seal, check valve); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25432, 616, "Calculates remaining oxygen cylinder duration and volume based on pressure gauge reading; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25433, 616, "Matches medical gas cylinders with pin index safety system (PISS) and color-coding schemes; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25434, 616, "Tests nominal internal capacity of oxygen E-cylinder (660 L); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25435, 610, "Identifies neck circumference (>43 cm in men, >40 cm in women) as the strongest physical predictor of obstructive sleep apnea; belongs to Preoperative Evaluation (Module 610).");
proposeMove(25436, 631, "Details critical aspiration pneumonitis (Mendelson syndrome) criteria (gastric pH < 2.5, volume > 0.4 mL/kg); belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25437, 632, "Matches terminology of pain neurobiology (hyperalgesia, allodynia, paresthesia, dysesthesia); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25438, 632, "Defines allodynia as pain resulting from a non-noxious stimulus to normal skin; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25439, 632, "Explains administration and scoring of the Visual Analog Scale (VAS) for pain assessment; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25440, 632, "Differentiates clinical descriptors of neuropathic pain (burning, shooting, lancinating) from nociceptive pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25441, 632, "Identifies phantom limb pain and avulsion neuralgia as classic examples of central deafferentation pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25443, 632, "Identifies structural layers of a transdermal drug delivery patch (backing, reservoir/matrix, rate-controlling membrane, adhesive); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25444, 632, "Presents radiculopathy with lower back pain radiating down the dermatome diagnosed as lumbar disc herniation sciatica; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25445, 632, "Details four neurophysiological stages of nociceptive processing (transduction, transmission, modulation, perception); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25446, 632, "Evaluates fundamentals of nociceptive versus neuropathic pain pathways; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25447, 632, "Compares equianalgesic doses between epidural, intrathecal, and parenteral opioid administration; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25448, 626, "Identifies T10 dermatomal sensory level required for bilateral testicular orchiectomy under spinal block; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25449, 626, "Identifies origin of the great anterior radicular artery of Adamkiewicz (T9-T12 level) and risk of anterior spinal cord syndrome; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25450, 627, "Identifies tingling in the thumb (C6 dermatome) indicating high cervical spread of epidural blockade; belongs to Regional Anaesthesia: Complications and Contraindications (Module 627).");
proposeMove(25451, 632, "Covers epidural steroid injections and spinal cord stimulation for chronic radicular pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25452, 611, "Explains hypertonic 3% saline mechanisms in reducing brain edema and lowering intracranial pressure; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25453, 626, "Identifies dura mater as the layer deliberately NOT punctured during epidural needle placement; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25454, 626, "Identifies Tuffier's line connecting the superior borders of the iliac crests (intersecting L4 spine or L4-L5 interspace); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25455, 626, "Tests vertebral level of spinal cord termination (conus medullaris) at L1-L2 in adults; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25456, 616, "Identifies black body with white shoulder cylinder (oxygen) from image; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25457, 630, "Covers gauge selection and technique for peripheral intravenous cannulation in neonates; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25458, 617, "Details sequential order of basic life support steps (Circulation, Airway, Breathing - CAB); belongs to ACLS (Module 617).");
proposeMove(25459, 482, "Explains French catheter scale (1 French = 0.33 mm outer diameter) in surgical instruments; belongs to Surgery under Instruments & Sutures (Module 482).");
proposeMove(25460, 630, "Reiterates 24G cannula selection for neonatal peripheral vascular access; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25461, 481, "Identifies large-bore (16G grey or 14G orange) IV cannula for rapid emergency volume resuscitation; belongs to Surgery under Shock and Blood Transfusion (Module 481).");
proposeMove(25462, 610, "Calculates MET (Metabolic Equivalent of Task) equivalents of resting oxygen consumption (3.5 mL O2/kg/min); belongs to Preoperative Evaluation (Module 610).");
proposeMove(25463, 482, "Identifies intravenous cannula gauge from color-coding image; belongs to Surgery under Instruments & Sutures (Module 482).");
proposeMove(25464, 33, "Describes deficits resulting from primary somatosensory cortex (postcentral gyrus) lesions (astereognosis, agraphesthesia); belongs to Physiology under Sensory System (Module 33).");
proposeMove(25465, 34, "Details motor cortical programming and postural stabilization before voluntary movement; belongs to Physiology under Motor System (Module 34).");
proposeMove(25466, 480, "Calculates daily nitrogen loss and hypercatabolic state following blunt body trauma; belongs to Surgery under Fluids, Electrolytes & Nutrition (Module 480).");
proposeMove(25467, 523, "Classifies superficial partial-thickness flash burn (tender, erythema, painful blisters); belongs to Surgery under Burns (Module 523).");
proposeMove(25468, 639, "Lists clinical features and diagnostic criteria of atopic dermatitis; belongs to Dermatology under Dermatitis (Module 639).");
proposeMove(25469, 638, "Covers classifications of melanocytic nevi and pigmentary lesions; belongs to Dermatology under Disorders of Skin Pigmentation (Module 638).");
proposeMove(25470, 609, "Recalls Arthur Guedel defining four classic stages of ether general anaesthesia; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25471, 615, "Identifies Ayre's T-piece as Mapleson E circuit; belongs to Breathing Systems (Module 615).");
proposeMove(25472, 687, "Identifies Emil Kraepelin as coining the psychiatric term 'Dementia praecox'; belongs to Psychiatry under Schizophrenia (Module 687).");
proposeMove(25473, 688, "Identifies Sigmund Freud and Georg Groddeck coining structural concepts of the unconscious 'id'; belongs to Psychiatry under Psychiatric Disorders (Module 688).");
proposeMove(25474, 695, "Differentiates cortical dementias (Alzheimer's disease) from subcortical dementias (Huntington's, Parkinson's, PSP); belongs to Psychiatry under Dementia (Module 695).");
proposeMove(25501, 626, "Tests physiological hemodynamic tachycardia response to epidural test dose (lignocaine with adrenaline); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25504, 627, "Identifies lidocaine as having the highest incidence of Transient Neurological Symptoms (TNS) following spinal anesthesia; belongs to Regional Anaesthesia: Complications and Contraindications (Module 627).");
proposeMove(25505, 630, "Identifies 2-chloroprocaine as undergoing ultra-rapid plasma pseudocholinesterase hydrolysis in maternal and fetal blood; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25578, 609, "Recalls historic milestone of Carl Koller and William Halsted introducing cocaine for local and infiltration anesthesia; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25608, 628, "Describes 3-in-1 femoral nerve block anatomy below the inguinal ligament; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25631, 609, "Identifies cocaine as the first ever discovered and clinically utilized local anaesthetic agent; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(25650, 614, "Describes superior laryngeal nerve block for awake fiberoptic intubation; belongs to Intubation (Module 614).");
proposeMove(25658, 609, "Recalls Carl Koller's pioneer application of topical cocaine in ophthalmology (1884); belongs to History and Ethical Aspects of Anaesthesia (Module 609).");

// ==========================================
// MODULE 625 (Local Anaesthetics - Specific Drugs)
// ==========================================
proposeMove(25283, 622, "Identifies flumazenil as the specific competitive antagonist for benzodiazepines; belongs to Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol (Module 622).");
proposeMove(25480, 691, "Tests the onset timing of delirium tremens (48-72 hours) following cessation of chronic alcohol consumption; belongs to Psychiatry under Alcohol Use Disorders (Module 691).");
proposeMove(25516, 617, "Presents wide-complex monomorphic ventricular tachycardia on ECG treated with amiodarone/lidocaine per ACLS; belongs to ACLS (Module 617).");
proposeMove(25521, 628, "Details technique, contraindications, and double-cuff tourniquet safety in Intravenous Regional Anaesthesia (Bier's block); belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25522, 619, "Lists factors reducing plasma pseudocholinesterase (butyrylcholinesterase) activity; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25523, 619, "Lists pharmacological factors potentiating neuromuscular blockade (hypokalemia, hypothermia, aminoglycosides); belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade (Module 619).");
proposeMove(25524, 619, "Matches complementary antagonist pairs (sugammadex-rocuronium, neostigmine-atropine); belongs to Depolarising Muscle Relaxants / Neuromuscular Blockade (Module 619).");
proposeMove(25526, 624, "Explains primary molecular mechanism of local anaesthetics blocking voltage-gated sodium channels from the intracellular side; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25527, 624, "Details ASRA guidelines for treating Local Anesthetic Systemic Toxicity (LAST) with 20% lipid emulsion; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25529, 236, "Compares analgesic potency between fentanyl (100x) and morphine; belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25530, 616, "Explains principles of variable-orifice Thorpe tube flowmeters (Rotameters); belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25531, 632, "Lists adjuvant drug classes used in multimodal management of chronic pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25532, 632, "Details selective serotonin-norepinephrine reuptake inhibitors (duloxetine) for diabetic peripheral neuropathic pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25534, 626, "Explains baricity of local anaesthetics relative to cerebrospinal fluid (hyperbaric, hypobaric, isobaric) in spinal anesthesia; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25537, 627, "Details ASRA guidelines for safe intervals between anticoagulants/LMWH and spinal/epidural puncture to prevent epidural hematoma; belongs to Regional Anaesthesia: Complications and Contraindications (Module 627).");
proposeMove(25539, 631, "Details rescue antiemetic pharmacology for postoperative nausea and vomiting in the PACU; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25547, 632, "Covers treatment of postherpetic neuralgia with gabapentin, pregabalin, and topical lidocaine; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25550, 630, "Covers bilateral pudendal nerve block providing complete perineal somatic analgesia during second stage of labor; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25563, 631, "Describes fluid absorption and TURP syndrome complications during transurethral prostate resection under spinal anesthesia; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25598, 624, "Explains mechanism of action of local anaesthetics blocking voltage-gated Na+ channels in the inactivated-open state; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25609, 624, "Ranks systemic absorption of local anaesthetics from various anatomical injection sites (Intercostal > Caudal > Epidural > Brachial > Femoral > Subcutaneous); belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25611, 624, "Reiterates sodium channel blockade as the definitive mechanism of local anaesthetics; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25643, 632, "Contrasts characteristics of true visceral pain (poorly localized, dull, autonomic symptoms) with somatic pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// ==========================================
// MODULE 626 (Regional Anaesthesia: Techniques)
// ==========================================
proposeMove(24830, 616, "Identifies legible cylinder label as the most reliable means of identifying medical gas cylinder contents; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25190, 629, "Discusses anaesthetic implications and regional vs general anaesthetic advantages in severe COPD; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25395, 628, "Details optimal ultrasound machine settings (frequency, depth, Doppler) during ultrasound-guided regional nerve blocks; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25396, 624, "Lists end-artery anatomical areas (fingers, toes, penis, pinna, nose) where epinephrine-containing local anaesthetics are contraindicated; belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25399, 632, "Describes clinical signs (edema, allodynia, sudomotor and vasomotor changes) of Complex Regional Pain Syndrome (CRPS); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25401, 630, "Covers anesthesia-related maternal mortality statistics and closed claims analysis; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25402, 632, "Lists sympathetically maintained pain disorders treated with sympathetic blocks (stellate, lumbar sympathetic); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25486, 628, "Identifies preservative-free lidocaine 0.5% as the drug of choice for Intravenous Regional Anaesthesia (Bier's block); belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25618, 628, "Interprets ultrasound image of the supraclavicular/infraclavicular brachial plexus; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25627, 632, "Identifies classic clinical examples of neuropathic pain (diabetic polyneuropathy, postherpetic neuralgia); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25628, 632, "Differentiates Complex Regional Pain Syndrome Type I (reflex sympathetic dystrophy) from Type II (causalgia with documented nerve injury); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// ==========================================
// MODULE 627 (Regional Anaesthesia: Complications and Contraindications)
// ==========================================
proposeMove(25601, 631, "Presents fluid overload, hyponatremia, and neurological confusion of TURP syndrome; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25612, 628, "Details side effects and complications of supraclavicular brachial plexus block (pneumothorax, phrenic nerve palsy, Horner's syndrome); belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25620, 626, "Details caudal epidural block landmarks, needle angulation, and technique; belongs to Regional Anaesthesia: Techniques (Module 626).");

// ==========================================
// MODULE 628 (Peripheral Nerve Blocks)
// ==========================================
proposeMove(24642, 610, "Compares quaternary amine glycopyrrolate versus tertiary amine atropine as antisialogogues in adult preoperative medication; belongs to Preoperative Evaluation (Module 610).");
proposeMove(25121, 340, "Identifies topical local anaesthetics (proparacaine, tetracaine) used in cataract surgery; belongs to Ophthalmology under Lens - Cataract Surgery, Complications and IOLs (Module 340).");
proposeMove(25548, 625, "Matches clinical concentrations of lidocaine with specific indications (0.5% infiltration, 1-2% nerve blocks, 5% topical); belongs to Local Anaesthetics - Specific Drugs (Module 625).");
proposeMove(25605, 632, "Explains secondary hyperalgesia and central sensitization in dorsal horn wide dynamic range neurons; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25606, 626, "Identifies anatomical structures traversed by epidural needle (skin, subQ, supraspinous, interspinous, ligamentum flavum); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25625, 630, "Describes profound supine hypotension following spinal anaesthesia in third-trimester parturient; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");
proposeMove(25626, 626, "Covers neuraxial anatomy, ligamentum flavum depth, and spinal meningeal layers; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25632, 624, "Tests the differential susceptibility of nerve fibers to local anaesthetics (B > C > A-delta > A-alpha); belongs to Local Anaesthetics - General Properties (Module 624).");
proposeMove(25634, 236, "Identifies loperamide and methylnaltrexone as peripheral-acting opioids that do not cross blood-brain barrier; belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25635, 631, "Explains opioid-induced vomiting mediated by the chemoreceptor trigger zone (CTZ) in the area postrema; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25636, 632, "Evaluates chronic low back pain with radiculopathy and intervertebral disc disease; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25637, 632, "Presents lancinating electric-shock facial pain along V2/V3 diagnosed as trigeminal neuralgia (tic douloureux); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25638, 632, "Explains dorsal horn NMDA receptor activation and wind-up phenomenon in central sensitization; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25639, 632, "Details fluoroscopic percutaneous gasserian ganglion block and radiofrequency ablation for trigeminal neuralgia; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25640, 632, "Discusses trigeminal neuralgia diagnostic blocks and medical management with carbamazepine; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25641, 632, "Details pathophysiology and clinical characteristics of phantom limb pain following amputation; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25642, 632, "Explains gate control theory and endorphin release mechanisms of Transcutaneous Electrical Nerve Stimulation (TENS); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25644, 632, "Identifies A-delta and unmyelinated C fibers as primary afferent nociceptors carrying pain; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25646, 632, "Details affective, sensory-discriminative, and cognitive-evaluative dimensions of pain experience; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25647, 632, "Evaluates true/false statements regarding phantom limb sensations, stump pain, and mirror therapy; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25649, 629, "Discusses facial nerve branch monitoring during parotidectomy under general anesthesia; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25653, 614, "Assesses bilateral recurrent laryngeal nerve injury on post-extubation fiberoptic laryngoscopy after thyroidectomy; belongs to Intubation (Module 614).");
proposeMove(25654, 631, "Identifies the ulnar nerve at the elbow and common peroneal nerve at the fibular head as most prone to perioperative positioning nerve injury; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25655, 631, "Presents median nerve injury causing inability to oppose thumb and little finger due to faulty armboard positioning; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25657, 631, "Presents ischemic optic neuropathy causing postoperative bilateral visual loss in prone spine surgery; belongs to Complications of Anaesthesia (Module 631).");
proposeMove(25661, 630, "Covers laparoscopic anesthesia considerations and avoidance of fetal hypoxia in early ectopic pregnancy; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");

// ==========================================
// MODULE 629 (Anaesthetic Implication of Concurrent Diseases)
// ==========================================
proposeMove(24641, 610, "Covers scopolamine avoidance in elderly/glaucoma/dementia during preoperative premedication; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24676, 618, "Lists clinical indications and contraindications for therapeutic oxygen administration; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25038, 619, "Covers life-threatening hyperkalemia caused by succinylcholine in burns after 24-48 hours; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25067, 621, "Identifies enflurane as causing epileptogenic EEG spike discharges and motor twitching; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25072, 620, "Explains the Concentration Effect of high-concentration nitrous oxide speeding alveolar equilibration; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25124, 620, "Explains the Second Gas Effect seen with nitrous oxide accelerating the uptake of a companion volatile agent; belongs to Inhaled Anaesthetics - Properties, N2O and Halothane (Module 620).");
proposeMove(25153, 621, "Identifies enflurane as an epileptogenic inhalational agent aggravated by hypocarbia; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25535, 617, "Presents monitor tracing of rapid atrial fibrillation with hemodynamic instability treated per ACLS tachycardia algorithm; belongs to ACLS (Module 617).");
proposeMove(25553, 236, "Identifies opioid receptors (mu, delta, kappa) as inhibitory G-protein coupled receptors (GPCRs); belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25591, 626, "Details indications, contraindications, and urgent CSF sampling protocol for lumbar puncture; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25645, 632, "Defines paresthesia as an abnormal spontaneous sensation in the absence of an external stimulus; belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");
proposeMove(25660, 628, "Details local anesthetic volume and landmark nerve block of the five nerves at the ankle for bunionectomy; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25673, 626, "Lists hydrophilic and lipophilic opioids approved for intrathecal/epidural administration; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25674, 236, "Identifies active analgesic and neurotoxic metabolites of morphine (M6G, M3G); belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25676, 237, "Identifies remifentanil as undergoing ultra-rapid plasma and tissue esterase hydrolysis rather than hepatic metabolism; belongs to Pharmacology under Synthetic Opioids (Module 237).");
proposeMove(25677, 236, "Covers central nervous system effects of opioids (analgesia, sedation, euphoria, respiratory depression, miosis); belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25678, 236, "Lists signs and symptoms of acute opioid withdrawal (mydriasis, lacrimation, piloerection, diarrhea, agitation); belongs to Pharmacology under Opioids - Functions and Classification (Module 236).");
proposeMove(25679, 237, "Explains potentially fatal serotonin syndrome and hyperpyrexia when pethidine (meperidine) is combined with MAO inhibitors; belongs to Pharmacology under Synthetic Opioids (Module 237).");
proposeMove(25682, 630, "Presents uterine rupture during labor in previous LSCS requiring emergency laparotomy; belongs to Paediatric and Obstetric Anaesthesia (Module 630).");

// ==========================================
// MODULE 630 (Paediatric and Obstetric Anaesthesia)
// ==========================================
proposeMove(24599, 609, "Identifies John Lundy as coining the historic concept of 'balanced anaesthesia' in 1926; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");
proposeMove(24853, 613, "Covers anatomical dead space, facial nerve injury, and gastric insufflation from tight face mask application; belongs to Airway Devices (Module 613).");
proposeMove(25150, 621, "Identifies sevoflurane as preferred agent for smooth mask induction; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25184, 621, "Explains sevoflurane properties (non-pungent, rapid induction, bronchodilatory) in mask induction; belongs to Inhaled Anaesthetics - Fluorinated Agents, Inert Agents and Therapeutic Gases (Module 621).");
proposeMove(25339, 629, "Discusses avoidance of ketamine and succinylcholine in pediatric open globe injury to prevent extruded ocular contents; belongs to Anaesthetic Implication of Concurrent Diseases (Module 629).");
proposeMove(25540, 616, "Explains physical principles of Thorpe tube rotameters in anaesthesia machines; belongs to Anaesthesia Workstation (Module 616).");
proposeMove(25572, 626, "Covers maternal sympathectomy and systemic hypotension during spinal anaesthesia; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25694, 609, "Analyzes ASA Closed Claims Project data regarding common perioperative nerve injuries and malpractice claims; belongs to History and Ethical Aspects of Anaesthesia (Module 609).");

// ==========================================
// MODULE 631 (Complications of Anaesthesia)
// ==========================================
proposeMove(17215, 345, "Clinical management of congenital dacryocystitis via Crigler lacrimal sac massage; belongs to Ophthalmology under Disorders of Lacrimal Apparatus and Glands of the Eye (Module 345).");
proposeMove(24622, 610, "Defines ASA Grade 1 physical status (normal healthy patient with no organic, physiologic, or psychiatric disturbance); belongs to Preoperative Evaluation (Module 610).");
proposeMove(24686, 610, "Evaluates postponement criteria for elective tonsillectomy in pediatric patients with upper respiratory tract infections; belongs to Preoperative Evaluation (Module 610).");
proposeMove(24733, 614, "Covers prone positioning complications during posterior spine fusion (facial pressure, blindness, ETT displacement); belongs to Intubation (Module 614) or Complications (can stay or move).");
proposeMove(24901, 618, "Explains physiological requirement of active and passive humidification of inspired oxygen; belongs to Ventilation and O2 Delivery Systems (Module 618).");
proposeMove(25022, 619, "Evaluates pharmacological properties and adverse effects of succinylcholine; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25036, 619, "Explains black-box warning and avoidance of routine succinylcholine in children < 8 years due to undiagnosed Duchenne muscular dystrophy hyperkalemia; belongs to Depolarising Muscle Relaxants (Module 619).");
proposeMove(25129, 611, "Identifies lower third of the esophagus (retrocardiac position) as the optimal site for esophageal temperature monitoring; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25292, 623, "Identifies severe pain and intractable PONV as the most common reasons for unanticipated overnight hospital admission after daycare surgery; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25341, 623, "Describes emergence delirium and vivid dreams following ketamine dissociative anesthesia; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25349, 623, "Covers emergence illusions and dysphoria following ketamine induction; belongs to Intravenous Anaesthesia - Etomidate, Ketamine and Daycare Surgery (Module 623).");
proposeMove(25546, 611, "Details internal jugular vein central venous pressure line insertion for inotropic resuscitation in septic shock; belongs to CNS and CVS Monitoring in Anaesthesia (Module 611).");
proposeMove(25576, 626, "Identifies the epidural space between the ligamentum flavum and dura mater as the site of drug deposition in epidural anaesthesia; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25587, 626, "Tests termination level of the conus medullaris at the L1-L2 vertebral interspace in adults; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25588, 626, "Lists tissue layers punctured during lumbar puncture (skin, subcutaneous tissue, supraspinous ligament, interspinous ligament, ligamentum flavum, dura, arachnoid); belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25590, 626, "Identifies loss-of-resistance syringe (glass/low-friction) used for identifying the epidural space; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25592, 482, "Details measurement of nasogastric tube insertion length (nose-ear-xiphoid / NEX measurement); belongs to Surgery under Instruments & Sutures (Module 482).");
proposeMove(25600, 628, "Identifies immediate complications of supraclavicular brachial plexus block (pneumothorax, arterial puncture); belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25610, 617, "Identifies prolonged asystole as having the poorest resuscitation prognosis among cardiac arrest rhythms in ACLS; belongs to ACLS (Module 617).");
proposeMove(25624, 628, "Compares electrical nerve stimulator twitch endpoints in various approaches to the brachial plexus; belongs to Peripheral Nerve Blocks (Module 628).");
proposeMove(25629, 626, "Explains pre-ganglionic sympathetic B-fiber blockade causing venodilation and hypotension in spinal anaesthesia; belongs to Regional Anaesthesia: Techniques (Module 626).");
proposeMove(25705, 632, "Lists complications of celiac plexus block (orthostatic hypotension due to splanchnic pooling, diarrhea, retroperitoneal hematoma); belongs to Mixed / Miscellaneous Topics: Pain Management (Module 632).");

// Let's print out how many moves were proposed
console.log(`Total proposed moves: ${movesMap.size}`);

// Verify target modules exist
for (const [id, move] of movesMap.entries()) {
  const target = moduleMap[move.toModule];
  if (!target) {
    console.error(`ERROR: Target module ${move.toModule} does not exist in 740 modules! Question ID: ${id}`);
  }
}

const auditOutput = {
  subject: 'Anaesthesia',
  totalQuestions: questions.length,
  flaggedCount: movesMap.size,
  moves: Array.from(movesMap.values())
};

fs.writeFileSync('tools/audit_deep_anaesthesia.json', JSON.stringify(auditOutput, null, 2), 'utf8');
console.log('Saved tools/audit_deep_anaesthesia.json successfully!');
process.exit(0);
