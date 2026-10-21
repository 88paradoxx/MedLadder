const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const webDir = path.resolve(root, 'www');
if (!webDir.startsWith(root + path.sep)) {
  throw new Error('Refusing to write outside the project directory.');
}

if (fs.existsSync(webDir)) fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });

const files = [
  'index.html', 'app.css', 'quiz-pro.css', 'app.js', 'syllabus.js',
  'gtag-init.js', 'analytics-loader.js', 'theme-init.js', 'manifest.json', 'favicon.ico',
  'privacy.html', 'terms.html',
  // Mock-test feature (user + admin)
  'mock-test.html', 'mock-test.css', 'mock-test.js', 'mock-banner.js',
  'admin-mock.html', 'admin-mock.css', 'admin-mock.js',
  // NEET SS Books
  'neet-ss-books.html', 'neet-ss-books.js'
];
const directories = ['assets', 'icons'];

for (const file of files) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(webDir, file));
}

for (const directory of directories) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(webDir, directory), {
      recursive: true,
      filter: (src) => {
        // Exclude unused raw PNG subject icons (app.js uses subjects-webp) and splash files
        const normalized = src.replace(/\\/g, '/');
        if (normalized.includes('/assets/subjects/') && !normalized.includes('subjects-webp')) return false;
        if (normalized.includes('splash')) return false;
        return true;
      }
    });
  }
}

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'android-native-bridge.js')],
  outfile: path.join(webDir, 'medladder-native.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020']
});

const appHtmlPath = path.join(webDir, 'index.html');
let appHtml = fs.readFileSync(appHtmlPath, 'utf8');
appHtml = appHtml.replace(
  '<script src="/app.js" defer></script>',
  '<script src="/medladder-native.js" defer></script>\n  <script src="/app.js" defer></script>'
);
if (!appHtml.includes('is-native-app')) {
  if (appHtml.includes('<html lang="en" class="dark"')) {
    appHtml = appHtml.replace('<html lang="en" class="dark"', '<html lang="en" class="dark is-native-app" data-native="true"');
  } else {
    appHtml = appHtml.replace('<html lang="en"', '<html lang="en" class="is-native-app" data-native="true"');
  }
}
fs.writeFileSync(appHtmlPath, appHtml);

const mockHtmlPath = path.join(webDir, 'mock-test.html');
if (fs.existsSync(mockHtmlPath)) {
  let mockHtml = fs.readFileSync(mockHtmlPath, 'utf8');
  mockHtml = mockHtml.replace(
    '<script src="/mock-test.js" defer></script>',
    '<script src="/medladder-native.js" defer></script>\n  <script src="/mock-test.js" defer></script>'
  );
  if (!mockHtml.includes('is-native-app')) {
    mockHtml = mockHtml.replace('<html lang="en" class="dark"', '<html lang="en" class="dark is-native-app" data-native="true"');
  }
  fs.writeFileSync(mockHtmlPath, mockHtml);
}

// The static host rewrites these clean URLs; mirror that for Android's local asset server.
for (const route of ['privacy', 'terms', 'mock-test', 'admin-mock', 'neet-ss-books']) {
  const routeDir = path.join(webDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  const src = fs.existsSync(path.join(webDir, `${route}.html`))
    ? path.join(webDir, `${route}.html`)
    : path.join(root, `${route}.html`);
  fs.copyFileSync(src, path.join(routeDir, 'index.html'));
}

console.log(`Prepared Android web assets in ${path.relative(root, webDir)}.`);
