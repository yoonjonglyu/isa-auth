import {
  isExpiredToken,
  isValidToken,
  getTokenFromHeader,
  getTokenPayload,
  getTokenTimeRemaining,
  configureJwtManager,
  JwtPayload,
} from '../auths/jwt';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeAccessToken,
} from '../store';
import {
  matchPermissionRule,
  resolveInheritedRoles,
  checkRole,
  checkPermission,
  RoleHierarchyMap,
} from '../guard';
import AuthBaseService from './baseAuthService';

export interface AutoRefreshOptions {
  /**
   * Seconds before actual expiration to trigger refresh
   * @default 60
   */
  leadTimeSeconds?: number;

  /**
   * Whether to trigger refresh immediately if token is missing or already expired
   * @default true
   */
  immediateIfExpired?: boolean;

  /**
   * Callback when auto refresh succeeds
   */
  onSuccess?: (newToken: string) => void;

  /**
   * Callback when auto refresh fails
   */
  onError?: (error: any) => void;
}

class JwtService extends AuthBaseService {
  private inFlightRefreshPromise: Promise<string | null> | null = null;
  private autoRefreshTimer: any = null;
  private autoRefreshFn: (() => Promise<string>) | null = null;
  private autoRefreshOptions: AutoRefreshOptions = { leadTimeSeconds: 60 };

  constructor(secretKey: string = 'isa-auth-default-secret') {
    super();
    this.configureJwt(secretKey);

    // Boot-time validation: if restored token is already expired, evict it
    this.validatePersistedSession();
  }

  // Persisted token expiration verification on boot
  private validatePersistedSession() {
    const token = this.getAccessToken();
    if (token) {
      if (this.isExpiredAccessToken()) {
        console.warn('[ISA-AUTH] Persisted token is already expired on initialization. Evicting session.');
        this.clearAuthState();
      } else {
        const payload = this.getAccessTokenPayload();
        if (payload) {
          this.setAuthInfo(payload);
          this.setAuthState(true);
        }
      }
    }
  }

  // Configure Web Crypto / JWT manager
  configureJwt(secretKey: string) {
    configureJwtManager(secretKey);
  }

  // Access Token Methods
  getAccessToken(): string | null {
    return getAccessToken() as string | null;
  }

  setAccessToken(value: string | null) {
    setAccessToken(value);
    if (value) {
      const payload = this.getAccessTokenPayload();
      this.setAuthInfo(payload);
      this.setAuthState(true);
      // Reschedule auto refresh if timer was active
      if (this.autoRefreshFn) {
        this.scheduleNextAutoRefresh();
      }
    }
  }

  // Refresh Token Methods
  getRefreshToken(): string | null {
    return getRefreshToken() as string | null;
  }

  setRefreshToken(token: string | null) {
    setRefreshToken(token);
  }

  isValidAccessToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return isValidToken(token);
  }

  isExpiredAccessToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    return isExpiredToken(token);
  }

  getTimeRemaining(): number {
    const token = this.getAccessToken();
    if (!token) return 0;
    return getTokenTimeRemaining(token);
  }

  getAccessTokenPayload<T = JwtPayload>(): T | null {
    const token = this.getAccessToken();
    if (!token) return null;
    return getTokenPayload<T>(token);
  }

  setAccessTokenFromHeader(header: string) {
    const token = getTokenFromHeader(header);
    if (!token) return;
    this.setAccessToken(token);
  }

  // Enhanced RBAC & Permissions (Wildcards & Hierarchy support)
  hasRole(
    role: string | string[],
    matchAll = false,
    hierarchy?: RoleHierarchyMap
  ): boolean {
    const payload = this.getAccessTokenPayload();
    if (!payload) return false;
    const userRoles: string[] = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role
      ? [payload.role]
      : [];

    return checkRole(role, userRoles, matchAll, hierarchy);
  }

  hasPermission(
    permission: string | string[],
    matchAll = true
  ): boolean {
    const payload = this.getAccessTokenPayload();
    if (!payload) return false;
    const userPermissions: string[] = Array.isArray(payload.permissions)
      ? payload.permissions
      : payload.scope
      ? String(payload.scope).split(' ')
      : [];

    return checkPermission(permission, userPermissions, matchAll);
  }

  can(permission: string | string[], matchAll = true): boolean {
    return this.hasPermission(permission, matchAll);
  }

  is(role: string | string[], matchAll = false, hierarchy?: RoleHierarchyMap): boolean {
    return this.hasRole(role, matchAll, hierarchy);
  }

  /**
   * Refreshes access token with in-flight deduplication (Mutex)
   */
  async refreshToken(
    refreshTokenFn: () => Promise<string>
  ): Promise<string | null> {
    // If a refresh is already in flight, reuse existing promise
    if (this.inFlightRefreshPromise) {
      return this.inFlightRefreshPromise;
    }

    this.inFlightRefreshPromise = (async () => {
      try {
        const newToken = await refreshTokenFn();
        if (!newToken || typeof newToken !== 'string') {
          throw new Error('Refresh token function did not return a valid token');
        }

        if (isExpiredToken(newToken)) {
          throw new Error('Newly received token is already expired');
        }

        const payload = getTokenPayload(newToken);
        const currentInfo = this.getAuthInfo() || {};
        this.setAuthInfo({ ...currentInfo, ...payload });
        this.setAccessToken(newToken);
        return newToken;
      } catch (error) {
        console.error('[ISA-AUTH] Failed to refresh token:', error);
        this.clearAuthState();
        throw error;
      } finally {
        this.inFlightRefreshPromise = null;
      }
    })();

    return this.inFlightRefreshPromise;
  }

  /**
   * Starts automatic background token refresh prior to expiration
   */
  startAutoRefresh(
    refreshFn: () => Promise<string>,
    options: AutoRefreshOptions = {}
  ) {
    this.stopAutoRefresh();
    this.autoRefreshFn = refreshFn;
    this.autoRefreshOptions = { leadTimeSeconds: 60, ...options };
    this.scheduleNextAutoRefresh();
  }

  /**
   * Stops automatic token refresh scheduler
   */
  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearTimeout(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  private scheduleNextAutoRefresh() {
    this.stopAutoRefresh();
    if (!this.autoRefreshFn) return;

    const remainingMs = this.getTimeRemaining();
    if (remainingMs <= 0) {
      if (this.autoRefreshOptions.immediateIfExpired ?? true) {
        this.autoRefreshTimer = setTimeout(async () => {
          if (!this.autoRefreshFn) return;
          try {
            const token = await this.refreshToken(this.autoRefreshFn);
            if (token && this.autoRefreshOptions.onSuccess) {
              this.autoRefreshOptions.onSuccess(token);
            }
          } catch (err) {
            if (this.autoRefreshOptions.onError) {
              this.autoRefreshOptions.onError(err);
            }
          }
        }, 10);
      }
      return;
    }

    const leadTimeMs = (this.autoRefreshOptions.leadTimeSeconds ?? 60) * 1000;
    // Calculate delay: trigger leadTime before expiry, minimum 1 second delay
    const delayMs = Math.max(remainingMs - leadTimeMs, 1000);
    // Clamp to 32-bit signed integer max (approx 24.8 days) to prevent Node overflow warning
    const clampedDelayMs = Math.min(delayMs, 2147483647);

    this.autoRefreshTimer = setTimeout(async () => {
      if (!this.autoRefreshFn) return;
      try {
        const token = await this.refreshToken(this.autoRefreshFn);
        if (token && this.autoRefreshOptions.onSuccess) {
          this.autoRefreshOptions.onSuccess(token);
        }
      } catch (err) {
        if (this.autoRefreshOptions.onError) {
          this.autoRefreshOptions.onError(err);
        }
      }
    }, clampedDelayMs);
  }

  clearAuthState() {
    this.stopAutoRefresh();
    this.inFlightRefreshPromise = null;
    super.clearAuthState();
    removeAccessToken();
  }
}

export default JwtService;
