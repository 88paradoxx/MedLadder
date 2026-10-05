const fs = require('fs');
const https = require('https');

const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

async function fetchAllModuleCounts() {
  console.log('Fetching all question module assignments from Supabase...');
  let allRows = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const rows = await new Promise((resolve) => {
      https.get({
        hostname: 'groeibwykzrliphzzruk.supabase.co',
        path: '/rest/v1/questions?select=id,module_id,is_pyq&limit=' + limit + '&offset=' + offset,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch(e) { resolve([]); }
        });
      }).on('error', err => resolve([]));
    });
    
    if (!rows || rows.length === 0) break;
    allRows.push(...rows);
    offset += limit;
    if (rows.length < limit) break;
  }
  
  console.log('Total questions fetched from Supabase:', allRows.length);
  
  const counts = {};
  allRows.forEach(r => {
    if (!r.is_pyq && r.module_id) {
      counts[r.module_id] = (counts[r.module_id] || 0) + 1;
    }
  });
  
  return counts;
}

async function updateSyllabus() {
  const counts = await fetchAllModuleCounts();
  const content = fs.readFileSync('syllabus.js', 'utf8');
  
  let updatedContent = content.replace(/\{\s*id:\s*(\d+),\s*name:\s*('[^']+'|"[^"]+"),\s*questionCount:\s*\d+/g, (match, id, name) => {
    const count = counts[parseInt(id)] || 0;
    return `{ id: ${id}, name: ${name}, questionCount: ${count}`;
  });

  // Also update subject total questionCount and moduleCount
  // Parse SYLLABUS_DATA to recompute subject totals
  fs.writeFileSync('syllabus.js', updatedContent, 'utf8');
  console.log('syllabus.js updated!');
}

updateSyllabus();
