import { loadCDN } from 'isa-util';
import type { AuthProvider } from './authProvider';

declare global {
  interface Window {
    Kakao?: any;
  }
}

export interface KakaoAuthOptions {
  javascriptKey: string;
  redirectUri?: string;
  scope?: string;
  onSuccess?: (authObj: any) => void;
  onFail?: (error: any) => void;
}

export class KakaoAuthProvider implements AuthProvider {
  private javascriptKey: string;
  private redirectUri?: string;
  private scope?: string;
  private onSuccess?: (authObj: any) => void;
  private onFail?: (error: any) => void;

  constructor(options: KakaoAuthOptions) {
    this.javascriptKey = options.javascriptKey;
    this.redirectUri = options.redirectUri;
    this.scope = options.scope;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async loadKakaoSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.Kakao) {
      return;
    }
    await loadCDN('kakao-sdk', 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js', {
      async: true,
      defer: true,
    });
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.loadKakaoSdk();
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(this.javascriptKey);
    }
  }

  signIn(): void {
    if (typeof window === 'undefined' || !window.Kakao) {
      console.error('[ISA-AUTH] Kakao SDK not loaded');
      return;
    }

    if (this.redirectUri) {
      window.Kakao.Auth.authorize({
        redirectUri: this.redirectUri,
        scope: this.scope,
      });
    } else {
      window.Kakao.Auth.login({
        scope: this.scope,
        success: (authObj: any) => {
          if (this.onSuccess) this.onSuccess(authObj);
        },
        fail: (err: any) => {
          if (this.onFail) this.onFail(err);
        },
      });
    }
  }

  signOut(): void {
    if (typeof window !== 'undefined' && window.Kakao && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        console.log('[ISA-AUTH] Kakao logged out');
      });
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (typeof window !== 'undefined' && window.Kakao) {
      return window.Kakao.Auth.getAccessToken() || null;
    }
    return null;
  }

  async getUserInfo(): Promise<any> {
    if (typeof window === 'undefined' || !window.Kakao) return null;

    return new Promise((resolve, reject) => {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: (response: any) => resolve(response),
        fail: (error: any) => reject(error),
      });
    });
  }
}

export default KakaoAuthProvider;
