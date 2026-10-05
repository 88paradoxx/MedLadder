const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));
const qMap = {};
questions.forEach(q => { qMap[q.id] = q; });

const movesMap = new Map();

function recordMove(id, toModule, reason) {
  const q = qMap[id];
  if (!q) {
    console.error(`ERROR: Question ID ${id} not found!`);
    return;
  }
  if (q.module_id === toModule) {
    // Already in correct module, no move needed
    return;
  }
  if (!modMap[toModule]) {
    console.error(`ERROR: Target module ${toModule} does not exist in 740 modules!`);
    return;
  }
  movesMap.set(id, {
    id: q.id,
    fromModule: q.module_id,
    toModule: toModule,
    reason: reason
  });
}

// ----------------------------------------------------
// 1. Cross-Subject Moves (Outside Forensic Medicine)
// ----------------------------------------------------
// Microbiology / Parasitology
recordMove(9938, 217, 'Flame cells (solenocytes) are excretory structures of cestodes/trematodes, belonging to Microbiology (Helminthology - Cestodes & Trematodes).');
recordMove(10571, 215, 'Hanging drop motility test for Trichomonas vaginalis belongs to Microbiology (Protozoa).');
recordMove(10673, 218, 'Unsegmented barrel-shaped eggs with bipolar plugs of Trichuris trichiura belong to Microbiology (Helminthology - Nematodes).');
recordMove(10935, 218, 'Rhabditiform larvae identification (Strongyloides stercoralis) belongs to Microbiology (Helminthology - Nematodes).');
recordMove(10936, 218, 'Wuchereria bancrofti life cycle and microfilarial morphology belong to Microbiology (Helminthology - Nematodes).');

// Ophthalmology
recordMove(10938, 335, 'Acanthamoeba causing protozoan contact lens keratitis belongs to Ophthalmology (Basics of Cornea and Infectious Keratitis).');

// General Pathology
recordMove(10915, 175, 'Atherogenicity of oxidized LDL in endothelial injury belongs to Pathology (Atherosclerosis / Vascular Pathology).');
recordMove(10916, 132, 'Lines of Zahn in arterial thrombi belong to Pathology (Disorders of Hemodynamics and Hemostasis).');
recordMove(10917, 129, 'Döhle bodies in neutrophils during systemic infection belong to Pathology (Acute Inflammation).');
recordMove(10918, 129, 'Selectin family cell adhesion molecules in leukocyte rolling belong to Pathology (Acute Inflammation).');
recordMove(10919, 131, 'Integrin-mediated cell-matrix adhesions in wound healing belong to Pathology (Tissue Repair).');
recordMove(10920, 186, 'Glomus tumor of the subungual glomus body belongs to Pathology (Joints and Soft Tissue Tumors).');

// Pharmacology
recordMove(10921, 265, 'Synergy of salmeterol (LABA) with corticosteroids upregulating beta-2 receptors belongs to Pharmacology (Respiratory System).');
recordMove(10922, 260, 'Systemic and local vascular actions of Prostaglandin E2 belong to Pharmacology (NSAIDs / Autacoids).');
recordMove(10667, 258, 'Alprostadil (PGE1) intracavernosal therapy for erectile dysfunction belongs to Pharmacology (Androgens and Drugs for Erectile Dysfunction).');
recordMove(10668, 259, 'Dinoprost (PGF2alpha) uterotonic pharmacology belongs to Pharmacology (Drugs Acting on Uterus).');

// PSM / Community Medicine
recordMove(10024, 363, 'Adult risk groups for Hepatitis B immunization belong to PSM (Principles of Immunization and Vaccination).');
recordMove(10937, 357, 'Levels of prevention (secondary prevention via screening and early treatment) belong to PSM (Concepts of Disease and Prevention).');

// Internal Medicine
recordMove(10939, 451, 'Management of anemia in chronic renal failure with erythropoietin belongs to Medicine (Chronic Kidney Disease).');

// Orthopaedics
recordMove(10940, 680, 'Pharmacotherapy of osteoarthritis belongs to Orthopaedics (Rheumatoid Arthritis and Osteoarthritis).');

// Obstetrics & Gynaecology
recordMove(10941, 541, 'Techniques for delivery of aftercoming head of breech (Burns-Marshall, Mauriceau) belong to OB & G (Abnormal Labour).');
recordMove(10942, 563, 'Levonorgestrel intrauterine device (LNG-IUD) for menorrhagia belongs to OB & G (Contraception and Sterilization).');
recordMove(10943, 563, 'First-line medical management of menorrhagia in reproductive age group belongs to OB & G (Contraception and Sterilization).');
recordMove(10944, 563, 'Drugs used in abnormal uterine bleeding / menorrhagia belong to OB & G (Contraception and Sterilization).');

// Dermatology
recordMove(10945, 656, 'Clinical pathology and features of skin tags (acrochordon) belong to Dermatology (Mixed / Miscellaneous Topics).');

// ----------------------------------------------------
// 2. Intra-Subject Moves within Forensic Medicine
// ----------------------------------------------------

