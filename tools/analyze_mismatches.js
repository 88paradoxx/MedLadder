const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const fs = require('fs');
const path = require('path');

global.window = {};
require('../syllabus.js');
const syllabus = window.SYLLABUS_DATA;

const SUPABASE_URL = 'https://groeibwykzrliphzzruk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in the environment.');

// Map of moduleId -> metadata
const moduleMap = new Map();
const subjectList = [];

for (const s of syllabus) {
  subjectList.push(s.name);
  for (const m of s.modules) {
    moduleMap.set(m.id, {
      subject: s.name,
      moduleName: m.name,
      section: m.section || '',
      key: m.moduleId
    });
  }
}

async function fetchAllQuestions() {
  console.log('Fetching questions from Supabase...');
  let all = [];
  let from = 0;
  const step = 1000; // PostgREST max limit is 1000

  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=id,module_id,subject,question_text,explanation&offset=${from}&limit=${step}`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    if (!rows || rows.length === 0) break;
    all.push(...rows);
    process.stdout.write(`\rLoaded ${all.length} questions...`);
    if (rows.length < step) break;
    from += rows.length;
  }
  console.log(`\nTotal questions loaded: ${all.length}`);
  return all;
}

// Normalize subject string for comparison
function normSubject(s) {
  if (!s) return '';
  const str = s.toLowerCase().replace(/[^a-z]/g, '');
  if (str.includes('ob') || str.includes('gyn')) return 'obg';
  if (str.includes('psm') || str.includes('comm') || str.includes('preventive')) return 'psm';
  if (str.includes('forensic') || str.includes('fmt')) return 'fmt';
  if (str.includes('ortho')) return 'ortho';
  if (str.includes('pedia')) return 'pedia';
  if (str.includes('anaesth')) return 'anaesth';
  if (str.includes('opht')) return 'opht';
  if (str.includes('ent') || str.includes('otorhinol')) return 'ent';
  if (str.includes('derma')) return 'derma';
  if (str.includes('psych')) return 'psych';
  if (str.includes('radio')) return 'radio';
  if (str.includes('anat')) return 'anat';
  if (str.includes('physio')) return 'physio';
  if (str.includes('biochem')) return 'biochem';
  if (str.includes('patho')) return 'patho';
  if (str.includes('pharm')) return 'pharm';
  if (str.includes('micro')) return 'micro';
  if (str.includes('surg')) return 'surg';
  if (str.includes('med')) return 'med';
  return str;
}

async function analyze() {
  const questions = await fetchAllQuestions();

  const crossSubjectMismatches = [];
  const invalidModuleIds = [];
  const suspiciousTopicMismatches = [];

  for (const q of questions) {
    const mod = moduleMap.get(q.module_id);
    if (!mod) {
      invalidModuleIds.push({
        id: q.id,
        moduleId: q.module_id,
        qSubject: q.subject
      });
      continue;
    }

    const qSubNorm = normSubject(q.subject);
    const modSubNorm = normSubject(mod.subject);

    // 1. Direct Subject mismatch
    if (qSubNorm && modSubNorm && qSubNorm !== modSubNorm) {
      crossSubjectMismatches.push({
        id: q.id,
        moduleId: q.module_id,
        qSubject: q.subject,
        moduleSubject: mod.subject,
        moduleName: mod.moduleName,
        section: mod.section,
        snippet: (q.question_text || '').replace(/<[^>]*>/g, '').slice(0, 140)
      });
    }
  }

  console.log(`\nAnalysis Results:`);
  console.log(`1. Questions with invalid/orphaned module_id: ${invalidModuleIds.length}`);
  console.log(`2. Questions with direct Subject Mismatch (e.g. Surgery Q placed in Psychiatry module): ${crossSubjectMismatches.length}`);

  const output = {
    totalQuestions: questions.length,
    invalidModuleIdsCount: invalidModuleIds.length,
    crossSubjectMismatchesCount: crossSubjectMismatches.length,
    invalidModuleIds: invalidModuleIds.slice(0, 50),
    crossSubjectMismatches
  };

  fs.writeFileSync(path.join(__dirname, 'classification_audit.json'), JSON.stringify(output, null, 2));
  console.log('Saved preliminary audit to tools/classification_audit.json');
}

analyze().catch(console.error);
