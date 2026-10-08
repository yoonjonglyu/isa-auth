import { loadCDN } from 'isa-util';
import type { AuthProvider } from './authProvider';

declare global {
  interface Window {
    naver?: any;
  }
}

export interface NaverAuthOptions {
  clientId: string;
  callbackUrl: string;
  isPopup?: boolean;
  loginButtonId?: string;
  callbackHandle?: (status: boolean) => void;
}

export class NaverAuthProvider implements AuthProvider {
  private clientId: string;
  private callbackUrl: string;
  private isPopup: boolean;
  private loginButtonId: string;
  private callbackHandle?: (status: boolean) => void;
  private naverLoginInstance: any;

  constructor(options: NaverAuthOptions) {
    this.clientId = options.clientId;
    this.callbackUrl = options.callbackUrl;
    this.isPopup = options.isPopup ?? true;
    this.loginButtonId = options.loginButtonId ?? 'naverIdLogin';
    this.callbackHandle = options.callbackHandle;
  }

  async loadNaverSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.naver) {
      return;
    }
    await loadCDN('naver-login-sdk', 'https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js', {
      async: true,
      defer: true,
    });
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.loadNaverSdk();

    if (window.naver && window.naver.LoginWithNaverId) {
      this.naverLoginInstance = new window.naver.LoginWithNaverId({
        clientId: this.clientId,
        callbackUrl: this.callbackUrl,
        isPopup: this.isPopup,
        loginButton: { color: 'green', type: 3, height: 48 },
      });
      this.naverLoginInstance.init();
    }
  }

  signIn(): void {
    if (typeof window === 'undefined') return;
    // If native Naver button anchor element exists, click it, or redirect
    const buttonElement = document.getElementById(this.loginButtonId);
    const link = buttonElement?.querySelector('a') as HTMLElement | null;
    if (link) {
      link.click();
    } else {
      const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
        this.callbackUrl
      )}&state=${Math.random().toString(36).substring(2, 15)}`;
      if (this.isPopup) {
        window.open(authUrl, 'naver_login', 'width=500,height=600');
      } else {
        window.location.href = authUrl;
      }
    }
  }

  signOut(): void {
    if (this.naverLoginInstance) {
      this.naverLoginInstance.logout();
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (this.naverLoginInstance && this.naverLoginInstance.accessToken) {
      return this.naverLoginInstance.accessToken.accessToken || null;
    }
    return null;
  }

  async getUserInfo(): Promise<any> {
    if (!this.naverLoginInstance) return null;
    return new Promise((resolve) => {
      this.naverLoginInstance.getLoginStatus((status: boolean) => {
        if (status) {
          resolve(this.naverLoginInstance.user);
        } else {
          resolve(null);
        }
      });
    });
  }
}

export default NaverAuthProvider;
