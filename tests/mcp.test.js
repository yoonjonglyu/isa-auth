const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');

console.log('=== @isa-auth/mcp Model Context Protocol Server Verification ===\n');

const mcpScript = path.join(__dirname, '../packages/mcp/dist/index.js');

// Spawn MCP server child process over stdio
const mcp = spawn('node', [mcpScript], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let messageId = 1;
const pendingRequests = new Map();
let buffer = '';

mcp.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep unfinished tail

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pendingRequests.has(msg.id)) {
        const resolve = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        resolve(msg);
      }
    } catch {
      // ignore non-json log lines
    }
  }
});

function sendRequest(method, params = {}) {
  return new Promise((resolve) => {
    const id = messageId++;
    pendingRequests.set(id, resolve);
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }) + '\n';
    mcp.stdin.write(payload);
  });
}

async function runMcpTests() {
  // 1. Initialize
  const initRes = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  });
  assert(initRes.result, 'Init response must exist');
  console.log('[PASS] MCP - Server handshake & initialize successful');

  // 2. List Tools
  const toolsRes = await sendRequest('tools/list');
  assert(toolsRes.result.tools.length >= 4, 'Must register at least 4 tools');
  const toolNames = toolsRes.result.tools.map(t => t.name);
  assert(toolNames.includes('isa_check_permission'));
  assert(toolNames.includes('isa_inspect_jwt'));
  assert(toolNames.includes('isa_verify_siwe'));
  assert(toolNames.includes('isa_scaffold_provider'));
  console.log(`[PASS] MCP - tools/list returned ${toolNames.length} tools: ${toolNames.join(', ')}`);

  // 3. Call Tool: isa_check_permission (Wildcard RBAC)
  const rbacRes = await sendRequest('tools/call', {
    name: 'isa_check_permission',
    arguments: {
      userRoles: ['DEV'],
      userPermissions: ['users:*', 'reports:read'],
      requiredRule: 'users:delete',
    },
  });
  const rbacData = JSON.parse(rbacRes.result.content[0].text);
  assert.strictEqual(rbacData.granted, true);
  assert.strictEqual(rbacData.matchedPattern, 'users:*');
  console.log('[PASS] MCP - isa_check_permission wildcard RBAC evaluation');

  // 4. Call Tool: isa_scaffold_provider
  const scaffoldRes = await sendRequest('tools/call', {
    name: 'isa_scaffold_provider',
    arguments: {
      provider: 'kakao',
      storage: 'cookie',
    },
  });
  const scaffoldData = JSON.parse(scaffoldRes.result.content[0].text);
  assert.strictEqual(scaffoldData.provider, 'kakao');
  assert.strictEqual(scaffoldData.requiredEnv, 'VITE_KAKAO_CLIENT_ID');
  assert(scaffoldData.codeSnippet.includes("signIn('kakao')"));
  console.log('[PASS] MCP - isa_scaffold_provider generated setup code & .env keys');

  // 5. Call Tool: isa_verify_siwe
  const address = '0x1111111111111111111111111111111111111111';
  const siweMsg = `myapp.com wants you to sign in with your Ethereum account:\n${address}\n\nSign in with Ethereum\n\nURI: https://myapp.com\nNonce: 12345\nIssued At: 2026-10-17T00:00:00.000Z`;
  const siweRes = await sendRequest('tools/call', {
    name: 'isa_verify_siwe',
    arguments: {
      message: siweMsg,
      expectedAddress: address,
    },
  });
  const siweData = JSON.parse(siweRes.result.content[0].text);
  assert.strictEqual(siweData.valid, true);
  assert.strictEqual(siweData.parsed.domain, 'myapp.com');
  console.log('[PASS] MCP - isa_verify_siwe parsed domain, address and nonce');

  console.log('\nAll MCP tests passed successfully!');
  mcp.kill();
  process.exit(0);
}

runMcpTests().catch((err) => {
  console.error('[FAIL] MCP test failed:', err);
  if (mcp) mcp.kill();
  process.exit(1);
});
