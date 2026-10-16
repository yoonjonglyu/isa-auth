const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const demoHtml = path.join(rootDir, 'packages', 'demo', 'index.html');
const distDir = path.join(rootDir, 'packages', 'isa-auth', 'dist');
const outDir = path.join(rootDir, 'demo-dist');
const outDistDir = path.join(outDir, 'dist');

console.log('📦 Preparing Demo site for GitHub Pages...');

// Ensure output directory
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDistDir, { recursive: true });

// Copy index.html
fs.copyFileSync(demoHtml, path.join(outDir, 'index.html'));
console.log('  ✔ Copied index.html');

// Copy dist recursively
fs.cpSync(distDir, outDistDir, { recursive: true });
console.log('  ✔ Copied distribution directory to demo-dist/dist/');

// Create .nojekyll
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
console.log('  ✔ Created .nojekyll');

console.log('✨ Demo artifact ready at demo-dist/');
