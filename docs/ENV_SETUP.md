# 🔑 ISA-AUTH Provider Configuration & Environment Setup Guide

이 문서는 **ISA-AUTH**가 지원하는 11개 프로바이더(Social, Developer, Web3, Identity)의 개발자 콘솔 키 발급 및 리다이렉트 URI 설정 가이드입니다.

---

## 📋 1. 프로바이더별 개발자 콘솔 및 발급 가이드

### 🌐 Social & Portals

#### 1. Google Identity Services (GSI)
- **개발자 콘솔**: [Google Cloud Console - API 및 서비스](https://console.cloud.google.com/apis/credentials)
- **생성 항목**: `OAuth 2.0 클라이언트 ID` (애플리케이션 유형: **웹 애플리케이션**)
- **승인된 자바스크립트 원본**: `http://localhost:3000`, `https://yourdomain.com`
- **승인된 리디렉션 URI**: `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`
- **필요 환경변수**: `VITE_GOOGLE_CLIENT_ID`

#### 2. Apple Sign In
- **개발자 콘솔**: [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
- **생성 항목**: 
  - `App IDs` 생성 후 `Sign In with Apple` 기능 활성화
  - `Services IDs` 생성 (이 값이 `clientId`가 됨, 예: `com.yourcompany.web.login`)
- **Return URLs (리디렉션 URI)**: `https://yourdomain.com/auth/apple/callback` (HTTPS 필수)
- **필요 환경변수**: `VITE_APPLE_CLIENT_ID`, `VITE_APPLE_REDIRECT_URI`

#### 3. Meta / Facebook Login
- **개발자 콘솔**: [Meta for Developers](https://developers.facebook.com/apps)
- **생성 항목**: `앱 만들기` -> 제품: **Facebook 로그인 (JavaScript SDK)**
- **유효한 OAuth 리디렉션 URI**: `https://yourdomain.com/auth/meta/callback`
- **JavaScript 원본**: `http://localhost:3000`, `https://yourdomain.com`
- **필요 환경변수**: `VITE_META_APP_ID`, `VITE_META_REDIRECT_URI`

#### 4. Kakao Login
- **개발자 콘솔**: [Kakao Developers](https://developers.kakao.com/console/app)
- **생성 항목**: `내 애플리케이션` -> **JavaScript 키** 사용
- **플랫폼 등록**: `웹(Web)` 사이트 도메인 등록 (`http://localhost:3000`, `https://yourdomain.com`)
- **카카오 로그인 활성화**: `카카오 로그인` ON, `Redirect URI` 등록 (`http://localhost:3000/auth/kakao/callback`)
- **필요 환경변수**: `VITE_KAKAO_JAVASCRIPT_KEY`, `VITE_KAKAO_REDIRECT_URI`

#### 5. Naver Login
- **개발자 콘솔**: [Naver Developers 애플리케이션 등록](https://developers.naver.com/apps/#/register)
- **생성 항목**: `Application` -> `네아로 (네이버 아이디로 로그인)`
- **서비스 환경**: `PC 웹` 및 `모바일 웹` 등록
- **서비스 URL**: `http://localhost:3000`, `https://yourdomain.com`
- **Callback URL**: `http://localhost:3000/auth/naver/callback`
- **필요 환경변수**: `VITE_NAVER_CLIENT_ID`, `VITE_NAVER_CALLBACK_URL`

#### 6. LINE Login
- **개발자 콘솔**: [LINE Developers Console](https://developers.line.biz/console/)
- **생성 항목**: `Provider` -> `LINE Login Channel`
- **App types**: `Web app`
- **Callback URL**: `https://yourdomain.com/auth/line/callback`
- **필요 환경변수**: `VITE_LINE_CHANNEL_ID`, `VITE_LINE_CALLBACK_URL`

---

### 💻 Developer & Community

#### 7. GitHub OAuth
- **개발자 콘솔**: [GitHub Developer Settings - OAuth Apps](https://github.com/settings/developers)
- **생성 항목**: `New OAuth App`
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
- **필요 환경변수**: `VITE_GITHUB_CLIENT_ID`, `VITE_GITHUB_REDIRECT_URI`

#### 8. Discord OAuth
- **개발자 콘솔**: [Discord Developer Portal](https://discord.com/developers/applications)
- **생성 항목**: `New Application` -> `OAuth2`
- **Redirects**: `http://localhost:3000/auth/discord/callback`
- **필요 환경변수**: `VITE_DISCORD_CLIENT_ID`, `VITE_DISCORD_REDIRECT_URI`

---

### 🌐 Next-Gen Identity & Web3

#### 9. World ID (World Network / Orb Verification)
- **개발자 콘솔**: [Worldcoin Developer Portal](https://developer.worldcoin.org/)
- **생성 항목**: `New App` (Staging 또는 Production 모드 선택)
- **Action**: 생성한 액션 이름 (예: `user_login`, `vote`)
- **Verification Level**: `orb` (홍채 기반 인간 증명) 또는 `device` (기기 수준 증명)
- **필요 환경변수**: `VITE_WORLD_APP_ID`, `VITE_WORLD_ACTION`

#### 10. Passkey (FIDO2 / WebAuthn)
- **별도 콘솔 불필요**: 브라우저 표준 `navigator.credentials` WebAuthn API 구동.
- **RP ID (Relying Party ID)**: 현재 도메인의 eTLD+1 (예: `localhost`, `myapp.com`).
- **RP Name**: 사용자에게 브라우저 생체인증 팝업(Touch ID / Face ID / Windows Hello)에 표시될 서비스 명칭.
- **필요 환경변수**: `VITE_PASSKEY_RP_NAME`, `VITE_PASSKEY_RP_ID`

#### 11. Web3 Ethereum (SIWE EIP-4361)
- **별도 콘솔 불필요**: `window.ethereum` (MetaMask, Rabby, Coinbase Wallet 등) EIP-1193 브릿지 연동.
- **Domain**: 서명 메시지에 바인딩할 서비스 도메인 (예: `myapp.com`).
- **필요 환경변수**: `VITE_WEB3_DOMAIN`

---

## 🛠️ 2. Multi-Provider 코드 적용 예제

`.env` 파일에 설정한 변수를 불러와 `IsaAuth`에 주입하는 모범 코드입니다:

```typescript
import { IsaAuth } from 'isa-auth';

export const auth = new IsaAuth({
  // 보안 기본값: 메모리 스토리지 (XSS 방어)
  storage: (import.meta.env.VITE_AUTH_STORAGE_MODE as any) || 'memory',
  storagePrefix: import.meta.env.VITE_AUTH_STORAGE_PREFIX || 'app',

  providers: {
    // 🌐 Social
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
    apple: {
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
      callbackUrl: import.meta.env.VITE_APPLE_REDIRECT_URI,
    },
    meta: {
      clientId: import.meta.env.VITE_META_APP_ID,
      callbackUrl: import.meta.env.VITE_META_REDIRECT_URI,
    },
    kakao: {
      clientId: import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY,
      callbackUrl: import.meta.env.VITE_KAKAO_REDIRECT_URI,
    },
    naver: {
      clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
      callbackUrl: import.meta.env.VITE_NAVER_CALLBACK_URL,
    },
    line: {
      clientId: import.meta.env.VITE_LINE_CHANNEL_ID,
      callbackUrl: import.meta.env.VITE_LINE_CALLBACK_URL,
    },

    // 💻 Developer
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
      callbackUrl: import.meta.env.VITE_GITHUB_REDIRECT_URI,
    },
    discord: {
      clientId: import.meta.env.VITE_DISCORD_CLIENT_ID,
      callbackUrl: import.meta.env.VITE_DISCORD_REDIRECT_URI,
    },

    // 🔗 Web3
    web3: {
      domain: import.meta.env.VITE_WEB3_DOMAIN || window.location.host,
    },

    // 🌐 Identity & Biometrics
    world: {
      clientId: import.meta.env.VITE_WORLD_APP_ID,
      action: import.meta.env.VITE_WORLD_ACTION || 'login',
      verificationLevel: (import.meta.env.VITE_WORLD_VERIFICATION_LEVEL as any) || 'orb',
    },
    passkey: {
      rpName: import.meta.env.VITE_PASSKEY_RP_NAME || 'My Application',
      rpId: import.meta.env.VITE_PASSKEY_RP_ID || window.location.hostname,
    },
  },
});
```
