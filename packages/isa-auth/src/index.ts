import AuthCore, {
  CoreProviderType,
  GoogleAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  Web3AuthProvider,
  GithubAuthProvider,
  AppleAuthProvider,
  DiscordAuthProvider,
  LineAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  WorldAuthProvider,
  PasskeyAuthProvider,
  socialProviders,
  developerProviders,
  web3Providers,
  identityProviders,
  getProvidersByCategory,
  getProviderCategory,
  ProviderCategory,
  AuthBaseService,
  JwtService,
  createAuthGuard,
  evaluateGuard,
  createNavigationGuard,
  checkRole,
  checkPermission,
  matchPermissionRule,
  resolveInheritedRoles,
  createAuthFetch,
  applyAuthInterceptor,
  createAuthAxios,
  HttpTokenExchangeAdapter,
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
  getStorageAdapter,
  getAuthState,
  getAccessToken,
  getRefreshToken,
  setRefreshToken,
  getAuthInfo,
  updateAuthInfo,
  clearStoreSession,
  batch,
  subscribeSelector,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
  CookieSessionStorageAdapter,
  AuthGuardOptions,
  AuthContext,
  GuardResult,
  GuardFailureReason,
  RoleHierarchyMap,
  MatchMode,
  AutoRefreshOptions,
  StorageConfig,
  StorageType,
  AuthHttpOptions,
  AuthFetchOptions,
  TokenExchangeAdapter,
  TokenExchangeResult,
  WorldVerificationLevel,
  WorldIDProofResult,
  PasskeyAssertionResult,
  AuthLifecycleManager,
  LifecycleListener,
} from 'isa-auth-core';
import AuthProvider from './provider/AuthProvider';
import * as renderers from './render';

export interface IsaAuthConfig {
  provider?: CoreProviderType;
  secret?: string;
  clientId?: string;
  callbackUrl?: string;
  scope?: string;
  storage?: StorageType;
  storagePrefix?: string;
  extraOptions?: Record<string, any>;
}

/**
 * Main unified entry point for ISA-AUTH
 */
export class IsaAuth {
  public core: AuthCore;
  public providerInstance: any = null;
  public authProvider: AuthProvider;
  public providerType: CoreProviderType;

