import {
  isExpiredToken,
  isValidToken,
  getTokenFromHeader,
  getTokenPayload,
  configureJwtManager,
} from '../auths/jwt';
import { isNull } from 'isa-util';
import { getAccessToken, setAccessToken, removeAccessToken } from '../store';
import AuthBaseService from './baseAuthService';

class JwtService extends AuthBaseService {
  constructor(secret: string) {
    super();
    this.initStore(false);
    this.configureJwt(secret);
  }
  initStore(prevState: boolean) {
    super.initStore(prevState);
  }
  // jwt secret 설정
  configureJwt(secret: string) {
    configureJwtManager(secret);
  }
  getAuthState() {
    return super.getAuthState();
  }
  setAuthState(value: boolean) {
    super.setAuthState(value);
  }
  getAuthInfo() {
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
  getAccessToken() {
    return getAccessToken();
  }
  setAccessToken(value: string) {
    setAccessToken(value);
  }
  isValidAccessToken() {
    const token = getAccessToken() as string;
    return isValidToken(token) ?? false;
  }
  isExpiredAccessToken() {
    const token = getAccessToken() as string;
    return isExpiredToken(token) ?? false;
  }
  getAccessTokenPayload() {
    const token = getAccessToken() as string;
    return getTokenPayload(token);
  }
  setAccessTokenFromHeader(header: string) {
    const token = getTokenFromHeader(header);
    if (!token) return;
    setAccessToken(token);
  }
  async refreshToken(
    refreshTokenFn: () => Promise<string>,
  ): Promise<string | null> {
    try {
      const newToken = await refreshTokenFn();
      
      if (!isValidToken(newToken)) throw new Error('Invalid token');
      const payload = getTokenPayload(newToken);
      this.setAuthInfo(
        isNull(this.getAuthInfo())
          ? { payload }
          : { ...this.getAuthInfo(), payload },
      );
      setAccessToken(newToken);
      return newToken;
    } catch (error) {
      this.clearAuthState();
      return null;
    }
  }
}

export default JwtService;
