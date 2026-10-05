const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://groeibwykzrliphzzruk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

async function fetchQuestionsForModule(modId) {
  let allQuestions = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const questions = await new Promise((resolve, reject) => {
      const url = new URL(SUPABASE_URL + '/rest/v1/questions');
      url.searchParams.set('module_id', 'eq.' + modId);
      url.searchParams.set('is_pyq', 'eq.false');
      url.searchParams.set('select', 'id,module_id,question_text,option_a,option_b,option_c,option_d,answer,explanation');
      url.searchParams.set('order', 'id.asc');
      url.searchParams.set('offset', offset.toString());
      url.searchParams.set('limit', limit.toString());

      const req = https.request(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        },
        agent: false
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    allQuestions.push(...questions);
    if (questions.length < limit) {
      break;
    }
    offset += limit;
  }
  return allQuestions;
}

async function main() {
  console.log('Fetching live questions for modules 355 to 410...');
  const allPSMQuestions = [];
  
  for (let modId = 355; modId <= 410; modId++) {
    const qs = await fetchQuestionsForModule(modId);
    console.log(`Module ${modId}: fetched ${qs.length} questions`);
    allPSMQuestions.push(...qs);
  }

  console.log(`Total PSM questions fetched: ${allPSMQuestions.length}`);
  fs.writeFileSync(path.join(__dirname, 'live_psm_questions.json'), JSON.stringify(allPSMQuestions, null, 2));
  console.log('Saved to tools/live_psm_questions.json');
  process.exit(0);
}

main().catch(err => {
  console.error('Error fetching questions:', err);
  process.exit(1);
});
