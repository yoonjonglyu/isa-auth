import {
  isExpiredToken,
  isValidToken,
  getTokenFromHeader,
  getTokenPayload,
  getTokenTimeRemaining,
  configureJwtManager,
  JwtPayload,
} from '../auths/jwt';
import { isNull } from 'isa-util';
import { getAccessToken, setAccessToken, removeAccessToken } from '../store';
import AuthBaseService from './baseAuthService';

class JwtService extends AuthBaseService {
  constructor(secretKey: string = 'isa-auth-default-secret') {
    super();
    this.initStore(false);
    this.configureJwt(secretKey);
  }

  initStore(prevState: boolean) {
    super.initStore(prevState);
  }

  // jwt 설정
  configureJwt(secretKey: string) {
    configureJwtManager(secretKey);
  }

  getAuthState() {
    return super.getAuthState();
  }

  setAuthState(value: boolean) {
    super.setAuthState(value);
  }

  getAuthInfo<T = any>(): T | null {
    return super.getAuthInfo();
  }

  setAuthInfo(value: any) {
    super.setAuthInfo(value);
  }

  watchAuthState<T extends HTMLElement>(callback: (auth: boolean) => void) {
    return super.watchAuthState<T>(callback);
  }

  clearAuthState() {
    super.clearAuthState();
    removeAccessToken();
  }

  // access token 관련 메소드
  getAccessToken(): string | null {
    return getAccessToken() as string | null;
  }

  setAccessToken(value: string) {
    setAccessToken(value);
    if (value) {
      const payload = this.getAccessTokenPayload();
      this.setAuthInfo(payload);
      this.setAuthState(true);
    }
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

  // RBAC / Permissions
  hasRole(role: string): boolean {
    const payload = this.getAccessTokenPayload();
    if (!payload) return false;
    const roles: string[] = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role
      ? [payload.role]
      : [];
    return roles.includes(role);
  }

  hasPermission(permission: string): boolean {
    const payload = this.getAccessTokenPayload();
    if (!payload) return false;
    const permissions: string[] = Array.isArray(payload.permissions)
      ? payload.permissions
      : payload.scope
      ? String(payload.scope).split(' ')
      : [];
    return permissions.includes(permission);
  }

  async refreshToken(
    refreshTokenFn: () => Promise<string>,
  ): Promise<string | null> {
    try {
      const newToken = await refreshTokenFn();
      if (!newToken || typeof newToken !== 'string') {
        throw new Error('Refresh token function did not return a valid token');
      }

      // 만료된 토큰이 새로 반환되었으면 에러
      if (isExpiredToken(newToken)) {
        throw new Error('Newly received token is expired');
      }

      const payload = getTokenPayload(newToken);
      this.setAuthInfo(
        isNull(this.getAuthInfo())
          ? { payload }
          : { ...this.getAuthInfo(), payload },
      );
      this.setAccessToken(newToken);
      return newToken;
    } catch (error) {
      console.error('[ISA-AUTH] Failed to refresh token:', error);
      this.clearAuthState();
      return null;
    }
  }
}

export default JwtService;
