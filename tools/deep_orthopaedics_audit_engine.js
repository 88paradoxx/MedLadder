const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/live_orthopaedics_fresh.json', 'utf8'));
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

console.log(`Loaded ${questions.length} questions for Deep Orthopaedics Audit.`);

function auditQuestion(q) {
  const cur = q.currentModule;
  const id = q.id;
  const qa = q.qa;
  const full = q.full;
  const text = q.qText.toLowerCase();
  const ans = q.ansText.toLowerCase();

  const inQA = (...terms) => terms.some(t => qa.includes(t.toLowerCase()));
  const inText = (...terms) => terms.some(t => text.includes(t.toLowerCase()));
  const inAns = (...terms) => terms.some(t => ans.includes(t.toLowerCase()));
  const inFull = (...terms) => terms.some(t => full.includes(t.toLowerCase()));

  // =========================================================================
  // 1. CROSS-SUBJECT DISCRIMINATION
  // =========================================================================

  // PSM: Biomedical Waste
  if (inQA('biomedical waste', 'yellow bag', 'red bag', 'black bag', 'blue cardboard') && !inFull('fracture', 'bone')) {
    return { toModule: 396, reason: 'Biomedical waste management belongs to PSM: Biomedical Waste Management (Module 396).' };
  }

  // Anatomy: Pure Neuroanatomy / Brachial plexus trunks
  if (inQA('brachial plexus roots', 'cords of brachial plexus', 'branches of posterior cord', 'erbs point anatomy') && !inFull('fracture', 'dislocation', 'drop')) {
    return { toModule: 10, reason: 'Gross anatomy of the brachial plexus belongs to Anatomy: Upper Limb - Brachial Plexus and Axilla (Module 10).' };
  }

  // Medicine: Pure SLE / Scleroderma systemic immunology
  if (inQA('systemic lupus erythematosus', 'lupus nephritis', 'anti-dsdna', 'anti-smith') && inFull('renal', 'glomerulonephritis') && !inFull('arthroplasty', 'fracture')) {
    return { toModule: 474, reason: 'Systemic lupus erythematosus internal organ pathology belongs to Internal Medicine: Connective Tissue Disorders (Module 474).' };
  }

  // =========================================================================
  // 2. GRANULAR INTRA-ORTHOPAEDICS SPECIALTY ROUTING (Modules 657 to 686)
  // =========================================================================

  // 685: Sports Injury (Rotator Cuff Tears, Shoulder Impingement, Achilles Tendon, Ankle Sprains)
  if (inQA('rotator cuff tear', 'supraspinatus tear', 'empty can test', 'jobe test', 'drop arm test', 'subscapularis tear', 'lift off test', 'belly press test', 'shoulder impingement', 'neer test', 'hawkins kennedy', 'ankle sprain', 'anterior talofibular ligament', 'atfl', 'achilles tendon rupture', 'thompson test', 'simmonds test', 'weekend warrior achilles', 'quadriceps tendon rupture', 'patellar tendon rupture')) {
    if (cur !== 685) return { toModule: 685, reason: 'Tests sports medicine injuries (Rotator cuff tears, Subacromial impingement, ATFL ankle sprains, Achilles tendon ruptures), belongs in Orthopaedics: Sports Injury (Module 685).' };
  }

  // 684: Trauma Amputations, Prosthetics & Joint Replacement Surgery
  if (inQA('amputation', 'syme amputation', 'below knee amputation', 'bka', 'above knee amputation', 'aka', 'phantom limb pain', 'prosthetic socket', 'total hip arthroplasty', 'total knee arthroplasty', 'tha', 'tka', 'pmma bone cement', 'periprosthetic joint infection', 'aseptic loosening of prosthesis', 'vancouver classification')) {
    if (cur !== 684) return { toModule: 684, reason: 'Tests amputation levels (Syme/BKA/AKA), prosthetic biomechanics, and total joint arthroplasty (THA/TKA) complications, belongs in Orthopaedics: Trauma Amputations, Prosthetics and Joint Replacement Surgery (Module 684).' };
  }

  // 683: Malignant Tumors of Bone (Osteosarcoma, Ewing Sarcoma, Chondrosarcoma, Multiple Myeloma, Bone Metastases)
  if (inQA('osteosarcoma', 'sunburst appearance', 'sun ray appearance', 'codman triangle', 'map regimen', 'ewing sarcoma', 'onion peel appearance', 't(11;22)', 'ews-fli1', 'small round blue cell in bone', 'mic2', 'cd99', 'chondrosarcoma', 'popcorn calcification in bone', 'multiple myeloma in bone', 'punched out lytic lesion', 'bence jones', 'm-spike in myeloma', 'skeletal metastases', 'osteoblastic metastases', 'prostate metastasis to bone')) {
    if (cur !== 683) return { toModule: 683, reason: 'Tests primary malignant bone tumors (Osteosarcoma, Ewing sarcoma, Chondrosarcoma) and secondary skeletal metastases/myeloma, belongs in Orthopaedics: Malignant Tumors of Bone (Module 683).' };
  }

  // 682: Benign Tumors of Bone (GCT, Osteoid Osteoma, Osteochondroma, ABC, UBC, Enchondroma, Fibrous Dysplasia)
  if (inQA('osteochondroma', 'exostosis', 'cartilage cap > 1.5', 'osteoid osteoma', 'nidus', 'radiofrequency ablation of osteoid', 'osteoblastoma', 'giant cell tumor of bone', 'osteoclastoma', 'gct in bone', 'soap bubble appearance', 'epiphyseal tumor in bone', 'enchondroma', 'ollier disease', 'maffucci', 'aneurysmal bone cyst', 'abc in bone', 'fluid-fluid level in bone', 'unicameral bone cyst', 'simple bone cyst', 'ubc in bone', 'fallen fragment sign', 'fibrous dysplasia', 'shepherd crook', 'ground glass in fibrous dysplasia', 'mccune albright in bone')) {
    if (cur !== 682) return { toModule: 682, reason: 'Tests benign bone tumors and cystic/dysplastic bone lesions (GCT, Osteoid osteoma, Osteochondroma, ABC, UBC, Fibrous dysplasia), belongs in Orthopaedics: Benign Tumors Of Bone (Module 682).' };
  }

  // 681: Nerve Injuries (Seddon Classification, Radial, Ulnar, Median, Peroneal, Sciatic)
  if (inQA('seddon classification', 'sunderland classification', 'neuropraxia', 'axonotmesis', 'neurotmesis', 'wallerian degeneration', 'radial nerve palsy', 'wrist drop', 'posterior interosseous nerve', 'pin palsy', 'finger drop', 'median nerve palsy', 'hand of benediction', 'pointing index', 'ape thumb', 'ulnar nerve palsy', 'claw hand', 'main en griffe', 'ulnar paradox', 'froment sign', 'wartenberg sign', 'common peroneal nerve', 'foot drop', 'high stepping gait', 'sciatic nerve injury in hip')) {
    if (cur !== 681) return { toModule: 681, reason: 'Tests peripheral nerve injuries, Seddon/Sunderland classifications, and entrapment/paralysis neuropathies (Radial/Ulnar/Median/Peroneal), belongs in Orthopaedics: Nerve Injuries (Module 681).' };
  }

  // 680: Rheumatoid Arthritis, Osteoarthritis, Ankylosing Spondylitis, Gout, Pseudogout
  if (inQA('osteoarthritis', 'eburnation', 'heberden node', 'bouchard node', 'subchondral sclerosis in oa', 'joint space narrowing in oa', 'rheumatoid arthritis in hand', 'swan neck deformity', 'boutonniere deformity', 'z deformity', 'atlantoaxial subluxation in ra', 'pannus in ra', 'ankylosing spondylitis', 'bamboo spine', 'sacroiliitis on x-ray', 'hla-b27', 'dagger sign', 'gout in joint', 'monosodium urate', 'negatively birefringent needle', 'martel sign', 'pseudogout', 'calcium pyrophosphate', 'chondrocalcinosis')) {
    if (cur !== 680) return { toModule: 680, reason: 'Tests degenerative osteoarthritis, rheumatoid arthritis deformities, ankylosing spondylitis, gout, and pseudogout, belongs in Orthopaedics: Rheumatoid Arthritis and Osteoarthritis (Module 680).' };
  }

  // 679: Paget's Disease and Hyperparathyroidism
  if (inQA('paget disease of bone', 'osteitis deformans', 'mosaic pattern of lamellar bone', 'blade of grass sign', 'candle flame sign', 'cotton wool skull', 'picture frame vertebra', 'osteosarcoma in paget', 'hyperparathyroidism in bone', 'osteitis fibrosa cystica', 'brown tumor', 'subperiosteal bone resorption in phalanges', 'salt and pepper skull')) {
    if (cur !== 679) return { toModule: 679, reason: 'Tests Paget disease of bone (Osteitis deformans) and hyperparathyroid metabolic bone disease (Brown tumors, subperiosteal resorption), belongs in Orthopaedics: Paget\'s Disease and Hyperparathyroidism (Module 679).' };
  }

  // 678: Osteoporosis and Osteomalacia
  if (inQA('osteoporosis', 'dexa scan t-score', 't-score <= -2.5', 'fragility fracture', 'bisphosphonate in osteoporosis', 'alendronate in osteoporosis', 'zoledronic acid in osteoporosis', 'teriparatide', 'denosumab in osteoporosis', 'osteomalacia in adult', 'looser zone', 'milkman pseudofracture')) {
    if (cur !== 678) return { toModule: 678, reason: 'Tests osteoporosis screening (DEXA T-score), antiresorptive/anabolic pharmacotherapy, and adult osteomalacia (Looser zones), belongs in Orthopaedics: Osteoporosis and Osteomalacia (Module 678).' };
  }

  // 677: Metabolic Bone Diseases in Children (Rickets, Scurvy, Osteogenesis Imperfecta, Osteopetrosis)
  if (inQA('rickets in child', 'rachitic rosary', 'craniotabes in rickets', 'harrison sulcus', 'cupping and fraying of metaphysis', 'splaying of metaphysis', 'scurvy in bone', 'wimberger ring sign', 'pelkan spur', 'white line of fraenkel', 'trummerfeld zone', 'osteogenesis imperfecta', 'blue sclera in bone', 'brittle bone disease', 'col1a1', 'osteopetrosis', 'marble bone disease', 'erlenmeyer flask deformity in osteopetrosis', 'bone in bone appearance')) {
    if (cur !== 677) return { toModule: 677, reason: 'Tests pediatric metabolic and genetic bone disorders (Rickets, Scurvy, Osteogenesis imperfecta, Osteopetrosis), belongs in Orthopaedics: Metabolic Bone Diseases in Children (Module 677).' };
  }

  // 676: Congenital Malformations, Perthes Disease and SCFE (DDH, Perthes, SCFE)
  if (inQA('developmental dysplasia of the hip', 'ddh in child', 'barlow test', 'ortolani test', 'galeazzi sign', 'perkins line', 'hilgenreiner line', 'shenton line broken', 'pavlik harness in ddh', 'perthes disease', 'legg-calve-perthes', 'crescent sign in perthes', 'herring lateral pillar', 'slipped capital femoral epiphysis', 'scfe in adolescent', 'klein line', 'trethowan sign', 'cannulated screw in scfe')) {
    if (cur !== 676) return { toModule: 676, reason: 'Tests pediatric hip conditions (DDH screening/Pavlik, Legg-Calve-Perthes disease, SCFE Trethowan sign/pinning), belongs in Orthopaedics: Congenital Malformations, Perthes Disease and SCFE (Module 676).' };
  }

  // 675: CTEV, Genu Varum and Valgum
  if (inQA('congenital talipes equinovarus', 'ctev in newborn', 'clubfoot in child', 'cave deformity in ctev', 'ponseti method', 'pirani score', 'dimeglio score', 'achilles tenotomy in ctev', 'kite angle', 'foot abduction brace in ctev', 'genu varum', 'bow legs in child', 'blount disease', 'tibia vara', 'genu valgum', 'knock knees')) {
    if (cur !== 675) return { toModule: 675, reason: 'Tests clubfoot (CTEV Ponseti casting technique / Pirani score) and pediatric angular knee deformities (Genu varum / valgum, Blount disease), belongs in Orthopaedics: CTEV, Genu Varum and Valgum (Module 675).' };
  }

  // 674: Fractures in Children (Salter-Harris, Greenstick, Torus)
  if (inQA('salter-harris', 'salter harris', 'physeal fracture', 'epiphyseal plate injury', 'thurston holland sign', 'greenstick fracture', 'torus fracture', 'buckle fracture', 'plastic deformation in child bone', 'remodeling of pediatric fracture')) {
    if (cur !== 674) return { toModule: 674, reason: 'Tests pediatric skeletal trauma, Salter-Harris physeal injury classification (Types I-V), and incomplete fracture patterns (Greenstick/Torus), belongs in Orthopaedics: Fractures in Children (Module 674).' };
  }

  // 673: Skeletal Tuberculosis (Pott's Spine, TB Hip, TB Knee, Spina Ventosa)
  if (inQA('pott disease', 'pott spine', 'tuberculous spondylitis', 'paradiscal lesion in pott', 'gibbus deformity', 'cold abscess in spine', 'psoas abscess in pott', 'pott paraplegia', 'tb hip', 'wandering acetabulum in tb', 'tb knee', 'triple deformity of knee', 'spina ventosa', 'tuberculous dactylitis')) {
    if (cur !== 673) return { toModule: 673, reason: 'Tests skeletal tuberculosis (Pott disease of spine, Gibbus deformity, Psoas abscess, TB hip/knee, Spina ventosa), belongs in Orthopaedics: Skeletal Tuberculosis (Module 673).' };
  }

  // 672: Infections of the Bone (Osteomyelitis, Sequestrum, Involucrum, Brodie's Abscess, Septic Arthritis)
  if (inQA('acute osteomyelitis', 'chronic osteomyelitis', 'sequestrum in osteomyelitis', 'involucrum in osteomyelitis', 'cloaca in bone infection', 'brodie abscess', 'septic arthritis in joint', 'arthrocentesis in septic arthritis', 'staphylococcus aureus in osteomyelitis')) {
    if (cur !== 672) return { toModule: 672, reason: 'Tests pyogenic bone and joint infections (Acute/Chronic osteomyelitis hallmarks Sequestrum/Involucrum, Brodie abscess, Septic arthritis), belongs in Orthopaedics: Infections of the Bone (Module 672).' };
  }

  // 671: Injuries of Pelvis & Acetabulum
  if (inQA('pelvic fracture', 'open book pelvic fracture', 'young burgess classification', 'tile classification of pelvis', 'pelvic binder at greater trochanter', 'acetabulum fracture', 'judet letournel classification', 'spur sign in acetabulum', 'floating acetabulum')) {
    if (cur !== 671) return { toModule: 671, reason: 'Tests high-energy pelvic ring disruptions (Young-Burgess / Tile classifications, Pelvic binder) and acetabular fractures, belongs in Orthopaedics: Injuries of Pelvis (Module 671).' };
  }

  // 670: Spondylolisthesis & IVDP
  if (inQA('intervertebral disc prolapse', 'ivdp in lumbar', 'herniated nucleus pulposus', 'straight leg raise test in disc', 'slrt in lumbar', 'crossed slrt', 'cauda equina syndrome in disc', 'saddle anesthesia in cauda', 'spondylolysis in lumbar', 'pars interarticularis defect', 'scottie dog collar', 'spondylolisthesis', 'meyerding grading')) {
    if (cur !== 670) return { toModule: 670, reason: 'Tests lumbar disc prolapse (IVDP, SLRT, emergency Cauda equina syndrome) and pars interarticularis spondylolysis/spondylolisthesis, belongs in Orthopaedics: Spondylolisthesis & IVDP (Module 670).' };
  }

  // 669: Regional Conditions of Spine (Lumbar Canal Stenosis, Scoliosis, Kyphosis)
  if (inQA('lumbar canal stenosis', 'neurogenic claudication in spine', 'shopping cart sign in spine', 'scoliosis', 'cobb angle in scoliosis', 'adam forward bend test', 'scoliometer in scoliosis', 'milwaukee brace', 'boston brace in scoliosis', 'scheuermann disease', 'juvenile kyphosis', 'schmorl node')) {
    if (cur !== 669) return { toModule: 669, reason: 'Tests non-traumatic structural spinal deformities (Lumbar canal stenosis, Adolescent idiopathic scoliosis Cobb angle, Scheuermann kyphosis), belongs in Orthopaedics: Regional Conditions of Spine (Module 669).' };
  }

  // 668: Injuries of Spine (Jefferson, Hangman, Odontoid, Chance, Denis 3-Column)
  if (inQA('denis three column', 'middle column in spine fracture', 'jefferson fracture', 'burst fracture of atlas', 'hangman fracture', 'traumatic spondylolisthesis of c2', 'odontoid peg fracture', 'anderson d alonzo', 'chance fracture', 'seatbelt fracture of spine', 'clay shoveler fracture')) {
    if (cur !== 668) return { toModule: 668, reason: 'Tests cervical and thoracolumbar spinal trauma (Jefferson, Hangman, Odontoid, Chance fractures, Denis three-column classification), belongs in Orthopaedics: Injuries of Spine (Module 668).' };
  }

  // 667: AVN and Regional Conditions of Lower Limb
  if (inQA('avascular necrosis of femoral head', 'avn of femoral head', 'ficat arlet staging', 'crescent sign in avn', 'double line sign in avn', 'core decompression in avn', 'plantar fasciitis', 'windlass mechanism in foot', 'morton neuroma', 'mulder click', 'hallux valgus', 'bunion in foot')) {
    if (cur !== 667) return { toModule: 667, reason: 'Tests avascular necrosis (AVN Ficat-Arlet/Core decompression) and foot/ankle regional syndromes (Plantar fasciitis, Morton neuroma), belongs in Orthopaedics: AVN and Regional Conditions of Lower Limb (Module 667).' };
  }

  // 666: Injuries of Knee, Leg and Foot (ACL, PCL, Meniscus, Patella, Tibia, Calcaneus, Talus, Lisfranc)
  if (inQA('anterior cruciate ligament tear', 'acl tear in knee', 'lachman test in knee', 'anterior drawer in knee', 'pivot shift test in knee', 'segond fracture', 'bptb graft in acl', 'posterior cruciate ligament', 'pcl tear', 'posterior sag sign', 'meniscal tear in knee', 'mcmurray test', 'bucket handle tear in knee', 'unhappy triad of o donoghue', 'patellar fracture', 'tension band wiring in patella', 'tibial plateau fracture', 'schatzker classification', 'danis weber classification', 'calcaneus fracture', 'lover fracture in calcaneus', 'bohler angle < 20', 'talus fracture', 'hawkins classification in talus', 'hawkins sign in talus', 'jones fracture in 5th metatarsal')) {
    if (cur !== 666) return { toModule: 666, reason: 'Tests knee ligamentous/meniscal injuries (ACL/Lachman, Meniscal tears), tibial fractures, ankle trauma (Danis-Weber), and calcaneal/talar injuries, belongs in Orthopaedics: Injuries of Knee, Leg and Foot (Module 666).' };
  }

  // 665: Fractures of Femur (Femoral Neck, Intertrochanteric, Subtrochanteric, Shaft)
  if (inQA('femoral neck fracture', 'neck of femur fracture', 'garden classification of femoral neck', 'pauwels classification in femur', 'cannulated screws in femoral neck', 'hemiarthroplasty in femoral neck', 'intertrochanteric fracture', 'dynamic hip screw in intertrochanteric', 'dhs in intertrochanteric', 'proximal femoral nail in intertrochanteric', 'pfn in femur', 'subtrochanteric fracture', 'femoral shaft fracture', 'interlocking nail in femur', 'winquist classification')) {
    if (cur !== 665) return { toModule: 665, reason: 'Tests proximal femoral fractures (Femoral neck Garden/Pauwels, Intertrochanteric DHS/PFN) and femoral shaft fractures, belongs in Orthopaedics: Fractures of Femur (Module 665).' };
  }

  // 664: Dislocations of the Hip Joint (Posterior vs Anterior Hip Dislocation)
  if (inQA('posterior dislocation of hip', 'anterior dislocation of hip', 'dashboard injury in hip dislocation', 'flexion adduction and internal rotation in hip', 'fadir in hip', 'allis technique in hip dislocation', 'stimson method in hip', 'sciatic nerve in hip dislocation')) {
    if (cur !== 664) return { toModule: 664, reason: 'Tests traumatic hip dislocations (posterior FADIR vs anterior FABER, dashboard injury mechanism, Allis/Stimson reductions), belongs in Orthopaedics: Dislocations of the Hip Joint (Module 664).' };
  }

  // 663: Regional Conditions of the Upper Limb (CTS, De Quervain, Tennis/Golfer Elbow, Dupuytren, Trigger Finger)
  if (inQA('carpal tunnel syndrome in wrist', 'flexor retinaculum in median nerve', 'durkan test in cts', 'phalen test in cts', 'tinel sign in cts', 'cubital tunnel syndrome', 'de quervain tenosynovitis', 'finkelstein test', 'abductor pollicis longus and extensor pollicis brevis', 'trigger finger in hand', 'a1 pulley in finger', 'dupuytren contracture', 'palmar aponeurosis contracture', 'hueston table top test', 'tennis elbow in arm', 'lateral epicondylitis', 'extensor carpi radialis brevis in tennis', 'cozen test in tennis elbow', 'golfer elbow', 'medial epicondylitis')) {
    if (cur !== 663) return { toModule: 663, reason: 'Tests upper limb regional tenosynovitis and entrapments (CTS Phalen/Durkan, De Quervain Finkelstein, Tennis/Golfer elbow, Dupuytren contracture), belongs in Orthopaedics: Regional Conditions of the Upper Limb (Module 663).' };
  }

  // 662: Injuries of Hand & Wrist (Colles, Smith, Barton, Scaphoid, Bennett, Rolando, Boxer, Mallet)
  if (inQA('colles fracture', 'dinner fork deformity', 'smith fracture in wrist', 'garden spade deformity', 'barton fracture in wrist', 'volar barton', 'scaphoid fracture in wrist', 'anatomical snuffbox tenderness', 'avascular necrosis of scaphoid', 'bennett fracture', 'abductor pollicis longus in bennett', 'rolando fracture', 'boxer fracture in hand', 'mallet finger', 'gamekeeper thumb', 'skier thumb', 'stener lesion in thumb')) {
    if (cur !== 662) return { toModule: 662, reason: 'Tests wrist and hand trauma (Colles dinner-fork, Smith garden-spade, Scaphoid AVN risk, Bennett/Rolando, Mallet finger), belongs in Orthopaedics: Injuries of Hand (Module 662).' };
  }

  // 661: Injuries of Elbow and Forearm (Supracondylar Humerus, Monteggia, Galeazzi, Radial Head, Pulled Elbow)
  if (inQA('supracondylar fracture of humerus', 'anterior humeral line in elbow', 'baumann angle in elbow', 'volkmann ischemic contracture in supracondylar', 'anterior interosseous nerve in supracondylar', 'ain palsy in supracondylar', 'cubitus varus in supracondylar', 'gunstock deformity', 'three point bony relationship of elbow', 'monteggia fracture dislocation', 'bado classification', 'galeazzi fracture dislocation', 'radial head fracture', 'mason classification in radial head', 'essex-lopresti', 'pulled elbow in toddler', 'nursemaid elbow in child', 'annular ligament subluxation')) {
    if (cur !== 661) return { toModule: 661, reason: 'Tests elbow and forearm fractures (Supracondylar humerus AIN/VIC risk, Monteggia, Galeazzi, Pulled elbow), belongs in Orthopaedics: Injuries of Elbow and Forearm (Module 661).' };
  }

  // 660: Injuries of Clavicle, Shoulder and Arm (Clavicle, Shoulder Dislocation, Proximal/Shaft Humerus)
  if (inQA('clavicle fracture', 'anterior shoulder dislocation', 'squared off shoulder deformity', 'dugas test in shoulder', 'bankart lesion in shoulder', 'hill sachs lesion in shoulder', 'axillary nerve in shoulder dislocation', 'kocher method in shoulder', 'posterior shoulder dislocation', 'light bulb sign in shoulder', 'proximal humerus fracture', 'neer classification of proximal humerus', 'shaft of humerus fracture', 'holstein lewis fracture', 'radial nerve palsy in humerus fracture')) {
    if (cur !== 660) return { toModule: 660, reason: 'Tests shoulder girdle injuries (Anterior shoulder dislocation Bankart/Hill-Sachs, Clavicle, Proximal and shaft humerus fractures), belongs in Orthopaedics: Injuries of Clavicle, Shoulder and Arm (Module 660).' };
  }

  // 659: Regional Conditions of Neck (Cervical Spondylosis, Thoracic Outlet, Torticollis, Klippel-Feil)
  if (inQA('cervical spondylosis', 'spurling test in neck', 'cervical rib in neck', 'thoracic outlet syndrome', 'adson test in thoracic outlet', 'congenital muscular torticollis', 'wry neck', 'sternocleidomastoid tumor in infant', 'klippel feil syndrome', 'triad of short neck low posterior hairline')) {
    if (cur !== 659) return { toModule: 659, reason: 'Tests non-traumatic cervical spine and neck conditions (Cervical spondylosis Spurling, Thoracic outlet syndrome, Congenital muscular torticollis, Klippel-Feil), belongs in Orthopaedics: Regional Conditions of Neck (Module 659).' };
  }

  // 658: Complications of Fracture (Compartment Syndrome, Fat Embolism, VIC, CRPS/Sudeck, Non-Union)
  if (inQA('compartment syndrome in fracture', '5ps in compartment syndrome', 'fasciotomy in compartment syndrome', 'volkmann ischemic contracture', 'fat embolism syndrome in fracture', 'gurd criteria in fat embolism', 'sudeck atrophy in fracture', 'complex regional pain syndrome in fracture', 'crps in fracture', 'non union in fracture', 'hypertrophic non union', 'atrophic non union', 'malunion in fracture', 'myositis ossificans in elbow')) {
    if (cur !== 658) return { toModule: 658, reason: 'Tests severe acute and late complications of skeletal trauma (Compartment syndrome fasciotomy, Fat embolism, CRPS, Non-union types), belongs in Orthopaedics: Complications of Fracture (Module 658).' };
  }

  // 657: Basics of Fracture and its Management (Gustilo-Anderson, Bone Healing, Fixation Principles, Casts)
  if (inQA('gustilo anderson classification', 'open fracture classification', 'primary bone healing', 'secondary bone healing', 'callus formation in fracture', 'plaster of paris in fracture', 'thomas splint', 'bohler braun frame', 'skeletal traction in fracture', 'steinmann pin', 'denham pin', 'kirschner wire', 'k wire in fracture', 'open reduction and internal fixation', 'orif in fracture', 'dynamic compression plate in fracture', 'locking compression plate in fracture', 'intramedullary interlocking nail', 'tension band wiring principle', 'ilizarov fixator in fracture')) {
    if (cur !== 657) return { toModule: 657, reason: 'Tests fracture classification (Gustilo-Anderson), bone healing biology, splinting/traction, and internal/external fixation principles, belongs in Orthopaedics: Basics of Fracture and its Management (Module 657).' };
  }

  return null;
}

