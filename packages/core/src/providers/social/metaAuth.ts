import { loadCDN } from 'isa-util';
import type { AuthProvider } from '../authProvider';
import { buildAuthorizeUrl } from '../pkce';

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export interface MetaAuthOptions {
  appId: string; // Meta / Facebook App ID
  version?: string; // Graph API version (default: 'v19.0')
  redirectUri?: string;
  scope?: string; // default: 'public_profile,email'
  isPopup?: boolean;
  onSuccess?: (response: any) => void;
  onFail?: (error: any) => void;
}

export class MetaAuthProvider implements AuthProvider {
  private appId: string;
  private version: string;
  private redirectUri?: string;
  private scope: string;
  private isPopup: boolean;
  private onSuccess?: (response: any) => void;
  private onFail?: (error: any) => void;
  private accessToken: string | null = null;
  private userInfo: any = null;

  constructor(options: MetaAuthOptions) {
    this.appId = options.appId;
    this.version = options.version || 'v19.0';
    this.redirectUri = options.redirectUri;
    this.scope = options.scope || 'public_profile,email';
    this.isPopup = options.isPopup ?? true;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async loadFacebookSdk(): Promise<void> {
    if (typeof window !== 'undefined' && window.FB) {
      return;
    }
    await loadCDN('facebook-jssdk', 'https://connect.facebook.net/en_US/sdk.js', {
      async: true,
      defer: true,
    });
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.loadFacebookSdk();

    if (window.FB) {
      window.FB.init({
        appId: this.appId,
        cookie: true,
        xfbml: true,
        version: this.version,
      });
    }
  }

  signIn(): void {
    if (typeof window === 'undefined') return;

    if (window.FB && this.isPopup) {
      window.FB.login(
        (response: any) => {
          if (response.authResponse) {
            this.accessToken = response.authResponse.accessToken;
            if (this.onSuccess) this.onSuccess(response.authResponse);
          } else {
            const err = new Error('Facebook login cancelled or not authorized');
            if (this.onFail) this.onFail(err);
          }
        },
        { scope: this.scope }
      );
    } else {
      // Fallback to OAuth 2.0 Web Dialog
      const redirectUri =
        this.redirectUri || (typeof window !== 'undefined' ? window.location.origin : '');
      const authUrl = buildAuthorizeUrl({
        authorizeUrl: `https://www.facebook.com/${this.version}/dialog/oauth`,
        clientId: this.appId,
        redirectUri,
        scope: this.scope,
        responseType: 'token',
      });

      if (this.isPopup) {
        window.open(authUrl, 'facebook_login', 'width=600,height=700');
      } else {
        window.location.href = authUrl;
      }
    }
  }

  signOut(): void {
    if (typeof window !== 'undefined' && window.FB) {
      window.FB.logout(() => {
        this.accessToken = null;
        this.userInfo = null;
      });
    } else {
      this.accessToken = null;
      this.userInfo = null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getUserInfo(): Promise<any> {
    if (typeof window === 'undefined' || !window.FB || !this.accessToken) {
      return this.userInfo;
    }

    return new Promise((resolve) => {
      window.FB.api('/me', { fields: 'id,name,email,picture' }, (res: any) => {
        this.userInfo = res;
        resolve(res);
      });
    });
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  setUser(user: any) {
    this.userInfo = user;
    if (this.onSuccess) this.onSuccess(user);
  }
}

// Facebook alias export
export const FacebookAuthProvider = MetaAuthProvider;
export type FacebookAuthOptions = MetaAuthOptions;
export default MetaAuthProvider;
