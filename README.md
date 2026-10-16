# 🚀 ISA AUTH

> **A Unified, Framework-Agnostic Frontend Authentication Suite**  
> Supporting Multi-Provider OAuth (Google, Apple, Meta, Line, Kakao, Naver), Developer (GitHub, Discord), Web3 (SIWE), Identity (World ID Orb, Passkey WebAuthn), Reactive Store, Axios/Fetch Interceptors, and RBAC/ABAC Guards.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![SWC](https://img.shields.io/badge/Compiler-SWC-orange.svg)](https://swc.rs/)
[![Bundle Size](https://img.shields.io/badge/Zero_Node_Dependencies-Web_Crypto-green.svg)](https://w3c.github.io/webcrypto/)

---

## 🌟 Why ISA AUTH?

Modern web applications frequently require diverse authentication methods — from global platforms (Google, Apple, Meta) and local portals (Kakao, Naver, Line) to developer communities (GitHub, Discord), decentralized Web3 wallets (SIWE), and next-generation biometric/identity systems (**World ID Orb & Passkey**).

**ISA AUTH** provides an all-in-one, frontend-centric architecture that is:

- **Framework-Agnostic**: Works seamlessly across Vanilla JS, React, Vue, Svelte, or Web Components.
- **Zero Node.js Dependencies**: Pure browser-safe cryptographic & JWT utilities with zero Node runtime bloat.
- **Categorized Provider Taxonomy**: Organized into `social`, `developer`, `web3`, and `identity` domains.
- **Next-Gen Identity & Biometrics**: Native support for **World ID (Orb Proof-of-Personhood)** and **Passkey (FIDO2 WebAuthn)**.
- **Enterprise-Ready RBAC/ABAC**: Wildcard permission matching (`users:*`), role hierarchy inheritance, and router navigation guards.
- **HTTP Interceptors (Axios & Fetch)**: Auto `Authorization: Bearer <token>` injection and deduplicated 401 refresh queues.
- **Token Exchange Standard**: Standardized adapter for exchanging OAuth codes, World ID proofs, and Passkey assertions with backend APIs.
- **Flexible Storage Modes**: Multi-tab synchronization, prefix isolation, and **HttpOnly Cookie / Hybrid BFF mode**.

---

## 📦 Installation

```bash
npm install isa-auth
# or
yarn add isa-auth
# or
pnpm add isa-auth
```

---

## 🏛️ Architecture & Provider Taxonomy

```
[UI Layer]           Vanilla DOM / React / Vue / Web Component (<isa-auth-button>)
                          │
[Unified Facade]     IsaAuth (packages/isa-auth)
                          │
           ┌──────────────┼──────────────┬──────────────┐
           ▼              ▼              ▼              ▼
     [Providers]      [Service]       [Store]       [Guards & HTTP]
     ├─ Social        - JwtService    - Memory      - createAuthGuard (RBAC/ABAC)
     │  (Google, Apple,- BaseService   - Local       - Wildcard & Hierarchy
     │   Meta/FB,     - TokenExchange - Session     - Navigation Guard
     │   Kakao, Naver,- AutoRefresh   - Cookie      - onUnauthorized Hook
     │   LINE)        - PKCE Utils    - Tab Sync    - createAuthFetch (Auto 401)
     ├─ Developer                                   - applyAuthInterceptor (Axios)
     │  (GitHub, Discord)
     ├─ Web3
     │  (Ethereum SIWE)
     └─ Identity
        (World ID Orb, Passkey FIDO2)
```

| Category | Providers | Key Features |
| :--- | :--- | :--- |
| **`social`** | Google, Apple, Meta/Facebook, Kakao, Naver, LINE | Native SDK wrappers, OpenID Connect, OAuth 2.0 PKCE |
| **`developer`** | GitHub, Discord | Developer OAuth 2.0 PKCE, Bot/Server authorization |
| **`web3`** | Ethereum SIWE (EIP-4361) | EIP-1193 wallet detection, `personal_sign` signature |
| **`identity`** | World ID (Orb), Passkey (WebAuthn/FIDO2) | ZK-SNARK Proof of Personhood, Face ID / Touch ID / Windows Hello |

---

## 🚀 Quick Start Recipes

> 💡 **Developer Keys Setup**: Need help obtaining Client IDs, API Keys or configuring Redirect URIs? Check out our complete [Provider Environment Setup Guide](docs/ENV_SETUP.md).

### 1. Multi-Provider All-in-One Configuration (Recommended)

Manage multiple social logins, developer platforms, and Web3/Passkey authentication simultaneously in a single application instance:

```typescript
import { IsaAuth } from 'isa-auth';

// 1. Initialize with multiple providers at once
const auth = new IsaAuth({
  storage: 'memory', // Production security default
  providers: {
    google: { clientId: 'GOOGLE_CLIENT_ID', callbackUrl: 'https://myapp.com/callback' },
    kakao: { clientId: 'KAKAO_JAVASCRIPT_KEY', callbackUrl: 'https://myapp.com/callback' },
    apple: { clientId: 'com.myapp.service', callbackUrl: 'https://myapp.com/callback' },
    github: { clientId: 'GITHUB_CLIENT_ID', callbackUrl: 'https://myapp.com/callback' },
    passkey: { rpName: 'My App', rpId: 'myapp.com' },
  },
});

// 2-A. Trigger a specific provider login programmatically
await auth.signIn('kakao');
// or
await auth.signIn('google');

// 2-B. Render individual provider button
auth.renderButton('github', document.getElementById('github-btn-slot'));

// 2-C. Render all buttons at once with customizable layout (grid / column / row)
auth.renderAllButtons(document.getElementById('social-login-container'), {
  direction: 'grid', // 'grid' | 'column' | 'row'
  gap: '12px',
});

// 3. Inspect registered providers
console.log(auth.getRegisteredProviders()); // ['google', 'kakao', 'apple', 'github', 'passkey']
```

---

### 1-B. Single-Provider Configuration (Legacy & Simple Apps)

```typescript
import { IsaAuth } from 'isa-auth';

// Initialize with a single provider
const auth = new IsaAuth({
  provider: 'google', // 'google' | 'apple' | 'meta' | 'github' | 'discord' | 'web3' | 'world' | 'passkey'
  clientId: 'YOUR_CLIENT_ID',
  callbackUrl: 'https://myapp.com/auth/callback',
  storage: 'memory',
  storagePrefix: 'myapp',
});

// Render button to a DOM container
auth.renderButton(document.getElementById('login-container'));

// Listen to authentication changes
auth.subscribe((isAuthenticated) => {
  if (isAuthenticated) {
    console.log('User Profile:', auth.getUserInfo());
    console.log('Access Token:', auth.getAccessToken());
  }
});
```

---

### 2. 🌐 World ID (World Network / Orb Verification)

Verify unique humanness using **World ID Orb** Proof-of-Personhood:

```typescript
import { IsaAuth } from 'isa-auth';

const worldAuth = new IsaAuth({
  provider: 'world',
  clientId: 'app_staging_your_app_id',
  extraOptions: {
    action: 'vote',
    verificationLevel: 'orb', // 'orb' (Biometric iris scan) or 'device'
    signal: 'user_wallet_address',
    onSuccess: (proof) => {
      console.log('Proof nullifier:', proof.nullifier_hash);
      console.log('ZK-SNARK proof:', proof.proof);
    },
  },
});

await worldAuth.signIn();
const user = await worldAuth.getUserInfo();
console.log(user.isHuman); // true
```

---

### 3. 🔑 Passkey (FIDO2 / WebAuthn Biometrics)

Seamless passwordless authentication via **Face ID, Touch ID, or Windows Hello**:

```typescript
import { IsaAuth } from 'isa-auth';

const passkeyAuth = new IsaAuth({
  provider: 'passkey',
  extraOptions: {
    rpName: 'My Enterprise Bank',
    userName: 'alice@example.com',
  },
});

// Authenticate with device biometrics
await passkeyAuth.signIn();

// Register a new passkey credential
await passkeyAuth.providerInstance.registerCredential();
```

---

### 4. 🔄 HTTP Interceptors (Axios & Fetch) with 401 Auto-Retry

Automatically attaches `Authorization: Bearer <token>` and queues concurrent requests while refreshing expired tokens:

#### Axios Interceptor:
```typescript
import axios from 'axios';
import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({ provider: 'jwt' });
const apiClient = axios.create({ baseURL: 'https://api.example.com' });

// Applies request/response interceptors to Axios
auth.applyAxiosInterceptor(apiClient, {
  refreshFn: async () => {
    const res = await axios.post('/api/auth/refresh');
    return res.data.accessToken;
  },
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});

// All requests now have automatic Bearer token injection and 401 recovery
const response = await apiClient.get('/users/me');
```

#### Fetch Interceptor:
```typescript
const authFetch = auth.createFetch({
  baseUrl: 'https://api.example.com',
  refreshFn: async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const data = await res.json();
    return data.accessToken;
  },
});

const res = await authFetch('/protected/data');
```

---

### 5. 🛡️ Advanced RBAC/ABAC Guards & Navigation Guards

Supports **wildcard permission rules** (`users:*`, `*:read`, `*`) and **hierarchical role inheritance**:

```typescript
import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({ provider: 'jwt' });

// Instant wildcard check
auth.can('users:read');       // true if user has 'users:*' or '*'
auth.is('ADMIN');             // role check

// Navigation Guard for React Router / Vue Router
const navGuard = auth.createNavigationGuard({
  requireAuth: true,
  roles: ['ADMIN'],
  roleHierarchy: {
    SUPERUSER: ['ADMIN', 'MANAGER'],
    ADMIN: ['USER'],
  },
  permissions: ['reports:read'],
  redirectToOnUnauthenticated: '/login',
  redirectToOnUnauthorized: '/forbidden',
  onRedirect: (path) => router.push(path),
});

// Use inside router beforeEach hook
const result = await navGuard();
if (!result.allowed) {
  console.warn('Denied reason:', result.reason);
}
```

---

### 6. 🔌 Backend Token Exchange Adapter

Standardized bridge for exchanging OAuth authorization codes, World ID proofs, and Passkey assertions with your backend API:

```typescript
import { IsaAuth } from 'isa-auth';

const auth = new IsaAuth({ provider: 'github' });
const exchange = auth.createTokenExchange('/api/auth/token-exchange');

// 1. Exchange OAuth code for backend JWT
const tokenRes = await exchange.exchangeOAuthCode('github', 'oauth_code_123');
auth.setAccessToken(tokenRes.accessToken);

// 2. Exchange World ID ZK-Proof for backend session
const worldRes = await exchange.exchangeWorldProof(worldProof);
auth.setAccessToken(worldRes.accessToken);
```

---

### 7. 🛡️ Storage Modes: Security-First Defaults

By default, `isa-auth` uses **`'memory'`** storage to ensure sensitive tokens are never exposed to XSS attacks via browser localStorage:

```typescript
// 1. [PRODUCTION DEFAULT] Zero XSS In-Memory Storage
const secureAuth = new IsaAuth({
  provider: 'jwt',
  storage: 'memory', // Default! (No tokens in localStorage)
});

// 2. [PRODUCTION RECOMMENDED] HttpOnly Cookie / BFF Mode
const cookieAuth = new IsaAuth({
  provider: 'base',
  storage: 'cookie', // CookieSessionStorageAdapter (BFF architecture)
});

// 3. [LOCAL DEV ONLY] Insecure LocalStorage for F5 Refresh Convenience
const devAuth = new IsaAuth({
  provider: 'google',
  clientId: 'dev-client-id',
  storage: 'dev_insecure_localStorage', // Explicitly warns in console that this is NOT for production!
});
```

---

## 🧪 Interactive Playground & Testing

Run the local playground to test all 11 providers, World ID Orb, Passkey, and guards interactively:

```bash
# 1. Build monorepo
yarn build    # or Windows: yarn.cmd build

# 2. Run test suite (22 unit & integration tests)
node scratch/test_enhanced_features.js

# 3. Launch interactive playground
yarn demo
# Open http://localhost:3000 in your browser
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
