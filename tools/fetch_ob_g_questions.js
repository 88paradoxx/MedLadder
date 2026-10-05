const https = require('https');
const fs = require('fs');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

async function fetchAllOBGQuestions() {
  const allQuestions = [];
  for (let m = 531; m <= 574; m++) {
    let offset = 0;
    const limit = 1000;
    let moduleQuestions = [];
    while (true) {
      const questions = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'groeibwykzrliphzzruk.supabase.co',
          path: `/rest/v1/questions?module_id=eq.${m}&is_pyq=eq.false&order=id.asc&offset=${offset}&limit=${limit}`,
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json'
          },
          agent: false
        };
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        });
        req.on('error', reject);
        req.end();
      });

      moduleQuestions = moduleQuestions.concat(questions);
      if (questions.length < limit) break;
      offset += limit;
    }
    console.log(`Module ${m}: ${moduleQuestions.length} questions`);
    allQuestions.push(...moduleQuestions);
  }
  console.log(`Total questions fetched: ${allQuestions.length}`);
  fs.writeFileSync('tools/ob_g_questions_raw.json', JSON.stringify(allQuestions, null, 2));
  process.exit(0);
}

fetchAllOBGQuestions().catch(err => {
  console.error('Fetch error:', err);
  process.exit(1);
});
