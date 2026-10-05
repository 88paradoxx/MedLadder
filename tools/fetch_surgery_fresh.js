const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://groeibwykzrliphzzruk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

function fetchPage(offset, limit = 1000) {
  return new Promise((resolve, reject) => {
    const url = new URL(
      `${SUPABASE_URL}/rest/v1/questions?module_id=gte.480&module_id=lte.530&is_pyq=eq.false&order=id.asc&offset=${offset}&limit=${limit}`
    );
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      agent: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    let allQuestions = [];
    let offset = 0;
    const limit = 1000;
    while (true) {
      console.log(`Fetching offset ${offset}...`);
      const page = await fetchPage(offset, limit);
      allQuestions = allQuestions.concat(page);
      if (page.length < limit) break;
      offset += limit;
    }
    console.log(`Successfully fetched ${allQuestions.length} questions.`);
    fs.writeFileSync('tools/raw_surgery.json', JSON.stringify(allQuestions, null, 2), 'utf8');
    console.log('Saved to tools/raw_surgery.json');
    process.exit(0);
  } catch (err) {
    console.error('Fetch error:', err);
    process.exit(1);
  }
}

main();
