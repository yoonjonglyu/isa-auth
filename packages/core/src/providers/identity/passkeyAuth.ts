/**
 * Passkey / WebAuthn (FIDO2) Authentication Provider
 * Biometric authentication via Face ID, Touch ID, Windows Hello, and Hardware Keys.
 */

import type { AuthProvider } from '../authProvider';

export interface PasskeyAuthOptions {
  rpName?: string;
  rpId?: string;
  challengeGenerator?: () => Promise<Uint8Array | string> | Uint8Array | string;
  userName?: string;
  userDisplayName?: string;
  userId?: string;
  onSuccess?: (assertion: PasskeyAssertionResult) => void;
  onFail?: (error: any) => void;
}

export interface PasskeyAssertionResult {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  if (typeof (globalThis as any).Buffer !== 'undefined') {
    const buf = (globalThis as any).Buffer.from(base64url, 'base64url');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class PasskeyAuthProvider implements AuthProvider {
  private rpName: string;
  private rpId?: string;
  private challengeGenerator?: () => Promise<Uint8Array | string> | Uint8Array | string;
  private userName?: string;
  private userDisplayName?: string;
  private userId?: string;
  private onSuccess?: (assertion: PasskeyAssertionResult) => void;
  private onFail?: (error: any) => void;

  private lastAssertion: PasskeyAssertionResult | null = null;

  constructor(options: PasskeyAuthOptions = {}) {
    this.rpName = options.rpName || 'ISA-AUTH Application';
    this.rpId = options.rpId || (typeof window !== 'undefined' ? window.location.hostname : undefined);
    this.challengeGenerator = options.challengeGenerator;
    this.userName = options.userName;
    this.userDisplayName = options.userDisplayName;
    this.userId = options.userId;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async init(): Promise<void> {
    if (typeof window !== 'undefined' && (!window.PublicKeyCredential || !navigator.credentials)) {
      console.warn('[ISA-AUTH] WebAuthn / Passkeys not supported in this browser.');
    }
  }

  /**
   * Helper to register a new Passkey credential
   */
  async registerCredential(options: { challenge?: Uint8Array; userName?: string; userId?: string } = {}): Promise<any> {
    if (typeof window === 'undefined' || !navigator.credentials) {
      throw new Error('WebAuthn is not supported in this environment.');
    }

    const challenge = options.challenge || crypto.getRandomValues(new Uint8Array(32));
    const userName = options.userName || this.userName || 'user@example.com';
    const userId = options.userId || this.userId || 'user_' + Math.random().toString(36).substring(2, 9);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: this.rpName,
          id: this.rpId,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: this.userDisplayName || userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Touch ID / Face ID / Windows Hello
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential;

    return credential;
  }

  /**
   * Performs Passkey authentication (navigator.credentials.get)
   */
  async signIn(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.credentials) {
      const err = new Error('WebAuthn is not supported in this environment.');
      if (this.onFail) this.onFail(err);
      throw err;
    }

    try {
      let challengeBytes: Uint8Array;
      if (this.challengeGenerator) {
        const gen = await this.challengeGenerator();
        challengeBytes = typeof gen === 'string' ? new Uint8Array(base64UrlToBuffer(gen)) : gen;
      } else {
        challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      }

      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: challengeBytes,
          rpId: this.rpId,
          userVerification: 'preferred',
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Passkey authentication was cancelled.');
      }

      const response = credential.response as AuthenticatorAssertionResponse;
      const assertionResult: PasskeyAssertionResult = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        type: 'public-key',
        response: {
          clientDataJSON: bufferToBase64Url(response.clientDataJSON),
          authenticatorData: bufferToBase64Url(response.authenticatorData),
          signature: bufferToBase64Url(response.signature),
          userHandle: response.userHandle ? bufferToBase64Url(response.userHandle) : undefined,
        },
      };

      this.lastAssertion = assertionResult;
      if (this.onSuccess) this.onSuccess(assertionResult);
    } catch (error) {
      if (this.onFail) this.onFail(error);
      throw error;
    }
  }

  signOut(): void {
    this.lastAssertion = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.lastAssertion ? this.lastAssertion.response.signature : null;
  }

  async getUserInfo(): Promise<any> {
    if (!this.lastAssertion) return null;
    return {
      credentialId: this.lastAssertion.id,
      userHandle: this.lastAssertion.response.userHandle,
      passkeyAuthenticated: true,
    };
  }

  getAssertion(): PasskeyAssertionResult | null {
    return this.lastAssertion;
  }
}

export default PasskeyAuthProvider;
