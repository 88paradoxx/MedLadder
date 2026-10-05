const fs = require('fs');
const https = require('https');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

function fetchForModules(startMod, endMod, filename) {
  return new Promise(async (resolve, reject) => {
    console.log(`Fetching live questions for Modules ${startMod} to ${endMod} into ${filename}...`);
    let allQs = [];
    const modIds = [];
    for (let i = startMod; i <= endMod; i++) modIds.push(i);

    // Fetch in batches of 10 modules
    for (let m = 0; m < modIds.length; m += 10) {
      const slice = modIds.slice(m, m + 10);
      const modFilter = slice.join(',');
      let offset = 0;
      const limit = 1000;

      while (true) {
        const rows = await new Promise((res) => {
          https.get({
            hostname: SUPABASE_HOST,
            path: `/rest/v1/questions?module_id=in.(${modFilter})&is_pyq=eq.false&limit=${limit}&offset=${offset}`,
            agent: false,
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': 'Bearer ' + SUPABASE_KEY
            }
          }, r => {
            let d = '';
            r.on('data', chunk => d += chunk);
            r.on('end', () => {
              try { res(JSON.parse(d)); } catch(e) { res([]); }
            });
          }).on('error', () => res([]));
        });

        if (!rows || rows.length === 0) break;
        allQs.push(...rows);
        offset += limit;
        if (rows.length < limit) break;
      }
    }

    console.log(`Fetched ${allQs.length} questions for ${filename}`);
    fs.writeFileSync(filename, JSON.stringify(allQs, null, 2));
    resolve(allQs.length);
  });
}

async function main() {
  await fetchForModules(480, 530, 'tools/live_fresh_surgery.json');
  await fetchForModules(531, 574, 'tools/live_fresh_ob_g.json');
  await fetchForModules(575, 608, 'tools/live_fresh_pediatrics.json');
  console.log('All fresh questions fetched successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
