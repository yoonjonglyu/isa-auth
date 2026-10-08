# 🚀 ISA AUTH

> **A Unified, Framework-Agnostic Frontend Authentication Suite**  
> Supporting Multi-Provider OAuth (Google, Kakao, Naver), Web3 (SIWE), Reactive Store, JWT Management, and RBAC Route Guards.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![SWC](https://img.shields.io/badge/Compiler-SWC-orange.svg)](https://swc.rs/)

---

## 🌟 Why ISA AUTH?

Modern web applications frequently require diverse authentication methods — from global platforms (Google, Apple) and local providers (Kakao, Naver) to decentralized blockchain identity (SIWE) and standard JWT credentials.

**ISA AUTH** provides an all-in-one, frontend-centric architecture that is:

- **Framework-Agnostic**: Works seamlessly across Vanilla JS, React, Vue, Svelte, or Web Components.
- **Zero Node.js Dependencies**: Pure browser-safe cryptographic & JWT utilities with zero Node runtime bloat.
- **Built-in Reactive State & Persistence**: Lightweight pub/sub store with automatic `localStorage`/`sessionStorage` synchronization across browser tabs.
- **Enterprise-Ready Authorization (RBAC)**: Fine-grained Role and Permission guards for protecting SPA routes and UI elements.
- **Web3 & Modern OAuth Standard**: Native EIP-4361 (Sign-In with Ethereum) and OAuth 2.0 PKCE helpers out-of-the-box.

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

## 🚀 Quick Start

### 1. Unified Authentication Instance

```typescript
import { IsaAuth } from 'isa-auth';

// Initialize with your desired provider
const auth = new IsaAuth({
  provider: 'google', // 'google' | 'kakao' | 'naver' | 'web3' | 'jwt' | 'base'
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  storage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
});

// Render headless button to a DOM container
auth.renderButton(document.getElementById('login-container'));

// Listen to authentication changes
auth.subscribe((isAuthenticated) => {
  console.log('Auth state changed:', isAuthenticated);
  if (isAuthenticated) {
    console.log('User Profile:', auth.getUserInfo());
    console.log('Access Token:', auth.getAccessToken());
  }
});
```

---

## 🔑 5 Core Pillars

### 1. 📦 Reactive Store & Multi-Tab Synchronization
Built-in pub/sub store without heavyweight external dependencies. Changes in one tab automatically synchronize across all open browser tabs.

```typescript
import { configureStorage, getAuthState, setAccessToken } from 'isa-auth';

// Switch storage adapter
configureStorage('localStorage');

// Set token - automatically parses payload, updates reactive store and syncs across tabs
setAccessToken('eyJhbGciOi...');
```

### 2. 🛡️ RBAC & Route Guards
Protect routes and UI components based on JWT claims (`roles` and `permissions`).

```typescript
import { createAuthGuard } from 'isa-auth';

const adminGuard = createAuthGuard({
  requireAuth: true,
  roles: ['ADMIN'],
  onUnauthorized: () => {
    alert('403 Forbidden: Administrator access required.');
  },
  onUnauthenticated: () => {
    window.location.href = '/login';
  },
});

// Use inside your router (React Router, Vue Router, etc.)
const canAccess = await adminGuard({
  isAuthenticated: auth.isAuthenticated(),
  roles: auth.getUserInfo()?.roles,
});
```

### 3. 🌐 Multi-Provider OAuth (Google, Kakao, Naver)
Standardized provider lifecycle with automatic SDK injection and popup/redirect workflows.

```typescript
// Kakao Provider
const kakaoAuth = new IsaAuth({
  provider: 'kakao',
  clientId: 'YOUR_KAKAO_JAVASCRIPT_KEY',
  callbackUrl: 'https://your-domain.com/oauth/callback',
});

// Trigger login
await kakaoAuth.signIn();
```

### 4. ⛓️ Web3 (Sign-In with Ethereum - SIWE)
Native support for EIP-4361 compliant wallet authentication.

```typescript
const web3Auth = new IsaAuth({
  provider: 'web3',
  extraOptions: {
    statement: 'Sign in with Ethereum to access the dashboard.',
    chainId: 1,
  },
});

// Prompts MetaMask / browser wallet to connect and sign message
await web3Auth.signIn();
```

### 5. 🛠️ Authentication Utilities & Auto-Refresh HTTP Client

```typescript
import { 
  createAuthFetch, 
  decodeToken, 
  isExpiredToken, 
  generateCodeVerifier, 
  generateCodeChallenge 
} from 'isa-auth';

// 1. Safe JWT decoding (pure browser)
const { payload } = decodeToken(token);
const expired = isExpiredToken(token);

// 2. PKCE generators for secure OAuth 2.0
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// 3. HTTP fetch with auto Bearer token and 401 refresh retry
const authFetch = auth.createFetch({
  baseUrl: 'https://api.example.com',
  refreshFn: async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const data = await res.json();
    return data.accessToken;
  },
});

// Automatically adds "Authorization: Bearer <token>" and refreshes upon 401
const response = await authFetch('/v1/protected-data');
```

---

## 🎨 Framework Adapters

### Vanilla JavaScript
```typescript
import { renderers } from 'isa-auth';

const btn = renderers.renderByJs({
  label: 'Google 로그인',
  onClick: () => auth.signIn(),
});
document.body.appendChild(btn);
```

### React
```tsx
import { renderers } from 'isa-auth';

export function LoginButton() {
  return renderers.renderByReact({
    label: 'Sign In',
    onClick: () => auth.signIn(),
  });
}
```

### Web Component
```html
<script type="module">
  import { renderers } from 'isa-auth';
  renderers.registerWebComponent();
</script>

<isa-auth-button label="Sign In with ISA"></isa-auth-button>
```

---

## 🧪 Testing the Playground

Run the interactive local demo to experiment with all features:

```bash
# Build packages
yarn build

# Start interactive playground
yarn demo
# Visit http://localhost:3000 in your browser
```

---

## 📁 Repository Structure

```
isa-auth/
├── packages/
│   ├── core/           # @isa-auth/core: JWT, Store, Providers, Guards, HTTP Interceptor
│   ├── isa-auth/       # isa-auth: Unified Facade, Multi-Framework Renderers
│   └── demo/           # Interactive Web Playground
├── package.json        # Workspace Monorepo
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
