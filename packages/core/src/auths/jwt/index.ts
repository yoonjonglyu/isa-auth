import { JwtManager } from './jwtManager';

let jwt: JwtManager;

export function configureJwtManager(secret: string) {
  jwt = new JwtManager({ secret });
}

export function isValidToken(token: string): boolean {
  try {
    jwt.verify(token);
    return true;
  } catch {
    return false;
  }
}

export function isExpiredToken(token: string): boolean {
  const decoded = jwt.decode(token);
  const expired =
    decoded && typeof decoded === 'object' && decoded.exp
      ? decoded.exp * 1000
      : Date.now() + 10 * 60 * 1000;
  return Date.now() < expired;
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
