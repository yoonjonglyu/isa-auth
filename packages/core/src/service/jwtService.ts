import {
  isExpiredToken,
  isValidToken,
  getTokenFromHeader,
  getTokenPayload,
  configureJwtManager,
} from '../auths/jwt';
import { getAccessToken, setAccessToken, removeAccessToken } from '../store';

export function getToken(): string | null {
  return getAccessToken();
}
export function setToken(token: string) {
  setAccessToken(token);
}
export function removeToken() {
  removeAccessToken();
}
export function isValidAccessToken(): boolean {
  const token = getAccessToken() as string;
  return isValidToken(token) ?? false;
}
export function isExpiredAccessToken(): boolean {
  const token = getAccessToken() as string;
  return isExpiredToken(token) ?? false;
}
export function getAccessTokenPayload(token: string): any {
  return getTokenPayload(token);
}
export function getAccessTokenFromHeader(header: string): string | null {
  return getTokenFromHeader(header);
}
export function configureJwt(secret: string) {
  configureJwtManager(secret);
}
