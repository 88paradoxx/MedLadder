const fs = require('fs');

const remaining = JSON.parse(fs.readFileSync('tools/dump_unclassified_remaining.json', 'utf8'));
const raw = JSON.parse(fs.readFileSync('tools/raw_medicine.json', 'utf8'));
const idToMod = {};
raw.forEach(q => idToMod[q.id] = q.module_id);

const moves = [];

remaining.forEach(q => {
  const full = (q.full || (q.text + ' ' + (q.explanation || ''))).toLowerCase();
  const text = q.text.toLowerCase();
  const ans = (q.ansText || '').toLowerCase();
  const id = q.id;
  const fromModule = idToMod[id];

  // Helper matching
  const has = (w) => full.includes(w);
  const hasT = (w) => text.includes(w);
  const hasA = (w) => ans.includes(w);

  // Check if genuine IBD in 433/434 or genuine IBS in 432
  // Genuine IBD in 433:
  if (fromModule === 433) {
    if (id === 2791) {
      // "A 45-year-old patient undergoes complete ileal and partial jejunal resection due to Crohn's disease." -> tests post-resection malabsorption/B12 deficiency or IBD complication. Could stay in 433 or malabsorption (428). Let's keep genuine Crohn's resection in 433.
      return;
    }
    if (id === 17178 || id === 17179 || id === 17181 || id === 17182 || id === 17187 || id === 17201 || id === 17548) {
      // Genuine UC / Crohn's clinical features / extraintestinal manifestations! Keep in 433.
      return;
    }
  }
  // Genuine IBD Rx in 434:
  if (fromModule === 434) {
    if (id === 17253) {
      // "A 35-year-old woman with Crohn's disease has a history of a right hemicolectomy... cholestyramine" - bile acid diarrhea post Crohn's resection. Keep in 434.
      return;
    }
  }
  // Genuine IBS in 432:
  if (fromModule === 432) {
    if (id === 17166 || id === 17167 || id === 17168) {
      // Genuine IBS diagnosis/symptoms! Keep in 432.
      return;
    }
  }

  // Now classify all the rest:
  if (id === 9744) {
    moves.push({ id, fromModule, toModule: 541, reason: "Tests maternal folate deficiency and anemia in pregnancy, belongs in Obstetrics: Medical Conditions Complicating Pregnancy." });
  } else if (id === 16204) {
    moves.push({ id, fromModule, toModule: 218, reason: "Tests clinical manifestations of herpes simplex virus (HSV-1), belongs in Microbiology: DNA Viruses - Herpesviruses." });
  } else if (id === 16206) {
    moves.push({ id, fromModule, toModule: 262, reason: "Tests nitrate-induced methemoglobinemia toxicology, belongs in Forensic Medicine: Toxicology." });
  } else if (id === 16207) {
    moves.push({ id, fromModule, toModule: 413, reason: "Tests seasonal allergic rhinitis / rhinoconjunctivitis and environmental aeroallergens, belongs in Medicine: Allergic Disorders." });
  } else if (id === 16218) {
    moves.push({ id, fromModule, toModule: 610, reason: "Tests rotator cuff tendonitis (supraspinatus pathology), belongs in Orthopedics: Shoulder & Arm." });
  } else if (id === 16221) {
    moves.push({ id, fromModule, toModule: 436, reason: "Tests hepatitis E viral infection epidemiology and fulminant mortality in pregnancy, belongs in Medicine: Acute Viral Hepatitis." });
  } else if (id === 16226) {
    moves.push({ id, fromModule, toModule: 472, reason: "Tests myelophthisic anemia pathophysiology and marrow infiltration, belongs in Medicine: Aplastic & Myelophthisic Anemias." });
  } else if (id === 16227) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests iron indices and transferrin saturation calculation, belongs in Medicine: Iron Deficiency Anemia." });
  } else if (id === 16228 || id === 16229) {
    moves.push({ id, fromModule, toModule: 479, reason: "Tests cancer risk factors and oncologic epidemiology, belongs in Medicine: Principles of Oncology." });
  } else if (id === 16230) {
    moves.push({ id, fromModule, toModule: 104, reason: "Tests ABO blood group genetics and chromosomal localization (9q34), belongs in Physiology: Blood & Immunity." });
  } else if (id === 16232) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests microcytic erythrocytosis differentials (thalassemia vs polycythemia vera), belongs in Medicine: Iron Deficiency & Microcytic Anemias." });
  } else if (id === 16233) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests severe hemophilia A factor VIII threshold classification (<1%), belongs in Medicine: Bleeding Disorders." });
  } else if (id === 16235) {
    moves.push({ id, fromModule, toModule: 428, reason: "Tests ileocecal tuberculosis and small bowel pathology, belongs in Medicine: Malabsorption & Small Bowel Diseases." });
  } else if (id === 16237) {
    moves.push({ id, fromModule, toModule: 477, reason: "Tests localized lymphadenopathy patterns in adults, belongs in Medicine: Lymphadenopathy & Splenomegaly." });
  } else if (id === 16240) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests genital warts (condylomata acuminata) anatomical distribution, belongs in Dermatology: Viral Infections & STDs." });
  } else if (id === 16243) {
    moves.push({ id, fromModule, toModule: 221, reason: "Tests mucormycosis fungal etiology (Rhizopus), belongs in Microbiology: Mycology." });
  } else if (id === 16252) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests most common sexually transmitted viral pathogen (HPV), belongs in Dermatology: Viral Infections & STDs." });
  } else if (id === 16253) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests nongonococcal urethritis etiology (Chlamydia trachomatis), belongs in Dermatology: Viral Infections & STDs." });
  } else if (id === 16254) {
    moves.push({ id, fromModule, toModule: 213, reason: "Tests traveler's diarrhea bacteriology (ETEC), belongs in Microbiology: Gram-Negative Bacilli - Enterobacteriaceae." });
  } else if (id === 16260) {
    moves.push({ id, fromModule, toModule: 521, reason: "Tests abnormal uterine bleeding and endocrine evaluation in perimenopause, belongs in Gynecology: Abnormal Uterine Bleeding." });
  } else if (id === 16266) {
    moves.push({ id, fromModule, toModule: 461, reason: "Tests rheumatoid arthritis hematologic abnormalities (anemia of chronic disease), belongs in Medicine: Rheumatoid Arthritis." });
  } else if (id === 16267) {
    moves.push({ id, fromModule, toModule: 512, reason: "Tests post-procedural urinary tract instrumentation infection, belongs in Surgery: Urology - Genitourinary Infections." });
  } else if (id === 16269) {
    moves.push({ id, fromModule, toModule: 453, reason: "Tests etiology of complicated urinary tract infection, belongs in Medicine: Urinary Tract Infections." });
  } else if (id === 16279) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests drug-induced immune thrombocytopenia (vancomycin-induced), belongs in Medicine: Bleeding Disorders & Thrombocytopenia." });
  } else if (id === 16386) {
    moves.push({ id, fromModule, toModule: 449, reason: "Tests Goodpasture syndrome / pulmonary-renal syndrome basement membrane staining, belongs in Medicine: Glomerular Diseases." });
  } else if (id === 16533) {
    moves.push({ id, fromModule, toModule: 211, reason: "Tests food poisoning toxins (Staphylococcus aureus enterotoxin), belongs in Microbiology: Gram-Positive Cocci." });
  } else if (id === 16537) {
    moves.push({ id, fromModule, toModule: 466, reason: "Tests Lambert-Eaton myasthenic syndrome paraneoplastic association with small cell lung cancer, belongs in Medicine: Neuromuscular Junction Disorders." });
  } else if (id === 16538) {
    moves.push({ id, fromModule, toModule: 648, reason: "Tests LEOPARD syndrome multisystem neuro-cardio-facial-cutaneous features, belongs in Pediatrics / Dermatology: Genodermatoses." });
  } else if (id === 16545) {
    moves.push({ id, fromModule, toModule: 423, reason: "Tests carcinoid tumor, elevated urinary 5-HIAA, and carcinoid syndrome, belongs in Medicine: Neuroendocrine Tumors." });
  } else if (id === 16548) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests parietal lobe lesions producing homonymous inferior quadrantanopia, belongs in Medicine: Cerebrovascular Disorders / Stroke Localization." });
  } else if (id === 16559) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests lateral medullary syndrome / Wallenberg syndrome caused by vertebral / PICA occlusion, belongs in Medicine: Cerebrovascular Disease." });
  } else if (id === 16595) {
    moves.push({ id, fromModule, toModule: 442, reason: "Tests tuberculous lymphadenitis (scrofula) clinical presentation, belongs in Medicine: Tuberculosis." });
  } else if (id === 16597) {
    moves.push({ id, fromModule, toModule: 460, reason: "Tests ankylosing spondylitis presenting with inflammatory low back pain and sacroiliitis, belongs in Medicine: Spondyloarthropathies." });
  } else if (id === 16787) {
    moves.push({ id, fromModule, toModule: 450, reason: "Tests urinary sodium excretion interpretation in volume depletion and ketonuria, belongs in Medicine: Fluid & Electrolyte Disorders." });
  } else if (id === 16790) {
    moves.push({ id, fromModule, toModule: 418, reason: "Tests ADA treatment goals and management targets for Type 2 Diabetes, belongs in Medicine: Management of Diabetes." });
  } else if (id === 16792) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests quadrantic hemianopia visual pathway cortical and subcortical localization, belongs in Medicine: Neurologic Localization & Stroke." });
  } else if (id === 16816) {
    moves.push({ id, fromModule, toModule: 418, reason: "Tests oral hypoglycemic agents safe in renal failure (linagliptin, repaglinide), belongs in Medicine: Management of Diabetes." });
  } else if (id === 16844) {
    moves.push({ id, fromModule, toModule: 565, reason: "Tests Turner syndrome clinical screening and workup, belongs in Pediatrics: Genetics & Chromosomal Disorders." });
  } else if (id === 16896) {
    moves.push({ id, fromModule, toModule: 444, reason: "Tests DASH diet guidelines in hypertension non-pharmacologic management, belongs in Medicine: Hypertension." });
  } else if (id === 16959) {
    moves.push({ id, fromModule, toModule: 574, reason: "Tests Gaucher disease glucocerebrosidase deficiency and lipid storage manifestations, belongs in Pediatrics: Inborn Errors of Metabolism." });
  } else if (id === 16972) {
    moves.push({ id, fromModule, toModule: 440, reason: "Tests IVC filter indications and contraindications in venous thromboembolism, belongs in Medicine: Venous Thromboembolism & Pulmonary Embolism." });
  } else if (id === 16978) {
    moves.push({ id, fromModule, toModule: 214, reason: "Tests Haemophilus influenzae bacteriology and invasive capsular strains, belongs in Microbiology: Gram-Negative Bacilli." });
  } else if (id === 16979) {
    moves.push({ id, fromModule, toModule: 213, reason: "Tests Yersinia enterocolitica vs Yersinia pestis microbiology, belongs in Microbiology: Gram-Negative Bacilli - Enterobacteriaceae." });
  } else if (id === 16980) {
    moves.push({ id, fromModule, toModule: 367, reason: "Tests international public health disease surveillance (polio), belongs in Community Medicine: Epidemiology & Disease Surveillance." });
  } else if (id === 16990) {
    moves.push({ id, fromModule, toModule: 415, reason: "Tests Wolff-Chaikoff effect autoregulatory inhibition of thyroid hormone synthesis by iodine, belongs in Medicine: Thyroid Disorders." });
  } else if (id === 17000) {
    moves.push({ id, fromModule, toModule: 473, reason: "Tests sickle cell anemia vaso-occlusive crisis with dactylitis and acute chest pain, belongs in Medicine: Hemolytic Anemias." });
  } else if (id === 17001) {
    moves.push({ id, fromModule, toModule: 441, reason: "Tests pulmonary alveolar proteinosis etiology (autoimmune anti-GM-CSF), belongs in Medicine: Interstitial Lung Diseases." });
  } else if (id === 17003) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests sideroblastic anemia microcytic features with normal/high ferritin, belongs in Medicine: Iron Deficiency & Microcytic Anemias." });
  } else if (id === 17013) {
    moves.push({ id, fromModule, toModule: 439, reason: "Tests alpha-1 antitrypsin deficiency PiZZ genotype and COPD/emphysema association, belongs in Medicine: COPD." });
  } else if (id === 17015) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests Neisseria gonorrhoeae acute urethritis in males, belongs in Dermatology: Viral Infections & STDs." });
  } else if (id === 17017) {
    moves.push({ id, fromModule, toModule: 562, reason: "Tests neonatal hepatitis B management with Hep B vaccine and immunoglobulin, belongs in Pediatrics: Neonatal Care & Infections." });
  } else if (id === 17020) {
    moves.push({ id, fromModule, toModule: 219, reason: "Tests Norovirus viral gastroenteritis outbreaks in adults, belongs in Microbiology: RNA Viruses." });
  } else if (id === 17072) {
    moves.push({ id, fromModule, toModule: 420, reason: "Tests familial hypercholesterolemia, tendon xanthomas, and elevated LDL, belongs in Medicine: Dyslipidemias." });
  } else if (id === 17075) {
    moves.push({ id, fromModule, toModule: 437, reason: "Tests hepatitis C cirrhosis and hepatocellular carcinoma oncogenesis, belongs in Medicine: Chronic Hepatitis & Cirrhosis." });
  } else if (id === 17125) {
    moves.push({ id, fromModule, toModule: 437, reason: "Tests Zieve's syndrome (alcohol-induced fatty liver, hemolytic anemia, and jaundice), belongs in Medicine: Alcoholic Liver Disease & Cirrhosis." });
  } else if (id === 17129) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests thrombotic microangiopathy in POEMS syndrome / plasma cell dyscrasias, belongs in Medicine: Bleeding & Thrombotic Disorders." });
  } else if (id === 17165) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests hereditary hemorrhagic telangiectasia (Osler-Weber-Rendu) inheritance and iron deficiency anemia, belongs in Medicine: Bleeding Disorders." });
  } else if (id === 17180) {
    moves.push({ id, fromModule, toModule: 462, reason: "Tests Behcet disease with recurrent oral and genital aphthous ulcers, belongs in Medicine: Systemic Vasculitides." });
  } else if (id === 17186) {
    moves.push({ id, fromModule, toModule: 431, reason: "Tests diagnostic evaluation of persistent lower GI diarrhea and colonoscopy, belongs in Medicine: Colorectal Diseases." });
  } else if (id === 17189) {
    moves.push({ id, fromModule, toModule: 431, reason: "Tests melanosis coli and laxative abuse causing alternating bowel habits, belongs in Medicine: Colorectal Diseases." });
  } else if (id === 17200) {
    moves.push({ id, fromModule, toModule: 428, reason: "Tests ileocecal tuberculosis presentation mimicking Crohn's disease, belongs in Medicine: Malabsorption & Small Bowel Diseases." });
  } else if (id === 17202) {
    moves.push({ id, fromModule, toModule: 460, reason: "Tests IL-17/IL-23 immunopathogenesis in psoriatic arthritis, belongs in Medicine: Spondyloarthropathies." });
  } else if (id === 17207) {
    moves.push({ id, fromModule, toModule: 459, reason: "Tests drug-induced lupus erythematosus caused by procainamide, belongs in Medicine: Systemic Lupus Erythematosus." });
  } else if (id === 17212) {
    moves.push({ id, fromModule, toModule: 428, reason: "Tests acute infectious diarrhea and empiric fluoroquinolone antimicrobial therapy, belongs in Medicine: Malabsorption & Diarrhea." });
  } else if (id === 17213) {
    moves.push({ id, fromModule, toModule: 453, reason: "Tests first-line antimicrobial therapy for acute uncomplicated cystitis, belongs in Medicine: Urinary Tract Infections." });
  } else if (id === 17215) {
    moves.push({ id, fromModule, toModule: 631, reason: "Tests management of congenital dacryocystitis (Crigler massage), belongs in Ophthalmology: Lacrimal System & Orbit." });
  } else if (id === 17224 || id === 17233 || id === 17234 || id === 17280) {
    moves.push({ id, fromModule, toModule: 541, reason: "Tests urinary tract infection and asymptomatic bacteriuria treatment in pregnancy, belongs in Obstetrics: Medical Conditions Complicating Pregnancy." });
  } else if (id === 17230 || id === 17231 || id === 17259 || id === 17260 || id === 17261 || id === 17262) {
    moves.push({ id, fromModule, toModule: 442, reason: "Tests anti-tubercular therapy (BPaL, AKT multidrug regimens, isoniazid resistance management), belongs in Medicine: Tuberculosis." });
  } else if (id === 17232) {
    moves.push({ id, fromModule, toModule: 541, reason: "Tests toxoplasmosis management in pregnancy with spiramycin, belongs in Obstetrics: Medical Conditions Complicating Pregnancy." });
  } else if (id === 17237) {
    moves.push({ id, fromModule, toModule: 438, reason: "Tests Legionella pneumophila pneumonia treatment with azithromycin, belongs in Medicine: Pneumonia." });
  } else if (id === 17246) {
    moves.push({ id, fromModule, toModule: 444, reason: "Tests management of orthostatic hypotension and blood pressure dysregulation, belongs in Medicine: Hypertension & Hemodynamics." });
  } else if (id === 17257 || id === 17263) {
    moves.push({ id, fromModule, toModule: 426, reason: "Tests Helicobacter pylori eradication triple therapy and urea breath test confirmation, belongs in Medicine: Peptic Ulcer Disease." });
  } else if (id === 17258) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests treatment of sideroblastic anemia with pyridoxine (vitamin B6), belongs in Medicine: Iron Deficiency & Microcytic Anemias." });
  } else if (id === 17269 || id === 17271 || id === 17272) {
    moves.push({ id, fromModule, toModule: 461, reason: "Tests rheumatoid arthritis treatment targets, DMARDs contraindications in pregnancy, and TNF inhibitors, belongs in Medicine: Rheumatoid Arthritis." });
  } else if (id === 17283) {
    moves.push({ id, fromModule, toModule: 446, reason: "Tests digoxin pharmacokinetics and dosing in heart failure, belongs in Medicine: Heart Failure." });
  } else if (id === 17284) {
    moves.push({ id, fromModule, toModule: 437, reason: "Tests Wilson's disease maintenance therapy with zinc / copper chelation, belongs in Medicine: Cirrhosis & Metabolic Liver Diseases." });
  } else if (id === 17285) {
    moves.push({ id, fromModule, toModule: 465, reason: "Tests restless leg syndrome treatment with dopamine agonists (pramipexole), belongs in Medicine: Movement Disorders." });
  } else if (id === 17288) {
    moves.push({ id, fromModule, toModule: 476, reason: "Tests acute myeloid leukemia induction 7+3 chemotherapy (cytarabine + daunorubicin), belongs in Medicine: Acute Leukemias & Myeloproliferative Disorders." });
  } else if (id === 17289) {
    moves.push({ id, fromModule, toModule: 425, reason: "Tests Candida esophagitis in immunocompromised host treated with fluconazole, belongs in Medicine: Esophageal Disorders." });
  } else if (id === 17296) {
    moves.push({ id, fromModule, toModule: 507, reason: "Tests acute management of elevated intracranial pressure / traumatic brain injury with mannitol, belongs in Surgery: Neurosurgery - Head Injury." });
  } else if (id === 17307) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests koilonychia in iron deficiency anemia and malabsorption, belongs in Medicine: Iron Deficiency Anemia." });
  } else if (id === 17318) {
    moves.push({ id, fromModule, toModule: 428, reason: "Tests small bowel biopsy diagnostic utility in celiac disease / malabsorption, belongs in Medicine: Malabsorption & Small Bowel Diseases." });
  } else if (id === 17320) {
    moves.push({ id, fromModule, toModule: 428, reason: "Tests tropical sprue clinical presentation and treatment with antibiotics + folate, belongs in Medicine: Malabsorption & Small Bowel Diseases." });
  } else if (id === 17323) {
    moves.push({ id, fromModule, toModule: 425, reason: "Tests progressive dysphagia and initial diagnostic evaluation with upper GI endoscopy, belongs in Medicine: Esophageal Disorders." });
  } else if (id === 17341) {
    moves.push({ id, fromModule, toModule: 460, reason: "Tests disseminated gonococcal arthritis / septic monoarthritis, belongs in Medicine: Infectious & Reactive Arthritides." });
  } else if (id === 17343 || id === 17361 || id === 18559) {
    moves.push({ id, fromModule, toModule: 448, reason: "Tests patent ductus arteriosus, differential cyanosis, and Eisenmenger physiology, belongs in Medicine: Congenital Heart Diseases in Adults." });
  } else if (id === 17349) {
    moves.push({ id, fromModule, toModule: 444, reason: "Tests Monckeberg medial calcific sclerosis vascular pathology, belongs in Medicine: Vascular Diseases & Arteriosclerosis." });
  } else if (id === 17380) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests molluscum contagiosum poxvirus skin eruption, belongs in Dermatology: Viral Infections." });
  } else if (id === 17381) {
    moves.push({ id, fromModule, toModule: 577, reason: "Tests Duchenne muscular dystrophy dystrophin deficiency, belongs in Pediatrics: Pediatric Neurology & Muscle Disorders." });
  } else if (id === 17382) {
    moves.push({ id, fromModule, toModule: 647, reason: "Tests acrodermatitis enteropathica and zinc deficiency dermatitis, belongs in Dermatology: Nutritional Dermatoses." });
  } else if (id === 17394) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests pinpoint pupils in pontine hemorrhage, belongs in Medicine: Stroke & Cerebrovascular Disorders." });
  } else if (id === 17417) {
    moves.push({ id, fromModule, toModule: 614, reason: "Tests greenstick fracture pathophysiology in pediatric bone, belongs in Orthopedics: Pediatric Orthopedics & Fractures." });
  } else if (id === 17461 || id === 18260 || id === 18362) {
    moves.push({ id, fromModule, toModule: 448, reason: "Tests congenital heart disease classifications (Ebstein anomaly, TGA, PDA), belongs in Medicine: Congenital Heart Diseases in Adults." });
  } else if (id === 17482) {
    moves.push({ id, fromModule, toModule: 462, reason: "Tests granulomatosis with polyangiitis (PR3 / c-ANCA vasculitis), belongs in Medicine: Systemic Vasculitides." });
  } else if (id === 17507 || id === 17547) {
    moves.push({ id, fromModule, toModule: 460, reason: "Tests ankylosing spondylitis and syndesmophyte patterns in sacroiliitis, belongs in Medicine: Spondyloarthropathies." });
  } else if (id === 17521) {
    moves.push({ id, fromModule, toModule: 462, reason: "Tests autoinflammatory syndromes and Blau's syndrome genetics, belongs in Medicine: Connective Tissue Disorders." });
  } else if (id === 17569) {
    moves.push({ id, fromModule, toModule: 460, reason: "Tests psoriatic arthropathy joint patterns and dactylitis, belongs in Medicine: Spondyloarthropathies." });
  } else if (id === 17609) {
    moves.push({ id, fromModule, toModule: 476, reason: "Tests Gaisbock syndrome (stress polycythemia / pseudopolycythemia), belongs in Medicine: Myeloproliferative Disorders." });
  } else if (id === 17621) {
    moves.push({ id, fromModule, toModule: 439, reason: "Tests COPD pharmacological therapy and inhaled corticosteroid prognostic impact, belongs in Medicine: COPD." });
  } else if (id === 17641) {
    moves.push({ id, fromModule, toModule: 368, reason: "Tests pneumococcal polysaccharide vaccination (PPSV23) guidelines and indications, belongs in Community Medicine: Immunization." });
  } else if (id === 17674) {
    moves.push({ id, fromModule, toModule: 431, reason: "Tests acute diverticulitis / toxic megacolon evaluation with plain abdominal radiography, belongs in Medicine: Colorectal Diseases." });
  } else if (id === 17751) {
    moves.push({ id, fromModule, toModule: 438, reason: "Tests lobar pneumonia with consolidation and air bronchograms, belongs in Medicine: Pneumonia." });
  } else if (id === 17782) {
    moves.push({ id, fromModule, toModule: 441, reason: "Tests Caplan syndrome (silicosis / coal worker's pneumoconiosis with rheumatoid arthritis), belongs in Medicine: Environmental & Interstitial Lung Diseases." });
  } else if (id === 17787) {
    moves.push({ id, fromModule, toModule: 218, reason: "Tests Epstein-Barr virus infectious mononucleosis, belongs in Microbiology: DNA Viruses - Herpesviruses." });
  } else if (id === 17809) {
    moves.push({ id, fromModule, toModule: 262, reason: "Tests lead poisoning biomarkers (urinary coproporphyrin), belongs in Forensic Medicine: Toxicology." });
  } else if (id === 17855) {
    moves.push({ id, fromModule, toModule: 467, reason: "Tests lumbar puncture indications, contraindications, and technique, belongs in Medicine: Neurologic Diagnostic Tests." });
  } else if (id === 17857) {
    moves.push({ id, fromModule, toModule: 453, reason: "Tests uncomplicated cystitis presentation and UTI syndromes, belongs in Medicine: Urinary Tract Infections." });
  } else if (id === 17859) {
    moves.push({ id, fromModule, toModule: 473, reason: "Tests hemoglobinopathy autosomal codominant genetics, belongs in Medicine: Hemolytic & Inherited Anemias." });
  } else if (id === 17863) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests thrombotic thrombocytopenic purpura (TTP) classic pentad, belongs in Medicine: Bleeding & Thrombotic Disorders." });
  } else if (id === 17883) {
    moves.push({ id, fromModule, toModule: 441, reason: "Tests restrictive ventilatory defect pulmonary function testing, belongs in Medicine: Interstitial & Neuromuscular Lung Disease." });
  } else if (id === 17892 || id === 18535 || id === 18882) {
    moves.push({ id, fromModule, toModule: 212, reason: "Tests Neisseria meningitidis clinical manifestations, nasopharyngeal carriage, and purpura fulminans, belongs in Microbiology: Gram-Negative Cocci." });
  } else if (id === 17996) {
    moves.push({ id, fromModule, toModule: 451, reason: "Tests fractional excretion of sodium (FeNa < 1%) in prerenal azotemia and acute kidney injury, belongs in Medicine: Acute Kidney Injury." });
  } else if (id === 18022) {
    moves.push({ id, fromModule, toModule: 449, reason: "Tests obesity-associated focal segmental glomerulosclerosis (FSGS), belongs in Medicine: Glomerular Diseases." });
  } else if (id === 18048) {
    moves.push({ id, fromModule, toModule: 471, reason: "Tests iron indices in iron deficiency anemia (transferrin saturation decreased), belongs in Medicine: Iron Deficiency Anemia." });
  } else if (id === 18085 || id === 18722) {
    moves.push({ id, fromModule, toModule: 642, reason: "Tests secondary syphilis clinical manifestations (epitrochlear lymphadenopathy, palmoplantar rash) and penicillin management in pregnancy, belongs in Dermatology: STDs." });
  } else if (id === 18153) {
    moves.push({ id, fromModule, toModule: 448, reason: "Tests Marfan syndrome fibrillin-1 (FBN1) mutation and cardiovascular manifestations, belongs in Medicine: Congenital & Genetic Heart Diseases." });
  } else if (id === 18178 || id === 18241) {
    moves.push({ id, fromModule, toModule: 443, reason: "Tests athlete's heart physiologic ECG variations (increased QRS amplitude, sinus bradycardia), belongs in Medicine: Diagnostic Methods in Cardiology." });
  } else if (id === 18208) {
    moves.push({ id, fromModule, toModule: 445, reason: "Tests wide complex tachycardia ECG differentiation (ventricular tachycardia), belongs in Medicine: Arrhythmias & Conduction Disorders." });
  } else if (id === 18213) {
    moves.push({ id, fromModule, toModule: 450, reason: "Tests electrolyte disturbances (hypocalcemia) triggering palpitations and QT prolongation, belongs in Medicine: Fluid & Electrolyte Disorders." });
  } else if (id === 18258) {
    moves.push({ id, fromModule, toModule: 445, reason: "Tests Stokes-Adams attacks and high-grade AV block, belongs in Medicine: Arrhythmias & Conduction Disorders." });
  } else if (id === 18271) {
    moves.push({ id, fromModule, toModule: 444, reason: "Tests acute aortic dissection in Marfan syndrome presenting with severe tearing chest/back pain, belongs in Medicine: Vascular Diseases." });
  } else if (id === 18395) {
    moves.push({ id, fromModule, toModule: 447, reason: "Tests Uhl's disease (parchment right ventricle) arrhythmogenic cardiomyopathy, belongs in Medicine: Cardiomyopathies & Myocarditis." });
  } else if (id === 18486) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests lateral medullary syndrome sensory dissociation from PICA thrombosis, belongs in Medicine: Stroke & Cerebrovascular Disorders." });
  } else if (id === 18488) {
    moves.push({ id, fromModule, toModule: 447, reason: "Tests atrial myxoma cardiac auscultation and tumor 'plop', belongs in Medicine: Pericardial & Tumors of the Heart." });
  } else if (id === 18498) {
    moves.push({ id, fromModule, toModule: 441, reason: "Tests obstructive sleep apnea nocturnal symptoms, daytime somnolence, and cardiovascular complications, belongs in Medicine: Sleep Apnea & Chronic Respiratory Failure." });
  } else if (id === 18499) {
    moves.push({ id, fromModule, toModule: 465, reason: "Tests motor neurone disease (ALS) diagnostic criteria and atypical features (optic atrophy rules out ALS), belongs in Medicine: Motor Neuron & Movement Disorders." });
  } else if (id === 18509) {
    moves.push({ id, fromModule, toModule: 215, reason: "Tests Entamoeba histolytica parasitic morbidity and mortality, belongs in Microbiology: Protozoology - Amoebae." });
  } else if (id === 18531) {
    moves.push({ id, fromModule, toModule: 577, reason: "Tests cannabinoid oil indications in refractory pediatric epilepsies (Dravet, Lennox-Gastaut vs Rett), belongs in Pediatrics: Pediatric Neurology." });
  } else if (id === 18536) {
    moves.push({ id, fromModule, toModule: 440, reason: "Tests inhaled nitric oxide in persistent pulmonary hypertension, belongs in Medicine: Pulmonary Hypertension." });
  } else if (id === 18554) {
    moves.push({ id, fromModule, toModule: 445, reason: "Tests vasovagal syncope neurocardiogenic syncope evaluation, belongs in Medicine: Syncope & Arrhythmias." });
  } else if (id === 18560 || id === 18572) {
    moves.push({ id, fromModule, toModule: 450, reason: "Tests osmotic demyelination syndrome / central pontine myelinolysis from rapid hyponatremia overcorrection, belongs in Medicine: Fluid & Electrolyte Disorders." });
  } else if (id === 18570) {
    moves.push({ id, fromModule, toModule: 577, reason: "Tests periventricular leukomalacia and spastic diplegia/quadriplegia in cerebral palsy, belongs in Pediatrics: Pediatric Neurology." });
  } else if (id === 18574 || id === 18999) {
    moves.push({ id, fromModule, toModule: 476, reason: "Tests myelodysplastic syndromes bone marrow dry tap and cytogenetics, belongs in Medicine: Myeloproliferative & Myelodysplastic Disorders." });
  } else if (id === 18604 || id === 18605) {
    moves.push({ id, fromModule, toModule: 464, reason: "Tests progressive cerebellar ataxia, scanning speech, and coordination deficits, belongs in Medicine: Ataxic Disorders & Cerebellar Disease." });
  } else if (id === 18635) {
    moves.push({ id, fromModule, toModule: 452, reason: "Tests antihypertensive therapy and diuretic efficacy in end-stage renal disease, belongs in Medicine: Chronic Kidney Disease & Renal Replacement." });
  } else if (id === 18669) {
    moves.push({ id, fromModule, toModule: 468, reason: "Tests neuromyelitis optica spectrum disorder (NMOSD) relapse prevention with eculizumab, belongs in Medicine: Multiple Sclerosis & Demyelinating Diseases." });
  } else if (id === 18671) {
    moves.push({ id, fromModule, toModule: 462, reason: "Tests Behcet disease pathergy test and vasculitic features, belongs in Medicine: Systemic Vasculitides." });
  } else if (id === 18796) {
    moves.push({ id, fromModule, toModule: 463, reason: "Tests Weber syndrome midbrain stroke localization (ventral midbrain fascicle of CN III + corticospinal tract), belongs in Medicine: Stroke & Brainstem Syndromes." });
  } else if (id === 18854) {
    moves.push({ id, fromModule, toModule: 160, reason: "Tests clopidogrel ADP receptor (P2Y12) antagonist pharmacology, belongs in Pharmacology: Drugs Acting on Blood & Hemostasis." });
  } else if (id === 18873) {
    moves.push({ id, fromModule, toModule: 444, reason: "Tests contraindications to fibrinolytic therapy in acute myocardial infarction, belongs in Medicine: Coronary Artery Disease & Acute Coronary Syndromes." });
  } else if (id === 18878) {
    moves.push({ id, fromModule, toModule: 507, reason: "Tests chronic subdural hematoma in elderly following minor trauma, belongs in Surgery: Neurosurgery - Head Injury." });
  } else if (id === 18911) {
    moves.push({ id, fromModule, toModule: 475, reason: "Tests factor VII deficiency isolated prothrombin time (PT/INR) prolongation, belongs in Medicine: Bleeding Disorders." });
  } else if (id === 18940) {
    moves.push({ id, fromModule, toModule: 450, reason: "Tests urine-to-plasma electrolyte ratios in evaluation and water restriction for hyponatremia, belongs in Medicine: Fluid & Electrolyte Disorders." });
  } else if (id === 18950) {
    moves.push({ id, fromModule, toModule: 473, reason: "Tests elective splenectomy indications in hereditary spherocytosis, belongs in Medicine: Hemolytic Anemias." });
  } else if (id === 18987) {
    moves.push({ id, fromModule, toModule: 476, reason: "Tests L-asparaginase chemotherapy indication in acute lymphoblastic leukemia (ALL), belongs in Medicine: Acute Leukemias." });
  } else if (id === 18995) {
    moves.push({ id, fromModule, toModule: 476, reason: "Tests mantle cell lymphoma t(11;14) translocation and cyclin D1 overexpression, belongs in Medicine: Lymphomas & Leukemias." });
  } else if (id === 19024) {
    moves.push({ id, fromModule, toModule: 214, reason: "Tests cat scratch disease etiology (Bartonella henselae), belongs in Microbiology: Fastidious Gram-Negative Bacilli." });
  } else if (id === 19049) {
    moves.push({ id, fromModule, toModule: 467, reason: "Tests evaluation of focal impaired awareness seizures with electroencephalography (EEG), belongs in Medicine: Seizures & Epilepsy." });
  } else if (id === 19054 || id === 19055) {
    moves.push({ id, fromModule, toModule: 219, reason: "Tests SARS-CoV-2 virology (enveloped positive ssRNA) and public health measures, belongs in Microbiology: RNA Viruses - Coronaviruses." });
  }
});

console.log(`Classified ${moves.length} remaining dumped questions into high-precision moves!`);
fs.writeFileSync('tools/dump_remaining_classified.json', JSON.stringify(moves, null, 2));