const moves = [];
questions.forEach(q => {
  const res = auditQuestion(q);
  if (res && res.toModule !== q.currentModule) {
    moves.push({
      id: q.id,
      fromModule: q.currentModule,
      toModule: res.toModule,
      reason: res.reason
    });
  }
});

console.log(`\n================ ORTHOPAEDICS DEEP AUDIT RESULTS ================`);
console.log(`Total Questions Audited: ${questions.length}`);
console.log(`Questions Verified Correct: ${questions.length - moves.length} (${(((questions.length - moves.length) / questions.length) * 100).toFixed(1)}%)`);
console.log(`Questions Flagged for Relocation: ${moves.length} (${((moves.length / questions.length) * 100).toFixed(1)}%)`);

const out = {
  subject: 'Orthopaedics',
  totalQuestions: questions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_orthopaedics.json', JSON.stringify(out, null, 2));
console.log('Saved findings to tools/audit_deep_orthopaedics.json');

// Generate markdown report
let md = '# Orthopaedics Deep-Dive Curriculum Audit Report\n\n';
md += `**Total Questions Audited:** ${questions.length}\n`;
md += `**Flagged for Relocation:** ${moves.length} (${((moves.length / questions.length) * 100).toFixed(1)}%)\n`;
md += `**Retained in Current Module:** ${questions.length - moves.length} (${(((questions.length - moves.length) / questions.length) * 100).toFixed(1)}%)\n\n`;
md += '## Reallocated Questions Summary\n\n';
md += '| ID | Current Module | Target Module | Rationale |\n';
md += '| :--- | :--- | :--- | :--- |\n';

moves.slice(0, 50).forEach(m => {
  const fromMod = modLookup[m.fromModule] || { moduleName: 'Unknown' };
  const toMod = modLookup[m.toModule] || { moduleName: 'Unknown' };
  md += `| **${m.id}** | Mod ${m.fromModule}: ${fromMod.moduleName} | **Mod ${m.toModule}: ${toMod.moduleName}** | ${m.reason} |\n`;
});

if (moves.length > 50) {
  md += `\n*... and ${moves.length - 50} more questions documented in audit_deep_orthopaedics.json*\n`;
}

fs.writeFileSync('tools/orthopaedics_flagged_questions.md', md, 'utf8');
console.log('Saved markdown summary to tools/orthopaedics_flagged_questions.md');
process.exit(0);
