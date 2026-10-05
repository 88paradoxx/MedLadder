const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modLookup = {};
allModules.forEach(m => modLookup[m.moduleId] = m);

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

function processSubject(subjName, filename, auditFn, outFilename) {
  console.log(`\n================ AUDITING ${subjName.toUpperCase()} ================`);
  const rawQuestions = JSON.parse(fs.readFileSync(filename, 'utf8'));
  console.log(`Loaded ${rawQuestions.length} questions from ${filename}`);

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

  const moves = [];
  questions.forEach(q => {
    const res = auditFn(q);
    if (res && res.toModule !== q.currentModule) {
      moves.push({
        id: q.id,
        fromModule: q.currentModule,
        toModule: res.toModule,
        reason: res.reason
      });
    }
  });

  console.log(`Audited ${questions.length} questions.`);
  console.log(`Flagged ${moves.length} moves for relocation (${((moves.length / questions.length) * 100).toFixed(1)}%).`);

  const out = {
    subject: subjName,
    totalQuestions: questions.length,
    flaggedCount: moves.length,
    moves: moves
  };

  fs.writeFileSync(outFilename, JSON.stringify(out, null, 2));
  console.log(`Saved findings to ${outFilename}`);
  return out;
}

// -------------------------------------------------------------
// 1. DERMATOLOGY AUDIT LOGIC (Modules 633 to 656)
// -------------------------------------------------------------
function auditDermatology(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // Cross-subject checks
  if (inQA('systemic lupus erythematosus', 'lupus nephritis') && inFull('glomerulonephritis', 'renal biopsy')) {
    return { toModule: 474, reason: 'Systemic lupus nephritis workup and renal pathology belong to Internal Medicine: Connective Tissue Disorders (Module 474).' };
  }

  // 654: Skin Malignancies
  if (inQA('basal cell carcinoma', 'rodent ulcer', 'squamous cell carcinoma of skin', 'malignant melanoma', 'breslow depth', 'clark level', 'pautrier microabscess', 'mycosis fungoides', 'sezary syndrome', 'kaposi sarcoma', 'actinic keratosis', 'keratoacanthoma')) {
    if (cur !== 654) return { toModule: 654, reason: 'Tests primary cutaneous neoplasms (BCC, SCC, Melanoma, CTCL, Kaposi sarcoma), belongs in Dermatology: Skin Malignancies (Module 654).' };
  }

  // 653: Connective Tissue Disorders
  if (inQA('discoid lupus erythematosus', 'dle', 'subacute cutaneous lupus', 'carpet tack sign', 'dermatomyositis', 'gottron papule', 'gottron sign', 'heliotrope rash', 'shawl sign', 'scleroderma', 'morphea', 'sclerodactyly', 'salt and pepper pigmentation', 'crest syndrome')) {
    if (cur !== 653) return { toModule: 653, reason: 'Tests cutaneous manifestations of rheumatologic/connective tissue diseases (DLE, dermatomyositis, morphea, scleroderma), belongs in Dermatology: Connective Tissue Disorders (Module 653).' };
  }

  // 652: Genodermatoses & Nutritional Disorders
  if (inQA('ichthyosis', 'epidermolysis bullosa', 'darier disease', 'hailey-hailey', 'neurofibromatosis', 'cafe au lait macule', 'tuberous sclerosis', 'ash leaf macule', 'adenoma sebaceum', 'shagreen patch', 'koenen tumor', 'pellagra', 'scurvy', 'acrodermatitis enteropathica', 'phrynoderma')) {
    if (cur !== 652) return { toModule: 652, reason: 'Tests inherited genodermatoses (Ichthyosis, NF-1, Tuberous sclerosis) and nutritional dermatoses (Pellagra, Acrodermatitis), belongs in Dermatology: Genodermatoses & Nutritional Disorders (Module 652).' };
  }

  // 650 & 651: STIs
  if (inQA('syphilis', 'treponema pallidum', 'hard chancre', 'condyloma lata', 'snail track ulcer', 'gumma', 'vdrl', 'tpha', 'rpr test', 'jarisch-herxheimer', 'hutchinson teeth')) {
    if (cur !== 650) return { toModule: 650, reason: 'Tests Treponema pallidum syphilis stages, serology, and penicillin therapy, belongs in Dermatology: Syphilis (Module 650).' };
  }
  if (inQA('chancroid', 'haemophilus ducreyi', 'soft chancre', 'school of fish', 'lymphogranuloma venereum', 'lgv', 'groove sign of greenblatt', 'granuloma inguinale', 'donovanosis', 'donovan bodies', 'naco syndromic management', 'genital ulcer')) {
    if (cur !== 651) return { toModule: 651, reason: 'Tests non-syphilitic STIs (Chancroid, LGV, Donovanosis, syndromic kits), belongs in Dermatology: Non Syphilitic Sexually Transmitted Diseases (Module 651).' };
  }

  // 648 & 649: Fungal & Parasitic
  if (inQA('scabies', 'sarcoptes scabiei', 'burrows in web spaces', 'nocturnal pruritus', 'permethrin', 'pediculosis', 'head lice', 'phthirus pubis', 'cutaneous larva migrans', 'oriental sore', 'leishmaniasis in skin')) {
    if (cur !== 649) return { toModule: 649, reason: 'Tests ectoparasitic infestations (Scabies, Pediculosis, Cutaneous larva migrans, Leishmaniasis), belongs in Dermatology: Arthropod and Parasitic Infections (Module 649).' };
  }
  if (inQA('tinea', 'dermatophytosis', 'ringworm', 'pityriasis versicolor', 'tinea versicolor', 'spaghetti and meatballs', 'malassezia furfur', 'candida intertrigo', 'sporotrichosis', 'mycetoma', 'chromoblastomycosis', 'medlar bodies', 'copper penny bodies')) {
    if (cur !== 648) return { toModule: 648, reason: 'Tests dermatophytoses, Malassezia pityriasis versicolor, and deep mycoses (Mycetoma, Sporotrichosis), belongs in Dermatology: Fungal and Protozoal Infections (Module 648).' };
  }

  // 647: Viral Infections
  if (inQA('herpes simplex', 'hsv-1', 'hsv-2', 'tzanck smear multinucleated', 'cowdry a inclusions', 'herpes zoster', 'shingles', 'post herpetic neuralgia', 'molluscum contagiosum', 'henderson-paterson', 'verruca vulgaris', 'condyloma acuminata', 'warts in skin')) {
    if (cur !== 647) return { toModule: 647, reason: 'Tests cutaneous viral infections (Herpes simplex, Varicella-zoster, Molluscum, HPV warts), belongs in Dermatology: Viral Infections (Module 647).' };
  }

  // 645 & 646: Mycobacterial & Bacterial
  if (inQA('leprosy', 'hansen disease', 'mycobacterium leprae', 'tuberculoid leprosy', 'lepromatous leprosy', 'ridley-jopling', 'lepra reaction', 'erythema nodosum leprosum', 'lupus vulgaris', 'scrofuloderma', 'apple jelly nodules')) {
    if (cur !== 645) return { toModule: 645, reason: 'Tests Hansen disease (Leprosy classification, lepra reactions, MDT) and cutaneous TB, belongs in Dermatology: Mycobacterial Infections (Module 645).' };
  }
  if (inQA('impetigo', 'honey colored crusts', 'ecthyma', 'furuncle', 'carbuncle', 'erysipelas', 'cellulitis', 'erythrasma', 'coral red fluorescence', 'corynebacterium minutissimum', 'staphylococcal scalded skin', 'ssss')) {
    if (cur !== 646) return { toModule: 646, reason: 'Tests pyodermas (Impetigo, Furuncles, Erysipelas, Cellulitis), SSSS, and Erythrasma, belongs in Dermatology: Bacterial Infections (Module 646).' };
  }

  // 644: Vesiculobullous Diseases
  if (inQA('pemphigus vulgaris', 'pemphigus foliaceus', 'bullous pemphigoid', 'dermatitis herpetiformis', 'anti-desmoglein', 'tombstone appearance', 'row of tombstones', 'acantholysis', 'subepidermal bulla', 'nikolsky sign', 'dapsone in dermatitis herpetiformis', 'granular iga in dermal papillae', 'fishnet pattern')) {
    if (cur !== 644) return { toModule: 644, reason: 'Tests autoimmune blistering diseases (Pemphigus vulgaris/foliaceus, Bullous pemphigoid, Dermatitis herpetiformis), belongs in Dermatology: Vesiculobullous Diseases (Module 644).' };
  }

  // 643 & 642: Psoriasis & Papulosquamous
  if (inQA('psoriasis', 'silvery scales', 'auspitz sign', 'munro microabscess', 'kogoj pustule', 'guttate psoriasis', 'erythrodermic psoriasis', 'psoriatic arthritis', 'calcipotriol')) {
    if (cur !== 643) return { toModule: 643, reason: 'Tests psoriasis pathogenesis, clinical variants, histopathology (Munro microabscesses), and systemic therapies, belongs in Dermatology: Psoriasis (Module 643).' };
  }
  if (inQA('lichen planus', 'wickham striae', 'saw tooth rete ridges', 'civatte bodies', 'pityriasis rosea', 'herald patch', 'christmas tree pattern', 'pityriasis rubra pilaris', 'lichen sclerosus')) {
    if (cur !== 642) return { toModule: 642, reason: 'Tests non-psoriatic papulosquamous disorders (Lichen planus, Pityriasis rosea, PRP, Lichen sclerosus), belongs in Dermatology: Papulosquamous Disorders (Module 642).' };
  }

  // 641: Reactive & Drug Eruptions
  if (inQA('erythema multiforme', 'target lesion', 'iris lesion', 'stevens johnson syndrome', 'sjs', 'toxic epidermal necrolysis', 'ten', 'scorten', 'fixed drug eruption', 'fde', 'dress syndrome', 'erythema nodosum')) {
    if (cur !== 641) return { toModule: 641, reason: 'Tests severe cutaneous adverse drug reactions (SJS/TEN, Fixed drug eruption, DRESS) and erythema multiforme/nodosum, belongs in Dermatology: Reactive Skin Diseases and Drug Eruptions (Module 641).' };
  }

  // 640: Urticaria & Angioedema
  if (inQA('urticaria', 'wheal and flare', 'angioedema', 'hereditary angioedema', 'c1 esterase inhibitor deficiency', 'chronic spontaneous urticaria', 'omalizumab')) {
    if (cur !== 640) return { toModule: 640, reason: 'Tests urticarial vascular reactions and hereditary angioedema mechanisms, belongs in Dermatology: Urticaria & Angioedema (Module 640).' };
  }

  // 639: Dermatitis
  if (inQA('atopic dermatitis', 'hanifin and rajka', 'eczema', 'allergic contact dermatitis', 'patch testing', 'seborrheic dermatitis', 'cradle cap', 'nummular eczema', 'stasis dermatitis')) {
    if (cur !== 639) return { toModule: 639, reason: 'Tests eczematous dermatoses (Atopic dermatitis, Contact dermatitis, Seborrheic dermatitis), belongs in Dermatology: Dermatitis (Module 639).' };
  }

  // 638: Pigmentation Disorders
  if (inQA('vitiligo', 'melasma', 'chloasma', 'post inflammatory hyperpigmentation', 'albinism', 'wood lamp in pigmentation', 'depigmentation')) {
    if (cur !== 638) return { toModule: 638, reason: 'Tests disorders of melanogenesis and pigmentation (Vitiligo, Melasma, Albinism), belongs in Dermatology: Disorders of Skin Pigmentation (Module 638).' };
  }

  // 637: Hair & Nails
  if (inQA('alopecia areata', 'exclamation mark hair', 'androgenetic alopecia', 'minoxidil', 'finasteride in alopecia', 'telogen effluvium', 'trichotillomania', 'beau lines', 'onycholysis', 'nail pitting', 'onychomycosis')) {
    if (cur !== 637) return { toModule: 637, reason: 'Tests trichology (Alopecia areata, Androgenetic alopecia) and nail pathology, belongs in Dermatology: Disorders of Hair and Nails (Module 637).' };
  }

  // 636: Acne & Rosacea
  if (inQA('acne vulgaris', 'comedones', 'isotretinoin', 'rosacea', 'rhinophyma', 'hidradenitis suppurativa')) {
    if (cur !== 636) return { toModule: 636, reason: 'Tests pilosebaceous and apocrine disorders (Acne vulgaris, Rosacea, Hidradenitis suppurativa), belongs in Dermatology: Acne, Rosacea and Others (Module 636).' };
  }

  // 655: Systemic Diseases & Skin
  if (inQA('acanthosis nigricans', 'necrobiosis lipoidica', 'pyoderma gangrenosum', 'sweet syndrome', 'pruritus in jaundice', 'xanthoma')) {
    if (cur !== 655) return { toModule: 655, reason: 'Tests cutaneous markers of internal malignancies, diabetes, and metabolic diseases, belongs in Dermatology: Systemic Diseases and Skin (Module 655).' };
  }

  return null;
}

