const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function hasWord(text, word) {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(text);
}

const allQuestions = [];
for (let m = 190; m <= 220; m++) {
  if (questionsByMod[m]) {
    for (const q of questionsByMod[m]) {
      const qText = clean(q.question_text);
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

      allQuestions.push({
        id: q.id,
        current_module: m,
        q_text: qText,
        options: { A: optA, B: optB, C: optC, D: optD, E: optE },
        ansLetter,
        ansText,
        expl,
        qa: `${qText} ${ansText}`.toLowerCase(),
        full: `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase()
      });
    }
  }
}

console.log('Total questions loaded:', allQuestions.length);

function auditQuestion(q) {
  const cur = q.current_module;
  const id = q.id;
  const qa = q.qa;
  const full = q.full;
  const text = q.q_text.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  const inQA = (term) => qa.includes(term.toLowerCase());
  const wordQA = (w) => hasWord(qa, w);
  const inAns = (term) => ans.includes(term.toLowerCase());
  const wordAns = (w) => hasWord(ans, w);
  const inText = (term) => text.includes(term.toLowerCase());
  const wordText = (w) => hasWord(text, w);
  const inExpl = (term) => expl.includes(term.toLowerCase());
  const inFull = (term) => full.includes(term.toLowerCase());
  const wordFull = (w) => hasWord(full, w);

  // ===================================================================
  // 1. SPECIFIC OUT-OF-SUBJECT MCQs & DIRECT OVERRIDES
  // ===================================================================
  // Pediatric surgery / Congenital diaphragmatic hernia
  if (id === 6800 || inQA('bochdalek')) {
    return { toModule: 504, reason: 'Tests congenital diaphragmatic hernia (Bochdalek hernia), belongs in Surgery: Pediatric Surgery' };
  }
  // Pathology: Amyloidosis
  if (id === 6809 || (inAns('congo red') && inText('amyloid'))) {
    return { toModule: 141, reason: 'Tests Congo red stain for amyloid material, belongs in Pathology: Amyloidosis' };
  }
  // Pathology: Histiocytosis
  if (id === 7074 || id === 7075 || inQA('birbeck') || (inQA('cd1a') && inFull('histiocyt'))) {
    return { toModule: 139, reason: 'Tests Birbeck granules and CD1a in Langerhans cell histiocytosis, belongs in Pathology: White Blood Cells' };
  }
  // Dermatology: Psoriasis
  if (id === 7190 || inText('pathophysiology of psoriasis')) {
    return { toModule: 643, reason: 'Tests pathophysiology of psoriasis, belongs in Dermatology: Papulosquamous Disorders' };
  }
  // Dermatology: Leprosy clinical examination / disability
  if (inQA('who disability grade') || inQA('degree of disability in leprosy') || (inQA('ridley-jopling') && inText('nerve thickening') && inText('clinical examination'))) {
    return { toModule: 645, reason: 'Tests clinical examination and disability grading of leprosy, belongs in Dermatology: Mycobacterial Infections' };
  }
  // Dermatology: Syndromic STI kits
  if ((inQA('color-coded kit') || inQA('colour-coded kit') || inQA('syndromic management of sti') || inQA('syndromic management of std')) && inFull('naco')) {
    return { toModule: 651, reason: 'Tests STI syndromic management color-coded kits, belongs in Dermatology: Non Syphilitic Sexually Transmitted Diseases' };
  }

  // Medicine: CURB-65 pneumonia
  if (inQA('curb-65') || inQA('curb 65') || inQA('pneumonia severity index') || inQA('port score')) {
    return { toModule: 443, reason: 'Tests pneumonia clinical severity scoring, belongs in Medicine: Pneumonia' };
  }
  // Medicine: HIV clinical staging
  if (inQA('who clinical staging of hiv') || inQA('clinical stage 4 of hiv') || inQA('clinical stage 3 of hiv') || id === 6962 || id === 7219) {
    return { toModule: 477, reason: 'Tests clinical staging and HAART monitoring of HIV disease, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
  }

  // ===================================================================
  // 2. PHARMACOLOGY
  // ===================================================================
  // Antimalarials (240)
  if ((inQA('chloroquine') || inQA('primaquine') || inQA('artemisinin') || inQA('artesunate') || inQA('quinine') || inQA('mefloquine') || inQA('atovaquone')) &&
      (inText('mechanism of action') || inText('resistance to chloroquine') || inText('pfcrt') || inText('adverse effect') || inText('side effect') || inText('chemoprohylaxis') || inText('chemoprophylaxis') || (inText('radical cure') && inText('drug')))) {
    return { toModule: 240, reason: 'Tests antimalarial pharmacology (mechanism/resistance/toxicity/prophylaxis), belongs in Pharmacology: Antimalarial Drugs' };
  }

  // Quinolones & Sulfonamides (241)
  if ((inQA('ciprofloxacin') || inQA('fluoroquinolone') || inQA('levofloxacin') || inQA('trimethoprim') || inQA('sulfamethoxazole') || inQA('cotrimoxazole') || inQA('nitrofurantoin')) &&
      (inText('mechanism of action') || inText('dna gyrase') || inText('topoisomerase') || inText('dihydropteroate') || inText('dihydrofolate reductase') || inText('tendon rupture') || inText('adverse effect of ciprofloxacin'))) {
    return { toModule: 241, reason: 'Tests fluoroquinolones / sulfonamides pharmacology, belongs in Pharmacology: Sulfonamides, Quinolones and Urinary Antiseptics' };
  }

  // 30S Subunit Antimicrobials (242)
  if ((inQA('aminoglycoside') || inQA('gentamicin') || inQA('amikacin') || inQA('streptomycin') || inQA('tetracycline') || inQA('doxycycline') || inQA('chloramphenicol')) &&
      (inText('mechanism of action') || inText('30s ribosomal') || inText('50s ribosomal') || inText('ototoxicity') || inText('nephrotoxicity') || inText('gray baby syndrome') || inText('teeth discoloration'))) {
    return { toModule: 242, reason: 'Tests 30S/50S protein synthesis inhibitor pharmacology, belongs in Pharmacology: Antimicrobials Acting on 30S Subunit' };
  }

  // Antiretroviral Drugs (243)
  if ((inQA('zidovudine') || inQA('tenofovir') || inQA('efavirenz') || inQA('abacavir') || inQA('lamivudine') || inQA('nevirapine') || inQA('atazanavir') || inQA('darunavir') || inQA('dolutegravir') || inQA('raltegravir') || (wordQA('art') && inText('drug')) || inQA('antiretroviral')) &&
      (inText('mechanism of action') || inText('adverse effect') || inText('side effect') || inText('class of drug') || inText('hla-b*5701') || inText('protease inhibitor') || inText('reverse transcriptase inhibitor') || inText('integrase inhibitor'))) {
    return { toModule: 243, reason: 'Tests antiretroviral pharmacology, belongs in Pharmacology: Antiretroviral Drugs' };
  }

  // Antifungals (247)
  if ((inQA('amphotericin') || inQA('fluconazole') || inQA('itraconazole') || inQA('voriconazole') || inQA('caspofungin') || inQA('terbinafine') || inQA('flucytosine') || inQA('griseofulvin') || inQA('nystatin')) &&
      (inText('mechanism of action') || inText('inhibits ergosterol') || inText('14-alpha demethylase') || inText('squalene epoxidase') || inText('beta-1,3-glucan') || inText('adverse effect') || inText('infusion reaction') || inText('hypokalemia and nephrotoxicity') || inText('treatment of systemic my') || inText('systemic mycoses'))) {
    return { toModule: 247, reason: 'Tests antifungal pharmacology (mechanism of action/toxicities), belongs in Pharmacology: Antifungal Agents' };
  }

  // Anti-TB Drugs (248 first line, 249 second line)
  if ((inQA('isoniazid') || inQA('rifampicin') || inQA('pyrazinamide') || inQA('ethambutol')) &&
      (inText('mechanism of action') || inText('optic neuritis') || inText('retrobulbar neuritis') || (inText('peripheral neuropathy') && inText('pyridoxine')) || inText('hyperuricemia') || inText('orange colored urine'))) {
    return { toModule: 248, reason: 'Tests first-line anti-TB pharmacology (mechanism/toxicities), belongs in Pharmacology: First Line Drugs for Tuberculosis' };
  }

  if ((inQA('bedaquiline') || inQA('delamanid') || inQA('linezolid')) &&
      (inText('mechanism of action') || inText('atp synthase') || inText('adverse effect') || inText('myelosuppression') || inText('serotonin syndrome'))) {
    return { toModule: 249, reason: 'Tests second-line anti-TB pharmacology, belongs in Pharmacology: Second Line Drugs for Tuberculosis' };
  }

  // Anti-leprosy Drugs (250)
  if ((inQA('dapsone') || inQA('clofazimine')) &&
      (inText('mechanism of action') || inText('methemoglobinemia') || inText('dapsone syndrome') || (inText('discoloration of skin') && inText('drug')))) {
    return { toModule: 250, reason: 'Tests anti-leprosy drug pharmacology, belongs in Pharmacology: Anti-leprosy Drugs' };
  }

  // Non-retroviral Antivirals (251)
  if ((inQA('acyclovir') || inQA('valacyclovir') || inQA('ganciclovir') || inQA('foscarnet') || inQA('oseltamivir') || inQA('zanamivir') || inQA('sofosbuvir') || inQA('remdesivir')) &&
      (inText('mechanism of action') || inText('viral thymidine kinase') || inText('neuraminidase inhibitor') || inText('adverse effect') || inText('crystal nephropathy') || inText('rna-dependent rna polymerase inhibitor'))) {
    return { toModule: 251, reason: 'Tests non-retroviral antiviral pharmacology, belongs in Pharmacology: Anti-virals (Non-retroviral)' };
  }

  // Anthelmintic & Antiprotozoal Drugs (246)
  if ((inQA('metronidazole') || inQA('albendazole') || inQA('mebendazole') || inQA('ivermectin') || inQA('praziquantel') || inQA('diethylcarbamazine')) &&
      (inText('mechanism of action') || inText('tubulin') || inText('disulfiram') || inText('metallic taste') || inText('calcium permeability'))) {
    return { toModule: 246, reason: 'Tests antiparasitic/anthelmintic pharmacology, belongs in Pharmacology: Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // General Principles of Antimicrobial Therapy (239)
  if (inText('post-antibiotic effect') || (inText('bactericidal') && inText('bacteriostatic') && inText('which of the following is bactericidal'))) {
    return { toModule: 239, reason: 'Tests general antimicrobial therapy principles, belongs in Pharmacology: General Principles of Antimicrobial Therapy' };
  }

  // ===================================================================
  // 3. PSM / COMMUNITY MEDICINE
  // ===================================================================
  if (inQA('cold chain') || inQA('ice-lined refrigerator') || wordQA('ilr') || inQA('vaccine vial monitor') || wordQA('vvm') || inQA('shake test')) {
    return { toModule: 364, reason: 'Tests vaccine cold chain equipment and storage monitoring, belongs in PSM: Vaccine Production and Storage' };
  }
  if (inQA('nvbdcp') || (inQA('malaria') && inQA('annual parasite incidence')) || (inQA('malaria') && wordQA('api') && wordQA('aber'))) {
    return { toModule: 376, reason: 'Tests NVBDCP malaria indicators (API/ABER), belongs in PSM: National Health Programmes I - NVBDCP' };
  }
  if (inQA('ntep') || inQA('nikshay') || (wordQA('naco') && (inText('guideline') || inText('programme') || inText('strategy') || inText('target')))) {
    return { toModule: 377, reason: 'Tests national health programmes (NTEP/NACO), belongs in PSM: National Health Programmes II - NLEP, NTEP & NACO' };
  }
  if ((inQA('national immunization schedule') || inQA('universal immunization programme') || wordQA('uip') || wordQA('nis')) &&
      (inText('schedule') || inText('site of administration') || inText('route of administration') || inText('dose') || inText('at what age'))) {
    return { toModule: 378, reason: 'Tests National Immunization Schedule guidelines, belongs in PSM: National Health Programmes III - NIS, JSY, RBSK and Others' };
  }
  if (inQA('horrocks') || (inQA('chlorination of well') && inText('bleaching powder')) || inQA('break point chlorination')) {
    return { toModule: 388, reason: 'Tests community water disinfection in public health, belongs in PSM: Water- II: Disinfection of water' };
  }

  // ===================================================================
  // 4. PARASITOLOGY (Modules 214 to 218)
  // ===================================================================

  // Helminthology - Nematodes (218)
  if (inQA('ascaris') || inQA('lumbricoides') || (inQA('loeffler') && inFull('worm')) || (inQA('mammillated') && inFull('egg')) ||
      inQA('hookworm') || inQA('ancylostoma') || inQA('necator') || inQA('ground itch') ||
      inQA('strongyloides') || inQA('stercoralis') || inQA('rhabditiform larva') || inQA('larva currens') ||
      inQA('enterobius') || inQA('vermicularis') || inQA('pinworm') || (inQA('perianal itching') && inFull('worm')) || inQA('nih swab') || (inQA('scotch tape') && inFull('enterobius')) || (inQA('planoconvex') && inFull('egg')) ||
      inQA('trichuris') || inQA('trichiura') || inQA('whipworm') || (inQA('bipolar plug') && inFull('egg')) || (inQA('barrel shaped') && inFull('egg')) ||
      inQA('wuchereria') || inQA('bancrofti') || inQA('microfilaria') || inQA('filariasis') || inQA('elephantiasis') || inQA('brugia') || inQA('dec provocation') ||
      inQA('loa loa') || inQA('calabar swelling') || inQA('onchocerca') || inQA('river blindness') || inQA('dracunculus') || inQA('guinea worm') ||
      inQA('trichinella') || inQA('nurse cell') || inQA('cutaneous larva migrans') || inQA('visceral larva migrans') || inQA('toxocara')) {
    if (cur !== 218) {
      return { toModule: 218, reason: 'Tests helminthology: nematodes (roundworms), belongs in Parasitology: Helminthology - Nematodes' };
    }
    return null;
  }

  // Helminthology - Cestodes & Trematodes (217)
  if (inQA('taenia') || inQA('cysticercosis') || inQA('neurocysticercosis') || inQA('measly pork') || inQA('proglottid') || (inQA('scolex') && inFull('tapeworm')) ||
      inQA('echinococcus') || inQA('hydatid') || inQA('casoni') || inQA('water lily sign') || inQA('brood capsule') || inQA('hydatid sand') ||
      inQA('hymenolepis') || inQA('dwarf tapeworm') ||
      inQA('diphyllobothrium') || inQA('fish tapeworm') || inQA('bothria') ||
      inQA('schistosoma') || inQA('bilharziasis') || (inQA('terminal spine') && inFull('egg')) || (inQA('lateral spine') && inFull('egg')) || inQA('symmers') || inQA('pipestem fibrosis') || inQA('katayama') ||
      inQA('fasciola') || inQA('fasciolopsis') || inQA('clonorchis') || inQA('paragonimus') || (inQA('fluke') && inFull('parasit')) || inQA('trematode') || inQA('cestode') || inQA('gastrodiscoides')) {
    if (cur !== 217) {
      return { toModule: 217, reason: 'Tests helminthology: cestodes (tapeworms) and trematodes (flukes), belongs in Parasitology: Helminthology - Cestodes & Trematodes' };
    }
    return null;
  }

  // Protozoology - Sporozoa (216)
  if (inQA('plasmodium') || inQA('malaria') || inQA('falciparum') || inQA('vivax') || inQA('schuffner') || inQA('maurer\'s cleft') || inQA('blackwater fever') || inQA('hypnozoite') || inQA('pfhrp') || (inQA('ring form') && inFull('rbc')) ||
      inQA('toxoplasma') || inQA('gondii') || inQA('sabin-feldman') || inQA('sabin feldman') || inQA('tachyzoite') || inQA('bradyzoite') ||
      inQA('cryptosporidium') || (inQA('acid-fast oocyst') && inFull('parasit')) || inQA('cystoisospora') || inQA('isospora') || inQA('cyclospora') ||
      inQA('babesia') || (inQA('maltese cross') && inFull('rbc')) || inQA('babesiosis')) {
    if (cur !== 216) {
      return { toModule: 216, reason: 'Tests protozoology: sporozoa / apicomplexa (Plasmodium/Toxoplasma/Coccidia/Babesia), belongs in Parasitology: Protozoology - Sporozoa' };
    }
    return null;
  }

  // Protozoology - Amoebae, Ciliates & Flagellates (215)
  if (inQA('entamoeba') || inQA('amoebic dysentery') || inQA('amoebic liver abscess') || inQA('anchovy sauce') || inQA('flask-shaped ulcer') || inQA('e.histolytica') || inQA('e. histolytica') || inQA('e.coli cyst') || inQA('e. coli cyst') ||
      inQA('naegleria') || inQA('acanthamoeba') || inQA('balamuthia') || inQA('primary amoebic') || (wordQA('pam') && inFull('amoeb')) ||
      inQA('giardia') || inQA('lamblia') || inQA('falling leaf motility') || inQA('old man appearance') ||
      inQA('trichomonas') || inQA('vaginalis') || inQA('strawberry cervix') || (inQA('jerky motility') && inFull('vaginal')) ||
      inQA('leishmania') || inQA('donovani') || inQA('kala-azar') || inQA('kala azar') || inQA('amastigote') || inQA('ld body') || inQA('ld bodies') || wordQA('rk39') || inQA('delhi boil') || wordQA('pkdl') || inQA('espundia') ||
      inQA('trypanosoma') || inQA('cruzi') || inQA('chagas') || inQA('romana sign') || inQA('sleeping sickness') || inQA('winterbottom') ||
      inQA('balantidium') || inQA('haemoflagellate')) {
    if (cur !== 215) {
      return { toModule: 215, reason: 'Tests protozoology: amoebae, flagellates, or ciliates, belongs in Parasitology: Protozoology - Amoebae, Ciliates & Flagellates' };
    }
    return null;
  }

  // General Parasitology (214)
  if (cur === 190 && (inQA('definitive host') || inQA('intermediate host') || inQA('paratenic host') || inQA('stool concentration') || inQA('kato katz') || inQA('formol ether'))) {
    return { toModule: 214, reason: 'Tests general parasitology terminology / diagnostic techniques, belongs in Parasitology: General Parasitology' };
  }

  // ===================================================================
  // 5. MYCOLOGY (Modules 212 and 213)
  // ===================================================================

  // Opportunistic Mycoses (213)
  if (inQA('cryptococc') || inQA('india ink') || inQA('nigrosin') || inQA('bird seed agar') || inQA('niger seed agar') || inQA('caffeic acid') || wordQA('crag') || (inQA('mucicarmine') && inFull('capsule')) ||
      inQA('candida') || inQA('candidiasis') || inQA('germ tube') || inQA('chlamydospore') || inQA('chromagar candida') || inQA('chrom agar') || (inQA('oral thrush') && inFull('fung')) ||
      inQA('aspergillus') || inQA('aspergilloma') || inQA('dichotomous branching') || wordQA('abpa') || inQA('aflatoxin') || inQA('a. fumigatus') || inQA('a.fumigatus') ||
      inQA('mucor') || inQA('rhizopus') || inQA('zygomyco') || inQA('broad aseptate') || inQA('rhinocerebral mucor') ||
      inQA('pneumocystis') || inQA('jirovecii') || inQA('carinii') || (inQA('silver stain') && inFull('pcp')) || inQA('cup and saucer') || inQA('crushed ping-pong')) {
    if (cur !== 213) {
      return { toModule: 213, reason: 'Tests opportunistic mycoses (Candida/Cryptococcus/Aspergillus/Mucor/Pneumocystis), belongs in Mycology: Opportunistic Mycoses' };
    }
    return null;
  }

  // Superficial, Subcutaneous & Systemic Mycoses (212)
  if (inQA('dermatophyte') || inQA('trichophyton') || inQA('microsporum') || inQA('epidermophyton') || wordQA('tinea') || inQA('jock itch') || inQA('jocks itch') || inQA('athlete\'s foot') || inQA('ringworm') ||
      inQA('malassezia') || inQA('pityriasis versicolor') || inQA('tinea versicolor') || inQA('spaghetti and meatball') || (inQA('wood\'s lamp') && inFull('fung')) ||
      inQA('sporothrix') || inQA('sporotrichosis') || inQA('rose gardener') || (inQA('cigar shaped') && inFull('budding')) || (inQA('asteroid bodies') && inFull('splendore')) ||
      inQA('chromoblastomycosis') || inQA('medlar bod') || inQA('copper penny') || inQA('muriform cell') || inQA('sclerotic bod') ||
      inQA('mycetoma') || inQA('madura foot') || inQA('madurella') || inQA('eumycetoma') ||
      inQA('rhinosporidi') ||
      inQA('histoplasma') || inQA('histoplasmosis') || inQA('darling disease') || inQA('darling\'s disease') || inQA('tuberculate macroconidia') ||
      inQA('blastomyces') || inQA('blastomycosis') || inQA('broad-based budding') ||
      inQA('coccidioides') || inQA('coccidiodes') || inQA('coccidioidomycosis') || inQA('valley fever') || inQA('desert rheumatism') || (inQA('spherule') && inFull('endospore')) ||
      inQA('paracoccidioides') || inQA('mariner\'s wheel') || inQA('captain\'s wheel') || inQA('pilot\'s wheel') ||
      inQA('talaromyces') || inQA('penicillium marneffei') || inQA('dimorphic fungi') || inQA('thermal dimorphism') ||
      inQA('sabouraud dextrose') || inQA('sabourauds dextrose') || (wordQA('sda') && inFull('agar')) || (inQA('cycloheximide') && inFull('fung')) ||
      (inQA('tube koh') || (inQA('dimethyl sulfoxide') && inFull('koh')) || (wordQA('dmso') && inFull('koh')) || inQA('ectothrix') || inQA('endothrix') || inQA('deuteromycetes') || inQA('fungi imperfecti') || inQA('arthrospores'))) {
    if (cur !== 212) {
      return { toModule: 212, reason: 'Tests superficial/subcutaneous/systemic dimorphic mycoses, fungal media and morphology, belongs in Mycology: Superficial and Systemic Mycoses' };
    }
    return null;
  }

  // ===================================================================
  // 6. VIROLOGY (Modules 208 to 211)
  // ===================================================================

  // Hepatitis (209)
  if (inQA('hepatitis a') || inQA('hepatitis b') || inQA('hepatitis c') || inQA('hepatitis d') || inQA('hepatitis e') ||
      wordQA('hbv') || wordQA('hcv') || wordQA('hav') || wordQA('hdv') || wordQA('hev') ||
      inQA('hbsag') || inQA('anti-hbs') || inQA('hbeag') || inQA('anti-hbe') || inQA('hbcag') || inQA('anti-hbc') || (inQA('window period') && inFull('hepatitis')) || inQA('dane particle')) {
    // If it's a healthcare worker needle stick injury protocol question in M219, keep in M219!
    if (cur === 219 && (inText('needle stick injury') || inText('healthcare worker'))) {
      return null;
    }
    if (cur !== 209) {
      return { toModule: 209, reason: 'Tests hepatitis viruses and serological markers, belongs in Virology: Hepatitis' };
    }
    return null;
  }

  // Arboviruses & Picornaviruses (210)
  if (inQA('dengue') || inQA('chikungunya') || inQA('yellow fever') || inQA('councilman bod') || inQA('japanese encephalitis') || inQA('culex tritaeniorhynchus') || inQA('kyasanur') || inQA('arbovirus') || inQA('ns1 antigen') || (inQA('tourniquet test') && inFull('dengue')) ||
      inQA('poliovirus') || (wordQA('polio') && !inFull('poliomyelitis like')) || (inQA('sabin') && inQA('salk')) || inQA('coxsackie') || inQA('herpangina') || inQA('hand foot and mouth') || inQA('hand-foot-mouth') || inQA('echovirus') || inQA('rhinovirus') || inQA('picorna')) {
    if (cur !== 210) {
      return { toModule: 210, reason: 'Tests arboviruses or picornaviruses (Dengue/Chikungunya/JE/Polio/Coxsackie), belongs in Virology: Arboviruses and Picorna Viruses' };
    }
    return null;
  }

  // Miscellaneous Viruses (211)
  // Note: Must avoid matching "Haemophilus influenzae" for "influenza"
  const isHaemophilusInfluenzae = inQA('haemophilus') || inQA('h. influenzae') || inQA('h.influenzae') || wordQA('hib');
  const hasInfluenzaVirus = !isHaemophilusInfluenzae && (inQA('orthomyxo') || (wordQA('influenza') && (inText('virus') || inText('antigenic shift') || inText('neuraminidase') || inText('hemagglutinin') || inAns('influenza'))));

  if (inQA('rubella') || inQA('congenital rubella') || inQA('gregg triad') ||
      inQA('coronavirus') || inQA('sars-cov') || inQA('mers-cov') || inQA('covid-19') || inQA('covid 19') ||
      inQA('prion') || inQA('creutzfeldt') || wordQA('cjd') || inQA('kuru') || inQA('scrapie') || inQA('spongiform') ||
      inQA('rotavirus') || wordQA('nsp4') || inQA('filovirus') || inQA('ebola') || inQA('marburg') ||
      inQA('zika') || inQA('nipah') || inQA('rabies') || inQA('negri bod') || inQA('hydrophobia') || (inQA('exploring caves') && inFull('rabies')) ||
      hasInfluenzaVirus ||
      inQA('measles') || inQA('koplik') || wordQA('sspe') || inQA('mumps') || inQA('parotitis') || inQA('respiratory syncytial') || wordQA('rsv') || inQA('parainfluenza') || inQA('croup') ||
      inQA('herpes') || wordQA('hsv') || (inQA('tzanck') && inFull('herpes')) || inQA('varicella') || inQA('chickenpox') || inQA('shingles') || inQA('zoster') || inQA('ramsay hunt') ||
      inQA('epstein-barr') || wordQA('ebv') || inQA('infectious mononucleosis') || inQA('paul bunnell') || inQA('monospot') || inQA('downey cell') || (inQA('heterophile') && inFull('mononucleosis')) ||
      inQA('cytomegalovirus') || wordQA('cmv') || (inQA('owl\'s eye') && inFull('inclusion')) || inQA('roseola') || inQA('exanthema subitum') || wordQA('hhv-6') || wordQA('hhv6') || wordQA('hhv-8') || inQA('sixth disease') ||
      inQA('smallpox') || inQA('variola') || inQA('monkeypox') || inQA('molluscum contagiosum') || inQA('henderson-paterson') || inQA('guarnieri') ||
      inQA('adenovirus') || inQA('parvovirus') || inQA('erythema infectiosum') || inQA('slapped cheek') ||
      inQA('human papillomavirus') || (wordQA('hpv') && !inFull('hpv vaccine trial in psm')) || inQA('koilocyte') || inQA('condyloma acuminata') ||
      inQA('polyomavirus') || inQA('jc virus') || inQA('bk virus') || inQA('hantavirus') ||
      (wordQA('hiv') && (inQA('gp120') || inQA('gp41') || inQA('p24') || inQA('retrovirus') || inQA('western blot for hiv') || inQA('nef gene') || inQA('aids defining') || inAns('hiv')) && !inFull('cryptococc') && !inFull('candid') && !inFull('tubercul') && !inFull('bartonell'))) {
    if (cur !== 211) {
      return { toModule: 211, reason: 'Tests miscellaneous viruses (Herpes/HIV/Rabies/Influenza/Measles/Rubella/Pox/Prions/Corona/Rotavirus/Parvovirus/HPV), belongs in Virology: Miscellaneous Viruses' };
    }
    return null;
  }

  // General Properties of Viruses (208)
  if (cur !== 208 && (inQA('chick embryo fibroblast') || inQA('reoviridae') || inQA('colorado tic') || inQA('cell lines are classified') ||
      inQA('icosahedral symmetry') || inQA('helical symmetry') || (inQA('capsid') && inQA('capsomere')) || inQA('baltimore classification') ||
      inQA('cytopathic effect') || inQA('plaque assay') || (inQA('antigenic shift') && inQA('antigenic drift') && inText('which of the following describes')))) {
    return { toModule: 208, reason: 'Tests basic virology structure, symmetry, replication, cell lines, or viral taxonomy, belongs in Virology: General Properties of Viruses' };
  }

  // ===================================================================
  // 7. SPECIFIC BACTERIOLOGY (Modules 194 to 207)
  // ===================================================================

  // Spirochetes (207)
  if (inQA('treponema') || inQA('syphilis') || (inQA('chancre') && inFull('ulcer')) || wordQA('vdrl') || wordQA('rpr') || wordQA('tpha') || inQA('fta-abs') || inQA('condyloma lata') || inQA('jarisch-herxheimer') || (inQA('spirochete') && !inFull('borrelia') && !inFull('leptospira')) ||
      inQA('borrelia') || inQA('burgdorferi') || inQA('lyme disease') || inQA('erythema migrans') || inQA('relapsing fever') ||
      inQA('leptospira') || inQA('leptospirosis') || inQA('weil\'s disease') || wordQA('emjh') || inQA('microscopic agglutination test') || inQA('slide flocculation test')) {
    if (cur !== 207) {
      return { toModule: 207, reason: 'Tests spirochetes (Treponema/Borrelia/Leptospira), belongs in Bacteriology: Spirochetes' };
    }
    return null;
  }

  // Rickettsia, Chlamydia and Mycoplasma (206)
  if (inQA('rickettsia') || inQA('orientia') || inQA('tsutsugamushi') || inQA('scrub typhus') || inQA('epidemic typhus') || inQA('rocky mountain') || inQA('brill zinsser') || (inQA('weil-felix') && !inFull('proteus swarming')) || inQA('coxiella') || inQA('q fever') ||
      inQA('chlamydia') || inQA('trachomatis') || inQA('elementary body') || inQA('reticulate body') || inQA('lymphogranuloma venereum') || wordQA('lgv') || inQA('frei test') || inQA('psittacosis') || inQA('twar') || inQA('safe strategy') ||
      inQA('mycoplasma') || inQA('walking pneumonia') || (inQA('cold agglutinin') && inFull('pneumonia')) || inQA('eaton agent') || (inQA('fried egg') && inFull('colony')) || inQA('ureaplasma')) {
    if (cur !== 206) {
      return { toModule: 206, reason: 'Tests Rickettsia, Chlamydia, or Mycoplasma, belongs in Bacteriology: Rickettsia, Chlamydia and Mycoplasma' };
    }
    return null;
  }

  // Gram Negative Cocci (205)
  if (inQA('neisseria') || inQA('meningococc') || inQA('gonococc') || inQA('gonorrhoe') || inQA('waterhouse-friderichsen') || inQA('thayer-martin') || inQA('moraxella') || inQA('purpura fulminans') || (inQA('blood culture') && inExpl('meningococcal'))) {
    if (cur !== 205) {
      return { toModule: 205, reason: 'Tests Gram-negative cocci (Neisseria / Moraxella), belongs in Bacteriology: Gram Negative Cocci' };
    }
    return null;
  }

  // Miscellaneous Bacteria (204)
  if (inQA('yersinia') || inQA('plague') || inQA('wayson') || (inQA('safety-pin') && inQA('bipolar') && inFull('bacteria')) ||
      inQA('brucella') || inQA('undulant fever') || (inQA('castaneda') && inFull('blood culture')) || inQA('rose bengal') || inQA('standard agglutination test') ||
      inQA('bartonella') || inQA('cat scratch') || (inQA('bacillary angiomatosis') && inFull('bacteria')) || inQA('carrion disease') || inQA('b.quintana') || inQA('b.bacilliformis') ||
      inQA('legionella') || inQA('legionnaires') || inQA('pontiac fever') || wordQA('bcye') ||
      inQA('francisella') || inQA('tularemia') || inQA('rabbit fever') || inQA('gardnerella') || (inQA('clue cell') && inFull('vaginosis')) || (inQA('whiff test') && inFull('amine')) || inQA('rat-bite fever')) {
    if (cur !== 204) {
      return { toModule: 204, reason: 'Tests miscellaneous bacteria (Yersinia/Brucella/Bartonella/Legionella/Francisella/Gardnerella), belongs in Bacteriology: Miscellaneous Bacteria' };
    }
    return null;
  }

  // Haemophilus & Bordetella (203)
  if (inQA('haemophilus') || inQA('satellitism') || inQA('x and v factor') || inQA('factor x') || inQA('factor v') || inQA('chancroid') || inQA('ducreyi') || (inQA('school of fish') && inFull('bacill')) ||
      inQA('bordetella') || inQA('pertussis') || inQA('whooping cough') || inQA('100 days fever') || inQA('catarrhal stage') || inQA('bordet-gengou') || inQA('regan-lowe')) {
    if (cur !== 203) {
      return { toModule: 203, reason: 'Tests Haemophilus or Bordetella, belongs in Bacteriology: Haemophilus' };
    }
    return null;
  }

  // Pseudomonas & Burkholderiales (202)
  if (inQA('pseudomonas') || inQA('pyocyanin') || inQA('pyoverdine') || inQA('cetrimide') || inQA('ecthyma gangrenosum') || inQA('swimmer\'s ear') || inQA('malignant otitis externa') ||
      inQA('burkholderia') || inQA('melioidosis') || inQA('glanders') || inQA('ashdown') || inQA('vietnam time bomb') || inQA('b. cepacia') || inQA('stenotrophomonas') || inQA('acinetobacter')) {
    if (cur !== 202) {
      return { toModule: 202, reason: 'Tests Pseudomonas, Burkholderiales, or Acinetobacter, belongs in Bacteriology: Pseudomonas and Burkholderiales' };
    }
    return null;
  }

  // Vibrio and Campylobacterales (201)
  if (inQA('vibrio') || inQA('cholera') || inQA('rice-water') || wordQA('tcbs') || inQA('darting motility') || inQA('kanagawa') || inQA('wagatsuma') ||
      inQA('campylobacter') || inQA('gull-wing') || inQA('skirrow') ||
      inQA('helicobacter') || inQA('h. pylori') || inQA('h.pylori') || inQA('urea breath test') || (inQA('rapid urease') && inFull('gastric'))) {
    if (cur !== 201) {
      return { toModule: 201, reason: 'Tests Vibrio, Campylobacter, or Helicobacter, belongs in Bacteriology: Vibrio and Campylobacterales' };
    }
    return null;
  }

  // Shigella and Salmonella (200)
  if (inQA('salmonella') || (inQA('typhoid') && !inFull('rickettsia')) || inQA('enteric fever') || inQA('widal') || (inQA('rose spot') && inFull('typhoid')) || inQA('wilson and blair') || inQA('step ladder pattern of fever') ||
      inQA('shigella') || inQA('shiga toxin') || inQA('bacillary dysentery')) {
    if (cur !== 200) {
      return { toModule: 200, reason: 'Tests Salmonella or Shigella (enteric fever/bacillary dysentery), belongs in Bacteriology: Shigella and Salmonella' };
    }
    return null;
  }

  // Escherichia, Proteus and Klebsiella (199)
  if (inQA('escherichia') || inQA('e. coli') || inQA('e.coli') || wordQA('etec') || wordQA('ehec') || wordQA('epec') || wordQA('eiec') || wordQA('eaec') || inQA('o157:h7') || inQA('smac agar') ||
      inQA('klebsiella') || (inQA('red currant jelly') && inFull('sputum')) || (inQA('string test') && inFull('mucoid')) || inQA('rhinoscleroma') || inQA('mikulicz') || inQA('donovanosis') || inQA('donovan bodies') ||
      inQA('proteus') || inQA('swarming motility') || inQA('dienes phenomenon') || (inQA('struvite') && inFull('calculi')) || (inQA('staghorn') && inFull('calculi')) ||
      inQA('serratia marcescens') || inQA('morganella morganii')) {
    if (cur !== 199) {
      return { toModule: 199, reason: 'Tests coliforms (Escherichia/Proteus/Klebsiella/Serratia/Morganella), belongs in Bacteriology: Escherichia, Proteus and Klebsiella' };
    }
    return null;
  }

  // Other Mycobacteria (198)
  if (inQA('mycobacterium leprae') || inQA('m. leprae') || inQA('m.leprae') || inQA('hansen\'s disease') || inQA('lepromin') || inQA('facies leonina') || inQA('erythema nodosum leprosum') || (inQA('reversal reaction') && inFull('lepra')) || inQA('multibacillary') || inQA('paucibacillary') || inQA('indicus pranii') || inQA('bacteriological index') || (inQA('leprosy') && !inFull('who disability grade')) ||
      inQA('runyon') || inQA('photochromogen') || inQA('scotochromogen') || inQA('nonphotochromogen') || inQA('mycobacterium kansasii') || inQA('mycobacterium marinum') || inQA('fish tank granuloma') || inQA('mycobacterium avium') || inQA('buruli ulcer') || inQA('mycobacterium ulcerans') || inQA('mycobacterium fortuitum') || inQA('johne\'s bacilli') || inQA('mycobacterium paratuberculosis')) {
    if (cur !== 198) {
      return { toModule: 198, reason: 'Tests M. leprae or NTM (Runyon groups / M. avium / M. ulcerans), belongs in Bacteriology: Other Mycobacteria' };
    }
    return null;
  }

  // Mycobacteria Tuberculosis (197)
  if (inQA('mycobacterium tuberculosis') || inQA('m. tuberculosis') || inQA('m.tuberculosis') || inQA('tubercle bacilli') || inQA('lowenstein-jensen') || inQA('lj medium') || inQA('mantoux') || inQA('tuberculin test') || inQA('cbnaat') || inQA('genexpert') || inQA('cord factor') || inQA('ghon focus') || inQA('niacin test') || (wordQA('mgit') && inFull('tuberculosis')) ||
      inQA('miliary tb') || inQA('lupus vulgaris') || (inQA('danish 1331') && inFull('vaccin')) || (inQA('bcg vaccine') && inText('till what maximum age')) ||
      (cur !== 197 && cur !== 190 && (inQA('ziehl-neelsen') || inQA('acid-fast bacilli')))) {
    if (cur !== 197) {
      return { toModule: 197, reason: 'Tests Mycobacterium tuberculosis (ZN stain/LJ medium/Mantoux/GeneXpert/BCG/pathology), belongs in Bacteriology: Mycobacteria Tuberculosis' };
    }
    return null;
  }

  // Clostridium and Bacillus (196)
  if (inQA('clostridium') || inQA('tetani') || inQA('tetanospasmin') || inQA('lockjaw') || inQA('trismus') || inQA('risus sardonicus') || inQA('botulinum') || inQA('botulism') || inQA('floppy baby') || inQA('tetanus toxoid') ||
      inQA('perfringens') || inQA('gas gangrene') || inQA('nagler reaction') || inQA('stormy fermentation') || inQA('clostridioides') || (inQA('difficile') && inFull('colitis')) || inQA('pseudomembranous colitis') ||
      inQA('bacillus anthracis') || inQA('anthrax') || inQA('mcfadyean') || inQA('medusa head') || inQA('string of pearls') || inQA('malignant pustule') || inQA('bacillus cereus')) {
    if (cur !== 196) {
      return { toModule: 196, reason: 'Tests spore-forming bacilli (Clostridium and Bacillus), belongs in Bacteriology: Clostridium and Bacillus' };
    }
    return null;
  }

  // Corynebacterium, Listeria and Actinomyces (195)
  if (inQA('corynebacterium') || inQA('diphtheriae') || inQA('diphtheria toxin') || inQA('diphtheria antitoxin') || inQA('albert stain') || wordQA('elek') || inQA('loeffler serum') || inQA('tinsdale') || inQA('schick test') ||
      inQA('listeria') || inQA('monocytogenes') || inQA('tumbling motility') || inQA('cold enrichment') || inQA('actin rockets') ||
      inQA('actinomyces') || inQA('israelii') || inQA('sulfur granules') || inQA('lumpy jaw') ||
      inQA('nocardia') || inQA('modified kinyoun') || (inQA('partially acid-fast') && inFull('branching')) ||
      inQA('minutissimum') || inQA('erythrasma') || inQA('erysipelothrix') || inQA('seal finger') || inQA('propionibacterium')) {
    if (cur !== 195) {
      return { toModule: 195, reason: 'Tests Corynebacterium, Listeria, Actinomyces, Nocardia, or Erysipelothrix, belongs in Bacteriology: Corynebacterium, Listeria and Actinomyces' };
    }
    return null;
  }

  // Streptococci, Enterococci, and Staphylococci (194)
  if (inQA('streptococc') || inQA('streptococcus pyogenes') || inQA('pneumococc') || inQA('streptococcus pneumoniae') || inQA('optochin') || inQA('bile solubility') || inQA('quellung') || inQA('viridans') || inQA('camp test') || inQA('acute rheumatic fever') || (wordQA('psgn') && inFull('strep')) || inQA('erysipelas') ||
      inQA('enterococc') || wordQA('vre') || (inQA('bile esculin') && inFull('enterococc')) ||
      inQA('staphylococc') || inQA('s. aureus') || inQA('s.aureus') || wordQA('mrsa') || wordQA('vrsa') || wordQA('visa') || inQA('protein a') || (inQA('coagulase positive') && inFull('staph')) || wordQA('tsst') || inQA('scalded skin syndrome') || wordQA('ssss') || (inQA('novobiocin') && inFull('staph')) ||
      inQA('micrococcus')) {
    if (cur !== 194) {
      return { toModule: 194, reason: 'Tests Gram-positive cocci (Streptococci, Enterococci, Staphylococci, Micrococcus), belongs in Bacteriology: Streptococci and Enterococci' };
    }
    return null;
  }

  // ===================================================================
  // 8. APPLIED MICROBIOLOGY (Module 219)
  // ===================================================================
  if (inQA('hospital-acquired infection') || inQA('hospital associated infection') || inQA('nosocomial infection') || wordQA('clabsi') || wordQA('cauti') || inQA('surgical site infection') || (wordQA('vap') && inFull('ventilator')) ||
      inQA('biomedical waste') || inQA('bmw rules') || inQA('yellow bag') || inQA('red bag') || (inQA('puncture proof') && inFull('waste')) || (inQA('blue container') && inFull('waste')) || (inQA('blue bag') && inFull('waste')) || inQA('urobag') ||
      wordQA('cssd') || (inQA('biological indicator') && inFull('steriliz')) || inQA('geobacillus stearothermophilus') || (inQA('bacillus atrophaeus') && inFull('steriliz')) || inQA('bowie-dick') ||
      inQA('spaulding') || (inQA('hand hygiene') && inFull('who')) || inQA('needle stick') || inQA('occupational exposure') || inQA('contact precautions') ||
      inQA('personal protective equipment') || (wordQA('ppe') && (inText('donning') || inText('doffing') || inText('kit') || inText('mask'))) ||
      inQA('antimicrobial stewardship') || wordQA('ams') || inQA('eijkman test') || inQA('water surveillance') || inQA('air surveillance') || inQA('1,1,1 method') || inQA('standard precautions')) {
    if (cur !== 219) {
      return { toModule: 219, reason: 'Tests hospital infection control, BMW, surveillance, PPE, and applied sterilization monitoring, belongs in Applied Microbiology' };
    }
    return null;
  }

  // ===================================================================
  // 9. IMMUNOLOGY HIERARCHY (Modules 191, 192, 193)
  // ===================================================================

  // Level 1: Hypersensitivity, Autoimmunity, Immunodeficiency, Transplantation (Module 193)
  if (inQA('hypersensitivity') || inQA('type i hyper') || inQA('type ii hyper') || inQA('type iii hyper') || inQA('type iv hyper') || inQA('anaphylaxis') || inQA('arthus reaction') || inQA('serum sickness') || (inQA('bee') && inFull('sting') && inFull('immunoglobulin')) ||
      (inQA('autoimmune') && !inFull('hashimoto pathology')) || inQA('autoantibody') || wordQA('scid') || inQA('bruton') || inQA('agammaglobulinemia') || inQA('digeorge') || inQA('chronic granulomatous disease') || inQA('chediak-higashi') || inQA('wiskott-aldrich') || inQA('hyper-ige') || inQA('hyper igm') || wordQA('cvid') || (wordQA('lad') && inFull('leukocyte adhesion')) || inQA('hypogammaglobulinemia') ||
      inQA('graft rejection') || (inQA('transplantation') && inFull('graft')) || wordQA('gvhd') || inQA('allograft') || inQA('second-set rejection') || inQA('runt disease') || inQA('anti-ccp') || inQA('anti-dsdna') || (inQA('hla-b27') && inFull('ankylosing'))) {
    if (cur !== 193) {
      return { toModule: 193, reason: 'Tests hypersensitivity, autoimmunity, immunodeficiency, or transplantation immunology, belongs in Immunology: Hypersensitivity' };
    }
    return null;
  }

  // Level 2: Components of Immune System (Module 191)
  if (inQA('innate immunity') || inQA('natural killer') || inQA('nk cell') || wordQA('cd16') || wordQA('cd56') || (inQA('macrophage') && inFull('phagocyt')) || inQA('dendritic cell') || (inQA('neutrophil') && inFull('chemotaxis')) ||
      inQA('complement pathway') || inQA('classical pathway') || inQA('alternative pathway') || inQA('lectin pathway') || inQA('membrane attack complex') || inQA('c3 convertase') || inQA('c5 convertase') || inQA('c1-inh') || inQA('c1 esterase') || inQA('decay-accelerating factor') || inQA('c3b') || inQA('c5a') || inQA('hereditary angioedema') ||
      inQA('toll-like receptor') || (wordQA('tlr') && inFull('receptor')) || inQA('pattern recognition receptor') || wordQA('pamp') || inQA('inflammasome') ||
      inQA('interleukin') || (inQA('cytokine') && !inFull('storm in covid')) || inQA('chemokine') || (inQA('interferon') && !inFull('hepatitis c treatment')) || inQA('tnf-alpha') || (inQA('il-1') || inQA('il-i') || inQA('il-2')) ||
      (inQA('thymus') && inFull('lymphoid')) || (inQA('spleen') && inFull('white pulp')) || (inQA('lymph node') && inFull('paracortex')) || inQA('paracortical area') || inQA('lysozyme') || inQA('c reactive protein')) {
    if (cur !== 191) {
      return { toModule: 191, reason: 'Tests innate immunity, complement, cytokines, TLRs, or lymphoid organ architecture, belongs in Immunology: Components of Immune System' };
    }
    return null;
  }

  // Level 3: Structure and Functions of Immune System & Immune Response (Module 192)
  if (inQA('immunoglobulin') || (inQA('antibody') && (inQA('structure') || inQA('class') || inQA('heavy chain') || inQA('light chain') || inQA('affinity') || inQA('avidity'))) || inQA('heavy chain') || inQA('light chain') || inQA('fab fragment') || inQA('fc fragment') || inQA('hypervariable') || wordQA('cdr') || inQA('isotype') || inQA('allotype') || inQA('idiotype') || inQA('class switching') || (wordQA('iga') && inText('secretory')) ||
      inQA('antigen-antibody reaction') || inQA('precipitation reaction') || inQA('agglutination reaction') || (wordQA('elisa') && !inFull('hiv diagnosis')) || (inQA('western blot') && !inFull('hiv')) || (inQA('flow cytometry') && !inFull('leukemia')) || inQA('coombs test') || inQA('prozone') || inQA('radial immunodiffusion') || inQA('lateral flow assay') || inQA('hybridoma') ||
      inQA('mhc class') || inQA('major histocompatibility') || inQA('human leukocyte antigen') || (inQA('hla-') && !inFull('ankylosing')) || inQA('antigen presentation') || inQA('invariant chain') || inQA('tap transporter') || inQA('superantigen') ||
      inQA('t-cell receptor') || inQA('b-cell receptor') || inQA('thymic selection') || inQA('cell-mediated immunity') || inQA('humoral immunity') || inQA('clonal selection') || inQA('immune tolerance') || inQA('hapten') || inQA('paratope') || inQA('epitope') || inQA('adjuvant') || inQA('t independent antigen') || inQA('iso-antigen') || inQA('reaginic antibody') ||
      ((inQA('live attenuated vaccine') || inQA('killed vaccine') || inQA('toxoid vaccine') || inQA('conjugate vaccine')) && inText('which of the following is'))) {
    if (cur !== 192) {
      return { toModule: 192, reason: 'Tests immunoglobulins, Ag-Ab reactions, MHC/HLA, antigens, or immune response principles, belongs in Immunology: Structure and Functions of the Immune System & Immune Response' };
    }
    return null;
  }

  // ===================================================================
  // 10. MULTI-ORGANISM MATCHING / CROSS-TOPIC (Module 220)
  // ===================================================================
  if (id === 6819 || id === 6844 || id === 7063 || id === 7067) {
    if (cur !== 220) {
      return { toModule: 220, reason: 'Cross-topic match question spanning diverse microbiological taxa/pathology, belongs in Mixed / Miscellaneous Topics' };
    }
    return null;
  }

  return null;
}

const moves = [];
for (const q of allQuestions) {
  const res = auditQuestion(q);
  if (res && res.toModule !== q.current_module) {
    moves.push({
      id: q.id,
      fromModule: q.current_module,
      toModule: res.toModule,
      fromName: modMap[q.current_module] ? modMap[q.current_module].moduleName : '',
      toName: modMap[res.toModule] ? modMap[res.toModule].moduleName : '',
      subject: modMap[res.toModule] ? modMap[res.toModule].subjectName : '',
      reason: res.reason,
      text: q.q_text.slice(0, 80),
      ans: q.ansText.slice(0, 40)
    });
  }
}

console.log('Total flagged moves in v4 engine:', moves.length);

const byFrom = {};
moves.forEach(m => byFrom[m.fromModule] = (byFrom[m.fromModule] || 0) + 1);
console.log('Moves by source module:', byFrom);

const bySub = {};
moves.forEach(m => bySub[m.subject] = (bySub[m.subject] || 0) + 1);
console.log('Moves by target subject:', bySub);

fs.writeFileSync('tools/audit_engine_v4_moves.json', JSON.stringify(moves, null, 2));
console.log('Saved tools/audit_engine_v4_moves.json');
process.exit(0);
