// scripts/package-helper.js
// Cross-platform replacement for the shell-based package:* scripts.
// Usage: node scripts/package-helper.js <firefox|chromium|edge>

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const target = process.argv[2];
if (!['firefox', 'chromium', 'edge'].includes(target)) {
  console.error('Usage: node scripts/package-helper.js <firefox|chromium|edge>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;
const buildTmp = path.join(rootDir, 'build-tmp');

// 1. Clean and recreate build-tmp
if (fs.existsSync(buildTmp)) fs.rmSync(buildTmp, { recursive: true, force: true });
fs.mkdirSync(buildTmp, { recursive: true });

// 2. Copy dist, LICENSE, CHANGELOG.md, manifest.json
fs.cpSync('dist', path.join(buildTmp, 'dist'), { recursive: true });
fs.cpSync('_locales', path.join(buildTmp, '_locales'), { recursive: true });
fs.copyFileSync(path.join(rootDir, 'LICENSE'), path.join(buildTmp, 'LICENSE'));
fs.copyFileSync(path.join(rootDir, 'CHANGELOG.md'), path.join(buildTmp, 'CHANGELOG.md'));
fs.copyFileSync(path.join(rootDir, 'manifest.json'), path.join(buildTmp, 'manifest.json'));

// 3. Icon handling per target
const iconsDir = path.join(buildTmp, 'dist', 'assets', 'icons');
const edgeIcon = path.join(iconsDir, 'icon_edge.png');

if (target === 'edge') {
  for (const f of ['icon.png', 'icon_48.png', 'icon_96.png']) {
    const p = path.join(iconsDir, f);
    if (fs.existsSync(p)) fs.rmSync(p);
  }
  if (fs.existsSync(edgeIcon)) {
    fs.renameSync(edgeIcon, path.join(iconsDir, 'icon.png'));
  }
} else {
  if (fs.existsSync(edgeIcon)) fs.rmSync(edgeIcon);
}

// 4. Zip using archiver (cross-platform — no shell zip/cd needed)
const artifactDir = path.join(rootDir, 'web-ext-artifacts', target);
fs.mkdirSync(artifactDir, { recursive: true });

const zipName = `${target}-ynt-${version}.zip`;
const zipPath = path.join(artifactDir, zipName);

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('error', (err) => { throw err; });

output.on('close', () => {
  // 5. Clean up build-tmp after zip is fully written
  fs.rmSync(buildTmp, { recursive: true, force: true });
  console.log(`✅ Packaged: web-ext-artifacts/${target}/${zipName}`);
});

archive.pipe(output);
// Add contents of build-tmp directly at the zip root (no extra wrapper folder)
archive.directory(buildTmp, false);
archive.finalize();