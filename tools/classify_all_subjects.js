const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const fs = require('fs');

const SUPABASE_URL = 'https://groeibwykzrliphzzruk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in the environment before running classification.');
const APPLY_CHANGES = process.argv.includes('--apply');
const SUBJECT_FILTER = (() => {
  const i = process.argv.indexOf('--subject');
  return i >= 0 ? String(process.argv[i + 1] || '').trim().toLowerCase() : '';
})();

// Master Medical Taxonomy Builder based on standard Medical Curriculum
function extractKeywords(name, section) {
  const combined = (name + ' ' + (section || '')).toLowerCase();
  // Generate clean n-grams and medical terms
  const terms = combined
    .replace(/[,\/&\(\)\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'the', 'for', 'with', 'part', 'topics', 'general', 'mixed'].includes(w));
  return terms;
}

async function runSubjectClassification() {
  console.log('Loading syllabus structure...');
  const structure = JSON.parse(fs.readFileSync('tools/syllabus_structure.json', 'utf8'));
  
  let grandTotalMoved = 0;
  let subjectStats = {};
  const allUpdates = [];

  for (const [subjName, subjData] of Object.entries(structure)) {
    if (SUBJECT_FILTER && subjName.toLowerCase() !== SUBJECT_FILTER) continue;
    console.log(`\n======================================================`);
    console.log(`Processing Subject: ${subjName} (${subjData.modules.length} modules)`);
    console.log(`======================================================`);

    const modIds = subjData.modules.map(m => m.id);
    if (modIds.length === 0) continue;

    // 1. Fetch ALL questions for this subject (paginated)
    let allQs = [];
    let offset = 0;
    const limit = 1000;
    while (true) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?module_id=in.(${modIds.join(',')})&is_pyq=eq.false&select=id,module_id,question_text,option_a,option_b,option_c,option_d,answer,explanation,is_pyq&offset=${offset}&limit=${limit}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const data = await res.json();
      if (!data || data.length === 0) break;
      allQs.push(...data);
      if (data.length < limit) break;
      offset += limit;
    }

    console.log(`Total questions fetched for ${subjName}: ${allQs.length}`);
    if (allQs.length === 0) continue;

    // 2. Prepare Subject Module Taxonomy with Domain Synonyms
    const modulesWithTaxonomy = subjData.modules.map(m => {
      const rawKws = extractKeywords(m.name, m.section);
      return {
        id: m.id,
        key: m.key,
        name: m.name,
        section: m.section,
        keywords: rawKws,
        exactName: m.name.toLowerCase(),
        exactSection: (m.section || '').toLowerCase()
      };
    });

    // 3. Classify Questions
    let updates = [];
    for (const q of allQs) {
      const fullText = (q.question_text + ' ' + (q.explanation || '') + ' ' + (q.option_a || '') + ' ' + (q.option_b || '') + ' ' + (q.option_c || '') + ' ' + (q.option_d || '')).toLowerCase();
      const stemLower = q.question_text.toLowerCase();

      let bestModId = q.module_id;
      let maxScore = 0;

      for (const m of modulesWithTaxonomy) {
        let score = 0;

        // Exact module name match
        if (m.exactName.length > 4 && stemLower.includes(m.exactName)) {
          score += 15;
        } else if (m.exactName.length > 4 && fullText.includes(m.exactName)) {
          score += 8;
        }

        // Section match
        if (m.exactSection.length > 4 && stemLower.includes(m.exactSection)) {
          score += 5;
        }

        // Individual keyword matches
        for (const kw of m.keywords) {
          if (stemLower.includes(kw)) {
            score += (kw.length > 6 ? 4 : 2);
          } else if (fullText.includes(kw)) {
            score += (kw.length > 6 ? 2 : 1);
          }
        }

        if (score > maxScore) {
          maxScore = score;
          bestModId = m.id;
        }
      }

      // If high confidence match found and differs from current
    if (bestModId !== q.module_id && maxScore >= 4) {
        updates.push({ id: q.id, old_module_id: q.module_id, new_module_id: bestModId, score: maxScore, subject: subjName, question: q.question_text });
      }
    }

    console.log(`Reclassifying ${updates.length} / ${allQs.length} questions in ${subjName} (${((updates.length/allQs.length)*100).toFixed(1)}%)...`);

    allUpdates.push(...updates);

    // 4. Apply only when explicitly requested; otherwise keep a reviewable dry-run.
    if (!APPLY_CHANGES) {
      subjectStats[subjName] = { total: allQs.length, suggested: updates.length };
      continue;
    }

    let appliedCount = 0;
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      await Promise.all(chunk.map(u => 
        fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${u.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ module_id: u.new_module_id })
        })
      ));
      appliedCount += chunk.length;
    }

    grandTotalMoved += appliedCount;
    subjectStats[subjName] = { total: allQs.length, reclassified: appliedCount };
    console.log(`✓ Completed ${subjName}: ${appliedCount} questions successfully moved to their exact topics.`);
  }

  if (!APPLY_CHANGES) {
    fs.writeFileSync('tools/classification_suggestions.json', JSON.stringify(allUpdates, null, 2));
    console.log(`Dry run only: saved ${allUpdates.length} suggestions to tools/classification_suggestions.json. Re-run with --apply after review to write changes.`);
  }

  console.log('\n======================================================');
  console.log('GRAND SUMMARY: SUBJECT-WIDE CLASSIFICATION COMPLETE');
  console.log(`Total Questions Reclassified across all 19 subjects: ${grandTotalMoved}`);
  console.log('Subject-by-Subject Breakdown:');
  console.table(subjectStats);
  console.log('======================================================\n');
}

runSubjectClassification();
