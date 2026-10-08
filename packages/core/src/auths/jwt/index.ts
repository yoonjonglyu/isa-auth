import { JwtManager } from './jwtManager';
import {
  decodeToken,
  isExpiredToken,
  getTokenPayload,
  getTokenFromHeader,
  getTokenTimeRemaining,
  base64UrlDecode,
  base64UrlEncode,
  JwtHeader,
  JwtPayload,
  DecodedToken,
} from './jwtUtils';

let defaultJwtManager = new JwtManager();

export function configureJwtManager(secret: string, clockTolerance?: number) {
  defaultJwtManager = new JwtManager({ secret, clockTolerance });
}

export function isValidToken(token: string): boolean {
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded) return false;
  return !isExpiredToken(token);
}

export {
  JwtManager,
  decodeToken,
  isExpiredToken,
  getTokenPayload,
  getTokenFromHeader,
  getTokenTimeRemaining,
  base64UrlDecode,
  base64UrlEncode,
};

export type { JwtHeader, JwtPayload, DecodedToken };
