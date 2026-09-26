const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
  // Strip query strings and hash
  const urlPath = req.url.split('?')[0].split('#')[0];
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\\/])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(ROOT, safePath);

  fs.stat(filePath, (err, stats) => {
    // If path is a directory, look for index.html inside
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // SPA Fallback: if requesting a route (no extension), serve index.html
        if (!path.extname(urlPath)) {
          return fs.readFile(path.join(ROOT, 'index.html'), (spaErr, indexData) => {
            if (spaErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              return res.end('404 Not Found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(indexData);
          });
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found: ' + urlPath);
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Disable caching for development
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
});

// Get local network IP for mobile testing
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

// Bind to 0.0.0.0 so mobile devices on the same Wi-Fi can connect
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`\n🚀 MedLadder local server running at:\n`);
  console.log(`   💻 Local:   http://localhost:${PORT}`);
  if (localIP) {
    console.log(`   📱 Mobile:  http://${localIP}:${PORT}  (same Wi-Fi)`);
  }
  console.log(`\nPress Ctrl+C to stop.\n`);
});

