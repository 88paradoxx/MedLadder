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
  'gtag-init.js', 'analytics-loader.js', 'manifest.json', 'favicon.ico',
  'privacy.html', 'terms.html', 'robots.txt', 'sitemap.xml'
];
const directories = ['assets', 'icons', 'subjects', 'fmge', 'inicet', 'ini-cet', 'neet-pg', 'neet-ss'];

for (const file of files) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(webDir, file));
}

for (const directory of directories) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) {
    fs.cpSync(source, path.join(webDir, directory), { recursive: true });
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
fs.writeFileSync(appHtmlPath, appHtml);

// The static host rewrites these clean policy URLs; mirror that for Android's local asset server.
for (const route of ['privacy', 'terms']) {
  const routeDir = path.join(webDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.copyFileSync(path.join(root, `${route}.html`), path.join(routeDir, 'index.html'));
}

console.log(`Prepared Android web assets in ${path.relative(root, webDir)}.`);
