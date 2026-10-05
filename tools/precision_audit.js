const fs = require('fs');

const questionsByMod = JSON.parse(fs.readFileSync('tools/microbiology_current_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
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
        q_plus_ans: `${qText} ${ansText}`.toLowerCase(),
        full: `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase()
      });
    }
  }
}

console.log('Total questions loaded:', allQuestions.length);

// Precision Auditor
function auditQuestion(q) {
  const cur = q.current_module;
  const qa = q.q_plus_ans;
  const full = q.full;
  const text = q.q_text.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const expl = q.expl.toLowerCase();

  // Helper checks
  const hasQA = (term) => qa.includes(term);
  const hasFull = (term) => full.includes(term);

  // ------------------------------------------------------------------
  // 1. OUTSIDE SUBJECTS
  // ------------------------------------------------------------------

  // Pharmacology: Mechanism of action / adverse effects of specific drugs
  if (hasQA('chloroquine') || hasQA('primaquine') || hasQA('artemisinin') || hasQA('quinine') || hasQA('antimalarial drug')) {
    if (text.includes('mechanism of action') || text.includes('resistance to chloroquine') || text.includes('pfcrt') || text.includes('radical cure') && text.includes('drug') || text.includes('adverse effect')) {
      return { toModule: 240, reason: 'Tests antimalarial drug pharmacology (mechanism/resistance/toxicity), belongs in Pharmacology: Antimalarial Drugs' };
    }
  }

  if (hasQA('ciprofloxacin') || hasQA('fluoroquinolone') || hasQA('levofloxacin') || hasQA('trimethoprim') || hasQA('sulfamethoxazole') || hasQA('cotrimoxazole') || hasQA('nitrofurantoin')) {
    if (text.includes('mechanism of action') || text.includes('dna gyrase') || text.includes('topoisomerase') || text.includes('dihydropteroate') || text.includes('dihydrofolate reductase') || text.includes('tendon rupture') || text.includes('adverse effect of ciprofloxacin')) {
      return { toModule: 241, reason: 'Tests fluoroquinolones / sulfonamides pharmacology, belongs in Pharmacology: Sulfonamides, Quinolones and Urinary Antiseptics' };
    }
  }

  if (hasQA('aminoglycoside') || hasQA('gentamicin') || hasQA('amikacin') || hasQA('streptomycin') || hasQA('tetracycline') || hasQA('doxycycline') || hasQA('chloramphenicol')) {
    if (text.includes('mechanism of action') || text.includes('30s ribosomal') || text.includes('50s ribosomal') || text.includes('ototoxicity') || text.includes('nephrotoxicity') || text.includes('gray baby syndrome') || text.includes('teeth discoloration')) {
      return { toModule: 242, reason: 'Tests 30S/50S protein synthesis inhibitor pharmacology, belongs in Pharmacology: Antimicrobials Acting on 30S Subunit' };
    }
  }

  if (hasQA('zidovudine') || hasQA('tenofovir') || hasQA('efavirenz') || hasQA('abacavir') || hasQA('lamivudine') || hasQA('nevirapine') || hasQA('atazanavir') || hasQA('darunavir') || hasQA('dolutegravir') || hasQA('raltegravir') || hasQA('antiretroviral')) {
    if (text.includes('mechanism of action') || text.includes('adverse effect') || text.includes('side effect') || text.includes('class of drug') || text.includes('hla-b*5701') || text.includes('protease inhibitor')) {
      return { toModule: 243, reason: 'Tests antiretroviral pharmacology, belongs in Pharmacology: Antiretroviral Drugs' };
    }
  }

  if (hasQA('amphotericin') || hasQA('fluconazole') || hasQA('itraconazole') || hasQA('voriconazole') || hasQA('caspofungin') || hasQA('terbinafine') || hasQA('flucytosine') || hasQA('griseofulvin') || hasQA('nystatin')) {
    if (text.includes('mechanism of action') || text.includes('ergosterol') || text.includes('14-alpha demethylase') || text.includes('squalene epoxidase') || text.includes('beta-1,3-glucan') || text.includes('adverse effect') || text.includes('infusion reaction')) {
      return { toModule: 247, reason: 'Tests antifungal drug pharmacology, belongs in Pharmacology: Antifungal Agents' };
    }
  }

  if (hasQA('isoniazid') || hasQA('rifampicin') || hasQA('pyrazinamide') || hasQA('ethambutol')) {
    if (text.includes('mechanism of action') || text.includes('optic neuritis') || text.includes('retrobulbar neuritis') || text.includes('peripheral neuropathy') && text.includes('pyridoxine') || text.includes('hyperuricemia') || text.includes('orange colored urine')) {
      return { toModule: 248, reason: 'Tests first-line anti-TB pharmacology (mechanism/toxicities), belongs in Pharmacology: First Line Drugs for Tuberculosis' };
    }
  }

  if (hasQA('bedaquiline') || hasQA('delamanid')) {
    if (text.includes('mechanism of action') || text.includes('atp synthase') || text.includes('adverse effect')) {
      return { toModule: 249, reason: 'Tests second-line anti-TB pharmacology, belongs in Pharmacology: Second Line Drugs for Tuberculosis' };
    }
  }

  if (hasQA('dapsone') || hasQA('clofazimine')) {
    if (text.includes('mechanism of action') || text.includes('methemoglobinemia') || text.includes('dapsone syndrome') || text.includes('discoloration of skin') && text.includes('drug')) {
      return { toModule: 250, reason: 'Tests anti-leprosy drug pharmacology, belongs in Pharmacology: Anti-leprosy Drugs' };
    }
  }

  if (hasQA('acyclovir') || hasQA('valacyclovir') || hasQA('ganciclovir') || hasQA('foscarnet') || hasQA('oseltamivir') || hasQA('zanamivir') || hasQA('sofosbuvir') || hasQA('remdesivir')) {
    if (text.includes('mechanism of action') || text.includes('viral thymidine kinase') || text.includes('neuraminidase inhibitor') || text.includes('adverse effect') || text.includes('crystal nephropathy')) {
      return { toModule: 251, reason: 'Tests antiviral pharmacology, belongs in Pharmacology: Anti-virals (Non-retroviral)' };
    }
  }

  if (hasQA('metronidazole') || hasQA('albendazole') || hasQA('mebendazole') || hasQA('ivermectin') || hasQA('praziquantel') || hasQA('diethylcarbamazine')) {
    if (text.includes('mechanism of action') || text.includes('tubulin') || text.includes('disulfiram') || text.includes('metallic taste') || text.includes('calcium permeability')) {
      return { toModule: 246, reason: 'Tests antiparasitic/anthelmintic pharmacology, belongs in Pharmacology: Anti-Protozoal Agents and Anthelmintic Drugs' };
    }
  }

  if (text.includes('post-antibiotic effect') || (text.includes('bactericidal') && text.includes('bacteriostatic') && text.includes('which of the following is'))) {
    return { toModule: 239, reason: 'Tests general antimicrobial therapy principles, belongs in Pharmacology: General Principles of Antimicrobial Therapy' };
  }

  // PSM: Cold chain, national programmes, NIS
  if (hasQA('cold chain') || hasQA('ice-lined refrigerator') || hasQA('ilr') || hasQA('vaccine vial monitor') || hasQA('vvm') || hasQA('shake test')) {
    return { toModule: 364, reason: 'Tests cold chain logistics and vaccine storage, belongs in PSM: Vaccine Production and Storage' };
  }
  if (hasQA('nvbdcp') || (hasQA('malaria') && hasQA('api') && hasQA('aber')) || hasQA('annual parasite incidence') || hasQA('annual blood examination rate')) {
    return { toModule: 376, reason: 'Tests National Vector Borne Disease Control Programme indicators, belongs in PSM: National Health Programmes I - NVBDCP' };
  }
  if (hasQA('ntep') || hasQA('nikshay') || (hasQA('naco') && (hasQA('guideline') || hasQA('programme') || hasQA('target')))) {
    return { toModule: 377, reason: 'Tests national disease control programmes (NTEP/NACO), belongs in PSM: National Health Programmes II - NLEP, NTEP & NACO' };
  }
  if ((hasQA('national immunization schedule') || hasQA('universal immunization programme') || hasQA('uip') || hasQA('nis')) &&
      (text.includes('age') || text.includes('schedule') || text.includes('site') || text.includes('route') || text.includes('dose'))) {
    return { toModule: 378, reason: 'Tests National Immunization Schedule guidelines, belongs in PSM: National Health Programmes III - NIS, JSY, RBSK and Others' };
  }
  if (hasQA('horrocks') || hasQA('chlorination of well') || hasQA('break point chlorination')) {
    return { toModule: 388, reason: 'Tests water disinfection in public health, belongs in PSM: Water- II: Disinfection of water' };
  }

  // Medicine: Pneumonia scoring, HIV staging
  if (hasQA('curb-65') || hasQA('curb 65') || hasQA('pneumonia severity index') || hasQA('port score')) {
    return { toModule: 443, reason: 'Tests clinical pneumonia risk stratification, belongs in Medicine: Pneumonia' };
  }
  if (hasQA('who clinical staging of hiv') || hasQA('clinical stage 4 of hiv') || hasQA('clinical stage 3 of hiv')) {
    return { toModule: 477, reason: 'Tests clinical staging of HIV/AIDS, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
  }

  // Dermatology: Leprosy disability grading, STI color-coded kits
  if (hasQA('who disability grade') || hasQA('degree of disability in leprosy') || (hasQA('ridley-jopling') && hasQA('nerve thickening') && hasQA('clinical'))) {
    return { toModule: 645, reason: 'Tests leprosy clinical dermatology features and disability grading, belongs in Dermatology: Mycobacterial Infections' };
  }
  if ((hasQA('color-coded kit') || hasQA('colour-coded kit') || hasQA('syndromic management of sti') || hasQA('syndromic management of std') || hasQA('kit 1') || hasQA('kit 2') || hasQA('kit 3') || hasQA('kit 4') || hasQA('kit 5') || hasQA('kit 6') || hasQA('kit 7')) && hasQA('naco')) {
    return { toModule: 651, reason: 'Tests NACO syndromic STI management color-coded kits, belongs in Dermatology: Non Syphilitic Sexually Transmitted Diseases' };
  }

  // ------------------------------------------------------------------
  // 2. INTRA-MICROBIOLOGY AUDIT
  // ------------------------------------------------------------------

  // --- MYCOLOGY ---
  // Opportunistic Mycoses (213)
  // Candida, Cryptococcus, Aspergillus, Mucor/Rhizopus, Pneumocystis jirovecii
  const isOppMycology = () => {
    return hasQA('cryptococc') || hasQA('india ink') || hasQA('nigrosin') || hasQA('bird seed agar') || hasQA('niger seed agar') || hasQA('caffeic acid') || hasQA('crag') || (hasQA('mucicarmine') && hasFull('capsule')) ||
           hasQA('candida') || hasQA('germ tube') || hasQA('chlamydospore') || hasQA('chromagar candida') || (hasQA('oral thrush') && hasFull('fung')) ||
           hasQA('aspergillus') || hasQA('aspergilloma') || hasQA('dichotomous branching') || hasQA('abpa') || hasQA('aflatoxin') ||
           hasQA('mucor') || hasQA('rhizopus') || hasQA('zygomyco') || hasQA('broad aseptate') || hasQA('rhinocerebral mucor') ||
           hasQA('pneumocystis') || hasQA('jirovecii') || hasQA('carinii') || (hasQA('silver stain') && hasFull('pcp')) || hasQA('cup and saucer') || hasQA('crushed ping-pong');
  };
  if (isOppMycology()) {
    if (cur !== 213) {
      return { toModule: 213, reason: 'Tests opportunistic mycoses (Candida/Cryptococcus/Aspergillus/Mucor/Pneumocystis), belongs in Mycology: Opportunistic Mycoses' };
    }
    return null; // Correctly in 213
  }

  // Superficial & Systemic Mycoses (212)
  // Dermatophytes, Malassezia, Sporothrix, Mycetoma, Chromoblastomycosis, Histoplasma, Blastomyces, Coccidioides, Paracoccidioides, Talaromyces
  const isSuperficialSystemicMycology = () => {
    return hasQA('dermatophyte') || hasQA('trichophyton') || hasQA('microsporum') || hasQA('epidermophyton') || hasQA('tinea') || hasQA('jock itch') || hasQA('athlete\'s foot') || hasQA('ringworm') ||
           hasQA('malassezia') || hasQA('pityriasis versicolor') || hasQA('tinea versicolor') || hasQA('spaghetti and meatball') || hasQA('wood\'s lamp') && hasFull('fung') ||
           hasQA('sporothrix') || hasQA('sporotrichosis') || hasQA('rose gardener') || hasQA('cigar shaped') && hasFull('budding') || hasQA('asteroid bodies') && hasFull('splendore') ||
           hasQA('chromoblastomycosis') || hasQA('medlar bod') || hasQA('copper penny') || hasQA('muriform cell') || hasQA('sclerotic bod') ||
           hasQA('mycetoma') || hasQA('madura foot') || hasQA('madurella') || hasQA('eumycetoma') ||
           hasQA('rhinosporidi') ||
           hasQA('histoplasma') || hasQA('histoplasmosis') || hasQA('darling disease') || hasQA('tuberculate macroconidia') ||
           hasQA('blastomyces') || hasQA('blastomycosis') || hasQA('broad-based budding') ||
           hasQA('coccidioides') || hasQA('coccidioidomycosis') || hasQA('valley fever') || hasQA('spherule') && hasFull('endospore') ||
           hasQA('paracoccidioides') || hasQA('mariner\'s wheel') || hasQA('captain\'s wheel') || hasQA('pilot\'s wheel') ||
           hasQA('talaromyces') || hasQA('penicillium marneffei') || hasQA('dimorphic fungi') || hasQA('thermal dimorphism');
  };
  if (isSuperficialSystemicMycology()) {
    if (cur !== 212) {
      return { toModule: 212, reason: 'Tests superficial/subcutaneous/systemic dimorphic mycoses, belongs in Mycology: Superficial and Systemic Mycoses' };
    }
    return null; // Correctly in 212
  }

  // --- PARASITOLOGY ---
  // Nematodes (218)
  const isNematode = () => {
    return hasQA('ascaris') || hasQA('lumbricoides') || hasQA('loeffler') && hasFull('worm') || hasQA('mammillated') && hasFull('egg') ||
           hasQA('hookworm') || hasQA('ancylostoma') || hasQA('necator') || hasQA('ground itch') ||
           hasQA('strongyloides') || hasQA('stercoralis') || hasQA('rhabditiform larva') || hasQA('larva currens') ||
           hasQA('enterobius') || hasQA('vermicularis') || hasQA('pinworm') || hasQA('perianal itching') && hasFull('worm') || hasQA('nih swab') || hasQA('scotch tape') && hasFull('enterobius') || hasQA('planoconvex') && hasFull('egg') ||
           hasQA('trichuris') || hasQA('trichiura') || hasQA('whipworm') || hasQA('bipolar plug') && hasFull('egg') || hasQA('barrel shaped') && hasFull('egg') ||
           hasQA('wuchereria') || hasQA('bancrofti') || hasQA('microfilaria') || hasQA('filariasis') || hasQA('elephantiasis') || hasQA('brugia') || hasQA('dec provocation') ||
           hasQA('loa loa') || hasQA('calabar swelling') || hasQA('onchocerca') || hasQA('river blindness') || hasQA('dracunculus') || hasQA('guinea worm') ||
           hasQA('trichinella') || hasQA('nurse cell') || hasQA('cutaneous larva migrans') || hasQA('visceral larva migrans') || hasQA('toxocara');
  };
  if (isNematode()) {
    if (cur !== 218) {
      return { toModule: 218, reason: 'Tests helminthology: nematodes (roundworms), belongs in Parasitology: Helminthology - Nematodes' };
    }
    return null;
  }

  // Cestodes & Trematodes (217)
  const isCestodeTrematode = () => {
    return hasQA('taenia') || hasQA('cysticercosis') || hasQA('neurocysticercosis') || hasQA('measly pork') || hasQA('proglottid') || hasQA('scolex') ||
           hasQA('echinococcus') || hasQA('hydatid') || hasQA('casoni') || hasQA('water lily sign') || hasQA('brood capsule') || hasQA('hydatid sand') ||
           hasQA('hymenolepis') || hasQA('dwarf tapeworm') ||
           hasQA('diphyllobothrium') || hasQA('fish tapeworm') || hasQA('bothria') ||
           hasQA('schistosoma') || hasQA('bilharziasis') || hasQA('terminal spine') && hasFull('egg') || hasQA('lateral spine') && hasFull('egg') || hasQA('symmers') || hasQA('pipestem fibrosis') || hasQA('katayama') ||
           hasQA('fasciola') || hasQA('fasciolopsis') || hasQA('clonorchis') || hasQA('paragonimus') || (hasQA('fluke') && hasFull('parasit')) || hasQA('trematode') || hasQA('cestode');
  };
  if (isCestodeTrematode()) {
    if (cur !== 217) {
      return { toModule: 217, reason: 'Tests helminthology: cestodes (tapeworms) and trematodes (flukes), belongs in Parasitology: Helminthology - Cestodes & Trematodes' };
    }
    return null;
  }

  // Sporozoa (216)
  const isSporozoa = () => {
    return hasQA('plasmodium') || hasQA('malaria') || hasQA('falciparum') || hasQA('vivax') || hasQA('schuffner') || hasQA('maurer\'s cleft') || hasQA('blackwater fever') || hasQA('hypnozoite') || hasQA('pfhrp') || (hasQA('ring form') && hasFull('rbc')) ||
           hasQA('toxoplasma') || hasQA('gondii') || hasQA('sabin-feldman') || hasQA('sabin feldman') || hasQA('tachyzoite') || hasQA('bradyzoite') ||
           hasQA('cryptosporidium') || (hasQA('acid-fast oocyst') && hasFull('parasit')) || hasQA('cystoisospora') || hasQA('isospora') || hasQA('cyclospora') ||
           hasQA('babesia') || hasQA('maltese cross') && hasFull('rbc') || hasQA('babesiosis');
  };
  if (isSporozoa()) {
    if (cur !== 216) {
      return { toModule: 216, reason: 'Tests protozoology: sporozoa / apicomplexa (Plasmodium/Toxoplasma/Coccidia/Babesia), belongs in Parasitology: Protozoology - Sporozoa' };
    }
    return null;
  }

  // Amoebae, Ciliates & Flagellates (215)
  const isAmoebaFlagellate = () => {
    return hasQA('entamoeba') || hasQA('amoebic dysentery') || hasQA('amoebic liver abscess') || hasQA('anchovy sauce') || hasQA('flask-shaped ulcer') || hasQA('e.histolytica') || hasQA('e. histolytica') || hasQA('e.coli cyst') || hasQA('e. coli cyst') ||
           hasQA('naegleria') || hasQA('acanthamoeba') || hasQA('balamuthia') || hasQA('primary amoebic') || (hasQA('pam') && hasFull('amoeb')) ||
           hasQA('giardia') || hasQA('lamblia') || hasQA('falling leaf motility') || hasQA('old man appearance') ||
           hasQA('trichomonas') || hasQA('vaginalis') || hasQA('strawberry cervix') || (hasQA('jerky motility') && hasFull('vaginal')) ||
           hasQA('leishmania') || hasQA('donovani') || hasQA('kala-azar') || hasQA('kala azar') || hasQA('amastigote') || hasQA('ld body') || hasQA('ld bodies') || hasQA('rk39') || hasQA('delhi boil') || hasQA('pkdl') ||
           hasQA('trypanosoma') || hasQA('cruzi') || hasQA('chagas') || hasQA('romana sign') || hasQA('sleeping sickness') || hasQA('winterbottom') ||
           hasQA('balantidium') || hasQA('haemoflagellate');
  };
  if (isAmoebaFlagellate()) {
    if (cur !== 215) {
      return { toModule: 215, reason: 'Tests protozoology: amoebae, flagellates, or ciliates, belongs in Parasitology: Protozoology - Amoebae, Ciliates & Flagellates' };
    }
    return null;
  }

  // General Parasitology (214)
  if (cur === 214) {
    // If in 214 and reached here without matching specific parasite, it's general parasitology!
    // But if someone put a 214 question in 190:
  } else if (cur === 190 && (hasQA('definitive host') || hasQA('intermediate host') || hasQA('paratenic host') || hasQA('stool concentration') || hasQA('kato katz') || hasQA('formol ether'))) {
    return { toModule: 214, reason: 'Tests general parasitology terminology / diagnostic techniques, belongs in Parasitology: General Parasitology' };
  }

  // --- VIROLOGY ---
  // Hepatitis (209)
  const isHepatitis = () => {
    return hasQA('hepatitis a') || hasQA('hepatitis b') || hasQA('hepatitis c') || hasQA('hepatitis d') || hasQA('hepatitis e') ||
           hasQA('hbv') || hasQA('hcv') || hasQA('hav') || hasQA('hdv') || hasQA('hev') ||
           hasQA('hbsag') || hasQA('anti-hbs') || hasQA('hbeag') || hasQA('anti-hbe') || hasQA('hbcag') || hasQA('anti-hbc') || (hasQA('window period') && hasFull('hepatitis')) || hasQA('dane particle');
  };
  if (isHepatitis()) {
    if (cur !== 209) {
      return { toModule: 209, reason: 'Tests hepatitis viruses and serology, belongs in Virology: Hepatitis' };
    }
    return null;
  }

  // Arboviruses & Picornaviruses (210)
  const isArboPicorna = () => {
    return hasQA('dengue') || hasQA('chikungunya') || hasQA('yellow fever') || hasQA('councilman bod') || hasQA('japanese encephalitis') || hasQA('culex tritaeniorhynchus') || hasQA('kyasanur') || hasQA('arbovirus') || hasQA('ns1 antigen') || (hasQA('tourniquet test') && hasFull('dengue')) ||
           hasQA('poliovirus') || hasQA('polio') || (hasQA('sabin') && hasQA('salk')) || hasQA('coxsackie') || hasQA('herpangina') || hasQA('hand foot and mouth') || hasQA('echovirus') || hasQA('rhinovirus') || hasQA('picorna');
  };
  if (isArboPicorna()) {
    if (cur !== 210) {
      return { toModule: 210, reason: 'Tests arboviruses or picornaviruses (Dengue/Chikungunya/JE/Polio/Coxsackie), belongs in Virology: Arboviruses and Picorna Viruses' };
    }
    return null;
  }

  // General Virology (208)
  const isGenVirology = () => {
    return hasQA('icosahedral symmetry') || hasQA('helical symmetry') || (hasQA('capsid') && hasQA('capsomere')) || hasQA('baltimore classification') || (hasQA('viral envelope') && !hasFull('hiv') && !hasFull('hbv')) ||
           hasQA('cytopathic effect') || hasQA('plaque assay') || hasQA('bacteriophage') || (hasQA('antigenic shift') && hasQA('antigenic drift') && !hasFull('influenza treatment')) || (hasQA('viral replication cycle') && !hasFull('hiv'));
  };
  if (isGenVirology()) {
    if (cur !== 208) {
      return { toModule: 208, reason: 'Tests basic virology structure, symmetry, replication, or bacteriophages, belongs in Virology: General Properties of Viruses' };
    }
    return null;
  }

  // Miscellaneous Viruses (211)
  const isMiscVirus = () => {
    return hasQA('rubella') || hasQA('congenital rubella') || hasQA('gregg triad') ||
           hasQA('coronavirus') || hasQA('sars-cov') || hasQA('mers-cov') || hasQA('covid-19') ||
           hasQA('prion') || hasQA('creutzfeldt') || hasQA('cjd') || hasQA('kuru') || hasQA('scrapie') || hasQA('spongiform') ||
           hasQA('rotavirus') || hasQA('nsp4') || hasQA('filovirus') || hasQA('ebola') || hasQA('marburg') ||
           hasQA('zika') || hasQA('nipah') || hasQA('rabies') || hasQA('negri bod') || hasQA('hydrophobia') ||
           hasQA('influenza') || (hasQA('hemagglutinin') && hasQA('neuraminidase')) || hasQA('orthomyxo') ||
           hasQA('measles') || hasQA('koplik') || hasQA('sspe') || hasQA('mumps') || hasQA('parotitis') || hasQA('respiratory syncytial') || hasQA('rsv') || hasQA('parainfluenza') || hasQA('croup') ||
           hasQA('herpes') || hasQA('hsv') || (hasQA('tzanck') && hasFull('herpes')) || hasQA('varicella') || hasQA('chickenpox') || hasQA('shingles') || hasQA('zoster') ||
           hasQA('epstein-barr') || hasQA('ebv') || hasQA('infectious mononucleosis') || hasQA('paul bunnell') || hasQA('monospot') || hasQA('downey cell') || (hasQA('heterophile') && hasFull('mononucleosis')) ||
           hasQA('cytomegalovirus') || hasQA('cmv') || (hasQA('owl\'s eye') && hasFull('inclusion')) || hasQA('roseola') || hasQA('exanthema subitum') || hasQA('hhv-6') || hasQA('hhv-8') || hasQA('kaposi sarcoma') ||
           hasQA('smallpox') || hasQA('variola') || hasQA('molluscum contagiosum') || hasQA('henderson-paterson') || hasQA('guarnieri') ||
           hasQA('adenovirus') || hasQA('parvovirus b19') || hasQA('erythema infectiosum') || hasQA('slapped cheek') ||
           hasQA('hiv') || hasQA('gp120') || hasQA('gp41') || (hasQA('p24') && hasFull('antigen')) || hasQA('retrovirus') || hasQA('human papillomavirus') || hasQA('hpv') || hasQA('koilocyte') || hasQA('jc virus') || hasQA('bk virus');
  };
  if (isMiscVirus()) {
    if (cur !== 211) {
      return { toModule: 211, reason: 'Tests miscellaneous viruses (Herpes/HIV/Rabies/Influenza/Measles/Rubella/Prions/Corona/Rotavirus/Parvovirus), belongs in Virology: Miscellaneous Viruses' };
    }
    return null;
  }

  // --- BACTERIOLOGY ---
  // Spirochetes (207)
  const isSpirochete = () => {
    return hasQA('treponema') || hasQA('syphilis') || (hasQA('chancre') && hasFull('ulcer')) || hasQA('vdrl') || hasQA('rpr') || hasQA('tpha') || hasQA('fta-abs') || hasQA('condyloma lata') || hasQA('jarisch-herxheimer') || (hasQA('spirochete') && !hasFull('borrelia') && !hasFull('leptospira')) ||
           hasQA('borrelia') || hasQA('burgdorferi') || hasQA('lyme disease') || hasQA('erythema migrans') || hasQA('relapsing fever') ||
           hasQA('leptospira') || hasQA('leptospirosis') || hasQA('weil\'s disease') || hasQA('emjh') || hasQA('microscopic agglutination test');
  };
  if (isSpirochete()) {
    if (cur !== 207) {
      return { toModule: 207, reason: 'Tests spirochetes (Treponema/Borrelia/Leptospira), belongs in Bacteriology: Spirochetes' };
    }
    return null;
  }

  // Rickettsia, Chlamydia and Mycoplasma (206)
  const isRickettsiaChlamydiaMyco = () => {
    return hasQA('rickettsia') || hasQA('orientia') || hasQA('tsutsugamushi') || hasQA('scrub typhus') || hasQA('epidemic typhus') || hasQA('rocky mountain') || (hasQA('weil-felix') && !hasFull('proteus swarming')) || hasQA('coxiella') || hasQA('q fever') ||
           hasQA('chlamydia') || hasQA('trachomatis') || hasQA('elementary body') || hasQA('reticulate body') || hasQA('lymphogranuloma venereum') || hasQA('lgv') || hasQA('frei test') || hasQA('psittacosis') ||
           hasQA('mycoplasma') || hasQA('walking pneumonia') || (hasQA('cold agglutinin') && hasFull('pneumonia')) || hasQA('eaton agent') || (hasQA('fried egg') && hasFull('colony')) || hasQA('ureaplasma');
  };
  if (isRickettsiaChlamydiaMyco()) {
    if (cur !== 206) {
      return { toModule: 206, reason: 'Tests Rickettsia, Chlamydia, or Mycoplasma, belongs in Bacteriology: Rickettsia, Chlamydia and Mycoplasma' };
    }
    return null;
  }

  // Gram Negative Cocci (205)
  const isGramNegCocci = () => {
    return hasQA('neisseria') || hasQA('meningococc') || hasQA('gonococc') || hasQA('gonorrhoe') || hasQA('waterhouse-friderichsen') || hasQA('thayer-martin') || hasQA('moraxella');
  };
  if (isGramNegCocci()) {
    if (cur !== 205) {
      return { toModule: 205, reason: 'Tests Gram-negative cocci (Neisseria / Moraxella), belongs in Bacteriology: Gram Negative Cocci' };
    }
    return null;
  }

  // Miscellaneous Bacteria (204)
  const isMiscBacteria = () => {
    return hasQA('yersinia') || hasQA('plague') || hasQA('wayson') || (hasQA('safety-pin') && hasQA('bipolar') && hasFull('bacteria')) ||
           hasQA('brucella') || hasQA('undulant fever') || (hasQA('castaneda') && hasFull('blood culture')) || hasQA('rose bengal') ||
           hasQA('bartonella') || hasQA('cat scratch') || (hasQA('bacillary angiomatosis') && hasFull('bacteria')) || hasQA('carrion disease') ||
           hasQA('legionella') || hasQA('legionnaires') || hasQA('pontiac fever') || hasQA('bcye') ||
           hasQA('francisella') || hasQA('tularemia') || hasQA('gardnerella') || (hasQA('clue cell') && hasFull('vaginosis')) || (hasQA('whiff test') && hasFull('amine')) || hasQA('rat-bite fever');
  };
  if (isMiscBacteria()) {
    if (cur !== 204) {
      return { toModule: 204, reason: 'Tests miscellaneous bacteria (Yersinia/Brucella/Bartonella/Legionella/Gardnerella), belongs in Bacteriology: Miscellaneous Bacteria' };
    }
    return null;
  }

  // Haemophilus & Bordetella (203)
  const isHaemophilus = () => {
    return hasQA('haemophilus') || hasQA('satellitism') || hasQA('x and v factor') || hasQA('chancroid') || hasQA('ducreyi') || (hasQA('school of fish') && hasFull('bacill')) ||
           hasQA('bordetella') || hasQA('pertussis') || hasQA('whooping cough') || hasQA('bordet-gengou') || hasQA('regan-lowe');
  };
  if (isHaemophilus()) {
    if (cur !== 203) {
      return { toModule: 203, reason: 'Tests Haemophilus or Bordetella, belongs in Bacteriology: Haemophilus' };
    }
    return null;
  }

  // Pseudomonas & Burkholderiales (202)
  const isPseudomonas = () => {
    return hasQA('pseudomonas') || hasQA('pyocyanin') || hasQA('pyoverdine') || hasQA('cetrimide') || hasQA('ecthyma gangrenosum') ||
           hasQA('burkholderia') || hasQA('melioidosis') || hasQA('glanders') || hasQA('ashdown') || hasQA('stenotrophomonas') || hasQA('acinetobacter');
  };
  if (isPseudomonas()) {
    if (cur !== 202) {
      return { toModule: 202, reason: 'Tests Pseudomonas, Burkholderiales, or Acinetobacter, belongs in Bacteriology: Pseudomonas and Burkholderiales' };
    }
    return null;
  }

  // Vibrio and Campylobacterales (201)
  const isVibrioCampylo = () => {
    return hasQA('vibrio') || hasQA('cholera') || hasQA('rice-water') || hasQA('tcbs') || hasQA('darting motility') || hasQA('kanagawa') ||
           hasQA('campylobacter') || hasQA('gull-wing') || hasQA('skirrow') ||
           hasQA('helicobacter') || hasQA('h. pylori') || hasQA('h.pylori') || hasQA('urea breath test') || (hasQA('rapid urease') && hasFull('gastric'));
  };
  if (isVibrioCampylo()) {
    if (cur !== 201) {
      return { toModule: 201, reason: 'Tests Vibrio, Campylobacter, or Helicobacter, belongs in Bacteriology: Vibrio and Campylobacterales' };
    }
    return null;
  }

  // Shigella and Salmonella (200)
  const isShigellaSalmonella = () => {
    return hasQA('salmonella') || (hasQA('typhoid') && !hasFull('rickettsia')) || hasQA('enteric fever') || hasQA('widal') || (hasQA('rose spot') && hasFull('typhoid')) || hasQA('wilson and blair') ||
           hasQA('shigella') || hasQA('shiga toxin') || hasQA('bacillary dysentery');
  };
  if (isShigellaSalmonella()) {
    if (cur !== 200) {
      return { toModule: 200, reason: 'Tests Salmonella or Shigella (enteric fever/bacillary dysentery), belongs in Bacteriology: Shigella and Salmonella' };
    }
    return null;
  }

  // Escherichia, Proteus and Klebsiella (199)
  const isColiform = () => {
    return hasQA('escherichia') || hasQA('e. coli') || hasQA('e.coli') || hasQA('etec') || hasQA('ehec') || hasQA('epec') || hasQA('eiec') || hasQA('eaec') || hasQA('o157:h7') || hasQA('smac agar') ||
           hasQA('klebsiella') || (hasQA('red currant jelly') && hasFull('sputum')) || (hasQA('string test') && hasFull('mucoid')) || hasQA('rhinoscleroma') || hasQA('mikulicz') || hasQA('donovanosis') || hasQA('donovan bodies') ||
           hasQA('proteus') || hasQA('swarming motility') || hasQA('dienes phenomenon') || (hasQA('struvite') && hasFull('calculi')) || (hasQA('staghorn') && hasFull('calculi'));
  };
  if (isColiform()) {
    if (cur !== 199) {
      return { toModule: 199, reason: 'Tests coliforms (Escherichia/Proteus/Klebsiella), belongs in Bacteriology: Escherichia, Proteus and Klebsiella' };
    }
    return null;
  }

  // Other Mycobacteria (198)
  const isOtherMyco = () => {
    return hasQA('mycobacterium leprae') || hasQA('m. leprae') || hasQA('m.leprae') || hasQA('hansen\'s disease') || hasQA('lepromin') || hasQA('facies leonina') || hasQA('erythema nodosum leprosum') || (hasQA('reversal reaction') && hasFull('lepra')) ||
           hasQA('runyon') || hasQA('photochromogen') || hasQA('scotochromogen') || hasQA('mycobacterium kansasii') || hasQA('mycobacterium marinum') || hasQA('fish tank granuloma') || hasQA('mycobacterium avium') || hasQA('buruli ulcer') || hasQA('mycobacterium ulcerans') || hasQA('mycobacterium fortuitum');
  };
  if (isOtherMyco()) {
    if (cur !== 198) {
      return { toModule: 198, reason: 'Tests M. leprae or NTM (Runyon groups), belongs in Bacteriology: Other Mycobacteria' };
    }
    return null;
  }

  // Mycobacteria Tuberculosis (197)
  const isMTB = () => {
    return hasQA('mycobacterium tuberculosis') || hasQA('m. tuberculosis') || hasQA('m.tuberculosis') || hasQA('tubercle bacilli') || hasQA('lowenstein-jensen') || hasQA('lj medium') || hasQA('mantoux') || hasQA('tuberculin test') || hasQA('cbnaat') || hasQA('genexpert') || hasQA('cord factor') || hasQA('ghon focus') || hasQA('niacin test') || (hasQA('mgit') && hasFull('tuberculosis'));
  };
  if (isMTB()) {
    if (cur !== 197) {
      return { toModule: 197, reason: 'Tests Mycobacterium tuberculosis, belongs in Bacteriology: Mycobacteria Tuberculosis' };
    }
    return null;
  }

  // Clostridium and Bacillus (196)
  const isClostridiumBacillus = () => {
    return hasQA('clostridium') || hasQA('tetani') || hasQA('tetanospasmin') || hasQA('lockjaw') || hasQA('trismus') || hasQA('risus sardonicus') || hasQA('botulinum') || hasQA('botulism') || hasQA('floppy baby') ||
           hasQA('perfringens') || hasQA('gas gangrene') || hasQA('nagler reaction') || hasQA('stormy fermentation') || hasQA('clostridioides') || (hasQA('difficile') && hasFull('colitis')) || hasQA('pseudomembranous colitis') ||
           hasQA('bacillus anthracis') || hasQA('anthrax') || hasQA('mcfadyean') || hasQA('medusa head') || hasQA('string of pearls') || hasQA('malignant pustule') || hasQA('bacillus cereus');
  };
  if (isClostridiumBacillus()) {
    if (cur !== 196) {
      return { toModule: 196, reason: 'Tests spore-forming bacilli (Clostridium and Bacillus), belongs in Bacteriology: Clostridium and Bacillus' };
    }
    return null;
  }

  // Corynebacterium, Listeria and Actinomyces (195)
  const isCoryneListeria = () => {
    return hasQA('corynebacterium') || hasQA('diphtheriae') || hasQA('diphtheria toxin') || hasQA('albert stain') || hasQA('elek') || hasQA('loeffler') || hasQA('tinsdale') || hasQA('schick test') ||
           hasQA('listeria') || hasQA('monocytogenes') || hasQA('tumbling motility') || hasQA('cold enrichment') || hasQA('actin rockets') ||
           hasQA('actinomyces') || hasQA('israelii') || hasQA('sulfur granules') || hasQA('lumpy jaw') ||
           hasQA('nocardia') || hasQA('modified kinyoun') || (hasQA('partially acid-fast') && hasFull('branching'));
  };
  if (isCoryneListeria()) {
    if (cur !== 195) {
      return { toModule: 195, reason: 'Tests Corynebacterium, Listeria, Actinomyces, or Nocardia, belongs in Bacteriology: Corynebacterium, Listeria and Actinomyces' };
    }
    return null;
  }

  // Streptococci, Enterococci, and Staphylococci (194)
  const isStrepStaph = () => {
    return hasQA('streptococc') || hasQA('streptococcus pyogenes') || hasQA('pneumococc') || hasQA('streptococcus pneumoniae') || hasQA('optochin') || hasQA('bile solubility') || hasQA('quellung') || hasQA('viridans') || hasQA('camp test') || hasQA('acute rheumatic fever') || (hasQA('psgn') && hasFull('strep')) ||
           hasQA('enterococc') || hasQA('vre') || (hasQA('bile esculin') && hasFull('enterococc')) ||
           hasQA('staphylococc') || hasQA('s. aureus') || hasQA('s.aureus') || hasQA('mrsa') || hasQA('protein a') || (hasQA('coagulase positive') && hasFull('staph')) || hasQA('tsst') || hasQA('scalded skin syndrome') || hasQA('ssss') || (hasQA('novobiocin') && hasFull('staph'));
  };
  if (isStrepStaph()) {
    if (cur !== 194) {
      return { toModule: 194, reason: 'Tests Gram-positive cocci (Streptococci, Enterococci, Staphylococci), belongs in Bacteriology: Streptococci and Enterococci' };
    }
    return null;
  }

  // --- APPLIED MICROBIOLOGY (219) ---
  const isAppliedMicro = () => {
    return hasQA('hospital-acquired infection') || hasQA('nosocomial infection') || hasQA('clabsi') || hasQA('cauti') || hasQA('surgical site infection') || (hasQA('vap') && hasFull('ventilator')) ||
           hasQA('biomedical waste') || hasQA('bmw rules') || hasQA('yellow bag') || hasQA('red bag') || (hasQA('puncture proof') && hasFull('waste')) || (hasQA('blue container') && hasFull('waste')) ||
           hasQA('cssd') || hasQA('biological indicator') || hasQA('geobacillus stearothermophilus') || (hasQA('bacillus atrophaeus') && hasFull('steriliz')) || hasQA('bowie-dick') ||
           hasQA('spaulding') || (hasQA('hand hygiene') && hasFull('who')) || hasQA('needle stick') || hasQA('most probable number') || hasQA('mpn') || hasQA('presumptive coliform') || hasQA('settle plate');
  };
  if (isAppliedMicro()) {
    if (cur !== 219) {
      return { toModule: 219, reason: 'Tests hospital infection control, BMW, sterilization monitoring, or surveillance, belongs in Applied Microbiology' };
    }
    return null;
  }

  // --- IMMUNOLOGY (191, 192, 193) ---
  // Hypersensitivity, Autoimmunity, Immunodeficiency, Transplantation (193)
  const isHypersensitivity = () => {
    return hasQA('hypersensitivity') || hasQA('type i hyper') || hasQA('type ii hyper') || hasQA('type iii hyper') || hasQA('type iv hyper') || hasQA('anaphylaxis') || hasQA('arthus reaction') || hasQA('serum sickness') ||
           (hasQA('autoimmune') && !hasFull('hashimoto pathology')) || hasQA('autoantibody') || hasQA('scid') || hasQA('bruton') || hasQA('agammaglobulinemia') || hasQA('digeorge') || hasQA('chronic granulomatous disease') || hasQA('chediak-higashi') || hasQA('wiskott-aldrich') || hasQA('hyper-ige') || hasQA('hyper igm') || hasQA('cvid') || (hasQA('lad') && hasFull('leukocyte adhesion')) ||
           hasQA('graft rejection') || (hasQA('transplantation') && hasFull('graft')) || hasQA('gvhd') || hasQA('allograft');
  };
  if (isHypersensitivity()) {
    if (cur !== 193) {
      return { toModule: 193, reason: 'Tests hypersensitivity, autoimmunity, immunodeficiency, or transplantation immunology, belongs in Immunology: Hypersensitivity' };
    }
    return null;
  }

  // Structure and Functions of Immune System (192)
  const isImmuneStructFunc = () => {
    return hasQA('immunoglobulin') || (hasQA('antibody') && (hasQA('structure') || hasQA('class') || hasQA('heavy chain') || hasQA('light chain') || hasQA('affinity'))) || hasQA('heavy chain') || hasQA('light chain') || hasQA('fab fragment') || hasQA('fc fragment') || hasQA('hypervariable') || hasQA('cdr') || hasQA('isotype') || hasQA('allotype') || hasQA('idiotype') || hasQA('class switching') ||
           hasQA('antigen-antibody reaction') || hasQA('precipitation reaction') || hasQA('agglutination reaction') || (hasQA('elisa') && !hasFull('hiv diagnosis')) || (hasQA('western blot') && !hasFull('hiv')) || (hasQA('flow cytometry') && !hasFull('leukemia')) || hasQA('coombs test') || hasQA('prozone') || hasQA('radial immunodiffusion') ||
           hasQA('mhc class') || hasQA('major histocompatibility') || hasQA('human leukocyte antigen') || (hasQA('hla-') && !hasFull('ankylosing')) || hasQA('antigen presentation') || hasQA('invariant chain') || hasQA('tap transporter') ||
           hasQA('t-cell receptor') || hasQA('b-cell receptor') || hasQA('thymic selection') || hasQA('cell-mediated immunity') || hasQA('humoral immunity') || hasQA('clonal selection') || hasQA('immune tolerance') ||
           ((hasQA('live attenuated vaccine') || hasQA('killed vaccine') || hasQA('toxoid vaccine') || hasQA('conjugate vaccine')) && text.includes('which of the following is'));
  };
  if (isImmuneStructFunc()) {
    if (cur !== 192) {
      return { toModule: 192, reason: 'Tests immunoglobulins, Ag-Ab reactions, MHC/HLA, or immune response principles, belongs in Immunology: Structure and Functions of the Immune System & Immune Response' };
    }
    return null;
  }

  // Components of Immune System (191)
  const isImmuneComponents = () => {
    return hasQA('innate immunity') || hasQA('natural killer') || hasQA('nk cell') || hasQA('cd16') || hasQA('cd56') || (hasQA('macrophage') && hasFull('phagocyt')) || hasQA('dendritic cell') || (hasQA('neutrophil') && hasFull('chemotaxis')) ||
           hasQA('complement pathway') || hasQA('classical pathway') || hasQA('alternative pathway') || hasQA('lectin pathway') || hasQA('membrane attack complex') || hasQA('c3 convertase') || hasQA('c5 convertase') || hasQA('c1-inh') || hasQA('decay-accelerating factor') ||
           hasQA('toll-like receptor') || (hasQA('tlr') && hasFull('receptor')) || hasQA('pattern recognition receptor') || hasQA('pamp') || hasQA('inflammasome') ||
           hasQA('interleukin') || (hasQA('cytokine') && !hasFull('storm in covid')) || hasQA('chemokine') || (hasQA('interferon') && !hasFull('hepatitis c treatment')) || hasQA('tnf-alpha') ||
           (hasQA('thymus') && hasFull('lymphoid')) || (hasQA('spleen') && hasFull('white pulp')) || (hasQA('lymph node') && hasFull('paracortex'));
  };
  if (isImmuneComponents()) {
    if (cur !== 191) {
      return { toModule: 191, reason: 'Tests innate immunity, complement, cytokines, TLRs, or immune cells, belongs in Immunology: Components of Immune System' };
    }
    return null;
  }

  // If currently in Module 190, does it stay in 190?
  // 190 is General Microbiology: Bacterial morphology, anatomy, physiology, staining, culture media, bacterial genetics, AMR mechanisms, general sterilization.
  // If a question in 190 doesn't match any specific entity above, it is genuine General Microbiology and STAYS in 190.

  return null;
}

// Run audit
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
      text: q.q_text.slice(0, 90),
      ans: q.ansText.slice(0, 40)
    });
  }
}

console.log('Total flagged moves:', moves.length);

const byFrom = {};
moves.forEach(m => byFrom[m.fromModule] = (byFrom[m.fromModule] || 0) + 1);
console.log('Moves by source module:', byFrom);

const bySub = {};
moves.forEach(m => bySub[m.subject] = (bySub[m.subject] || 0) + 1);
console.log('Moves by target subject:', bySub);

fs.writeFileSync('tools/precision_moves.json', JSON.stringify(moves, null, 2));
console.log('Saved tools/precision_moves.json');
process.exit(0);
