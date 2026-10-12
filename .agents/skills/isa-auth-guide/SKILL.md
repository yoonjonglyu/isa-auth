---
name: isa-auth-guide
description: Complete developer and architecture guide for using and extending the isa-auth multi-provider authentication framework, covering OAuth (Google, Apple, Meta, Line, Kakao, Naver), Developer (GitHub, Discord), Web3 (SIWE), Identity (World ID Orb, Passkey WebAuthn), reactive store, Axios/Fetch interceptors, and RBAC/ABAC guards.
---

# ISA-AUTH Comprehensive Guide & Developer Skill

This skill provides full reference, architecture details, and copy-paste recipes for working with the `isa-auth` suite.

---

## 📌 1. Architecture & Provider Taxonomy

`isa-auth` is a **zero-Node-dependency, framework-agnostic client authentication suite** published under the single package `isa-auth`.

### 4 Provider Categories
| Category | Providers | Key Features |
| :--- | :--- | :--- |
| **`social`** | Google, Apple, Meta/Facebook, Kakao, Naver, LINE | Native SDK wrappers, OpenID Connect, OAuth 2.0 PKCE |
| **`developer`** | GitHub, Discord | Developer OAuth 2.0 PKCE, Bot/Server authorization |
| **`web3`** | Ethereum SIWE (EIP-4361) | EIP-1193 wallet detection, `personal_sign` signature |
| **`identity`** | World ID (Orb), Passkey (WebAuthn/FIDO2) | ZK-SNARK Proof of Personhood, Face ID / Touch ID / Windows Hello |

---

## 🚀 2. Code Recipes

### Recipe 0: Multi-Provider All-in-One Configuration (Recommended)
```typescript
import { IsaAuth } from 'isa-auth';

// 1. Initialize multiple providers simultaneously
const auth = new IsaAuth({
  storage: 'memory', // Production security default
  providers: {
    google: { clientId: 'GOOGLE_CLIENT_ID', callbackUrl: 'https://myapp.com/callback' },
    kakao: { clientId: 'KAKAO_JAVASCRIPT_KEY', callbackUrl: 'https://myapp.com/callback' },
    apple: { clientId: 'com.myapp.service', callbackUrl: 'https://myapp.com/callback' },
    github: { clientId: 'GITHUB_CLIENT_ID', callbackUrl: 'https://myapp.com/callback' },
    passkey: { rpName: 'My Enterprise App', rpId: 'myapp.com' },
  },
});

// 2. Trigger individual provider login
await auth.signIn('kakao');
// or
await auth.signIn('google');

// 3. Render buttons: individual or all at once
auth.renderButton('github', document.getElementById('gh-slot'));
auth.renderAllButtons(document.getElementById('social-login-grid'), {
  direction: 'grid', // 'grid' | 'column' | 'row'
  gap: '12px',
});

// 4. Query registered providers
console.log(auth.getRegisteredProviders()); // ['google', 'kakao', 'apple', 'github', 'passkey']
```

### Recipe A: World ID (World Network / Orb Verification)
```typescript
import { IsaAuth } from 'isa-auth';

const worldAuth = new IsaAuth({
  provider: 'world',
  clientId: 'app_staging_your_app_id',
  extraOptions: {
    action: 'vote',
    verificationLevel: 'orb', // 'orb' (Biometric iris scan) or 'device'
    signal: 'user_wallet_0x123',
    onSuccess: (proof) => {
      console.log('ZK Proof generated:', proof.nullifier_hash, proof.proof);
    },
  },
});

await worldAuth.signIn();
const userInfo = await worldAuth.getUserInfo();
// { id: '0x...', isHuman: true, verificationLevel: 'orb', ... }
```

### Recipe B: Passkey (FIDO2 / WebAuthn Biometrics)
```typescript
import { IsaAuth } from 'isa-auth';

const passkeyAuth = new IsaAuth({
  provider: 'passkey',
  extraOptions: {
    rpName: 'My Financial App',
    rpId: window.location.hostname,
    userName: 'alice@example.com',
  },
});

// Authenticate via Face ID / Touch ID / Windows Hello
await passkeyAuth.signIn();

// Register new biometric credential
await passkeyAuth.providerInstance.registerCredential();
```

### Recipe C: Axios Interceptor with Automatic 401 Refresh & Queue
```typescript
import axios from 'axios';
import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({ provider: 'jwt' });
const apiClient = axios.create({ baseURL: 'https://api.example.com' });

// Applies Authorization: Bearer <token> & deduplicated 401 token refresh queue
auth.applyAxiosInterceptor(apiClient, {
  refreshFn: async () => {
    const res = await axios.post('/api/auth/refresh');
    return res.data.accessToken;
  },
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});
```

### Recipe D: Backend Token Exchange Adapter
```typescript
import { IsaAuth, HttpTokenExchangeAdapter } from 'isa-auth';

const auth = new IsaAuth({ provider: 'github' });
const exchange = auth.createTokenExchange('/api/auth/token-exchange');

// 1. Exchange OAuth code for JWT
const tokenRes = await exchange.exchangeOAuthCode('github', 'auth-code-123');
auth.setAccessToken(tokenRes.accessToken);

// 2. Exchange World ID ZK-proof for session
const worldRes = await exchange.exchangeWorldProof(worldProofResult);
auth.setAccessToken(worldRes.accessToken);
```

### Recipe E: Wildcard RBAC / ABAC Guards & Router Redirection
```typescript
import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({ provider: 'jwt' });

// Instant wildcard permission check
const canEdit = auth.can('users:edit'); // Matches 'users:*' or '*'

// Navigation Guard for React Router / Vue Router
const guard = auth.createNavigationGuard({
  requireAuth: true,
  roles: ['ADMIN'],
  roleHierarchy: {
    SUPERUSER: ['ADMIN', 'EDITOR'],
    ADMIN: ['USER'],
  },
  permissions: ['reports:*'],
  redirectToOnUnauthenticated: '/login',
  redirectToOnUnauthorized: '/403',
  onRedirect: (path) => router.push(path),
});
```

### Recipe F: Storage Security & Development Modes
```typescript
import { IsaAuth } from 'isa-auth';

// 1. [PRODUCTION DEFAULT] Zero XSS In-Memory Storage (Recommended for SPA)
const secureAuth = new IsaAuth({
  provider: 'jwt',
  storage: 'memory', // Default! Tokens never touch localStorage.
});

// 2. [PRODUCTION RECOMMENDED] HttpOnly Cookie / BFF Architecture
const cookieAuth = new IsaAuth({
  provider: 'base',
  storage: 'cookie', // CookieSessionStorageAdapter omits client JWT persistence
});

// 3. [LOCAL DEV ONLY] Insecure LocalStorage for F5 Refresh Convenience
const devAuth = new IsaAuth({
  provider: 'google',
  clientId: 'dev-client-id',
  storage: 'dev_insecure_localStorage', // Explicitly warns in console that this is NOT for production!
});
```

---

## 🛠️ 3. Monorepo Build & Test Commands

```bash
# 1. Full Monorepo Build (SWC core compilation + tsup inline bundling)
yarn build   # On Windows: yarn.cmd build

# 2. Run Comprehensive Test Suite (22 automated test cases)
node scratch/test_enhanced_features.js

# 3. Launch Local Demo Playground
yarn demo    # Serves http://localhost:3000
```
