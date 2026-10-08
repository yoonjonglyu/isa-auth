import AuthCore, {
  CoreProviderType,
  GoogleAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  Web3AuthProvider,
  createAuthGuard,
  createAuthFetch,
  decodeToken,
  isExpiredToken,
  getTokenPayload,
  getTokenFromHeader,
  getTokenTimeRemaining,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  parseOAuthCallback,
  configureStorage,
  getAuthState,
  getAccessToken,
  getAuthInfo,
} from 'isa-auth-core';
import AuthProvider from './provider/AuthProvider';
import * as renderers from './render';

export interface IsaAuthConfig {
  provider?: CoreProviderType;
  secret?: string;
  clientId?: string;
  callbackUrl?: string;
  scope?: string;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
  extraOptions?: Record<string, any>;
}

/**
 * Main unified entry point for ISA-AUTH
 */
export class IsaAuth {
  public core: AuthCore;
  public providerInstance: any = null;
  public authProvider: AuthProvider;

  constructor(config: IsaAuthConfig = {}) {
    const {
      provider = 'base',
      secret = 'isa-auth-secret',
      clientId = '',
      callbackUrl = '',
      scope,
      storage = 'localStorage',
      extraOptions = {},
    } = config;

    this.core = new AuthCore({
      providerType: provider,
      secret,
      storage,
    });

    const ProviderClass = this.core.getProvider() as any;
    if (ProviderClass) {
      if (provider === 'google') {
        this.providerInstance = new ProviderClass({
          clientId,
          callback: (token: string) => {
            this.setAccessToken(token);
            return token;
          },
          ...extraOptions,
        });
      } else if (provider === 'kakao') {
        this.providerInstance = new ProviderClass({
          javascriptKey: clientId,
          redirectUri: callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'naver') {
        this.providerInstance = new ProviderClass({
          clientId,
          callbackUrl,
          ...extraOptions,
        });
      } else if (provider === 'web3') {
        this.providerInstance = new ProviderClass({
          domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
          ...extraOptions,
        });
      } else {
        this.providerInstance = new ProviderClass({
          clientId,
          ...extraOptions,
        });
      }
    }

    const button = this.core.getButton();
    const service = this.core.getService();

    this.authProvider = new AuthProvider(service, this.providerInstance, button);
  }

  // 1. Core State Methods
  isAuthenticated(): boolean {
    return this.authProvider.getAuthState();
  }

  getAccessToken(): string | null {
    return this.authProvider.getAccessToken();
  }

  getUserInfo() {
    return this.authProvider.getUserInfo();
  }

  setAccessToken(token: string) {
    const service = this.core.getService();
    if ((service as any).setAccessToken) {
      (service as any).setAccessToken(token);
    }
  }

  // 2. Authentication Actions
  async signIn() {
    return await this.authProvider.signIn();
  }

  signOut() {
    this.authProvider.signOut();
  }

  async refresh(refreshFn: () => Promise<string>) {
    return await this.authProvider.refresh(refreshFn);
  }

  // 3. UI and Renderers
  getButton() {
    return this.authProvider.getButton();
  }

  renderButton(container?: HTMLElement | null): HTMLButtonElement | null {
    const buttonData = this.getButton();
    if (!buttonData) return null;

    const btn = renderers.renderByJs({
      onClick: () => this.signIn(),
      label: buttonData.text,
      className: buttonData.className,
      style: buttonData.style,
    });

    if (container) {
      container.innerHTML = '';
      container.appendChild(btn);
    }
    return btn;
  }

  // 4. RBAC & Guards
  hasRole(role: string): boolean {
    return this.authProvider.hasRole(role);
  }

  hasPermission(permission: string): boolean {
    return this.authProvider.hasPermission(permission);
  }

  createGuard(options: Parameters<typeof createAuthGuard>[0]) {
    return this.core.createGuard(options);
  }

  // 5. Authenticated HTTP Client
  createFetch(options?: { refreshFn?: () => Promise<string>; baseUrl?: string }) {
    return this.core.createFetch(options);
  }

  // 6. Watcher
  subscribe(callback: (isAuthenticated: boolean) => void) {
    return this.authProvider.watchAuthState(callback);
  }
}

export default IsaAuth;

// Re-exports
export {
  AuthCore,
  AuthProvider,
  GoogleAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  Web3AuthProvider,
  createAuthGuard,
  createAuthFetch,
  decodeToken,
  isExpiredToken,
  getTokenPayload,
  getTokenFromHeader,
  getTokenTimeRemaining,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  parseOAuthCallback,
  configureStorage,
  getAuthState,
  getAccessToken,
  getAuthInfo,
  renderers,
};
