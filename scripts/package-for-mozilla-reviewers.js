const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'mozilla-source');
const filesToCopy = [
  'manifests',
  'src',
  'scripts',
  'LICENSE',
  'CHANGELOG.md',
  'package.json',
  'package-lock.json',
  'tailwind.config.js',
  'tsconfig.json'
];

// 1. Clean output dir
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir);

// 2. Copy files and folders (pure Node, no shell cp)
for (const item of filesToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(outDir, item);
  if (!fs.existsSync(srcPath)) continue;

  if (fs.lstatSync(srcPath).isDirectory()) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copy only assets/icons
const iconsSrc = path.join(rootDir, 'assets', 'icons');
const iconsDest = path.join(outDir, 'assets', 'icons');
if (fs.existsSync(iconsSrc)) {
  fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
  fs.cpSync(iconsSrc, iconsDest, { recursive: true });
}

// 3. Create README.md spécial reviewers
const readmeContent = `
# Source code for Mozilla reviewers

## Build instructions

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the Firefox extension:
   \`\`\`bash
   npm run package:firefox
   \`\`\`

The built extension will be in \`web-ext-artifacts/firefox/\`.

## Notes

- Only original source files are included.
- No generated or minified files are present.
- All build scripts and configuration are provided.
`;
fs.writeFileSync(path.join(outDir, 'README.md'), readmeContent.trim() + '\n');

// Get version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;

// 4. Ensure output directory exists for the zip
const firefoxArtifactsDir = path.join(rootDir, 'web-ext-artifacts', 'firefox');
fs.mkdirSync(firefoxArtifactsDir, { recursive: true });

// 5. Zip using archiver (cross-platform, no shell zip command needed) with version in the name, inside web-ext-artifacts/firefox/
const zipName = `mozilla-source-ynt-v${version}.zip`;
const zipPath = path.join(firefoxArtifactsDir, zipName);

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('error', (err) => { throw err; });

output.on('close', () => {
  // Clean up the temp folder once zip is written
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log(`Mozilla source package created: ${zipPath}`);
});

archive.pipe(output);
archive.directory(outDir, 'mozilla-source');
archive.finalize();
