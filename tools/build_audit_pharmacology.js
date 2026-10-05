const fs = require('fs');

const qs = JSON.parse(fs.readFileSync('tools/pharmacology_questions_raw.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

function getCombinedText(q) {
  const parts = [
    q.question_text || '',
    q.option_a || '',
    q.option_b || '',
    q.option_c || '',
    q.option_d || '',
    q.option_e || '',
    q.explanation || ''
  ];
  return parts.join(' ').toLowerCase();
}

// Map each question to potential target module
function evaluateQuestion(q) {
  const text = getCombinedText(q);
  const cur = q.module_id;
  const qText = (q.question_text || '').toLowerCase();
  const exp = (q.explanation || '').toLowerCase();
  const ans = (q.answer || '').toUpperCase();

  // Helper check
  const has = (...terms) => terms.some(t => text.includes(t.toLowerCase()));
  const hasQ = (...terms) => terms.some(t => qText.includes(t.toLowerCase()));
  const hasExp = (...terms) => terms.some(t => exp.includes(t.toLowerCase()));

  // -------------------------------------------------------------
  // SPECIFIC QUESTION OVERRIDES (Hand-audited high precision)
  // -------------------------------------------------------------
  
  // ID 2231: Caffeine impairs sleep -> Adenosine A1/A2A antagonist -> Psychiatry Sleep Disorders (708) or Other Substance Use (700) or Resp/General
  if (q.id === 2231) {
    return { toModule: 708, reason: 'Caffeine mechanism in sleep impairment (adenosine receptor antagonism) belongs to Psychiatry: Sleep Disorders' };
  }

  // ID 8407: Volume of distribution / Clearance calculation -> Pharmacokinetics (221)
  if (q.id === 8407) {
    return { toModule: 221, reason: 'Calculation of volume of distribution and first-order clearance belongs to Pharmacokinetics' };
  }

  // ID 8408: Phenoxybenzamine preoperative alpha blockade in pheochromocytoma -> Sympathomimetics (223)
  if (q.id === 8408) {
    return { toModule: 223, reason: 'Phenoxybenzamine alpha-adrenergic blockade for pheochromocytoma belongs to Sympathomimetics' };
  }

  // ID 8409: Skeletal muscle relaxant Hoffman elimination (Atracurium) -> Anaesthesia (619)
  if (q.id === 8409) {
    return { toModule: 619, reason: 'Atracurium elimination via Hofmann degradation belongs to Anaesthesia: Depolarising & Muscle Relaxants' };
  }

  // ID 8417: Sugammadex reversal of rocuronium -> Anaesthesia (619)
  if (q.id === 8417) {
    return { toModule: 619, reason: 'Sugammadex encapsulation reversal of rocuronium neuromuscular blockade belongs to Anaesthesia: Muscle Relaxants' };
  }

  // ID 8420: Haloperidol decanoate depot vs lactate in schizophrenia -> Psychiatry (692)
  if (q.id === 8420) {
    return { toModule: 692, reason: 'Haloperidol formulation in schizophrenia management belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8422: Parathion poisoning reversed by pralidoxime -> FMT (287) or Pharm (740)
  if (q.id === 8422) {
    return { toModule: 740, reason: 'Parathion organophosphate toxicity and pralidoxime reactivation of AChE belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8423: Botulinum toxin poisoning signs -> FMT (291)
  if (q.id === 8423) {
    return { toModule: 291, reason: 'Botulinum food poisoning clinical features belongs to Forensic Medicine: Organic Irritants - Plant and Animal Poisons' };
  }

  // ID 8428: Reserpine (VMAT) vs Vesamicol (VAChT) -> Parasympathomimetics (740)
  if (q.id === 8428) {
    return { toModule: 740, reason: 'Vesamicol inhibition of vesicular acetylcholine transporter (VAChT) belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8432: Leukotriene pathway inhibitors (Zileuton / Montelukast) -> Respiratory System (265)
  if (q.id === 8432) {
    return { toModule: 265, reason: 'Mechanism of leukotriene inhibitors (5-LOX and LTD4 receptor antagonists) belongs to Respiratory System' };
  }

  // ID 8433: Propofol vs Fospropofol formulation & pain -> Anaesthesia (622)
  if (q.id === 8433) {
    return { toModule: 622, reason: 'Propofol and fospropofol intravenous anaesthetic properties belong to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Propofol' };
  }

  // ID 8434: Thiopental dose -> Anaesthesia (622)
  if (q.id === 8434) {
    return { toModule: 622, reason: 'Thiopental induction dosage belongs to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Propofol' };
  }

  // ID 8435: Ketamine dissociative anaesthesia -> Anaesthesia (623)
  if (q.id === 8435) {
    return { toModule: 623, reason: 'Ketamine dissociative anaesthetic pharmacology belongs to Anaesthesia: Intravenous Anaesthesia - Etomidate, Ketamine' };
  }

  // ID 8436: Levobupivacaine cardiotoxicity vs bupivacaine -> Anaesthesia (625)
  if (q.id === 8436) {
    return { toModule: 625, reason: 'Levobupivacaine enantiomer safety and reduced cardiotoxicity belongs to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8437: Baclofen GABAb agonist -> Anaesthesia (619) or Anti-epileptics (233)
  if (q.id === 8437) {
    return { toModule: 619, reason: 'Baclofen mechanism as centrally acting spasmolytic (GABA-B agonist) belongs to Anaesthesia: Muscle Relaxants' };
  }

  // ID 8438: Vitamin B12 deficiency megaloblastic anemia -> Biochemistry (124)
  if (q.id === 8438) {
    return { toModule: 124, reason: 'Vitamin B12 deficiency impairing folate metabolism and dTMP synthesis belongs to Biochemistry: Vitamins and Minerals' };
  }

  // ID 8439: Chronic overdose with exogenous T4 -> Thyroid (253)
  if (q.id === 8439) {
    return { toModule: 253, reason: 'Signs and symptoms of exogenous thyroxine (T4) overdose belong to Thyroid and Antithyroid Agents' };
  }

  // ID 8440: Glucocorticoids causing neutrophilic leukocytosis -> Corticosteroids (254)
  if (q.id === 8440) {
    return { toModule: 254, reason: 'Glucocorticoid effect on white blood cell differential counts belongs to Corticosteroids' };
  }

  // ID 8442: Pyrantel pamoate antihelminthic spectrum -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 8442) {
    return { toModule: 246, reason: 'Pyrantel pamoate spectrum against nematodes belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 8443: Pyrantel maximum dose -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 8443) {
    return { toModule: 246, reason: 'Pyrantel pamoate dosage parameters belong to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 8451: Organophosphate poisoning -> Parasympathomimetics (740)
  if (q.id === 8451) {
    return { toModule: 740, reason: 'Agricultural organophosphate exposure and toxicity belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8452: AUC and bioavailability comparison -> Pharmacokinetics (221)
  if (q.id === 8452) {
    return { toModule: 221, reason: 'Comparison of AUC and oral bioavailability belongs to Pharmacokinetics' };
  }

  // ID 8454: Lidocaine continuous infusion steady-state calculation in MI -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8454) {
    return { toModule: 229, reason: 'Lidocaine infusion for post-MI ventricular arrhythmias belongs to Anti-Arrhythmic Drugs' };
  }

  // ID 8455: Articaine dental local anaesthetic -> Anaesthesia (625)
  if (q.id === 8455) {
    return { toModule: 625, reason: 'Articaine properties and dental anaesthesia pharmacology belong to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8456: Lidocaine spinal transient neurologic symptoms (TNS) -> Anaesthesia (625)
  if (q.id === 8456) {
    return { toModule: 625, reason: 'Lidocaine spinal complications (transient neurologic symptoms) belong to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8462: Acyclovir clearance in anuria -> Antivirals (251)
  if (q.id === 8462) {
    return { toModule: 251, reason: 'Acyclovir renal clearance and half-life adjustment in renal impairment belong to Anti-virals (Non-retroviral)' };
  }

  // ID 8470 & 8471: Fibrinolytic in acute MI -> Antiplatelets, Fibrinolytics (263)
  if (q.id === 8470 || q.id === 8471) {
    return { toModule: 263, reason: 'Fibrinolytic therapy in acute myocardial infarction belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics' };
  }

  // ID 8472: Pritchard regimen loading dose of MgSO4 in eclampsia -> OB & G (542)
  if (q.id === 8472) {
    return { toModule: 542, reason: 'Pritchard regimen loading dose of magnesium sulfate for eclampsia belongs to OB & G: Hypertensive Disorders in Pregnancy' };
  }

  // ID 8474: Half-life of lithium in adults -> Anti-manic Drugs (234)
  if (q.id === 8474) {
    return { toModule: 234, reason: 'Lithium pharmacokinetic half-life and adult therapeutic parameters belong to Anti-manic Drugs' };
  }

  // ID 8476: Advantage of clarithromycin over erythromycin -> Antimicrobial Principles (239)
  if (q.id === 8476) {
    return { toModule: 239, reason: 'Macrolide comparative pharmacokinetics (clarithromycin vs erythromycin) belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 8482: Bupivacaine cardiotoxicity -> Anaesthesia (625)
  if (q.id === 8482) {
    return { toModule: 625, reason: 'Bupivacaine cardiotoxicity and concentration limitations belong to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8483: Plasma level monitoring of lithium -> Anti-manic Drugs (234)
  if (q.id === 8483) {
    return { toModule: 234, reason: 'Lithium therapeutic drug monitoring timing (12h post-dose) belongs to Anti-manic Drugs' };
  }

  // ID 8485: Oral candidiasis / fluconazole ergosterol synthesis -> Antifungals (247)
  if (q.id === 8485) {
    return { toModule: 247, reason: 'Fluconazole inhibition of fungal ergosterol synthesis for oral thrush belongs to Antifungal Agents' };
  }

  // ID 8489: Clinical trial Phase 1 assessing safety and toxicity -> Clinical Trials (222)
  if (q.id === 8489) {
    return { toModule: 222, reason: 'Phase I clinical trial assessing safety and toxicity belongs to Clinical Trials and Miscellaneous' };
  }

  // ID 8496: Clozapine for treatment-resistant schizophrenia -> Psychiatry (692)
  if (q.id === 8496) {
    return { toModule: 692, reason: 'Clozapine for treatment-resistant schizophrenia belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8497: Ketamine vs Propofol vs Etomidate injection pain -> Anaesthesia (623)
  if (q.id === 8497) {
    return { toModule: 623, reason: 'Comparative intravenous injection pain of ketamine, propofol, and etomidate belongs to Anaesthesia: Intravenous Anaesthesia - Etomidate, Ketamine' };
  }

  // ID 8498: d-tubocurarine neuromuscular block -> Anaesthesia (619)
  if (q.id === 8498) {
    return { toModule: 619, reason: 'Mechanism of d-tubocurarine competitive neuromuscular blockade belongs to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 8499: Uses of MgSO4 in preeclampsia / seizure prevention -> OB & G (542)
  if (q.id === 8499) {
    return { toModule: 542, reason: 'Indications of magnesium sulfate in preeclampsia and eclampsia belong to OB & G: Hypertensive Disorders in Pregnancy' };
  }

  // ID 8518: IV glucagon for beta-blocker overdose -> Sympathomimetics (223)
  if (q.id === 8518) {
    return { toModule: 223, reason: 'Intravenous glucagon reversal of beta-blocker overdose belongs to Sympathomimetics' };
  }

  // ID 8519: Prazosin alpha-1 blocker hemodynamic changes -> Sympathomimetics (223)
  if (q.id === 8519) {
    return { toModule: 223, reason: 'Hemodynamic profile of alpha-1 adrenergic receptor blockers belongs to Sympathomimetics' };
  }

  // ID 8528: Parkinsonism levodopa involuntary muscle jerks / dyskinesias -> Medicine (466)
  if (q.id === 8528) {
    return { toModule: 466, reason: 'Levodopa-induced dyskinesias in Parkinson disease belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8540: Botulinum toxin mechanism of action -> Anaesthesia (619) or Autonomic (740)
  if (q.id === 8540) {
    return { toModule: 740, reason: 'Botulinum toxin inhibition of vesicular acetylcholine release belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8549: Essential tremor symmetrical posture tremor responsive to propranolol -> Medicine (466)
  if (q.id === 8549) {
    return { toModule: 466, reason: 'Essential tremor clinical features and pharmacotherapy belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8554: COMT inhibitor (entacapone/tolcapone) in Parkinsonism -> Medicine (466)
  if (q.id === 8554) {
    return { toModule: 466, reason: 'COMT inhibitors for Parkinson disease management belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8555: Neuroleptic malignant syndrome (NMS) -> Psychiatry (692)
  if (q.id === 8555) {
    return { toModule: 692, reason: 'Neuroleptic malignant syndrome (NMS) secondary to antipsychotics belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8559: Resting tremor 4-6 Hz / Parkinson disease / Trihexyphenidyl -> Medicine (466)
  if (q.id === 8559) {
    return { toModule: 466, reason: 'Resting tremor and anticholinergic therapy (trihexyphenidyl) for Parkinsonism belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8560: Pill-rolling tremor and bradykinesia / Levodopa -> Medicine (466)
  if (q.id === 8560) {
    return { toModule: 466, reason: 'Parkinsonian tremor and bradykinesia management belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8566: Atypical antipsychotic for obese patient with schizophrenia -> Psychiatry (692)
  if (q.id === 8566) {
    return { toModule: 692, reason: 'Selection of atypical antipsychotics with low metabolic risk in schizophrenia belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8568: Aripiprazole partial agonist in psychotic symptoms -> Psychiatry (692)
  if (q.id === 8568) {
    return { toModule: 692, reason: 'Aripiprazole mechanism (D2 partial agonist) in psychosis belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8569: Parkinsonian rigidity, gait, resting tremor -> Medicine (466)
  if (q.id === 8569) {
    return { toModule: 466, reason: 'Clinical presentation and pharmacotherapy of Parkinsonism belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8575: Acute angle-closure glaucoma -> Drugs for Glaucoma (224)
  if (q.id === 8575) {
    return { toModule: 224, reason: 'Acute angle-closure glaucoma emergency pharmacotherapy belongs to Drugs for Glaucoma' };
  }

  // ID 8588: Carbidopa addition to levodopa decreasing peripheral side effects -> Medicine (466)
  if (q.id === 8588) {
    return { toModule: 466, reason: 'Carbidopa peripheral DOPA decarboxylase inhibition with levodopa belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8589: Migraine prophylaxis beta-blocker contraindications -> Anti-migraine (261)
  if (q.id === 8589) {
    return { toModule: 261, reason: 'Prophylactic pharmacotherapy of migraine headaches belongs to Anti-migraine and Antigout drugs' };
  }

  // ID 8593: AVNRT frog sign / Adenosine -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8593) {
    return { toModule: 229, reason: 'AVNRT management with adenosine belongs to Anti-Arrhythmic Drugs' };
  }

  // ID 8594: Essential tremor bilateral action tremor / Propranolol -> Medicine (466)
  if (q.id === 8594) {
    return { toModule: 466, reason: 'Essential tremor clinical diagnosis and pharmacotherapy belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8595: Acute dystonia following antipsychotic -> Psychiatry (692)
  if (q.id === 8595) {
    return { toModule: 692, reason: 'Acute extrapyramidal dystonia following antipsychotics belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8604: Elderly male with tremors, rigidity, mask-like face -> Medicine (466)
  if (q.id === 8604) {
    return { toModule: 466, reason: 'Idiopathic Parkinson disease clinical signs belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 8606: Involuntary movements of tongue / Tardive dyskinesia -> Psychiatry (692)
  if (q.id === 8606) {
    return { toModule: 692, reason: 'Tardive dyskinesia secondary to chronic antipsychotic use belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8610: Midazolam rectal administration kinetics in febrile seizure -> Pharmacokinetics (221)
  if (q.id === 8610) {
    return { toModule: 221, reason: 'Rectal absorption pathway and bypass of hepatic first-pass metabolism belong to Pharmacokinetics' };
  }

  // ID 8612: Choline reuptake rate limiting step -> Parasympathomimetics (740)
  if (q.id === 8612) {
    return { toModule: 740, reason: 'Choline uptake as the rate-limiting step in acetylcholine synthesis belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8619: Drugs not used in bronchial asthma -> Respiratory System (265)
  if (q.id === 8619) {
    return { toModule: 265, reason: 'Contraindicated drugs in bronchial asthma belong to Respiratory System' };
  }

  // ID 8620: Beta-blocker contraindications -> Sympathomimetics (223)
  if (q.id === 8620) {
    return { toModule: 223, reason: 'Contraindications and precautions for beta-adrenergic receptor blockers belong to Sympathomimetics' };
  }

  // ID 8621: Halothane in pheochromocytoma -> Anaesthesia (620)
  if (q.id === 8621) {
    return { toModule: 620, reason: 'Halothane myocardial sensitization to catecholamines in pheochromocytoma belongs to Anaesthesia: Inhaled Anaesthetics - Properties, N2O and Halothane' };
  }

  // ID 8628: Acute angle-closure glaucoma -> Drugs for Glaucoma (224)
  if (q.id === 8628) {
    return { toModule: 224, reason: 'Acute ocular pain and shallow anterior chamber angle glaucoma emergency belongs to Drugs for Glaucoma' };
  }

  // ID 8632: Urticaria and anaphylactoid reaction dinner -> Sympathomimetics (223) or Derm (643)
  if (q.id === 8632) {
    return { toModule: 223, reason: 'Emergency treatment of acute severe anaphylaxis / urticaria with epinephrine belongs to Sympathomimetics' };
  }

  // ID 8636: Contraindication to beta blockers (Prinzmetal angina) -> Anti-Anginal Drugs (225)
  if (q.id === 8636) {
    return { toModule: 225, reason: 'Contraindication of non-selective beta-blockers in vasospastic (Prinzmetal) angina belongs to Anti-Anginal Drugs' };
  }

  // ID 8637: Sublingual nitroglycerin in stable angina -> Anti-Anginal Drugs (225)
  if (q.id === 8637) {
    return { toModule: 225, reason: 'Sublingual nitroglycerin hemodynamic relief in stable angina belongs to Anti-Anginal Drugs' };
  }

  // ID 8638: Intravenous general anaesthetic cardiovascular stability (Etomidate) -> Anaesthesia (623)
  if (q.id === 8638) {
    return { toModule: 623, reason: 'Etomidate hemodynamic stability in induction belongs to Anaesthesia: Intravenous Anaesthesia - Etomidate, Ketamine' };
  }

  // ID 8648: Hypertensive emergency BP 230/120 Fenoldopam -> Antihypertensive Drugs (227)
  if (q.id === 8648) {
    return { toModule: 227, reason: 'Fenoldopam D1 agonist in hypertensive crisis management belongs to Antihypertensive Drugs' };
  }

  // ID 8650: Amrinone PDE-3 inhibitor in heart failure -> Heart Failure Drugs (226)
  if (q.id === 8650) {
    return { toModule: 226, reason: 'PDE-3 inhibitor inotropic therapy (amrinone/milrinone) belongs to Heart Failure Drugs' };
  }

  // ID 8651: Ganglion blockers vs muscarinic blockers autonomic toxicity -> Parasympathomimetics (740)
  if (q.id === 8651) {
    return { toModule: 740, reason: 'Ganglion vs muscarinic blocker autonomic pharmacology belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 8655: Beta-blockers reducing mortality in HFrEF -> Heart Failure Drugs (226)
  if (q.id === 8655) {
    return { toModule: 226, reason: 'Evidence-based beta-blockers reducing mortality in HFrEF belong to Heart Failure Drugs' };
  }

  // ID 8675: Spironolactone reducing mortality in HFrEF -> Heart Failure Drugs (226)
  if (q.id === 8675) {
    return { toModule: 226, reason: 'Mineralocorticoid receptor antagonists reducing mortality in heart failure belong to Heart Failure Drugs' };
  }

  // ID 8692: Digoxin overdose / Digibind -> Heart Failure Drugs (226)
  if (q.id === 8692) {
    return { toModule: 226, reason: 'Digoxin toxicity and antibody fragment (Digibind) reversal belong to Heart Failure Drugs' };
  }

  // ID 8698: HFrEF sacubitril-valsartan / inotropes -> Heart Failure Drugs (226)
  if (q.id === 8698) {
    return { toModule: 226, reason: 'Heart failure with reduced ejection fraction pharmacotherapy belongs to Heart Failure Drugs' };
  }

  // ID 8703: Chemotherapy-induced cardiomyopathy EF 15% -> Heart Failure Drugs (226)
  if (q.id === 8703) {
    return { toModule: 226, reason: 'Severe dilated cardiomyopathy management belongs to Heart Failure Drugs' };
  }

  // ID 8707: Ketamine cardiovascular stimulation -> Anaesthesia (623)
  if (q.id === 8707) {
    return { toModule: 623, reason: 'Ketamine central sympathetic stimulation and myocardial actions belong to Anaesthesia: Intravenous Anaesthesia - Etomidate, Ketamine' };
  }

  // ID 8712: Diabetic nephropathy ACEI/ARB -> RAAS (231)
  if (q.id === 8712) {
    return { toModule: 231, reason: 'Renoprotection with ACE inhibitors/ARBs in diabetic nephropathy belongs to Renin-Angiotensin-Aldosterone System' };
  }

  // ID 8714: Investigational study of antihypertensive drug -> Antihypertensive Drugs (227)
  if (q.id === 8714) {
    return { toModule: 227, reason: 'Evaluation of novel antihypertensive agent mechanisms belongs to Antihypertensive Drugs' };
  }

  // ID 8746: Cirrhotic ascites spironolactone / furosemide -> Diuretics (228)
  if (q.id === 8746) {
    return { toModule: 228, reason: 'Spironolactone and loop diuretic regimens for cirrhotic ascites belong to Diuretics' };
  }

  // ID 8752: Acute kidney injury / oliguria loop diuretics -> Diuretics (228)
  if (q.id === 8752) {
    return { toModule: 228, reason: 'Loop diuretics in acute oliguric renal failure belong to Diuretics' };
  }

  // ID 8763: Amlodipine CCB induced pedal edema -> Antihypertensive Drugs (227)
  if (q.id === 8763) {
    return { toModule: 227, reason: 'Calcium channel blocker-induced dependent peripheral edema belongs to Antihypertensive Drugs' };
  }

  // ID 8770: Diabetic ketoacidosis osmotic diuresis -> Diuretics (228) or Medicine (444)
  if (q.id === 2970 || q.id === 8770) {
    return { toModule: 444, reason: 'Severe diabetic ketoacidosis clinical presentation belongs to Medicine: Diabetes Mellitus' };
  }

  // ID 8771: Calcium kidney stone prevention with thiazides -> Diuretics (228)
  if (q.id === 8771) {
    return { toModule: 228, reason: 'Thiazide diuretics for recurrent calcium nephrolithiasis belong to Diuretics' };
  }

  // ID 8773: Microalbuminuria in type 2 diabetes -> RAAS (231)
  if (q.id === 8773) {
    return { toModule: 231, reason: 'ACE inhibitor therapy for diabetic microalbuminuria belongs to Renin-Angiotensin-Aldosterone System' };
  }

  // ID 8774: Paroxysmal supraventricular tachycardia / Adenosine -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8774) {
    return { toModule: 229, reason: 'Adenosine acute termination of PSVT belongs to Anti-Arrhythmic Drugs' };
  }

  // ID 8788: Flecainide class IC antiarrhythmic ECG effects -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8788) {
    return { toModule: 229, reason: 'Flecainide Class IC antiarrhythmic electrophysiologic effects belong to Anti-Arrhythmic Drugs' };
  }

  // ID 8789: Quinidine class IA antiarrhythmic prolonging QRS and QT -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8789) {
    return { toModule: 229, reason: 'Quinidine Class IA action potential and ECG effects belong to Anti-Arrhythmic Drugs' };
  }

  // ID 8790: Accelerated idioventricular rhythm post-reperfusion -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8790) {
    return { toModule: 229, reason: 'Accelerated idioventricular rhythm post-thrombolysis belongs to Anti-Arrhythmic Drugs' };
  }

  // ID 8795: Torsades de pointes / drug-induced QT prolongation -> Anti-Arrhythmic Drugs (229)
  if (q.id === 8795) {
    return { toModule: 229, reason: 'Drug-induced QT prolongation and Torsades de pointes belong to Anti-Arrhythmic Drugs' };
  }

  // ID 8798: Bupivacaine LAST axillary block / Intralipid -> Anaesthesia (625)
  if (q.id === 8798) {
    return { toModule: 625, reason: 'Bupivacaine systemic cardiotoxicity and lipid emulsion rescue belong to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8801: Statin therapy hepatic monitoring -> Hypolipidemic Drugs (230)
  if (q.id === 8801) {
    return { toModule: 230, reason: 'Statin hepatic transaminase monitoring and myopathy risks belong to Hypolipidemic Drugs' };
  }

  // ID 8811: Grapefruit juice CYP3A4 inhibition with statins -> Hypolipidemic Drugs (230)
  if (q.id === 8811) {
    return { toModule: 230, reason: 'Grapefruit juice CYP3A4 inhibition increasing statin toxicity belongs to Hypolipidemic Drugs' };
  }

  // ID 8816: TIA secondary stroke prevention antiplatelet -> Antiplatelets (263)
  if (q.id === 8816) {
    return { toModule: 263, reason: 'Antiplatelet therapy for secondary stroke prevention in TIA belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics' };
  }

  // ID 8817: Cholesterol gallstones bile acid dissolution -> Acid Peptic & IBD (266)
  if (q.id === 8817) {
    return { toModule: 266, reason: 'Bile acid therapy (ursodeoxycholic acid) for cholesterol gallstones belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 8833: Captopril competitive ACE inhibition kinetics -> RAAS (231)
  if (q.id === 8833) {
    return { toModule: 231, reason: 'Captopril competitive ACE enzyme inhibition kinetics belong to Renin-Angiotensin-Aldosterone System' };
  }

  // ID 8838: Stress and work-life balance anxiety / SSRI / Benzodiazepine -> Antidepressant and Antianxiety Drugs (235)
  if (q.id === 8838) {
    return { toModule: 235, reason: 'Pharmacotherapy for generalized anxiety and stress belongs to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8842: Omapatrilat / Sacubitril dual NEP and ACE inhibition -> RAAS (231)
  if (q.id === 8842) {
    return { toModule: 231, reason: 'Dual neprilysin and ACE/angiotensin receptor inhibition pathway belongs to Renin-Angiotensin-Aldosterone System' };
  }

  // ID 8843: Inhaled beta-2 agonist for asthma wheezing -> Respiratory System (265)
  if (q.id === 8843) {
    return { toModule: 265, reason: 'Inhaled beta-2 agonist bronchodilator for acute asthma exacerbation belongs to Respiratory System' };
  }

  // ID 8848: SIADH hyponatremia / Tolvaptan / Demeclocycline -> Anti-diuretics (232)
  if (q.id === 8848) {
    return { toModule: 232, reason: 'Vaptans and SIADH management of dilutional hyponatremia belong to Anti-diuretics' };
  }

  // ID 8856: Post-head trauma central diabetes insipidus / Desmopressin -> Anti-diuretics (232)
  if (q.id === 8856) {
    return { toModule: 232, reason: 'Desmopressin replacement for central diabetes insipidus belongs to Anti-diuretics' };
  }

  // ID 8862: Ropivacaine local anaesthetic -> Anaesthesia (625)
  if (q.id === 8862) {
    return { toModule: 625, reason: 'Ropivacaine reduced cardiotoxic profile belongs to Anaesthesia: Local Anaesthetics - Specific Drugs' };
  }

  // ID 8865: Carbamazepine CYP3A4 autoinduction and interactions -> Anti-epileptics (233)
  if (q.id === 8865) {
    return { toModule: 233, reason: 'Carbamazepine hepatic metabolism and drug interactions belong to Anti-epileptics I' };
  }

  // ID 8868: Mechanisms of action of anticonvulsant drugs -> Anti-epileptics (233)
  if (q.id === 8868) {
    return { toModule: 233, reason: 'Mechanisms of action of antiepileptic agents belong to Anti-epileptics I' };
  }

  // ID 8872: Vigabatrin irreversible vision loss -> Anti-epileptics (233)
  if (q.id === 8872) {
    return { toModule: 233, reason: 'Vigabatrin GABA-T inhibition and visual field constriction belong to Anti-epileptics I' };
  }

  // ID 8873: Topiramate angle-closure glaucoma -> Anti-epileptics (233)
  if (q.id === 8873) {
    return { toModule: 233, reason: 'Topiramate-induced acute angle-closure glaucoma belongs to Anti-epileptics I' };
  }

  // ID 8874: Levetiracetam post-craniotomy seizure prophylaxis -> Anti-epileptics (233)
  if (q.id === 8874) {
    return { toModule: 233, reason: 'Levetiracetam SV2A modulation for post-surgical seizure prophylaxis belongs to Anti-epileptics I' };
  }

  // ID 8876: Topiramate renal calculi -> Anti-epileptics (233)
  if (q.id === 8876) {
    return { toModule: 233, reason: 'Topiramate carbonic anhydrase inhibition and nephrolithiasis belong to Anti-epileptics I' };
  }

  // ID 8879: Phenytoin long-term megaloblastic anemia / folic acid -> Anti-epileptics (233)
  if (q.id === 8879) {
    return { toModule: 233, reason: 'Phenytoin-induced folate deficiency and megaloblastic anemia belong to Anti-epileptics I' };
  }

  // ID 8880: Barbiturates mechanisms and abstinence syndrome -> Anti-epileptics (233)
  if (q.id === 8880) {
    return { toModule: 233, reason: 'Barbiturate GABA-A receptor kinetics and withdrawal syndrome belong to Anti-epileptics I' };
  }

  // ID 8881: Phenytoin placental transfer -> Anti-epileptics (233)
  if (q.id === 8881) {
    return { toModule: 233, reason: 'Phenytoin pharmacokinetics and placental barrier penetration belong to Anti-epileptics I' };
  }

  // ID 8883: GAT-1 inhibitor (Tiagabine) -> Anti-epileptics (233)
  if (q.id === 8883) {
    return { toModule: 233, reason: 'Tiagabine selective inhibition of GAT-1 GABA transporter belongs to Anti-epileptics I' };
  }

  // ID 8885: ACTH for West syndrome (Infantile spasms) -> Anti-epileptics (233)
  if (q.id === 8885) {
    return { toModule: 233, reason: 'ACTH first-line therapy for West syndrome (infantile spasms) belongs to Anti-epileptics I' };
  }

  // ID 8896: Thalamic Dejerine-Roussy syndrome central neuropathic pain / Pregabalin -> Anti-epileptics (233)
  if (q.id === 8896) {
    return { toModule: 233, reason: 'Gabapentinoid therapy for central post-stroke neuropathic pain belongs to Anti-epileptics I' };
  }

  // ID 8902: Valproate teratogenicity / neural tube defects -> Anti-epileptics (233)
  if (q.id === 8902) {
    return { toModule: 233, reason: 'Sodium valproate teratogenicity and neural tube defect risk belong to Anti-epileptics I' };
  }

  // ID 8903: Absence seizures / Ethosuximide / Valproate -> Anti-epileptics (233)
  if (q.id === 8903) {
    return { toModule: 233, reason: 'Absence seizure diagnosis and T-type calcium channel blocker pharmacotherapy belong to Anti-epileptics I' };
  }

  // ID 8908: Lithium properties -> Anti-manic Drugs (234)
  if (q.id === 8908) {
    return { toModule: 234, reason: 'Lithium pharmacology and therapeutic mechanisms belong to Anti-manic Drugs' };
  }

  // ID 8909: Clozapine agranulocytosis -> Psychiatry (692)
  if (q.id === 8909) {
    return { toModule: 692, reason: 'Clozapine-induced agranulocytosis and absolute neutrophil monitoring belong to Psychiatry: Schizophrenia' };
  }

  // ID 8910: Smoking cessation bupropion / varenicline -> Antidepressants (235)
  if (q.id === 8910) {
    return { toModule: 235, reason: 'Bupropion and varenicline for smoking cessation belong to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8930: Imipramine TCA relationship -> Antidepressants (235)
  if (q.id === 8930) {
    return { toModule: 235, reason: 'Imipramine tricyclic antidepressant pharmacology belongs to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8931: Schizophrenia tardive dyskinesia -> Psychiatry (692)
  if (q.id === 8931) {
    return { toModule: 692, reason: 'Tardive dyskinesia from chronic typical antipsychotics belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8932: Benzodiazepines premedication in general anaesthesia -> Anaesthesia (622)
  if (q.id === 8932) {
    return { toModule: 622, reason: 'Benzodiazepine premedication for general anaesthesia belongs to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol' };
  }

  // ID 8934: Amyotrophic lateral sclerosis (ALS) / Riluzole -> Medicine (465)
  if (q.id === 8934) {
    return { toModule: 465, reason: 'ALS diagnosis and riluzole neuroprotective therapy belong to Medicine: Motor Neuron Diseases & Spinal Cord Disorders' };
  }

  // ID 8940: SNRI / Venlafaxine blocking 5-HT and NE reuptake -> Antidepressants (235)
  if (q.id === 8940) {
    return { toModule: 235, reason: 'Serotonin-norepinephrine reuptake inhibitor mechanism belongs to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8946: Wernicke encephalopathy / Thiamine in chronic alcoholic -> Biochemistry (124)
  if (q.id === 8946) {
    return { toModule: 124, reason: 'Thiamine deficiency causing Wernicke encephalopathy in alcoholism belongs to Biochemistry: Vitamins and Minerals' };
  }

  // ID 8949: Risperidone neuroleptic malignant syndrome -> Psychiatry (692)
  if (q.id === 8949) {
    return { toModule: 692, reason: 'Neuroleptic malignant syndrome from risperidone belongs to Psychiatry: Schizophrenia' };
  }

  // ID 8955: Buspirone 5-HT1A partial agonist -> Antidepressants (235)
  if (q.id === 8955) {
    return { toModule: 235, reason: 'Buspirone 5-HT1A agonist mechanism for generalized anxiety disorder belongs to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8959: Selective serotonin and norepinephrine reuptake inhibitor -> Antidepressants (235)
  if (q.id === 8959) {
    return { toModule: 235, reason: 'SNRI antidepressant classification belongs to Antidepressant and Antianxiety Drugs' };
  }

  // ID 8963: Malignant hyperthermia from succinylcholine & halothane -> Anaesthesia (619)
  if (q.id === 8963) {
    return { toModule: 619, reason: 'Malignant hyperthermia triggered by succinylcholine and halothane belongs to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 8965: Codeine + Dextromethorphan cough suppression -> Opioids (236)
  if (q.id === 8965) {
    return { toModule: 236, reason: 'Codeine opioid antitussive actions belong to Opioids - Functions and Classification' };
  }

  // ID 8968: Phospholipase C Gq GPCR subunit -> Clinical Trials & Misc (222)
  if (q.id === 8968) {
    return { toModule: 222, reason: 'GPCR Gq subunit activation of phospholipase C belongs to Clinical Trials and Miscellaneous' };
  }

  // ID 8974: Acetylcysteine / Ambroxol mucolytics for cough -> Respiratory System (265)
  if (q.id === 8974) {
    return { toModule: 265, reason: 'Mucolytic therapy for productive cough belongs to Respiratory System' };
  }

  // ID 8981: Liver cancer metastasis severe pain / Opioids -> Opioids (236)
  if (q.id === 8981) {
    return { toModule: 236, reason: 'Opioid analgesia for metastatic cancer pain belongs to Opioids - Functions and Classification' };
  }

  // ID 8986: Methadone / Buprenorphine for opioid use disorder -> Synthetic Opioids (237)
  if (q.id === 8986) {
    return { toModule: 237, reason: 'Pharmacotherapy for opioid use disorder (methadone/buprenorphine) belongs to Synthetic Opioids' };
  }

  // ID 8987: Methadone mu-agonist and NMDA antagonist -> Synthetic Opioids (237)
  if (q.id === 8987) {
    return { toModule: 237, reason: 'Methadone mu-opioid receptor agonism and NMDA antagonism belong to Synthetic Opioids' };
  }

  // ID 9004: Opioid antitussive ban in children -> Opioids (236)
  if (q.id === 9004) {
    return { toModule: 236, reason: 'Opioid antitussive safety restrictions in children belong to Opioids - Functions and Classification' };
  }

  // ID 9010: Naltrexone for addiction (alcohol, opioids) -> Opioid Antagonists (238)
  if (q.id === 9010) {
    return { toModule: 238, reason: 'Naltrexone opioid antagonist therapy for dual opioid and alcohol dependence belongs to Opioid Antagonists' };
  }

  // ID 9012: Morphine causing Sphincter of Oddi spasm -> Opioids (236)
  if (q.id === 9012) {
    return { toModule: 236, reason: 'Morphine smooth muscle spasm of the Sphincter of Oddi belongs to Opioids - Functions and Classification' };
  }

  // ID 9013: Opioid tolerance constipation & miosis lack of tolerance -> Opioids (236)
  if (q.id === 9013) {
    return { toModule: 236, reason: 'Differential tolerance development to opioid adverse effects (miosis and constipation) belongs to Opioids - Functions and Classification' };
  }

  // ID 9016: Levodopa-carbidopa in Parkinsonism -> Medicine (466)
  if (q.id === 9016) {
    return { toModule: 466, reason: 'Levodopa-carbidopa synergy and peripheral decarboxylase inhibition belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9020: Atypical antipsychotic long QT syndrome -> Psychiatry (692)
  if (q.id === 9020) {
    return { toModule: 692, reason: 'Antipsychotic-induced QT prolongation and arrhythmia risk belong to Psychiatry: Schizophrenia' };
  }

  // ID 9021: T4 therapy in elderly with hypothyroidism -> Thyroid (253)
  if (q.id === 9021) {
    return { toModule: 253, reason: 'Levothyroxine cautious titration in elderly hypothyroid patients belongs to Thyroid and Antithyroid Agents' };
  }

  // ID 9022: Tobramycin inhaled in cystic fibrosis Pseudomonas -> Antimicrobials Acting on 30S (242)
  if (q.id === 9022) {
    return { toModule: 242, reason: 'Inhaled tobramycin for cystic fibrosis Pseudomonas infection belongs to Antimicrobials Acting on 30S Subunit' };
  }

  // ID 9024: Rufinamide for refractory Lennox-Gastaut syndrome -> Anti-epileptics (233)
  if (q.id === 9024) {
    return { toModule: 233, reason: 'Rufinamide sodium channel blocker for refractory childhood epilepsy belongs to Anti-epileptics I' };
  }

  // ID 9025: Motion sickness / Scopolamine -> Anti-emetics (267)
  if (q.id === 9025) {
    return { toModule: 267, reason: 'Scopolamine prophylaxis for vestibular motion sickness belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9028: Alpha-1 blocker for BPH with HTN -> Sympathomimetics (223)
  if (q.id === 9028) {
    return { toModule: 223, reason: 'Alpha-1 adrenoceptor antagonist for concurrent BPH and hypertension belongs to Sympathomimetics' };
  }

  // ID 9031: Deep brain stimulation for epilepsy -> Medicine (463)
  if (q.id === 9031) {
    return { toModule: 463, reason: 'Thalamic deep brain stimulation for medically refractory seizures belongs to Medicine: Epilepsy & Seizure Disorders' };
  }

  // ID 9037: Clindamycin for lung abscess in alcoholic -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9037) {
    return { toModule: 239, reason: 'Clindamycin anaerobic coverage for aspiration lung abscess belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9039: Pseudoparkinsonism from antipsychotics -> Medicine (466)
  if (q.id === 9039) {
    return { toModule: 466, reason: 'Drug-induced secondary parkinsonism from dopamine receptor antagonists belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9041: Tamoxifen breast cancer SERM / endometrial cancer risk -> OCPs, Estrogens (257)
  if (q.id === 9041) {
    return { toModule: 257, reason: 'Tamoxifen selective estrogen receptor modulation and endometrial cancer risk belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9045: RA rheumatoid arthritis methotrexate DMARD -> Anti-rheumatoid (262)
  if (q.id === 9045) {
    return { toModule: 262, reason: 'Methotrexate DMARD initiation and steroid bridge in rheumatoid arthritis belong to Anti-rheumatoid drugs' };
  }

  // ID 9048: Malaria chemoprophylaxis -> Antimalarial Drugs (240)
  if (q.id === 9048) {
    return { toModule: 240, reason: 'Malaria chemoprophylactic drug regimens belong to Antimalarial Drugs' };
  }

  // ID 9050: Chloroquine blood schizonticide -> Antimalarial Drugs (240)
  if (q.id === 9050) {
    return { toModule: 240, reason: 'Chloroquine erythrocyte blood schizonticide action belongs to Antimalarial Drugs' };
  }

  // ID 9052: Mefloquine adverse effects -> Antimalarial Drugs (240)
  if (q.id === 9052) {
    return { toModule: 240, reason: 'Mefloquine neuropsychiatric and gastrointestinal adverse effects belong to Antimalarial Drugs' };
  }

  // ID 9053: Primaquine hypnozoites -> Antimalarial Drugs (240)
  if (q.id === 9053) {
    return { toModule: 240, reason: 'Primaquine eradication of dormant hepatic hypnozoites belongs to Antimalarial Drugs' };
  }

  // ID 9054: Primaquine terminal prophylaxis -> Antimalarial Drugs (240)
  if (q.id === 9054) {
    return { toModule: 240, reason: 'Primaquine terminal prophylaxis against vivax and ovale relapse belongs to Antimalarial Drugs' };
  }

  // ID 9061: Chloroquine malaria chemoprophylaxis Caribbean -> Antimalarial Drugs (240)
  if (q.id === 9061) {
    return { toModule: 240, reason: 'Chloroquine prophylaxis for chloroquine-sensitive Caribbean malaria belongs to Antimalarial Drugs' };
  }

  // ID 9062: Fever with chills malaria -> Antimalarial Drugs (240)
  if (q.id === 9062) {
    return { toModule: 240, reason: 'Acute febrile paroxysms of malaria and antimalarial choice belong to Antimalarial Drugs' };
  }

  // ID 9069: Normal pressure hydrocephalus (NPH) triad and shunt -> Medicine (464)
  if (q.id === 9069) {
    return { toModule: 464, reason: 'Normal pressure hydrocephalus triad (ataxia, incontinence, dementia) belongs to Medicine: Dementias & Neurocognitive Disorders' };
  }

  // ID 9070: Levofloxacin half-life elimination percentage calculation -> Pharmacokinetics (221)
  if (q.id === 9070) {
    return { toModule: 221, reason: 'Half-life calculation and fractional drug elimination belong to Pharmacokinetics' };
  }

  // ID 9075: Drugs worsening myasthenia gravis -> Anaesthesia (619) or Medicine (467)
  if (q.id === 9075) {
    return { toModule: 467, reason: 'Medications exacerbating neuromuscular junction transmission in myasthenia gravis belong to Medicine: Neuromuscular Junction Disorders & Myopathies' };
  }

  // ID 9076: Transdermal oxybutynin patch for overactive bladder -> Parasympathomimetics (740)
  if (q.id === 9076) {
    return { toModule: 740, reason: 'Transdermal antimuscarinic therapy (oxybutynin) for overactive bladder belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 9077: Trospium for urge incontinence in Alzheimer's -> Parasympathomimetics (740)
  if (q.id === 9077) {
    return { toModule: 740, reason: 'Trospium quaternary ammonium antimuscarinic sparing CNS in dementia belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 9078: Botulinum toxin mechanism of action -> Parasympathomimetics (740)
  if (q.id === 9078) {
    return { toModule: 740, reason: 'Botulinum toxin cleavage of SNARE proteins inhibiting ACh release belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 9080: Urinary hesitancy and retention anticholinergic / BPH -> Sympathomimetics (223) or Androgens (258)
  if (q.id === 9080) {
    return { toModule: 258, reason: 'Benign prostatic hyperplasia urinary retention pharmacotherapy belongs to Androgens and Drugs for Erectile Dysfunction' };
  }

  // ID 9081: Phenylephrine alpha-1 toxicity in child -> Sympathomimetics (223)
  if (q.id === 9081) {
    return { toModule: 223, reason: 'Phenylephrine selective alpha-1 adrenergic overdose manifestations belong to Sympathomimetics' };
  }

  // ID 9084: Metastatic prostate cancer androgen deprivation -> Androgens and ED (258)
  if (q.id === 9084) {
    return { toModule: 258, reason: 'Androgen deprivation therapy and antiandrogens for metastatic prostate cancer belong to Androgens and Drugs for Erectile Dysfunction' };
  }

  // ID 9091: Listeria monocytogenes in CSF ampicillin -> Penicillins (244)
  if (q.id === 9091) {
    return { toModule: 244, reason: 'Ampicillin coverage for Listeria monocytogenes meningitis belongs to Penicillins' };
  }

  // ID 9100: Drugs inducing pulmonary fibrosis -> Respiratory System (265)
  if (q.id === 9100) {
    return { toModule: 265, reason: 'Drug-induced interstitial lung disease and pulmonary fibrosis belong to Respiratory System' };
  }

  // ID 9102: Schizophrenia acute dystonia treatment -> Psychiatry (692)
  if (q.id === 9102) {
    return { toModule: 692, reason: 'Anticholinergic management of acute dystonic reaction from antipsychotics belongs to Psychiatry: Schizophrenia' };
  }

  // ID 9104: Oral mucosa patches (oral thrush) -> Antifungals (247)
  if (q.id === 9104) {
    return { toModule: 247, reason: 'Oral candidiasis presentation and topical/systemic antifungal therapy belong to Antifungal Agents' };
  }

  // ID 9105: Inhaled steroid oral rinsing -> Respiratory System (265)
  if (q.id === 9105) {
    return { toModule: 265, reason: 'Prevention of oropharyngeal candidiasis from inhaled corticosteroids belongs to Respiratory System' };
  }

  // ID 9107: Mitomycin C in trabeculectomy / pterygium -> Drugs for Glaucoma (224)
  if (q.id === 9107) {
    return { toModule: 224, reason: 'Mitomycin C antimetabolite application in trabeculectomy filtration surgery belongs to Drugs for Glaucoma' };
  }

  // ID 9108: Chloramphenicol gray baby syndrome -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9108) {
    return { toModule: 239, reason: 'Chloramphenicol glucuronyl transferase deficiency and gray baby syndrome belong to General Principles of Antimicrobial Therapy' };
  }

  // ID 9109: Pertussis azithromycin treatment -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 242 || q.id === 9109) {
    return { toModule: 239, reason: 'Macrolide treatment for Bordetella pertussis whooping cough belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9111: Extrapyramidal syndrome side effects -> Medicine (466)
  if (q.id === 9111) {
    return { toModule: 466, reason: 'Drug-induced extrapyramidal symptoms belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9115: Antibiotic prophylaxis for skin procedures -> Penicillins (244)
  if (q.id === 9115) {
    return { toModule: 244, reason: 'Antistaphylococcal penicillin prophylaxis for skin procedures belongs to Penicillins' };
  }

  // ID 9119: Clindamycin 50S subunit inhibitor -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9119) {
    return { toModule: 239, reason: 'Clindamycin inhibition of 50S ribosomal peptidyltransferase belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9120: Clostridioides difficile colitis post-clindamycin -> Cephalosporins, Vancomycin and Carbapenems (245)
  if (q.id === 9120) {
    return { toModule: 245, reason: 'Oral vancomycin / fidaxomicin for Clostridioides difficile colitis belongs to Cephalosporins, Vancomycin and Carbapenems' };
  }

  // ID 9123: Penicillin + Gentamicin synergistic killing -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9123) {
    return { toModule: 239, reason: 'Synergistic bactericidal interaction of beta-lactams and aminoglycosides belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9126: Streptomycin ototoxicity in TB patient -> Antimicrobials Acting on 30S (242)
  if (q.id === 9126) {
    return { toModule: 242, reason: 'Streptomycin aminoglycoside vestibulotoxicity and ototoxicity belong to Antimicrobials Acting on 30S Subunit' };
  }

  // ID 9133: TB + HIV co-infection interaction -> Antiretroviral Drugs (243)
  if (q.id === 9133) {
    return { toModule: 243, reason: 'Rifampicin CYP3A induction and antiretroviral dose adjustments in TB-HIV co-infection belong to Antiretroviral Drugs' };
  }

  // ID 9138: Abacavir HLA-B*5701 hypersensitivity -> Antiretroviral Drugs (243)
  if (q.id === 9138) {
    return { toModule: 243, reason: 'Abacavir hypersensitivity reaction pharmacogenomics (HLA-B*5701) belongs to Antiretroviral Drugs' };
  }

  // ID 9151: Tenofovir for chronic hepatitis B -> Antiretroviral Drugs (243)
  if (q.id === 9151) {
    return { toModule: 243, reason: 'Tenofovir nucleotide reverse transcriptase inhibitor for HBV/HIV belongs to Antiretroviral Drugs' };
  }

  // ID 9152: Adefovir active against HBV, HIV -> Antivirals (251)
  if (q.id === 9152) {
    return { toModule: 251, reason: 'Adefovir dipivoxil nucleotide analog for chronic hepatitis B belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9157: Antiviral for both HIV and HBV (Lamivudine / Tenofovir) -> Antiretroviral Drugs (243)
  if (q.id === 9157) {
    return { toModule: 243, reason: 'Dual HIV and hepatitis B activity of NRTI agents belongs to Antiretroviral Drugs' };
  }

  // ID 9158: Suicide inhibition (Allopurinol, Clavulanic acid, Spironolactone) -> Clinical Trials & Misc (222)
  if (q.id === 9158) {
    return { toModule: 222, reason: 'Suicide (mechanism-based) enzyme inhibition principles belong to Clinical Trials and Miscellaneous' };
  }

  // ID 9159: Abacavir HLA-B*5701 -> Antiretroviral Drugs (243)
  if (q.id === 9159) {
    return { toModule: 243, reason: 'Abacavir screening for HLA-B*5701 allele belongs to Antiretroviral Drugs' };
  }

  // ID 9162: ART agents matching -> Antiretroviral Drugs (243)
  if (q.id === 9162) {
    return { toModule: 243, reason: 'Classification and matching of antiretroviral therapeutic classes belong to Antiretroviral Drugs' };
  }

  // ID 9164: Fluoroquinolones in TB -> Second Line Drugs for Tuberculosis (249)
  if (q.id === 9164) {
    return { toModule: 249, reason: 'Fluoroquinolones and rifabutin in drug-resistant tuberculosis belong to Second Line Drugs for Tuberculosis' };
  }

  // ID 9166: Acute bacterial rhinosinusitis amoxicillin-clavulanate -> Penicillins (244)
  if (q.id === 9166) {
    return { toModule: 244, reason: 'Amoxicillin-clavulanic acid for bacterial rhinosinusitis belongs to Penicillins' };
  }

  // ID 9167: Congenital syphilis penicillin treatment -> Penicillins (244)
  if (q.id === 9167) {
    return { toModule: 244, reason: 'Parenteral penicillin G therapy for congenital syphilis manifestations belongs to Penicillins' };
  }

  // ID 9169: Synergy in neonatal sepsis antibiotic combination -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9169) {
    return { toModule: 239, reason: 'Bacterial synergistic killing in empiric neonatal regimens belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9173: MRSA altered PBP2a resistance -> Penicillins (244)
  if (q.id === 9173) {
    return { toModule: 244, reason: 'Methicillin resistance via altered penicillin-binding protein (PBP2a) belongs to Penicillins' };
  }

  // ID 9183: Amoxicillin-clavulanate cholestatic jaundice -> Penicillins (244)
  if (q.id === 9183) {
    return { toModule: 244, reason: 'Amoxicillin-clavulanate drug-induced cholestatic liver injury belongs to Penicillins' };
  }

  // ID 9185: XDR-TB unsafe drugs in pregnancy -> Second Line Drugs for Tuberculosis (249)
  if (q.id === 9185) {
    return { toModule: 249, reason: 'Contraindicated second-line antitubercular drugs in pregnancy belong to Second Line Drugs for Tuberculosis' };
  }

  // ID 9186: Mycoplasma pneumoniae atypical pneumonia / Macrolides -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9186) {
    return { toModule: 239, reason: 'Macrolide therapy for atypical Mycoplasma pneumonia belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9188 & 9190: Daptomycin membrane depolarization -> Cephalosporins, Vancomycin and Carbapenems (245)
  if (q.id === 9188 || q.id === 9190) {
    return { toModule: 245, reason: 'Daptomycin lipopeptide bacterial membrane disruption belongs to Cephalosporins, Vancomycin and Carbapenems' };
  }

  // ID 9189: Vancomycin steady-state half-life calculation -> Pharmacokinetics (221)
  if (q.id === 9189) {
    return { toModule: 221, reason: 'Calculation of time to reach steady-state concentration (4-5 half-lives) belongs to Pharmacokinetics' };
  }

  // ID 9191: Fluoroquinolones for traveler's diarrhea -> Sulfonamides, Quinolones (241)
  if (q.id === 9191) {
    return { toModule: 241, reason: 'Fluoroquinolones for enterotoxigenic bacterial traveler\'s diarrhea belong to Sulfonamides, Quinolones and Urinary Antiseptics' };
  }

  // ID 9195: Imipenem + Cilastatin dehydropeptidase-I inhibition -> Cephalosporins, Vancomycin and Carbapenems (245)
  if (q.id === 9195) {
    return { toModule: 245, reason: 'Cilastatin renal dehydropeptidase-I inhibition protecting imipenem belongs to Cephalosporins, Vancomycin and Carbapenems' };
  }

  // ID 9212: Warfarin + Macrolide interaction -> Anticoagulants (264)
  if (q.id === 9212) {
    return { toModule: 264, reason: 'Macrolide inhibition of warfarin metabolism increasing bleeding risk belongs to Anticoagulants' };
  }

  // ID 9216: Inhaled halogenated anaesthetic cardiac depression -> Anaesthesia (620)
  if (q.id === 9216) {
    return { toModule: 620, reason: 'Halogenated volatile anaesthetics myocardial depression belongs to Anaesthesia: Inhaled Anaesthetics - Properties, N2O and Halothane' };
  }

  // ID 9217: Metronidazole disulfiram-like reaction in alcoholic -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9217) {
    return { toModule: 246, reason: 'Metronidazole disulfiram-like ethanol reaction belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9219: Lidocaine reference local anaesthetic -> Anaesthesia (624)
  if (q.id === 9219) {
    return { toModule: 624, reason: 'Lidocaine as the standard reference local anaesthetic agent belongs to Anaesthesia: Local Anaesthetics - General Properties' };
  }

  // ID 9220: Botulism clinical presentation -> Forensic Medicine (291)
  if (q.id === 9220) {
    return { toModule: 291, reason: 'Clostridium botulinum neurotoxin clinical syndrome belongs to Forensic Medicine: Organic Irritants - Plant and Animal Poisons' };
  }

  // ID 9223: General anaesthetic 5 primary components -> Anaesthesia (609)
  if (q.id === 9223) {
    return { toModule: 609, reason: 'Fundamental components of the general anaesthetic state belong to Anaesthesia: History and Ethical Aspects of Anaesthesia' };
  }

  // ID 9228: Metronidazole killing trophozoites of E histolytica -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9228) {
    return { toModule: 246, reason: 'Metronidazole protozoocidal action against Entamoeba histolytica trophozoites belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9229: Amebic liver abscess metronidazole dose -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 246 || q.id === 9229) {
    return { toModule: 246, reason: 'Metronidazole therapeutic regimen for amebic liver abscess belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9231: Albendazole administration with fatty meal -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9231) {
    return { toModule: 246, reason: 'Albendazole dietary fat absorption enhancement for systemic tissue parasites belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9232: Albendazole long-term adverse effects -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9232) {
    return { toModule: 246, reason: 'Prolonged high-dose albendazole hepatotoxicity and safety belong to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9233: Ivermectin DOC strongyloidiasis / onchocerciasis -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9233) {
    return { toModule: 246, reason: 'Ivermectin first-line therapy for onchocerciasis and strongyloidiasis belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9234: Ivermectin glutamate-gated Cl- channel MOA -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9234) {
    return { toModule: 246, reason: 'Ivermectin invertebrate glutamate-gated chloride channel activation belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9241: Ivermectin single dose for Onchocerciasis -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9241) {
    return { toModule: 246, reason: 'Single-dose ivermectin regimen for onchocerciasis belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9242: Albendazole DOC hydatid cyst / neurocysticercosis -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9242) {
    return { toModule: 246, reason: 'Albendazole therapy for Echinococcus hydatid cyst and neurocysticercosis belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9243: Metronidazole disulfiram ethanol reaction in BV -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9243) {
    return { toModule: 246, reason: 'Metronidazole aldehyde dehydrogenase inhibition and alcohol avoidance belong to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9247: H. pylori eradication regimen CDC -> Acid Peptic & IBD (266)
  if (q.id === 9247) {
    return { toModule: 266, reason: 'Antimicrobial regimen for Helicobacter pylori eradication belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9249: Antifungal spectrum match -> Antifungal Agents (247)
  if (q.id === 9249) {
    return { toModule: 247, reason: 'Comparative spectrum of antifungal therapeutic classes belongs to Antifungal Agents' };
  }

  // ID 9253: Voriconazole + Tacrolimus CYP3A4 interaction -> Antifungal Agents (247)
  if (q.id === 9253) {
    return { toModule: 247, reason: 'Azole CYP3A4 inhibition increasing calcineurin inhibitor blood levels belongs to Antifungal Agents' };
  }

  // ID 9256: Inhaled corticosteroid oral candidiasis -> Respiratory System (265)
  if (q.id === 9256) {
    return { toModule: 265, reason: 'Oropharyngeal candidiasis complication of inhaled corticosteroids belongs to Respiratory System' };
  }

  // ID 9257: Fluconazole volume of distribution calculation -> Pharmacokinetics (221)
  if (q.id === 9257) {
    return { toModule: 221, reason: 'Volume of distribution calculation for fluconazole belongs to Pharmacokinetics' };
  }

  // ID 9259: Coccidioidomycosis California / Itraconazole -> Antifungal Agents (247)
  if (q.id === 9259) {
    return { toModule: 247, reason: 'Azole antifungal management of endemic Coccidioides immitis infection belongs to Antifungal Agents' };
  }

  // ID 9260: Candida esophagitis in HIV / Griseofulvin -> Antifungal Agents (247)
  if (q.id === 9260) {
    return { toModule: 247, reason: 'Antifungal resistance and lack of Candida coverage by griseofulvin belong to Antifungal Agents' };
  }

  // ID 9261: Rhinocerebral mucormycosis liposomal amphotericin B -> Antifungal Agents (247)
  if (q.id === 9261) {
    return { toModule: 247, reason: 'Liposomal amphotericin B for invasive rhinocerebral mucormycosis belongs to Antifungal Agents' };
  }

  // ID 9262: ABPA in cystic fibrosis itraconazole + steroids -> Antifungal Agents (247)
  if (q.id === 9262) {
    return { toModule: 247, reason: 'Allergic bronchopulmonary aspergillosis (ABPA) antifungal therapy belongs to Antifungal Agents' };
  }

  // ID 9265: Onychomycosis terbinafine -> Antifungal Agents (247)
  if (q.id === 9265) {
    return { toModule: 247, reason: 'Terbinafine squalene epoxidase inhibitor for dermatophyte onychomycosis belongs to Antifungal Agents' };
  }

  // ID 9271: Azoles + Tacrolimus GVHD -> Antifungal Agents (247)
  if (q.id === 9271) {
    return { toModule: 247, reason: 'Calcineurin inhibitor toxicities potentiated by azole antifungals belong to Antifungal Agents' };
  }

  // ID 9279: Invasive aspergillosis in leukemia / Voriconazole -> Antifungal Agents (247)
  if (q.id === 9279) {
    return { toModule: 247, reason: 'Voriconazole first-line therapy for invasive pulmonary aspergillosis belongs to Antifungal Agents' };
  }

  // ID 9289: Sterilizing agent against residual persisters in TB (Pyrazinamide) -> First Line TB (248)
  if (q.id === 9289) {
    return { toModule: 248, reason: 'Pyrazinamide sterilizing activity against intracellular tuberculous persisters belongs to First Line Drugs for Tuberculosis' };
  }

  // ID 9292: Diphtheria carrier erythromycin -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9292) {
    return { toModule: 239, reason: 'Erythromycin chemoprophylaxis for asymptomatic Corynebacterium diphtheriae carriers belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9296: Cohort study LBW infants relative risk calculation -> PSM (357)
  if (q.id === 9296) {
    return { toModule: 357, reason: 'Cohort study design and relative risk calculation belong to PSM: Epidemiological Methods' };
  }

  // ID 9297: Dose-response curve plotting (A, B, C, D) -> Clinical Trials & Misc (222)
  if (q.id === 9297) {
    return { toModule: 222, reason: 'Comparative log dose-response curves for efficacy and potency belong to Clinical Trials and Miscellaneous' };
  }

  // ID 9298: Acute iron tablet poisoning / Deferoxamine -> Mixed / Misc (271)
  if (q.id === 9298) {
    return { toModule: 271, reason: 'Deferoxamine chelation for acute pediatric iron poisoning belongs to Mixed / Miscellaneous Topics' };
  }

  // ID 9299: d-tubocurarine neuromuscular block -> Anaesthesia (619)
  if (q.id === 9299) {
    return { toModule: 619, reason: 'd-Tubocurarine historical arrow poison and neuromuscular blockade belong to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 9303: Bedaquiline for MDR-TB -> Second Line TB (249)
  if (q.id === 9303) {
    return { toModule: 249, reason: 'Bedaquiline novel ATP synthase inhibitor for MDR-TB belongs to Second Line Drugs for Tuberculosis' };
  }

  // ID 9304: Isoniazid peripheral neuropathy pyridoxine -> First Line TB (248)
  if (q.id === 9304) {
    return { toModule: 248, reason: 'Isoniazid-induced vitamin B6 deficiency and neuropathy belong to First Line Drugs for Tuberculosis' };
  }

  // ID 9312: Mycobacterium avium complex initial treatment -> General Principles of Antimicrobial Therapy (239)
  if (q.id === 9312) {
    return { toModule: 239, reason: 'Clarithromycin/azithromycin combination for Mycobacterium avium complex belongs to General Principles of Antimicrobial Therapy' };
  }

  // ID 9327: Primary pulmonary TB 4-drug HRZE in child -> First Line TB (248)
  if (q.id === 9327) {
    return { toModule: 248, reason: 'First-line four-drug intensive phase regimen for pulmonary TB belongs to First Line Drugs for Tuberculosis' };
  }

  // ID 9328: TB meningitis HRZES regimen -> First Line TB (248)
  if (q.id === 9328) {
    return { toModule: 248, reason: 'Antitubercular therapeutic regimen for tuberculous meningitis belongs to First Line Drugs for Tuberculosis' };
  }

  // ID 9333: Bedaquiline QT prolongation ECG -> Second Line TB (249)
  if (q.id === 9333) {
    return { toModule: 249, reason: 'Bedaquiline-induced cardiac QT prolongation and ECG monitoring belong to Second Line Drugs for Tuberculosis' };
  }

  // ID 9335: Second-line antitubercular drug classification -> Second Line TB (249)
  if (q.id === 9335) {
    return { toModule: 249, reason: 'Identification and classification of second-line antitubercular agents belong to Second Line Drugs for Tuberculosis' };
  }

  // ID 9336: Fragile X mental retardation -> Pediatrics (604) or Pathology (132)
  if (q.id === 9336) {
    return { toModule: 604, reason: 'Most common inherited genetic cause of intellectual disability (Fragile X syndrome) belongs to Pediatrics: Genetic & Metabolic Disorders in Children' };
  }

  // ID 9339: Bedaquiline mycobacterial ATP synthase inhibition -> Second Line TB (249)
  if (q.id === 9339) {
    return { toModule: 249, reason: 'Bedaquiline mycobacterial ATP synthase proton pump inhibition belongs to Second Line Drugs for Tuberculosis' };
  }

  // ID 9340: Borderline leprosy type 1 lepra reaction MDT -> Anti-leprosy Drugs (250)
  if (q.id === 9340) {
    return { toModule: 250, reason: 'Type 1 reversal lepra reaction during multidrug therapy belongs to Anti-leprosy Drugs' };
  }

  // ID 9343: Supervised monthly rifampicin in NLEP -> Anti-leprosy Drugs (250)
  if (q.id === 9343) {
    return { toModule: 250, reason: 'Monthly supervised rifampicin dosing in NLEP multidrug therapy belongs to Anti-leprosy Drugs' };
  }

  // ID 9349: Ganciclovir for CMV retinitis -> Antivirals (251)
  if (q.id === 9349) {
    return { toModule: 251, reason: 'Ganciclovir first-line therapy for cytomegalovirus (CMV) retinitis belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9360: Penciclovir for acyclovir-resistant HSV -> Antivirals (251)
  if (q.id === 9360) {
    return { toModule: 251, reason: 'Topical penciclovir/foscarnet for resistant herpes simplex infection belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9362: Ganciclovir CMV prophylaxis post-liver transplant -> Antivirals (251)
  if (q.id === 9362) {
    return { toModule: 251, reason: 'Ganciclovir prophylaxis for CMV in solid organ transplantation belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9363: Foscarnet direct DNA/RNA polymerase inhibition -> Antivirals (251)
  if (q.id === 9363) {
    return { toModule: 251, reason: 'Foscarnet pyrophosphate analog direct polymerase inhibition belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9364: Ribavirin against HCV -> Antivirals (251)
  if (q.id === 9364) {
    return { toModule: 251, reason: 'Ribavirin purine nucleoside analog for chronic hepatitis C belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9365: Oseltamivir neuraminidase inhibitor for Swine flu -> Antivirals (251)
  if (q.id === 9365) {
    return { toModule: 251, reason: 'Oseltamivir neuraminidase inhibitor for influenza A (H1N1) belongs to Anti-virals (Non-retroviral)' };
  }

  // ID 9373: Prednisolone for Bell's facial nerve palsy -> Corticosteroids (254)
  if (q.id === 9373) {
    return { toModule: 254, reason: 'Oral corticosteroid pulse therapy for idiopathic acute facial nerve palsy belongs to Corticosteroids' };
  }

  // ID 9375: Huntington chorea tetrabenazine / haloperidol -> Medicine (466)
  if (q.id === 9375) {
    return { toModule: 466, reason: 'Huntington disease chorea and VMAT2 inhibitor therapy belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9377: Preterm newborn surfactant (Beractant) -> Pediatrics (576)
  if (q.id === 9377) {
    return { toModule: 576, reason: 'Exogenous pulmonary surfactant replacement in neonatal RDS belongs to Pediatrics: Respiratory Disorders in Neonates' };
  }

  // ID 9378: Moderate dose prednisone adrenal insufficiency in SLE -> Corticosteroids (254)
  if (q.id === 9378) {
    return { toModule: 254, reason: 'Secondary adrenal insufficiency from chronic daily prednisone belongs to Corticosteroids' };
  }

  // ID 9380: Bromocriptine for prolactinoma galactorrhea -> Hypothalamus and Pituitary (252)
  if (q.id === 9380) {
    return { toModule: 252, reason: 'Bromocriptine D2 dopamine agonism suppressing prolactin secretion belongs to Hypothalamus and Pituitary' };
  }

  // ID 9381: Acromegaly somatostatin analogs (Octreotide) -> Hypothalamus and Pituitary (252)
  if (q.id === 9381) {
    return { toModule: 252, reason: 'Somatostatin analogs (octreotide) for growth hormone-secreting pituitary adenoma belong to Hypothalamus and Pituitary' };
  }

  // ID 9384: Hyperprolactinemia galactorrhea bromocriptine -> Hypothalamus and Pituitary (252)
  if (q.id === 9384) {
    return { toModule: 252, reason: 'Dopamine agonist management of hyperprolactinemia belongs to Hypothalamus and Pituitary' };
  }

  // ID 9387: Carcinoid syndrome flushing and diarrhea / Octreotide -> Hypothalamus and Pituitary (252)
  if (q.id === 9387) {
    return { toModule: 252, reason: 'Octreotide somatostatin receptor agonist for neuroendocrine carcinoid syndrome belongs to Hypothalamus and Pituitary' };
  }

  // ID 9388: Precocious puberty Leuprolide GnRH agonist -> Hypothalamus and Pituitary (252)
  if (q.id === 9388) {
    return { toModule: 252, reason: 'Continuous GnRH agonist therapy (leuprolide) for central precocious puberty belongs to Hypothalamus and Pituitary' };
  }

  // ID 9393: Hypothyroidism TSH titration levothyroxine -> Thyroid (253)
  if (q.id === 9393) {
    return { toModule: 253, reason: 'Levothyroxine dosage titration based on serum TSH belongs to Thyroid and Antithyroid Agents' };
  }

  // ID 9402: Total thyroidectomy Lugol's iodine devascularization -> Thyroid (253)
  if (q.id === 9402) {
    return { toModule: 253, reason: 'Preoperative Lugol\'s iodine to reduce thyroid gland friability and vascularity belongs to Thyroid and Antithyroid Agents' };
  }

  // ID 9404: High dose radioiodine overdose potassium iodide block -> Thyroid (253)
  if (q.id === 9404) {
    return { toModule: 253, reason: 'Potassium iodide competitive inhibition of thyroid radioiodine uptake belongs to Thyroid and Antithyroid Agents' };
  }

  // ID 9414: Myxedema coma hypothermia lethargy -> Thyroid (253)
  if (q.id === 9414) {
    return { toModule: 253, reason: 'Myxedema coma decompensated hypothyroidism emergency pharmacotherapy belongs to Thyroid and Antithyroid Agents' };
  }

  // ID 9416: Omalizumab anti-IgE monoclonal antibody -> Respiratory System (265)
  if (q.id === 9416) {
    return { toModule: 265, reason: 'Omalizumab anti-IgE biologic therapy in severe allergic asthma belongs to Respiratory System' };
  }

  // ID 9417: Dexamethasone highest anti-inflammatory potency -> Corticosteroids (254)
  if (q.id === 9417) {
    return { toModule: 254, reason: 'Comparative anti-inflammatory and glucocorticoid receptor potency belongs to Corticosteroids' };
  }

  // ID 9419: Congenital adrenal hyperplasia 21-hydroxylase deficiency -> Corticosteroids (254)
  if (q.id === 9419) {
    return { toModule: 254, reason: 'Hydrocortisone replacement in 21-hydroxylase deficiency CAH belongs to Corticosteroids' };
  }

  // ID 9422: Acute adrenal insufficiency hydrocortisone -> Corticosteroids (254)
  if (q.id === 9422) {
    return { toModule: 254, reason: 'Parenteral hydrocortisone drug of choice in acute adrenal crisis belongs to Corticosteroids' };
  }

  // ID 9423: Adrenal crisis in advanced tuberculosis -> Corticosteroids (254)
  if (q.id === 9423) {
    return { toModule: 254, reason: 'Acute adrenal insufficiency emergency corticosteroid management belongs to Corticosteroids' };
  }

  // ID 9424: Type 1 & 2 lepra reactions corticosteroids -> Anti-leprosy Drugs (250)
  if (q.id === 9424) {
    return { toModule: 250, reason: 'Systemic corticosteroid and thalidomide management of lepra reactions belongs to Anti-leprosy Drugs' };
  }

  // ID 9436: Local anaesthetics voltage-gated Na channel block -> Anaesthesia (624)
  if (q.id === 9436) {
    return { toModule: 624, reason: 'Primary mechanism of local anaesthetics on voltage-gated sodium channels belongs to Anaesthesia: Local Anaesthetics - General Properties' };
  }

  // ID 9437 & 9444: Nondepolarizing vs depolarizing muscle relaxants -> Anaesthesia (619)
  if (q.id === 9437 || q.id === 9444) {
    return { toModule: 619, reason: 'Depolarizing vs nondepolarizing neuromuscular blocker classifications belong to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 9441: Prodrug vs active drug classification -> Pharmacokinetics (221)
  if (q.id === 9441) {
    return { toModule: 221, reason: 'Hepatic bioactivation and prodrug classification belong to Pharmacokinetics' };
  }

  // ID 9442: Cis-atracurium preferred over atracurium -> Anaesthesia (619)
  if (q.id === 9442) {
    return { toModule: 619, reason: 'Cis-atracurium stereoisomer advantages (less laudanosine and histamine release) belong to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 9445: Paget's disease pamidronate bisphosphonate -> Osteoporosis & Calcium (255)
  if (q.id === 9445) {
    return { toModule: 255, reason: 'Bisphosphonate suppression of osteoclastic bone resorption in Paget disease belongs to Osteoporosis and Calcium Metabolism' };
  }

  // ID 9447: Thiopental contraindicated in acute intermittent porphyria -> Anaesthesia (622)
  if (q.id === 9447) {
    return { toModule: 622, reason: 'Barbiturate induction of ALA synthase and porphyria attacks belong to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol' };
  }

  // ID 9448: Malignant hyperthermia succinylcholine -> Anaesthesia (619)
  if (q.id === 9448) {
    return { toModule: 619, reason: 'Succinylcholine-induced malignant hyperthermia and ryanodine receptor kinetics belong to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 9449: Vitamin D active metabolites nuclear receptor -> Osteoporosis & Calcium (255)
  if (q.id === 9449) {
    return { toModule: 255, reason: '1,25-dihydroxyvitamin D genomic actions on calcium absorption belong to Osteoporosis and Calcium Metabolism' };
  }

  // ID 9450: Cinacalcet secondary hyperparathyroidism ESRD -> Osteoporosis & Calcium (255)
  if (q.id === 255 || q.id === 9450) {
    return { toModule: 255, reason: 'Calcimimetic (cinacalcet) activation of calcium-sensing receptor belongs to Osteoporosis and Calcium Metabolism' };
  }

  // ID 9453: Post-thyroidectomy hypocalcemia cholecalciferol -> Osteoporosis & Calcium (255)
  if (q.id === 9453) {
    return { toModule: 255, reason: 'Post-surgical hypocalcemia management with calcium and active vitamin D belongs to Osteoporosis and Calcium Metabolism' };
  }

  // ID 9454: Deriphylline theophylline etofylline chronotropic -> Respiratory System (265)
  if (q.id === 9454) {
    return { toModule: 265, reason: 'Methylxanthine cardiac and respiratory chronotropic pharmacology belongs to Respiratory System' };
  }

  // ID 9462: Wernicke encephalopathy in chronic alcoholic thiamine -> Biochemistry (124)
  if (q.id === 9462) {
    return { toModule: 124, reason: 'Thiamine pyrophosphate cofactor deficiency in chronic alcoholism belongs to Biochemistry: Vitamins and Minerals' };
  }

  // ID 9463 & 9464: Orlistat gastrointestinal lipase inhibitor steatorrhea -> Anti-Diabetic Drugs - Oral (256) or GI
  if (q.id === 9463 || q.id === 9464) {
    return { toModule: 256, reason: 'Orlistat enteric lipase inhibition and obesity pharmacotherapy belong to Anti-Diabetic Drugs - Oral' };
  }

  // ID 9476: Letrozole, Tamoxifen, Raloxifene molecular targets -> OCPs, Estrogens and Progestins (257)
  if (q.id === 9476) {
    return { toModule: 257, reason: 'SERMs and aromatase inhibitor molecular target classifications belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9477: Mycophenolate mofetil IMPDH inhibitor -> Cell Cycle Specific Cytotoxic Drugs (268)
  if (q.id === 9477) {
    return { toModule: 268, reason: 'Mycophenolate mofetil inhibition of inosine monophosphate dehydrogenase belongs to Cell Cycle Specific Cytotoxic Drugs' };
  }

  // ID 9478: Postmenopausal breast cancer aromatase inhibitor -> OCPs, Estrogens and Progestins (257)
  if (q.id === 9478) {
    return { toModule: 257, reason: 'Aromatase inhibitors for hormone receptor-positive postmenopausal breast cancer belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9494: Thalassemia major iron overload / Deferasirox -> Mixed / Misc (271)
  if (q.id === 9494) {
    return { toModule: 271, reason: 'Oral iron chelator therapy (deferasirox) for transfusional hemosiderosis belongs to Mixed / Miscellaneous Topics' };
  }

  // ID 9522: Amebiasis bloody diarrhea metronidazole -> Anti-Protozoal & Anthelmintic (246)
  if (q.id === 9522) {
    return { toModule: 246, reason: 'Metronidazole tissue amebicide for invasive amebic dysentery belongs to Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // ID 9525: Selective estrogen receptor modulator (SERM) -> OCPs, Estrogens and Progestins (257)
  if (q.id === 9525) {
    return { toModule: 257, reason: 'SERM classification and organ-specific receptor agonist/antagonist profiles belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9527: Contraception advice in young woman -> OCPs, Estrogens and Progestins (257)
  if (q.id === 9527) {
    return { toModule: 257, reason: 'Contraceptive counseling and hormonal contraception selection belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9531: Endometriosis dysmenorrhea progestins / danazol -> OCPs, Estrogens and Progestins (257)
  if (q.id === 9531) {
    return { toModule: 257, reason: 'Hormonal suppression of ectopic endometrial tissue belongs to OCPs, Estrogens and Progestins' };
  }

  // ID 9545: Depolarizing muscle relaxants succinylcholine adverse effects -> Anaesthesia (619)
  if (q.id === 9545) {
    return { toModule: 619, reason: 'Succinylcholine-induced hyperkalemia and ocular pressure elevation belong to Anaesthesia: Depolarising Muscle Relaxants' };
  }

  // ID 9547: Androgenetic alopecia finasteride / minoxidil -> Androgens and ED (258)
  if (q.id === 9547) {
    return { toModule: 258, reason: 'Finasteride 5-alpha reductase inhibition for male pattern androgenetic alopecia belongs to Androgens and Drugs for Erectile Dysfunction' };
  }

  // ID 9557: Benign prostatic hyperplasia difficulty urinating -> Androgens and ED (258)
  if (q.id === 9557) {
    return { toModule: 258, reason: 'Alpha-1 blocker and 5-alpha reductase inhibitor therapy for BPH bladder outlet obstruction belongs to Androgens and Drugs for Erectile Dysfunction' };
  }

  // ID 9564: Focal dystonia botulinum toxin -> Parasympathomimetics (740)
  if (q.id === 9564) {
    return { toModule: 740, reason: 'Botulinum toxin neuromuscular chemodenervation for focal dystonia belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 9565: Tiotropium M2/M3 receptor binding in COPD -> Respiratory System (265)
  if (q.id === 9565) {
    return { toModule: 265, reason: 'Tiotropium kinetically selective M3 muscarinic dissociation in COPD belongs to Respiratory System' };
  }

  // ID 9568: Carpal tunnel syndrome neuropathic pain -> Orthopaedics (665) or Medicine
  if (q.id === 9568) {
    return { toModule: 665, reason: 'Median nerve carpal tunnel syndrome diagnosis and management belong to Orthopaedics: Nerve Injuries and Entrapment Neuropathies' };
  }

  // ID 9569: Niacin flushing mediated by prostaglandins -> Hypolipidemic Drugs (230)
  if (q.id === 9569) {
    return { toModule: 230, reason: 'Niacin prostaglandin-mediated cutaneous flushing and aspirin mitigation belong to Hypolipidemic Drugs' };
  }

  // ID 9572: Transposition of great vessels PGE1 alprostadil -> Pediatrics (584)
  if (q.id === 584 || q.id === 9572) {
    return { toModule: 584, reason: 'Prostaglandin E1 maintenance of ductus arteriosus patency in TGV belongs to Pediatrics: Congenital Heart Diseases' };
  }

  // ID 9573: Drug-induced acute interstitial nephritis -> Diuretics (228) or Medicine (440)
  if (q.id === 9573) {
    return { toModule: 440, reason: 'Drug-induced allergic acute interstitial nephritis belongs to Medicine: Chronic Kidney Disease & Uremia' };
  }

  // ID 9576: Opioids sensory and emotional pain mechanisms -> Opioids (236)
  if (q.id === 9576) {
    return { toModule: 236, reason: 'Opioid modulation of spinal and supraspinal nociceptive pathways belongs to Opioids - Functions and Classification' };
  }

  // ID 9581: Ibuprofen aseptic meningitis -> NSAIDs (260)
  if (q.id === 9581) {
    return { toModule: 260, reason: 'NSAID-induced drug-related aseptic meningitis belongs to NSAIDs' };
  }

  // ID 9585: N-acetylcysteine MOA in paracetamol toxicity -> NSAIDs (260)
  if (q.id === 9585) {
    return { toModule: 260, reason: 'N-acetylcysteine glutathione replenishment in acetaminophen hepatotoxicity belongs to NSAIDs' };
  }

  // ID 9586: Adulterated / Spurious drug legal definition -> FMT (275)
  if (q.id === 9586) {
    return { toModule: 275, reason: 'Substandard / spurious / misbranded drug definitions under the Drugs and Cosmetics Act belong to Forensic Medicine: BNS, BNSS, and BSA' };
  }

  // ID 9591: Aspirin irreversible acetylation of COX-1 -> NSAIDs (260)
  if (q.id === 9591) {
    return { toModule: 260, reason: 'Aspirin irreversible covalent acetylation of cyclooxygenase-1 belongs to NSAIDs' };
  }

  // ID 9592: Aspirin-exacerbated respiratory disease leukotrienes -> NSAIDs (260)
  if (q.id === 9592) {
    return { toModule: 260, reason: 'Aspirin-induced asthma shunting arachidonate down 5-LOX pathway belongs to NSAIDs' };
  }

  // ID 9593: Aspirin overdose in child metabolic acidosis -> NSAIDs (260)
  if (q.id === 9593) {
    return { toModule: 260, reason: 'Acute pediatric salicylate toxicity and mixed acid-base disorder belong to NSAIDs' };
  }

  // ID 9597: Exertional stable angina pectoris nitrates -> Anti-Anginal Drugs (225)
  if (q.id === 9597) {
    return { toModule: 225, reason: 'Exertional angina pectoris anti-ischemic medical management belongs to Anti-Anginal Drugs' };
  }

  // ID 9600: Ketorolac vs aspirin advantages -> NSAIDs (260)
  if (q.id === 9600) {
    return { toModule: 260, reason: 'Injectable ketorolac potent analgesic properties compared to aspirin belong to NSAIDs' };
  }

  // ID 9606: Rheumatoid arthritis methotrexate DMARD -> Anti-rheumatoid (262)
  if (q.id === 9606) {
    return { toModule: 262, reason: 'Symmetric polyarthritis management with disease-modifying antirheumatic drugs belongs to Anti-rheumatoid drugs' };
  }

  // ID 9611: Beta-blocker contraindications and precautions -> Sympathomimetics (223)
  if (q.id === 9611) {
    return { toModule: 223, reason: 'Beta-blocker relative and absolute contraindications belong to Sympathomimetics' };
  }

  // ID 9613: Migraine headache with photophobia -> Anti-migraine (261)
  if (q.id === 9613) {
    return { toModule: 261, reason: 'Acute migraine attack therapy with triptans belongs to Anti-migraine and Antigout drugs' };
  }

  // ID 9621: Colchicine diarrhea in acute gout -> Anti-migraine & Antigout (261)
  if (q.id === 9621) {
    return { toModule: 261, reason: 'Colchicine gastrointestinal toxicity limitations in acute gout belong to Anti-migraine and Antigout drugs' };
  }

  // ID 9622: Oral contraceptive for dysmenorrhea and contraception -> OCPs, Estrogens (257)
  if (q.id === 9622) {
    return { toModule: 257, reason: 'Combined oral contraceptive pills for dysmenorrhea and contraception belong to OCPs, Estrogens and Progestins' };
  }

  // ID 9625: Migraine headaches in child -> Anti-migraine (261)
  if (q.id === 9625) {
    return { toModule: 261, reason: 'Pediatric migraine diagnosis and acute abortive pharmacotherapy belong to Anti-migraine and Antigout drugs' };
  }

  // ID 9626: Allopurinol + Azathioprine / Probenecid drug interaction -> Anti-migraine & Antigout (261)
  if (q.id === 9626) {
    return { toModule: 261, reason: 'Allopurinol xanthine oxidase inhibition and purine interaction belong to Anti-migraine and Antigout drugs' };
  }

  // ID 9628 & 9629: Colchicine inhibiting granulocyte migration / microtubule assembly -> Anti-migraine & Antigout (261)
  if (q.id === 9628 || q.id === 9629) {
    return { toModule: 261, reason: 'Colchicine inhibition of tubulin polymerization in acute gout belongs to Anti-migraine and Antigout drugs' };
  }

  // ID 9630: Ergotamine induced peripheral vasospasm nitroprusside -> Drugs Acting on Uterus (259) or Anti-migraine (261)
  if (q.id === 9630) {
    return { toModule: 261, reason: 'Ergot alkaloid toxicity vasospasm (ergotism) reversal belongs to Anti-migraine and Antigout drugs' };
  }

  // ID 9631: Azathioprine + Allopurinol interaction -> Anti-migraine & Antigout (261)
  if (q.id === 9631) {
    return { toModule: 261, reason: 'Allopurinol xanthine oxidase block precipitating azathioprine/6-MP toxicity belongs to Anti-migraine and Antigout drugs' };
  }

  // ID 9634: Rheumatoid arthritis symmetric joint swelling DMARD -> Anti-rheumatoid (262)
  if (q.id === 9634) {
    return { toModule: 262, reason: 'Methotrexate first-line csDMARD in active rheumatoid arthritis belongs to Anti-rheumatoid drugs' };
  }

  // ID 9635: Active rheumatoid arthritis joint stiffness -> Anti-rheumatoid (262)
  if (q.id === 9635) {
    return { toModule: 262, reason: 'DMARD escalation for active erosive rheumatoid arthritis belongs to Anti-rheumatoid drugs' };
  }

  // ID 9637: Tofacitinib JAK inhibitor in rheumatoid arthritis -> Anti-rheumatoid (262)
  if (q.id === 9637) {
    return { toModule: 262, reason: 'Targeted synthetic DMARDs (JAK inhibitor tofacitinib) in RA belong to Anti-rheumatoid drugs' };
  }

  // ID 9639: DMARDs vs NSAIDs in rheumatoid arthritis -> Anti-rheumatoid (262)
  if (q.id === 9639) {
    return { toModule: 262, reason: 'Disease-modifying antirheumatic drugs classification in RA belongs to Anti-rheumatoid drugs' };
  }

  // ID 9640: Etanercept TNF-alpha blocker DMARD -> Anti-rheumatoid (262)
  if (q.id === 9640) {
    return { toModule: 262, reason: 'Etanercept soluble TNF receptor decoy DMARD belongs to Anti-rheumatoid drugs' };
  }

  // ID 9648: Dual antiplatelet therapy stent clopidogrel -> Antiplatelets (263)
  if (q.id === 9648) {
    return { toModule: 263, reason: 'Dual antiplatelet therapy following coronary stent placement belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics' };
  }

  // ID 9654: Atrial fibrillation stroke prevention anticoagulants -> Anticoagulants (264)
  if (q.id === 9654) {
    return { toModule: 264, reason: 'Oral anticoagulation for thromboembolism prophylaxis in atrial fibrillation belongs to Anticoagulants' };
  }

  // ID 9660: Cilostazol PDE3 inhibitor in peripheral artery disease -> Antiplatelets (263)
  if (q.id === 9660) {
    return { toModule: 263, reason: 'Cilostazol antiplatelet and vasodilatory therapy for intermittent claudication belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics' };
  }

  // ID 9662: Heparin-induced thrombocytopenia Argatroban -> Anticoagulants (264)
  if (q.id === 9662) {
    return { toModule: 264, reason: 'Direct thrombin inhibitor (argatroban) for heparin-induced thrombocytopenia belongs to Anticoagulants' };
  }

  // ID 9672: STEMI alteplase fibrinolytic -> Antiplatelets, Fibrinolytics (263)
  if (q.id === 9672) {
    return { toModule: 263, reason: 'Fibrinolytic therapy for acute ST-elevation myocardial infarction belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics' };
  }

  // ID 9673: Pulmonary embolism heparin monitoring aPTT -> Anticoagulants (264)
  if (q.id === 9673) {
    return { toModule: 264, reason: 'Unfractionated heparin monitoring with aPTT in pulmonary embolism belongs to Anticoagulants' };
  }

  // ID 9678 & 9686: Warfarin-induced skin necrosis -> Anticoagulants (264)
  if (q.id === 9678 || q.id === 9686) {
    return { toModule: 264, reason: 'Warfarin-induced skin necrosis from rapid protein C depletion belongs to Anticoagulants' };
  }

  // ID 9679: Warfarin + Clarithromycin macrolide interaction -> Anticoagulants (264)
  if (q.id === 9679) {
    return { toModule: 264, reason: 'Warfarin CYP3A4 inhibition by macrolides prolonging INR belongs to Anticoagulants' };
  }

  // ID 9693: Asthma first-order kinetics steady-state -> Pharmacokinetics (221)
  if (q.id === 9693) {
    return { toModule: 221, reason: 'First-order elimination kinetics and steady-state attainment belong to Pharmacokinetics' };
  }

  // ID 9694: Formoterol Gs GPCR pathway -> Respiratory System (265)
  if (q.id === 9694) {
    return { toModule: 265, reason: 'Formoterol beta-2 adrenoceptor Gs-protein adenylate cyclase pathway belongs to Respiratory System' };
  }

  // ID 9695: Inhalational beta agonist FEV1 threshold in asthma -> Respiratory System (265)
  if (q.id === 9695) {
    return { toModule: 265, reason: 'Inhaled beta-2 agonist step-up criteria based on FEV1 spirometry belong to Respiratory System' };
  }

  // ID 9699: Antimuscarinics approved in COPD -> Respiratory System (265)
  if (q.id === 9699) {
    return { toModule: 265, reason: 'Long-acting muscarinic antagonists (LAMA) in COPD belong to Respiratory System' };
  }

  // ID 9701: Allergic rhinitis desloratadine -> Respiratory System (265)
  if (q.id === 9701) {
    return { toModule: 265, reason: 'Second-generation non-sedating H1 antihistamines for allergic rhinitis belong to Respiratory System' };
  }

  // ID 9702: Cromolyn and nedocromil mast cell stabilizers -> Respiratory System (265)
  if (q.id === 9702) {
    return { toModule: 265, reason: 'Mast cell stabilizers (cromolyn/nedocromil) in allergic airway disease belong to Respiratory System' };
  }

  // ID 9704: Albuterol inhaler in newly diagnosed asthma -> Respiratory System (265)
  if (q.id === 9704) {
    return { toModule: 265, reason: 'Short-acting beta-2 agonist rescue therapy in asthma belongs to Respiratory System' };
  }

  // ID 9706: Severe persistent asthma ICS + LABA -> Respiratory System (265)
  if (q.id === 9706) {
    return { toModule: 265, reason: 'Inhaled corticosteroid and LABA controller therapy in asthma belongs to Respiratory System' };
  }

  // ID 9707: Montelukast pediatric dosing -> Respiratory System (265)
  if (q.id === 9707) {
    return { toModule: 265, reason: 'Pediatric leukotriene receptor antagonist (montelukast) dosing belongs to Respiratory System' };
  }

  // ID 9708: Acute pulmonary edema dyspnea loop diuretic / heart failure -> Heart Failure Drugs (226)
  if (q.id === 9708) {
    return { toModule: 226, reason: 'Acute decompensated pulmonary edema vasodilators and inotropes belong to Heart Failure Drugs' };
  }

  // ID 9715: Theophylline MOA in bronchial asthma -> Respiratory System (265)
  if (q.id === 9715) {
    return { toModule: 265, reason: 'Theophylline non-selective PDE inhibition and adenosine receptor antagonism belong to Respiratory System' };
  }

  // ID 9716: Theophylline PDE inhibition in COPD -> Respiratory System (265)
  if (q.id === 9716) {
    return { toModule: 265, reason: 'Theophylline bronchodilation mechanism in COPD belongs to Respiratory System' };
  }

  // ID 9717: Tiotropium long-acting bronchodilator in COPD -> Respiratory System (265)
  if (q.id === 9717) {
    return { toModule: 265, reason: 'Tiotropium once-daily LAMA bronchodilator in COPD belongs to Respiratory System' };
  }

  // ID 9718: Zileuton 5-lipoxygenase inhibitor false statement -> Respiratory System (265)
  if (q.id === 9718) {
    return { toModule: 265, reason: 'Zileuton 5-LOX inhibition distinguishing from LTD4 antagonists belongs to Respiratory System' };
  }

  // ID 9719: Theophylline therapeutic plasma range -> Respiratory System (265)
  if (q.id === 9719) {
    return { toModule: 265, reason: 'Therapeutic window monitoring of theophylline (10-20 mg/L) belongs to Respiratory System' };
  }

  // ID 9720: Methylxanthines chronotropic and inotropic effects -> Respiratory System (265)
  if (q.id === 9720) {
    return { toModule: 265, reason: 'Methylxanthine inotropic and bronchodilator pharmacodynamics belong to Respiratory System' };
  }

  // ID 9724: Propofol general anaesthetic mechanism of action -> Anaesthesia (622)
  if (q.id === 9724) {
    return { toModule: 622, reason: 'Propofol GABA-A receptor positive allosteric modulation belongs to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol' };
  }

  // ID 9725: Microcytic anemia iron therapy in pregnancy -> Medicine (433)
  if (q.id === 9725) {
    return { toModule: 433, reason: 'Oral iron supplementation for gestational iron deficiency anemia belongs to Medicine: Iron Deficiency Anemia' };
  }

  // ID 9726: Post-gastrectomy anemia parenteral iron / B12 -> Medicine (433)
  if (q.id === 9726) {
    return { toModule: 433, reason: 'Post-gastrectomy microcytic/macrocytic anemia replacement therapy belongs to Medicine: Iron Deficiency Anemia' };
  }

  // ID 9744: Pregnancy anemia iron / folate -> Medicine (433)
  if (q.id === 9744) {
    return { toModule: 433, reason: 'Gestational microcytic anemia iron therapy belongs to Medicine: Iron Deficiency Anemia' };
  }

  // ID 9760: Peptic ulcer perforation from prednisone + naproxen -> Acid Peptic & IBD (266)
  if (q.id === 9760) {
    return { toModule: 266, reason: 'NSAID-steroid synergism in peptic ulcer disease and PPI prophylaxis belong to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9762: Crohn's disease ileal nonbloody diarrhea budesonide -> Acid Peptic & IBD (266)
  if (q.id === 9762) {
    return { toModule: 266, reason: 'Ileal release budesonide for terminal ileal Crohn disease belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9765: Alcohol pancreatitis / PPI -> Acid Peptic & IBD (266)
  if (q.id === 9765) {
    return { toModule: 266, reason: 'Gastric acid suppression in acute pancreatitis belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9767: Linaclotide guanylate cyclase-C agonist for IBS-C -> Anti-emetics & Motility (267)
  if (q.id === 9767) {
    return { toModule: 267, reason: 'Linaclotide luminal CFTR activation for constipation-predominant IBS belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9768: Sucralfate gastric ulcer coat -> Acid Peptic & IBD (266)
  if (q.id === 9768) {
    return { toModule: 266, reason: 'Sucralfate cytoprotective ulcer barrier polymer belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9772: Crohn's disease RLQ pain 5-ASA / biologics -> Acid Peptic & IBD (266)
  if (q.id === 9772) {
    return { toModule: 266, reason: 'Crohn disease medical management belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9774: Hyperemesis gravidarum morning sickness doxylamine + pyridoxine -> Anti-emetics (267)
  if (q.id === 9774) {
    return { toModule: 267, reason: 'First-line pharmacotherapy for nausea and vomiting of pregnancy belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9775: Misoprostol synthetic PGE1 analogue -> Acid Peptic & IBD (266)
  if (q.id === 9775) {
    return { toModule: 266, reason: 'Misoprostol prostaglandin E1 analog for mucosal cytoprotection belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9776: Paget disease of bone bisphosphonates -> Osteoporosis & Calcium (255)
  if (q.id === 9776) {
    return { toModule: 255, reason: 'Bisphosphonates for Paget disease of bone belong to Osteoporosis and Calcium Metabolism' };
  }

  // ID 9779: Scopolamine patch for motion sickness -> Anti-emetics (267)
  if (q.id === 9779) {
    return { toModule: 267, reason: 'Transdermal scopolamine prophylaxis for motion sickness belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9780: Levodopa adverse effects orthostatic hypotension -> Medicine (466)
  if (q.id === 9780) {
    return { toModule: 466, reason: 'Levodopa adverse drug reactions and titration in Parkinsonism belong to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9782: Apomorphine rescue injection for off-periods in Parkinsonism -> Medicine (466)
  if (q.id === 9782) {
    return { toModule: 466, reason: 'Subcutaneous apomorphine rescue for Parkinsonian off-episodes belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9786 & 9787: Multiple vomiting episodes antiemetic selection -> Anti-emetics (267)
  if (q.id === 9786 || q.id === 9787) {
    return { toModule: 267, reason: 'Antiemetic selection and mechanism in acute emesis belong to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9791: Alosetron 5-HT3 antagonist for severe diarrhea-predominant IBS -> Anti-emetics (267)
  if (q.id === 9791) {
    return { toModule: 267, reason: 'Alosetron 5-HT3 receptor antagonist for IBS with diarrhea belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9792: Acute dystonic torticollis from haloperidol diphenhydramine -> Psychiatry (692)
  if (q.id === 9792) {
    return { toModule: 692, reason: 'Anticholinergic reversal of acute neuroleptic-induced dystonia belongs to Psychiatry: Schizophrenia' };
  }

  // ID 9795: Ulcerative colitis mesalamine 5-ASA -> Acid Peptic & IBD (266)
  if (q.id === 9795) {
    return { toModule: 266, reason: '5-Aminosalicylic acid (mesalamine) maintenance in ulcerative colitis belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9797: Pediatric acute iron supplement poisoning -> Mixed / Misc (271)
  if (q.id === 9797) {
    return { toModule: 271, reason: 'Corrosive toxicity and chelation of acute pediatric iron ingestion belong to Mixed / Miscellaneous Topics' };
  }

  // ID 9798: Gallstone dissolution ursodeoxycholic acid -> Acid Peptic & IBD (266)
  if (q.id === 9798) {
    return { toModule: 266, reason: 'Ursodeoxycholic acid for cholesterol cholelithiasis dissolution belongs to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9801: Hepatic encephalopathy lactulose -> Anti-emetics & Motility (267)
  if (q.id === 9801) {
    return { toModule: 267, reason: 'Lactulose osmotic laxative and ammonia trapping in hepatic encephalopathy belong to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9804: Traveler's diarrhea in India fluoroquinolones -> Sulfonamides, Quinolones (241)
  if (q.id === 9804) {
    return { toModule: 241, reason: 'Fluoroquinolones for acute traveler\'s diarrhea belong to Sulfonamides, Quinolones and Urinary Antiseptics' };
  }

  // ID 9806: Cetirizine allergic rhinitis sleepiness -> Respiratory System (265)
  if (q.id === 9806) {
    return { toModule: 265, reason: 'Second-generation H1 antihistamine properties in allergic rhinitis belong to Respiratory System' };
  }

  // ID 9807: GERD PPIs -> Acid Peptic & IBD (266)
  if (q.id === 9807) {
    return { toModule: 266, reason: 'Proton pump inhibitors for gastroesophageal reflux disease belong to Acid Peptic Disorders and Inflammatory Bowel Disease' };
  }

  // ID 9810: Acute dystonia haloperidol diphenhydramine antidote -> Psychiatry (692)
  if (q.id === 9810) {
    return { toModule: 692, reason: 'Parenteral diphenhydramine/promethazine for acute antipsychotic dystonia belongs to Psychiatry: Schizophrenia' };
  }

  // ID 9811: Seafood urticaria antihistamines -> Dermatology (643)
  if (q.id === 9811) {
    return { toModule: 643, reason: 'Acute food-induced urticaria and H1 antihistamine management belong to Dermatology: Urticaria, Angioedema & Drug Eruptions' };
  }

  // ID 9812, 9813, 9819: Diabetic gastroparesis prokinetics (metoclopramide / erythromycin) -> Anti-emetics & Motility (267)
  if (q.id === 9812 || q.id === 9813 || q.id === 9819) {
    return { toModule: 267, reason: 'Prokinetic therapy for diabetic gastroparesis belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9814: Cisplatin CINV antiemetic -> Anti-emetics (267)
  if (q.id === 9814) {
    return { toModule: 267, reason: 'Chemotherapy-induced nausea and vomiting (CINV) combination antiemetics belong to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9815: Migraine acute treatment on fluoxetine (triptan risk) -> Anti-migraine (261)
  if (q.id === 9815) {
    return { toModule: 261, reason: 'Triptan selection and serotonin syndrome risk in migraineurs on SSRIs belong to Anti-migraine and Antigout drugs' };
  }

  // ID 9820: Parkinsonism off-periods apomorphine + domperidone -> Medicine (466)
  if (q.id === 9820) {
    return { toModule: 466, reason: 'Apomorphine dopamine agonist with domperidone antiemetic for Parkinson off-periods belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9821: Drug-induced Parkinsonism from metoclopramide -> Medicine (466)
  if (q.id === 9821) {
    return { toModule: 466, reason: 'Metoclopramide central D2 blockade precipitating parkinsonism belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders' };
  }

  // ID 9823: Melanosis coli from anthraquinone laxative senna -> Anti-emetics & Motility (267)
  if (q.id === 9823) {
    return { toModule: 267, reason: 'Melanosis coli from chronic stimulant anthraquinone laxatives belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9824, 9826, 9827: Chemotherapy CINV NK1 antagonist aprepitant / acute dystonia -> Anti-emetics (267)
  if (q.id === 9824 || q.id === 9826 || q.id === 9827) {
    return { toModule: 267, reason: 'NK1 receptor antagonists (aprepitant) and antiemetic-induced dystonia belong to Anti-emetics and Drugs Affecting Gastrointestinal Motility' };
  }

  // ID 9831: Glucocorticoid response element (GRE) -> Corticosteroids (254)
  if (q.id === 9831) {
    return { toModule: 254, reason: 'Glucocorticoid response elements in transcriptional regulation belong to Corticosteroids' };
  }

  // ID 9834: Clozapine associated agranulocytosis -> Psychiatry (692)
  if (q.id === 9834) {
    return { toModule: 692, reason: 'Clozapine-induced severe agranulocytosis risk belongs to Psychiatry: Schizophrenia' };
  }

  // ID 9836: Nicotinic cholinergic ligand-gated cation channel -> Parasympathomimetics (740)
  if (q.id === 9836) {
    return { toModule: 740, reason: 'Nicotinic ligand-gated ion channel biophysics belongs to Parasympathomimetics & Cholinergic Agonists' };
  }

  // ID 9838: Trigeminal neuralgia carbamazepine -> Anti-epileptics (233)
  if (q.id === 9838) {
    return { toModule: 233, reason: 'Carbamazepine first-line medical therapy for trigeminal neuralgia belongs to Anti-epileptics I' };
  }

  // ID 9843: Daptomycin myopathy and creatine kinase elevation -> Cephalosporins, Vancomycin and Carbapenems (245)
  if (q.id === 9843) {
    return { toModule: 245, reason: 'Daptomycin-induced rhabdomyolysis and creatine kinase monitoring belong to Cephalosporins, Vancomycin and Carbapenems' };
  }

  // ID 9845: Cyclosporine induced cholestasis BSEP -> Interleukins & Targeted (270)
  if (q.id === 9845) {
    return { toModule: 270, reason: 'Cyclosporine inhibition of bile salt export pump (BSEP) belongs to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9847: Local anesthetics voltage-gated Na channel -> Anaesthesia (624)
  if (q.id === 9847) {
    return { toModule: 624, reason: 'Voltage-gated sodium channel blockade by local anaesthetics belongs to Anaesthesia: Local Anaesthetics - General Properties' };
  }

  // ID 9850: Zileuton 5-lipoxygenase inhibitor -> Respiratory System (265)
  if (q.id === 9850) {
    return { toModule: 265, reason: 'Zileuton 5-lipoxygenase enzyme inhibition belongs to Respiratory System' };
  }

  // ID 9851: Imatinib for GIST and CML -> Interleukins & Targeted (270)
  if (q.id === 9851) {
    return { toModule: 270, reason: 'Imatinib BCR-ABL and c-KIT tyrosine kinase inhibitor for CML and GIST belongs to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9855: Tacrolimus calcineurin inhibitor liver transplant -> Interleukins & Targeted (270)
  if (q.id === 9855) {
    return { toModule: 270, reason: 'Calcineurin inhibitors (tacrolimus) in solid organ transplant immunosuppression belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9856: Renal transplant immunosuppression -> Interleukins & Targeted (270)
  if (q.id === 9856) {
    return { toModule: 270, reason: 'Immunosuppressive regimens following renal transplantation belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9858: Log dose-response curve -> Clinical Trials & Misc (222)
  if (q.id === 9858) {
    return { toModule: 222, reason: 'Dose-response curve interpretation belongs to Clinical Trials and Miscellaneous' };
  }

  // ID 9859: Olaparib PARP inhibitor breast cancer -> Interleukins & Targeted (270)
  if (q.id === 9859) {
    return { toModule: 270, reason: 'PARP inhibitors (olaparib) for BRCA-mutated breast cancer belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9869: Severe plaque psoriasis cyclosporine -> Dermatology (637)
  if (q.id === 937 || q.id === 9869) {
    return { toModule: 637, reason: 'Systemic immunosuppressive therapy for recalcitrant plaque psoriasis belongs to Dermatology: Psoriasis' };
  }

  // ID 9873: Benralizumab anti-IL5 receptor alpha in asthma -> Respiratory System (265)
  if (q.id === 9873) {
    return { toModule: 265, reason: 'Benralizumab monoclonal antibody targeting IL-5 receptor alpha in severe eosinophilic asthma belongs to Respiratory System' };
  }

  // ID 9882: KEYNOTE-189 clinical trial pembrolizumab in NSCLC -> Monoclonal Antibodies (269)
  if (q.id === 9882) {
    return { toModule: 269, reason: 'Pembrolizumab checkpoint inhibitor in KEYNOTE-189 trial belongs to Monoclonal Antibodies' };
  }

  // ID 9886: Lenalidomide in multiple myeloma secondary malignancies -> Interleukins & Targeted (270)
  if (q.id === 9886) {
    return { toModule: 270, reason: 'Immunomodulatory drugs (lenalidomide) in multiple myeloma belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9887: Local anaesthetics CNS toxicity circumoral numbness -> Anaesthesia (624)
  if (q.id === 9887) {
    return { toModule: 624, reason: 'Local anaesthetic systemic central nervous system toxicity sequence belongs to Anaesthesia: Local Anaesthetics - General Properties' };
  }

  // ID 9889 & 9898: Filgrastim / Pegfilgrastim G-CSF in neutropenia -> Targeted Therapies (270)
  if (q.id === 9889 || q.id === 9898 || q.id === 9903) {
    return { toModule: 270, reason: 'Granulocyte colony-stimulating factor (G-CSF / filgrastim) for chemotherapy neutropenia belongs to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9891: Imatinib fluid retention -> Interleukins & Targeted (270)
  if (q.id === 9891) {
    return { toModule: 270, reason: 'Imatinib tyrosine kinase inhibitor fluid retention and periorbital edema belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9894: Thrombopoietin receptor agonists (romiplostim/eltrombopag) in thrombocytopenia -> Interleukins & Targeted (270)
  if (q.id === 9894) {
    return { toModule: 270, reason: 'Thrombopoietin receptor agonists for chemotherapy-induced thrombocytopenia belong to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9895: Inhaled anaesthetics blood-gas solubility -> Anaesthesia (620)
  if (q.id === 9895) {
    return { toModule: 620, reason: 'Blood-gas partition coefficient determining induction speed of inhaled anaesthetics belongs to Anaesthesia: Inhaled Anaesthetics - Properties, N2O and Halothane' };
  }

  // ID 9896: Local anaesthetics neural toxicity -> Anaesthesia (624)
  if (q.id === 9896) {
    return { toModule: 624, reason: 'Neurotoxicity mechanisms of local anaesthetics belong to Anaesthesia: Local Anaesthetics - General Properties' };
  }

  // ID 9897: Coronary blood flow physiology -> Physiology (66)
  if (q.id === 9897) {
    return { toModule: 66, reason: 'Coronary hemodynamics and perfusion pressure relationship belong to Physiology: Cardiovascular Physiology: Coronary Circulation & Hemodynamics' };
  }

  // ID 9901: Dicumarol vitamin K antagonist -> Anticoagulants (264)
  if (q.id === 9901) {
    return { toModule: 264, reason: 'Dicumarol vitamin K epoxide reductase inhibition belongs to Anticoagulants' };
  }

  // ID 9902: COPD maintenance bronchodilators -> Respiratory System (265)
  if (q.id === 9902) {
    return { toModule: 265, reason: 'Long-acting bronchodilator maintenance in COPD belongs to Respiratory System' };
  }

  // ID 9904: Erythropoietin in chronic renal insufficiency -> Interleukins & Targeted (270)
  if (q.id === 9904) {
    return { toModule: 270, reason: 'Recombinant erythropoietin for anemia of chronic kidney disease belongs to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9906: Cyclosporine in liver transplant immunosuppression -> Interleukins & Targeted (270)
  if (q.id === 9906) {
    return { toModule: 270, reason: 'Cyclosporine calcineurin inhibitor maintenance in liver transplantation belongs to Interleukins, Growth Factors and Targeted Therapies' };
  }

  // ID 9908: Dimercaprol contraindicated in iron poisoning -> Mixed / Misc (271)
  if (q.id === 9908) {
    return { toModule: 271, reason: 'Dimercaprol (BAL) contraindication in elemental iron poisoning belongs to Mixed / Miscellaneous Topics' };
  }

  // ID 4060: NSAIDs aspirin COX inhibition sitting in Monoclonal Antibodies (269) -> NSAIDs (260)
  if (q.id === 4060) {
    return { toModule: 260, reason: 'Aspirin cyclooxygenase enzyme inhibition belongs to NSAIDs' };
  }

  // ID 4697: Ciprofloxacin DNA gyrase sitting in Anti-migraine (261) -> Quinolones (241)
  if (q.id === 4697) {
    return { toModule: 241, reason: 'Ciprofloxacin bacterial DNA gyrase (topoisomerase II) inhibition belongs to Sulfonamides, Quinolones and Urinary Antiseptics' };
  }

  // ID 4705: Actinomycin D transcription inhibition sitting in Anti-rheumatoid (262) -> Cytotoxic Drugs (268)
  if (q.id === 4705) {
    return { toModule: 268, reason: 'Actinomycin D intercalating transcription inhibition belongs to Cell Cycle Specific Cytotoxic Drugs' };
  }

  // ID 3153: Antipsychotic metabolic syndrome sitting in Anti-protozoal (246) -> Psychiatry (692)
  if (q.id === 3153) {
    return { toModule: 692, reason: 'Atypical antipsychotic metabolic adverse profile in schizophrenia belongs to Psychiatry: Schizophrenia' };
  }

  // --- NEW VERIFIED AUDIT BATCH (179 moves) ---
  if (q.id === 8425) {
    return { toModule: 740, reason: "Urinary incontinence pharmacotherapy (antimuscarinics, mirabegron) belongs to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8426) {
    return { toModule: 740, reason: "Atropine clinical indications and contraindications belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8429) {
    return { toModule: 260, reason: "Histamine receptor subtypes and post-receptor G-protein mechanisms belong to NSAIDs & Autacoids" };
  }
  if (q.id === 8431) {
    return { toModule: 228, reason: "Acetazolamide carbonic anhydrase inhibitor use belongs to Diuretics" };
  }
  if (q.id === 8441) {
    return { toModule: 238, reason: "Beta-lactam and antimicrobial resistance mechanisms belong to Penicillins / Antimicrobial resistance" };
  }
  if (q.id === 8444) {
    return { toModule: 268, reason: "Cancer chemotherapy match drugs and mechanisms belong to Cell Cycle Specific Cytotoxic Drugs" };
  }
  if (q.id === 8503) {
    return { toModule: 271, reason: "Drug and specific antidote matching belongs to Pharmacology: Mixed / Miscellaneous Topics" };
  }
  if (q.id === 8505) {
    return { toModule: 3, reason: "Neural plate induction embryology belongs to Anatomy: Embryonic Phase of Development" };
  }
  if (q.id === 8506) {
    return { toModule: 234, reason: "Toxic dose and serum monitoring of lithium belong to Anti-manic Drugs" };
  }
  if (q.id === 8507) {
    return { toModule: 263, reason: "Romiplostim thrombopoietin receptor agonist belongs to Antiplatelets, Fibrinolytics and Antifibrinolytics" };
  }
  if (q.id === 8508) {
    return { toModule: 196, reason: "Tetanospasmin mechanism of action belongs to Microbiology: Clostridium and Bacillus" };
  }
  if (q.id === 8509) {
    return { toModule: 205, reason: "Neisseria gonorrhoeae virulence factors (pili) belong to Microbiology: Gram Negative Cocci" };
  }
  if (q.id === 8510) {
    return { toModule: 650, reason: "Tabes dorsalis neurosyphilis belongs to Dermatology: Syphilis" };
  }
  if (q.id === 8511) {
    return { toModule: 335, reason: "Disciform keratitis due to HSV belongs to Ophthalmology: Basics of Cornea and Infectious Keratitis" };
  }
  if (q.id === 8512) {
    return { toModule: 584, reason: "Severe dehydration intravenous fluid management in infant belongs to Pediatrics: Fluid and Electrolyte Disorders" };
  }
  if (q.id === 8513) {
    return { toModule: 135, reason: "Barr body absence in Turner syndrome (45, X0) belongs to Pathology: Chromosomal Disorders and Other Genetic Diseases" };
  }
  if (q.id === 8611) {
    return { toModule: 740, reason: "Cholinomimetic and anticholinergic drugs indications belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8613) {
    return { toModule: 228, reason: "Diuretic agents matching clinical uses belong to Diuretics" };
  }
  if (q.id === 8627) {
    return { toModule: 225, reason: "Nitrate and antianginal drug adverse effects belong to Anti-Anginal Drugs" };
  }
  if (q.id === 8652) {
    return { toModule: 221, reason: "Digoxin therapeutic drug monitoring and dose calculation formula belong to Pharmacokinetics" };
  }
  if (q.id === 8653) {
    return { toModule: 740, reason: "Belladonna alkaloid (atropine) toxicity signs belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8654) {
    return { toModule: 620, reason: "Guedels stages of anaesthesia belong to Anaesthesia: Inhaled Anaesthetics" };
  }
  if (q.id === 8658) {
    return { toModule: 223, reason: "Cardioselective beta-blocker contraindications belong to Sympathomimetics" };
  }
  if (q.id === 8661) {
    return { toModule: 456, reason: "Physiological sinus bradycardia in trained athlete belongs to Medicine: Supraventricular Arrhythmias" };
  }
  if (q.id === 8663) {
    return { toModule: 622, reason: "Propofol hemodynamic and vascular effects belong to Anaesthesia: Intravenous Anaesthesia - Barbiturates, Benzodiazepines & Propofol" };
  }
  if (q.id === 8678) {
    return { toModule: 456, reason: "Atrial flutter saw-tooth baseline and management belong to Medicine: Supraventricular Arrhythmias" };
  }
  if (q.id === 8680) {
    return { toModule: 265, reason: "Methylxanthines positive inotropic/chronotropic effects belong to Respiratory System" };
  }
  if (q.id === 8684) {
    return { toModule: 223, reason: "Beta-blocker hemodynamic and myocardial oxygen consumption effects belong to Sympathomimetics" };
  }
  if (q.id === 8723) {
    return { toModule: 231, reason: "ACE inhibitor-induced angioedema (bradykinin accumulation) belongs to Renin-Angiotensin-Aldosterone System" };
  }
  if (q.id === 8725) {
    return { toModule: 557, reason: "Intravenous hydralazine for severe hypertension in pregnancy belongs to OB & G: Hepatic Disorders and Infections in Pregnancy" };
  }
  if (q.id === 8728) {
    return { toModule: 227, reason: "Verapamil adverse effects (constipation, bradycardia) belong to Antihypertensive Drugs" };
  }
  if (q.id === 8733) {
    return { toModule: 267, reason: "Constipation management from verapamil belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility" };
  }
  if (q.id === 8736) {
    return { toModule: 228, reason: "Mannitol osmotic diuresis for elevated ICP belongs to Diuretics" };
  }
  if (q.id === 8913) {
    return { toModule: 708, reason: "Zaleplon non-benzodiazepine hypnotic for sleep-onset insomnia belongs to Psychiatry: Sleep Disorders" };
  }
  if (q.id === 8920) {
    return { toModule: 608, reason: "Breath-holding spells clinical evaluation and management belong to Pediatrics: Mixed / Miscellaneous Topics" };
  }
  if (q.id === 8922) {
    return { toModule: 708, reason: "Triazolam short-acting benzodiazepine for sleep-onset insomnia belongs to Psychiatry: Sleep Disorders" };
  }
  if (q.id === 8923) {
    return { toModule: 701, reason: "Lorazepam oral benzodiazepine for panic disorder belongs to Psychiatry: Anxiety Disorders" };
  }
  if (q.id === 8975) {
    return { toModule: 236, reason: "Codeine ultra-rapid CYP2D6 metabolism toxicity belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 8980) {
    return { toModule: 236, reason: "Morphine in acute pulmonary edema and myocardial infarction belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 8983) {
    return { toModule: 236, reason: "Morphine contraindication in biliary colic (sphincter of Oddi spasm) belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 8989) {
    return { toModule: 237, reason: "Propoxyphene cardiotoxicity and pharmacology belong to Synthetic Opioids" };
  }
  if (q.id === 8990) {
    return { toModule: 236, reason: "Phenanthrene derivative opioid classification belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 8997) {
    return { toModule: 236, reason: "Opioid antitussives (codeine, dextromethorphan) belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9001) {
    return { toModule: 236, reason: "Endogenous opioid peptides receptor affinities (endorphins, enkephalins, dynorphins) belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9002) {
    return { toModule: 236, reason: "Opioid receptor subtypes match endogenous ligands belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9125) {
    return { toModule: 241, reason: "Chlamydial urethritis treatment (azithromycin, doxycycline) belongs to Sulfonamides, Quinolones and Urinary Antiseptics" };
  }
  if (q.id === 9127) {
    return { toModule: 557, reason: "Pelvic inflammatory disease inpatient empiric therapy belongs to OB & G: Hepatic Disorders and Infections in Pregnancy" };
  }
  if (q.id === 9129) {
    return { toModule: 206, reason: "Chlamydia trachomatis biology and tetracycline therapy belong to Microbiology: Rickettsia, Chlamydia and Mycoplasma" };
  }
  if (q.id === 9131) {
    return { toModule: 428, reason: "Hepatic encephalopathy lactulose and rifaximin therapy belong to Medicine: Acute Liver Failure and Complications of Cirrhosis" };
  }
  if (q.id === 9132) {
    return { toModule: 243, reason: "Antiretroviral agents drug class matching belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9140) {
    return { toModule: 243, reason: "Tenofovir/emtricitabine pre-exposure prophylaxis (PrEP) belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9141) {
    return { toModule: 243, reason: "HBV and HIV nucleoside analogue spectrum belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9145) {
    return { toModule: 243, reason: "Abacavir hypersensitivity and HLA-B*5701 screening belong to Antiretroviral Drugs" };
  }
  if (q.id === 9146) {
    return { toModule: 243, reason: "Lamivudine antiretroviral fixed-dose combinations belong to Antiretroviral Drugs" };
  }
  if (q.id === 9147) {
    return { toModule: 243, reason: "Tenofovir disoproxil fumarate prodrug activation belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9148) {
    return { toModule: 243, reason: "Tenofovir dual activity against HIV and HBV belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9149) {
    return { toModule: 243, reason: "Nevirapine single-dose intrapartum PMTCT belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9150) {
    return { toModule: 243, reason: "Lopinavir/ritonavir CYP3A inhibition boosting belongs to Antiretroviral Drugs" };
  }
  if (q.id === 9294) {
    return { toModule: 260, reason: "Icatibant bradykinin B2 receptor antagonist for hereditary angioedema belongs to NSAIDs & Autacoids" };
  }
  if (q.id === 9301) {
    return { toModule: 248, reason: "Rifampin adult dosage in antitubercular regimen belongs to First Line Drugs for Tuberculosis" };
  }
  if (q.id === 9318) {
    return { toModule: 248, reason: "Isoniazid hepatic cytochrome P450 enzyme effects belong to First Line Drugs for Tuberculosis" };
  }
  if (q.id === 9331) {
    return { toModule: 740, reason: "M3 muscarinic receptor Gq signaling in ciliary muscle belongs to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 9350) {
    return { toModule: 251, reason: "Ganciclovir for CMV prophylaxis in renal transplant belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9352) {
    return { toModule: 251, reason: "Acyclovir/valacyclovir oral regimens for genital HSV belong to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9353) {
    return { toModule: 251, reason: "Acyclovir guanosine derivative for recurrent herpes labialis belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9354) {
    return { toModule: 251, reason: "Acyclovir viral thymidine kinase triple phosphorylation belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9355) {
    return { toModule: 251, reason: "Intravenous acyclovir dosing for neonatal HSV infection belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9356) {
    return { toModule: 251, reason: "Foscarnet for acyclovir-resistant HSV encephalitis belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9359) {
    return { toModule: 251, reason: "Famciclovir penciclovir prodrug mechanism belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9456) {
    return { toModule: 424, reason: "Post-thyroidectomy hypocalcemic tetany belongs to Medicine: Disorders of Parathyroid and Calcium" };
  }
  if (q.id === 9457) {
    return { toModule: 266, reason: "Proton pump inhibitor adverse effect profile belongs to Acid Peptic Disorders and Inflammatory Bowel Disease" };
  }
  if (q.id === 9466) {
    return { toModule: 255, reason: "Bisphosphonate farnesyl pyrophosphate synthase inhibition belongs to Osteoporosis and Calcium Metabolism" };
  }
  if (q.id === 9471) {
    return { toModule: 255, reason: "Raloxifene and hormone replacement therapy for osteoporosis belong to Osteoporosis and Calcium Metabolism" };
  }
  if (q.id === 9474) {
    return { toModule: 255, reason: "Denosumab monoclonal antibody mimicking osteoprotegerin belongs to Osteoporosis and Calcium Metabolism" };
  }
  if (q.id === 9482) {
    return { toModule: 584, reason: "Pediatric diarrheal fluid loss and oral rehydration physiology belong to Pediatrics: Fluid and Electrolyte Disorders" };
  }
  if (q.id === 9506) {
    return { toModule: 256, reason: "Sulfonylurea hypoglycemia risk (glyburide/glipizide) belongs to Anti-Diabetic Drugs - Oral" };
  }
  if (q.id === 9562) {
    return { toModule: 740, reason: "Hemicholinium and vesamicol cholinergic neurochemistry sites belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 9563) {
    return { toModule: 740, reason: "Hemicholinium (choline uptake) and vesamicol (ACh storage) diagram belongs to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 9729) {
    return { toModule: 466, reason: "Quetiapine for Parkinson disease psychosis belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 9736) {
    return { toModule: 266, reason: "Metronidazole disulfiram-like reaction in H. pylori eradication belongs to Acid Peptic Disorders and Inflammatory Bowel Disease" };
  }
  if (q.id === 9737) {
    return { toModule: 253, reason: "Levothyroxine replacement in Hashimoto hypothyroidism belongs to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 9738) {
    return { toModule: 271, reason: "Deferoxamine parenteral iron chelator for acute iron poisoning belongs to Mixed / Miscellaneous Topics" };
  }
  if (q.id === 9740) {
    return { toModule: 221, reason: "Isoniazid acetylation pharmacogenetics and hepatotoxicity belong to Pharmacokinetics" };
  }
  if (q.id === 9741) {
    return { toModule: 740, reason: "Ganglion blocker autonomic symptoms (tachycardia, mydriasis) belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 9747) {
    return { toModule: 466, reason: "Levodopa D2 receptor overstimulation psychosis belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 9749) {
    return { toModule: 465, reason: "Antiepileptic management and folic acid supplementation in pregnancy belong to Medicine: Seizure and Epilepsy" };
  }
  if (q.id === 9755) {
    return { toModule: 466, reason: "Quetiapine management of levodopa-induced visual hallucinations belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 9757) {
    return { toModule: 253, reason: "Levothyroxine drug interactions and dose adjustment belong to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 4575) {
    return { toModule: 268, reason: "Methotrexate folate antagonist mechanism belongs to Cell Cycle Specific Cytotoxic Drugs" };
  }
  if (q.id === 4680) {
    return { toModule: 268, reason: "Microtubule inhibitors (vincristine, paclitaxel) belong to Cell Cycle Specific Cytotoxic Drugs" };
  }
  if (q.id === 4698) {
    return { toModule: 268, reason: "Doxorubicin topoisomerase II inhibition belongs to Cell Cycle Specific Cytotoxic Drugs" };
  }
  if (q.id === 9554) {
    return { toModule: 265, reason: "Inhaled nitric oxide for persistent pulmonary hypertension of newborn belongs to Respiratory System" };
  }
  if (q.id === 8969) {
    return { toModule: 236, reason: "Morphine contraindication in head trauma (elevated ICP from CO2 retention) belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 9073) {
    return { toModule: 236, reason: "Opioid adverse effects (respiratory depression, constipation) belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9079) {
    return { toModule: 236, reason: "Opioid overdose triad and pinpoint pupils belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9182) {
    return { toModule: 206, reason: "Mycoplasma bacterial characteristics belong to Microbiology: Rickettsia, Chlamydia and Mycoplasma" };
  }
  if (q.id === 9309) {
    return { toModule: 248, reason: "Adverse effects of antitubercular therapy (isoniazid, rifampin) belong to First Line Drugs for Tuberculosis" };
  }
  if (q.id === 9696) {
    return { toModule: 623, reason: "Etomidate lack of cardiovascular depression in IV induction belongs to Anaesthesia: Intravenous Anaesthesia - Etomidate, Ketamine" };
  }
  if (q.id === 9703) {
    return { toModule: 620, reason: "Inhaled anaesthetics respiratory depression (halothane, isoflurane) belongs to Anaesthesia: Inhaled Anaesthetics" };
  }
  if (q.id === 9710) {
    return { toModule: 236, reason: "Analgesics and respiratory depression profile belong to Opioids - Functions and Classification" };
  }
  if (q.id === 9713) {
    return { toModule: 266, reason: "Celiac disease and chronic malabsorptive diarrhea management belong to Acid Peptic Disorders and Inflammatory Bowel Disease" };
  }
  if (q.id === 8468) {
    return { toModule: 247, reason: "Itraconazole for blastomycosis belongs to Antifungal Agents" };
  }
  if (q.id === 8495) {
    return { toModule: 716, reason: "ADHD clinical features and complications belong to Psychiatry: Attention-Deficit Disorders" };
  }
  if (q.id === 8603) {
    return { toModule: 466, reason: "Benign essential tremor treatment with propranolol/primidone belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 8666) {
    return { toModule: 740, reason: "Muscarinic receptor stimulation actions belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8700) {
    return { toModule: 244, reason: "Penicillin as drug of choice for acute rheumatic fever prophylaxis belongs to Penicillins" };
  }
  if (q.id === 8803) {
    return { toModule: 230, reason: "Bempedoic acid for hyperlipidemia belongs to Hypolipidemic Drugs" };
  }
  if (q.id === 9014) {
    return { toModule: 717, reason: "Trofinetide approved for Rett syndrome belongs to Psychiatry: Special Areas of Childhood Mental Health" };
  }
  if (q.id === 9049) {
    return { toModule: 643, reason: "Psoriasis treatment adverse effects belong to Dermatology: Psoriasis" };
  }
  if (q.id === 9389) {
    return { toModule: 430, reason: "Esophageal variceal bleeding and portal hypertension belong to Medicine: Portal Hypertension" };
  }
  if (q.id === 9533) {
    return { toModule: 257, reason: "Medical therapy of polycystic ovarian disease (OCPs, spironolactone, clomiphene) belongs to OCPs, Estrogens and Progestins" };
  }
  if (q.id === 9609) {
    return { toModule: 260, reason: "Celecoxib COX-2 selective NSAID in peptic ulcer disease belongs to NSAIDs" };
  }
  if (q.id === 9743) {
    return { toModule: 466, reason: "Amantadine toxicity (livedo reticularis, orthostatic hypotension) belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 9753) {
    return { toModule: 270, reason: "Erythropoietin replacement for anemia in chronic kidney disease belongs to Interleukins, Growth Factors and Targeted Therapies" };
  }
  if (q.id === 9756) {
    return { toModule: 231, reason: "Captopril ACE inhibitor contraindication in pregnancy belongs to Renin-Angiotensin-Aldosterone System" };
  }
  if (q.id === 9759) {
    return { toModule: 261, reason: "Xanthine oxidase inhibition by allopurinol for gout belongs to Anti-migraine and Antigout drugs" };
  }
  if (q.id === 9761) {
    return { toModule: 265, reason: "5-Lipoxygenase and leukotriene biosynthesis belong to Respiratory System" };
  }
  if (q.id === 9771) {
    return { toModule: 245, reason: "Cefoperazone disulfiram-like reaction with alcohol belongs to Cephalosporins, Vancomycin and Carbapenems" };
  }
  if (q.id === 8486) {
    return { toModule: 221, reason: "Enteric coated tablets pharmacokinetics and absorption belong to Pharmacokinetics" };
  }
  if (q.id === 8565) {
    return { toModule: 466, reason: "Trihexyphenidyl for drug-induced parkinsonism belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 8649) {
    return { toModule: 740, reason: "Antimuscarinic atropine overdose toxicity belongs to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 8731) {
    return { toModule: 229, reason: "Amiodarone ceruloderma blue-grey skin discoloration belongs to Anti-Arrhythmic Drugs" };
  }
  if (q.id === 8737) {
    return { toModule: 228, reason: "Acetazolamide carbonic anhydrase inhibitor adverse effects belong to Diuretics" };
  }
  if (q.id === 8924) {
    return { toModule: 235, reason: "Buspirone 5-HT1A partial agonist for generalized anxiety disorder belongs to Antidepressant and Antianxiety Drugs" };
  }
  if (q.id === 9122) {
    return { toModule: 242, reason: "Chloramphenicol bone marrow suppression and aplastic anemia belong to Antimicrobials Acting on 30S Subunit" };
  }
  if (q.id === 9244) {
    return { toModule: 221, reason: "Henderson-Hasselbalch ion trapping effect belongs to Pharmacokinetics" };
  }
  if (q.id === 9338) {
    return { toModule: 249, reason: "Cycloserine neuropsychiatric side effects belong to Second Line Drugs for Tuberculosis" };
  }
  if (q.id === 9361) {
    return { toModule: 251, reason: "Ganciclovir myelosuppression adverse effect belongs to Anti-virals (Non-retroviral)" };
  }
  if (q.id === 9526) {
    return { toModule: 267, reason: "Teduglutide GLP-2 analogue for short bowel syndrome belongs to Anti-emetics and Drugs Affecting Gastrointestinal Motility" };
  }
  if (q.id === 9723) {
    return { toModule: 265, reason: "Cromolyn sodium mast cell stabilizer in asthma belongs to Respiratory System" };
  }
  if (q.id === 9781) {
    return { toModule: 246, reason: "Pyrantel pamoate neuromuscular blocking anthelmintic belongs to Anti-Protozoal Agents and Anthelmintic Drugs" };
  }
  if (q.id === 9783) {
    return { toModule: 740, reason: "Muscarinic agonist ocular and smooth muscle actions belong to Parasympathomimetics & Cholinergic Agonists" };
  }
  if (q.id === 9785) {
    return { toModule: 466, reason: "Antipsychotic-induced acute muscular dystonia management belongs to Medicine: Extrapyramidal Syndromes and Movement Disorders" };
  }
  if (q.id === 9019) {
    return { toModule: 253, reason: "Myxedema coma treatment with intravenous levothyroxine belongs to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 9544) {
    return { toModule: 226, reason: "SGLT2 inhibitors and mortality reduction in heart failure (HFpEF) belong to Heart Failure Drugs" };
  }
  if (q.id === 9663) {
    return { toModule: 264, reason: "Anticoagulation in atrial fibrillation with mitral stenosis belongs to Anticoagulants" };
  }
  if (q.id === 9784) {
    return { toModule: 260, reason: "Capsaicin substance P depletion for post-herpetic neuralgia belongs to NSAIDs" };
  }
  if (q.id === 9839) {
    return { toModule: 268, reason: "Bleomycin pulmonary toxicity aggravated by radiation belongs to Cell Cycle Specific Cytotoxic Drugs" };
  }
  if (q.id === 8448) {
    return { toModule: 221, reason: "Levodopa/carbidopa bioavailability and peripheral decarboxylase inhibition belong to Pharmacokinetics" };
  }
  if (q.id === 8541) {
    return { toModule: 227, reason: "Centrally acting antihypertensives (clonidine, methyldopa) belong to Antihypertensive Drugs" };
  }
  if (q.id === 8791) {
    return { toModule: 229, reason: "Amiodarone-induced hypothyroidism belongs to Anti-Arrhythmic Drugs" };
  }
  if (q.id === 8858) {
    return { toModule: 698, reason: "Bipolar disorder maintenance in pregnancy belongs to Psychiatry: Bipolar and Related Disorders" };
  }
  if (q.id === 8859) {
    return { toModule: 698, reason: "Hypomania and mood stabilizer teratogenicity in pregnancy belong to Psychiatry: Bipolar and Related Disorders" };
  }
  if (q.id === 8875) {
    return { toModule: 235, reason: "Lamotrigine-induced hemophagocytic lymphohistiocytosis (HLH) in depression belongs to Antidepressant and Antianxiety Drugs" };
  }
  if (q.id === 8699) {
    return { toModule: 252, reason: "HCG/GnRH therapy for cryptorchidism belongs to Hypothalamus and Pituitary" };
  }
  if (q.id === 8942) {
    return { toModule: 699, reason: "Delirium tremens alcohol withdrawal management with benzodiazepines belongs to Psychiatry: Alcohol-Related Disorders" };
  }
  if (q.id === 9391) {
    return { toModule: 252, reason: "Laron dwarfism and Mecasermin (IGF-1 analog) belong to Hypothalamus and Pituitary" };
  }
  if (q.id === 8587) {
    return { toModule: 253, reason: "Radioactive iodine ablation and Graves ophthalmopathy belong to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 8819) {
    return { toModule: 227, reason: "Antihypertensive overdose causing reflex tachycardia belongs to Antihypertensive Drugs" };
  }
  if (q.id === 9575) {
    return { toModule: 231, reason: "Captopril ACE inhibitor interaction with indomethacin belongs to Renin-Angiotensin-Aldosterone System" };
  }
  if (q.id === 8818) {
    return { toModule: 253, reason: "Levothyroxine dose increase with estrogen/SERMs belongs to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 9734) {
    return { toModule: 67, reason: "Monosodium glutamate and central glutamate receptors belong to Physiology: Neurotransmitters" };
  }
  if (q.id === 9899) {
    return { toModule: 135, reason: "Fetal hydantoin syndrome teratogenic morphology belongs to Pathology: Chromosomal Disorders and Other Genetic Diseases" };
  }
  if (q.id === 9754) {
    return { toModule: 498, reason: "Mechanical small bowel obstruction diagnosis belongs to Surgery: Small Intestine" };
  }
  if (q.id === 8967) {
    return { toModule: 60, reason: "Gq stimulatory protein in PIP2-phospholipase pathway belongs to Physiology: Cellular Messengers & Receptors" };
  }
  if (q.id === 8970) {
    return { toModule: 221, reason: "Pharmacological cross-tolerance and reverse tolerance definitions belong to Pharmacokinetics" };
  }
  if (q.id === 8977) {
    return { toModule: 271, reason: "Drugs & Cosmetics Rules (India) drug schedules belong to Mixed / Miscellaneous Topics" };
  }
  if (q.id === 8995) {
    return { toModule: 253, reason: "Levothyroxine peripheral conversion of T4 to T3 belongs to Thyroid and Antithyroid Agents" };
  }
  if (q.id === 9816) {
    return { toModule: 236, reason: "Loperamide peripheral mu-opioid agonist for diarrhea belongs to Opioids - Functions and Classification" };
  }
  if (q.id === 9000) {
    return { toModule: 699, reason: "Acute alcohol intoxication clinical signs belong to Psychiatry: Alcohol-Related Disorders" };
  }
  if (q.id === 9008) {
    return { toModule: 252, reason: "GnRH antagonists clinical indications belong to Hypothalamus and Pituitary" };
  }
  if (q.id === 9015) {
    return { toModule: 291, reason: "Strychnine poisoning antidote belongs to Forensic Medicine: Organic Irritants - Plant and Animal Poisons" };
  }
  if (q.id === 8863) {
    return { toModule: 233, reason: "Vigabatrin visual field constriction adverse effect belongs to Anti-epileptics I" };
  }
  if (q.id === 9018) {
    return { toModule: 699, reason: "Disulfiram mechanism in alcohol aversion therapy belongs to Psychiatry: Alcohol-Related Disorders" };
  }
  if (q.id === 9027) {
    return { toModule: 412, reason: "Cyanosis and low oxygen carrying capacity belong to Medicine: Acid-Base Disorders" };
  }
  if (q.id === 9033) {
    return { toModule: 254, reason: "Glucocorticoid replacement in Addison disease belongs to Corticosteroids" };
  }
  if (q.id === 9034) {
    return { toModule: 234, reason: "Lithium chronic adverse effects profile belongs to Anti-manic Drugs" };
  }
  if (q.id === 9035) {
    return { toModule: 692, reason: "Risperidone-induced hyperprolactinemia belongs to Psychiatry: Schizophrenia" };
  }
  if (q.id === 9036) {
    return { toModule: 584, reason: "Pediatric dehydration rehydration fluid protocol belongs to Pediatrics: Fluid and Electrolyte Disorders" };
  }
  if (q.id === 9044) {
    return { toModule: 692, reason: "Olanzapine adverse effect profile in schizophrenia belongs to Psychiatry: Schizophrenia" };
  }
  if (q.id === 9285) {
    return { toModule: 248, reason: "3HP regimen (Isoniazid + Rifapentine) belongs to First Line Drugs for Tuberculosis" };
  }
  if (q.id === 9382) {
    return { toModule: 252, reason: "Octreotide somatostatin analog for growth hormone secreting adenoma belongs to Hypothalamus and Pituitary" };
  }
  if (q.id === 9534) {
    return { toModule: 257, reason: "Tamoxifen endometrial cancer risk (SERM) belongs to OCPs, Estrogens and Progestins" };
  }
  if (q.id === 9535) {
    return { toModule: 257, reason: "Tamoxifen adverse effect profile in breast cancer belongs to OCPs, Estrogens and Progestins" };
  }
  if (q.id === 9711) {
    return { toModule: 265, reason: "Theophylline adenosine antagonism and diuresis in COPD belong to Respiratory System" };
  }
  if (q.id === 9712) {
    return { toModule: 265, reason: "Ipratropium bromide muscarinic antagonist for COPD belongs to Respiratory System" };
  }
  if (q.id === 9842) {
    return { toModule: 244, reason: "Bacterial cell wall peptidoglycan cross-linking and beta-lactam target belong to Penicillins" };
  }
  if (q.id === 9867) {
    return { toModule: 146, reason: "Sickle cell disease disease-modifying therapies belong to Pathology: G6PD Deficiency and Autoimmune Hemolytic Anemias" };
  }
  if (q.id === 8847) {
    return { toModule: 60, reason: "JAK-STAT signaling pathway mechanism belongs to Physiology: Cellular Messengers & Receptors" };
  }

  // ID 1836: CHF furosemide loop diuretic in Mod 228 -> Heart Failure (226) or Diuretics (228) - in 228 is fine.
  // ID 1833: Metformin in type 2 DM in Mod 256 -> stays in 256.
  // ID 2077: Amino acid derived neurotransmitter for depression -> Mod 235 (stays).
  // ID 2137: Ibuprofen inflammation in Mod 260 -> stays in 260.
  // ID 2401: Bupropion in Mod 235 -> stays in 235.
  // ID 2976: Hydrochlorothiazide in Mod 228 -> stays in 228.
  // ID 3114: Lithium-induced nephrogenic DI in Mod 228 -> Diuretics / stays in 228 or 234.
  // ID 4267: DPP-4 inhibitors in Mod 256 -> stays in 256.

  return null;
}

let movedCount = 0;
const moves = [];

qs.forEach(q => {
  const result = evaluateQuestion(q);
  if (result && result.toModule !== q.module_id) {
    movedCount++;
    moves.push({
      id: q.id,
      fromModule: q.module_id,
      toModule: result.toModule,
      reason: result.reason
    });
  }
});

console.log(`Explicit verified moves: ${movedCount}`);

const auditReport = {
  subject: "Pharmacology",
  totalQuestions: qs.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync("tools/audit_pharmacology.json", JSON.stringify(auditReport, null, 2));
console.log("Saved audit report to tools/audit_pharmacology.json");

process.exit(0);