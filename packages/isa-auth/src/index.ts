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
  getProvider,
  getButton,
  providerToButtonMap,
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

export interface ProviderOptionConfig {
  clientId?: string;
  callbackUrl?: string;
  scope?: string;
  extraOptions?: Record<string, any>;
  [key: string]: any;
}

export interface IsaAuthConfig {
  // Legacy single provider option (backwards-compatible)
  provider?: CoreProviderType;
  clientId?: string;
  callbackUrl?: string;
  scope?: string;
  extraOptions?: Record<string, any>;

  // Multi-provider dictionary
  providers?: Partial<Record<CoreProviderType, ProviderOptionConfig>>;

  secret?: string;
  storage?: StorageType;
  storagePrefix?: string;
}

/**
 * Main unified entry point for ISA-AUTH
 * Supports both Single Provider and Multi-Provider unified orchestration.
 */
export class IsaAuth {
  public config: IsaAuthConfig;
  public core: AuthCore;
  public providerInstance: any = null;
  public authProvider: AuthProvider;
  public providerType: CoreProviderType;

  private providerInstances: Map<CoreProviderType, any> = new Map();
  private authProviders: Map<CoreProviderType, AuthProvider> = new Map();

  constructor(config: IsaAuthConfig = {}) {
    this.config = config;
    const {
      provider,
      secret = 'isa-auth-secret',
      clientId = '',
      callbackUrl = '',
      scope,
      storage = 'memory',
      storagePrefix = '',
      extraOptions = {},
      providers: multiProviders,
    } = config;

    // Determine primary provider
    const firstMultiKey = multiProviders ? (Object.keys(multiProviders)[0] as CoreProviderType) : undefined;
    const primaryProvider: CoreProviderType = provider || firstMultiKey || 'base';
    this.providerType = primaryProvider;

    this.core = new AuthCore({
      providerType: primaryProvider,
      secret,
      storage,
      storagePrefix,
    });

    const service = this.core.getService();

    // 1. Initialize multi-providers dictionary if provided
    if (multiProviders) {
      for (const [key, opts] of Object.entries(multiProviders)) {
        const pType = key as CoreProviderType;
        const instance = this.instantiateProvider(pType, opts || {});
        if (instance) {
          this.providerInstances.set(pType, instance);
          const btn = getButton(providerToButtonMap[pType] || 'none');
          this.authProviders.set(pType, new AuthProvider(service, instance, btn));
        }
      }
    }

    // 2. Initialize single provider if configured (or if not in map yet)
    if (provider && !this.providerInstances.has(provider)) {
      const singleOpts: ProviderOptionConfig = {
        clientId,
        callbackUrl,
        scope,
        extraOptions,
      };
      const instance = this.instantiateProvider(provider, singleOpts);
      if (instance) {
        this.providerInstances.set(provider, instance);
        const btn = this.core.getButton();
        this.authProviders.set(provider, new AuthProvider(service, instance, btn));
      }
    }

    // Default active provider instances for backwards compatibility
    this.providerInstance = this.providerInstances.get(primaryProvider) || null;
    this.authProvider =
      this.authProviders.get(primaryProvider) ||
      new AuthProvider(service, this.providerInstance, this.core.getButton());
  }

