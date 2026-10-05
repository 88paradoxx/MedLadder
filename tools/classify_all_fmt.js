const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => { modMap[m.moduleId] = m; });

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));

function clean(t) {
  if (!t) return '';
  return t.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log(`Loaded ${questions.length} questions.`);

// Let's create an exhaustive classifier
const classificationResults = [];

questions.forEach(q => {
  const qText = clean(q.question_text);
  const qExp = clean(q.explanation);
  const qOpts = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e].filter(Boolean).map(clean).join(' ');
  const combined = (qText + ' ' + qOpts + ' ' + qExp).toLowerCase();
  const currentMod = q.module_id;

  let proposedMod = null;
  let reason = '';

  // 1. NON-FORENSIC CROSS-SUBJECT CHECKS
  if (combined.includes('flame cells are seen in')) {
    proposedMod = 217; // Microbiology: Helminthology - Cestodes & Trematodes
    reason = 'Flame cells (solenocytes) are the excretory structures of cestodes/trematodes (Microbiology: Helminthology).';
  } else if (combined.includes('hanging drop method is used for') && combined.includes('trichomonas')) {
    proposedMod = 215; // Microbiology: Protozoa
    reason = 'Hanging drop examination for Trichomonas vaginalis motility is a clinical parasitology technique (Microbiology).';
  } else if (combined.includes('unsegmented eggs are in which parasite') || combined.includes('trichuris trichura')) {
    proposedMod = 218; // Microbiology: Helminthology - Nematodes
    reason = 'Trichuris trichiura egg morphology belongs to Helminthology (Microbiology).';
  } else if (combined.includes('rhaditiform larvae') || combined.includes('rhabditiform') || combined.includes('wucheria bancrofti') || combined.includes('wuchereria bancrofti')) {
    proposedMod = 218; // Microbiology: Helminthology - Nematodes
    reason = 'Identification of nematode larvae/microfilariae belongs to Helminthology (Microbiology).';
  } else if (combined.includes('protozoan causing keratitis')) {
    proposedMod = 335; // Ophthalmology: Basics of Cornea and Infectious Keratitis
    reason = 'Acanthamoeba keratitis belongs to Ophthalmology (Infectious Keratitis).';
  } else if (combined.includes('lines of zahn occur in')) {
    proposedMod = 132; // Pathology: Disorders of Hemodynamics and Hemostasis
    reason = 'Lines of Zahn in arterial thrombi belong to General Pathology (Hemodynamics and Thrombosis).';
  } else if (combined.includes('dohle bodies') || (combined.includes('selectin') && combined.includes('family of selectin'))) {
    proposedMod = 129; // Pathology: Acute Inflammation
    reason = 'Döhle bodies and selectin cell-adhesion molecules belong to General Pathology (Acute Inflammation).';
  } else if (combined.includes('cell-matrix adhesions are mediated by')) {
    proposedMod = 131; // Pathology: Tissue Repair
    reason = 'Integrin-mediated cell-matrix adhesion belongs to General Pathology (Tissue Repair).';
  } else if (combined.includes('oxidised ldl is more athreogenic') || combined.includes('oxidised ldl')) {
    proposedMod = 175; // Pathology: Atherosclerosis / Cardiovascular
    reason = 'Oxidized LDL in atherogenesis belongs to Vascular Pathology / Atherosclerosis.';
  } else if (combined.includes('glomus tumor is seen in')) {
    proposedMod = 186; // Pathology: Joints and Soft Tissue Tumors
    reason = 'Glomus tumor of the subungual region belongs to Soft Tissue Tumors (Pathology).';
  } else if (combined.includes('efficacy of salmeterol is increased if it is given along with')) {
    proposedMod = 265; // Pharmacology: Respiratory System
    reason = 'Synergy of long-acting beta-2 agonists with inhaled corticosteroids in asthma belongs to Respiratory Pharmacology.';
  } else if (combined.includes('pge2 cause all except') || combined.includes('pge2 causes all except')) {
    proposedMod = 260; // Pharmacology: NSAIDs (Prostaglandins/Autacoids)
    reason = 'Prostaglandin E2 physiological and pharmacological actions belong to Autacoid Pharmacology.';
  } else if (combined.includes('drugs act directly without sexual stimulation') && combined.includes('alprostadil')) {
    proposedMod = 258; // Pharmacology: Androgens and Drugs for Erectile Dysfunction
    reason = 'Mechanism of alprostadil (PGE1) in erectile dysfunction belongs to Pharmacology (Drugs for ED).';
  } else if (combined.includes('dinoprost is') && combined.includes('pg f2 alpha')) {
    proposedMod = 259; // Pharmacology: Drugs Acting on Uterus
    reason = 'Dinoprost (PGF2alpha) uterotonic abortifacient pharmacology belongs to Pharmacology (Drugs Acting on Uterus).';
  } else if (combined.includes('secondary prevention is applicable to')) {
    proposedMod = 357; // PSM: Concepts of Disease and Prevention
    reason = 'Levels of disease prevention (secondary prevention / screening / early diagnosis) belong to PSM (Concepts of Disease and Prevention).';
  } else if (combined.includes('at-risk group adults meriting hepatitis b vaccination in low endemicity')) {
    proposedMod = 363; // PSM: Principles of Immunization and Vaccination
    reason = 'Hepatitis B adult vaccination target groups belong to Community Medicine (Principles of Immunization).';
  } else if (combined.includes('crf with anemia best treatment')) {
    proposedMod = 451; // Medicine: Chronic Kidney Disease
    reason = 'Management of anemia in chronic renal failure with erythropoietin belongs to Internal Medicine (Chronic Kidney Disease).';
  } else if (combined.includes('drug used in osteoarthritis')) {
    proposedMod = 680; // Orthopaedics: Rheumatoid Arthritis and Osteoarthritis
    reason = 'Pharmacological management of osteoarthritis belongs to Orthopaedics (Rheumatoid Arthritis and Osteoarthritis).';
  } else if (combined.includes('after- coming head of breech') || combined.includes('after-coming head of breech')) {
    proposedMod = 541; // OB & G: Abnormal Labour
    reason = 'Delivery of aftercoming head in breech presentation (Burns-Marshall, Mauriceau-Smellie-Veit) belongs to Obstetrics (Abnormal Labour).';
  } else if (combined.includes('preferred iud for menorrhagea') || combined.includes('preferred iud for menorrhagia') || combined.includes('preferred treatment for menorrhagea in reproductive age group') || combined.includes('drug not used commonly for menorrhagea')) {
    proposedMod = 563; // OB & G: Contraception and Sterilization
    reason = 'Medical management of menorrhagia / abnormal uterine bleeding and LNG-IUS belongs to Gynaecology.';
  } else if (combined.includes('not true about skin tag')) {
    proposedMod = 656; // Dermatology: Mixed / Miscellaneous Topics
    reason = 'Skin tags (acrochordon) are benign cutaneous lesions belonging to Dermatology.';
  }

  // 2. FORENSIC MEDICINE INTRA-SUBJECT MISPLACEMENTS
  else {
    // Check specific destinations based on core medical forensic concepts

    // --- Module 281: Firearm Injuries and Blast Injuries ---
    if (currentMod !== 281 && (
      combined.includes('shotgun') ||
      combined.includes('rifled firearm') ||
      combined.includes('gunshot') ||
      combined.includes('bullet wipe') ||
      combined.includes('kennedy phenomenon') ||
      combined.includes('puppe\'s rule') ||
      combined.includes('dirt collar') ||
      combined.includes('grease collar') ||
      combined.includes('tattooing') && combined.includes('entry wound') ||
      combined.includes('peppering') && combined.includes('entry wound') ||
      combined.includes('singeing') && combined.includes('entry wound') ||
      combined.includes('choking') && combined.includes('ballistics') ||
      combined.includes('molotov cocktail') ||
      combined.includes('marshall\'s triad') ||
      combined.includes('marshalls triad') ||
      combined.includes('blast injury') ||
      combined.includes('blast shock waves') ||
      combined.includes('lead snowstorm') ||
      combined.includes('dermal nitrate test') ||
      combined.includes('make and model of a gun') ||
      combined.includes('bullet recovered from the victim') ||
      combined.includes('recovering a bullet from the crime scene') ||
      combined.includes('smokeless gunpowder') ||
      combined.includes('expanding bullets')
    )) {
      proposedMod = 281;
      reason = 'Question evaluates forensic ballistics, firearm wounds, gunpowder residue, or blast injuries, which belongs to Firearm Injuries and Blast Injuries (Module 281).';
    }

    // --- Module 283: Drowning ---
    else if (currentMod !== 283 && (
      (combined.includes('diatom') && (combined.includes('covering') || combined.includes('silica') || combined.includes('drowning'))) ||
      combined.includes('gettler\'s test') ||
      combined.includes('gettler test') ||
      combined.includes('emphysema aquosum') ||
      combined.includes('paltauf\'s haemorrhage') ||
      combined.includes('paltauf\'s hemorrhage') ||
      combined.includes('paltauf haemorrhage') ||
      combined.includes('hydrocution') ||
      combined.includes('immersion syndrome') ||
      combined.includes('saltwater drowning') ||
      combined.includes('freshwater drowning') ||
      combined.includes('secondary drowning') ||
      combined.includes('washerwoman') && (combined.includes('hand') || combined.includes('foot') || combined.includes('feet')) && !combined.includes('infanticide') ||
      combined.includes('deep inspiration above the water level')
    )) {
      proposedMod = 283;
      reason = 'Question evaluates pathophysiological or post-mortem diagnostic signs of drowning (diatoms, Gettler test, emphysema aquosum, Paltauf hemorrhages), belonging to Drowning (Module 283).';
    }

    // --- Module 282: Mechanical Asphyxia ---
    else if (currentMod !== 282 && (
      (combined.includes('hanging') && (combined.includes('ligature') || combined.includes('simon') || combined.includes('facies sympath') || combined.includes('la facies'))) ||
      combined.includes('manual strangulation') ||
      combined.includes('throttling') ||
      combined.includes('ligature mark is horizontal') ||
      combined.includes('cafe coronary') ||
      combined.includes('café coronary') ||
      combined.includes('jack knife position') ||
      combined.includes('jack-knife position') ||
      combined.includes('positional asphyxia') ||
      combined.includes('postural asphyxia') ||
      combined.includes('clogging of the respiratory tract by semi-digested food') ||
      combined.includes('15 kg of tension in the ligature around the neck') ||
      combined.includes('secluded area with his hands tied. postmortem reveals gagging')
    )) {
      proposedMod = 282;
      reason = 'Question evaluates mechanisms, post-mortem findings, or types of mechanical asphyxia (hanging, strangulation, choking/cafe coronary, positional asphyxia), belonging to Mechanical Asphyxia (Module 282).';
    }

    // --- Module 280: Thermal Injuries ---
    else if (currentMod !== 280 && (
      combined.includes('pugilistic attitude') ||
      combined.includes('heat hematoma') ||
      combined.includes('lichtenberg') ||
      combined.includes('filigree burns') ||
      combined.includes('arborescent') ||
      combined.includes('rule of nine') ||
      combined.includes('wallace rule') ||
      combined.includes('lund-browder') ||
      combined.includes('lund and browder') ||
      combined.includes('miner\'s cramps') ||
      combined.includes('heat cramps') ||
      combined.includes('heat stroke') ||
      combined.includes('heat exhaustion') ||
      combined.includes('frostbite') ||
      combined.includes('hypothermia') && (combined.includes('paradoxical undressing') || combined.includes('burrowing') || combined.includes('temperature falls below')) ||
      combined.includes('hold-on effect') ||
      combined.includes('crocodile skin') && combined.includes('electric') ||
      combined.includes('electrical injuries') ||
      combined.includes('curling\'s ulcer') ||
      combined.includes('three-stage classification of burns') ||
      combined.includes('burns in children assessed by') ||
      combined.includes('stove burn') ||
      combined.includes('died in a fire at his house')
    )) {
      proposedMod = 280;
      reason = 'Question evaluates thermal trauma, burns assessment, heat/cold syndromes, or electrical/lightning injury, which belongs to Thermal Injuries (Module 280).';
    }

    // --- Module 285: Childhood Violence, Infanticide and Starvation ---
    else if (currentMod !== 285 && (
      combined.includes('battered baby') ||
      combined.includes('nobbing fracture') ||
      combined.includes('shaken baby') ||
      combined.includes('baby-farmer') ||
      combined.includes('hydrostatic test') ||
      combined.includes('raygat\'s test') ||
      combined.includes('ploucquet\'s test') ||
      combined.includes('breslau\'s second life test') ||
      combined.includes('starvation') && (combined.includes('gall bladder') || combined.includes('hunger') || combined.includes('adipose') || combined.includes('protein') || combined.includes('withheld')) ||
      combined.includes('sudden infant death syndrome') ||
      combined.includes('sids') && combined.includes('infant')
    )) {
      proposedMod = 285;
      reason = 'Question evaluates infanticide live-birth tests (hydrostatic/Breslau/Ploucquet), battered baby syndrome, or starvation, which belongs to Childhood Violence, Infanticide and Starvation (Module 285).';
    }

    // --- Module 284: Sexual Offences and Abortion ---
    else if (currentMod !== 284 && (
      combined.includes('barberio') ||
      combined.includes('florence test') ||
      combined.includes('acid phosphatase activity of human semen') ||
      combined.includes('seminal stain') ||
      combined.includes('sodomy') ||
      combined.includes('tribadism') ||
      combined.includes('buccal coitus') ||
      combined.includes('eonism') ||
      combined.includes('sadism') && combined.includes('sexual') ||
      combined.includes('masochism') ||
      combined.includes('scatologia') ||
      combined.includes('satyriasis') ||
      combined.includes('voyeurism') ||
      combined.includes('exhibitionism') ||
      combined.includes('frotteurism') ||
      combined.includes('necrophilia') ||
      combined.includes('mtp act') ||
      combined.includes('medical termination of pregnancy') ||
      combined.includes('declaration of oslo') ||
      combined.includes('abortion stick') ||
      combined.includes('superfecundation') ||
      combined.includes('superfetation') ||
      combined.includes('funnel-shaped depression') && combined.includes('buttock') ||
      combined.includes('lateral buttock traction test') ||
      combined.includes('virginity') ||
      combined.includes('hymen') && (combined.includes('rupture') || combined.includes('rape')) ||
      combined.includes('alleging her daughter was raped') && combined.includes('vaginal swab')
    )) {
      proposedMod = 284;
      reason = 'Question evaluates forensic examination of sexual offences, semen detection, sexual perversions, or MTP/abortion laws, which belongs to Sexual Offences and Abortion (Module 284).';
    }

    // --- Module 287: Organophosphorus Poisoning ---
    else if (currentMod !== 287 && (
      combined.includes('organophosphorus') ||
      combined.includes('organophosphate') ||
      combined.includes('opc poisoning') ||
      combined.includes('oximes are contraindicated') ||
      combined.includes('pralidoxime') ||
      combined.includes('atropine and pralidoxime') ||
      combined.includes('sludge syndrome') ||
      combined.includes('intermediate syndrome') && combined.includes('poison')
    )) {
      proposedMod = 287;
      reason = 'Question evaluates organophosphorus or carbamate anticholinesterase toxicity and its antidotes, which belongs to Organophosphorus Poisoning (Module 287).';
    }

    // --- Module 288: Corrosives and Asphyxiants ---
    else if (currentMod !== 288 && (
      combined.includes('carbon monoxide') && (combined.includes('poison') || combined.includes('carboxyhemoglobin') || combined.includes('cherry red')) ||
      combined.includes('cyanide') && (combined.includes('poison') || combined.includes('bitter almond') || combined.includes('antidote') || combined.includes('inhibiting')) ||
      combined.includes('lee jones test') ||
      combined.includes('lee-jones') ||
      combined.includes('japanese detergent suicide') ||
      combined.includes('carbolic acid') && combined.includes('ochronosis') ||
      combined.includes('vitriolage') ||
      combined.includes('closed garage with the car engine running') ||
      combined.includes('smoke from a wood fire') && combined.includes('closed room')
    )) {
      proposedMod = 288;
      reason = 'Question evaluates corrosive acid poisoning or toxic asphyxiant gas poisoning (CO, Cyanide, H2S), which belongs to Corrosives and Asphyxiants (Module 288).';
    }

    // --- Module 289: Alcohol Poisoning ---
    else if (currentMod !== 289 && (
      combined.includes('widmark') ||
      combined.includes('methyl alcohol') ||
      combined.includes('methanol') ||
      combined.includes('ethylene glycol') ||
      combined.includes('hooch tragedy') ||
      combined.includes('delirium tremens') ||
      combined.includes('korsakoff') && combined.includes('alcohol') ||
      combined.includes('motor vehicle act') && combined.includes('punishable quantity of alcohol') ||
      combined.includes('blood preserved in during autopsy') && combined.includes('alcohol') ||
      combined.includes('fatal level of ethanol')
    )) {
      proposedMod = 289;
      reason = 'Question evaluates ethyl alcohol, methyl alcohol, or ethylene glycol toxicity, clinical syndromes, and legal limits, which belongs to Alcohol Poisoning (Module 289).';
    }

    // --- Module 290: Inorganic Irritants - Metallic and Non-metallic ---
    else if (currentMod !== 290 && (
      combined.includes('arsenic') ||
      combined.includes('black foot disease') ||
      combined.includes('mees\' lines') ||
      combined.includes('rain-drop pigmentation') ||
      combined.includes('lead poisoning') ||
      combined.includes('plumbism') ||
      combined.includes('burtonian') ||
      combined.includes('brutonian') ||
      combined.includes('mercury') && (combined.includes('poison') || combined.includes('minamata') || combined.includes('erethism') || combined.includes('acrodynia')) ||
      combined.includes('phossy jaw') ||
      combined.includes('yellow phosphorus') ||
      combined.includes('thallium') ||
      combined.includes('cadmium') && (combined.includes('itai') || combined.includes('bony pain')) ||
      combined.includes('barium carbonate') ||
      combined.includes('chelating agent') && combined.includes('heavy metal')
    )) {
      proposedMod = 290;
      reason = 'Question evaluates inorganic metallic (arsenic, lead, mercury, thallium, cadmium) or non-metallic (phosphorus) irritant poisonings, which belongs to Inorganic Irritants - Metallic and Non-metallic (Module 290).';
    }

    // --- Module 291: Organic Irritants - Plant and Animal Poisons ---
    else if (currentMod !== 291 && (
      combined.includes('snake bite') ||
      combined.includes('snakebite') ||
      combined.includes('snake venom') ||
      combined.includes('neurotoxic snake') ||
      combined.includes('viper venom') ||
      combined.includes('anti-snake venom') ||
      combined.includes('asv') && combined.includes('snake') ||
      combined.includes('scorpion') ||
      combined.includes('datura') ||
      combined.includes('dhatura') ||
      combined.includes('atropa belladonna') ||
      combined.includes('cannabis') && !combined.includes('bns') ||
      combined.includes('opium') ||
      combined.includes('strychnos nux vomica') ||
      combined.includes('strychnine') ||
      combined.includes('nux vomica') ||
      combined.includes('aconite') ||
      combined.includes('mitha bish') ||
      combined.includes('oleander') ||
      combined.includes('abrus precatorius') ||
      combined.includes('semecarpus anacardium') ||
      combined.includes('marking nut') ||
      combined.includes('calotropis') ||
      combined.includes('ergot') ||
      combined.includes('st. anthony\'s fire') ||
      combined.includes('cocaine') && (combined.includes('magnan') || combined.includes('formication') || combined.includes('intoxication'))
    )) {
      proposedMod = 291;
      reason = 'Question evaluates plant poisons (Datura, Opium, Strychnine, Oleander, Semecarpus) or animal envenomation (snakebite, scorpion), which belongs to Organic Irritants - Plant and Animal Poisons (Module 291).';
    }

    // --- Module 279: Regional Injuries ---
    else if (currentMod !== 279 && (
      combined.includes('extradural haemorrhage') ||
      combined.includes('extradural hemorrhage') ||
      combined.includes('epidural hematoma') ||
      combined.includes('middle meningeal artery') ||
      combined.includes('subdural haemorrhage') ||
      combined.includes('subdural hematoma') ||
      combined.includes('diffuse axonal injury') ||
      combined.includes('contrecoup') ||
      combined.includes('ring fracture') && combined.includes('skull') ||
      combined.includes('hinge fracture') ||
      combined.includes('motorcyclist\'s fracture') ||
      combined.includes('pond fracture') ||
      combined.includes('splenic rupture') ||
      combined.includes('pincer contusion') ||
      combined.includes('cervical spinal injury') ||
      combined.includes('whiplash injury') ||
      combined.includes('hangman\'s fracture')
    )) {
      proposedMod = 279;
      reason = 'Question evaluates regional trauma (skull fractures, intracranial hemorrhages, diffuse axonal injury, spine/visceral injuries), which belongs to Regional Injuries (Module 279).';
    }

    // --- Module 278: Mechanical Injuries ---
    else if (currentMod !== 278 && (
      combined.includes('artificial bruise') ||
      combined.includes('tramline') ||
      combined.includes('railway-line bruising') ||
      combined.includes('incised wound') ||
      combined.includes('lacerated wound') ||
      combined.includes('laceration') && !combined.includes('shotgun') ||
      combined.includes('abrasion involves which') ||
      combined.includes('defense wound') ||
      combined.includes('hesitation cut') ||
      combined.includes('tissue bridging') ||
      combined.includes('stab wound') && !combined.includes('suicide')
    )) {
      proposedMod = 278;
      reason = 'Question evaluates mechanics and morphological features of blunt and sharp force injuries (abrasions, bruises, lacerations, incised/stab wounds), belonging to Mechanical Injuries (Module 278).';
    }

    // --- Module 272: Skeletal and Dental Age Determination ---
    else if (currentMod !== 272 && (
      combined.includes('gustafson') ||
      combined.includes('carpal bone') && (combined.includes('ossify') || combined.includes('ossification') || combined.includes('analysis of carpal')) ||
      combined.includes('ossification centre') ||
      combined.includes('ossification center') ||
      combined.includes('earliest tooth to erupt') ||
      combined.includes('mixed dentition') ||
      combined.includes('deciduous teeth') ||
      combined.includes('milk teeth') ||
      combined.includes('palmer system') ||
      combined.includes('dental numbering') ||
      combined.includes('dental formula') ||
      combined.includes('crown rump length') && combined.includes('gestational age') ||
      combined.includes('crown-heel length') && combined.includes('fetal age') ||
      combined.includes('haase\'s rule') ||
      combined.includes('sutures with their correct age of beginning of fusion')
    )) {
      proposedMod = 272;
      reason = 'Question evaluates age determination from skeletal development, ossification centers, or dentition, which belongs to Skeletal and Dental Age Determination (Module 272).';
    }

    // --- Module 273: Race, Sex and Stature Determination ---
    else if (currentMod !== 273 && (
      (combined.includes('determine the sex') || combined.includes('sex determination')) && (combined.includes('skeleton') || combined.includes('pelvis') || combined.includes('skull') || combined.includes('bone')) ||
      combined.includes('male skull as compared to female skull') ||
      combined.includes('features of female skull') ||
      combined.includes('preauricular sulcus') ||
      combined.includes('ashley\'s rule') ||
      combined.includes('ischiopubic index') ||
      combined.includes('cephalic index') ||
      combined.includes('caucasian') && combined.includes('carabelli') ||
      combined.includes('shovel shaped incisors') ||
      combined.includes('pearson\'s formula') ||
      combined.includes('stature') && (combined.includes('femur') || combined.includes('trotter')) ||
      combined.includes('sex chromatin')
    )) {
      proposedMod = 273;
      reason = 'Question evaluates sex determination, racial skeletal characteristics, or stature estimation from bones, belonging to Race, Sex and Stature Determination (Module 273).';
    }

    // --- Module 274: Fingerprint and Tattoos ---
    else if (currentMod !== 274 && (
      combined.includes('dactylography') ||
      combined.includes('fingerprint') && !combined.includes('dna') ||
      combined.includes('poroscopy') ||
      combined.includes('cheiloscopy') ||
      combined.includes('tattoo') && (combined.includes('faded') || combined.includes('pigment') || combined.includes('invisible') || combined.includes('colours'))
    )) {
      proposedMod = 274;
      reason = 'Question evaluates personal identification via dactylography, poroscopy, cheiloscopy, or tattoos, belonging to Fingerprint and Tattoos (Module 274).';
    }

    // --- Module 275: BNS, BNSS, and BSA (Legal procedure, courts, inquests, ethics) ---
    else if (currentMod !== 275 && (
      combined.includes('inquest') ||
      combined.includes('subpoena') ||
      combined.includes('leading question') ||
      combined.includes('perjury') ||
      combined.includes('dying declaration') ||
      combined.includes('mens rea') ||
      combined.includes('res ipsa loquitur') ||
      combined.includes('professional misconduct') ||
      combined.includes('infamous conduct') ||
      combined.includes('medical negligence') ||
      combined.includes('state medical council') ||
      combined.includes('consumer court') ||
      combined.includes('copra') ||
      combined.includes('first-hand knowledge rule') ||
      combined.includes('corpus delicti') ||
      combined.includes('loco parentis') ||
      combined.includes('cross-examination') && combined.includes('witness')
    )) {
      proposedMod = 275;
      reason = 'Question evaluates Indian legal procedure, court witnesses, inquests, medical negligence, consent, or medical jurisprudence acts, belonging to BNS, BNSS, and BSA (Module 275).';
    }

    // --- Module 276: Death and Post-Mortem Changes ---
    else if (currentMod !== 276 && (
      combined.includes('algor mortis') ||
      combined.includes('livor mortis') ||
      combined.includes('hypostasis') ||
      combined.includes('postmortem lividity') ||
      combined.includes('post-mortem staining') ||
      combined.includes('postmortem staining') ||
      combined.includes('rigor mortis') ||
      combined.includes('nysten\'s rule') ||
      combined.includes('cadaveric spasm') && !combined.includes('drowning') ||
      combined.includes('putrefaction') ||
      combined.includes('postmortem caloricity') ||
      combined.includes('mummification') ||
      combined.includes('adipocere') ||
      combined.includes('casper dictum') ||
      combined.includes('casper\'s dictum') ||
      combined.includes('foamy liver')
    )) {
      proposedMod = 276;
      reason = 'Question evaluates post-mortem interval, cooling, hypostasis, rigor mortis, or decomposition changes, belonging to Death and Post-Mortem Changes (Module 276).';
    }

    // --- Module 277: Medico Legal Autopsy ---
    else if (currentMod !== 277 && (
      combined.includes('autopsy technique') ||
      combined.includes('letulle') ||
      combined.includes('virchow') && combined.includes('autopsy') ||
      combined.includes('rokitansky') ||
      combined.includes('en masse removal of organs') ||
      combined.includes('en bloc removal') ||
      combined.includes('autopsy incision') ||
      combined.includes('preservative used for viscera to be sent for chemical analysis') ||
      combined.includes('saturated saline') && combined.includes('viscera')
    )) {
      proposedMod = 277;
      reason = 'Question evaluates medico-legal autopsy evisceration techniques or viscera preservation protocols, belonging to Medico Legal Autopsy (Module 277).';
    }

    // --- Module 292: Mixed / Miscellaneous Topics (Psychiatry, Narco, Torture) ---
    else if (currentMod !== 292 && (
      combined.includes('mcnaughten') ||
      combined.includes('mcnaughton') ||
      combined.includes('durham\'s rule') ||
      combined.includes('curren\'s rule') ||
      combined.includes('testamentary capacity') ||
      combined.includes('falanga') ||
      combined.includes('telefono') ||
      combined.includes('electrical torture') ||
      combined.includes('narcoanalysis') ||
      combined.includes('polygraph') ||
      combined.includes('brain fingerprinting') ||
      combined.includes('mermer')
    )) {
      proposedMod = 292;
      reason = 'Question evaluates forensic psychiatry (legal insanity defense, testamentary capacity) or specialized forensic techniques/torture methods, belonging to Mixed / Miscellaneous Topics (Module 292).';
    }
  }

  if (proposedMod && proposedMod !== currentMod) {
    classificationResults.push({
      id: q.id,
      fromModule: currentMod,
      toModule: proposedMod,
      reason: reason
    });
  }
});

console.log(`Total flagged questions: ${classificationResults.length}`);
fs.writeFileSync('tools/flagged_preliminary.json', JSON.stringify(classificationResults, null, 2));
process.exit(0);
