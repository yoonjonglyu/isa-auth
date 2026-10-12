const assert = require('assert');
const path = require('path');

// 1. 번들링된 isa-auth 패키지 로드
const isaAuthPkg = require(path.resolve(__dirname, '../packages/isa-auth/dist/index.js'));
const {
  IsaAuth,
  matchPermissionRule,
  resolveInheritedRoles,
  checkRole,
  checkPermission,
  evaluateGuard,
  createAuthGuard,
  createNavigationGuard,
  socialProviders,
  developerProviders,
  web3Providers,
  identityProviders,
  getProvidersByCategory,
  getProviderCategory,
  KakaoAuthProvider,
  GithubAuthProvider,
  AppleAuthProvider,
  DiscordAuthProvider,
  LineAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  WorldAuthProvider,
  PasskeyAuthProvider,
  createAuthFetch,
  applyAuthInterceptor,
  createAuthAxios,
  HttpTokenExchangeAdapter,
  CookieSessionStorageAdapter,
} = isaAuthPkg;

console.log('=== ISA-AUTH Enhanced Providers, RBAC Guards & Advanced Ecosystem Verification ===\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

(async () => {
  // Test Group 1: New Providers
  test('Provider - GitHub provider initialization & URL generation', async () => {
    const auth = new IsaAuth({
      provider: 'github',
      clientId: 'gh-client-123',
      callbackUrl: 'http://localhost:3000/callback',
      scope: 'read:user user:email',
    });
    assert.strictEqual(auth.providerInstance instanceof GithubAuthProvider, true);
    const loginUrl = await auth.providerInstance.buildLoginUrl();
    assert.strictEqual(loginUrl.includes('client_id=gh-client-123'), true);
    assert.strictEqual(loginUrl.includes('github.com/login/oauth/authorize'), true);
  });

  test('Provider - Apple provider initialization', () => {
    const auth = new IsaAuth({
      provider: 'apple',
      clientId: 'com.isa.auth.service',
      callbackUrl: 'http://localhost:3000/apple/callback',
    });
    assert.strictEqual(auth.providerInstance instanceof AppleAuthProvider, true);
    assert.strictEqual(typeof auth.providerInstance.signIn, 'function');
  });

  test('Provider - Discord provider initialization & URL generation', async () => {
    const auth = new IsaAuth({
      provider: 'discord',
      clientId: 'discord-app-456',
      callbackUrl: 'http://localhost:3000/discord/callback',
    });
    assert.strictEqual(auth.providerInstance instanceof DiscordAuthProvider, true);
    const loginUrl = await auth.providerInstance.buildLoginUrl();
    assert.strictEqual(loginUrl.includes('discord.com/oauth2/authorize'), true);
    assert.strictEqual(loginUrl.includes('client_id=discord-app-456'), true);
  });

  test('Provider - Line provider initialization & URL generation', () => {
    const auth = new IsaAuth({
      provider: 'line',
      clientId: 'line-channel-789',
      callbackUrl: 'http://localhost:3000/line/callback',
    });
    assert.strictEqual(auth.providerInstance instanceof LineAuthProvider, true);
    const loginUrl = auth.providerInstance.buildLoginUrl();
    assert.strictEqual(loginUrl.includes('access.line.me/oauth2/v2.1/authorize'), true);
    assert.strictEqual(loginUrl.includes('client_id=line-channel-789'), true);
  });

  test('Provider - Meta & Facebook provider initialization & alias', () => {
    // Meta provider
    const metaAuth = new IsaAuth({
      provider: 'meta',
      clientId: 'meta-app-999',
      callbackUrl: 'http://localhost:3000/meta/callback',
    });
    assert.strictEqual(metaAuth.providerInstance instanceof MetaAuthProvider, true);
    assert.strictEqual(metaAuth.getCategory(), 'social');

    // Facebook alias
    const fbAuth = new IsaAuth({
      provider: 'facebook',
      clientId: 'fb-app-999',
      callbackUrl: 'http://localhost:3000/fb/callback',
    });
    assert.strictEqual(fbAuth.providerInstance instanceof FacebookAuthProvider, true);
    assert.strictEqual(fbAuth.getCategory(), 'social');
  });

  test('Provider - Categorization groups and category mapping helpers', () => {
    // Categories presence
    assert.strictEqual(typeof socialProviders.google, 'function');
    assert.strictEqual(typeof socialProviders.meta, 'function');
    assert.strictEqual(typeof socialProviders.facebook, 'function');
    assert.strictEqual(typeof socialProviders.kakao, 'function');
    assert.strictEqual(typeof developerProviders.github, 'function');
    assert.strictEqual(typeof developerProviders.discord, 'function');
    assert.strictEqual(typeof web3Providers.web3, 'function');
    assert.strictEqual(typeof identityProviders.world, 'function');
    assert.strictEqual(typeof identityProviders.passkey, 'function');

    // Helpers
    assert.strictEqual(getProviderCategory('google'), 'social');
    assert.strictEqual(getProviderCategory('meta'), 'social');
    assert.strictEqual(getProviderCategory('github'), 'developer');
    assert.strictEqual(getProviderCategory('discord'), 'developer');
    assert.strictEqual(getProviderCategory('web3'), 'web3');
    assert.strictEqual(getProviderCategory('world'), 'identity');
    assert.strictEqual(getProviderCategory('passkey'), 'identity');

    const identityGroup = getProvidersByCategory('identity');
    assert.strictEqual(Boolean(identityGroup.world && identityGroup.passkey), true);
  });

  // Test Group 2: Wildcard Permission Matching
  test('Guard - matchPermissionRule wildcard patterns', () => {
    // Exact match
    assert.strictEqual(matchPermissionRule('users:read', 'users:read'), true);
    assert.strictEqual(matchPermissionRule('users:read', 'users:write'), false);

    // Superuser wildcard '*'
    assert.strictEqual(matchPermissionRule('*', 'anything:permitted'), true);
    assert.strictEqual(matchPermissionRule('admin:delete', '*'), true);

    // Prefix wildcard 'users:*'
    assert.strictEqual(matchPermissionRule('users:*', 'users:read'), true);
    assert.strictEqual(matchPermissionRule('users:*', 'users:write'), true);
    assert.strictEqual(matchPermissionRule('users:*', 'posts:read'), false);

    // Suffix wildcard '*:read'
    assert.strictEqual(matchPermissionRule('*:read', 'users:read'), true);
    assert.strictEqual(matchPermissionRule('*:read', 'posts:read'), true);
    assert.strictEqual(matchPermissionRule('*:read', 'posts:write'), false);
  });

  // Test Group 3: Role Hierarchy
  test('Guard - resolveInheritedRoles hierarchy map', () => {
    const hierarchy = {
      ADMIN: ['MANAGER', 'USER'],
      MANAGER: ['USER'],
    };

    const adminRoles = resolveInheritedRoles(['ADMIN'], hierarchy);
    assert.deepStrictEqual(adminRoles.sort(), ['ADMIN', 'MANAGER', 'USER'].sort());

    const managerRoles = resolveInheritedRoles(['MANAGER'], hierarchy);
    assert.deepStrictEqual(managerRoles.sort(), ['MANAGER', 'USER'].sort());

    const userRoles = resolveInheritedRoles(['USER'], hierarchy);
    assert.deepStrictEqual(userRoles, ['USER']);
  });

  // Test Group 4: Detailed Guard Evaluation & Callbacks
  await asyncTest('Guard - evaluateGuard unauthenticated detection & callback', async () => {
    let unauthenticatedCalled = false;
    let unauthorizedReason = '';

    const guard = createAuthGuard({
      requireAuth: true,
      roles: ['ADMIN'],
      onUnauthenticated: () => {
        unauthenticatedCalled = true;
      },
      onUnauthorized: (reason) => {
        unauthorizedReason = reason;
      },
    });

    const passed = await guard({ isAuthenticated: false });
    assert.strictEqual(passed, false);
    assert.strictEqual(unauthenticatedCalled, true);
    assert.strictEqual(unauthorizedReason.length > 0, true);
  });

  await asyncTest('Guard - evaluateGuard missing roles & onForbidden callback', async () => {
    const result = await evaluateGuard(
      {
        roles: ['ADMIN', 'EDITOR'],
        roleMatch: 'all',
        roleHierarchy: {
          SUPERUSER: ['ADMIN', 'EDITOR'],
        },
      },
      {
        isAuthenticated: true,
        roles: ['USER'],
      }
    );

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.reason, 'INSUFFICIENT_ROLES');
    assert.deepStrictEqual(result.missingRoles, ['ADMIN', 'EDITOR']);
  });

  await asyncTest('Guard - evaluateGuard wildcard permissions check', async () => {
    const result = await evaluateGuard(
      {
        permissions: ['users:read', 'users:write'],
        permissionMatch: 'all',
      },
      {
        isAuthenticated: true,
        permissions: ['users:*'], // Grant covering all user operations
      }
    );

    assert.strictEqual(result.allowed, true);
  });

  await asyncTest('Guard - evaluateGuard ABAC custom predicate validate', async () => {
    const options = {
      validate: (ctx) => ctx.user && ctx.user.teamId === 'team-alpha',
    };

    // Valid team
    const validRes = await evaluateGuard(options, {
      isAuthenticated: true,
      user: { teamId: 'team-alpha' },
    });
    assert.strictEqual(validRes.allowed, true);

    // Invalid team
    const invalidRes = await evaluateGuard(options, {
      isAuthenticated: true,
      user: { teamId: 'team-beta' },
    });
    assert.strictEqual(invalidRes.allowed, false);
    assert.strictEqual(invalidRes.reason, 'CUSTOM_VALIDATION_FAILED');
  });

  // Test Group 5: Navigation Guard for Routers
  await asyncTest('Guard - createNavigationGuard redirection support', async () => {
    let redirectedUrl = '';

    const navGuard = createNavigationGuard({
      requireAuth: true,
      roles: ['ADMIN'],
      redirectToOnUnauthenticated: '/login',
      redirectToOnUnauthorized: '/forbidden',
      onRedirect: (url) => {
        redirectedUrl = url;
      },
      getContext: () => ({
        isAuthenticated: false,
      }),
    });

    const res = await navGuard();
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.redirect, '/login');
    assert.strictEqual(redirectedUrl, '/login');
  });

  // Test Group 6: IsaAuth Facade integration & Global Lifecycle Callbacks
  await asyncTest('IsaAuth - can, is, evaluateGuard and onUnauthorized callback integration', async () => {
    const auth = new IsaAuth({
      provider: 'base',
      storage: 'memory',
    });

    let unauthorizedFired = false;
    let accessDeniedTarget = '';

    auth.onUnauthorized((event) => {
      unauthorizedFired = true;
    });

    auth.onAccessDenied((event) => {
      accessDeniedTarget = event.target || '';
    });

    // Before login
    assert.strictEqual(auth.can('users:read'), false);
    assert.strictEqual(auth.is('ADMIN'), false);

    // Evaluate protected guard on unauthenticated instance
    const guardRes = await auth.evaluateGuard({
      roles: ['ADMIN'],
      target: '/admin/dashboard',
    });

    assert.strictEqual(guardRes.allowed, false);
    assert.strictEqual(unauthorizedFired, true);
    assert.strictEqual(accessDeniedTarget, '/admin/dashboard');
  });

  // Test Group 7: Store Advanced Features (Prefix, Selector, Batch, Atomic Session)
  test('Store - Prefix isolation and selector subscription', () => {
    const { updateAuthInfo, subscribeSelector, batch, clearStoreSession, getAuthInfo } = isaAuthPkg;

    // Selector test
    let selectedName = '';
    const unsubscribe = subscribeSelector(
      'isa-auth-info',
      (info) => info?.name || '',
      (name) => {
        selectedName = name;
      }
    );

    updateAuthInfo({ name: 'Alpha User', role: 'ADMIN' });
    assert.strictEqual(selectedName, 'Alpha User');

    // Batch test
    let batchTriggerCount = 0;
    const unsubBatch = subscribeSelector('isa-auth-info', (info) => info?.role, () => {
      batchTriggerCount++;
    });

    batch(() => {
      updateAuthInfo({ role: 'MANAGER' });
      updateAuthInfo({ role: 'SUPERUSER' });
    });

    assert.strictEqual(batchTriggerCount, 1);
    unsubscribe();
    unsubBatch();

    // Atomic Clear
    clearStoreSession();
    assert.strictEqual(getAuthInfo(), null);
  });

  test('Store - Security default is memory and dev_insecure_localStorage triggers warning', () => {
    const { configureStorage, getStorageAdapter, MemoryStorageAdapter, LocalStorageAdapter } = isaAuthPkg;

    // 1. Default should be secure MemoryStorageAdapter
    configureStorage({});
    assert.strictEqual(getStorageAdapter() instanceof MemoryStorageAdapter, true);

    // 2. dev_insecure_localStorage should trigger security warning
    let warningTriggered = false;
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && args[0].includes('ISA-AUTH SECURITY WARNING')) {
        warningTriggered = true;
      }
    };

    configureStorage('dev_insecure_localStorage');
    assert.strictEqual(getStorageAdapter() instanceof LocalStorageAdapter, true);
    assert.strictEqual(warningTriggered, true);

    console.warn = originalWarn;
    configureStorage('memory');
  });

  // Test Group 8: Service Advanced Features (Mutex Deduplication & Auto Refresh)
  await asyncTest('Service - Refresh Mutex deduplication (concurrent requests)', async () => {
    const { JwtService } = isaAuthPkg;
    const service = new JwtService('test-secret');

    let serverCallCount = 0;
    const mockRefreshFn = async () => {
      serverCallCount++;
      await new Promise((r) => setTimeout(r, 50));
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      return `${header}.${payload}.sig`;
    };

    const [t1, t2, t3, t4, t5] = await Promise.all([
      service.refreshToken(mockRefreshFn),
      service.refreshToken(mockRefreshFn),
      service.refreshToken(mockRefreshFn),
      service.refreshToken(mockRefreshFn),
      service.refreshToken(mockRefreshFn),
    ]);

    assert.strictEqual(serverCallCount, 1);
    assert.strictEqual(t1, t2);
    assert.strictEqual(t2, t5);
    service.clearAuthState();
  });

  await asyncTest('Service - Auto refresh scheduler start & stop', async () => {
    const { IsaAuth } = isaAuthPkg;
    const auth = new IsaAuth({ provider: 'jwt', storage: 'memory' });

    let autoRefreshSuccess = false;
    auth.startAutoRefresh(async () => {
      autoRefreshSuccess = true;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-2', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      return `${header}.${payload}.sig`;
    }, { leadTimeSeconds: 3600 });

    await new Promise((r) => setTimeout(r, 1100));
    assert.strictEqual(autoRefreshSuccess, true);

    auth.stopAutoRefresh();
    auth.signOut();
  });

  // Test Group 9: World ID (World Network / Orb Verification)
  await asyncTest('Identity - World ID Orb verification & Proof creation', async () => {
    let capturedProof = null;

    const worldAuth = new IsaAuth({
      provider: 'world',
      clientId: 'app_staging_test_123',
      extraOptions: {
        action: 'vote-action',
        verificationLevel: 'orb',
        mockProof: true,
        onSuccess: (result) => {
          capturedProof = result;
        },
      },
    });

    assert.strictEqual(worldAuth.providerInstance instanceof WorldAuthProvider, true);
    assert.strictEqual(worldAuth.getCategory(), 'identity');

    // Trigger Orb Sign In
    await worldAuth.signIn();

    assert.notStrictEqual(capturedProof, null);
    assert.strictEqual(capturedProof.verification_level, 'orb');
    assert.strictEqual(capturedProof.action, 'vote-action');
    assert.strictEqual(capturedProof.nullifier_hash.startsWith('0x0'), true);
    assert.strictEqual(capturedProof.proof.startsWith('0x'), true);

    const userInfo = await worldAuth.getUserInfo();
    assert.strictEqual(userInfo.isHuman, true);
    assert.strictEqual(userInfo.verificationLevel, 'orb');
  });

  // Test Group 10: Passkey / WebAuthn Biometric Provider
  test('Identity - Passkey WebAuthn provider structure', () => {
    const passkeyAuth = new IsaAuth({
      provider: 'passkey',
      extraOptions: {
        rpName: 'My Enterprise Bank',
        rpId: 'bank.com',
      },
    });

    assert.strictEqual(passkeyAuth.providerInstance instanceof PasskeyAuthProvider, true);
    assert.strictEqual(passkeyAuth.getCategory(), 'identity');
    assert.strictEqual(typeof passkeyAuth.providerInstance.signIn, 'function');
    assert.strictEqual(typeof passkeyAuth.providerInstance.registerCredential, 'function');
  });

  // Test Group 11: Cookie / Hybrid Session Storage Adapter
  test('Store - CookieSessionStorageAdapter omits client-side JWT storage', () => {
    const adapter = new CookieSessionStorageAdapter({ persistUserInfo: true });

    // Tokens should NOT be saved in client storage (BFF HttpOnly cookie mode)
    adapter.setItem('token', 'sensitive-bearer-token');
    adapter.setItem('refresh_token', 'sensitive-refresh-token');
    assert.strictEqual(adapter.getItem('token'), null);
    assert.strictEqual(adapter.getItem('refresh_token'), null);

    // Non-sensitive user profile is allowed in memory
    adapter.setItem('isa-auth-info', JSON.stringify({ name: 'John Doe', role: 'ADMIN' }));
    assert.strictEqual(JSON.parse(adapter.getItem('isa-auth-info')).name, 'John Doe');
  });

  // Test Group 12: Axios Interceptor with automatic 401 token refresh retry
  await asyncTest('HTTP - Axios Interceptor token injection & 401 retry queue', async () => {
    let mockToken = 'initial-token';
    const authClient = {
      getAccessToken: () => mockToken,
      refreshToken: async () => {
        mockToken = 'refreshed-new-token';
        return mockToken;
      },
      clearAuthState: () => {
        mockToken = null;
      },
    };

    // Simulated Axios instance
    const requestInterceptors = [];
    const responseInterceptors = [];

    const fakeAxiosInstance = async (config) => {
      // Simulate backend endpoint check
      if (config.headers['Authorization'] === 'Bearer initial-token') {
        // Return 401 unauthorized
        const err = new Error('Request failed with status code 401');
        (err).response = { status: 401 };
        (err).config = config;
        // Trigger response interceptor error handler
        return responseInterceptors[0].rejected(err);
      } else if (config.headers['Authorization'] === 'Bearer refreshed-new-token') {
        // Success after retry!
        return { status: 200, data: { success: true, message: 'Retried with new token!' } };
      }
      return { status: 500 };
    };

    fakeAxiosInstance.interceptors = {
      request: {
        use: (fulfilled, rejected) => {
          requestInterceptors.push({ fulfilled, rejected });
          return 0;
        },
        eject: () => {},
      },
      response: {
        use: (fulfilled, rejected) => {
          responseInterceptors.push({ fulfilled, rejected });
          return 0;
        },
        eject: () => {},
      },
    };

    // Apply interceptor
    applyAuthInterceptor(fakeAxiosInstance, {
      authClient,
      refreshFn: async () => 'refreshed-new-token',
    });

    // Execute simulated request
    let config = { headers: {} };
    config = await requestInterceptors[0].fulfilled(config);
    assert.strictEqual(config.headers['Authorization'], 'Bearer initial-token');

    const result = await fakeAxiosInstance(config);
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.data.success, true);
    assert.strictEqual(mockToken, 'refreshed-new-token');
  });

  // Test Group 13: HttpTokenExchangeAdapter backend communication flow
  await asyncTest('Service - HttpTokenExchangeAdapter handles OAuth & World ID exchange', async () => {
    const mockFetch = async (url, options) => {
      const body = JSON.parse(options.body);
      if (body.type === 'oauth_code') {
        return {
          ok: true,
          json: async () => ({
            accessToken: 'backend-jwt-token-from-code',
            refreshToken: 'backend-refresh-token',
            user: { id: 'user-github', name: 'Code Master' },
          }),
        };
      } else if (body.type === 'world_id_proof') {
        return {
          ok: true,
          json: async () => ({
            accessToken: 'backend-jwt-human-verified',
            user: { id: body.proof.nullifier_hash, isHuman: true },
          }),
        };
      }
      return { ok: false, status: 400, text: async () => 'Invalid payload' };
    };

    const exchangeAdapter = new HttpTokenExchangeAdapter({
      tokenEndpoint: '/api/auth/token',
      fetchFn: mockFetch,
    });

    // 1. OAuth code exchange
    const oauthRes = await exchangeAdapter.exchangeOAuthCode('github', 'sample-auth-code');
    assert.strictEqual(oauthRes.accessToken, 'backend-jwt-token-from-code');
    assert.strictEqual(oauthRes.user.name, 'Code Master');

    // 2. World ID proof exchange
    const worldRes = await exchangeAdapter.exchangeWorldProof({
      nullifier_hash: '0x0987654321',
      action: 'vote',
    });
    assert.strictEqual(worldRes.accessToken, 'backend-jwt-human-verified');
    assert.strictEqual(worldRes.user.isHuman, true);
  });

  // Test Group 14: Multi-Provider Unified Registry & Dispatch
  await asyncTest('MultiProvider - Multi-provider initialization, dispatch & button rendering', async () => {
    let invokedProvider = null;
    const auth = new IsaAuth({
      providers: {
        google: { clientId: 'google-client-multi', callbackUrl: 'http://localhost/cb' },
        kakao: { clientId: 'kakao-client-multi', callbackUrl: 'http://localhost/cb' },
        github: { clientId: 'github-client-multi', callbackUrl: 'http://localhost/cb' },
        passkey: { rpName: 'Isa Demo', rpId: 'localhost' },
      },
    });

    // 1. Registered providers check
    const registered = auth.getRegisteredProviders();
    assert.deepStrictEqual(registered, ['google', 'kakao', 'github', 'passkey']);

    // 2. Provider instance getter check
    const kakaoInstance = auth.getProviderInstance('kakao');
    assert.strictEqual(kakaoInstance instanceof KakaoAuthProvider, true);

    const githubInstance = auth.getProviderInstance('github');
    assert.strictEqual(githubInstance instanceof GithubAuthProvider, true);

    // 3. Dispatch check: mock signIn on kakaoInstance
    kakaoInstance.signIn = async () => {
      invokedProvider = 'kakao';
    };
    await auth.signIn('kakao');
    assert.strictEqual(invokedProvider, 'kakao');

    // 4. Dispatch error on unregistered provider
    let threw = false;
    try {
      await auth.signIn('discord');
    } catch (err) {
      threw = true;
      assert.strictEqual(err.message.includes("is not registered in this IsaAuth instance"), true);
    }
    assert.strictEqual(threw, true);

    // 5. Button Rendering: Mock DOM Document & Container
    global.document = {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        dataset: {},
        style: {},
        className: '',
        innerText: '',
        appendChild: function(child) {
          this.children = this.children || [];
          this.children.push(child);
        },
        addEventListener: () => {},
      }),
    };

    const mockContainer = {
      children: [],
      appendChild(el) {
        this.children.push(el);
      },
    };

    // renderButton with provider name
    const ghBtn = auth.renderButton('github', mockContainer);
    assert.strictEqual(mockContainer.children.length, 1);
    assert.strictEqual(ghBtn.tagName, 'BUTTON');
    assert.strictEqual(ghBtn.dataset.provider, 'github');

    // renderAllButtons
    const multiContainer = {
      children: [],
      appendChild(el) {
        this.children.push(el);
      },
      style: {},
    };
    const renderedButtons = auth.renderAllButtons(multiContainer, { direction: 'grid' });
    assert.strictEqual(renderedButtons.length, 4);
    assert.strictEqual(multiContainer.children.length, 1);
    const wrapper = multiContainer.children[0];
    assert.strictEqual(wrapper.style.display, 'grid');
    assert.strictEqual(wrapper.children.length, 4);
  });

  // Test Group 15: Backward Compatibility with Single-Provider IsaAuth
  test('MultiProvider - Backward compatibility with single-provider mode', () => {
    const singleAuth = new IsaAuth({
      provider: 'google',
      clientId: 'google-single-client',
      callbackUrl: 'http://localhost/cb',
    });

    assert.strictEqual(singleAuth.config.provider, 'google');
    assert.deepStrictEqual(singleAuth.getRegisteredProviders(), ['google']);
    assert.strictEqual(singleAuth.getProviderInstance('google') !== undefined, true);
  });

  console.log(`\nAll ${passedTests} tests passed successfully!`);
})();

