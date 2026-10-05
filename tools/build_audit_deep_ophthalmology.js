const fs = require('fs');

const rawQuestions = JSON.parse(fs.readFileSync('tools/ophthalmology_questions_raw.json', 'utf8'));
const qMap = new Map(rawQuestions.map(q => [q.id, q]));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = new Map(allModules.map(m => [m.moduleId, m]));

const moves = [];
const seenIds = new Set();

function recordMove(id, toMod, reason) {
  if (seenIds.has(id)) {
    console.error('DUPLICATE MOVE FOR ID:', id);
    return;
  }
  const q = qMap.get(id);
  if (!q) {
    console.error('ERROR: Question ID ' + id + ' not found in raw questions!');
    return;
  }
  if (q.module_id === toMod) {
    console.warn('WARN: Question ID ' + id + ' is already in module ' + toMod + '!');
    return;
  }
  if (!modMap.has(toMod)) {
    console.error('ERROR: Target module ' + toMod + ' does not exist in 740 modules!');
    return;
  }
  seenIds.add(id);
  moves.push({
    id: q.id,
    fromModule: q.module_id,
    toModule: toMod,
    reason: reason
  });
}

// =========================================================================
// SECTION 1: CROSS-SUBJECT MOVES (OUTSIDE OPHTHALMOLOGY)
// =========================================================================

// Obstetrics & Gynaecology
recordMove(22336, 549, 'Refractory postpartum hemorrhage managed with Carboprost (PGF2a) belongs to Obstetrics (Postpartum Haemorrhage).');
recordMove(13986, 570, 'Most common malignancy of the fallopian tube (serous adenocarcinoma) belongs to Obstetrics & Gynaecology (Ovarian Tumors / Adnexal Malignancies).');

// Surgery / Pathology / Oncology
recordMove(19659, 490, 'Tamoxifen side effects in breast cancer increasing risk of endometrial carcinoma belongs to Surgery (Carcinoma Breast - Treatment).');
recordMove(13982, 137, 'P53 tumor suppressor gene inducing cell cycle arrest at G1/S belongs to Pathology (Molecular Basis of Cancer and Tumor Immunity).');
recordMove(13983, 135, 'Male-to-male transmission as diagnostic feature of Autosomal Dominant inheritance belongs to Pathology (Chromosomal Disorders and Other Genetic Diseases).');
recordMove(13984, 135, 'Autosomal dominant inheritance recurrence risk calculation (50% transmission) belongs to Pathology (Chromosomal Disorders and Other Genetic Diseases).');
recordMove(13985, 492, 'Orphan Annie eye nuclei characteristic of papillary thyroid carcinoma belongs to Surgery (Thyroid Malignancies) / Pathology.');

// Microbiology / Infectious Diseases
recordMove(21765, 210, 'Zika virus congenital infection causing microcephaly in fetus belongs to Microbiology (Arboviruses and Picorna Viruses).');

// Pharmacology / Psychiatry
recordMove(28693, 234, 'Valproate mood stabilizer causing hyperammonemia and hepatotoxicity belongs to Pharmacology (Anti-manic Drugs).');
recordMove(13987, 254, 'Glucocorticoid potency and anti-inflammatory activity comparison belongs to Pharmacology (Corticosteroids).');
recordMove(13988, 254, 'Steroid with maximum mineralocorticoid activity (fludrocortisone) belongs to Pharmacology (Corticosteroids).');

// Medicine / Rheumatology
recordMove(6415, 441, 'Young male with post-chlamydial urethritis, reactive arthritis, and conjunctival injection belongs to Medicine (Rheumatoid Arthritis and Spondyloarthropathies).');
recordMove(13434, 653, 'Anti-histone antibodies characteristic of drug-induced lupus erythematosus belongs to Dermatology / Rheumatology (Connective Tissue Disorders).');

// ENT (Otolaryngology)
recordMove(11270, 298, 'Meatoplasty surgical reconstruction of the cartilaginous external auditory canal belongs to ENT (Disorders of External Ear).');
recordMove(11414, 302, 'Episodic vertigo, tinnitus, and sensorineural hearing loss in Meniere disease (endolymphatic hydrops) belongs to ENT (Meniere\'s Disease).');
recordMove(11418, 302, 'Unilateral vs bilateral involvement and audiologic features in Meniere disease belongs to ENT (Meniere\'s Disease).');
recordMove(11419, 302, 'Lermoyez syndrome (reverse Meniere disease) and vestibular symptoms belong to ENT (Meniere\'s Disease).');

// Forensic Medicine & Toxicology
recordMove(13989, 275, 'Definition of juvenile under the Juvenile Justice Act belongs to Forensic Medicine (BNS, BNSS, and BSA / Legal Medicine).');
recordMove(13991, 278, 'Ectopic bruising (spectacle hematoma / black eye) from fracture of anterior cranial fossa belongs to Forensic Medicine (Mechanical Injuries).');
recordMove(13992, 282, 'Postmortem neck ligature marks in hanging vs strangulation belong to Forensic Medicine (Mechanical Asphyxia).');
recordMove(13993, 288, 'Vitriolage (corrosive acid attack) definition and legal aspects belong to Forensic Medicine (Corrosives and Asphyxiants).');

// Community Medicine / PSM
recordMove(13994, 384, 'Jowar diet leading to pellagra due to high leucine content belongs to PSM (Food Quality and Processing).');
recordMove(13995, 384, 'Epidemic dropsy caused by sanguinarine toxin in adulterated mustard oil belongs to PSM (Food Quality and Processing).');
recordMove(13996, 384, 'Essential fatty acids and linolenic acid content in dietary oils belong to PSM (Food Quality and Processing).');
recordMove(13997, 392, 'Aeration tank as core biological unit of activated sludge process belongs to PSM (Waste and Sewage Disposal).');
recordMove(14002, 477, 'Post-exposure prophylaxis (PEP) window for HIV within 72 hours belongs to Medicine (HIV / AIDS - Epidemiology and Diagnosis).');


// =========================================================================
// SECTION 2: INTRA-OPHTHALMOLOGY MOVES
// =========================================================================

