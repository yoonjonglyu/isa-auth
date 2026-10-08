/**
 * Browser-friendly JWT utilities (No Node.js dependencies)
 * Fully compatible with Web Crypto API and modern browsers.
 */

export interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
  [key: string]: any;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  roles?: string[];
  permissions?: string[];
  [key: string]: any;
}

export interface DecodedToken<T = JwtPayload> {
  header: JwtHeader;
  payload: T;
  signature: string;
}

/**
 * Decodes base64url string to unicode string (browser-safe)
 */
export function base64UrlDecode(str: string): string {
  // Replace base64url characters with standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  if (typeof atob === 'function') {
    const binaryStr = atob(base64);
    const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // Node.js fallback (for testing/SSR)
  const nodeBuffer = (globalThis as any).Buffer;
  if (typeof nodeBuffer !== 'undefined') {
    return nodeBuffer.from(base64, 'base64').toString('utf-8');
  }

  throw new Error('No base64 decoder available in the current environment');
}

/**
 * Encodes string to base64url (browser-safe)
 */
export function base64UrlEncode(str: string): string {
  let base64 = '';
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(str);
    const binary = String.fromCharCode(...bytes);
    base64 = btoa(binary);
  } else {
    const nodeBuffer = (globalThis as any).Buffer;
    if (typeof nodeBuffer !== 'undefined') {
      base64 = nodeBuffer.from(str, 'utf-8').toString('base64');
    } else {
      throw new Error('No base64 encoder available');
    }
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Parses a JWT token into header, payload, and signature without verifying.
 */
export function decodeToken<T = JwtPayload>(token: string): DecodedToken<T> | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);

    const header = JSON.parse(headerStr) as JwtHeader;
    const payload = JSON.parse(payloadStr) as T;

    return {
      header,
      payload,
      signature: parts[2],
    };
  } catch (err) {
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * @param token JWT string
 * @param clockToleranceSeconds optional clock skew tolerance in seconds (default: 0)
 */
export function isExpiredToken(token: string, clockToleranceSeconds = 0): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.payload || typeof decoded.payload.exp !== 'number') {
    return true; // Treat invalid or exp-missing token as expired
  }

  const expMs = (decoded.payload.exp + clockToleranceSeconds) * 1000;
  return Date.now() >= expMs;
}

/**
 * Returns the expiration remaining time in milliseconds.
 * Returns 0 if already expired or invalid.
 */
export function getTokenTimeRemaining(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.payload || typeof decoded.payload.exp !== 'number') {
    return 0;
  }
  const expMs = decoded.payload.exp * 1000;
  const diff = expMs - Date.now();
  return diff > 0 ? diff : 0;
}

/**
 * Extracts payload object from JWT token.
 */
export function getTokenPayload<T = JwtPayload>(token: string): T | null {
  const decoded = decodeToken<T>(token);
  return decoded ? decoded.payload : null;
}

/**
 * Extracts bearer token string from HTTP Authorization header.
 * Example: 'Bearer eyJhbGciOi...' -> 'eyJhbGciOi...'
 */
export function getTokenFromHeader(header: string): string | null {
  if (!header || typeof header !== 'string') return null;

  const parts = header.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim() || null;
  }
  return null;
}