  private instantiateProvider(type: CoreProviderType, opts: ProviderOptionConfig): any {
    if (type === 'base' || type === 'jwt') {
      return null;
    }
    const ProviderClass = getProvider(type as any) as any;
    if (!ProviderClass) return null;

    const { clientId = '', callbackUrl = '', scope, extraOptions = {}, ...rest } = opts;
    const merged = { ...rest, ...extraOptions };

    if (type === 'google') {
      return new ProviderClass({
        clientId,
        callback: (token: string) => {
          this.setAccessToken(token);
          return token;
        },
        ...merged,
      });
    } else if (type === 'kakao') {
      return new ProviderClass({
        javascriptKey: clientId,
        redirectUri: callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'naver') {
      return new ProviderClass({
        clientId,
        callbackUrl,
        ...merged,
      });
    } else if (type === 'web3') {
      return new ProviderClass({
        domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
        ...merged,
      });
    } else if (type === 'github') {
      return new ProviderClass({
        clientId,
        redirectUri: callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'apple') {
      return new ProviderClass({
        clientId,
        redirectURI: callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'discord') {
      return new ProviderClass({
        clientId,
        redirectUri: callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'line') {
      return new ProviderClass({
        clientId,
        callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'meta' || type === 'facebook') {
      return new ProviderClass({
        appId: clientId,
        redirectUri: callbackUrl,
        scope,
        ...merged,
      });
    } else if (type === 'world') {
      return new ProviderClass({
        appId: clientId,
        action: merged.action || 'login',
        verificationLevel: merged.verificationLevel || 'orb',
        ...merged,
      });
    } else if (type === 'passkey') {
      return new ProviderClass({
        rpName: merged.rpName || 'ISA-AUTH Application',
        rpId: merged.rpId,
        ...merged,
      });
    } else {
      return new ProviderClass({
        clientId,
        ...merged,
      });
    }
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
   * Returns category of the specified or primary provider
   */
  getCategory(provider?: CoreProviderType): ProviderCategory | null {
    const target = provider || this.providerType;
    return getProviderCategory(target as any);
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

  // 2. Authentication Actions (Multi-Provider Support)
  async signIn(provider?: CoreProviderType) {
    if (provider) {
      const targetAuthProvider = this.authProviders.get(provider);
      if (targetAuthProvider) {
        return await targetAuthProvider.signIn();
      }
      const targetInstance = this.providerInstances.get(provider);
      if (targetInstance && typeof targetInstance.signIn === 'function') {
        return await targetInstance.signIn();
      }
      throw new Error(`[ISA-AUTH] Provider "${provider}" is not registered in this IsaAuth instance.`);
    }
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

  // 3. UI and Renderers (Multi-Provider Support)
  getButton(provider?: CoreProviderType) {
    if (provider) {
      const target = this.authProviders.get(provider);
      return target ? target.getButton() : getButton(providerToButtonMap[provider] || 'none');
    }
    return this.authProvider.getButton();
  }

  /**
   * Renders button for specified provider (or primary provider if omitted)
   * Usage:
   *   auth.renderButton(container); // primary provider
   *   auth.renderButton('google', container); // specific provider
   */
  renderButton(
    providerOrContainer?: CoreProviderType | HTMLElement | null,
    container?: HTMLElement | null
  ): HTMLButtonElement | null {
    let targetProvider: CoreProviderType = this.providerType;
    let targetContainer: HTMLElement | null = null;

    if (typeof providerOrContainer === 'string') {
      targetProvider = providerOrContainer;
      targetContainer = container || null;
    } else {
      targetContainer = providerOrContainer || null;
    }

    const buttonData = this.getButton(targetProvider) as any;
    if (!buttonData) return null;

    const data = typeof buttonData.toJSON === 'function' ? buttonData.toJSON() : buttonData;

    const btn = renderers.renderByJs({
      onClick: () => this.signIn(targetProvider),
      label: data.text,
      className: data.className,
      style: data.style,
    });

    if (btn) {
      if (!btn.dataset) (btn as any).dataset = {};
      btn.dataset.provider = targetProvider;
    }

    if (targetContainer) {
      targetContainer.innerHTML = '';
      targetContainer.appendChild(btn);
    }
    return btn;
  }

  /**
   * Renders all registered provider buttons inside a container element.
   */
  renderAllButtons(
    container: HTMLElement,
    options: {
      providers?: CoreProviderType[];
      direction?: 'row' | 'column' | 'grid';
      gap?: string;
    } = {}
  ): HTMLButtonElement[] {
    if (!container) return [];
    const { direction = 'column', gap = '8px' } = options;
    const providerList = options.providers || Array.from(this.providerInstances.keys());

    const wrapper = document.createElement('div');
    wrapper.className = 'isa-auth-button-group';
    wrapper.style.display = direction === 'grid' ? 'grid' : 'flex';
    wrapper.style.flexDirection = direction === 'row' ? 'row' : 'column';
    if (direction === 'grid') {
      wrapper.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
    }
    wrapper.style.gap = gap;

    const buttons: HTMLButtonElement[] = [];
    for (const p of providerList) {
      const slot = document.createElement('div');
      slot.className = `isa-auth-slot-${p}`;
      const btn = this.renderButton(p, slot);
      if (btn) {
        buttons.push(btn);
        wrapper.appendChild(slot);
      }
    }

    container.innerHTML = '';
    container.appendChild(wrapper);
    return buttons;
  }

  getProviderInstance(provider?: CoreProviderType) {
    if (provider) {
      return this.providerInstances.get(provider) || null;
    }
    return this.providerInstance;
  }

  getRegisteredProviders(): CoreProviderType[] {
    return Array.from(this.providerInstances.keys());
  }

  // 4. RBAC, ABAC & Enhanced Guards
  hasRole(role: string): boolean {
    return this.authProvider.hasRole(role);
  }

  hasPermission(permission: string): boolean {
    return this.authProvider.hasPermission(permission);
  }

  can(permission: string | string[], matchAll = true): boolean {
    return this.core.hasPermission(permission, matchAll);
  }

  is(role: string | string[], matchAll = false): boolean {
    return this.core.hasRole(role, matchAll);
  }

  async evaluateGuard(
    options: AuthGuardOptions,
    customContext?: Partial<AuthContext>
  ): Promise<GuardResult> {
    return this.core.evaluateGuard(options, customContext);
  }

  createGuard(options: AuthGuardOptions) {
    return this.core.createGuard(options);
  }

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
