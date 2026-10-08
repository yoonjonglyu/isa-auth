/**
 * OAuth 2.0 PKCE (Proof Key for Code Exchange) utilities
 * Compatible with modern browser Web Crypto API.
 */

import { base64UrlEncode } from '../auths/jwt/jwtUtils';

/**
 * Generates a cryptographically random code verifier string (43~128 chars).
 */
export function generateCodeVerifier(length = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for non-browser environments
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

/**
 * Calculates SHA-256 hash of verifier and encodes it as base64url.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Fallback for simple testing or environments without subtle crypto
  return base64UrlEncode(verifier);
}

export interface BuildAuthorizeUrlOptions {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  responseType?: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  extraParams?: Record<string, string>;
}

/**
 * Builds an OAuth 2.0 authorization URL
 */
export function buildAuthorizeUrl(options: BuildAuthorizeUrlOptions): string {
  const {
    authorizeUrl,
    clientId,
    redirectUri,
    responseType = 'code',
    scope,
    state,
    codeChallenge,
    codeChallengeMethod = 'S256',
    extraParams = {},
  } = options;

  const url = new URL(authorizeUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', responseType);

  if (scope) url.searchParams.set('scope', scope);
  if (state) url.searchParams.set('state', state);
  if (codeChallenge) {
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', codeChallengeMethod);
  }

  for (const [key, value] of Object.entries(extraParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Parses query params from OAuth redirect callback URL
 */
export function parseOAuthCallback(urlOrSearch?: string): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  token?: string;
} {
  let search = '';
  if (urlOrSearch) {
    search = urlOrSearch.includes('?') ? urlOrSearch.split('?')[1] : urlOrSearch;
  } else if (typeof window !== 'undefined') {
    search = window.location.search.slice(1);
  }

  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((val, key) => {
    result[key] = val;
  });

  return result;
}
