import { isNull, isUndefined } from 'isa-util';

interface IAuthService {
  initStore(prevState: boolean): void;
  getAuthState(): boolean;
  setAuthState(value: boolean): void;
  getAuthInfo(): any;
  setAuthInfo(value: any): void;
  watchAuthState(callback: (auth: boolean) => void): void | (() => void);
  clearAuthState(): void;
  getAccessToken?(): string | null;
  setAccessToken?(value: string): void;
  isExpiredAccessToken?(): boolean;
  getAccessTokenPayload?(): any;
  setAccessTokenFromHeader?(header: string): void;
  refreshToken?(refreshTokenFn: () => Promise<string>): Promise<string | null>;
}

interface IAuthProvider {
  init(): Promise<void>;
  signIn(): void;
  signOut(): void;
  getAccessToken(): Promise<string | null>;
  getUserInfo(): Promise<any>;
}
`  1q`;

interface ILoginButton {
  getButtonClass(): string;
  toJSON(): {
    id: string;
    type: string;
    provider: string;
    icon: string;
    text: string;
    style: Partial<CSSStyleDeclaration>;
    fullWidth: boolean;
    className: string;
    onClick: Function;
  };
}

class AuthProvider<
  S extends IAuthService,
  P extends IAuthProvider | null,
  B extends ILoginButton,
> {
  private service: S;
  private provider: P;
  private button: B;

  constructor(service: S, provider: P, button: B) {
    this.service = service;
    this.provider = provider;
    this.button = button;
    this.init();
  }
  init() {
    if (!isNull(this.provider)) this.provider.init();
  }
  getbutton() {
    return {
      ...this.button.toJSON(),
      className: this.button.getButtonClass(),
      onClick: this.onClick,
    };
  }
  onClick() {
    if (isNull(this.provider)) return;
    this.provider.signIn();
  }
  async signIn() {
    if (this.service.getAuthState()) return;

    if (!isUndefined(this.service.setAccessToken)) {
      this.service.setAccessToken('');
    }
    this.service.setAuthState(true);
  }
  signOut() {
    if (!this.service.getAuthState() || isNull(this.provider)) return;
    this.provider.signOut();
    this.service.clearAuthState();
  }
  async refrash(cb: () => Promise<string>) {
    if (!this.service.refreshToken) return;
    await this.service.refreshToken(cb);
  }
  restore() {
    const token = this.service.getAccessToken?.();
    if (token) {
      this.service.setAuthState(true);
    }
  }
  async getUserInfo() {
    return await this.provider?.getUserInfo?.();
  }
  getAccessToken() {
    if (!this.service.getAccessToken) return null;
    return this.service.getAccessToken();
  }
  getAuthState() {
    return this.service.getAuthState();
  }
}

export default AuthProvider;