// -------------------------------------------------------------
// 2. ORTHOPAEDICS AUDIT LOGIC (Modules 657 to 686)
// -------------------------------------------------------------
function auditOrthopaedics(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // 683 & 682: Bone Tumors
  if (inQA('osteosarcoma', 'sunburst appearance', 'codman triangle', 'ewing sarcoma', 'onion peel appearance', 't(11;22)', 'chondrosarcoma', 'multiple myeloma in bone', 'punched out lytic lesion')) {
    if (cur !== 683) return { toModule: 683, reason: 'Tests primary malignant bone tumors (Osteosarcoma, Ewing sarcoma, Chondrosarcoma) and myeloma, belongs in Orthopaedics: Malignant Tumors of Bone (Module 683).' };
  }
  if (inQA('osteochondroma', 'exostosis', 'osteoid osteoma', 'nidus in bone', 'giant cell tumor of bone', 'osteoclastoma', 'soap bubble appearance', 'enchondroma', 'aneurysmal bone cyst', 'unicameral bone cyst', 'fallen fragment sign', 'shepherd crook')) {
    if (cur !== 682) return { toModule: 682, reason: 'Tests benign bone tumors and tumor-like lesions (GCT, Osteoid osteoma, Osteochondroma, ABC, UBC), belongs in Orthopaedics: Benign Tumors Of Bone (Module 682).' };
  }

  // 681: Nerve Injuries
  if (inQA('radial nerve injury', 'wrist drop', 'ulnar nerve injury', 'claw hand', 'froment sign', 'median nerve injury', 'ape thumb', 'carpal tunnel syndrome', 'common peroneal nerve injury', 'foot drop', 'seddon classification', 'sunderland classification', 'neuropraxia', 'axonotmesis', 'neurotmesis')) {
    if (cur !== 681) return { toModule: 681, reason: 'Tests peripheral nerve injuries, Seddon/Sunderland classifications, and nerve entrapments (Radial/Median/Ulnar/Peroneal), belongs in Orthopaedics: Nerve Injuries (Module 681).' };
  }

  // 680: RA, OA, AS, Gout
  if (inQA('osteoarthritis', 'heberden node', 'bouchard node', 'rheumatoid arthritis', 'swan neck deformity', 'boutonniere deformity', 'ankylosing spondylitis', 'bamboo spine', 'hla-b27', 'gout', 'martel sign', 'pseudogout', 'chondrocalcinosis')) {
    if (cur !== 680) return { toModule: 680, reason: 'Tests degenerative and inflammatory arthropathies (OA, RA, Ankylosing spondylitis, Gout, Pseudogout), belongs in Orthopaedics: Rheumatoid Arthritis and Osteoarthritis (Module 680).' };
  }

  // 679, 678, 677: Metabolic Bone Diseases
  if (inQA('paget disease of bone', 'osteitis deformans', 'mosaic pattern of lamellar', 'blade of grass sign', 'hyperparathyroidism in bone', 'brown tumor of bone', 'subperiosteal resorption', 'salt and pepper skull')) {
    if (cur !== 679) return { toModule: 679, reason: 'Tests Paget disease of bone and hyperparathyroid bone disease (Osteitis fibrosa cystica), belongs in Orthopaedics: Paget\'s Disease and Hyperparathyroidism (Module 679).' };
  }
  if (inQA('osteoporosis', 'dexa scan t score', 'fragility fracture', 'bisphosphonate', 'osteomalacia', 'looser zone', 'milkman pseudofracture')) {
    if (cur !== 678) return { toModule: 678, reason: 'Tests osteoporosis screening (DEXA T-score), fragility fractures, and adult osteomalacia (Looser zones), belongs in Orthopaedics: Osteoporosis and Osteomalacia (Module 678).' };
  }
  if (inQA('rickets', 'rachitic rosary', 'cupping and fraying', 'craniotabes', 'scurvy', 'wimberger ring sign', 'pelkan spur', 'osteogenesis imperfecta', 'osteopetrosis', 'marble bone')) {
    if (cur !== 677) return { toModule: 677, reason: 'Tests pediatric metabolic bone diseases (Rickets, Scurvy, Osteogenesis imperfecta, Osteopetrosis), belongs in Orthopaedics: Metabolic Bone Diseases in Children (Module 677).' };
  }

  // 676 & 675: Pediatric Orthopaedics (DDH, Perthes, SCFE, CTEV)
  if (inQA('developmental dysplasia of the hip', 'ddh', 'barlow test', 'ortolani test', 'galeazzi sign', 'perthes disease', 'legg-calve-perthes', 'slipped capital femoral epiphysis', 'scfe', 'trethowan sign', 'klein line', 'pavlik harness')) {
    if (cur !== 676) return { toModule: 676, reason: 'Tests developmental and adolescent hip disorders (DDH, Legg-Calve-Perthes disease, SCFE), belongs in Orthopaedics: Congenital Malformations, Perthes Disease and SCFE (Module 676).' };
  }
  if (inQA('congenital talipes equinovarus', 'ctev', 'clubfoot', 'ponseti method', 'pirani score', 'achilles tenotomy', 'genu varum', 'genu valgum')) {
    if (cur !== 675) return { toModule: 675, reason: 'Tests congenital foot and knee alignment deformities (CTEV/Clubfoot Ponseti method, Genu varum/valgum), belongs in Orthopaedics: CTEV, Genu Varum and Valgum (Module 675).' };
  }

  // 674: Fractures in Children
  if (inQA('salter harris classification', 'physeal injury', 'greenstick fracture', 'torus fracture', 'buckle fracture', 'plastic deformation of bone')) {
    if (cur !== 674) return { toModule: 674, reason: 'Tests pediatric fracture patterns and epiphyseal plate injuries (Salter-Harris I-V, Greenstick, Torus), belongs in Orthopaedics: Fractures in Children (Module 674).' };
  }

  // 673 & 672: Infections of Bones & Joints
  if (inQA('pott disease', 'pott spine', 'skeletal tuberculosis', 'tuberculous spondylitis', 'psoas abscess', 'gibbus deformity', 'spina ventosa')) {
    if (cur !== 673) return { toModule: 673, reason: 'Tests tuberculous spondylitis (Pott disease, gibbus, psoas cold abscess) and skeletal tuberculosis, belongs in Orthopaedics: Skeletal Tuberculosis (Module 673).' };
  }
  if (inQA('acute osteomyelitis', 'chronic osteomyelitis', 'sequestrum', 'involucrum', 'cloaca in osteomyelitis', 'brodie abscess', 'septic arthritis')) {
    if (cur !== 672) return { toModule: 672, reason: 'Tests pyogenic bone and joint infections (Acute/Chronic Osteomyelitis, Sequestrum/Involucrum, Septic Arthritis), belongs in Orthopaedics: Infections of the Bone (Module 672).' };
  }

  // 671: Pelvic Fractures
  if (inQA('pelvic fracture', 'open book pelvic fracture', 'young burgess classification', 'tile classification in pelvis', 'acetabulum fracture', 'judet letournel', 'pelvic binder')) {
    if (cur !== 671) return { toModule: 671, reason: 'Tests pelvic ring disruptions, Tile/Young-Burgess classifications, and acetabular fractures, belongs in Orthopaedics: Injuries of Pelvis (Module 671).' };
  }

  // 670, 669, 668: Spine Injuries & Conditions
  if (inQA('intervertebral disc prolapse', 'ivdp', 'sciatica', 'straight leg raising test', 'slrt', 'cauda equina syndrome', 'spondylolysis', 'spondylolisthesis', 'scottie dog collar', 'meyerding classification')) {
    if (cur !== 670) return { toModule: 670, reason: 'Tests lumbar disc herniation (IVDP/SLRT/Cauda equina) and spondylolysis/spondylolisthesis, belongs in Orthopaedics: Spondylolisthesis & IVDP (Module 670).' };
  }
  if (inQA('lumbar canal stenosis', 'neurogenic claudication', 'scoliosis', 'cobb angle', 'scheuermann disease', 'cervical spondylosis', 'spurling test')) {
    if (cur !== 669) return { toModule: 669, reason: 'Tests non-traumatic spinal disorders (Lumbar canal stenosis, Scoliosis Cobb angle, Scheuermann kyphosis), belongs in Orthopaedics: Regional Conditions of Spine (Module 669).' };
  }
  if (inQA('jefferson fracture', 'hangman fracture', 'odontoid fracture', 'chance fracture', 'denis three column', 'clay shoveler fracture')) {
    if (cur !== 668) return { toModule: 668, reason: 'Tests traumatic cervical and thoracolumbar spine injuries (Jefferson, Hangman, Odontoid, Chance fractures), belongs in Orthopaedics: Injuries of Spine (Module 668).' };
  }

  // 667, 666, 665, 664: Lower Limb
  if (inQA('avascular necrosis of femoral head', 'avn in hip', 'ficat arlet', 'core decompression', 'plantar fasciitis', 'morton neuroma', 'hallux valgus')) {
    if (cur !== 667) return { toModule: 667, reason: 'Tests avascular necrosis of the femoral head and regional foot/ankle disorders (Plantar fasciitis, Morton neuroma), belongs in Orthopaedics: AVN and Regional Conditions of Lower Limb (Module 667).' };
  }
  if (inQA('anterior cruciate ligament', 'acl tear', 'lachman test', 'pivot shift test', 'meniscal tear', 'mcmurray test', 'bucket handle tear', 'patellar fracture', 'tibial plateau fracture', 'schatzker classification', 'danis weber', 'calcaneus fracture', 'bohler angle', 'achilles tendon rupture', 'thompson test')) {
    if (cur !== 666) return { toModule: 666, reason: 'Tests knee ligament/meniscal injuries (ACL/Lachman, Meniscus/McMurray), tibial plateau fractures, and ankle/foot injuries, belongs in Orthopaedics: Injuries of Knee, Leg and Foot (Module 666).' };
  }
  if (inQA('femoral neck fracture', 'garden classification', 'pauwels angle', 'intertrochanteric fracture', 'dynamic hip screw', 'subtrochanteric fracture', 'femoral shaft fracture', 'intramedullary nailing')) {
    if (cur !== 665) return { toModule: 665, reason: 'Tests proximal femoral fractures (Femoral neck Garden classification, Intertrochanteric DHS/PFN, Femoral shaft), belongs in Orthopaedics: Fractures of Femur (Module 665).' };
  }
  if (inQA('posterior hip dislocation', 'anterior hip dislocation', 'dashboard injury', 'allis maneuver')) {
    if (cur !== 664) return { toModule: 664, reason: 'Tests traumatic dislocations of the hip joint (posterior vs anterior dislocations and reduction maneuvers), belongs in Orthopaedics: Dislocations of the Hip Joint (Module 664).' };
  }

  // 663, 662, 661, 660: Upper Limb
  if (inQA('de quervain tenosynovitis', 'finkelstein test', 'trigger finger', 'dupuytren contracture', 'tennis elbow', 'lateral epicondylitis', 'golfer elbow', 'cubital tunnel syndrome')) {
    if (cur !== 663) return { toModule: 663, reason: 'Tests regional upper limb soft tissue and entrapment syndromes (De Quervain, Tennis elbow, Dupuytren, Trigger finger), belongs in Orthopaedics: Regional Conditions of the Upper Limb (Module 663).' };
  }
  if (inQA('scaphoid fracture', 'anatomical snuffbox tenderness', 'colles fracture', 'dinner fork deformity', 'smith fracture', 'garden spade deformity', 'barton fracture', 'bennett fracture', 'rolando fracture', 'boxer fracture', 'mallet finger')) {
    if (cur !== 662) return { toModule: 662, reason: 'Tests wrist and hand fractures (Colles, Smith, Scaphoid AVN risk, Bennett, Rolando, Mallet finger), belongs in Orthopaedics: Injuries of Hand (Module 662).' };
  }
  if (inQA('supracondylar fracture', 'gunstock deformity', 'baumann angle', 'volkmann ischemic contracture', 'monteggia fracture', 'galeazzi fracture', 'radial head fracture', 'pulled elbow', 'nursemaid elbow')) {
    if (cur !== 661) return { toModule: 661, reason: 'Tests elbow and forearm fractures (Supracondylar humerus fracture, Monteggia, Galeazzi, Pulled elbow), belongs in Orthopaedics: Injuries of Elbow and Forearm (Module 661).' };
  }
  if (inQA('clavicle fracture', 'shoulder dislocation', 'bankart lesion', 'hill sachs lesion', 'dugas test', 'shaft of humerus fracture', 'proximal humerus fracture', 'neer classification')) {
    if (cur !== 660) return { toModule: 660, reason: 'Tests shoulder girdle and humeral injuries (Anterior shoulder dislocation Bankart/Hill-Sachs, Clavicle, Shaft of humerus), belongs in Orthopaedics: Injuries of Clavicle, Shoulder and Arm (Module 660).' };
  }

  // 658 & 657: Fracture Basics & Complications
  if (inQA('compartment syndrome', 'fasciotomy in compartment', 'fat embolism syndrome', 'gurd criteria', 'sudeck atrophy', 'complex regional pain syndrome', 'non union in fracture', 'malunion in fracture')) {
    if (cur !== 658) return { toModule: 658, reason: 'Tests severe acute and late complications of fractures (Compartment syndrome, Fat embolism, CRPS, Non-union), belongs in Orthopaedics: Complications of Fracture (Module 658).' };
  }
  if (inQA('gustilo anderson', 'bone healing stages', 'plaster of paris', 'orif in fracture', 'external fixator', 'open vs closed fracture')) {
    if (cur !== 657) return { toModule: 657, reason: 'Tests basic biomechanics of fractures, Gustilo-Anderson classification, bone healing, and splinting/fixation principles, belongs in Orthopaedics: Basics of Fracture and its Management (Module 657).' };
  }

  return null;
}

