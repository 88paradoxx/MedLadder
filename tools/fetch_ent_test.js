const https = require('https');
const fs = require('fs');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

function getCount(modId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: SUPABASE_HOST,
      path: '/rest/v1/questions?module_id=eq.' + modId + '&is_pyq=eq.false&select=id',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'count=exact',
        'Range': '0-0'
      },
      agent: false
    }, (res) => {
      const cr = res.headers['content-range'];
      resolve(cr ? parseInt(cr.split('/')[1]) : 0);
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const raw = JSON.parse(fs.readFileSync('tools/raw_ent.json', 'utf8'));
  console.log('Checking counts for modules 293, 294, 295, 299, 300...');
  for (const m of [293, 294, 295, 299, 300]) {
    const live = await getCount(m);
    const inRaw = raw.filter(q => q.module_id === m).length;
    console.log(`Module ${m}: live=${live}, in raw=${inRaw}`);
  }
  process.exit(0);
}
run();
