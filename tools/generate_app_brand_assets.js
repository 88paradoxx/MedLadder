const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const uploadedSource = 'C:/Users/Dell/.gemini/antigravity/brain/2dd5fa5b-5346-4b52-bab1-50639d878790/.user_uploaded/media_1791310114937.png';
const brandStoreDir = path.join(rootDir, 'tools', 'brand-assets');
const assetsDir = path.join(rootDir, 'assets');
const iconsDir = path.join(rootDir, 'icons');
const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

async function run() {
  console.log('--- Generating Highly Optimized MedLadder Brand Assets ---');

  if (!fs.existsSync(brandStoreDir)) fs.mkdirSync(brandStoreDir, { recursive: true });
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  // 1. Save master source image permanently in tools/brand-assets/ (NOT inside assets/ to prevent APK bloat)
  const masterSource = path.join(brandStoreDir, 'splash-master.png');
  fs.copyFileSync(uploadedSource, masterSource);
  console.log('Preserved master source at:', masterSource);

  // Clean any old heavy splash files out of assets/ so they don't get copied into APK www
  ['splash-source.png', 'splash.png'].forEach(f => {
    const p = path.join(assetsDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  // 2. Extract emblem icon (mortarboard + M ladder)
  const masterIconBuffer = await sharp(masterSource)
    .extract({ left: 161, top: 105, width: 360, height: 360 })
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  // Full logo (emblem + MedLadder text)
  const masterFullLogoBuffer = await sharp(masterSource)
    .extract({ left: 110, top: 105, width: 462, height: 440 })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();

  await sharp(masterFullLogoBuffer).toFile(path.join(assetsDir, 'logo-full.png'));
  console.log('Generated assets/logo-full.png');

  // Squircle Mask SVG for 512x512
  const squircleSvg = Buffer.from(
    '<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="#fff"/>' +
    '</svg>'
  );

  const squircleIconBuffer = await sharp(masterIconBuffer)
    .composite([{ input: squircleSvg, blend: 'dest-in' }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();

  const roundSvg = Buffer.from(
    '<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="256" cy="256" r="256" fill="#fff"/>' +
    '</svg>'
  );

  const roundIconBuffer = await sharp(masterIconBuffer)
    .composite([{ input: roundSvg, blend: 'dest-in' }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();

  // 3. Generate PWA Icons in icons/
  const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of pwaSizes) {
    await sharp(squircleIconBuffer)
      .resize(size, size, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, palette: true, quality: 88 })
      .toFile(path.join(iconsDir, `icon-${size}.png`));

    if ([192, 512].includes(size)) {
      await sharp(masterIconBuffer)
        .resize(size, size, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 9, palette: true, quality: 88 })
        .toFile(path.join(iconsDir, `icon-${size}-maskable.png`));
    }
  }

  await sharp(squircleIconBuffer).toFile(path.join(assetsDir, 'logo.png'));
  await sharp(masterIconBuffer).resize(64, 64).toFile(path.join(rootDir, 'favicon.ico'));
  console.log('Generated Web & PWA icons');

  // 4. Generate Android Launcher Icons (mipmap-*)
  const androidMipmaps = [
    { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
    { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
    { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
    { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
    { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
  ];

  for (const m of androidMipmaps) {
    const targetDir = path.join(androidResDir, m.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    await sharp(squircleIconBuffer)
      .resize(m.launcher, m.launcher, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    await sharp(roundIconBuffer)
      .resize(m.launcher, m.launcher, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    const fgEmblemSize = Math.round(m.foreground * 0.72);
    const emblemResized = await sharp(masterIconBuffer)
      .resize(fgEmblemSize, fgEmblemSize, { kernel: sharp.kernel.lanczos3 })
      .toBuffer();

    const padLeft = Math.floor((m.foreground - fgEmblemSize) / 2);
    const padTop = Math.floor((m.foreground - fgEmblemSize) / 2);

    await sharp({
      create: {
        width: m.foreground,
        height: m.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: emblemResized, left: padLeft, top: padTop }])
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
  }
  console.log('Generated Android Launcher Mipmap icons');

  // 5. Generate Highly Optimized Android Splash Screens (Quantized PNG: ~75% smaller, identical visual quality)
  const portraitSplashes = [
    { path: 'drawable/splash.png', width: 720, height: 1280 }, // Lightweight fallback
    { path: 'drawable-port-xxxhdpi/splash.png', width: 1280, height: 1920 },
    { path: 'drawable-port-xxhdpi/splash.png', width: 960, height: 1600 },
    { path: 'drawable-port-xhdpi/splash.png', width: 720, height: 1280 },
    { path: 'drawable-port-hdpi/splash.png', width: 480, height: 800 },
    { path: 'drawable-port-mdpi/splash.png', width: 320, height: 480 },
  ];

  for (const s of portraitSplashes) {
    const fullPath = path.join(androidResDir, s.path);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });

    await sharp(masterSource)
      .resize(s.width, s.height, { fit: 'cover', position: 'center', kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9, palette: true, quality: 85 })
      .toFile(fullPath);
  }
  console.log('Generated optimized portrait splash screens');

  // Landscape Splash Screens
  const landscapeSplashes = [
    { path: 'drawable-land-xxxhdpi/splash.png', width: 1920, height: 1280 },
    { path: 'drawable-land-xxhdpi/splash.png', width: 1600, height: 960 },
    { path: 'drawable-land-xhdpi/splash.png', width: 1280, height: 720 },
    { path: 'drawable-land-hdpi/splash.png', width: 800, height: 480 },
    { path: 'drawable-land-mdpi/splash.png', width: 480, height: 320 },
  ];

  for (const s of landscapeSplashes) {
    const fullPath = path.join(androidResDir, s.path);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });

    const bgBuffer = await sharp(masterSource)
      .resize(s.width, s.height, { fit: 'cover' })
      .blur(35)
      .toBuffer();

    const fgWidth = Math.round(s.height * (682 / 1024));
    const fgBuffer = await sharp(masterSource)
      .resize(fgWidth, s.height, { fit: 'cover' })
      .toBuffer();

    const left = Math.floor((s.width - fgWidth) / 2);

    await sharp(bgBuffer)
      .composite([{ input: fgBuffer, left, top: 0 }])
      .png({ compressionLevel: 9, palette: true, quality: 85 })
      .toFile(fullPath);
  }
  console.log('Generated optimized landscape splash screens');
  console.log('--- Brand Assets Optimized & Saved ---');
}

run().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