// -------------------------------------------------------------
// 3. PSYCHIATRY AUDIT LOGIC (Modules 687 to 719)
// -------------------------------------------------------------
function auditPsychiatry(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // 718: Forensic Psychiatry
  if (inQA('mental healthcare act 2017', 'advance directive in psychiatry', 'nominated representative in mental health', 'section 309 ipc', 'mcnaughten rule', 'section 84 ipc', 'testamentary capacity', 'banks v goodfellow')) {
    if (cur !== 718) return { toModule: 718, reason: 'Tests mental health legislation (Mental Healthcare Act 2017), criminal responsibility (McNaughten / Sec 84 IPC), and civil competency, belongs in Psychiatry: Forensic Psychiatry (Module 718).' };
  }

  // 717, 716, 715, 714: Child Psychiatry
  if (inQA('nocturnal enuresis', 'desmopressin in enuresis', 'encopresis in child', 'separation anxiety in child', 'pica in child', 'tourette syndrome', 'coprolalia', 'tic disorder in child')) {
    if (cur !== 717) return { toModule: 717, reason: 'Tests elimination disorders (Enuresis, Encopresis), Tourette syndrome, and early childhood emotional disorders, belongs in Psychiatry: Special Areas of Childhood Mental Health (Module 717).' };
  }
  if (inQA('attention deficit hyperactivity disorder', 'adhd', 'methylphenidate in adhd', 'conduct disorder', 'oppositional defiant disorder', 'odd in child')) {
    if (cur !== 716) return { toModule: 716, reason: 'Tests externalizing and disruptive behavioral disorders (ADHD, Conduct Disorder, Oppositional Defiant Disorder), belongs in Psychiatry: Attention-Deficit Disorders and Disruptive Behaviour (Module 716).' };
  }
  if (inQA('autism spectrum disorder', 'asd in child', 'stereotypic behavior in autism', 'hand flapping', 'toe walking in autism')) {
    if (cur !== 715) return { toModule: 715, reason: 'Tests autism spectrum disorder (social-communicative impairment, repetitive stereotypic behaviors), belongs in Psychiatry: Autism Spectrum Disorder (Module 715).' };
  }
  if (inQA('intellectual disability', 'mental retardation', 'iq classification', 'dyslexia', 'dyscalculia', 'dysgraphia')) {
    if (cur !== 714) return { toModule: 714, reason: 'Tests intellectual disability (IQ classification) and specific learning disorders (Dyslexia, Dyscalculia), belongs in Psychiatry: Intellectual Disability & Specific Learning Disorders (Module 714).' };
  }

  // 711: Psychiatric Emergencies
  if (inQA('suicide risk', 'sad persons scale', 'neuroleptic malignant syndrome', 'nms in psychiatry', 'lead pipe rigidity', 'dantrolene in nms', 'serotonin syndrome', 'cyproheptadine in serotonin', 'acute dystonia in psychiatry', 'oculogyric crisis')) {
    if (cur !== 711) return { toModule: 711, reason: 'Tests life-threatening psychiatric emergencies (Suicide risk assessment, NMS, Serotonin Syndrome, Acute Dystonic crises), belongs in Psychiatry: Psychiatric Emergencies (Module 711).' };
  }

  // 709: Eating Disorders
  if (inQA('anorexia nervosa', 'fear of gaining weight', 'lanugo hair in anorexia', 'russell sign', 'bulimia nervosa', 'binge eating disorder', 'fluoxetine in bulimia')) {
    if (cur !== 709) return { toModule: 709, reason: 'Tests eating disorders (Anorexia nervosa, Bulimia nervosa, Binge-eating disorder), belongs in Psychiatry: Eating Disorders (Module 709).' };
  }

  // 708: Sleep Disorders
  if (inQA('insomnia', 'sleep hygiene', 'narcolepsy', 'cataplexy', 'orexin in narcolepsy', 'hypnagogic hallucination', 'sleep terror', 'somnambulism', 'rem sleep behavior disorder')) {
    if (cur !== 708) return { toModule: 708, reason: 'Tests dyssomnias (Insomnia, Narcolepsy/Cataplexy) and parasomnias (Sleep terrors, REM sleep behavior disorder), belongs in Psychiatry: Sleep Disorders (Module 708).' };
  }

  // 705, 706, 707: Somatoform, Factitious & Dissociative
  if (inQA('somatic symptom disorder', 'illness anxiety disorder', 'hypochondriasis', 'conversion disorder', 'functional neurological symptom', 'la belle indifference', 'hoover sign in conversion')) {
    if (cur !== 705) return { toModule: 705, reason: 'Tests somatic symptom disorders, illness anxiety, and conversion / functional neurological disorder, belongs in Psychiatry: Somatoform Disorders (Module 705).' };
  }
  if (inQA('factitious disorder', 'munchausen syndrome', 'munchausen by proxy', 'malingering in psychiatry', 'secondary gain in malingering')) {
    if (cur !== 706) return { toModule: 706, reason: 'Tests factitious disorders (Munchausen syndrome, proxy) and malingering for secondary external gain, belongs in Psychiatry: Factitious Disorders, Malingering and Criminality (Module 706).' };
  }
  if (inQA('dissociative amnesia', 'dissociative fugue', 'dissociative identity disorder', 'multiple personality disorder', 'depersonalization derealization')) {
    if (cur !== 707) return { toModule: 707, reason: 'Tests dissociative disorders (Dissociative amnesia, Dissociative fugue, DID, Depersonalization), belongs in Psychiatry: Dissociative Disorders (Module 707).' };
  }

  // 704: Personality Disorders
  if (inQA('paranoid personality', 'schizoid personality', 'schizotypal personality', 'antisocial personality', 'borderline personality', 'splitting in borderline', 'dbt in borderline', 'histrionic personality', 'narcissistic personality', 'avoidant personality', 'dependent personality', 'obsessive compulsive personality', 'ocpd')) {
    if (cur !== 704) return { toModule: 704, reason: 'Tests Cluster A, B, and C personality disorders (Borderline, Antisocial, Schizoid, OCPD), belongs in Psychiatry: Personality Disorders (Module 704).' };
  }

  // 703 & 702 & 701: Trauma, OCD, Anxiety
  if (inQA('post traumatic stress disorder', 'ptsd', 'flashbacks in ptsd', 'acute stress disorder', 'emdr in ptsd', 'adjustment disorder in psychiatry')) {
    if (cur !== 703) return { toModule: 703, reason: 'Tests stressor-related disorders (PTSD, Acute Stress Disorder, Adjustment disorder), belongs in Psychiatry: Trauma and Stress-Related Disorders (Module 703).' };
  }
  if (inQA('obsessive compulsive disorder', 'ocd in psychiatry', 'intrusive thoughts in ocd', 'exposure and response prevention', 'erp in ocd', 'body dysmorphic disorder', 'trichotillomania', 'hoarding disorder')) {
    if (cur !== 702) return { toModule: 702, reason: 'Tests obsessive-compulsive spectrum disorders (OCD, ERP therapy, Body dysmorphic disorder, Trichotillomania), belongs in Psychiatry: Obsessive-Compulsive and Related Disorders (Module 702).' };
  }
  if (inQA('panic disorder', 'panic attack', 'agoraphobia', 'generalized anxiety disorder', 'gad in psychiatry', 'social anxiety disorder', 'social phobia', 'specific phobia')) {
    if (cur !== 701) return { toModule: 701, reason: 'Tests anxiety disorders (Panic disorder, Agoraphobia, GAD, Social anxiety disorder, Specific phobias), belongs in Psychiatry: Anxiety Disorders (Module 701).' };
  }

  // 699 & 700: Substance Use
  if (inQA('alcohol withdrawal', 'delirium tremens', 'dt in alcohol', 'cage questionnaire', 'disulfiram', 'acamprosate', 'naltrexone in alcohol', 'alcoholic hallucinosis')) {
    if (cur !== 699) return { toModule: 699, reason: 'Tests alcohol dependence, CAGE screening, withdrawal states (Delirium tremens), and anti-craving/relapse pharmacotherapy, belongs in Psychiatry: Alcohol-Related Disorders (Module 699).' };
  }
  if (inQA('opioid overdose', 'naloxone in opioid', 'opioid withdrawal', 'methadone in opioid', 'buprenorphine', 'cannabis in psychiatry', 'cocaine in psychiatry', 'formication in cocaine', 'amphetamine in psychiatry', 'flumazenil', 'varenicline in nicotine')) {
    if (cur !== 700) return { toModule: 700, reason: 'Tests illicit substance use disorders (Opioids/Naloxone, Cannabis, Cocaine formication, Benzodiazepines/Flumazenil, Nicotine), belongs in Psychiatry: Other Substance Use Disorders (Module 700).' };
  }

  // 697 & 698: Mood Disorders
  if (inQA('bipolar disorder', 'mania in psychiatry', 'hypomania', 'digfast in mania', 'lithium toxicity', 'ebstein anomaly in lithium', 'valproate in bipolar', 'mood stabilizer')) {
    if (cur !== 698) return { toModule: 698, reason: 'Tests bipolar affective disorders (Bipolar I/II, Mania) and mood stabilizer pharmacotherapy (Lithium toxicity, Valproate), belongs in Psychiatry: Bipolar and Related Disorders (Module 698).' };
  }
  if (inQA('major depressive disorder', 'mdd', 'sigecaps in depression', 'atypical depression', 'dysthymia', 'postpartum depression', 'cbt in depression', 'beck cognitive triad')) {
    if (cur !== 697) return { toModule: 697, reason: 'Tests depressive disorders (Major Depression, Atypical Depression, Dysthymia, Beck cognitive triad), belongs in Psychiatry: Depressive Disorders (Module 697).' };
  }

  // 694, 695, 696: Neurocognitive Disorders
  if (inQA('wernicke encephalopathy', 'korsakoff psychosis', 'thiamine deficiency in wernicke', 'confabulation in korsakoff', 'mammillary body')) {
    if (cur !== 696) return { toModule: 696, reason: 'Tests alcohol-induced nutritional neurocognitive syndromes (Wernicke-Korsakoff encephalopathy), belongs in Psychiatry: Amnestic Disorders and Other Neurocognitive Disorders (Module 696).' };
  }
  if (inQA('alzheimer disease', 'dementia in psychiatry', 'donepezil', 'memantine', 'vascular dementia', 'lewy body dementia', 'frontotemporal dementia', 'pick disease in psychiatry', 'normal pressure hydrocephalus')) {
    if (cur !== 695) return { toModule: 695, reason: 'Tests progressive dementias (Alzheimer, Lewy body, Vascular, Frontotemporal, NPH), belongs in Psychiatry: Dementia (Module 695).' };
  }
  if (inQA('delirium in psychiatry', 'fluctuating consciousness', 'visual hallucinations in delirium', 'haloperidol in delirium', 'delirium vs dementia')) {
    if (cur !== 694) return { toModule: 694, reason: 'Tests acute confusional state / delirium (acute fluctuating consciousness, organic etiology), belongs in Psychiatry: Delirium (Module 694).' };
  }

  // 692 & 693: Schizophrenia & Psychotic Disorders
  if (inQA('schizophrenia', 'schneider first rank symptoms', 'audible thoughts', 'voices arguing', 'thought insertion', 'thought broadcasting', 'delusional perception', 'paranoid schizophrenia', 'hebephrenic schizophrenia', 'catatonic schizophrenia')) {
    if (cur !== 692) return { toModule: 692, reason: 'Tests schizophrenia spectrum psychopathology (Schneider first rank symptoms, clinical subtypes, dopamine pathways), belongs in Psychiatry: Schizophrenia (Module 692).' };
  }
  if (inQA('schizoaffective disorder', 'delusional disorder', 'erotomanic delusion', 'capgras syndrome', 'fregoli syndrome', 'cotard syndrome', 'folie a deux', 'brief psychotic disorder')) {
    if (cur !== 693) return { toModule: 693, reason: 'Tests non-schizophrenic psychotic disorders (Schizoaffective, Delusional disorder, Capgras, Cotard, Brief psychosis), belongs in Psychiatry: Other Psychotic Disorders (Module 693).' };
  }

  // 690: Specific Treatment Modalities (ECT, Psychotherapies)
  if (inQA('electroconvulsive therapy', 'ect in psychiatry', 'cognitive behavioral therapy', 'dialectical behavior therapy', 'psychoanalysis in psychiatry', 'systematic desensitization')) {
    if (cur !== 690) return { toModule: 690, reason: 'Tests somatic treatments (Modified ECT indications/contraindications) and psychotherapeutic modalities (CBT, DBT, Psychoanalysis), belongs in Psychiatry: Specific Treatment Modalities (Module 690).' };
  }

  // 687 & 688: Personality Theories & Defense Mechanisms & Psychopathology
  if (inQA('defense mechanism', 'sublimation in psychiatry', 'reaction formation', 'projection in psychiatry', 'splitting in psychiatry', 'repression in psychiatry', 'freud in psychiatry', 'id ego superego')) {
    if (cur !== 687) return { toModule: 687, reason: 'Tests psychoanalytic personality theories and mature/immature defense mechanisms, belongs in Psychiatry: Theories of Personality & Defense Mechanisms (Module 687).' };
  }
  if (inQA('hallucination', 'delusion', 'flight of ideas', 'loosening of association', 'neologism in psychiatry', 'waxy flexibility', 'catatonia in psychiatry')) {
    if (cur !== 688) return { toModule: 688, reason: 'Tests elementary psychopathology (Hallucinations, Delusions, Disorders of thought form/stream, Catatonic signs), belongs in Psychiatry: Symptoms and Clinical Manifestations in Psychiatry (Module 688).' };
  }

  return null;
}

