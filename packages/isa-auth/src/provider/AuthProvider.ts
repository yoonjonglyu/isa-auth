import AuthCore from 'isa-auth-core';
import { isNull } from 'isa-util';

const BaseCore = new AuthCore({ providerType: 'base' });

const BaseService = BaseCore.getService();
const button = BaseCore.getButton();

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
    };
  }
  signin() {}
  signout() {}
}
const test = new AuthProvider<typeof BaseService, null, typeof button>(
  BaseService,
  null,
  button,
);
export default AuthProvider;