// FROM MODULE 272 (Skeletal and Dental Age Determination)
recordMove(9909, 273, 'Racial skeletal/dental identification (Carabelli cusps in Caucasians vs shovel incisors in Mongoloids) belongs to Race, Sex and Stature Determination (Module 273).');
recordMove(9918, 273, 'Ashley\'s rule of 149 is used for sex determination from the sternum, belonging to Race, Sex and Stature Determination (Module 273).');
recordMove(9930, 273, 'Features distinguishing female skull from male skull belong to Race, Sex and Stature Determination (Module 273).');
recordMove(9931, 273, 'Morphological characteristics of male vs female skull belong to Race, Sex and Stature Determination (Module 273).');
recordMove(9934, 273, 'Photo superimposition of skull and face for personal identification belongs to skeletal identification in Race, Sex and Stature Determination (Module 273).');
recordMove(9935, 273, 'Photo superimposition technique for craniofacial identification belongs to Race, Sex and Stature Determination (Module 273).');
recordMove(9936, 284, 'Barberio\'s test for spermine detection in seminal fluid stains belongs to Sexual Offences and Abortion (Module 284).');
recordMove(9937, 274, 'DNA fingerprinting sample sources for individual identification belong to Fingerprint and Tattoos (Module 274).');
recordMove(9939, 291, 'Morphological identification of Nigella sativa seeds (used in forensic toxicology differentials with Datura) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(9940, 280, 'Precision estimation of burn surface area using Lund and Browder chart belongs to Thermal Injuries (Module 280).');
recordMove(9941, 280, 'Miner\'s cramps (heat cramps caused by salt and water depletion) belong to Thermal Injuries (Module 280).');
recordMove(9942, 273, 'Stature estimation from femur length using multiplication factor belongs to Race, Sex and Stature Determination (Module 273).');
recordMove(9962, 274, 'Cheiloscopy (lip print analysis for identification) belongs to Fingerprint and Tattoos (Module 274).');
recordMove(9965, 273, 'Forensic craniofacial superimposition for identity verification belongs to Race, Sex and Stature Determination (Module 273).');
recordMove(9987, 275, 'Emergency surgical treatment without consent under Section 92 IPC / Section 30 BNS belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10156, 291, 'Neurotoxic snake envenomation leading to respiratory failure belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10240, 276, 'Casper\'s dictum regarding the relative rate of decomposition in air, water, and soil belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10480, 281, 'Forensic identification of firearm make and model from primary barrel markings belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10778, 289, 'Envelope-shaped calcium oxalate dihydrate urinary crystals characteristic of ethylene glycol poisoning belong to Alcohol Poisoning (Module 289).');

// FROM MODULE 273 (Race, Sex and Stature Determination)
recordMove(9948, 274, 'Locard\'s exchange principle, the fundamental cornerstone of trace evidence and contact traces, belongs to Fingerprint and Tattoos (Module 274).');

// FROM MODULE 274 (Fingerprint and Tattoos)
recordMove(1921, 276, 'Post-mortem muscle contracture and stiffness due to ATP depletion (rigor mortis) belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(9983, 275, 'Application of first-hand knowledge rule to common witness in court belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(9986, 275, 'Evidentiary admissibility and first-hand knowledge rule for common witness belong to BNS, BNSS, and BSA (Module 275).');

// FROM MODULE 275 (BNS, BNSS, and BSA)
recordMove(10017, 284, 'Gestational age limits for legal medical termination of pregnancy belong to Sexual Offences and Abortion (Module 284).');
recordMove(10018, 284, 'MTP Amendment Act 2021 upper gestational limits belong to Sexual Offences and Abortion (Module 284).');
recordMove(10019, 284, 'Requirements for opinion of two registered medical practitioners under MTP Act belong to Sexual Offences and Abortion (Module 284).');
recordMove(10020, 279, 'Blow-out fracture of orbital floor due to direct facial impact belongs to Regional Injuries (Module 279).');
recordMove(10023, 291, 'Identification and matching of poisonous Indian snakes (Big Four) belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10030, 280, 'Hypothalamic temperature regulation failure in hypothermia belongs to Thermal Injuries (Module 280).');
recordMove(10033, 285, 'Concealment of birth by secret disposal of dead infant body belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10036, 284, 'Statutory grounds for medical termination of pregnancy belong to Sexual Offences and Abortion (Module 284).');
recordMove(10038, 284, 'Legal definition and exceptions of rape under Section 63 BNS belong to Sexual Offences and Abortion (Module 284).');
recordMove(10078, 284, 'Exhibitionism as a sexual perversion and offense belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10082, 292, 'Legal rules of criminal insanity (Curren\'s, Durham\'s, McNaughten) belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10088, 284, 'Statutory punishment for rape under Section 64 BNS belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10090, 284, 'Medicolegal aspects of necrophilia and sexual perversions belong to Sexual Offences and Abortion (Module 284).');
recordMove(10098, 284, 'Age of criminal responsibility regarding rape capability belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10105, 280, 'Assessment of burn surface area in pediatric patients by Lund-Browder chart belongs to Thermal Injuries (Module 280).');
recordMove(10106, 280, 'Calculation of total body surface area burned in a toddler belongs to Thermal Injuries (Module 280).');
recordMove(10111, 284, 'Penal provisions for exhibitionism under Section 296 BNS belong to Sexual Offences and Abortion (Module 284).');
recordMove(10116, 278, 'Fabricated contusion produced using marking nut juice belongs to Mechanical Injuries (Module 278).');
recordMove(10118, 292, 'Criminal responsibility and legal sanity standards for mentally ill persons belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10119, 292, 'Kleptomania impulse control disorder and criminal responsibility belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10120, 291, 'Running amok syndrome in acute cannabis intoxication belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10131, 284, 'Offense of assault with intent to outrage modesty of a woman belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10132, 284, 'Legal prohibition of disclosing identity of sexual assault victim belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10136, 292, 'Criminal responsibility of persons with mental illness belongs to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10309, 284, 'Statutory provisions for terminating pregnancy under MTP Act belong to Sexual Offences and Abortion (Module 284).');
recordMove(10311, 284, 'Legal age requirements for consenting to MTP belong to Sexual Offences and Abortion (Module 284).');
recordMove(10313, 284, 'Maximum legal gestational age for abortion under amended MTP Act belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10330, 284, 'Consent provisions for MTP in mentally ill females belong to Sexual Offences and Abortion (Module 284).');
recordMove(10331, 292, 'Legal rules of insanity (Curren\'s, Durham\'s, McNaughten) belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10619, 284, 'Declaration of Oslo on therapeutic abortion belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10620, 284, 'Forensic medical management of child victim of sexual assault belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10674, 284, 'Statutory age of consent for sexual intercourse belongs to Sexual Offences and Abortion (Module 284).');

// FROM MODULE 276 (Death and Post-Mortem Changes)
recordMove(10219, 285, 'Sudden infant death syndrome (SIDS) risk factors belong to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10229, 290, 'Phosphorus poisoning (waxy consistency, luminescence, garlic odor) belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10232, 291, 'Immediate emergency management and first aid for snakebite belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10233, 275, 'Legal concepts of mens rea and criminal liability belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10235, 275, 'Declaration of Sydney, Geneva, and modern medical oaths belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10257, 285, 'Raygat\'s test (lung flotation in stillborn vs liveborn infant) belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10260, 285, 'Ploucquet\'s lung weight to body weight test for live birth belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10261, 285, 'Physiological time course of complete water and food deprivation belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10263, 282, 'Positional asphyxia resulting from custodial prone restraint and hog-tying belongs to Mechanical Asphyxia (Module 282).');
recordMove(10270, 283, 'Washerwoman\'s skin maceration from water submersion belongs to Drowning (Module 283).');
recordMove(10282, 288, 'Fatal carbon monoxide toxicity from closed-room wood fire smoke belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10283, 291, 'Clinical triad of opioid overdose (pinpoint pupils, coma, respiratory depression) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10285, 280, 'Arborescent Lichtenberg figures produced by lightning strikes belong to Thermal Injuries (Module 280).');
recordMove(10295, 285, 'Breslau\'s second life test (gastrointestinal floatation in newborn) belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10322, 275, 'Magisterial inquest for suspicious death of married woman within 7 years belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10323, 275, 'Definition and types of legal inquest into unnatural deaths belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10374, 278, 'Differentiation between artificial/fabricated bruise and true contusion belongs to Mechanical Injuries (Module 278).');
recordMove(10376, 278, 'Tramline contusion caused by cylindrical blunt weapon belongs to Mechanical Injuries (Module 278).');
recordMove(10379, 278, 'Diagnostic characteristics of true mechanical bruises belong to Mechanical Injuries (Module 278).');
recordMove(10447, 280, 'Heat stiffening and pugilistic attitude in severe burn deaths belong to Thermal Injuries (Module 280).');
recordMove(10533, 282, 'Mechanical asphyxia due to gagging and ligature suffocation belongs to Mechanical Asphyxia (Module 282).');
recordMove(10553, 282, 'Positional asphyxia mechanism in jack-knife posture belongs to Mechanical Asphyxia (Module 282).');
recordMove(10680, 284, 'Medicolegal protocol for managing minor pregnancy under POCSO belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10695, 285, 'Hydrostatic test of fetal lungs for diagnosing live birth belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(11016, 289, 'Wernicke-Korsakoff syndrome and thiamine deficiency in chronic alcoholism belong to Alcohol Poisoning (Module 289).');
recordMove(11034, 290, 'Black foot disease and peripheral vascular disease from chronic arsenic poisoning belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11048, 291, 'Strychnine poisoning causing reflex spinal convulsions and opisthotonus belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');

// FROM MODULE 277 (Medico Legal Autopsy)
recordMove(2342, 288, 'Carbon monoxide poisoning causing decreased arterial oxygen saturation with normal PaO2 belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(2451, 288, 'Normal arterial oxygen tension in carbon monoxide poisoning despite carboxyhemoglobinemia belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(9916, 272, 'FDI two-digit dental charting system for forensic age and identification belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(9922, 272, 'FDI dental notation system for age estimation and forensic identification belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(9980, 274, 'Detection of invisible and faded tattoos using ultraviolet light belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10071, 284, 'Section 314 IPC criminal liability for causing death during illegal abortion belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10080, 275, 'Certificates and documents admissible in court without cross-examination belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10179, 284, 'Medicolegal aspects of feigned pregnancy and supposititious child belong to Sexual Offences and Abortion (Module 284).');
recordMove(10204, 280, 'Clinical signs and pathophysiology of accidental hypothermia belong to Thermal Injuries (Module 280).');
recordMove(10206, 280, 'Carboxyhemoglobin level as conclusive proof of antemortem burns belongs to Thermal Injuries (Module 280).');
recordMove(10228, 276, 'Post-mortem hypostasis color indicating cause of death belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10269, 276, 'Matching early and late postmortem changes (rigor, livor, adipocere) belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10276, 288, 'Cherry-red postmortem hypostasis in locked room carbon monoxide poisoning belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10305, 275, 'Types of legal inquests (Coroner\'s inquest not practiced in India) belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10306, 275, 'Mandatory magisterial inquest in police custodial death belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10317, 275, 'Statutory indications for magisterial inquest under CrPC/BNSS belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10318, 275, 'Legal jurisdiction for magisterial inquests belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10319, 275, 'Inquest procedure for unnatural death of married woman within 7 years belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10320, 275, 'Authority conducting inquest in custodial death cases belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10321, 275, 'Magisterial inquest protocol in suspected dowry death belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10324, 275, 'Statutory inquest requirements in dowry deaths within 7 years of marriage belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10328, 274, 'Identification of decomposed unidentified body via faded tattoos belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10329, 275, 'Legal doctrine of loco parentis in medical emergency consent belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10332, 292, 'Legal rules and tests for insanity (Curren\'s, Durham\'s, McNaughten) belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10334, 275, 'Police inquest authority in fatal road traffic accidents belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10335, 275, 'Medical ethics, professional secrecy, and privileged communication belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10337, 272, 'Estimation of fetal age using Crown-Rump Length (CRL) belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10340, 292, 'McNaughten rules regarding criminal responsibility of the insane belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10341, 275, 'Rules governing examination of witnesses (cross-examination, examination-in-chief) belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10342, 272, 'Rule of Haase for gestational age estimation from crown-heel length belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10343, 291, 'Epidemiology and toxicology of cannabis as the most abused illicit drug belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10345, 292, 'American Law Institute (ALI) rule for legal insanity defense belongs to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10348, 278, 'Tramline contusion produced by cylindrical blow belongs to Mechanical Injuries (Module 278).');
recordMove(10349, 278, 'Stab wound morphology in relation to Langer\'s cleavage lines belongs to Mechanical Injuries (Module 278).');
recordMove(10351, 274, 'Migration of insoluble tattoo pigments to regional lymph nodes belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10353, 280, 'Absence of sweating (anhidrosis) in heat stroke hyperthermia belongs to Thermal Injuries (Module 280).');
recordMove(10354, 281, 'Souvenir bullet recovered from body of shooting victim belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10359, 284, 'Medicolegal aspects of superfecundation and superfetation belong to Sexual Offences and Abortion (Module 284).');
recordMove(10362, 285, 'Evacuation of meconium as a sign of live birth in neonaticide belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10363, 275, 'Legal doctrine of corpus delicti in homicide investigation belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10364, 275, 'Doctrine of loco parentis regarding medical consent for minors belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10369, 292, 'Testamentary capacity and legal requirements for a sound disposing mind belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10370, 285, 'Depletion of mesenteric and omental fat in fatal starvation belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10448, 280, 'Soot in respiratory tree and carboxyhemoglobinemia in house fire deaths belong to Thermal Injuries (Module 280).');
recordMove(10464, 281, 'Close-range gunshot entry wound inverted margins and tattooing belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10470, 281, 'Singeing of hair indicating flame effect in close-range firearm discharge belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10497, 281, 'Contact gunshot entry wound with muzzle imprint belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10506, 282, 'Cerebral hypoxic-ischemic damage to hippocampus in strangulation belongs to Mechanical Asphyxia (Module 282).');
recordMove(10507, 282, 'Asymmetric facial congestion and open eye in partial hanging belong to Mechanical Asphyxia (Module 282).');
recordMove(10581, 285, 'Hydrostatic test (docimasia pulmonum) for live birth in neonates belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10621, 275, 'Statutory consent requirements for medical examination of minor victims belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10709, 285, 'Internal postmortem findings in prolonged fatal starvation belong to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10957, 290, 'Occupational white phosphorus poisoning with garlic breath and hepatotoxicity belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10966, 291, 'Semecarpus anacardium (marking nut) juice toxicological applications belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11018, 282, 'Café coronary syndrome (acute upper airway obstruction by food bolus) belongs to Mechanical Asphyxia (Module 282).');
recordMove(11041, 290, 'Post-mortem stomach findings and phosphine garlic odor in phosphide poisoning belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11091, 291, 'Active principles (bhilawanol, semecarpol) of Semecarpus anacardium belong to Organic Irritants - Plant and Animal Poisons (Module 291).');

// FROM MODULE 278 (Mechanical Injuries)
recordMove(10408, 281, 'Triad of abrasion collar, grease collar, and punctate entry in firearm wounds belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10409, 281, 'Dirt collar / grease collar from bullet discharge belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10427, 281, 'Rat-hole appearance of close-range shotgun entry wound belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10428, 281, 'Tangential bullet graze wound characteristics belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10434, 281, 'Kennedy phenomenon (surgical alteration of firearm wounds) belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10478, 281, 'Secondary blast injuries from flying shrapnel and fragmentation belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10486, 281, 'Secondary blast injury punctate trauma from bomb debris belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10724, 279, 'Pincer contusions of the lungs due to severe thoracic crush trauma belong to Regional Injuries (Module 279).');

// FROM MODULE 279 (Regional Injuries)
recordMove(10449, 280, 'Extradural heat hematoma produced by skull thermal exposure in conflagration belongs to Thermal Injuries (Module 280).');

// FROM MODULE 281 (Firearm Injuries and Blast Injuries)
recordMove(10450, 280, 'Hold-on effect in alternating current electrical shock injuries belongs to Thermal Injuries (Module 280).');
recordMove(10462, 280, 'Evaluation of inhalational burns and facial burns in house fire victims belongs to Thermal Injuries (Module 280).');
recordMove(10465, 280, 'Estimation of total body surface area burned using Wallace Rule of Nines belongs to Thermal Injuries (Module 280).');
recordMove(10498, 280, 'Rule of Nines percentage calculation for flame burns belongs to Thermal Injuries (Module 280).');
recordMove(10500, 280, 'Rule of Nines surface area assessment for flame burns belongs to Thermal Injuries (Module 280).');
recordMove(10532, 279, 'Hangman\'s fracture (bilateral traumatic spondylolisthesis of axis pedicles) belongs to Regional Injuries (Module 279).');
recordMove(10544, 292, 'Hog-tying as a method of custodial torture and restraint belongs to Mixed / Miscellaneous Topics (Module 292).');
recordMove(10624, 284, 'Anatomy and resistance of deep-seated hymen in child sexual abuse belong to Sexual Offences and Abortion (Module 284).');
recordMove(10625, 284, 'Deeply positioned hymen in pediatric rape victims belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10626, 292, 'Falanga (bastinado / beating on soles of feet) torture technique belongs to Mixed / Miscellaneous Topics (Module 292).');
recordMove(10628, 284, 'Sexual sadism paraphilic disorder belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10696, 285, 'Multiple fractures and bucket-handle lesions in battered baby syndrome belong to Childhood Violence, Infanticide and Starvation (Module 285).');

// FROM MODULE 282 (Mechanical Asphyxia)
recordMove(10561, 281, 'Choking in shotguns (narrowing of distal barrel to regulate pellet dispersion) belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10562, 281, 'Ballistics principle of shotgun muzzle choke belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10569, 286, 'Bagging technique in volatile solvent and inhalant substance abuse belongs to Poisoning: General Considerations (Module 286).');
recordMove(10677, 284, 'Sexual masochism paraphilia belongs to Sexual Offences and Abortion (Module 284).');
recordMove(11097, 291, 'Strychnine-induced extensor spinal spasm (opisthotonus) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');

// FROM MODULE 283 (Drowning)
recordMove(10103, 285, 'Infanticidal neonate drowning and maternal neonaticide belong to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10273, 276, 'Post-mortem hypostasis (livor mortis) vs contusion belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10275, 276, 'Glove-and-stocking postmortem hypostasis in vertical body suspension belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10529, 282, 'Simon\'s hemorrhages (intervertebral disc bleeds) in hanging belong to Mechanical Asphyxia (Module 282).');
recordMove(10576, 281, 'Marshall\'s triad in blast and explosive trauma belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10587, 278, 'Defense wounds sustained during homicide struggle belong to Mechanical Injuries (Module 278).');
recordMove(10592, 285, 'Tests differentiating live birth from stillbirth in infanticide belong to Childhood Violence, Infanticide and Starvation (Module 285).');

// FROM MODULE 284 (Sexual Offences and Abortion)
recordMove(10099, 275, 'Statutory powers of police arrest without warrant in cognizable offences belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10216, 275, 'Test identification parade (TIP) under Section 54A CrPC / BNSS belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10612, 275, 'Principles of law of torts and civil negligence in medical practice belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10630, 275, 'Juvenile Justice Board jurisdiction for offenses committed by minors belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10631, 275, 'Legal definition of juvenile under Juvenile Justice Act belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10683, 275, 'PCPNDT Act 1994 statutory prohibitions and compliance belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10690, 274, 'Teichmann\'s hemin crystal test for forensic bloodstain identification belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10692, 274, 'Precipitin test for determining human vs animal origin of bloodstains belongs to Fingerprint and Tattoos (Module 274).');
recordMove(11020, 290, 'Clinical features and absent symptoms in chronic inorganic plumbism belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');

// FROM MODULE 285 (Childhood Violence, Infanticide and Starvation)
recordMove(10100, 284, 'Statutory penalty for rape under Section 64 BNS belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10102, 284, 'Punishment for rape under Bharatiya Nyaya Sanhita Section 64 belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10703, 275, 'Medicare Service Persons and Medicare Institutions Act protections belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10704, 275, 'Constitutional provisions safeguarding child rights and welfare belong to BNS, BNSS, and BSA (Module 275).');

// FROM MODULE 286 (Poisoning: General Considerations)
// Move to 272 (Skeletal & Dental Age)
recordMove(10820, 272, 'Crown-Rump Length and lower limb measurements for gestational age estimation belong to Skeletal and Dental Age Determination (Module 272).');
recordMove(10821, 272, 'Primary dentition chronometry and earliest tooth eruption belong to Skeletal and Dental Age Determination (Module 272).');
recordMove(10822, 272, 'Chronological fusion of cranial sutures for age estimation belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10825, 272, 'Chronological ossification order of carpal bones (capitate first) belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10826, 272, 'Radiological carpal bone ossification timeline for pediatric age determination belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10827, 272, 'Wrist radiograph analysis for pediatric skeletal age estimation belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10828, 272, 'Last carpal bone to ossify (pisiform) in age determination belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10829, 272, 'Total number of primary deciduous milk teeth belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(10835, 272, 'Haase\'s rule for gestational fetal age determination belongs to Skeletal and Dental Age Determination (Module 272).');

// Move to 273 (Race, Sex and Stature)
recordMove(10816, 273, 'Craniometric and morphological features of Indian male skull belong to Race, Sex and Stature Determination (Module 273).');
recordMove(10817, 273, 'Barr bodies and sex chromatin for cytogenetic sex determination belong to Race, Sex and Stature Determination (Module 273).');
recordMove(10818, 273, 'Pelvic osteological dimorphism for sex determination belongs to Race, Sex and Stature Determination (Module 273).');
recordMove(10819, 273, 'Frontal and parietal bossing in female skull sex determination belong to Race, Sex and Stature Determination (Module 273).');
recordMove(10857, 273, 'Dental anthropology and racial odontological variations belong to Race, Sex and Stature Determination (Module 273).');
recordMove(10869, 273, 'Female cranial characteristics in sex determination belong to Race, Sex and Stature Determination (Module 273).');
recordMove(10899, 273, 'DNA profiling in disputed twin paternity determination belongs to Race, Sex and Stature Determination (Module 273).');

// Move to 274 (Fingerprint, Tattoos and Identification)
recordMove(10814, 274, 'Microscopic hair examination and forensic medullary index belong to Fingerprint and Tattoos (Module 274).');
recordMove(10815, 274, 'Cortex morphology in human hair comparison belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10856, 274, 'Medullary patterns in human vs animal hair trace evidence belong to Fingerprint and Tattoos (Module 274).');
recordMove(10861, 274, 'Phadebas test for amylase detection in forensic saliva stains belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10890, 274, 'Serological precipitin test for verifying human origin of skeletal remains belongs to Fingerprint and Tattoos (Module 274).');
recordMove(10891, 274, 'Benzidine and Kastle-Meyer screening tests for forensic bloodstains belong to Fingerprint and Tattoos (Module 274).');
recordMove(10923, 274, 'Dermatoglyphic minutiae and fingerprint ridge patterns belong to Fingerprint and Tattoos (Module 274).');
recordMove(10933, 274, 'Catalytic blood tests utilizing hydrogen peroxide belong to Fingerprint and Tattoos (Module 274).');

// Move to 275 (BNS, BNSS, BSA / Legal)
recordMove(10811, 275, 'Appellate powers of High Court to enhance sentences belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10812, 275, 'Procedural sequence and rights of re-examination of witnesses belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10813, 275, 'Res gestae doctrine and evidentiary relevance of eyewitnesses belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10858, 275, 'Statutory medical ethics and notification duties in contagious diseases belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10862, 275, 'Legal culpability of impulsive actions under criminal law belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10863, 275, 'Pecuniary jurisdiction of District Consumer Disputes Redressal Forum belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10864, 275, 'Statute of limitations for medical negligence under COPRA belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10865, 275, 'Exemption criteria of public vs private healthcare institutions under COPRA belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10867, 275, 'Distinction between direct and circumstantial evidence in criminal trial belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10894, 275, 'Section 84 IPC / Section 22 BNS criminal defense of mental unsoundness belongs to BNS, BNSS, and BSA (Module 275).');
recordMove(10895, 275, 'Legal boundaries and permissible questioning in cross-examination belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10898, 275, 'Leading questions and their prohibition during examination-in-chief belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10901, 275, 'Mental Healthcare Act voluntary inpatient admission timelines belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10907, 275, 'Hostile witness declaration and procedure under Indian Evidence Act/BSA belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10910, 275, 'Legal definition and penalties for misbranded/substandard drugs under Drugs & Cosmetics Act belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10932, 275, 'Food Safety and Standards Act adulterants in spices belong to BNS, BNSS, and BSA (Module 275).');

// Move to 278 (Mechanical Injuries)
recordMove(10714, 278, 'Classification and morphology of sharp force incised vs lacerated wounds belong to Mechanical Injuries (Module 278).');
recordMove(10715, 278, 'Biomechanical resistance of dermal cartilage and bone to knife penetration belongs to Mechanical Injuries (Module 278).');
recordMove(10716, 278, 'Impact and deceleration injury patterns in motor vehicle occupants belong to Mechanical Injuries (Module 278).');
recordMove(10887, 278, 'Scab color aging and chronometry of healing abrasions belong to Mechanical Injuries (Module 278).');

// Move to 279 (Regional Injuries)
recordMove(10718, 279, 'Pathology and anatomy of extradural hemorrhage from middle meningeal vessels belong to Regional Injuries (Module 279).');
recordMove(10721, 279, 'Cervical spinal cord transection and dens fractures belong to Regional Injuries (Module 279).');
recordMove(10722, 279, 'Cervical spine hyperflexion/extension fractures from falls belong to Regional Injuries (Module 279).');
recordMove(10723, 279, 'Splenic rupture as most commonly injured organ in blunt abdominal trauma belongs to Regional Injuries (Module 279).');
recordMove(10725, 279, 'Anatomical predilection for hypertensive intracerebral hemorrhage (basal ganglia/putamen) belongs to Regional Injuries (Module 279).');
recordMove(10726, 279, 'Putaminal and internal capsule intracranial hematoma predilection belongs to Regional Injuries (Module 279).');

// Move to 280 (Thermal Injuries)
recordMove(10727, 280, 'Diagnostic hypothermia core body temperature threshold belongs to Thermal Injuries (Module 280).');
recordMove(10729, 280, 'Exertional heat stroke and hyperpyrexia in outdoor workers belong to Thermal Injuries (Module 280).');
recordMove(10730, 280, 'Dupuytren / Wilson three-stage classification of burns belongs to Thermal Injuries (Module 280).');
recordMove(10731, 280, 'Systemic sepsis as primary cause of late mortality in severe burns belongs to Thermal Injuries (Module 280).');
recordMove(10732, 280, 'Clinical classification and depth determination of thermal burns belong to Thermal Injuries (Module 280).');
recordMove(10733, 280, 'Curling\'s acute stress ulcer secondary to severe burn shock belongs to Thermal Injuries (Module 280).');
recordMove(10735, 280, 'Arborescent Lichtenberg figures in lightning electrocution belong to Thermal Injuries (Module 280).');
recordMove(10738, 280, 'Pathophysiology and clinical stages of heat stroke belong to Thermal Injuries (Module 280).');
recordMove(10740, 280, 'Vital reaction line of redness distinguishing antemortem from postmortem burns belongs to Thermal Injuries (Module 280).');
recordMove(10900, 280, 'Classic triad of heat stroke (hyperpyrexia, CNS dysfunction, anhidrosis) belongs to Thermal Injuries (Module 280).');
recordMove(10903, 280, 'Differential diagnosis between heat exhaustion and heat hyperpyrexia belongs to Thermal Injuries (Module 280).');
recordMove(10908, 280, 'Rewarming and protocol management of frostbite belong to Thermal Injuries (Module 280).');

// Move to 281 (Firearm Injuries and Blast Injuries)
recordMove(10741, 281, 'Components of shotgun ammunition (crimp, shot, wads, propellant) belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10742, 281, 'Chemical formulation of smokeless nitrocellulose propellant belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10743, 281, 'Unburnt gunpowder grains causing tattooing/peppering around entry wounds belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10745, 281, 'Identification of firearm entry wound by inverted margins and abrasion collar belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10746, 281, 'Expanding, hollow-point, and dum-dum bullets wound ballistics belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10747, 281, 'Close-range soot deposition and blackening around firearm entrance wound belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10748, 281, 'Analytical detection of gunshot residue (dermal nitrate/paraffin test) belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10749, 281, 'Bullet wipe grease and lubricant collar on distant entrance wounds belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10751, 281, 'Components and wads of smoothbore shotgun ammunition belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10755, 281, 'Bullet wipe grease collar deposition at firearm wound of entrance belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10912, 281, 'Pellet dispersion calculation for half-choke shotgun firing range belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10913, 281, 'Pellet spread formula for full-choke shotgun range estimation belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10914, 281, 'Pellet pattern diameter for cylinder-bore (unchoked) shotgun belongs to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10927, 281, 'Ammunition components utilized in smoothbore shotguns belong to Firearm Injuries and Blast Injuries (Module 281).');

// Move to 282 (Mechanical Asphyxia)
recordMove(10756, 282, 'Ligature tension required to occlude jugular veins, carotids, and airway belongs to Mechanical Asphyxia (Module 282).');

// Move to 283 (Drowning)
recordMove(10757, 283, 'Subpleural Paltauf\'s hemorrhages characteristic of wet drowning belong to Drowning (Module 283).');
recordMove(10855, 283, 'Deep gasping reflex above water causing atypical immersion drowning belongs to Drowning (Module 283).');

// Move to 284 (Sexual Offences and Abortion)
recordMove(10833, 284, 'Funnel-shaped anal orifice and effacement of perianal folds in habitual sodomy belong to Sexual Offences and Abortion (Module 284).');
recordMove(10834, 284, 'Lateral buttock traction test for evaluating anal sphincter tone in sodomy belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10842, 284, 'Chemical tests for seminal stains (acid phosphatase, Florence, Barberio) belong to Sexual Offences and Abortion (Module 284).');
recordMove(10843, 284, 'Acid phosphatase enzymatic concentration in human seminal fluid belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10860, 284, 'Time window for detecting motile and non-motile spermatozoa in vaginal swabs belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10904, 284, 'Mandatory requirement of two medical opinions for MTP beyond 20 weeks belongs to Sexual Offences and Abortion (Module 284).');

// Move to 285 (Childhood Violence, Infanticide and Starvation)
recordMove(10836, 285, 'Differentiating cephalohematoma from birth trauma in newborn injuries belongs to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10837, 285, 'Caput succedaneum features in neonatal forensic examination belong to Childhood Violence, Infanticide and Starvation (Module 285).');
recordMove(10859, 285, 'Radiological indicators of physical child abuse and battered child syndrome belong to Childhood Violence, Infanticide and Starvation (Module 285).');

// Move to 287 (Organophosphorus Poisoning)
recordMove(10784, 287, 'Contraindication of oxime cholinesterase reactivators in carbamate poisoning belongs to Organophosphorus Poisoning (Module 287).');
recordMove(11051, 287, 'Toxicology and cholinergic crisis features of organophosphorus poisoning belong to Organophosphorus Poisoning (Module 287).');

// Move to 288 (Corrosives and Asphyxiants)
recordMove(10767, 288, 'Carboxyhemoglobin blood saturation thresholds and toxic symptoms belong to Corrosives and Asphyxiants (Module 288).');
recordMove(10787, 288, 'Lee-Jones Prussian blue test for forensic cyanide detection belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10790, 288, 'Hydrogen sulfide generation in household detergent suicide belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10928, 288, 'First-aid copious water irrigation for corrosive acid splashes belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10973, 288, 'Systemic ochronosis and carboluria in chronic carbolic acid (phenol) toxicity belong to Corrosives and Asphyxiants (Module 288).');

// Move to 289 (Alcohol Poisoning)
recordMove(10785, 289, 'Fomepizole and ethanol competitive antidotes for ethylene glycol toxicity belong to Alcohol Poisoning (Module 289).');
recordMove(10792, 289, 'Ethylene glycol metabolism to calcium oxalate crystals causing acute tubular necrosis belongs to Alcohol Poisoning (Module 289).');
recordMove(10930, 289, 'Nephrotoxicity mediated by calcium oxalate crystallization in ethylene glycol poisoning belongs to Alcohol Poisoning (Module 289).');
recordMove(10972, 289, 'Urinary envelope calcium oxalate crystal microscopy in ethylene glycol toxicity belongs to Alcohol Poisoning (Module 289).');
recordMove(11014, 289, 'Korsakoff\'s amnestic syndrome in chronic alcohol dependency belongs to Alcohol Poisoning (Module 289).');

// Move to 290 (Inorganic Irritants - Metallic and Non-metallic)
recordMove(10775, 290, 'Dimercaprol (BAL) heavy metal chelation in arsenic and mercury toxicity belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10783, 290, 'Barium carbonate rodenticide causing profound hypokalemic flaccid paralysis belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10786, 290, 'Global epidemiology of lead as the most prevalent heavy metal poison belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10794, 290, 'Phossy jaw osteonecrosis in chronic industrial white phosphorus exposure belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10795, 290, 'Cadmium toxicity causing Itai-Itai osteomalacia and renal fanconi syndrome belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10796, 290, 'Barium toxicity triad of cardiac arrhythmias, muscle weakness, and hypokalemia belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10797, 290, 'Burtonian gingival line and basophilic stippling in plumbism belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10953, 290, 'Silver nitrate reduction test on breath for elemental phosphorus toxicity belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10960, 290, 'Blackening of silver nitrate paper by phosphine gas from gastric aspirate belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11025, 290, 'Chronic white phosphorus poisoning with multiple mandibular sinuses (phossy jaw) belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11027, 290, 'Treatment of choice (Dimercaprol/BAL) for acute arsenic poisoning belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11031, 290, 'Lead sulfide deposition causing Burtonian line along gums belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11036, 290, 'Extensor motor neuropathy (wrist drop) characteristic of chronic lead poisoning belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');

// Move to 291 (Organic Irritants - Plant and Animal Poisons)
recordMove(10291, 291, 'Datura fastuosa seed ingestion causing anticholinergic delirium belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10761, 291, 'Bipyridyl herbicide (paraquat) pulmonary fibrogenesis belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10771, 291, 'Chronic cocaine abuse complications (septal perforation, tactile hallucinations) belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10772, 291, 'Anticholinergic toxidrome following Datura consumption belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10773, 291, 'Magnan\'s symptom (cocaine bugs / formication) in cocaine toxicity belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10777, 291, 'Barium / rodenticide vs plant poison hypokalemic paralysis belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10780, 291, 'Strychnos nux-vomica spinal convulsions with consciousness preserved belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10781, 291, 'Opisthotonic spinal hyperextension posture in strychnine poisoning belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10799, 291, 'Identification of Russell\'s viper (Daboia russelii) from venomous morphological markings belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10800, 291, 'Common krait neuroparalytic envenomation with respiratory paralysis belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10801, 291, 'Elapid snakes (Cobra, Krait) producing neurotoxic envenomation belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10802, 291, 'Viperidae envenomation causing consumptive coagulopathy and hemotoxicity belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10803, 291, 'Bilateral ptosis and neuromuscular blockade following elapid snakebite belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10804, 291, 'Initial loading dose of polyvalent anti-snake venom (ASV) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10805, 291, 'Botanical differentiation of Datura seeds from capsicum seeds belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10806, 291, 'Competitive antagonism of inhibitory glycine receptors by strychnine belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10807, 291, 'Opisthotonic posturing in Strychnos nux-vomica spinal poisoning belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10808, 291, 'Conium maculatum (poison hemlock) causing neuromuscular blockade in execution of Socrates belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10810, 291, 'Vasculotoxic and hemotoxic pathophysiology of viper venom belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10878, 291, 'Local necrosis and neurotoxic paralysis in elapid envenomation belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10879, 291, 'Classification of neurotoxic snakes (Elapidae) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10880, 291, 'Clinical emergency protocol for snakebite victim belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10881, 291, 'Immediate hospital management and ASV administration for snake envenomation belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10892, 291, 'Anticholinergic toxidrome (tachycardia, dry flushed skin, mydriasis) from Datura stramonium belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10897, 291, 'Clinical signs of neuromuscular failure in elapid bite belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10906, 291, 'Sympathomimetic features of acute cocaine toxicity belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10929, 291, 'Muttering delirium and plucking at bedclothes in Datura poisoning belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10931, 291, 'Botanical origin of opium from Papaver somniferum capsule exudate belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10946, 291, 'Heroin (diacetylmorphine) as the most commonly abused opioid belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10949, 291, 'Severe opioid toxicity pinpoint pupils and coma belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11002, 291, 'Anticholinergic toxidrome from Datura seeds ingestion belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11056, 291, 'Accidental pediatric ingestion of Datura fruit with anticholinergic syndrome belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11060, 291, 'Abrus precatorius (abrin) toxalbumin resembling viperine hemotoxicity belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11065, 291, 'Reflex spinal convulsions and hyperacusis in strychnine poisoning belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11066, 291, 'Symptomatic control with diazepam in strychnine poisoning belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11068, 291, 'Signs of sympathomimetic cocaine intoxication belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11086, 291, 'Cardiotoxic collapse from herbal aconite / oleander preparation belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');

// Move to 292 (Mixed / Miscellaneous - Psychiatry, Torture, Brain Fingerprinting)
recordMove(10839, 292, 'MERMER (Memory and Evidence Related Rapid Electroencephalographic Response) brain fingerprinting belongs to Mixed / Miscellaneous Topics (Module 292).');
recordMove(10844, 292, 'McNaughten rules regarding criminal defense on grounds of insanity belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10846, 292, 'Medicolegal IQ criteria defining intellectual disability belong to Mixed / Miscellaneous Topics - Forensic Psychiatry (Module 292).');
recordMove(10847, 292, 'Telefono physical torture method targeting tympanic membranes belongs to Mixed / Miscellaneous Topics (Module 292).');
recordMove(10848, 292, 'Methods of electrical torture and physical abuse belong to Mixed / Miscellaneous Topics (Module 292).');
recordMove(10849, 292, 'High-voltage electric shock torture belongs to Mixed / Miscellaneous Topics (Module 292).');

// FROM MODULE 287 (Organophosphorus Poisoning)
recordMove(10266, 290, 'Arsenic preservation in exhumed decomposed bodies and soil belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10289, 290, 'Acute copper sulfate poisoning with acute intravascular hemolysis belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10290, 291, 'Nocturnal krait bite with neuroparalytic ptosis in floor sleeper belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10713, 290, 'Fatal dose of white/yellow elemental phosphorus belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10759, 291, 'Burnt rope odor characteristic of cannabis/marijuana smoke belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10764, 291, 'Characteristic burnt rope odor in cannabis intoxication belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10765, 288, 'Shoe-polish nitrobenzene odor causing methemoglobinemia belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(10768, 291, 'Aconitum napellus (sweet poison) clinical manifestations belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10779, 286, 'Matching specific poisons with general pharmacological antidotes belongs to Poisoning: General Considerations (Module 286).');
recordMove(10789, 288, 'Contents and antidotes of cyanide antidote kit belong to Corrosives and Asphyxiants (Module 288).');
recordMove(10798, 290, 'Elevated urinary delta-aminolevulinic acid and coproporphyrin in chronic plumbism belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10853, 290, 'Arsenic detection in charred human bones and cremation ashes belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10955, 290, 'Phossy jaw osteonecrosis caused by chronic white phosphorus toxicity belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10956, 290, 'Acute hepatic necrosis caused by phosphorus toxicity belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(10977, 291, 'Ophitoxaemia (systemic snake envenomation syndrome) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(10979, 290, 'Acute arsenic trioxide toxicity with cholera-like gastrointestinal purging belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11023, 290, 'Calcium disodium EDTA and dimercaprol for inorganic lead poisoning belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11028, 288, 'Aniline and nitrobenzene toxicity in dye industry workers belongs to Corrosives and Asphyxiants (Module 288).');
recordMove(11033, 290, 'Bluish-green frothy gastric discharge and emesis from copper sulfate ingestion belong to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11039, 290, 'Minamata disease caused by chronic methylmercury consumption belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11057, 291, 'Physostigmine tertiary amine antidote for central Datura poisoning belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11059, 291, 'Pediatric nocturnal scorpion sting / krait bite management belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11100, 288, 'Hyperbaric oxygen therapy for severe carbon monoxide poisoning belongs to Corrosives and Asphyxiants (Module 288).');

// FROM MODULE 288 (Corrosives and Asphyxiants)
recordMove(10976, 276, 'Postmortem caloricity (elevated core temperature after death) belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(10980, 280, 'Crocodile skin burn pattern characteristic of electric current contact belongs to Thermal Injuries (Module 280).');

// FROM MODULE 289 (Alcohol Poisoning)
recordMove(10267, 277, 'Saturated saline solution as the routine chemical preservative for postmortem viscera belongs to Medico Legal Autopsy (Module 277).');
recordMove(10476, 281, 'Molotov cocktail improvised incendiary weapon mechanisms belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10501, 281, 'Forensic identification and ballistics of Molotov cocktails belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(10684, 284, 'Simultaneous detection of choline and spermine in seminal stains belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10686, 284, 'Barberio\'s test producing yellow rhombic spermine picrate crystals belongs to Sexual Offences and Abortion (Module 284).');
recordMove(10981, 292, 'Polygraph lie detection and brain mapping in criminal investigation belong to Mixed / Miscellaneous Topics (Module 292).');
recordMove(11000, 291, 'Opioid overdose pinpoint pupils and reversal with naloxone belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11009, 286, 'Matching specific toxicological antidotes (deferoxamine, NAC, penicillamine) belongs to Poisoning: General Considerations (Module 286).');
recordMove(11012, 291, 'Formication and Magnan\'s tactile hallucinations from cocaine abuse belong to Organic Irritants - Plant and Animal Poisons (Module 291).');

// FROM MODULE 290 (Inorganic Irritants - Metallic and Non-metallic)
recordMove(11042, 281, 'Evidence preservation and packaging of recovered crime scene bullets belong to Firearm Injuries and Blast Injuries (Module 281).');
recordMove(11092, 291, 'Effects of plant alkaloids and poisons (opioids, croton oil, strychnine) belong to Organic Irritants - Plant and Animal Poisons (Module 291).');
recordMove(11095, 291, 'Classification of plant toxins (atropine, colchicine, curare) belongs to Organic Irritants - Plant and Animal Poisons (Module 291).');

// FROM MODULE 291 (Organic Irritants - Plant and Animal Poisons)
recordMove(10046, 275, 'Transplantation of Human Organs Act (THOA) 1994 penal sanctions belong to BNS, BNSS, and BSA (Module 275).');
recordMove(10253, 276, 'Greenish discoloration over right iliac fossa as the earliest sign of putrefaction belongs to Death and Post-Mortem Changes (Module 276).');
recordMove(11044, 284, 'Barberio\'s test as specific for semen rather than blood belongs to Sexual Offences and Abortion (Module 284).');
recordMove(11067, 290, 'Chronic industrial inorganic lead poisoning with anemia and motor deficits belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11079, 290, 'Occupational white phosphorus poisoning producing phossy jaw belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).');
recordMove(11088, 274, 'Precipitin test for determining human species of bloodstains belongs to Fingerprint and Tattoos (Module 274).');

// FROM MODULE 292 (Mixed / Miscellaneous Topics)
recordMove(11101, 272, 'Chronological eruption of mixed dentition for pediatric age determination belongs to Skeletal and Dental Age Determination (Module 272).');
recordMove(11102, 274, 'Absorption-elution method for ABO grouping from dried bloodstains belongs to Fingerprint and Tattoos (Module 274).');

const movesList = Array.from(movesMap.values());
console.log(`Audited total moves compiled: ${movesList.length}`);

const auditReport = {
  subject: 'Forensic Medicine',
  totalQuestions: questions.length,
  flaggedCount: movesList.length,
  moves: movesList
};

fs.writeFileSync('tools/audit_forensic_medicine.json', JSON.stringify(auditReport, null, 2));
console.log('Saved to tools/audit_forensic_medicine.json');
process.exit(0);