// -------------------------------------------------------------
// 4. RADIOLOGY AUDIT LOGIC (Modules 720 to 739)
// -------------------------------------------------------------
function auditRadiology(q) {
  const cur = q.currentModule;
  const qa = q.qa;
  const full = q.full;
  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // 738: Emergency & Interventional Radiology
  if (inQA('fast scan', 'focused assessment with sonography in trauma', 'efast', 'morison pouch', 'transcatheter arterial chemoembolization', 'tace in liver', 'uterine artery embolization', 'percutaneous nephrostomy', 'pcn in radiology', 'ptbd in radiology', 'radiofrequency ablation in radiology')) {
    if (cur !== 738) return { toModule: 738, reason: 'Tests emergency trauma sonography (FAST/eFAST) and vascular/non-vascular interventional radiology procedures, belongs in Radiology: Emergency and Interventional Radiology (Module 738).' };
  }

  // 737: Radiotherapy
  if (inQA('radiotherapy', 'linear accelerator', 'linac', 'imrt in radiotherapy', 'stereotactic radiosurgery', 'gamma knife', 'cyberknife', 'brachytherapy', 'cobalt-60 in radiotherapy', 'iridium-192', '5 rs of radiobiology')) {
    if (cur !== 737) return { toModule: 737, reason: 'Tests radiation oncology principles, radiobiology, external beam radiotherapy (IMRT/SRS), and brachytherapy, belongs in Radiology: Radiotherapy (Module 737).' };
  }

  // 736: Musculoskeletal Imaging
  if (inQA('sunburst appearance', 'codman triangle', 'onion peel appearance', 'soap bubble appearance', 'fallen fragment sign', 'shepherd crook on x-ray', 'bamboo spine on x-ray', 'martel sign on x-ray', 'looser zone on x-ray', 'bone scan', 'mri knee')) {
    if (cur !== 736) return { toModule: 736, reason: 'Tests skeletal radiology, bone tumor periosteal reactions (Sunburst, Codman, Onion-peel), and joint MRI, belongs in Radiology: Musculoskeletal Imaging (Module 736).' };
  }

  // 735: Women's Imaging
  if (inQA('nuchal translucency', 'nt scan in obstetric', 'crown rump length in ultrasound', 'anomaly scan in radiology', 'amniotic fluid index in ultrasound', 'mammography', 'birads', 'microcalcifications in mammography', 'pelvic ultrasound')) {
    if (cur !== 735) return { toModule: 735, reason: 'Tests obstetric sonography (dating, NT scan, anomaly scan) and breast imaging (Mammography, BIRADS), belongs in Radiology: Women\'s Imaging (Module 735).' };
  }

  // 734: Renal Imaging
  if (inQA('intravenous urography', 'ivu in radiology', 'ct urography', 'hydronephrosis on ultrasound', 'twinkle artifact', 'bosniak classification', 'puj obstruction on ivu', 'paintbrush appearance on ivu', 'lobster claw sign on ivu', 'renal cell carcinoma on ct')) {
    if (cur !== 734) return { toModule: 734, reason: 'Tests uroradiology (IVU, CT urography, Bosniak renal cyst classification, hydronephrosis), belongs in Radiology: Renal Imaging (Module 734).' };
  }

  // 733: Hepatobiliary and Pancreatic Imaging
  if (inQA('mrcp', 'magnetic resonance cholangiopancreatography', 'ercp in radiology', 'hemangioma on ct liver', 'peripheral nodular enhancement', 'fnh central stellate scar', 'hcc arterial enhancement', 'gallstones on ultrasound', 'double duct sign on ct', 'acute pancreatitis balthazar')) {
    if (cur !== 733) return { toModule: 733, reason: 'Tests hepatobiliary and pancreatic imaging (Multiphasic liver CT, MRCP, Gallbladder USG, Double-duct sign), belongs in Radiology: Hepatobiliary and Pancreatic Imaging (Module 733).' };
  }

  // 731 & 732: GI Imaging
  if (inQA('barium swallow', 'bird beak sign on barium', 'corkscrew esophagus on barium', 'zenker diverticulum on barium', 'pneumoperitoneum on x-ray', 'gas under diaphragm', 'rigler sign on x-ray', 'football sign on x-ray', 'string sign of pyloric')) {
    if (cur !== 731) return { toModule: 731, reason: 'Tests fluoroscopy of upper GI tract (barium swallow/meal) and radiological signs of pneumoperitoneum, belongs in Radiology: GI Imaging - Upper GI Disorders & Pneumoperitoneum (Module 731).' };
  }
  if (inQA('barium enema', 'apple core lesion on barium', 'coffee bean sign on x-ray', 'sigmoid volvulus on x-ray', 'step ladder pattern on abdominal', 'small bowel obstruction on x-ray', 'intussusception target sign', 'lead pipe colon on barium', 'string sign of kantor')) {
    if (cur !== 732) return { toModule: 732, reason: 'Tests lower GI imaging, mechanical bowel obstruction patterns, volvulus, and barium enema signs, belongs in Radiology: GI Imaging - Lower GI Disorders (Module 732).' };
  }

  // 727, 728, 729: Neuroimaging
  if (inQA('extradural hematoma on ct', 'edh on ct', 'biconvex hyperdensity', 'subdural hematoma on ct', 'sdh on ct', 'crescentic hyperdensity', 'subarachnoid hemorrhage on ct', 'sah on ct', 'star of david on ct', 'dense mca sign', 'dwi restriction in stroke', 'mount fuji sign')) {
    if (cur !== 727) return { toModule: 727, reason: 'Tests emergency neuroimaging of stroke (CT/DWI) and intracranial hemorrhages (EDH, SDH, SAH), belongs in Radiology: Neuroimaging - Neurovascular Disorders, Trauma & CT Brain (Module 727).' };
  }
  if (inQA('glioblastoma on mri', 'butterfly glioma', 'meningioma dural tail sign', 'vestibular schwannoma ice cream cone', 'ring enhancing lesion on ct', 'magic dr', 'neurocysticercosis on ct', 'hole with dot', 'tuberculous meningitis on mri')) {
    if (cur !== 728) return { toModule: 728, reason: 'Tests neuro-oncology (GBM, Meningioma, Schwannoma) and infectious ring-enhancing brain lesions, belongs in Radiology: Neuroimaging - CNS Tumors, Infections & Neurocutaneous Syndromes (Module 728).' };
  }
  if (inQA('mri brain in alzheimer', 'medial temporal lobe atrophy', 'dawson fingers on mri', 'multiple sclerosis plaques on mri', 'hummingbird sign', 'hot cross bun sign', 'normal pressure hydrocephalus evans index')) {
    if (cur !== 729) return { toModule: 729, reason: 'Tests neurodegenerative brain MRI signs (Alzheimer MTA, MS Dawson fingers, PSP hummingbird, NPH), belongs in Radiology: Neuroimaging - MRI Brain in Neurodegenerative Disorders (Module 729).' };
  }

  // 724, 725, 726: Chest Imaging
  if (inQA('silhouette sign on chest', 'air bronchogram on chest', 'cardiothoracic ratio on chest', 'hilum overlay sign')) {
    if (cur !== 724) return { toModule: 724, reason: 'Tests basic chest radiographic physics, projection adequacy, Silhouette sign, and Air bronchograms, belongs in Radiology: Basics of Chest Imaging (Module 724).' };
  }
  if (inQA('signet ring sign on hrct', 'bronchiectasis on hrct', 'honeycombing on hrct', 'garland triad on chest', 'westermark sign', 'hampton hump', 'bat wing appearance', 'kerley b lines', 'miliary mottling on chest')) {
    if (cur !== 725) return { toModule: 725, reason: 'Tests chest imaging of parenchymal lung diseases (HRCT bronchiectasis/ILD, pulmonary edema, PE signs), belongs in Radiology: Chest Imaging - Lung Diseases (Module 725).' };
  }
  if (inQA('pleural effusion on chest', 'meniscus sign on chest', 'pneumothorax on chest', 'deep sulcus sign', 'hydropneumothorax on chest', 'anterior mediastinal mass 4ts', 'thymoma on chest ct')) {
    if (cur !== 726) return { toModule: 726, reason: 'Tests pleural fluid/air collections (Meniscus sign, Deep sulcus sign) and mediastinal compartments, belongs in Radiology: Chest Imaging - Pleural and Mediastinal Conditions (Module 726).' };
  }

  // 720, 721, 722: Radiation Physics & Contrast
  if (inQA('x-ray tube in radiology', 'bremsstrahlung radiation', 'heel effect in x-ray', 'digital radiography in radiology', 'computed radiography in radiology')) {
    if (cur !== 720) return { toModule: 720, reason: 'Tests X-ray tube physics, Bremsstrahlung radiation, Heel effect, and CR/DR digital detectors, belongs in Radiology: Fundamentals of Imaging (Module 720).' };
  }
  if (inQA('radiation protection in radiology', 'alara principle', 'sievert in radiation', 'tld badge', 'lead apron', 'stochastic vs deterministic')) {
    if (cur !== 721) return { toModule: 721, reason: 'Tests radiation dosimetry units, ALARA principle, lead shielding, and TLD monitoring, belongs in Radiology: Radiation - Exposure and Protection (Module 721).' };
  }
  if (inQA('contrast media in radiology', 'non-ionic contrast', 'contrast induced nephropathy', 'barium sulfate contraindication', 'gadolinium in mri', 'nephrogenic systemic fibrosis')) {
    if (cur !== 722) return { toModule: 722, reason: 'Tests iodinated contrast media reactions, CIN prevention, Barium contraindications, and Gadolinium/NSF, belongs in Radiology: Contrast Media and Patient Preparation (Module 722).' };
  }

  return null;
}

// -------------------------------------------------------------
// EXECUTE AUDITS SEQUENTIALLY
// -------------------------------------------------------------
async function run() {
  processSubject('Dermatology', 'tools/live_fresh_dermatology.json', auditDermatology, 'tools/audit_deep_dermatology.json');
  processSubject('Orthopaedics', 'tools/live_fresh_orthopaedics.json', auditOrthopaedics, 'tools/audit_deep_orthopaedics.json');
  processSubject('Psychiatry', 'tools/live_fresh_psychiatry.json', auditPsychiatry, 'tools/audit_deep_psychiatry.json');
  processSubject('Radiology', 'tools/live_fresh_radiology.json', auditRadiology, 'tools/audit_deep_radiology.json');
  console.log('\nAll 4 final subject audits completed successfully!');
  process.exit(0);
}

run();
