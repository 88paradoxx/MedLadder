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
        options: [optA, optB, optC, optD, optE].filter(Boolean).join(' | '),
        ansLetter,
        ansText,
        expl,
        fullText: `${qText} ${optA} ${optB} ${optC} ${optD} ${optE} ${expl}`.toLowerCase()
      });
    }
  }
}

console.log('Total questions loaded:', allQuestions.length);

// Rule-based classification engine
function classifyQuestion(q) {
  const full = q.fullText;
  const text = q.q_text.toLowerCase();
  const expl = q.expl.toLowerCase();
  const ans = q.ansText.toLowerCase();
  const cur = q.current_module;

  // -------------------------------------------------------------
  // 1. OUTSIDE SUBJECTS
  // -------------------------------------------------------------

  // --- PHARMACOLOGY ---
  // Pure mechanism of action or adverse effects of drugs where the question is primarily testing pharmacology
  // Antimalarials (Mod 240)
  if ((text.includes('antimalarial') || text.includes('chloroquine') || text.includes('artemisinin') || text.includes('primaquine') || text.includes('quinine')) &&
      (text.includes('mechanism of action') || text.includes('adverse effect') || text.includes('side effect') || text.includes('resistance to chloroquine is due to mutation in') || text.includes('pfcrt'))) {
    return { toModule: 240, reason: 'Tests antimalarial drug pharmacology (mechanism/resistance/toxicity), belongs in Pharmacology: Antimalarial Drugs' };
  }

  // Quinolones & Sulfonamides (Mod 241)
  if ((text.includes('ciprofloxacin') || text.includes('fluoroquinolone') || text.includes('sulfamethoxazole') || text.includes('cotrimoxazole') || text.includes('trimethoprim')) &&
      (text.includes('mechanism of action') || text.includes('dna gyrase') || text.includes('topoisomerase iv') || text.includes('inhibits dihydropteroate') || text.includes('adverse effect') || text.includes('tendon rupture'))) {
    return { toModule: 241, reason: 'Tests fluoroquinolone/sulfonamide pharmacology, belongs in Pharmacology: Sulfonamides, Quinolones and Urinary Antiseptics' };
  }

  // 30S Subunit Antimicrobials (Mod 242)
  if ((text.includes('aminoglycoside') || text.includes('gentamicin') || text.includes('amikacin') || text.includes('streptomycin') || text.includes('tetracycline') || text.includes('doxycycline')) &&
      (text.includes('mechanism of action') || text.includes('30s ribosomal') || text.includes('ototoxicity') || text.includes('nephrotoxicity') || text.includes('gray baby syndrome'))) {
    return { toModule: 242, reason: 'Tests 30S antimicrobial pharmacology (mechanism/toxicities), belongs in Pharmacology: Antimicrobials Acting on 30S Subunit' };
  }

  // Antiretroviral Drugs (Mod 243)
  if ((text.includes('antiretroviral') || text.includes('zidovudine') || text.includes('tenofovir') || text.includes('efavirenz') || text.includes('abacavir') || text.includes('protease inhibitor') || text.includes('integrase inhibitor') || text.includes('nrti') || text.includes('nnrti')) &&
      (text.includes('mechanism of action') || text.includes('adverse effect') || text.includes('hla-b*5701') || text.includes('lipodystrophy') || text.includes('class of drug'))) {
    return { toModule: 243, reason: 'Tests antiretroviral pharmacology, belongs in Pharmacology: Antiretroviral Drugs' };
  }

  // Penicillins (Mod 244)
  if ((text.includes('penicillin') || text.includes('ampicillin') || text.includes('amoxicillin') || text.includes('methicillin')) &&
      (text.includes('mechanism of action') || text.includes('transpeptidase') || text.includes('pbp') || text.includes('penicillinase') || text.includes('interstitial nephritis')) &&
      !full.includes('treponema') && !full.includes('syphilis') && !full.includes('streptococc') && !full.includes('staphylococc')) {
    return { toModule: 244, reason: 'Tests penicillin class pharmacology, belongs in Pharmacology: Penicillins' };
  }

  // Cephalosporins, Vancomycin and Carbapenems (Mod 245)
  if ((text.includes('cephalosporin') || text.includes('ceftriaxone') || text.includes('vancomycin') || text.includes('carbapenem') || text.includes('imipenem') || text.includes('meropenem')) &&
      (text.includes('mechanism of action') || text.includes('generation of cephalosporin') || text.includes('red man syndrome') || text.includes('d-ala-d-ala') || text.includes('cilastatin'))) {
    return { toModule: 245, reason: 'Tests cell-wall active antibiotic pharmacology, belongs in Pharmacology: Cephalosporins, Vancomycin and Carbapenems' };
  }

  // Antifungals (Mod 247)
  if ((text.includes('amphotericin') || text.includes('fluconazole') || text.includes('itraconazole') || text.includes('voriconazole') || text.includes('caspofungin') || text.includes('terbinafine') || text.includes('griseofulvin') || text.includes('flucytosine')) &&
      (text.includes('mechanism of action') || text.includes('inhibits ergosterol') || text.includes('14-alpha demethylase') || text.includes('beta-1,3-glucan') || text.includes('squalene epoxidase') || text.includes('adverse effect of amphotericin'))) {
    return { toModule: 247, reason: 'Tests antifungal pharmacology, belongs in Pharmacology: Antifungal Agents' };
  }

  // Anti-TB Drugs (Mod 248 first line, Mod 249 second line)
  if ((text.includes('isoniazid') || text.includes('rifampicin') || text.includes('pyrazinamide') || text.includes('ethambutol')) &&
      (text.includes('mechanism of action') || text.includes('optic neuritis') || text.includes('peripheral neuropathy') || text.includes('hyperuricemia') || text.includes('orange colored urine') || text.includes('rpo b gene mutation') && text.includes('inhibits dna-dependent rna polymerase'))) {
    return { toModule: 248, reason: 'Tests first-line anti-TB pharmacology, belongs in Pharmacology: First Line Drugs for Tuberculosis' };
  }

  if ((text.includes('bedaquiline') || text.includes('delamanid') || text.includes('linezolid')) &&
      (text.includes('mechanism of action') || text.includes('atp synthase') || text.includes('adverse effect'))) {
    return { toModule: 249, reason: 'Tests second-line anti-TB pharmacology, belongs in Pharmacology: Second Line Drugs for Tuberculosis' };
  }

  // Anti-leprosy Drugs (Mod 250)
  if ((text.includes('dapsone') || text.includes('clofazimine')) &&
      (text.includes('mechanism of action') || text.includes('methemoglobinemia') || text.includes('dapsone syndrome') || text.includes('brownish black discoloration of skin'))) {
    return { toModule: 250, reason: 'Tests anti-leprosy drug pharmacology, belongs in Pharmacology: Anti-leprosy Drugs' };
  }

  // Non-retroviral Antivirals (Mod 251)
  if ((text.includes('acyclovir') || text.includes('ganciclovir') || text.includes('oseltamivir') || text.includes('foscarnet') || text.includes('sofosbuvir') || text.includes('remdesivir')) &&
      (text.includes('mechanism of action') || text.includes('viral thymidine kinase') || text.includes('neuraminidase inhibitor') || text.includes('adverse effect'))) {
    return { toModule: 251, reason: 'Tests antiviral pharmacology, belongs in Pharmacology: Anti-virals (Non-retroviral)' };
  }

  // Anthelmintic & Antiprotozoal Drugs (Mod 246)
  if ((text.includes('metronidazole') || text.includes('albendazole') || text.includes('ivermectin') || text.includes('praziquantel') || text.includes('diethylcarbamazine')) &&
      (text.includes('mechanism of action') || text.includes('tubulin') || text.includes('disulfiram like') || text.includes('metallic taste') || text.includes('calcium permeability'))) {
    return { toModule: 246, reason: 'Tests antiparasitic pharmacology, belongs in Pharmacology: Anti-Protozoal Agents and Anthelmintic Drugs' };
  }

  // General Principles of Antimicrobial Therapy (Mod 239)
  if (text.includes('post-antibiotic effect') || text.includes('concentration dependent killing') || text.includes('time dependent killing') ||
      (text.includes('bactericidal') && text.includes('bacteriostatic') && text.includes('which of the following is bactericidal'))) {
    return { toModule: 239, reason: 'Tests general antimicrobial principles and pharmacodynamics, belongs in Pharmacology: General Principles of Antimicrobial Therapy' };
  }

  // --- PSM ---
  // National health programmes
  if (full.includes('nvbdcp') || full.includes('annual parasite incidence') || full.includes('annual blood examination rate') || (full.includes('malaria') && full.includes('api') && full.includes('aber'))) {
    return { toModule: 376, reason: 'Tests National Vector Borne Disease Control Programme indicators, belongs in PSM: National Health Programmes I - NVBDCP' };
  }
  if (full.includes('ntep') || full.includes('rntcp') || full.includes('nikshay') || full.includes('naco') || (full.includes('national aids control') && full.includes('strategy'))) {
    return { toModule: 377, reason: 'Tests national control programmes (NTEP/NACO), belongs in PSM: National Health Programmes II - NLEP, NTEP & NACO' };
  }
  if (full.includes('cold chain') || full.includes('ice-lined refrigerator') || full.includes('ilr') || full.includes('vaccine vial monitor') || full.includes('vvm') || full.includes('shake test')) {
    return { toModule: 364, reason: 'Tests cold chain and vaccine storage logistics, belongs in PSM: Vaccine Production and Storage' };
  }
  if ((full.includes('national immunization schedule') || full.includes('nis') || full.includes('universal immunization programme') || full.includes('uip')) &&
      (text.includes('at what age') || text.includes('schedule') || text.includes('site of administration') || text.includes('route of administration') || text.includes('pentavalent vaccine is given at'))) {
    return { toModule: 378, reason: 'Tests National Immunization Schedule guidelines, belongs in PSM: National Health Programmes III - NIS, JSY, RBSK and Others' };
  }
  if (full.includes('horrocks') || (full.includes('chlorination of well') && full.includes('bleaching powder')) || full.includes('break point chlorination')) {
    return { toModule: 388, reason: 'Tests water disinfection in public health, belongs in PSM: Water- II: Disinfection of water' };
  }

  // --- MEDICINE ---
  if (text.includes('curb-65') || text.includes('curb 65') || (text.includes('pneumonia severity index') || text.includes('port score'))) {
    return { toModule: 443, reason: 'Tests pneumonia clinical risk stratification, belongs in Medicine: Pneumonia' };
  }
  if (full.includes('who clinical staging of hiv') || full.includes('clinical stage 4 of hiv') || full.includes('clinical stage 3 of hiv')) {
    return { toModule: 477, reason: 'Tests clinical staging of HIV disease, belongs in Medicine: HIV / AIDS - Epidemiology and Diagnosis' };
  }

  // --- DERMATOLOGY ---
  if (full.includes('ridley-jopling') && (text.includes('clinical classification') || text.includes('nerve thickening') || text.includes('who disability grade') || text.includes('degree of disability'))) {
    return { toModule: 645, reason: 'Tests clinical dermatology features and disability grading of leprosy, belongs in Dermatology: Mycobacterial Infections' };
  }
  if ((full.includes('syndromic management of sti') || full.includes('syndromic management of std') || full.includes('color-coded kit') || full.includes('colour coded kit') || full.includes('kit 1') || full.includes('kit 2') || full.includes('kit 3') || full.includes('kit 4')) && full.includes('naco')) {
    return { toModule: 651, reason: 'Tests STI syndromic management color-coded kits, belongs in Dermatology: Non Syphilitic Sexually Transmitted Diseases' };
  }

  // -------------------------------------------------------------
  // 2. INTRA-MICROBIOLOGY AUDIT (Modules 190 to 220)
  // -------------------------------------------------------------

  // --- MYCOLOGY ---
  // Opportunistic Mycoses (Mod 213)
  // Candida, Cryptococcus, Aspergillus, Mucor/Rhizopus, Pneumocystis jirovecii
  if (full.includes('cryptococc') || full.includes('india ink') || full.includes('nigrosin') || full.includes('bird seed agar') || full.includes('niger seed agar') || full.includes('caffeic acid') || full.includes('crag') || full.includes('mucicarmine') ||
      full.includes('candida') || full.includes('germ tube') || full.includes('chlamydospore') || full.includes('chromagar candida') || full.includes('thrush') ||
      full.includes('aspergillus') || full.includes('aspergilloma') || full.includes('dichotomous branching') || full.includes('abpa') || full.includes('aflatoxin') ||
      full.includes('mucor') || full.includes('rhizopus') || full.includes('zygomyc') || full.includes('broad aseptate') || full.includes('rhinocerebral mucor') ||
      full.includes('pneumocystis') || full.includes('jirovecii') || full.includes('carinii') || full.includes('silver methenamine') || full.includes('cup and saucer') || full.includes('crushed ping pong')) {
    if (cur !== 213) {
      return { toModule: 213, reason: 'Tests opportunistic mycology (Candida/Cryptococcus/Aspergillus/Mucor/Pneumocystis), belongs in Mycology: Opportunistic Mycoses' };
    }
    return null;
  }

  // Superficial, Subcutaneous, and Systemic Dimorphic Mycoses (Mod 212)
  // Dermatophytes, Malassezia, Sporothrix, Mycetoma, Chromoblastomycosis, Histoplasma, Blastomyces, Coccidioides, Paracoccidioides, Talaromyces
  if (full.includes('dermatophyte') || full.includes('trichophyton') || full.includes('microsporum') || full.includes('epidermophyton') || full.includes('tinea') || full.includes('jock itch') || full.includes('athlete\'s foot') || full.includes('ringworm') ||
      full.includes('malassezia') || full.includes('pityriasis versicolor') || full.includes('tinea versicolor') || full.includes('spaghetti and meatballs') ||
      full.includes('sporothrix') || full.includes('sporotrichosis') || full.includes('rose gardener') || full.includes('cigar shaped') || full.includes('asteroid bodies') ||
      full.includes('chromoblastomycosis') || full.includes('medlar bodies') || full.includes('copper penny') || full.includes('muriform') ||
      full.includes('mycetoma') || full.includes('madura foot') || full.includes('madurella') || full.includes('eumycetoma') ||
      full.includes('rhinosporidi') ||
      full.includes('histoplasma') || full.includes('histoplasmosis') || full.includes('darling disease') || full.includes('tuberculate macroconidia') ||
      full.includes('blastomyces') || full.includes('blastomycosis') || full.includes('broad-based budding') ||
      full.includes('coccidioides') || full.includes('coccidioidomycosis') || full.includes('valley fever') || full.includes('spherule') ||
      full.includes('paracoccidioides') || full.includes('mariner\'s wheel') || full.includes('captain\'s wheel') || full.includes('pilot\'s wheel') ||
      full.includes('talaromyces') || full.includes('penicillium marneffei') || full.includes('dimorphic fungi') || full.includes('thermal dimorphism')) {
    if (cur !== 212) {
      return { toModule: 212, reason: 'Tests superficial/subcutaneous/systemic dimorphic mycoses, belongs in Mycology: Superficial and Systemic Mycoses' };
    }
    return null;
  }

  // --- PARASITOLOGY ---
  // Nematodes (Mod 218)
  // Ascaris, Hookworm, Strongyloides, Enterobius, Trichuris, Wuchereria, Brugia, Loa loa, Onchocerca, Dracunculus, Trichinella, Larva migrans
  if (full.includes('ascaris') || full.includes('lumbricoides') || full.includes('loeffler syndrome') || full.includes('mammillated') ||
      full.includes('hookworm') || full.includes('ancylostoma') || full.includes('necator') || full.includes('ground itch') ||
      full.includes('strongyloides') || full.includes('stercoralis') || full.includes('rhabditiform') || full.includes('larva currens') ||
      full.includes('enterobius') || full.includes('vermicularis') || full.includes('pinworm') || full.includes('perianal itching') || full.includes('nih swab') || full.includes('scotch tape') || full.includes('planoconvex') ||
      full.includes('trichuris') || full.includes('trichiura') || full.includes('whipworm') || full.includes('bipolar plug') || full.includes('barrel shaped') ||
      full.includes('wuchereria') || full.includes('bancrofti') || full.includes('microfilaria') || full.includes('filariasis') || full.includes('elephantiasis') || full.includes('brugia') || full.includes('dec provocation') ||
      full.includes('loa loa') || full.includes('calabar swelling') || full.includes('onchocerca') || full.includes('river blindness') || full.includes('dracunculus') || full.includes('guinea worm') ||
      full.includes('trichinella') || full.includes('nurse cell') || full.includes('cutaneous larva migrans') || full.includes('visceral larva migrans') || full.includes('toxocara')) {
    if (cur !== 218) {
      return { toModule: 218, reason: 'Tests helminthology: nematodes (roundworms), belongs in Parasitology: Helminthology - Nematodes' };
    }
    return null;
  }

  // Cestodes & Trematodes (Mod 217)
  // Taenia, Echinococcus, Hymenolepis, Diphyllobothrium, Schistosoma, Fasciola, Clonorchis, Paragonimus
  if (full.includes('taenia') || full.includes('cysticercosis') || full.includes('neurocysticercosis') || full.includes('measly pork') || full.includes('proglottid') || full.includes('scolex') ||
      full.includes('echinococcus') || full.includes('hydatid') || full.includes('casoni') || full.includes('water lily sign') || full.includes('brood capsule') ||
      full.includes('hymenolepis') || full.includes('dwarf tapeworm') ||
      full.includes('diphyllobothrium') || full.includes('fish tapeworm') || full.includes('bothria') ||
      full.includes('schistosoma') || full.includes('bilharziasis') || full.includes('terminal spine') || full.includes('lateral spine') || full.includes('symmers') || full.includes('pipestem') || full.includes('swimmer\'s itch') || full.includes('katayama') ||
      full.includes('fasciola') || full.includes('fasciolopsis') || full.includes('clonorchis') || full.includes('paragonimus') || full.includes('fluke') || full.includes('trematode') || full.includes('cestode')) {
    if (cur !== 217) {
      return { toModule: 217, reason: 'Tests helminthology: cestodes (tapeworms) and trematodes (flukes), belongs in Parasitology: Helminthology - Cestodes & Trematodes' };
    }
    return null;
  }

  // Sporozoa (Mod 216)
  // Plasmodium, Toxoplasma, Cryptosporidium, Cystoisospora, Cyclospora, Babesia
  if (full.includes('plasmodium') || full.includes('malaria') || full.includes('falciparum') || full.includes('vivax') || full.includes('schuffner') || full.includes('maurer') || full.includes('blackwater fever') || full.includes('hypnozoite') || full.includes('sporozoite') || full.includes('schizont') || full.includes('merozoite') || full.includes('trophozoite') && full.includes('ring form') || full.includes('pfhrp') ||
      full.includes('toxoplasma') || full.includes('gondii') || full.includes('sabin-feldman') || full.includes('sabin feldman') || full.includes('tachyzoite') || full.includes('bradyzoite') ||
      full.includes('cryptosporidium') || full.includes('acid-fast oocyst') || full.includes('cystoisospora') || full.includes('isospora') || full.includes('cyclospora') ||
      full.includes('babesia') || full.includes('maltese cross') || full.includes('babesiosis')) {
    if (cur !== 216) {
      return { toModule: 216, reason: 'Tests protozoology: sporozoa / apicomplexa (Plasmodium/Toxoplasma/Coccidia/Babesia), belongs in Parasitology: Protozoology - Sporozoa' };
    }
    return null;
  }

  // Amoebae, Ciliates & Flagellates (Mod 215)
  // Entamoeba, Naegleria, Acanthamoeba, Giardia, Trichomonas, Leishmania, Trypanosoma, Balantidium
  if (full.includes('entamoeba') || full.includes('amoebic dysentery') || full.includes('amoebic liver abscess') || full.includes('anchovy sauce') || full.includes('flask-shaped ulcer') || full.includes('e.histolytica') || full.includes('e. histolytica') || full.includes('e.coli cyst') || full.includes('e. coli cyst') ||
      full.includes('naegleria') || full.includes('acanthamoeba') || full.includes('balamuthia') || full.includes('pam') && full.includes('swimming') ||
      full.includes('giardia') || full.includes('lamblia') || full.includes('falling leaf') || full.includes('old man appearance') || full.includes('steatorrhea') && full.includes('flagellate') ||
      full.includes('trichomonas') || full.includes('vaginalis') || full.includes('strawberry cervix') || full.includes('jerky motility') ||
      full.includes('leishmania') || full.includes('donovani') || full.includes('kala-azar') || full.includes('kala azar') || full.includes('amastigote') || full.includes('ld body') || full.includes('ld bodies') || full.includes('rk39') || full.includes('delhi boil') || full.includes('pkdl') ||
      full.includes('trypanosoma') || full.includes('cruzi') || full.includes('chagas') || full.includes('romana') || full.includes('sleeping sickness') || full.includes('winterbottom') ||
      full.includes('balantidium') || full.includes('ciliate') || full.includes('haemoflagellate')) {
    if (cur !== 215) {
      return { toModule: 215, reason: 'Tests protozoology: amoebae, flagellates, or ciliates, belongs in Parasitology: Protozoology - Amoebae, Ciliates & Flagellates' };
    }
    return null;
  }

  // General Parasitology (Mod 214)
  // General parasite classification, host definitions, general diagnostic techniques (stool concentration, wet mounts)
  if ((full.includes('definitive host') || full.includes('intermediate host') || full.includes('paratenic host') || full.includes('reservoir host') || full.includes('commensalism') || full.includes('stool concentration') || full.includes('formol ether') || full.includes('flotation technique') || full.includes('kato katz') || full.includes('sedimentation technique')) &&
      !full.includes('which species of plasmodium') && !full.includes('hookworm') && !full.includes('e.histolytica') && !full.includes('leishmania')) {
    if (cur !== 214) {
      return { toModule: 214, reason: 'Tests general parasitology terminology/diagnostic methods, belongs in Parasitology: General Parasitology' };
    }
    return null;
  }

  // --- VIROLOGY ---
  // Hepatitis (Mod 209)
  if (full.includes('hepatitis a') || full.includes('hepatitis b') || full.includes('hepatitis c') || full.includes('hepatitis d') || full.includes('hepatitis e') ||
      full.includes('hbv') || full.includes('hcv') || full.includes('hav') || full.includes('hdv') || full.includes('hev') ||
      full.includes('hbsag') || full.includes('anti-hbs') || full.includes('hbeag') || full.includes('anti-hbe') || full.includes('hbcag') || full.includes('anti-hbc') || full.includes('window period') && full.includes('hepatitis') || full.includes('dane particle')) {
    if (cur !== 209) {
      return { toModule: 209, reason: 'Tests hepatitis viruses and serology, belongs in Virology: Hepatitis' };
    }
    return null;
  }

  // Arboviruses and Picorna Viruses (Mod 210)
  // Dengue, Chikungunya, Yellow fever, Japanese encephalitis, West Nile, KFD, Polio, Coxsackie, Echovirus, Rhinovirus
  if (full.includes('dengue') || full.includes('chikungunya') || full.includes('yellow fever') || full.includes('councilman bodies') || full.includes('japanese encephalitis') || full.includes('culex tritaeniorhynchus') || full.includes('kyasanur') || full.includes('arbovirus') || full.includes('ns1 antigen') || full.includes('tourniquet test') ||
      full.includes('poliovirus') || full.includes('polio') || full.includes('sabin') && full.includes('salk') || full.includes('coxsackie') || full.includes('herpangina') || full.includes('hand foot and mouth') || full.includes('echovirus') || full.includes('rhinovirus') || full.includes('picorna')) {
    if (cur !== 210) {
      return { toModule: 210, reason: 'Tests arboviruses or picornaviruses (Dengue/Chikungunya/JE/Polio/Coxsackie), belongs in Virology: Arboviruses and Picorna Viruses' };
    }
    return null;
  }

  // General Properties of Viruses (Mod 208)
  // Capsid, symmetry, envelope, replication, cultivation, cell lines, CPE, inclusion bodies, bacteriophages
  if ((full.includes('capsid') || full.includes('icosahedral symmetry') || full.includes('helical symmetry') || full.includes('viral envelope') || full.includes('baltimore classification') || full.includes('cell culture') && full.includes('hela') || full.includes('cytopathic effect') || full.includes('plaque assay') || full.includes('bacteriophage') || full.includes('antigenic shift') && full.includes('drift') || full.includes('viral replication cycle')) &&
      !full.includes('rabies') && !full.includes('dengue') && !full.includes('hepatitis') && !full.includes('hiv') && !full.includes('measles')) {
    if (cur !== 208) {
      return { toModule: 208, reason: 'Tests fundamental virology structure/replication/classification, belongs in Virology: General Properties of Viruses' };
    }
    return null;
  }

  // Miscellaneous Viruses (Mod 211)
  // Rubella, Coronaviruses, Prions, Rotavirus, Filovirus, Zika, Nipah, Rabies, Influenza, Paramyxoviruses (Measles, Mumps, RSV), Herpesviruses (HSV, VZV, EBV, CMV, HHV-6, HHV-8), Poxviruses, Adenovirus, Parvovirus B19, Retroviruses (HIV), HPV
  if (full.includes('rubella') || full.includes('congenital rubella') || full.includes('gregg triad') ||
      full.includes('coronavirus') || full.includes('sars-cov') || full.includes('mers-cov') || full.includes('covid-19') ||
      full.includes('prion') || full.includes('creutzfeldt') || full.includes('cjd') || full.includes('kuru') || full.includes('scrapie') || full.includes('spongiform') ||
      full.includes('rotavirus') || full.includes('nsp4') || full.includes('filovirus') || full.includes('ebola') || full.includes('marburg') ||
      full.includes('zika') || full.includes('nipah') || full.includes('rabies') || full.includes('negri bod') || full.includes('hydrophobia') ||
      full.includes('influenza') || full.includes('hemagglutinin') && full.includes('neuraminidase') || full.includes('orthomyxo') ||
      full.includes('measles') || full.includes('koplik') || full.includes('sspe') || full.includes('mumps') || full.includes('parotitis') || full.includes('respiratory syncytial') || full.includes('rsv') || full.includes('parainfluenza') || full.includes('croup') ||
      full.includes('herpes') || full.includes('hsv') || full.includes('tzanck') || full.includes('varicella') || full.includes('chickenpox') || full.includes('shingles') || full.includes('zoster') ||
      full.includes('epstein-barr') || full.includes('ebv') || full.includes('infectious mononucleosis') || full.includes('paul bunnell') || full.includes('monospot') || full.includes('downey cell') || full.includes('heterophile') ||
      full.includes('cytomegalovirus') || full.includes('cmv') || full.includes('owl\'s eye') || full.includes('roseola') || full.includes('exanthema subitum') || full.includes('hhv-6') || full.includes('hhv-8') || full.includes('kaposi sarcoma') ||
      full.includes('poxvirus') || full.includes('smallpox') || full.includes('molluscum contagiosum') || full.includes('henderson-paterson') || full.includes('guarnieri') ||
      full.includes('adenovirus') || full.includes('parvovirus b19') || full.includes('erythema infectiosum') || full.includes('slapped cheek') || full.includes('aplastic crisis') ||
      full.includes('hiv') || full.includes('retrovirus') || full.includes('gp120') || full.includes('gp41') || full.includes('p24') || full.includes('human papillomavirus') || full.includes('hpv') || full.includes('koilocyte') || full.includes('jc virus') || full.includes('bk virus')) {
    if (cur !== 211) {
      return { toModule: 211, reason: 'Tests miscellaneous virus (Herpes/HIV/Rabies/Influenza/Measles/Rubella/Prions/Corona/Rotavirus/Parvovirus), belongs in Virology: Miscellaneous Viruses' };
    }
    return null;
  }

  // --- BACTERIOLOGY ---
  // Spirochetes (Mod 207)
  // Treponema (syphilis), Borrelia (Lyme, relapsing fever), Leptospira
  if (full.includes('treponema') || full.includes('syphilis') || full.includes('chancre') || full.includes('vdrl') || full.includes('rpr') || full.includes('tpha') || full.includes('fta-abs') || full.includes('condyloma lata') || full.includes('jarisch-herxheimer') || full.includes('spirochete') ||
      full.includes('borrelia') || full.includes('burgdorferi') || full.includes('lyme disease') || full.includes('erythema migrans') || full.includes('relapsing fever') ||
      full.includes('leptospira') || full.includes('leptospirosis') || full.includes('weil\'s disease') || full.includes('emjh') || full.includes('microscopic agglutination test')) {
    if (cur !== 207) {
      return { toModule: 207, reason: 'Tests spirochetes (Treponema/Borrelia/Leptospira), belongs in Bacteriology: Spirochetes' };
    }
    return null;
  }

  // Rickettsia, Chlamydia and Mycoplasma (Mod 206)
  if (full.includes('rickettsia') || full.includes('orientia') || full.includes('tsutsugamushi') || full.includes('scrub typhus') || full.includes('epidemic typhus') || full.includes('rocky mountain') || full.includes('weil-felix') || full.includes('coxiella') || full.includes('q fever') ||
      full.includes('chlamydia') || full.includes('trachomatis') || full.includes('elementary body') || full.includes('reticulate body') || full.includes('lymphogranuloma venereum') || full.includes('lgv') || full.includes('frei test') || full.includes('psittacosis') ||
      full.includes('mycoplasma') || full.includes('walking pneumonia') || full.includes('cold agglutinin') || full.includes('eaton agent') || full.includes('fried egg colony') || full.includes('ureaplasma')) {
    if (cur !== 206) {
      return { toModule: 206, reason: 'Tests Rickettsia, Chlamydia, or Mycoplasma, belongs in Bacteriology: Rickettsia, Chlamydia and Mycoplasma' };
    }
    return null;
  }

  // Gram Negative Cocci (Mod 205)
  // Neisseria meningitidis, Neisseria gonorrhoeae, Moraxella
  if (full.includes('neisseria') || full.includes('meningococc') || full.includes('gonococc') || full.includes('gonorrhoe') || full.includes('waterhouse-friderichsen') || full.includes('thayer-martin') || full.includes('moraxella')) {
    if (cur !== 205) {
      return { toModule: 205, reason: 'Tests Gram-negative cocci (Neisseria/Moraxella), belongs in Bacteriology: Gram Negative Cocci' };
    }
    return null;
  }

  // Miscellaneous Bacteria (Mod 204)
  // Yersinia, Brucella, Bartonella, Legionella, Francisella, Gardnerella
  if (full.includes('yersinia') || full.includes('plague') || full.includes('wayson') || full.includes('safety-pin') && full.includes('bipolar') ||
      full.includes('brucella') || full.includes('undulant fever') || full.includes('castaneda') || full.includes('rose bengal') ||
      full.includes('bartonella') || full.includes('cat scratch') || full.includes('bacillary angiomatosis') || full.includes('carrion') ||
      full.includes('legionella') || full.includes('legionnaires') || full.includes('pontiac fever') || full.includes('bcye') ||
      full.includes('francisella') || full.includes('tularemia') || full.includes('gardnerella') || full.includes('clue cell') || full.includes('whiff test') || full.includes('rat-bite fever')) {
    if (cur !== 204) {
      return { toModule: 204, reason: 'Tests miscellaneous bacteria (Yersinia/Brucella/Bartonella/Legionella/Gardnerella), belongs in Bacteriology: Miscellaneous Bacteria' };
    }
    return null;
  }

  // Haemophilus & Bordetella (Mod 203)
  if (full.includes('haemophilus') || full.includes('satellitism') || full.includes('x and v factor') || full.includes('chancroid') || full.includes('ducreyi') || full.includes('school of fish') ||
      full.includes('bordetella') || full.includes('pertussis') || full.includes('whooping cough') || full.includes('bordet-gengou') || full.includes('regan-lowe')) {
    if (cur !== 203) {
      return { toModule: 203, reason: 'Tests Haemophilus or Bordetella, belongs in Bacteriology: Haemophilus' };
    }
    return null;
  }

  // Pseudomonas and Burkholderiales (Mod 202)
  if (full.includes('pseudomonas') || full.includes('pyocyanin') || full.includes('pyoverdine') || full.includes('cetrimide') || full.includes('ecthyma gangrenosum') ||
      full.includes('burkholderia') || full.includes('melioidosis') || full.includes('glanders') || full.includes('ashdown') || full.includes('stenotrophomonas') || full.includes('acinetobacter')) {
    if (cur !== 202) {
      return { toModule: 202, reason: 'Tests Pseudomonas or Burkholderiales, belongs in Bacteriology: Pseudomonas and Burkholderiales' };
    }
    return null;
  }

  // Vibrio and Campylobacterales (Mod 201)
  if (full.includes('vibrio') || full.includes('cholera') || full.includes('rice-water') || full.includes('tcbs') || full.includes('darting motility') || full.includes('kanagawa') ||
      full.includes('campylobacter') || full.includes('gull-wing') || full.includes('skirrow') ||
      full.includes('helicobacter') || full.includes('h. pylori') || full.includes('h.pylori') || full.includes('urea breath test') || full.includes('rapid urease')) {
    if (cur !== 201) {
      return { toModule: 201, reason: 'Tests Vibrio, Campylobacter, or Helicobacter, belongs in Bacteriology: Vibrio and Campylobacterales' };
    }
    return null;
  }

  // Shigella and Salmonella (Mod 200)
  if (full.includes('salmonella') || full.includes('typhoid') || full.includes('enteric fever') || full.includes('widal') || full.includes('rose spot') || full.includes('wilson and blair') ||
      full.includes('shigella') || full.includes('shiga toxin') || full.includes('bacillary dysentery')) {
    if (cur !== 200) {
      return { toModule: 200, reason: 'Tests Salmonella or Shigella, belongs in Bacteriology: Shigella and Salmonella' };
    }
    return null;
  }

  // Escherichia, Proteus and Klebsiella (Mod 199)
  if (full.includes('escherichia') || full.includes('e. coli') || full.includes('e.coli') || full.includes('etec') || full.includes('ehec') || full.includes('epec') || full.includes('eiec') || full.includes('eaec') || full.includes('o157:h7') || full.includes('smac agar') ||
      full.includes('klebsiella') || full.includes('red currant jelly') || full.includes('string test') || full.includes('rhinoscleroma') || full.includes('mikulicz') || full.includes('donovanosis') || full.includes('donovan bodies') ||
      full.includes('proteus') || full.includes('swarming motility') || full.includes('dienes phenomenon') || full.includes('struvite') || full.includes('staghorn')) {
    if (cur !== 199) {
      return { toModule: 199, reason: 'Tests coliforms (Escherichia/Proteus/Klebsiella), belongs in Bacteriology: Escherichia, Proteus and Klebsiella' };
    }
    return null;
  }

  // Other Mycobacteria (Mod 198)
  // M. leprae, NTM / Runyon classification
  if (full.includes('mycobacterium leprae') || full.includes('m. leprae') || full.includes('m.leprae') || full.includes('hansen\'s disease') || full.includes('lepromin') || full.includes('facies leonina') || full.includes('erythema nodosum leprosum') || full.includes('reversal reaction') ||
      full.includes('runyon') || full.includes('photochromogen') || full.includes('scotochromogen') || full.includes('mycobacterium kansasii') || full.includes('mycobacterium marinum') || full.includes('fish tank granuloma') || full.includes('mycobacterium avium') || full.includes('buruli ulcer') || full.includes('mycobacterium ulcerans') || full.includes('mycobacterium fortuitum')) {
    if (cur !== 198) {
      return { toModule: 198, reason: 'Tests M. leprae or NTM (Runyon groups), belongs in Bacteriology: Other Mycobacteria' };
    }
    return null;
  }

  // Mycobacteria Tuberculosis (Mod 197)
  if (full.includes('mycobacterium tuberculosis') || full.includes('m. tuberculosis') || full.includes('m.tuberculosis') || full.includes('tubercle bacilli') || full.includes('lowenstein-jensen') || full.includes('lj medium') || full.includes('mantoux') || full.includes('tuberculin test') || full.includes('cbnaat') || full.includes('genexpert') || full.includes('cord factor') || full.includes('ghon focus') || full.includes('niacin test') || full.includes('mgit')) {
    if (cur !== 197) {
      return { toModule: 197, reason: 'Tests Mycobacterium tuberculosis, belongs in Bacteriology: Mycobacteria Tuberculosis' };
    }
    return null;
  }

  // Clostridium and Bacillus (Mod 196)
  if (full.includes('clostridium') || full.includes('tetani') || full.includes('tetanospasmin') || full.includes('lockjaw') || full.includes('trismus') || full.includes('risus sardonicus') || full.includes('botulinum') || full.includes('botulism') || full.includes('floppy baby') ||
      full.includes('perfringens') || full.includes('gas gangrene') || full.includes('nagler') || full.includes('stormy fermentation') || full.includes('difficile') || full.includes('pseudomembranous colitis') ||
      full.includes('bacillus anthracis') || full.includes('anthrax') || full.includes('mcfadyean') || full.includes('medusa head') || full.includes('string of pearls') || full.includes('malignant pustule') || full.includes('bacillus cereus')) {
    if (cur !== 196) {
      return { toModule: 196, reason: 'Tests spore-forming bacilli (Clostridium and Bacillus), belongs in Bacteriology: Clostridium and Bacillus' };
    }
    return null;
  }

  // Corynebacterium, Listeria and Actinomyces (Mod 195)
  if (full.includes('corynebacterium') || full.includes('diphtheriae') || full.includes('diphtheria toxin') || full.includes('albert stain') || full.includes('elek') || full.includes('loeffler') || full.includes('tinsdale') || full.includes('schick test') ||
      full.includes('listeria') || full.includes('monocytogenes') || full.includes('tumbling motility') || full.includes('cold enrichment') || full.includes('actin rockets') ||
      full.includes('actinomyces') || full.includes('israelii') || full.includes('sulfur granules') || full.includes('lumpy jaw') ||
      full.includes('nocardia') || full.includes('modified kinyoun') || full.includes('partially acid-fast')) {
    if (cur !== 195) {
      return { toModule: 195, reason: 'Tests Corynebacterium, Listeria, Actinomyces, or Nocardia, belongs in Bacteriology: Corynebacterium, Listeria and Actinomyces' };
    }
    return null;
  }

  // Streptococci, Enterococci, and Staphylococci (Mod 194)
  if (full.includes('streptococc') || full.includes('streptococcus pyogenes') || full.includes('pneumococc') || full.includes('streptococcus pneumoniae') || full.includes('optochin') || full.includes('bile solubility') || full.includes('quellung') || full.includes('viridans') || full.includes('camp test') || full.includes('rheumatic fever') || full.includes('psgn') ||
      full.includes('enterococc') || full.includes('vre') || full.includes('bile esculin') ||
      full.includes('staphylococc') || full.includes('s. aureus') || full.includes('s.aureus') || full.includes('mrsa') || full.includes('protein a') || full.includes('coagulase') && full.includes('catalase positive') || full.includes('tsst') || full.includes('scalded skin syndrome') || full.includes('ssss') || full.includes('novobiocin')) {
    if (cur !== 194) {
      return { toModule: 194, reason: 'Tests Gram-positive cocci (Streptococci, Enterococci, Staphylococci), belongs in Bacteriology: Streptococci and Enterococci' };
    }
    return null;
  }

  // --- APPLIED MICROBIOLOGY (Mod 219) ---
  if (full.includes('hospital-acquired infection') || full.includes('nosocomial') || full.includes('clabsi') || full.includes('cauti') || full.includes('surgical site infection') || full.includes('vap') && full.includes('ventilator') ||
      full.includes('biomedical waste') || full.includes('bmw rules') || full.includes('yellow bag') || full.includes('red bag') || full.includes('puncture proof') || full.includes('blue container') ||
      full.includes('cssd') || full.includes('biological indicator') || full.includes('geobacillus stearothermophilus') || full.includes('bacillus atrophaeus') || full.includes('bowie-dick') ||
      full.includes('spaulding') || full.includes('hand hygiene') || full.includes('who moments') || full.includes('needle stick') || full.includes('most probable number') || full.includes('mpn') || full.includes('presumptive coliform') || full.includes('settle plate')) {
    if (cur !== 219) {
      return { toModule: 219, reason: 'Tests hospital infection control, BMW, sterilization monitoring, or surveillance, belongs in Applied Microbiology' };
    }
    return null;
  }

  // --- IMMUNOLOGY (Modules 191, 192, 193) ---
  // Hypersensitivity, Autoimmunity, Immunodeficiency, Transplantation (Mod 193)
  if (full.includes('hypersensitivity') || full.includes('type i hyper') || full.includes('type ii hyper') || full.includes('type iii hyper') || full.includes('type iv hyper') || full.includes('anaphylaxis') || full.includes('arthus reaction') || full.includes('serum sickness') ||
      full.includes('autoimmune') || full.includes('autoantibody') || full.includes('scid') || full.includes('bruton') || full.includes('agammaglobulinemia') || full.includes('digeorge') || full.includes('chronic granulomatous disease') || full.includes('chediak-higashi') || full.includes('wiskott-aldrich') || full.includes('hyper-ige') || full.includes('hyper igm') || full.includes('cvid') || full.includes('lad') && full.includes('leukocyte adhesion') ||
      full.includes('graft rejection') || full.includes('transplantation') || full.includes('gvhd') || full.includes('allograft')) {
    if (cur !== 193) {
      return { toModule: 193, reason: 'Tests hypersensitivity, autoimmunity, immunodeficiency, or transplantation immunology, belongs in Immunology: Hypersensitivity' };
    }
    return null;
  }

  // Structure and Functions of Immune System (Mod 192)
  // Antigens, Antibodies/Immunoglobulins, Ag-Ab reactions, MHC, T/B cell development, vaccines principles
  if (full.includes('immunoglobulin') || full.includes('antibody') || full.includes('heavy chain') || full.includes('light chain') || full.includes('fab') || full.includes('fc fragment') || full.includes('hypervariable') || full.includes('cdr') || full.includes('isotype') || full.includes('allotype') || full.includes('idiotype') || full.includes('class switching') ||
      full.includes('antigen-antibody reaction') || full.includes('precipitation reaction') || full.includes('agglutination reaction') || full.includes('elisa') || full.includes('western blot') || full.includes('flow cytometry') || full.includes('coombs test') || full.includes('prozone') || full.includes('flocculation') ||
      full.includes('mhc class') || full.includes('major histocompatibility') || full.includes('human leukocyte antigen') || full.includes('hla-') || full.includes('antigen presentation') || full.includes('invariant chain') || full.includes('tap transporter') ||
      full.includes('t-cell receptor') || full.includes('b-cell receptor') || full.includes('thymic selection') || full.includes('cell-mediated immunity') || full.includes('humoral immunity') || full.includes('clonal selection') || full.includes('immune tolerance') ||
      (full.includes('live attenuated vaccine') || full.includes('killed vaccine') || full.includes('toxoid vaccine') || full.includes('conjugate vaccine')) && text.includes('which of the following is')) {
    if (cur !== 192) {
      return { toModule: 192, reason: 'Tests immunoglobulins, Ag-Ab reactions, MHC/HLA, or immune response principles, belongs in Immunology: Structure and Functions of the Immune System & Immune Response' };
    }
    return null;
  }

  // Components of Immune System (Mod 191)
  // Innate immunity, cells (NK cells, macrophages, neutrophils), complement system, cytokines, TLRs, lymphoid organs
  if (full.includes('innate immunity') || full.includes('natural killer') || full.includes('nk cell') || full.includes('cd16') || full.includes('cd56') || full.includes('macrophage') || full.includes('dendritic cell') || full.includes('neutrophil') ||
      full.includes('complement pathway') || full.includes('classical pathway') || full.includes('alternative pathway') || full.includes('lectin pathway') || full.includes('membrane attack complex') || full.includes('c3 convertase') || full.includes('c5 convertase') || full.includes('c1-inh') || full.includes('decay-accelerating') ||
      full.includes('toll-like receptor') || full.includes('tlr') || full.includes('pattern recognition receptor') || full.includes('pamp') || full.includes('inflammasome') ||
      full.includes('interleukin') || full.includes('cytokine') || full.includes('chemokine') || full.includes('interferon') || full.includes('tnf-alpha') ||
      full.includes('thymus') || full.includes('spleen') || full.includes('lymph node anatomy') || full.includes('malt')) {
    if (cur !== 191) {
      return { toModule: 191, reason: 'Tests innate immunity, complement, cytokines, TLRs, or immune cells, belongs in Immunology: Components of Immune System' };
    }
    return null;
  }

  // If currently in a specific module but doesn't belong, or stays in 190 if general bacteriology
  return null;
}

