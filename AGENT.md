# 🤖 AGENT.md - ISA AUTH Architecture & Context Guide

> **Note for AI Agents & Developers**: 이 문서는 `isa-auth` 프로젝트의 핵심 아키텍처, 5대 기능 축, 모노레포 빌드/배포 파이프라인, 그리고 개발 가이드를 압축 정리한 문서입니다.

---

## 📌 1. 프로젝트 개요 (Overview)

- **프로젝트명**: `isa-auth`
- **배포 패키지**: `isa-auth` (npm 레지스트리 공식 배포)
- **주요 언어 & 툴체인**: TypeScript, SWC, tsup, Yarn Workspaces
- **프로젝트 철학**:
  1. **Framework-Agnostic**: 특정 프레임워크에 종속되지 않고 Vanilla JS, React, Vue, Svelte, Web Components 어디서나 사용 가능
  2. **Zero Node.js Dependencies**: 브라우저 번들러 에러를 원천 차단하기 위해 Node 전용 라이브러리(`jsonwebtoken` 등)를 완전 배제하고 Web Crypto API 및 Base64Url 기반의 순수 브라우저 엔진 구축
  3. **Single Package Distribution**: 개발 시에는 모노레포로 관심사를 분리하고, 배포 시에는 단일 패키지(`isa-auth`)로 인라인 번들링

---

## 🏛️ 2. 아키텍처 및 5대 핵심 축 (5 Core Pillars)

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

### 1) 자체 반응형 스토어 & 세션 영속화 (`packages/core/src/store`)
- **Map & Set 기반 경량 Pub/Sub**: 외부 상태 라이브러리 없이 70줄 안팎의 미니멀 반응형 스토어 내장
- **스토리지 어댑터 (`storageAdapter.ts`)**: `localStorage`, `sessionStorage`, `memory`, `CookieSessionStorageAdapter`(BFF / HttpOnly 쿠키 모드) 교체 지원
- **멀티 탭 실시간 동기화**: `window.addEventListener('storage')`를 감지하여 다른 탭의 로그인/로그아웃 상태를 현재 탭에 실시간 동기화
- **정밀 구독 (`subscribeSelector`) & 배치(`batch`)**: 관심 슬라이스 변경 시에만 리액티브 리렌더링

### 2) 기본 인증(JWT), 고도화된 RBAC/ABAC 권한 가드 & 라이프사이클 (`packages/core/src`)
- **브라우저 안전 JWT 유틸 (`auths/jwt/jwtUtils.ts`)**: 토큰 디코딩, 만료 검사(`isExpiredToken`), 남은 시간 계산(`getTokenTimeRemaining`), Bearer 헤더 파서
- **와일드카드 & 계층형 RBAC/ABAC 가드 (`guard/index.ts`)**:
  - `matchPermissionRule`: 와일드카드 권한 지원 (`users:*`, `*:read`, `*`)
  - `resolveInheritedRoles`: 역할 상속 및 계층(`roleHierarchy`) 지원 (예: ADMIN > MANAGER > USER)
  - `evaluateGuard`: 상세 검증 결과(`GuardResult`: `reason`, `missingRoles`, `missingPermissions`) 반환
  - `createAuthGuard`: 커스텀 조건 검증(`validate`), `onUnauthenticated`, `onUnauthorized`, `onForbidden`, `onSuccess`, `onEvaluate` 세분화 콜백
  - `createNavigationGuard`: Vue Router, React Router 등 프론트엔드 라우터 네비게이션 가드 헬퍼 (리다이렉트 지원)
- **라이프사이클 훅 (`lifecycle/index.ts`)**:
  - `onSignIn`, `onSignOut`, `onTokenExpired`, `onError`
  - 권한/인가 전역 훅: `onUnauthorized`, `onAccessDenied`, `onRoleChanged`, `onPermissionChanged`
- **HTTP 클라이언트 인터셉터 (`http/index.ts`)**:
  - `createAuthFetch`: Bearer 자동 주입 및 401 수신 시 자동 리프레시 후 1회 재요청
  - `applyAuthInterceptor`, `createAuthAxios`: Axios 인스턴스 전용 Bearer 자동 주입, withCredentials(쿠키), 401 대기 큐 및 자동 재요청 인터셉터
- **백엔드 토큰 교환 어댑터 (`service/tokenExchange.ts`)**:
  - `HttpTokenExchangeAdapter`: OAuth 인가 코드(Code), World ID Proof, Passkey Assertion, Web3 SIWE 서명을 백엔드 엔드포인트로 전송하여 토큰/세션 획득 표준화

### 3) 카테고리별 프로바이더 모듈 아키텍처 (`packages/core/src/providers`)
프로바이더는 역할과 성격에 따라 4대 도메인으로 체계적으로 모듈화되어 있습니다:
- **소셜 & 포털 (`social/`)**: Google, Apple, Meta/Facebook, Kakao, Naver, LINE
- **개발자 & 커뮤니티 (`developer/`)**: GitHub, Discord
- **블록체인 Web3 (`web3/`)**: Ethereum SIWE (EIP-4361)
- **신원 인증 & 생체 (`identity/`)**:
  - `worldAuth.ts`: World ID (World Network / Worldcoin Orb 신원 인증: ZK-SNARK Proof of Personhood, `orb` | `device`)
  - `passkeyAuth.ts`: Passkey / WebAuthn (FIDO2 플랫폼 생체 인증: Face ID, Touch ID, Windows Hello)
