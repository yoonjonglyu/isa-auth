import type { AuthProvider } from '../authProvider';
import { buildAuthorizeUrl, generateCodeVerifier, generateCodeChallenge } from '../pkce';

export interface GithubAuthOptions {
  clientId: string;
  redirectUri?: string;
  scope?: string;
  isPopup?: boolean;
  state?: string;
  usePkce?: boolean;
  onSuccess?: (response: any) => void;
  onFail?: (error: any) => void;
}

export class GithubAuthProvider implements AuthProvider {
  private clientId: string;
  private redirectUri: string;
  private scope: string;
  private isPopup: boolean;
  private state?: string;
  private usePkce: boolean;
  private onSuccess?: (response: any) => void;
  private onFail?: (error: any) => void;
  private codeVerifier?: string;
  private accessToken: string | null = null;
  private userInfo: any = null;

  constructor(options: GithubAuthOptions) {
    this.clientId = options.clientId;
    this.redirectUri =
      options.redirectUri ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    this.scope = options.scope || 'read:user user:email';
    this.isPopup = options.isPopup ?? true;
    this.state = options.state;
    this.usePkce = options.usePkce ?? true;
    this.onSuccess = options.onSuccess;
    this.onFail = options.onFail;
  }

  async init(): Promise<void> {
    if (this.usePkce) {
      this.codeVerifier = generateCodeVerifier();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('isa_github_code_verifier', this.codeVerifier);
      }
    }
  }

  async buildLoginUrl(): Promise<string> {
    const state =
      this.state || Math.random().toString(36).substring(2, 15);

    let codeChallenge: string | undefined;
    if (this.usePkce && this.codeVerifier) {
      codeChallenge = await generateCodeChallenge(this.codeVerifier);
    }

    return buildAuthorizeUrl({
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      scope: this.scope,
      state,
      codeChallenge,
      codeChallengeMethod: codeChallenge ? 'S256' : undefined,
    });
  }

  async signIn(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const authUrl = await this.buildLoginUrl();

      if (this.isPopup) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'github_oauth_login',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
        if (!popup) {
          window.location.href = authUrl;
        }
      } else {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('[ISA-AUTH] GitHub sign-in failed:', err);
      if (this.onFail) this.onFail(err);
    }
  }

  signOut(): void {
    this.accessToken = null;
    this.userInfo = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('isa_github_code_verifier');
    }
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

export default GithubAuthProvider;
