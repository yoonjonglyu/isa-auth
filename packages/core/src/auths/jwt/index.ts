import { JwtManager } from './jwtManager';

let jwt: JwtManager;

export function configureJwtManager(secret: string) {
  jwt = new JwtManager({ secret });
}

export function isValidToken(token: string): boolean {
  try {
    jwt.verify(token, { algorithms: ['RS256'] });
    return true;
  } catch {
    return false;
  }
}

export function isExpiredToken(token: string): boolean {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    return true; // 만료로 간주
  }

  const expiresAt = decoded.exp * 1000;
  return Date.now() >= expiresAt;
}

export function getTokenPayload(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}
export function getTokenFromHeader(header: string): string | null {
  if (!header) return null;

  const parts = header.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1]?.trim();
  return token || null;
}
