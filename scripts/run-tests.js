const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const testSuites = [
  { name: 'Core & ISA-AUTH Integration Suite', file: 'tests/integration.test.js' },
  { name: '@isa-auth/server BFF & Token Exchange Suite', file: 'tests/server.test.js' },
  { name: '@isa-auth/mcp Model Context Protocol Suite', file: 'tests/mcp.test.js' },
];

console.log('🧪 Running Complete ISA-AUTH Test Framework...\n');

let passed = 0;
let failed = 0;

for (const suite of testSuites) {
  console.log(`▶ Starting: ${suite.name}`);
  try {
    execSync(`node ${suite.file}`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✔ Finished: ${suite.name}\n`);
    passed++;
  } catch (error) {
    console.error(`✖ Failed: ${suite.name}\n`);
    failed++;
  }
}

console.log('========================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SUITES PASSED SUCCESSFULLY!');
  process.exit(0);
}