// --- Moves from Module 329 (Anatomy and Development of Eye) ---
recordMove(12312, 344, 'External hordeolum (stye) acute suppurative Zeis gland infection belongs to Disorders of the Eyelid.');
recordMove(12314, 335, 'Infectious Crystalline Keratopathy (ICK) microbial etiology belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12316, 336, 'Argyrosis silver impregnation of Descemet membrane belongs to Non-infectious Disorders of Cornea.');
recordMove(12638, 335, 'Herpes Zoster Ophthalmicus (HZO) caused by Varicella Zoster Virus belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(13283, 343, 'Immune recovery uveitis (IRU) following HAART in HIV belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13345, 344, 'Ectropion and madarosis as warning signs of eyelid malignancy belong to Disorders of the Eyelid.');
recordMove(13364, 344, 'Chalazion presenting as painless firm eyelid nodule belongs to Disorders of the Eyelid.');
recordMove(13365, 344, 'Incision and curettage for chalazion belongs to Disorders of the Eyelid.');
recordMove(13501, 347, 'Orbital varices presenting with dynamic reducible proptosis on bending forward belong to Diseases of the Orbit.');

// --- Moves from Module 330 (Elementary Optics and Physiology of Vision) ---
recordMove(5013, 344, 'Basal cell carcinoma as most common malignant eyelid tumor belongs to Disorders of the Eyelid.');
recordMove(5052, 344, 'Basal cell carcinoma of the eyelid belongs to Disorders of the Eyelid.');
recordMove(6546, 344, 'Basal cell carcinoma with pearly rolled edges at medial canthus belongs to Disorders of the Eyelid.');
recordMove(12326, 348, 'Clinical test for suppression and binocular alignment in squint belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12328, 337, 'CRAO causing amaurosis fugax in young diabetic patient with hyperhomocysteinemia belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12331, 349, 'Prism glass correction for hypertropia diplopia belongs to Strabismus - Types and Treatment.');
recordMove(12342, 332, 'Sturm\'s conoid configuration of refracted rays in astigmatism belongs to Astigmatism and Errors of Accomodation.');
recordMove(12344, 354, 'Tropicamide as fastest acting cycloplegic and mydriatic drug belongs to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(12346, 332, 'Jackson cross cylinder used for verifying axis and power of astigmatism belongs to Astigmatism and Errors of Accomodation.');
recordMove(12361, 340, 'Pincushion distortion in aphakic high plus spectacle correction belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(12363, 338, 'Gyrate atrophy of choroid and retina due to ornithine aminotransferase deficiency belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12371, 354, 'Vitamin A deficiency as most common cause of preventable childhood blindness in India belongs to Mixed / Miscellaneous Topics (Community Ophthalmology).');
recordMove(12374, 351, 'Headaches and transient visual obscurations in idiopathic intracranial hypertension (IIH) belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12383, 338, 'Central serous chorioretinopathy (CSCR) risk factors and associations belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12388, 348, 'Grades of binocular vision (simultaneous perception, fusion, stereopsis) belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12394, 348, 'Clinical tests for detecting ocular misalignment in strabismus belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12399, 348, 'Prism measurement of angle of squint belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');

// --- Moves from Module 331 (Myopia and Hypermetropia) ---
recordMove(12408, 332, 'Spasm of accommodation treated by cycloplegics belongs to Astigmatism and Errors of Accomodation.');
recordMove(12440, 330, 'Parallel rays focusing on retina with accommodation at rest (Emmetropia) belongs to Elementary Optics and Physiology of Vision.');

// --- Moves from Module 332 (Astigmatism and Errors of Accomodation) ---
recordMove(12472, 336, 'Corneal topography, oil droplet reflex, and astigmatism in keratoconus belong to Non-infectious Disorders of Cornea.');
recordMove(13008, 340, 'Image magnification in aphakic optical correction (spectacles vs contact lenses vs IOLs) belongs to Lens - Cataract Surgery, Complications and IOLs.');

// --- Moves from Module 333 (Conjunctiva) ---
recordMove(12355, 346, 'Emergency copious irrigation for acute chemical alkali (chuna/lime) ocular burn belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12364, 346, 'Traumatic iridodialysis causing uniocular diplopia belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12542, 346, 'Photophthalmia ultraviolet radiation injury to ocular surface belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12563, 334, 'Staphyloma abnormal protrusion of uveal tissue through thinned sclera/cornea belongs to Sclera.');
recordMove(12568, 335, 'Cogan syndrome interstitial keratitis belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12575, 342, 'Koeppe nodules on pupillary border in granulomatous uveitis belong to Uveitis - Anterior and Intermediate.');
recordMove(12576, 329, 'Ocular embryology and surface ectoderm derivatives belong to Anatomy and Development of Eye.');
recordMove(12619, 334, 'Phenylephrine blanching test distinguishing episcleritis from scleritis belongs to Sclera.');
recordMove(12636, 329, 'Tenon capsule and subtenon space anatomy belong to Anatomy and Development of Eye.');
recordMove(12637, 334, 'Episcleritis clinical features and benign course belong to Sclera.');
recordMove(12722, 336, 'Cornea guttata and pseudophakic bullous keratopathy in Fuchs dystrophy belong to Non-infectious Disorders of Cornea.');
recordMove(12731, 336, 'Pellucid marginal corneal degeneration clinical features belong to Non-infectious Disorders of Cornea.');
recordMove(12758, 336, 'Mooren ulcer peripheral ulcerative keratitis treatment options belong to Non-infectious Disorders of Cornea.');
recordMove(12835, 346, 'Alkali injury causing liquefactive necrosis and deep ocular penetration belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12857, 337, 'Rubeosis iridis and diabetic ocular complications belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12881, 337, 'Eales disease retinal vasculitis and recurrent vitreous hemorrhage belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12899, 331, 'Hyperglycemia-induced hydration changes producing acute myopic refractive shift belong to Myopia and Hypermetropia.');
recordMove(13052, 341, 'Congenital glaucoma (buphthalmos) presenting with cloudy cornea, photophobia, and epiphora belongs to Glaucoma.');
recordMove(13156, 337, 'Ocular and retinal vascular manifestations of diabetes mellitus belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13168, 341, 'Acute angle-closure glaucoma attack with fixed vertically oval pupil belongs to Glaucoma.');
recordMove(13324, 353, 'Desmarres lid retractor instrument identification belongs to Practical Ophthalmology.');
recordMove(13331, 344, 'Distichiasis extra row of cilia from meibomian orifices belongs to Disorders of the Eyelid.');
recordMove(13334, 344, 'Full-thickness eyelid trauma and levator anatomy belong to Disorders of the Eyelid.');
recordMove(13335, 344, 'Eyelid anatomical abnormality causing trichiasis/entropion belongs to Disorders of the Eyelid.');
recordMove(13336, 344, 'Chalazion chronic painless firm meibomian granuloma belongs to Disorders of the Eyelid.');
recordMove(13340, 344, 'Congenital ptosis with poor levator function belongs to Disorders of the Eyelid.');
recordMove(13342, 341, 'Latanoprost prostaglandin analogue ocular side effects belong to Glaucoma.');
recordMove(13343, 344, 'Sebaceous gland carcinoma masquerading as chronic blepharitis belongs to Disorders of the Eyelid.');
recordMove(13362, 344, 'Blepharitis crusting and meibomian gland dysfunction belong to Disorders of the Eyelid.');
recordMove(13370, 350, 'Miosis and pupillary sympathetic pathway disruption (Horner syndrome) belong to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13384, 344, 'Spastic entropion surgical and medical management belongs to Disorders of the Eyelid.');
recordMove(13388, 344, 'V-Y plasty surgical procedure for cicatricial ectropion belongs to Disorders of the Eyelid.');
recordMove(13394, 344, 'Fasanella-Servat operation for mild ptosis with good levator function belongs to Disorders of the Eyelid.');
recordMove(13431, 344, 'External hordeolum (stye) painful lid lesion at lash follicle belongs to Disorders of the Eyelid.');
recordMove(13452, 346, 'Late progressive visual loss following blunt ocular contusion trauma belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13453, 346, 'Diagnostic signs of open globe rupture belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13457, 346, 'Major arterial circle of iris / ciliary body bleeding in traumatic hyphema belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13465, 346, 'Emergency removal and copious irrigation for lime (chuna) chemical injury belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13477, 347, 'Orbital cellulitis presenting with proptosis, chemosis, and fever belongs to Diseases of the Orbit.');
recordMove(13493, 347, 'Chloroma (granulocytic sarcoma) causing bilateral proptosis in pediatric AML belongs to Diseases of the Orbit.');
recordMove(13494, 347, 'Thyroid eye disease as the most common cause of adult proptosis belongs to Diseases of the Orbit.');
recordMove(13496, 347, 'Euthyroid Graves ophthalmopathy presenting with bilateral proptosis and diplopia belongs to Diseases of the Orbit.');
recordMove(13573, 352, 'Surgical excision with cryotherapy for conjunctival malignant melanoma belongs to Tumors of Eye.');
recordMove(13682, 335, 'Corneal epithelial cell layers and basement membrane physiology belong to Basics of Cornea and Infectious Keratitis.');
recordMove(13710, 329, 'Congenital microphthalmos ocular embryological failure belongs to Anatomy and Development of Eye.');
recordMove(13741, 329, 'Ocular embryology and surface ectoderm derivatives belong to Anatomy and Development of Eye.');

// --- Moves from Module 334 (Sclera) ---
recordMove(2148, 337, 'Rhegmatogenous retinal detachment presenting as a falling curtain over visual field belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12425, 331, 'Index myopia mechanism in nuclear cataract belongs to Myopia and Hypermetropia.');
recordMove(12439, 343, 'Uveal effusion syndrome ciliochoroidal detachment belongs to Uveitis - Posterior and Panuveitis.');
recordMove(12601, 329, 'Origin of levator palpebrae superioris from orbital apex above annulus of Zinn belongs to Anatomy and Development of Eye.');
recordMove(12620, 329, 'Superior rectus muscle insertion farthest from the limbus (Spiral of Tillaux) belongs to Anatomy and Development of Eye.');
recordMove(12625, 336, 'Donor screening serological tests for corneal transplantation and eye banking belong to Non-infectious Disorders of Cornea.');
recordMove(12633, 329, 'Anatomical order of recti muscle origins at the Annulus of Zinn belongs to Anatomy and Development of Eye.');
recordMove(12982, 337, 'Late complications of scleral buckling procedures for retinal detachment belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12991, 346, 'Commotio retinae (Berlin edema) following blunt ocular trauma belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13027, 341, 'Elevated episcleral venous pressure in secondary open-angle glaucoma belongs to Glaucoma.');
recordMove(13039, 341, 'Scleral spur insertion of longitudinal ciliary muscle fibers and trabecular meshwork belongs to Glaucoma.');
recordMove(13040, 341, 'Goldmann applanation tonometer as clinical gold standard based on Imbert-Fick law belongs to Glaucoma.');
recordMove(13041, 341, 'Electronic applanation tonometry (Tonopen) in irregular corneas belongs to Glaucoma.');
recordMove(13042, 341, 'Mackay-Marg tonometer with variable applanation surface belongs to Glaucoma.');
recordMove(13043, 341, 'Self-tonometer (Ocuton) principles belongs to Glaucoma.');
recordMove(13045, 341, 'Gonioscopic landmarks of the anterior chamber angle belongs to Glaucoma.');
recordMove(13161, 341, 'Medical reduction of elevated intraocular pressure in glaucoma belongs to Glaucoma.');
recordMove(13193, 341, 'Gold standard intraocular pressure measurement with Goldmann applanation tonometry belongs to Glaucoma.');
recordMove(13219, 346, 'D-shaped pupil caused by traumatic iridodialysis belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13251, 341, 'Schwalbe line as anterior border of trabecular meshwork on gonioscopy belongs to Glaucoma.');
recordMove(13296, 346, 'Inferotemporal retinal dialysis following blunt ocular contusion belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13447, 346, 'Most common intraocular foreign body lodgement sites in penetrating trauma belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13484, 346, 'Most common site of globe rupture behind recti muscle insertions belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13575, 335, 'Fungal corneal ulcer with hypopyon in a farmer following vegetative trauma belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(13614, 341, 'Krukenberg spindle and iris transillumination defects in pigment dispersion glaucoma belong to Glaucoma.');
recordMove(13619, 348, 'Forced duction test (FDT) differentiating restrictive from paretic ocular motility belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13623, 341, 'Aqueous humor physiology and high ascorbic acid active secretion belong to Glaucoma.');
recordMove(13624, 341, 'Juxtacanalicular trabecular meshwork as primary site of aqueous outflow resistance belongs to Glaucoma.');
recordMove(13686, 337, 'Retinal pigment epithelium radio-resistance and radiation retinopathy belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13734, 335, 'Corneal sensory innervation via nasociliary long ciliary nerves belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(13902, 346, 'Indications and contraindications for evisceration vs enucleation belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13903, 336, 'Corneoscleral button harvesting techniques for donor corneal preservation belong to Non-infectious Disorders of Cornea.');
recordMove(13906, 352, 'Callender histopathological classification of uveal / choroidal melanoma belongs to Tumors of Eye.');
recordMove(13935, 352, 'Direct extension via the optic nerve as primary mode of retinoblastoma spread belongs to Tumors of Eye.');
recordMove(13942, 343, 'Sympathetic ophthalmitis bilateral granulomatous panuveitis post-corneoscleral wound belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13943, 337, 'Photopsia, floaters, and peripheral retinal tear in high myopia belong to Retinal Vascular Disorders and Retinal Detachment.');

// --- Moves from Module 335 (Basics of Cornea and Infectious Keratitis) ---
recordMove(12647, 336, 'Thiel-Behnke honeycomb dystrophy belongs to Non-infectious Disorders of Cornea.');
recordMove(12649, 336, 'Amyloid deposition and Congo red birefringence in Lattice corneal dystrophy belong to Non-infectious Disorders of Cornea.');
recordMove(12657, 346, 'Ferrous intraocular foreign bodies causing siderosis bulbi belong to Orbit Anatomy and Ocular Injuries.');
recordMove(12666, 336, 'Infectious complications following penetrating keratoplasty belong to Non-infectious Disorders of Cornea.');
recordMove(12695, 336, 'Enucleation and corneoscleral harvesting time limits in eye banking belong to Non-infectious Disorders of Cornea.');
recordMove(12697, 336, 'Endothelial graft rejection line (Khodadoust line) and graft failure belong to Non-infectious Disorders of Cornea.');
recordMove(12698, 336, 'Keratoprosthesis (Boston KPro, osteo-odonto-keratoprosthesis) components belong to Non-infectious Disorders of Cornea.');
recordMove(12720, 336, 'Classification of inherited corneal dystrophies belongs to Non-infectious Disorders of Cornea.');
recordMove(12725, 336, 'Stromal corneal dystrophies (Granular, Lattice, Macular) pathology belongs to Non-infectious Disorders of Cornea.');
recordMove(12728, 336, 'Inferotemporal corneal thinning and cone apex in keratoconus belong to Non-infectious Disorders of Cornea.');
recordMove(12733, 336, 'McCarey-Kaufman (MK) and Optisol preservation media in keratoplasty belong to Non-infectious Disorders of Cornea.');
recordMove(12735, 336, 'Oversizing donor trephine button in penetrating keratoplasty for keratoconus belongs to Non-infectious Disorders of Cornea.');
recordMove(12741, 336, 'Cryopreserved tectonic corneal graft indications belong to Non-infectious Disorders of Cornea.');
recordMove(12745, 336, 'Fuchs endothelial corneal dystrophy endothelial pump decompensation belongs to Non-infectious Disorders of Cornea.');
recordMove(12747, 336, 'Epithelial basement membrane dystrophy (map-dot-fingerprint) belongs to Non-infectious Disorders of Cornea.');
recordMove(12760, 336, 'Deep anterior lamellar keratoplasty (DALK) and PKP in keratoconus belong to Non-infectious Disorders of Cornea.');
recordMove(12873, 336, 'Reis-Bucklers corneal dystrophy autosomal dominant inheritance belongs to Non-infectious Disorders of Cornea.');
recordMove(12905, 336, 'Glycosaminoglycan, hyaline, and amyloid deposits in stromal corneal dystrophies belong to Non-infectious Disorders of Cornea.');
recordMove(13553, 354, 'Cornea verticillata vortex keratopathy secondary to amiodarone toxicity belongs to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(13586, 348, 'Pediatric strabismus screening and Hirschberg corneal reflex test belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13622, 336, 'Bowman layer dystrophies (Reis-Bucklers, Thiel-Behnke) clinical characteristics belong to Non-infectious Disorders of Cornea.');
recordMove(13975, 341, 'Tonopen electronic applanation tonometry in scarred irregular corneas belongs to Glaucoma.');

// --- Moves from Module 336 (Non-infectious Disorders of Cornea) ---
recordMove(6217, 342, 'Posner-Schlossman syndrome (glaucomatocyclitic crisis) recurrent anterior uveitis with elevated IOP belongs to Uveitis - Anterior and Intermediate.');
recordMove(13561, 342, 'Voclosporin calcineurin inhibitor in the LUMINATE program for non-infectious uveitis belongs to Uveitis - Anterior and Intermediate.');

// --- Moves from Module 337 (Retinal Vascular Disorders and Retinal Detachment) ---
recordMove(12350, 330, 'Stenopaeic slit test optical pinhole principles belong to Elementary Optics and Physiology of Vision.');
recordMove(12351, 338, 'Retinitis pigmentosa bone spicules, arteriolar attenuation, and waxy disc pallor belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12373, 351, 'Idiopathic intracranial hypertension (pseudotumor cerebri) pathogenesis and papilledema belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12375, 351, 'Nutritional / tobacco-alcohol toxic optic neuropathy causing cecocentral scotoma belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12384, 338, 'Stargardt disease beaten-bronze macular dystrophy and dark choroid belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12386, 354, 'Chloroquine and hydroxychloroquine bull\'s eye maculopathy toxicity belongs to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(12416, 331, 'B-scan ultrasound demonstration of posterior staphyloma and high axial myopia belongs to Myopia and Hypermetropia.');
recordMove(12424, 338, 'Choroidal neovascular membrane (CNVM) secondary to wet age-related macular degeneration belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12426, 331, 'Forster-Fuchs retinal pigmentary spot in pathological myopia belongs to Myopia and Hypermetropia.');
recordMove(12427, 331, 'Degenerative pathological myopia chorioretinal lacquer cracks and staphyloma belong to Myopia and Hypermetropia.');
recordMove(12441, 331, 'Foster-Fuchs pigmented spot in degenerative high myopia belongs to Myopia and Hypermetropia.');
recordMove(12444, 331, 'Complications of high myopia (retinal tears, staphyloma, macular degeneration) belong to Myopia and Hypermetropia.');
recordMove(12479, 330, 'Prevalence and types of optical refractive errors belong to Elementary Optics and Physiology of Vision.');
recordMove(12484, 332, 'Compound myopic astigmatism cylindrical optical correction belongs to Astigmatism and Errors of Accomodation.');
recordMove(12574, 333, 'Shield ulcer as a sight-threatening complication of vernal keratoconjunctivitis belongs to Conjunctiva.');
recordMove(12628, 334, 'Involvement of deep episcleral vascular plexus distinguishing scleritis from episcleritis belongs to Sclera.');
recordMove(12632, 334, 'T sign on orbital B-scan ultrasound diagnostic of posterior scleritis belongs to Sclera.');
recordMove(12652, 338, 'Arden ratio on electro-oculogram (EOG) in Best vitelliform macular dystrophy belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12768, 330, 'Aniseikonia tolerable retinal image size disparity threshold belongs to Elementary Optics and Physiology of Vision.');
recordMove(12770, 330, 'A-wave of electroretinogram (ERG) photoreceptor hyperpolarization belongs to Elementary Optics and Physiology of Vision.');
recordMove(12784, 343, 'Headlight in the fog appearance of acute focal necrotizing toxoplasma retinochoroiditis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(12785, 352, 'Retinal astrocytic hamartoma associated with tuberous sclerosis belongs to Tumors of Eye.');
recordMove(12798, 346, 'Vossius pigment ring on anterior lens surface from blunt contusion trauma belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12799, 346, 'Chisel and hammer metallic intraocular foreign body emergency evaluation belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12800, 343, 'Headlight in fog fundus appearance characteristic of Toxoplasma retinochoroiditis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(12801, 343, 'Birdshot chorioretinopathy HLA-A29 associated posterior uveitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(12802, 343, 'CMV necrotizing retinitis in immunocompromised HIV patients belongs to Uveitis - Posterior and Panuveitis.');
recordMove(12803, 343, 'Bilateral exudative retinal detachment and vitiligo in Vogt-Koyanagi-Harada (VKH) syndrome belong to Uveitis - Posterior and Panuveitis.');
recordMove(12804, 338, 'Idiopathic epiretinal membrane / macular pucker pathogenesis belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12807, 351, 'Collier sign (eyelid retraction) in Parinaud dorsal midbrain syndrome belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12808, 346, 'Penetrating ocular injury from hammer and chisel fragment belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12816, 338, 'Usher syndrome sensorineural hearing loss and retinitis pigmentosa belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12819, 348, 'Bagolini striated glasses test evaluating harmonious abnormal retinal correspondence belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12834, 346, 'Traumatic hyphema and angle recession from blunt contusion injury belong to Orbit Anatomy and Ocular Injuries.');
recordMove(12836, 346, 'Traumatic iritis and anterior chamber contusion following blunt injury belong to Orbit Anatomy and Ocular Injuries.');
recordMove(12838, 346, 'Alkali ocular burn causing liquefactive necrosis and limbal ischemia belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12839, 351, 'Papilledema presentation in idiopathic intracranial hypertension (IIH) belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12840, 351, 'Bilateral papilledema secondary to intracranial mass lesion belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12841, 351, 'Papilledema in raised intracranial pressure with early morning headaches belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12846, 353, 'Indirect ophthalmoscope optical properties (real, inverted, magnified image) belong to Practical Ophthalmology.');
recordMove(12848, 346, 'Commotio retinae (Berlin edema) pseudo cherry-red spot following ocular trauma belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12869, 346, 'Siderosis bulbi from retained intraocular iron foreign body belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12880, 338, 'Extinction of scotopic b-wave on ERG in Retinitis Pigmentosa belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13197, 329, 'Suprachoroidal space between lamina fusca and sclera belongs to Anatomy and Development of Eye.');
recordMove(13209, 343, 'Candle-wax dripping periphlebitis in ocular sarcoidosis panuveitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13212, 342, 'Cystoid macular edema as the most common sight-threatening complication of pars planitis belongs to Uveitis - Anterior and Intermediate.');
recordMove(13214, 343, 'Dalen-Fuchs nodules in sympathetic ophthalmitis bilateral granulomatous panuveitis belong to Uveitis - Posterior and Panuveitis.');
recordMove(13218, 346, 'Traumatic Vossius ring pigment deposition on lens from pupillary margin belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13230, 342, 'Causes and presentations of acute anterior iridocyclitis belong to Uveitis - Anterior and Intermediate.');
recordMove(13287, 343, 'Acute retinal necrosis (ARN) and PORN caused by VZV and HSV belong to Uveitis - Posterior and Panuveitis.');
recordMove(13288, 340, 'Acute post-cataract endophthalmitis bacterial etiology (Staph epidermidis) belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13289, 343, 'Sugiura sign (perilimbal vitiligo) in Vogt-Koyanagi-Harada syndrome belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13291, 338, 'Vitreous humor physical volume and hydration properties belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13294, 338, 'Subhyaloid space anatomical boundaries between posterior vitreous cortex and ILM belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13295, 338, 'Vitreous base firm anatomical attachment straddling the ora serrata belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13309, 342, 'Differential diagnosis of chronic granulomatous anterior uveitis belongs to Uveitis - Anterior and Intermediate.');
recordMove(13510, 347, 'Direct carotid-cavernous fistula pulsating proptosis and orbital bruit belong to Diseases of the Orbit.');
recordMove(13518, 348, 'Maddox wing clinical instrument for measuring heterophoria belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13519, 348, 'Sensory adaptations to strabismus (suppression, abnormal retinal correspondence) belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13520, 349, 'Compensatory head posture in cyclovertical extraocular muscle palsies belongs to Strabismus - Types and Treatment.');
recordMove(13521, 348, 'Dissociating tests for ocular alignment (Maddox rod) belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13522, 338, 'Central serous chorioretinopathy (CSCR) metamorphopsia in young stressed adults belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13523, 348, 'Worth 4-dot test evaluating binocular fusion and suppression belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13546, 348, 'Interpretation of Worth 4-dot test responses in ocular suppression belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13558, 349, 'Bielschowsky head tilt test diagnosing superior oblique 4th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13606, 343, 'Cytomegalovirus retinitis as the leading cause of visual loss in AIDS belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13607, 338, 'Biochemical composition of vitreous humor (Type II collagen and hyaluronic acid) belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13611, 338, 'Dry age-related macular degeneration (drusen and geographic atrophy) belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13612, 338, 'Wet neovascular age-related macular degeneration and anti-VEGF therapy belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13629, 350, 'Topographic localization of visual field defects across the visual pathway belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13687, 338, 'Ligament of Wieger (hyaloideocapsular ligament) attaching vitreous to lens belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13689, 338, 'Strength of vitreoretinal adhesion sites across the retina and vitreous base belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13697, 351, 'Clinical signs distinguishing papilledema from optic neuritis belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13698, 351, 'Paton lines (peripapillary retinal wrinkles) in established papilledema belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13703, 338, 'Electro-oculogram (EOG) abnormal light peak / dark trough ratio in Best disease belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13704, 335, 'Systemic steroid indications in acute Herpes Zoster Ophthalmicus belong to Basics of Cornea and Infectious Keratitis.');
recordMove(13737, 350, 'Pituitary adenoma compressing the central optic chiasm causing bitemporal hemianopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13774, 352, 'Optic nerve glioma associated with Neurofibromatosis Type 1 belongs to Tumors of Eye.');
recordMove(13799, 351, 'Axon count of the human optic nerve (1.2 million fibers) belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13801, 351, 'Anatomical segments of the optic nerve (intraocular, intraorbital, intracanalicular, intracranial) belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13804, 351, 'Orthograde axoplasmic stasis in the pathogenesis of papilledema belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13805, 351, 'Clinical deficits in anterior optic nerve lesions belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13808, 351, 'Pathogenesis and axoplasmic flow stasis in papilledema belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13830, 351, 'Optic Neuritis Treatment Trial (ONTT) diagnostic protocol and MRI brain belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13834, 351, 'B-scan ultrasound and neuroimaging of optic disc cysticercosis scolex belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13836, 351, 'Post-neuritic secondary optic atrophy with blurred disc margins belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13840, 351, 'Consecutive optic atrophy secondary to retinitis pigmentosa belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13844, 351, 'Toxic optic neuropathy etiologies (ethambutol, methanol, tobacco) belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13850, 351, 'Double ring sign diagnostic of congenital optic nerve hypoplasia belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13857, 351, 'Radial peripapillary capillary dilation and spokes-of-wheel appearance in papilledema belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13888, 351, 'Hoyt-Spencer triad (optic atrophy, optociliary shunt vessels, vision loss) in sphenoid wing meningioma belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13908, 352, 'Leukocoria (white pupillary reflex) in pediatric retinoblastoma belongs to Tumors of Eye.');
recordMove(13909, 352, 'Direct optic nerve invasion as primary route of extraocular retinoblastoma dissemination belongs to Tumors of Eye.');
recordMove(13910, 352, 'Retinoblastoma clinical presentation and management in toddlers belong to Tumors of Eye.');
recordMove(13914, 352, 'Leukocoria differential diagnosis in a child (retinoblastoma) belongs to Tumors of Eye.');
recordMove(13921, 343, 'Prophylactic enucleation of severely traumatized eye within 14 days preventing sympathetic ophthalmitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13930, 352, 'Osteosarcoma as most common secondary malignancy in hereditary retinoblastoma survivors belongs to Tumors of Eye.');
recordMove(13946, 338, 'Type II collagen fibrils maintaining vitreous gel framework belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');

// --- Moves from Module 338 (Macular Disorders, Retinal Dystrophies, and Vitreal Disorders) ---
recordMove(1953, 337, 'Vitreous hemorrhage secondary to proliferative diabetic retinopathy belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12866, 337, 'Clinically significant macular edema (CSME) in diabetic retinopathy belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12939, 337, 'Bonnet sign of arteriovenous crossing in hypertensive retinopathy belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12450, 339, 'Homocystinuria causing inferonasal crystalline lens subluxation (ectopia lentis) belongs to Lens - Introduction, Types of Cataract and Clinical Features.');

// --- Moves from Module 339 (Lens - Introduction, Types of Cataract and Clinical Features) ---
recordMove(12327, 330, 'Rigid gas-permeable (RGP) contact lenses optics and fitting belong to Elementary Optics and Physiology of Vision.');
recordMove(12347, 330, 'Hydrogel (HEMA) polymer materials of soft contact lenses belong to Elementary Optics and Physiology of Vision.');
recordMove(12348, 341, 'Zeiss 4-mirror indentation goniolens for dynamic angle assessment belongs to Glaucoma.');
recordMove(12362, 335, 'Fungal corneal ulcer with feathery borders following agricultural trauma belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12366, 335, 'Filamentous fungal keratitis following vegetative injury belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12369, 332, 'Bifocal spectacle lenses for presbyopic correction belong to Astigmatism and Errors of Accomodation.');
recordMove(12378, 351, 'Arteritic anterior ischemic optic neuropathy (AAION) from giant cell arteritis belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12389, 330, 'Neutralization of streak retinoscopy reflex in refractive verification belongs to Elementary Optics and Physiology of Vision.');
recordMove(12390, 330, 'Numerical aperture and optical resolving power of lens systems belong to Elementary Optics and Physiology of Vision.');
recordMove(12391, 341, 'Weill-Marchesani syndrome microspherophakia and secondary angle-closure glaucoma belong to Glaucoma.');
recordMove(12396, 330, 'Snellen 6/6 optotype subtending 5 minutes of arc at 6 meters belongs to Elementary Optics and Physiology of Vision.');
recordMove(12398, 351, 'Sudden chalky-white optic disc edema in giant cell arteritis belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(12423, 331, 'Index myopia producing "second sight" in nuclear sclerotic cataract belongs to Myopia and Hypermetropia.');
recordMove(12428, 348, 'Crowding phenomenon characteristic of amblyopia visual acuity testing belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12469, 330, 'Gross and net retinoscopy working distance calculation belongs to Elementary Optics and Physiology of Vision.');
recordMove(12470, 330, 'Contact lens optical indication for unilateral high anisometropia belongs to Elementary Optics and Physiology of Vision.');
recordMove(12493, 333, 'Shield ulcer as a severe complication of vernal keratoconjunctivitis belongs to Conjunctiva.');
recordMove(12598, 333, 'Cobblestone giant papillae and Trantas dots in vernal conjunctivitis belong to Conjunctiva.');
recordMove(12639, 335, 'Contact lens wear as major predisposing risk for microbial keratitis belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12648, 335, 'Bowman membrane acellular condensed anterior stromal layer belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12670, 335, 'Vegetative trauma inducing fungal corneal ulceration belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12671, 335, 'Pseudomonas microbial keratitis in contact lens users belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12673, 335, 'Hypopyon corneal ulcer bacterial infectious keratitis belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12702, 335, 'Acanthamoeba perineural infiltrates and ring ulcer in contact lens users belong to Basics of Cornea and Infectious Keratitis.');
recordMove(12713, 336, 'Acute corneal hydrops from Descemet membrane rupture in keratoconus belongs to Non-infectious Disorders of Cornea.');
recordMove(12715, 336, 'Keratoconus Munson sign and deep stromal Vogt striae belong to Non-infectious Disorders of Cornea.');
recordMove(12716, 336, 'Corneal topography cone steepening pattern in keratoconus belongs to Non-infectious Disorders of Cornea.');
recordMove(12757, 336, 'Kayser-Fleischer ring on gonioscopy in hepatolenticular degeneration belongs to Non-infectious Disorders of Cornea.');
recordMove(12842, 338, 'Central serous chorioretinopathy (CSCR) serous macular detachment belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12871, 338, 'Nyctalopia and bone spicule pigmentary retinopathy in Retinitis Pigmentosa belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12926, 346, 'Ocular concussion contusion injury features (hyphema, angle recession) belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13000, 340, 'SRK regression formula for intraocular lens power calculation belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13002, 340, 'PMMA rigid intraocular lens materials in ECCE/SICS belong to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13006, 340, 'Hydrophobic acrylic foldable intraocular lens implantation belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13013, 340, 'Multifocal and toric IOLs for correcting post-cataract astigmatism belong to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13065, 341, 'Koeppe direct diagnostic gonioscopy lens for pediatric glaucoma belongs to Glaucoma.');
recordMove(13080, 341, 'Infantile congenital glaucoma presenting with photophobia, epiphora, and buphthalmos belongs to Glaucoma.');
recordMove(13499, 347, 'Thyroid-associated orbitopathy (Graves ophthalmopathy) causing adult proptosis belongs to Diseases of the Orbit.');
recordMove(13500, 346, 'Orbital blowout floor fracture with inferior rectus entrapment belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13505, 347, 'Septic cavernous sinus thrombosis proptosis and chemosis belong to Diseases of the Orbit.');
recordMove(13591, 349, 'Abducens 6th nerve palsy failure of abduction and uncrossed diplopia belong to Strabismus - Types and Treatment.');
recordMove(13613, 330, 'Rigid gas-permeable contact lenses optics and tear lens neutralization belong to Elementary Optics and Physiology of Vision.');
recordMove(13644, 350, 'Pharmacologic pupil testing with dilute pilocarpine (0.125%) for tonic pupil belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13645, 350, 'Holmes-Adie tonic pupil cholinergic denervation supersensitivity belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13659, 351, 'Progressive supranuclear palsy downward vertical gaze palsy belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13715, 351, 'Differentiating papillitis (RAPD, marked vision loss) from papilledema belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13758, 349, 'Duane retraction syndrome Type 1 limited abduction with palpebral narrowing belongs to Strabismus - Types and Treatment.');
recordMove(13796, 346, 'Traumatic mydriasis and iris sphincter tear post-contusion blunt trauma belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13812, 351, 'Early papilledema with blurring of superior and inferior disc margins in IIH belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13819, 351, 'Giant cell arteritis temporal artery biopsy and systemic ESR elevation belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13848, 351, 'Compressive dysthyroid optic neuropathy in severe Graves orbitopathy belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13923, 352, 'Orbital embryonal rhabdomyosarcoma presenting with rapid proptosis in child belongs to Tumors of Eye.');
recordMove(13965, 349, 'Trochlear 4th nerve superior oblique palsy causing diplopia on downgaze belongs to Strabismus - Types and Treatment.');

// --- Moves from Module 340 (Lens - Cataract Surgery, Complications and IOLs) ---
recordMove(12404, 331, 'School-age child presenting with distant blackboard visual blurring (myopia) belongs to Myopia and Hypermetropia.');
recordMove(12419, 331, 'Preoperative corneal pachymetry and screening criteria for LASIK belong to Myopia and Hypermetropia.');
recordMove(12449, 331, 'Phakic intraocular lens (ICL) implantation for high myopia -10D belongs to Myopia and Hypermetropia.');
recordMove(12476, 333, 'Indications for pterygium excision and conjunctival autograft belong to Conjunctiva.');
recordMove(12478, 332, 'Focal interval of Sturm and astigmatism refraction definition belong to Astigmatism and Errors of Accomodation.');
recordMove(12581, 333, 'WHO SAFE strategy for trachoma elimination belongs to Conjunctiva.');
recordMove(12594, 335, 'Exposure keratopathy and corneal ulceration secondary to lagophthalmos belong to Basics of Cornea and Infectious Keratitis.');
recordMove(12626, 344, 'Paralytic lagophthalmos from facial nerve orbicularis oculi paresis belongs to Disorders of the Eyelid.');
recordMove(12700, 335, 'Exposure keratitis resulting from facial nerve injury in parotidectomy belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12975, 339, 'Congenital rubella syndrome zonular/nuclear cataract belongs to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(12979, 335, 'Corneal pachymetry ultrasound measurement of corneal thickness belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(12980, 336, 'Kayser-Fleischer ring in Descemet membrane in Wilson disease belongs to Non-infectious Disorders of Cornea.');
recordMove(13018, 332, 'Surgical presbyopic correction (monovision, corneal inlays, conductive keratoplasty) belongs to Astigmatism and Errors of Accomodation.');
recordMove(13021, 341, 'Goldmann tonometry underestimation of IOP following corneal LASIK ablation belongs to Glaucoma.');
recordMove(13062, 341, 'Secondary glaucomas with permanent peripheral anterior synechiae persisting after lens extraction belong to Glaucoma.');
recordMove(13063, 353, 'Moorfields / Castroviejo ophthalmic forceps identification belongs to Practical Ophthalmology.');
recordMove(13128, 341, 'Forms of secondary angle-closure glaucoma that do not resolve with cataract extraction belong to Glaucoma.');
recordMove(13172, 354, 'Posterior subcapsular cataract and steroid-induced glaucoma secondary to chronic systemic steroids belong to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(13176, 354, 'Wilson disease systemic manifestations with Kayser-Fleischer rings belongs to Mixed / Miscellaneous Topics (Systemic Diseases).');
recordMove(13328, 333, 'Cicatricial trachoma complications (trichiasis, entropion, xerosis) belong to Conjunctiva.');
recordMove(13407, 345, 'Rhinostomy ostium creation removing lacrimal bone in external DCR belongs to Disorders of Lacrimal Apparatus and Glands of the Eye.');
recordMove(13592, 349, 'Preoperative evaluation for strabismus correction surgery belongs to Strabismus - Types and Treatment.');
recordMove(13753, 349, 'Hummelsheim / Jensen muscle transposition surgery for complete 6th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13915, 352, 'Differential diagnosis of pediatric leukocoria (retinoblastoma, PHPV, Coats) belongs to Tumors of Eye.');
recordMove(13964, 349, 'Extraocular muscle resection as a surgical strengthening procedure in strabismus belongs to Strabismus - Types and Treatment.');

// --- Moves from Module 341 (Glaucoma) ---
recordMove(12400, 338, 'Retinitis pigmentosa ocular associations (posterior subcapsular cataract, keratoconus, cystoid macular edema) belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12420, 332, 'Premature presbyopia risk factors and uncorrected hypermetropia belong to Astigmatism and Errors of Accomodation.');
recordMove(12421, 339, 'Congenital rubella syndrome cataract and microphthalmos belong to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(12433, 331, 'Pseudopapillitis elevated crowded disc in high hypermetropia belongs to Myopia and Hypermetropia.');
recordMove(12486, 332, 'Accommodative insufficiency below normal physiological amplitude belongs to Astigmatism and Errors of Accomodation.');
recordMove(12623, 334, 'Intercalary staphyloma between limbus and ciliary body belongs to Sclera.');
recordMove(12656, 346, 'Battery fluid acid/alkali blast chemical ocular burn belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12714, 336, 'Full-thickness penetrating keratoplasty for advanced keratoconus belongs to Non-infectious Disorders of Cornea.');
recordMove(12742, 336, 'Fleischer ring, Vogt striae, and Munson sign in keratoconus belong to Non-infectious Disorders of Cornea.');
recordMove(12788, 337, 'Splashed-tomato fundus appearance in ischemic Central Retinal Vein Occlusion belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12826, 337, 'Non-proliferative diabetic retinopathy microaneurysms and hard exudates belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12830, 337, 'Shafer sign (tobacco dust pigment cells in anterior vitreous) in retinal tears belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12854, 337, 'Cardioembolic branch retinal artery occlusion in rheumatic valvular disease belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12856, 338, 'Geographic atrophy and macular drusen in dry age-related macular degeneration belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12872, 338, 'Retinitis pigmentosa progressive nyctalopia and arteriolar narrowing belong to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12889, 337, 'Panretinal photocoagulation laser for neovascularization in proliferative diabetic retinopathy belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(12966, 339, 'Inferonasal subluxation of crystalline lens in homocystinuria belongs to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13031, 336, 'Kayser-Fleischer peripheral corneal copper ring in Wilson disease belongs to Non-infectious Disorders of Cornea.');
recordMove(13033, 354, 'WHO VISION 2020: The Right to Sight priority target diseases belong to Mixed / Miscellaneous Topics (Community Ophthalmology).');
recordMove(13037, 330, 'Uncorrected refractive error as the leading cause of moderate-to-severe visual impairment belongs to Elementary Optics and Physiology of Vision.');
recordMove(13038, 347, 'Pseudoproptosis caused by high axial myopia, buphthalmos, and contralateral enophthalmos belongs to Diseases of the Orbit.');
recordMove(13053, 337, 'Arteriovenous crossing compression in branch retinal vein occlusion belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13055, 337, 'Cherry-red spot at the foveola in central retinal artery occlusion belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13057, 338, 'Persistent hyperplastic primary vitreous (PHPV) retroretinal fibrovascular mass belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13059, 337, 'Systemic arterial hypertension and CRVO pathogenesis belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13060, 338, 'Photostress recovery time test differentiating macular disease from optic neuropathy belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13064, 354, 'Rashtriya Bal Swasthya Karyakram (RBSK) vision screening 4Ds belong to Mixed / Miscellaneous Topics (Community Ophthalmology).');
recordMove(13066, 346, 'Vossius pigment ring from traumatic compression of iris pupillary margin belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13070, 339, 'Hypermature Morgagnian cataract liquefied cortex and nucleus sinking belong to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13078, 352, 'Clinical differential diagnosis of white pupillary reflex (leukocoria) in infancy belongs to Tumors of Eye.');
recordMove(13085, 334, 'Ciliary staphyloma thinning of sclera over ciliary body belongs to Sclera.');
recordMove(13133, 336, 'Graft sizing and donor button trephination in penetrating keratoplasty belong to Non-infectious Disorders of Cornea.');
recordMove(13169, 339, 'Complicated cataract polychromatic luster and breadcrumb appearance belong to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13171, 337, 'Reduction of electroretinogram b-wave in central retinal vein occlusion belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13184, 350, 'Relative afferent pupillary defect (RAPD / Marcus Gunn pupil) on swinging flashlight test belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13222, 342, 'Fuchs heterochromic iridocyclitis triad (heterochromia, fine KPs, absence of posterior synechiae) belongs to Uveitis - Anterior and Intermediate.');
recordMove(13301, 343, 'Penetrating ocular wound involving ciliary body inciting sympathetic ophthalmitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13304, 343, 'Cell-mediated autoimmune response to uveal melanocytes in sympathetic ophthalmitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13327, 342, 'Iris pearls as pathognomonic sign of lepromatous anterior uveitis belong to Uveitis - Anterior and Intermediate.');
recordMove(13460, 329, 'Embryological neural crest cell migration failure in anterior segment dysgenesis belongs to Anatomy and Development of Eye.');
recordMove(13481, 346, 'Evaluation and intraocular pressure monitoring in traumatic hyphema belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13560, 342, 'Topical corticosteroid and cycloplegic therapy for hypertensive anterior uveitis belongs to Uveitis - Anterior and Intermediate.');
recordMove(13570, 346, 'Emergency immediate copious irrigation for chemical acid ocular burns belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13664, 354, 'Vigabatrin irreversible bilateral concentric visual field constriction belongs to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(13679, 350, 'Pituitary adenoma compressing inferior chiasmal decussating fibers causing ascending bitemporal hemianopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13716, 350, 'Keyhole homonymous sectoranopia in lateral choroidal artery / optic radiation lesions belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13738, 350, 'Homonymous visual field defects localization belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13837, 351, 'Causes of primary optic atrophy with well-defined disc margins belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13839, 351, 'Methanol toxicity causing profound optic nerve axonal degeneration belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13841, 351, 'Secondary optic atrophy following chronic papilledema with dirty gray disc belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13843, 351, 'Toxic and nutritional optic neuropathy clinical features belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13856, 351, 'Visual Evoked Potential (VEP) P100 wave latency prolongation in demyelinating optic neuritis belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13895, 350, 'Craniopharyngioma compressing upper chiasmal fibers causing descending bitemporal hemianopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13901, 352, 'Leukocoria as the most common initial presenting sign of retinoblastoma belongs to Tumors of Eye.');
recordMove(13907, 352, 'Reese-Ellsworth and International Classification indications for enucleation in retinoblastoma belong to Tumors of Eye.');
recordMove(13916, 352, 'Primary enucleation indications in intraocular malignancies belong to Tumors of Eye.');
recordMove(13927, 352, 'Retinoblastoma advanced intraocular tumor presentation in childhood belongs to Tumors of Eye.');
recordMove(13963, 348, 'Synoptophore measurement of objective and subjective angle of squint belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');

// --- Moves from Module 342 (Uveitis - Anterior and Intermediate) ---
recordMove(12365, 333, 'Bitot spots and conjunctival xerosis in vitamin A deficiency belong to Conjunctiva.');
recordMove(12627, 334, 'Anterior scleritis clinical types (diffuse, nodular, necrotizing) belong to Sclera.');
recordMove(12753, 336, 'Corneal collagen cross-linking (CXL) with riboflavin and UVA in keratoconus belongs to Non-infectious Disorders of Cornea.');
recordMove(12754, 335, 'Fortified topical vancomycin and tobramycin for non-resolving bacterial keratitis belong to Basics of Cornea and Infectious Keratitis.');
recordMove(12963, 339, 'Polychromatic luster in complicated cataract posterior subcapsular cortex belongs to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13022, 340, 'Continuous curvilinear capsulorhexis (CCC) anterior capsulotomy technique in phacoemulsification belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13023, 340, 'Continuous curvilinear capsulorhexis advantages in phacoemulsification belong to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13072, 341, 'Phacolytic glaucoma with high IOP and lens protein-laden macrophages belongs to Glaucoma.');
recordMove(13198, 340, 'Phacoemulsification and intraocular lens choice in diabetic patients belong to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13203, 330, 'Purkinje-Sanson optical images formed by corneal and lens reflecting surfaces belong to Elementary Optics and Physiology of Vision.');
recordMove(13205, 330, 'Anterior corneal curvature providing +43D of the total +60D dioptric power belongs to Elementary Optics and Physiology of Vision.');
recordMove(13210, 330, 'Duochrome test principle based on longitudinal chromatic aberration belongs to Elementary Optics and Physiology of Vision.');
recordMove(13215, 335, 'Bowman layer as a modified acellular stromal layer rather than true basement membrane belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(13225, 329, 'Anterior ciliary artery distribution to extraocular recti muscles belongs to Anatomy and Development of Eye.');
recordMove(13227, 341, 'Shallow anterior chamber and hypotony following trabeculectomy surgery belong to Glaucoma.');
recordMove(13231, 340, 'Trypan blue capsular staining in mature cataracts belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13252, 341, 'Van Herick slit-lamp estimation of peripheral anterior chamber depth belongs to Glaucoma.');
recordMove(13270, 335, 'Fortified topical antibiotics in severe bacterial corneal ulcers belong to Basics of Cornea and Infectious Keratitis.');
recordMove(13271, 329, 'Inferior oblique muscle origin from anterior orbital periosteum belongs to Anatomy and Development of Eye.');
recordMove(13303, 343, 'Sympathizing eye bilateral granulomatous uveitis and Dalen-Fuchs nodules belong to Uveitis - Posterior and Panuveitis.');
recordMove(13311, 343, 'Sympathetic ophthalmitis following penetrating injury to ciliary region belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13739, 353, 'Peribulbar and retrobulbar local anaesthetic blocks in ophthalmic surgery belong to Practical Ophthalmology.');
recordMove(13818, 351, 'Altitudinal visual field defect pathognomonic of ischemic optic neuropathy belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13890, 350, 'Pituitary adenoma compressing chiasmal fibers producing bitemporal visual field loss belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13919, 352, 'Pseudouveitis and masquerade presentation in retinoblastoma belong to Tumors of Eye.');

// --- Moves from Module 343 (Uveitis - Posterior and Panuveitis) ---
recordMove(249, 329, 'Outer plexiform layer synapses of rods and cones in retinal histology belong to Anatomy and Development of Eye.');
recordMove(12322, 338, 'Persistent hyperplastic primary vitreous (PHPV) posterior retrolental membrane belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12437, 331, 'Posterior staphyloma in pathological high myopia belongs to Myopia and Hypermetropia.');
recordMove(12453, 331, 'Posterior staphyloma in degenerative myopia belongs to Myopia and Hypermetropia.');
recordMove(13025, 340, 'Nd:YAG laser posterior capsulotomy for posterior capsular opacification (PCO) belongs to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(13290, 338, 'Wieger ligament (hyaloideocapsular ligament) attaching anterior vitreous face to posterior lens belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13305, 329, 'Superior rectus muscle insertion distance from limbus belongs to Anatomy and Development of Eye.');
recordMove(13310, 338, 'Metamorphopsia caused by foveal photoreceptor distortion in macular disorders belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(13316, 341, 'Active secretion, ultrafiltration, and diffusion in aqueous humor formation belong to Glaucoma.');
recordMove(13317, 339, 'Posterior lenticonus conical protrusion of posterior capsule in cataract belongs to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13319, 351, 'Posterior ischemic optic neuropathy (PION) pial capillary compromise belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13330, 344, 'Distichiasis aberrant cilia row posterior to gray line belongs to Disorders of the Eyelid.');
recordMove(13706, 333, 'Phlyctenular keratoconjunctivitis delayed hypersensitivity to tuberculoprotein belongs to Conjunctiva.');
recordMove(13740, 329, 'Ciliary body region as the surgical "dangerous zone" of the eye belongs to Anatomy and Development of Eye.');
recordMove(13852, 350, 'Meyer loop temporal optic radiation lesion producing superior homonymous quadrantanopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13853, 350, 'Meyer loop damage causing contralateral superior "pie-in-the-sky" quadrantanopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13886, 351, 'Contrast-enhanced fat-suppressed orbital MRI for optic nerve glioma belongs to Disorders of Optic Nerve and Gaze Palsies.');

// --- Moves from Module 344 (Disorders of the Eyelid) ---
recordMove(13372, 350, 'Adie tonic pupil with light-near dissociation and anisocoria greater in light belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13377, 346, 'Angle recession and secondary glaucoma following blunt ocular contusion belong to Orbit Anatomy and Ocular Injuries.');

// --- Moves from Module 345 (Disorders of Lacrimal Apparatus and Glands of the Eye) ---
recordMove(2146, 338, 'Dry age-related macular degeneration (AMD) with macular drusen and geographic atrophy belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12708, 352, 'Enucleation surgery indicated for intraocular malignancies (retinoblastoma, uveal melanoma) belongs to Tumors of Eye.');
recordMove(13355, 344, 'Anterior staphylococcal blepharitis with crusting and lash collarettes belongs to Disorders of the Eyelid.');
recordMove(13359, 344, 'Recurrent chalazion in elderly female suspicious for sebaceous gland carcinoma belongs to Disorders of the Eyelid.');
recordMove(13368, 344, 'Blepharochalasis syndrome recurring painless episodes of eyelid edema belongs to Disorders of the Eyelid.');
recordMove(13376, 344, 'Sebaceous gland carcinoma masquerading as recurrent chalazion belongs to Disorders of the Eyelid.');
recordMove(13413, 333, 'Keratoconjunctivitis sicca (secondary Sjogren dry eye) in rheumatoid arthritis belongs to Conjunctiva.');
recordMove(13725, 329, 'Branches of ophthalmic division of trigeminal nerve (frontal, lacrimal, nasociliary) belong to Anatomy and Development of Eye.');

// --- Moves from Module 346 (Orbit Anatomy and Ocular Injuries) ---
recordMove(12763, 352, 'Embryonal rhabdomyosarcoma as most common pediatric orbital malignancy belongs to Tumors of Eye.');
recordMove(13444, 347, 'Ethmoid sinusitis origin of pediatric orbital cellulitis belongs to Diseases of the Orbit.');
recordMove(13459, 347, 'Microbial etiology and management of orbital cellulitis belong to Diseases of the Orbit.');
recordMove(13462, 343, 'Ocular toxocariasis posterior pole granulomatous chorioretinitis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(13472, 349, 'Compensatory head turn towards affected side in abducens 6th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13473, 348, 'Synergist muscle pairings in ocular motility physiology belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13474, 348, 'Antagonist muscle reciprocal innervation (Sherrington law) belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13475, 351, 'Internuclear ophthalmoplegia (INO) medial longitudinal fasciculus lesion belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13482, 349, 'Nuclear oculomotor nerve palsy patterns with bilateral ptosis and contralateral SR weakness belong to Strabismus - Types and Treatment.');
recordMove(13483, 347, 'Clinical distinction between cavernous sinus syndrome and orbital apex syndrome belongs to Diseases of the Orbit.');
recordMove(13487, 347, 'Cranial nerve involvement in orbital apex syndrome belongs to Diseases of the Orbit.');
recordMove(13492, 352, 'Cavernous hemangioma as the most common benign orbital tumor in adults belongs to Tumors of Eye.');
recordMove(13497, 352, 'Choroidal melanoma as the most common primary intraocular malignancy in adults belongs to Tumors of Eye.');
recordMove(13503, 352, 'Pediatric orbital rhabdomyosarcoma presenting with acute proptosis belongs to Tumors of Eye.');
recordMove(13504, 347, 'Orbital varices showing enlargement on Valsalva maneuver belong to Diseases of the Orbit.');
recordMove(13511, 347, 'Thyroid eye disease extraocular muscle belly enlargement sparing tendons on CT belongs to Diseases of the Orbit.');
recordMove(13744, 352, 'Management of optic nerve glioma confined to orbit in children belongs to Tumors of Eye.');
recordMove(13785, 352, 'Most common adult primary orbital tumor (cavernous hemangioma) belongs to Tumors of Eye.');
recordMove(13794, 349, 'Trochlear 4th nerve palsy causing vertical diplopia worse on downgaze and reading belongs to Strabismus - Types and Treatment.');
recordMove(13900, 349, 'Brown superior oblique tendon sheath syndrome restricted elevation in adduction belongs to Strabismus - Types and Treatment.');
recordMove(13938, 352, 'Capillary hemangioma of orbit in infancy belongs to Tumors of Eye.');

// --- Moves from Module 347 (Diseases of the Orbit) ---
recordMove(4997, 351, 'Etiologies of bilateral primary and secondary optic atrophy belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13676, 351, 'Bilateral papilledema secondary to idiopathic intracranial hypertension belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13815, 351, 'Funduscopic signs and absence of early vision loss in papilledema belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13824, 351, 'Pain on ocular movement in retrobulbar optic neuritis from recti dural sheath attachments belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13831, 351, 'Differential diagnosis of true papilledema vs pseudopapilledema from optic disc drusen belongs to Disorders of Optic Nerve and Gaze Palsies.');

// --- Moves from Module 350 (Disorders of Visual Pathway and Pupillary Reflexes) ---
recordMove(13748, 352, 'Optic nerve glioma presenting with proptosis in child with neurofibromatosis belongs to Tumors of Eye.');
recordMove(13755, 349, 'Oculomotor 3rd nerve palsy "down and out" eye deviation and ptosis belong to Strabismus - Types and Treatment.');
recordMove(13760, 348, 'Innervation of lateral rectus muscle by cranial nerve VI belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13764, 349, 'Abducens 6th nerve injury causing lateral rectus paralysis belongs to Strabismus - Types and Treatment.');
recordMove(13779, 349, 'Loss of outward abduction after head trauma due to 6th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13793, 351, 'Demyelinating retrobulbar optic neuritis in Multiple Sclerosis belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13860, 351, 'Acute painful unilateral vision loss in retrobulbar optic neuritis belongs to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13891, 351, 'Clinical features and natural history of demyelinating optic neuritis belong to Disorders of Optic Nerve and Gaze Palsies.');
recordMove(13931, 352, 'Histopathological Flexner-Wintersteiner rosettes in retinoblastoma belong to Tumors of Eye.');

// --- Moves from Module 351 (Disorders of Optic Nerve and Gaze Palsies) ---
recordMove(13506, 347, 'Cavernous sinus thrombosis causing orbital proptosis and bilateral abducens palsies belongs to Diseases of the Orbit.');
recordMove(13678, 332, 'Bilateral paralysis of accommodation in post-diphtheritic neuropathy belongs to Astigmatism and Errors of Accomodation.');
recordMove(13684, 336, 'Keratoglobus non-inflammatory generalized corneal thinning and ectasia belongs to Non-infectious Disorders of Cornea.');
recordMove(13690, 329, 'Peak cone photoreceptor density at the central foveola belongs to Anatomy and Development of Eye.');
recordMove(13692, 337, 'Outer plexiform layer cleavage plane in senile retinoschisis belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13693, 337, 'Nerve fiber layer splitting in juvenile X-linked retinoschisis belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13700, 350, 'Lateral geniculate nucleus visual pathway relay to Meyer and Baum loops belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13707, 352, 'Uveal metastasis as most common secondary ocular malignancy belongs to Tumors of Eye.');
recordMove(13708, 329, 'Origin of the four recti muscles from the Annulus of Zinn belongs to Anatomy and Development of Eye.');
recordMove(13714, 350, 'Homonymous hemianopic field defect localization along visual pathway belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13719, 329, 'Optic pit appearance on day 22 of human embryogenesis belongs to Anatomy and Development of Eye.');
recordMove(13721, 346, 'Bony optic canal dimensions and transmitting structures belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13722, 329, 'Inner plexiform layer amacrine and ganglion cell synaptic architecture belongs to Anatomy and Development of Eye.');
recordMove(13723, 329, 'Angular displacement of fovea centralis from optic disc margin belongs to Anatomy and Development of Eye.');
recordMove(13733, 329, 'Typical inferonasal iris and chorioretinal coloboma from defective embryonic fissure closure belongs to Anatomy and Development of Eye.');
recordMove(13735, 352, 'Fusiform enlargement of optic nerve on CT in pediatric optic glioma belongs to Tumors of Eye.');
recordMove(13742, 345, 'Schirmer test evaluating autonomic parasympathetic lacrimal secretomotor fibers belongs to Disorders of Lacrimal Apparatus and Glands of the Eye.');
recordMove(13743, 349, 'Clinical presentation of pupil-involving vs pupil-sparing 3rd nerve palsies belongs to Strabismus - Types and Treatment.');
recordMove(13747, 352, 'Pilocytic astrocytoma histopathology of optic nerve glioma belongs to Tumors of Eye.');
recordMove(13749, 348, 'Testing superior rectus muscle elevation in abduction belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13750, 348, 'Yoke muscles responsible for levodepression in cardinal gazes belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13754, 349, 'Trochlear 4th nerve palsy causing vertical and torsional diplopia belongs to Strabismus - Types and Treatment.');
recordMove(13756, 349, 'Nuclear oculomotor 3rd nerve palsy bilateral ptosis and contralateral SR palsy belong to Strabismus - Types and Treatment.');
recordMove(13759, 349, 'Right hypertropia worsening on left gaze and right head tilt in 4th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13765, 348, 'Hess screen and Lancaster red-green test charting paralytic strabismus belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13770, 348, 'Torsional and vertical diplopia evaluation in cyclovertical strabismus belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13776, 348, 'Yoke muscle pairing (Right LR and Left MR) according to Hering law belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13777, 349, 'Total external ophthalmoplegia cranial neuropathy belongs to Strabismus - Types and Treatment.');
recordMove(13778, 349, 'Third cranial nerve palsy with ptosis and down-and-out deviation belongs to Strabismus - Types and Treatment.');
recordMove(13782, 349, 'Bielschowsky head tilt test for superior oblique palsy belongs to Strabismus - Types and Treatment.');
recordMove(13783, 350, 'Optic tract lesion causing contralateral incongruous homonymous hemianopia belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13787, 348, 'Yoke muscle pairs in levo-depression (Left IR and Right SO) belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13788, 335, 'Trigeminal Gasserian ganglion viral reactivation in herpes zoster ophthalmicus belongs to Basics of Cornea and Infectious Keratitis.');
recordMove(13854, 350, 'Origin of geniculocalcarine optic radiations from the lateral geniculate body belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13858, 350, 'Light-near pupillary dissociation (Argyll Robertson, Adie tonic pupil) belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13862, 349, 'Mobius syndrome congenital facial and abducens nerve agenesis belongs to Strabismus - Types and Treatment.');
recordMove(13864, 349, 'Most common cranial nerves paralyzed singly in paralytic strabismus (CN VI, CN IV) belong to Strabismus - Types and Treatment.');
recordMove(13865, 346, 'Superior orbital fissure syndrome causing combined CN III, IV, VI palsies belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13889, 352, 'Contrast MRI assessment of optic nerve invasion in retinoblastoma belongs to Tumors of Eye.');
recordMove(13933, 352, 'Flexner-Wintersteiner rosettes in retinoblastoma enucleation specimen belong to Tumors of Eye.');

// --- Moves from Module 352 (Tumors of Eye) ---
recordMove(12334, 348, 'Maddox rod orientation for evaluating horizontal and vertical heterophoria belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(12359, 330, 'Total refractive power of emmetropic human eye (+60 Diopters) belongs to Elementary Optics and Physiology of Vision.');
recordMove(12360, 330, 'Refractive indices of ocular media (cornea, aqueous, lens, vitreous) belong to Elementary Optics and Physiology of Vision.');
recordMove(12448, 340, 'Aphakic hypermetropic refractive state and total dioptric power (+43 D) belong to Lens - Cataract Surgery, Complications and IOLs.');
recordMove(12455, 331, 'Anisometropia refractive power difference between both eyes belongs to Myopia and Hypermetropia.');
recordMove(12655, 346, 'Acid versus alkali ocular chemical burns pathogenesis belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(12669, 329, 'Ophthalmic artery intraorbital and intraocular branches belong to Anatomy and Development of Eye.');
recordMove(12699, 336, 'Absolute contraindications for donor eye tissue harvesting in eye banking belong to Non-infectious Disorders of Cornea.');
recordMove(12743, 336, 'Endothelial keratoplasty (DSEK / DMEK) for Fuchs endothelial dystrophy belongs to Non-infectious Disorders of Cornea.');
recordMove(13007, 330, 'Gullstrand reduced eye total power (+60 D) belongs to Elementary Optics and Physiology of Vision.');
recordMove(13179, 331, 'Hypermetropia asthenopic symptoms and near vision correction belong to Myopia and Hypermetropia.');
recordMove(13202, 330, 'Maximum optical refractive power (+43 D) at anterior corneal air-tear interface belongs to Elementary Optics and Physiology of Vision.');
recordMove(13253, 346, 'Periorbital ecchymosis (raccoon eyes) in fracture of anterior cranial fossa belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13351, 344, 'Levator resection for ptosis correction belongs to Disorders of the Eyelid.');
recordMove(13352, 344, 'Blepharophimosis, Ptosis, and Epicanthus Inversus Syndrome (BPES) belongs to Disorders of the Eyelid.');
recordMove(13369, 344, 'Epicanthal folds (epicanthus tarsalis, inversus, palpebralis) belong to Disorders of the Eyelid.');
recordMove(13381, 344, 'Involutional senile ectropion horizontal lid laxity belongs to Disorders of the Eyelid.');
recordMove(13397, 344, 'Neurogenic, myogenic, and aponeurotic ptosis etiologies belong to Disorders of the Eyelid.');
recordMove(13398, 344, 'Madarosis (loss of eyelashes) clinical associations belong to Disorders of the Eyelid.');
recordMove(13455, 346, 'Tennis ball contusion injury causing traumatic hyphema and angle recession belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13463, 333, 'Phenol red thread test for measuring tear film volume belongs to Conjunctiva.');
recordMove(13488, 346, 'Immediate rigid eye shield and repair for penetrating open globe injury belong to Orbit Anatomy and Ocular Injuries.');
recordMove(13495, 347, 'Graves disease thyroid eye orbitopathy and pretibial myxedema belong to Diseases of the Orbit.');
recordMove(13512, 347, 'Inferior rectus and medial rectus muscle enlargement in thyroid eye disease belong to Diseases of the Orbit.');
recordMove(13600, 348, 'Maddox rod streak displacement interpretation in heterophoria belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13635, 330, 'Visual acuity measurement with Snellen charts in children belongs to Elementary Optics and Physiology of Vision.');
recordMove(13861, 349, 'Double elevator palsy (monocular elevation deficiency) belongs to Strabismus - Types and Treatment.');
recordMove(13970, 354, 'Bull\'s eye maculopathy caused by chloroquine/hydroxychloroquine toxicity belongs to Mixed / Miscellaneous Topics (Ocular Pharmacology).');
recordMove(13990, 346, 'Periorbital ecchymosis (black eye) and blowout fracture mechanism belong to Orbit Anatomy and Ocular Injuries.');

// --- Moves from Module 353 (Practical Ophthalmology) ---
recordMove(12323, 329, 'Embryonic fissure closure on day 33 (6th week of gestation) belongs to Anatomy and Development of Eye.');
recordMove(12865, 338, 'Refsum disease phytanic acid alpha-oxidation defect tapetoretinal dystrophy belongs to Macular Disorders, Retinal Dystrophies, and Vitreal Disorders.');
recordMove(12961, 339, 'Embryonic nucleus formed in the first 3 months of gestation belongs to Lens - Introduction, Types of Cataract and Clinical Features.');
recordMove(13275, 352, 'Liver metastasis as primary hematogenous route in uveal melanoma belongs to Tumors of Eye.');
recordMove(13443, 337, 'Stickler syndrome autosomal dominant vitreoretinal dystrophy and retinal detachment belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13517, 345, 'Congenital nasolacrimal duct obstruction presenting in 2-month-old infant belongs to Disorders of Lacrimal Apparatus and Glands of the Eye.');
recordMove(13630, 350, 'Homonymous hemianopia with macular sparing in occipital visual cortex infarction belongs to Disorders of Visual Pathway and Pupillary Reflexes.');
recordMove(13705, 352, 'Vortex vein extrascleral extension in uveal melanoma belongs to Tumors of Eye.');
recordMove(13941, 337, 'Scleral indentation with indirect ophthalmoscopy for peripheral retinal breaks in high myopes belongs to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13944, 351, 'Frisen papilledema grading scale in idiopathic intracranial hypertension belongs to Disorders of Optic Nerve and Gaze Palsies.');

// --- Moves from Module 354 (Mixed / Miscellaneous Topics) ---
recordMove(13947, 329, 'Extraocular muscle tendon lengths (medial rectus shortest, superior oblique longest) belong to Anatomy and Development of Eye.');
recordMove(13948, 329, 'Congenital iris and chorioretinal coloboma embryology belongs to Anatomy and Development of Eye.');
recordMove(13956, 329, 'Spiral of Tillaux recti muscle insertion distances from the limbus belongs to Anatomy and Development of Eye.');
recordMove(13957, 348, 'Superior oblique muscle primary (intorsion), secondary (depression), and tertiary (abduction) actions belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13958, 348, 'Sherrington law of reciprocal innervation in antagonistic extraocular muscles belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13959, 348, 'Hering law of equal innervation to contralateral yoke extraocular muscles belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13960, 349, 'Compensatory head tilt to contralateral shoulder in superior oblique 4th nerve palsy belongs to Strabismus - Types and Treatment.');
recordMove(13961, 348, 'Yoke muscle pairing (Right SO and Left IR) in down-and-in gaze belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13962, 348, '4-diopter base-out prism test detecting central suppression scotoma and microtropia belongs to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13966, 352, 'Radioresistance of sebaceous gland carcinoma requiring wide surgical excision belongs to Tumors of Eye.');
recordMove(13969, 343, 'Intravenous ganciclovir and foscarnet for CMV retinitis in immunocompromised hosts belong to Uveitis - Posterior and Panuveitis.');
recordMove(13971, 337, 'Screening criteria for retinopathy of prematurity (gestational age <34 weeks, birth weight <1750g) belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13972, 337, 'Diabetic retinopathy screening guidelines in newly diagnosed type 2 diabetes belong to Retinal Vascular Disorders and Retinal Detachment.');
recordMove(13974, 341, 'Aqueous humor production by non-pigmented ciliary epithelium belongs to Glaucoma.');
recordMove(13977, 341, 'Seidel sickle-shaped extension of blind spot in early glaucomatous visual field loss belongs to Glaucoma.');
recordMove(13979, 346, 'Non-contrast thin-cut CT orbit as investigation of choice for metallic IOFB belongs to Orbit Anatomy and Ocular Injuries.');
recordMove(13980, 348, 'Actions of superior oblique extraocular muscle belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13981, 348, 'Intorsion and depression in adduction of superior oblique muscle belong to Strabismus - Introduction, Symptomatology, and Evaluation.');
recordMove(13998, 330, 'Definition of dioptric power as reciprocal of focal length in meters belongs to Elementary Optics and Physiology of Vision.');
recordMove(13999, 343, 'Salt-and-pepper fundus retinopathy in congenital rubella and syphilis belongs to Uveitis - Posterior and Panuveitis.');
recordMove(14000, 349, 'Etiologies of external ophthalmoplegia (myasthenia, CPEO, cavernous sinus thrombosis) belong to Strabismus - Types and Treatment.');

// =========================================================================
// VALIDATION & SAVING
// =========================================================================

console.log('Total questions in Ophthalmology raw dataset: ' + rawQuestions.length);
console.log('Total flagged moves: ' + moves.length);

const finalAudit = {
  subject: 'Ophthalmology',
  totalQuestions: rawQuestions.length,
  flaggedCount: moves.length,
  moves: moves
};

fs.writeFileSync('tools/audit_deep_ophthalmology.json', JSON.stringify(finalAudit, null, 2));
console.log('Saved audit findings to tools/audit_deep_ophthalmology.json');

process.exit(0);
