// Static server that mimics the host: cleanUrls + SPA rewrite + the headers from vercel.json.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2], PORT = +process.argv[3] || 8123;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const headers = {};
cfg.headers[0].headers.forEach(h => { headers[h.key] = h.value; });
// local http: drop directives that only make sense on https
headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');
delete headers['Strict-Transport-Security'];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  else if (!fs.existsSync(f)) f = path.join(ROOT, 'index.html');
  const h = Object.assign({ 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }, headers);
  if (p === '/sw.js') h['Cache-Control'] = 'no-cache';
  res.writeHead(200, h); fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('listening', PORT));
