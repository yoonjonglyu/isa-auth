const assert = require('assert');
const { IsaAuthServer, parseSiweMessage, createExpressHandler, createNextApiHandler } = require('../packages/server/dist/index.js');

console.log('=== @isa-auth/server Token Exchange & Verification Tests ===\n');

const server = new IsaAuthServer({
  jwt: {
    secret: 'super-secret-isa-auth-key-1234567890',
    issuer: 'test-issuer',
    expiresInSeconds: 3600,
  },
  providers: {
    google: { clientId: 'test-google-id', clientSecret: 'test-google-secret' },
  },
  worldId: {
    appId: 'app_test_world_id',
  },
});

async function runTests() {
  // Test 1: SIWE Web3 message parsing & exchange
  {
    const domain = 'example.com';
    const address = '0x1234567890123456789012345678901234567890';
    const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in with Ethereum\n\nURI: https://example.com/login\nVersion: 1\nChain ID: 1\nNonce: 987654321\nIssued At: 2026-10-17T00:00:00.000Z`;

    const parsed = parseSiweMessage(message);
    assert.strictEqual(parsed.domain, domain);
    assert.strictEqual(parsed.address, address);
    assert.strictEqual(parsed.chainId, 1);

    const exchangeRes = await server.handleExchange({
      type: 'web3_signature',
      address,
      signature: '0xmocksignature123456',
      message,
      chainId: 1,
    });

    assert(exchangeRes.accessToken, 'Must return an accessToken');
    assert.strictEqual(exchangeRes.tokenType, 'Bearer');
    assert.strictEqual(exchangeRes.user.address, address);
    assert.strictEqual(exchangeRes.user.provider, 'web3');

    // Verify generated JWT
    const decoded = server.verifyToken(exchangeRes.accessToken);
    assert.strictEqual(decoded.sub, address.toLowerCase());
    assert.strictEqual(decoded.iss, 'test-issuer');
    console.log('[PASS] Server - SIWE Web3 message parsing, exchange and JWT verification');
  }

  // Test 2: Passkey assertion exchange
  {
    const clientDataJSON = Buffer.from(JSON.stringify({
      type: 'webauthn.get',
      challenge: 'test-challenge-123',
      origin: 'https://example.com',
    })).toString('base64');

    const passkeyPayload = {
      type: 'passkey_assertion',
      assertion: {
        id: 'mock_credential_id_abc',
        response: {
          clientDataJSON,
          authenticatorData: 'mock_auth_data',
          signature: 'mock_signature',
          userHandle: Buffer.from('user_john_doe').toString('base64'),
        },
      },
      challenge: 'test-challenge-123',
    };

    const passkeyRes = await server.handleExchange(passkeyPayload);
    assert(passkeyRes.accessToken);
    assert.strictEqual(passkeyRes.user.id, 'user_john_doe');
    assert.strictEqual(passkeyRes.user.provider, 'passkey');
    console.log('[PASS] Server - Passkey assertion verification & JWT issuance');
  }

  // Test 3: Express & Next.js handler compatibility
  {
    const expressHandler = createExpressHandler(server);
    let statusCode = 0;
    let jsonResponse = null;

    const mockReq = {
      body: {
        type: 'web3_signature',
        address: '0x9999999999999999999999999999999999999999',
        signature: '0xmock',
        message: 'example.com wants you to sign in with your Ethereum account:\n0x9999999999999999999999999999999999999999\n\nURI: https://example.com\nNonce: 1234\nIssued At: 2026-10-17T00:00:00.000Z',
      },
    };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };

    await expressHandler(mockReq, mockRes);
    assert.strictEqual(statusCode, 200);
    assert(jsonResponse.accessToken);
    console.log('[PASS] Server - Express route handler adapter');

    // Next.js Pages router adapter
    const nextHandler = createNextApiHandler(server);
    let nextStatus = 0;
    let nextJson = null;
    const nextRes = {
      status(code) { nextStatus = code; return this; },
      json(data) { nextJson = data; return this; },
      setHeader() {},
    };
    await nextHandler({ method: 'POST', body: mockReq.body }, nextRes);
    assert.strictEqual(nextStatus, 200);
    assert(nextJson.accessToken);
    console.log('[PASS] Server - Next.js API route handler adapter');
  }

  console.log('\nAll server tests passed successfully!');
}

runTests().catch((err) => {
  console.error('[FAIL] Server test failed:', err);
  process.exit(1);
});
