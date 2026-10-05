const https = require('https');
const fs = require('fs');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

function fetchModuleQuestions(moduleId) {
  return new Promise((resolve, reject) => {
    let allData = [];
    
    function fetchPage(offset) {
      const options = {
        hostname: SUPABASE_HOST,
        path: `/rest/v1/questions?module_id=eq.${moduleId}&is_pyq=eq.false&select=*&order=id.asc&offset=${offset}&limit=1000`,
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Range-Unit': 'items'
        },
        agent: false
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              allData = allData.concat(parsed);
              if (parsed.length === 1000) {
                fetchPage(offset + 1000);
              } else {
                resolve(allData);
              }
            } catch (e) {
              reject(new Error(`Failed to parse JSON for module ${moduleId}: ${e.message}`));
            }
          } else {
            reject(new Error(`HTTP error ${res.statusCode} for module ${moduleId}: ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    }

    fetchPage(0);
  });
}

async function run() {
  console.log('Fetching questions for ENT modules 293 to 328 from Supabase...');
  let totalQuestions = [];
  const moduleCounts = {};

  for (let m = 293; m <= 328; m++) {
    try {
      const questions = await fetchModuleQuestions(m);
      moduleCounts[m] = questions.length;
      totalQuestions = totalQuestions.concat(questions);
      console.log(`Module ${m}: fetched ${questions.length} questions (total so far: ${totalQuestions.length})`);
    } catch (err) {
      console.error(`Error fetching module ${m}:`, err);
    }
  }

  console.log(`Finished fetching. Total ENT questions: ${totalQuestions.length}`);
  fs.writeFileSync('tools/ent_live_questions.json', JSON.stringify(totalQuestions, null, 2));
  console.log('Saved to tools/ent_live_questions.json');
  process.exit(0);
}

run();
