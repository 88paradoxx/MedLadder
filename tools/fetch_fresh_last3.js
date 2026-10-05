const fs = require('fs');
const https = require('https');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const SUPABASE_HOST = 'groeibwykzrliphzzruk.supabase.co';

function fetchForModules(startMod, endMod, filename) {
  return new Promise(async (resolve) => {
    console.log(`Fetching live questions for Modules ${startMod} to ${endMod} into ${filename}...`);
    let allQs = [];
    const modIds = [];
    for (let i = startMod; i <= endMod; i++) modIds.push(i);

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
  await fetchForModules(633, 656, 'tools/live_dermatology_fresh.json');
  await fetchForModules(687, 719, 'tools/live_psychiatry_fresh.json');
  await fetchForModules(720, 739, 'tools/live_radiology_fresh.json');
  console.log('All 3 remaining subjects fresh datasets ready!');
  process.exit(0);
}

main();