// Let's run the classifier on all questions
const candidateMoves = [];
for (const q of allQuestions) {
  const res = classifyQuestion(q);
  if (res && res.toModule !== q.current_module) {
    candidateMoves.push({
      id: q.id,
      fromModule: q.current_module,
      toModule: res.toModule,
      fromName: modMap[q.current_module] ? modMap[q.current_module].moduleName : '',
      toName: modMap[res.toModule] ? modMap[res.toModule].moduleName : '',
      subject: modMap[res.toModule] ? modMap[res.toModule].subjectName : '',
      reason: res.reason,
      q_text: q.q_text.slice(0, 100)
    });
  }
}

console.log('Candidate moves identified:', candidateMoves.length);

// Breakdown by destination subject
const subCounts = {};
candidateMoves.forEach(m => {
  subCounts[m.subject] = (subCounts[m.subject] || 0) + 1;
});
console.log('Moves by destination subject:', subCounts);

// Breakdown by fromModule
const fromCounts = {};
candidateMoves.forEach(m => {
  fromCounts[m.fromModule] = (fromCounts[m.fromModule] || 0) + 1;
});
console.log('Moves by source module:', fromCounts);

fs.writeFileSync('tools/candidate_moves.json', JSON.stringify(candidateMoves, null, 2));
console.log('Saved tools/candidate_moves.json');
process.exit(0);
