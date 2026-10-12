import { loadCDN } from 'isa-util';
import type { AuthProvider } from '../authProvider';

declare global {
  interface Window {
    AppleID?: any;
  }
}

export interface AppleAuthOptions {
  clientId: string; // Service ID (e.g. com.example.app.service)
  redirectURI?: string;
  scope?: string; // e.g. 'name email'
  state?: string;
  nonce?: string;
  usePopup?: boolean;
  onSuccess?: (response: any) => void;
  onFail?: (error: any) => void;
}

export class AppleAuthProvider implements AuthProvider {
  private clientId: string;
  private redirectURI: string;
  private scope: string;
  private state?: string;
  private nonce?: string;
  private usePopup: boolean;
  private onSuccess?: (response: any) => void;
  private onFail?: (error: any) => void;
  private idToken: string | null = null;
  private userInfo: any = null;

  constructor(options: AppleAuthOptions) {
    this.clientId = options.clientId;
    this.redirectURI =
      options.redirectURI ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    this.scope = options.scope || 'name email';
    this.state = options.state;
    this.nonce = options.nonce;
    this.usePopup = options.usePopup ?? true;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async loadAppleSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.AppleID && window.AppleID.auth) {
      return;
    }
    await loadCDN(
      'apple-auth-sdk',
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js',
      { async: true, defer: true }
    );
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.loadAppleSdk();

    if (window.AppleID && window.AppleID.auth) {
      window.AppleID.auth.init({
        clientId: this.clientId,
        scope: this.scope,
        redirectURI: this.redirectURI,
        state: this.state || Math.random().toString(36).substring(2, 15),
        nonce: this.nonce,
        usePopup: this.usePopup,
      });
    }
  }

  async signIn(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!window.AppleID || !window.AppleID.auth) {
      console.error('[ISA-AUTH] Apple Sign-In SDK is not loaded');
      return;
    }

    try {
      const response = await window.AppleID.auth.signIn();
      if (response && response.authorization) {
        this.idToken = response.authorization.id_token;
        this.userInfo = response.user || null;
        if (this.onSuccess) {
          this.onSuccess(response);
        }
      }
    } catch (error) {
      console.error('[ISA-AUTH] Apple sign-in failed:', error);
      if (this.onFail) {
        this.onFail(error);
      }
    }
  }

  signOut(): void {
    this.idToken = null;
    this.userInfo = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.idToken;
  }

  async getUserInfo(): Promise<any> {
    return this.userInfo;
  }
}

export default AppleAuthProvider;