  constructor(config: IsaAuthConfig = {}) {
    const {
      provider = 'base',
      secret = 'isa-auth-secret',
      clientId = '',
      callbackUrl = '',
      scope,
      storage = 'memory',
      storagePrefix = '',
      extraOptions = {},
    } = config;

    this.providerType = provider;

    this.core = new AuthCore({
      providerType: provider,
      secret,
      storage,
      storagePrefix,
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
      } else if (provider === 'github') {
        this.providerInstance = new ProviderClass({
          clientId,
          redirectUri: callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'apple') {
        this.providerInstance = new ProviderClass({
          clientId,
          redirectURI: callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'discord') {
        this.providerInstance = new ProviderClass({
          clientId,
          redirectUri: callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'line') {
        this.providerInstance = new ProviderClass({
          clientId,
          callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'meta' || provider === 'facebook') {
        this.providerInstance = new ProviderClass({
          appId: clientId,
          redirectUri: callbackUrl,
          scope,
          ...extraOptions,
        });
      } else if (provider === 'world') {
        this.providerInstance = new ProviderClass({
          appId: clientId,
          action: extraOptions.action || 'login',
          verificationLevel: extraOptions.verificationLevel || 'orb',
          ...extraOptions,
        });
      } else if (provider === 'passkey') {
        this.providerInstance = new ProviderClass({
          rpName: extraOptions.rpName || 'ISA-AUTH Application',
          rpId: extraOptions.rpId,
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

  getContext(): AuthContext {
    return this.core.getContext();
  }

  /**
   * Returns current provider category ('social' | 'developer' | 'web3' | 'identity' | null)
   */
  getCategory(): ProviderCategory | null {
    return getProviderCategory(this.providerType as any);
  }

  setAccessToken(token: string) {
    const service = this.core.getService();
    if ((service as any).setAccessToken) {
      (service as any).setAccessToken(token);
    }
  }

  getRefreshToken(): string | null {
    const service = this.core.getService();
    return (service as any).getRefreshToken?.() || null;
  }

  setRefreshToken(token: string) {
    const service = this.core.getService();
    if ((service as any).setRefreshToken) {
      (service as any).setRefreshToken(token);
    }
  }

  updateAuthInfo<T = any>(partial: Partial<T>): T {
    return this.core.updateAuthInfo<T>(partial);
  }

  // 2. Authentication Actions
  async signIn() {
    return await this.authProvider.signIn();
  }

  signOut() {
    this.stopAutoRefresh();
    this.authProvider.signOut();
  }

  async refresh(refreshFn: () => Promise<string>) {
    return await this.authProvider.refresh(refreshFn);
  }

  /**
   * Starts automatic background token refresh prior to expiration
   */
  startAutoRefresh(refreshFn: () => Promise<string>, options?: any) {
    this.core.startAutoRefresh(refreshFn, options);
  }

  /**
   * Stops automatic background token refresh
   */
  stopAutoRefresh() {
    this.core.stopAutoRefresh();
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

  // 4. RBAC, ABAC & Enhanced Guards
  hasRole(role: string): boolean {
    return this.authProvider.hasRole(role);
  }

  hasPermission(permission: string): boolean {
    return this.authProvider.hasPermission(permission);
  }

  /**
   * Check permission with wildcard matching support
   * E.g. isaAuth.can('users:read') or isaAuth.can(['users:read', 'users:write'])
   */
  can(permission: string | string[], matchAll = true): boolean {
    return this.core.hasPermission(permission, matchAll);
  }

  /**
   * Check role with optional matchAll option
   */
  is(role: string | string[], matchAll = false): boolean {
    return this.core.hasRole(role, matchAll);
  }

  /**
   * Evaluates guard and returns detailed GuardResult
   */
  async evaluateGuard(
    options: AuthGuardOptions,
    customContext?: Partial<AuthContext>
  ): Promise<GuardResult> {
    return this.core.evaluateGuard(options, customContext);
  }

  /**
   * Instant boolean guard check (backwards compatible)
   */
  createGuard(options: AuthGuardOptions) {
    return this.core.createGuard(options);
  }

  /**
   * Creates a reusable router navigation guard
   */
  createNavigationGuard(
    options: AuthGuardOptions & {
      redirectToOnUnauthenticated?: string;
      redirectToOnUnauthorized?: string;
      onRedirect?: (url: string) => void;
    }
  ) {
    return createNavigationGuard({
      ...options,
      getContext: () => this.getContext(),
    });
  }

  // 5. Lifecycle & Authorization Callbacks
  onSignIn(listener: LifecycleListener<{ user?: any; token?: string }>) {
    return this.core.lifecycle.onSignIn(listener);
  }

  onSignOut(listener: LifecycleListener<void>) {
    return this.core.lifecycle.onSignOut(listener);
  }

  onTokenExpired(listener: LifecycleListener<void>) {
    return this.core.lifecycle.onTokenExpired(listener);
  }

  onUnauthorized(
    listener: LifecycleListener<{
      reason: string;
      result?: GuardResult;
      context?: AuthContext;
    }>
  ) {
    return this.core.lifecycle.onUnauthorized(listener);
  }

  onAccessDenied(
    listener: LifecycleListener<{
      reason: string;
      result?: GuardResult;
      context?: AuthContext;
      target?: string;
    }>
  ) {
    return this.core.lifecycle.onAccessDenied(listener);
  }

  onRoleChanged(listener: Parameters<AuthLifecycleManager['onRoleChanged']>[0]) {
    return this.core.lifecycle.onRoleChanged(listener);
  }

  onPermissionChanged(
    listener: Parameters<AuthLifecycleManager['onPermissionChanged']>[0]
  ) {
    return this.core.lifecycle.onPermissionChanged(listener);
  }

  // 6. Authenticated HTTP Clients (Fetch & Axios)
  createFetch(options?: Partial<AuthFetchOptions>) {
    return this.core.createFetch(options);
  }

  applyAxiosInterceptor(axiosInstance: any, options?: Partial<AuthHttpOptions>) {
    return this.core.applyAxiosInterceptor(axiosInstance, options);
  }

  createAxios(axiosModuleOrInstance: any, options?: Partial<AuthHttpOptions>) {
    return this.core.createAxios(axiosModuleOrInstance, options);
  }

  createTokenExchange(tokenEndpoint: string, options?: any) {
    return this.core.createTokenExchange(tokenEndpoint, options);
  }

  // 7. Watcher
  subscribe(callback: (isAuthenticated: boolean) => void) {
    return this.authProvider.watchAuthState(callback);
  }
}

export default IsaAuth;

// Re-exports
export {
  AuthCore,
  AuthProvider,
  AuthBaseService,
  JwtService,
  // Categorized Provider Groups
  socialProviders,
  developerProviders,
  web3Providers,
  identityProviders,
  getProvidersByCategory,
  getProviderCategory,
  // Individual Providers
  GoogleAuthProvider,
  KakaoAuthProvider,
  NaverAuthProvider,
  Web3AuthProvider,
  GithubAuthProvider,
  AppleAuthProvider,
  DiscordAuthProvider,
  LineAuthProvider,
  MetaAuthProvider,
  FacebookAuthProvider,
  WorldAuthProvider,
  PasskeyAuthProvider,
  // Guards & RBAC
  createAuthGuard,
  evaluateGuard,
  createNavigationGuard,
  checkRole,
  checkPermission,
  matchPermissionRule,
  resolveInheritedRoles,
  // HTTP Interceptors & Token Exchange
  createAuthFetch,
  applyAuthInterceptor,
  createAuthAxios,
  HttpTokenExchangeAdapter,
  // Token & PKCE Utils
  decodeToken,
  isExpiredToken,
  getTokenPayload,
  getTokenFromHeader,
  getTokenTimeRemaining,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizeUrl,
  parseOAuthCallback,
  // Store & Storage Adapters
  configureStorage,
  getStorageAdapter,
  getAuthState,
  getAccessToken,
  getRefreshToken,
  setRefreshToken,
  getAuthInfo,
  updateAuthInfo,
  clearStoreSession,
  batch,
  subscribeSelector,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
  CookieSessionStorageAdapter,
  renderers,
};

export type {
  ProviderCategory,
  AuthGuardOptions,
  AuthContext,
  GuardResult,
  GuardFailureReason,
  RoleHierarchyMap,
  MatchMode,
  AutoRefreshOptions,
  StorageConfig,
  StorageType,
  AuthHttpOptions,
  AuthFetchOptions,
  TokenExchangeAdapter,
  TokenExchangeResult,
  WorldVerificationLevel,
  WorldIDProofResult,
  PasskeyAssertionResult,
};
