/**
 * Web3 Authentication Provider (SIWE - EIP-4361 Sign-In with Ethereum)
 */

import type { AuthProvider } from './authProvider';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface SiweMessageParams {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
}

export interface Web3AuthOptions {
  domain?: string;
  statement?: string;
  chainId?: number;
  onSuccess?: (result: Web3AuthResult) => void;
  onFail?: (error: any) => void;
  nonceGenerator?: () => Promise<string> | string;
}

export interface Web3AuthResult {
  address: string;
  signature: string;
  message: string;
  chainId: number;
}

export function formatSiweMessage(params: SiweMessageParams): string {
  const version = params.version || '1';
  const statement = params.statement || 'Sign in with Ethereum to the application.';
  const issuedAt = params.issuedAt || new Date().toISOString();

  let message = `${params.domain} wants you to sign in with your Ethereum account:\n${params.address}\n\n`;
  message += `${statement}\n\n`;
  message += `URI: ${params.uri}\n`;
  message += `Version: ${version}\n`;
  message += `Chain ID: ${params.chainId}\n`;
  message += `Nonce: ${params.nonce}\n`;
  message += `Issued At: ${issuedAt}`;

  if (params.expirationTime) {
    message += `\nExpiration Time: ${params.expirationTime}`;
  }

  return message;
}

export class Web3AuthProvider implements AuthProvider {
  private domain: string;
  private statement?: string;
  private chainId: number;
  private onSuccess?: (result: Web3AuthResult) => void;
  private onFail?: (error: any) => void;
  private nonceGenerator?: () => Promise<string> | string;

  private connectedAddress: string | null = null;
  private lastSignature: string | null = null;

  constructor(options: Web3AuthOptions = {}) {
    this.domain = options.domain || (typeof window !== 'undefined' ? window.location.host : 'localhost');
    this.statement = options.statement;
    this.chainId = options.chainId || 1;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
    this.nonceGenerator = options.nonceGenerator;
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.warn('[ISA-AUTH] No EIP-1193 compatible Ethereum wallet detected.');
    }
  }

  async signIn(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      const err = new Error('No Ethereum wallet detected (e.g. MetaMask).');
      if (this.onFail) this.onFail(err);
      throw err;
    }

    try {
      // 1. Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      this.connectedAddress = address;

      // 2. Fetch or generate nonce
      const nonce = this.nonceGenerator
        ? await this.nonceGenerator()
        : Math.random().toString(36).substring(2, 12);

      // 3. Format SIWE message
      const message = formatSiweMessage({
        domain: this.domain,
        address,
        statement: this.statement,
        uri: window.location.origin,
        chainId: this.chainId,
        nonce,
      });

      // 4. Request personal_sign
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      this.lastSignature = signature;

      const result: Web3AuthResult = {
        address,
        signature,
        message,
        chainId: this.chainId,
      };

      if (this.onSuccess) {
        this.onSuccess(result);
      }
    } catch (error) {
      if (this.onFail) this.onFail(error);
      throw error;
    }
  }

  signOut(): void {
    this.connectedAddress = null;
    this.lastSignature = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.lastSignature;
  }

  async getUserInfo(): Promise<any> {
    return {
      address: this.connectedAddress,
      chainId: this.chainId,
    };
  }
}

export default Web3AuthProvider;
