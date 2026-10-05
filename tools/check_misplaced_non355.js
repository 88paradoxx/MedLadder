const fs = require('fs');

const allQuestions = JSON.parse(fs.readFileSync('tools/live_psm_questions.json', 'utf8'));
const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => modMap[m.moduleId] = m);

function clean(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Module validation signatures
const signatures = {
  356: ['pqli', 'hdi', 'daly', 'qaly', 'hale', 'sullivan', 'determinant', 'indicator', 'burden of disease', 'human poverty index', 'case fatality rate', 'proportional mortality', 'death certificate', 'hunger index', 'mpi'],
  357: ['prevention', 'primordial', 'primary prevention', 'secondary prevention', 'tertiary prevention', 'disability limitation', 'rehabilitation', 'iceberg', 'natural history', 'prepathogenesis', 'pathogenesis', 'triad', 'web of causation', 'beings model', 'causation', 'sufficient cause'],
  358: ['incidence', 'prevalence', 'attack rate', 'secondary attack rate', 'epidemic curve', 'point source', 'propagated', 'secular trend', 'cyclic trend', 'seasonal', 'investigation of epidemic', 'spot map', 'crude death rate', 'standardization', 'smr'],
  359: ['case control', 'case-control', 'cohort', 'odds ratio', 'relative risk', 'attributable risk', 'cross sectional', 'cross-sectional', 'ecological', 'bias', 'berkson', 'recall bias', 'confounding', 'matching'],
  360: ['randomized', 'rct', 'blinding', 'double blind', 'single blind', 'triple blind', 'intention to treat', 'community trial', 'field trial'],
  361: ['endemic', 'epidemic', 'pandemic', 'sporadic', 'exotic', 'hyperendemic', 'holoendemic', 'carrier', 'reservoir', 'herd immunity', 'eradication', 'elimination'],
  362: ['transmission', 'droplet', 'airborne', 'vector', 'vehicle', 'fomite', 'incubation period', 'generation time', 'serial interval', 'quarantine', 'isolation'],
  363: ['vaccine', 'vaccination', 'immunization', 'immunising', 'active immunity', 'passive immunity', 'toxoid', 'live attenuated', 'killed', 'aefi', 'contraindication'],
  364: ['cold chain', 'ilr', 'deep freezer', 'vaccine carrier', 'vvm', 'shake test', 'freeze sensitive', 'heat sensitive', 'storage of vaccine', 'reconstitution'],
  365: ['autoclave', 'sterilization', 'disinfection', 'disinfectant', 'antiseptic', 'cresol', 'hot air oven', 'bleaching powder disinfection'],
  366: ['screening', 'sensitivity', 'specificity', 'positive predictive value', 'negative predictive value', 'ppv', 'npv', 'likelihood ratio', 'roc curve', 'lead time', 'length bias', 'yield'],
  367: ['measles', 'rubella', 'mumps', 'chickenpox', 'varicella', 'smallpox', 'influenza', 'h1n1', 'covid', 'sars'],
  368: ['diphtheria', 'pertussis', 'whooping cough', 'meningococcal', 'acute respiratory infection', 'ari'],
  369: ['polio', 'hepatitis a', 'hepatitis e', 'cholera', 'typhoid', 'enteric fever', 'food poisoning', 'botulism', 'ors', 'zinc in diarrhea', 'guinea worm'],
  370: ['dengue', 'chikungunya', 'yellow fever', 'filariasis', 'japanese encephalitis', 'kala-azar', 'leishmania', 'zika'],
  371: ['rabies', 'hydrophobia', 'anti-rabies', 'rig', 'kfd', 'nipah', 'cchf', 'ebola'],
  372: ['brucellosis', 'leptospirosis', 'plague', 'anthrax', 'typhus', 'scrub typhus', 'q fever', 'hydatid', 'cysticercosis'],
  373: ['syphilis', 'gonorrhea', 'chancroid', 'chlamydia', 'lgv', 'donovanosis', 'syndromic', 'tetanus', 'trachoma', 'yaws'],
  374: ['cardiovascular', 'coronary', 'hypertension', 'rheumatic heart', 'rheumatic fever', 'stroke', 'diabetes', 'metabolic syndrome', 'blood pressure'],
  375: ['cancer', 'carcinoma', 'screening for cancer', 'mammography', 'pap smear', 'via', 'obesity', 'bmi', 'waist circumference', 'blindness', 'visual acuity', 'npcb', 'vision 2020'],
  376: ['nvbdcp', 'malaria', 'filaria', 'annual parasite incidence', 'api', 'aber', 'spr', 'act regimen', 'primaquine', 'mda in filaria'],
  377: ['nlep', 'leprosy', 'mdt', 'mitsuda', 'ntep', 'rntcp', 'tuberculosis', 'tb', 'dots', 'nikshay', 'cbnaat', 'truenat', 'mdr', 'xdr', 'naco', 'hiv', 'aids', 'art'],
  378: ['nis', 'uip', 'jsy', 'jssk', 'pmsma', 'pmmvy', 'rbsk', 'rksk', 'wifs', 'nipi', 'icds', 'ayushman bharat', 'pmjay', 'idsp'],
  379: ['demographic cycle', 'growth rate', 'doubling time', 'age pyramid', 'population pyramid', 'dependency ratio', 'demographic transition', 'sex ratio'],
  380: ['crude birth rate', 'fertility rate', 'tfr', 'nrr', 'grr', 'infant mortality', 'imr', 'u5mr', 'maternal mortality', 'mmr', 'census', 'srs', 'nfhs', 'vital statistics'],
  381: ['contracepti', 'copper t', 'cu-t', 'iud', 'iucd', 'pearl index', 'oral contraceptive', 'mala d', 'saheli', 'chhaya', 'dmpa', 'vasectomy', 'tubectomy', 'sterilization', 'mtp'],
  382: ['antenatal', 'anc', 'breastfeeding', 'colostrum', 'growth chart', 'road to health', 'imnci', 'kangaroo mother care', 'kmc', 'low birth weight', 'geriatric'],
  383: ['vitamin', 'xerophthalmia', 'bitot', 'pellagra', 'beriberi', 'scurvy', 'rickets', 'folic acid', 'iron', 'iodine', 'fluorosis', 'kwashiorkor', 'marasmus', 'protein energy malnutrition', 'rda', 'reference indian', 'nutrition'],
  384: ['lathyrism', 'khesari', 'boaa', 'epidemic dropsy', 'argemone', 'pasteurization', 'phosphatase test', 'adulteration', 'fssai', 'agmark', 'aflatoxin', 'ergotism'],
  385: ['family', 'sociology', 'culture', 'social pathology', 'customs', 'beliefs'],
  386: ['kuppuswamy', 'bg prasad', 'udai pareek', 'socioeconomic', 'poverty line', 'cost-effective', 'cost-benefit', 'cost-utility', 'health economics', 'social security'],
  387: ['water source', 'well', 'slow sand filter', 'rapid sand filter', 'schmutzdecke', 'water purification'],
  388: ['chlorination', 'bleaching powder', 'horrocks', 'orthotolidine', 'ota test', 'residual chlorine'],
  389: ['water hardness', 'hardness of water', 'coliform', 'mpn', 'most probable number', 'water quality', 'water borne', 'water-borne'],
  390: ['housing', 'overcrowding', 'kata thermometer', 'cooling power of air', 'air velocity', 'ventilation', 'thermal comfort'],
  391: ['lighting', 'daylight factor', 'noise', 'decibel', 'sound level', 'radiation', 'tld', 'alara'],
  392: ['solid waste', 'composting', 'sanitary landfill', 'latrine', 'septic tank', 'sewage', 'bod', 'cod'],
  393: ['anopheles', 'culex', 'aedes', 'mansonia', 'mosquito', 'housefly', 'sandfly', 'phlebotomus', 'fly'],
  394: ['tick', 'ixodidae', 'argasidae', 'flea', 'cheopis', 'mite', 'trombiculid', 'louse', 'lice', 'cyclops'],
  395: ['insecticide', 'larvicide', 'ddt', 'malathion', 'temephos', 'abate', 'pyrethroid', 'gambusia', 'pest control'],
  396: ['biomedical waste', 'bmw', 'yellow bag', 'red bag', 'blue box', 'white translucent', 'sharps'],
  397: ['disaster', 'triage', 'red tag', 'yellow tag', 'green tag', 'black tag', 'bioterrorism'],
  398: ['occupational', 'pneumoconiosis', 'silicosis', 'asbestosis', 'byssinosis', 'bagassosis', 'farmers lung', 'anthracosis', 'lead poisoning', 'plumbism', 'factories act', 'esi act'],
  399: ['health education', 'communication', 'panel discussion', 'symposium', 'delphi', 'role play', 'socio-drama', 'health propaganda'],
  400: ['planning cycle', 'health planning', 'committee', 'bhore', 'mudaliar', 'kartar singh', 'shrivastav', 'pert', 'cpm', 'network analysis'],
  401: ['healthcare in india', 'subcentre', 'sub-centre', 'phc', 'chc', 'primary health centre', 'community health centre', 'asha', 'anganwadi', 'iphs', 'ayush'],
  402: ['world health organization', 'who', 'unicef', 'fao', 'ilo', 'red cross', 'international health regulations'],
  403: ['nominal', 'ordinal', 'discrete', 'continuous', 'qualitative', 'quantitative', 'bar chart', 'pie chart', 'histogram', 'ogive', 'frequency polygon', 'probability'],
  404: ['mean', 'median', 'mode', 'central tendency', 'percentile', 'quartile'],
  405: ['standard deviation', 'variance', 'coefficient of variation', 'normal distribution', 'gaussian', 'skewed', 'standard error', 'confidence interval'],
  406: ['correlation', 'pearson', 'spearman', 'regression', 'linear regression'],
  407: ['hypothesis', 'null hypothesis', 'type i error', 'type ii error', 'alpha error', 'beta error', 't-test', 'chi-square', 'anova', 'p-value', 'significance'],
  408: ['sampling', 'random sampling', 'stratified sampling', 'cluster sampling', 'snowball', 'meta-analysis', 'forest plot', 'funnel plot', 'phase 1', 'phase 2', 'phase 3', 'phase 4', 'clinical trial'],
  409: ['mental health', 'nmhp', 'dmhp', 'mental healthcare act'],
  410: ['world health day', 'celebrated on', 'health day', 'miscellaneous']
};

let misalignedInCurrent = 0;
const misalignedList = [];

for (let m = 356; m <= 410; m++) {
  const modQs = allQuestions.filter(q => q.module_id === m);
  const sigs = signatures[m] || [];
  
  modQs.forEach(q => {
    const text = clean(q.question_text + ' ' + (q.explanation || '') + ' ' + (q.answer || '')).toLowerCase();
    const matchesCurrent = sigs.some(s => text.includes(s));
    if (!matchesCurrent) {
      misalignedInCurrent++;
      misalignedList.push({
        id: q.id,
        currentModule: m,
        moduleName: modMap[m] ? modMap[m].moduleName : '',
        qText: clean(q.question_text).slice(0, 100)
      });
    }
  });
}

console.log(`Questions in modules 356-410 not matching primary module signature: ${misalignedInCurrent}`);
fs.writeFileSync('tools/misaligned_non355.json', JSON.stringify(misalignedList, null, 2));

process.exit(0);
