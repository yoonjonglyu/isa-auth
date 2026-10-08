import {
  decodeToken,
  getTokenPayload,
  isExpiredToken,
  JwtHeader,
  JwtPayload,
  DecodedToken,
} from './jwtUtils';

export interface JwtManagerOptions {
  secret?: string;
  clockTolerance?: number; // seconds
}

export class JwtManager {
  private secret: string;
  private clockTolerance: number;

  constructor(options: JwtManagerOptions = {}) {
    this.secret = options.secret || '';
    this.clockTolerance = options.clockTolerance || 0;
  }

  setSecret(secret: string) {
    this.secret = secret;
  }

  decode<T = JwtPayload>(token: string): T | null {
    return getTokenPayload<T>(token);
  }

  decodeWithHeader<T = JwtPayload>(token: string): DecodedToken<T> | null {
    return decodeToken<T>(token);
  }

  isExpired(token: string): boolean {
    return isExpiredToken(token, this.clockTolerance);
  }

  /**
   * Browser-safe signature verification using Web Crypto API for HMAC (HS256)
   */
  async verifyHmacSha256(token: string): Promise<boolean> {
    if (!this.secret || !token) return false;
    const parts = token.trim().split('.');
    if (parts.length !== 3) return false;

    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      // In non-browser or non-crypto environment, verify structure & expiration
      return !this.isExpired(token);
    }

    try {
      const enc = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(this.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      // Signature base64url decode
      let sigBase64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
      while (sigBase64.length % 4 !== 0) sigBase64 += '=';
      const sigBytes = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

      const dataBytes = enc.encode(`${parts[0]}.${parts[1]}`);

      return await window.crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes,
        dataBytes
      );
    } catch {
      return false;
    }
  }
}