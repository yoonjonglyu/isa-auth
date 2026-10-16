const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const demoDistDir = path.join(rootDir, 'demo-dist');

console.log('🚀 Deploying Demo to gh-pages branch...');

if (!fs.existsSync(demoDistDir)) {
  console.error('❌ demo-dist directory not found! Run "yarn build:demo" first.');
  process.exit(1);
}

try {
  const remoteUrl = execSync('git config --get remote.origin.url', { cwd: rootDir }).toString().trim();
  console.log(`📡 Remote repository: ${remoteUrl}`);

  // Navigate into demo-dist and publish via git
  const commands = [
    'git init',
    'git checkout -b gh-pages',
    'git add -A',
    'git commit -m "Deploy demo to GitHub Pages"',
    `git remote add origin "${remoteUrl}" || git remote set-url origin "${remoteUrl}"`,
    'git push -f origin gh-pages'
  ];

  for (const cmd of commands) {
    execSync(cmd, { cwd: demoDistDir, stdio: 'inherit' });
  }

  console.log('\n🎉 Successfully pushed demo to gh-pages branch!');
  console.log('🌐 Live Demo URL: https://yoonjonglyu.github.io/isa-auth/');
} catch (error) {
  console.error('❌ Failed to deploy to gh-pages:', error.message);
  process.exit(1);
}
