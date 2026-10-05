const fs = require('fs');
const https = require('https');

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
          'Authorization': 'Bearer ' + SUPABASE_KEY
        },
        agent: false
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              allData.push(...parsed);
              if (parsed.length === 1000) {
                fetchPage(offset + 1000);
              } else {
                resolve(allData);
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Status ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', err => reject(err));
      req.end();
    }

    fetchPage(0);
  });
}

async function main() {
  console.log('Fetching questions for Forensic Medicine (Modules 272 to 292)...');
  const allQuestions = [];
  const moduleCounts = {};

  for (let mod = 272; mod <= 292; mod++) {
    try {
      const qs = await fetchModuleQuestions(mod);
      moduleCounts[mod] = qs.length;
      allQuestions.push(...qs);
      console.log(`Module ${mod}: ${qs.length} questions fetched`);
    } catch (err) {
      console.error(`Error fetching module ${mod}:`, err.message);
    }
  }

  console.log(`\nTotal questions fetched: ${allQuestions.length}`);
  fs.writeFileSync('tools/fmt_questions_raw.json', JSON.stringify(allQuestions, null, 2));
  console.log('Saved to tools/fmt_questions_raw.json');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
