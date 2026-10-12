import type { AuthProvider } from '../authProvider';
import { buildAuthorizeUrl } from '../pkce';

export interface LineAuthOptions {
  clientId: string; // Channel ID
  callbackUrl?: string;
  scope?: string; // 'profile openid email'
  state?: string;
  nonce?: string;
  isPopup?: boolean;
  botPrompt?: 'normal' | 'aggressive';
  onSuccess?: (response: any) => void;
  onFail?: (error: any) => void;
}

export class LineAuthProvider implements AuthProvider {
  private clientId: string;
  private callbackUrl: string;
  private scope: string;
  private state?: string;
  private nonce?: string;
  private isPopup: boolean;
  private botPrompt?: string;
  private onSuccess?: (response: any) => void;
  private onFail?: (error: any) => void;
  private accessToken: string | null = null;
  private userInfo: any = null;

  constructor(options: LineAuthOptions) {
    this.clientId = options.clientId;
    this.callbackUrl =
      options.callbackUrl ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    this.scope = options.scope || 'profile openid email';
    this.state = options.state;
    this.nonce = options.nonce;
    this.isPopup = options.isPopup ?? true;
    this.botPrompt = options.botPrompt;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async init(): Promise<void> {}

  buildLoginUrl(): string {
    const state =
      this.state || Math.random().toString(36).substring(2, 15);
    const nonce =
      this.nonce || Math.random().toString(36).substring(2, 15);

    const extraParams: Record<string, string> = { nonce };
    if (this.botPrompt) extraParams.bot_prompt = this.botPrompt;

    return buildAuthorizeUrl({
      authorizeUrl: 'https://access.line.me/oauth2/v2.1/authorize',
      clientId: this.clientId,
      redirectUri: this.callbackUrl,
      responseType: 'code',
      scope: this.scope,
      state,
      extraParams,
    });
  }

  async signIn(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const authUrl = this.buildLoginUrl();

      if (this.isPopup) {
        const width = 500;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'line_oauth_login',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
        if (!popup) {
          window.location.href = authUrl;
        }
      } else {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('[ISA-AUTH] LINE sign-in failed:', err);
      if (this.onFail) this.onFail(err);
    }
  }

  signOut(): void {
    this.accessToken = null;
    this.userInfo = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  async getUserInfo(): Promise<any> {
    return this.userInfo;
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  setUser(user: any) {
    this.userInfo = user;
    if (this.onSuccess) this.onSuccess(user);
  }
}

export default LineAuthProvider;
