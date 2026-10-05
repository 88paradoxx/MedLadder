const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));
const modMap = {};
allModules.forEach(m => {
  modMap[m.moduleId] = m;
});

const questions = JSON.parse(fs.readFileSync('tools/fmt_questions_raw.json', 'utf8'));

function cleanText(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log(`Auditing ${questions.length} questions...`);

// Modules 272 to 292
// 272: Skeletal and Dental Age Determination
// 273: Race, Sex and Stature Determination
// 274: Fingerprint and Tattoos
// 275: BNS, BNSS, and BSA
// 276: Death and Post-Mortem Changes
// 277: Medico Legal Autopsy
// 278: Mechanical Injuries
// 279: Regional Injuries
// 280: Thermal Injuries
// 281: Firearm Injuries and Blast Injuries
// 282: Mechanical Asphyxia
// 283: Drowning
// 284: Sexual Offences and Abortion
// 285: Childhood Violence, Infanticide and Starvation
// 286: Poisoning: General Considerations
// 287: Organophosphorus Poisoning
// 288: Corrosives and Asphyxiants
// 289: Alcohol Poisoning
// 290: Inorganic Irritants - Metallic and Non-metallic
// 291: Organic Irritants - Plant and Animal Poisons
// 292: Mixed / Miscellaneous Topics

process.exit(0);