- **카테고리 유틸리티**: `getProviderCategory(provider)`, `getProvidersByCategory(category)`, `socialProviders`, `developerProviders`, `web3Providers`, `identityProviders`

### 4) 통합 파사드 & 멀티 렌더러 (`packages/isa-auth`)
- **통합 클래스 (`IsaAuth`)**: `new IsaAuth({ provider: 'meta', ... })`로 초기화
- **권한 편의 메서드**: `can('users:read')`, `is('ADMIN')`, `evaluateGuard()`, `createNavigationGuard()`, `getCategory()`
- **렌더러 (`render/index.ts`)**: `renderByJs`, `renderByReact`, `renderByVue`, `registerWebComponent`(`<isa-auth-button>`)

---

## 📂 3. 디렉터리 구조 (Directory Map)

```
isa-auth/
├── .agents/
│   └── skills/
│       └── isa-auth-guide/        # [전용 스킬] 아키텍처 및 레시피 가이드 (SKILL.md)
├── packages/
│   ├── core/                      # [비공개 엔진] "private": true
│   │   ├── src/
│   │   │   ├── authCore.ts        # 코어 파사드 클래스
│   │   │   ├── auths/jwt/         # 브라우저 네이티브 JWT 엔진 & 유틸
│   │   │   ├── components/        # 버튼 메타데이터 및 직렬화 (JSON)
│   │   │   ├── event/             # DOM 커스텀 이벤트 버스
│   │   │   ├── guard/             # RBAC/ABAC 권한 및 네비게이션 가드
│   │   │   ├── http/              # Bearer 자동 주입 및 Fetch/Axios 인터셉터
│   │   │   ├── lifecycle/         # 인증/인가 라이프사이클 이벤트 매니저
│   │   │   ├── mappings.ts        # Provider <-> Service <-> Button 매핑
│   │   │   ├── providers/         # [프로바이더 모듈]
│   │   │   │   ├── social/        # Google, Apple, Meta/Facebook, Kakao, Naver, LINE
│   │   │   │   ├── developer/     # GitHub, Discord
│   │   │   │   ├── web3/          # Web3 Ethereum SIWE (EIP-4361)
│   │   │   │   ├── identity/      # World ID (Orb), Passkey (FIDO2 WebAuthn)
│   │   │   │   ├── authProvider.ts# 표준 AuthProvider 인터페이스
│   │   │   │   └── pkce.ts        # OAuth 2.0 PKCE 유틸리티
│   │   │   ├── service/           # BaseAuthService, JwtService, TokenExchangeAdapter
│   │   │   └── store/             # 경량 반응형 스토어, 쿠키/로컬/메모리 어댑터
│   │   └── package.json
│   │
│   ├── isa-auth/                  # [공식 배포 패키지] npm: isa-auth
│   │   ├── src/
│   │   │   ├── index.ts           # 통합 IsaAuth 클래스 및 전체 Re-export
│   │   │   ├── provider/          # AuthProvider 결합 컨트롤러
│   │   │   └── render/            # JS, React, Vue, Web Component 렌더러
│   │   ├── tsup.config.ts         # isa-auth-core 인라인 번들러 설정
│   │   └── package.json           # CJS, ESM, DTS Exports 설정
│   │
│   └── demo/                      # 인터랙티브 플레이그라운드
│       ├── index.html             # 다크 테마 Glassmorphism 테스트 UI (11개 프로바이더 뷰)
│       └── server.js              # 로컬 데모 서빙 서버 (포트 3000)
│
├── package.json                   # 루트 워크스페이스
├── README.md                      # 공식 사용자 문서
└── AGENT.md                       # (본 문서) 아키텍처 및 에이전트 가이드
```

---

## ⚡ 4. 빌드 & 배포 전략 (Build & Publish Strategy)

### 모노레포 내부 의존성 관리
1. `packages/core`는 **`private: true`** 로 설정되어 npm에 독립 배포되지 않습니다.
2. `packages/isa-auth`는 **`tsup` 번들러**를 사용하여 빌드 시 `isa-auth-core` 코드를 **`dist/index.js`(CJS) 및 `dist/index.mjs`(ESM), `dist/index.d.ts` 내부에 인라인 번들링(`noExternal: ['isa-auth-core']`)** 합니다.
3. 따라서 최종 사용자는 `npm install isa-auth` 하나만 설치하면 되며, npm에 없는 내부 코어 패키지를 찾는 문제가 원천 차단됩니다.
4. `isa-util` 의존성은 **`"latest"`** 로 지정되어 있어 항상 최신 릴리즈 버전을 바라봅니다.

---

## 🛠️ 5. 주요 명령어 (Commands Cheat Sheet)

```bash
# 1. 의존성 설치
yarn install

# 2. 전체 빌드 (core 컴파일 -> isa-auth tsup 인라인 번들링)
yarn build (또는 Windows: yarn.cmd build)

# 3. 로컬 데모 플레이그라운드 실행 (http://localhost:3000)
yarn demo

# 4. 검증 테스트 스위트 실행
node scratch/test_enhanced_features.js

# 5. npm 배포 (packages/isa-auth 디렉터리에서 실행)
cd packages/isa-auth
npm publish --access public
```
