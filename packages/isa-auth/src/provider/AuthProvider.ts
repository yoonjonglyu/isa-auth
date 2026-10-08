import { isNull, isUndefined } from 'isa-util';

export interface IAuthService {
  initStore(prevState?: boolean): void;
  getAuthState(): boolean;
  setAuthState(value: boolean): void;
  getAuthInfo<T = any>(): T | null;
  setAuthInfo(value: any): void;
  watchAuthState(callback: (auth: boolean) => void): void | (() => void);
  clearAuthState(): void;
  getAccessToken?(): string | null;
  setAccessToken?(value: string): void;
  isExpiredAccessToken?(): boolean;
  getAccessTokenPayload?(): any;
  setAccessTokenFromHeader?(header: string): void;
  refreshToken?(refreshTokenFn: () => Promise<string>): Promise<string | null>;
  hasRole?(role: string): boolean;
  hasPermission?(permission: string): boolean;
}

export interface IAuthProvider {
  init(): Promise<void>;
  signIn(): void | Promise<void>;
  signOut(): void;
  getAccessToken(): Promise<string | null> | string | null;
  getUserInfo(): Promise<any>;
}

export interface ILoginButton {
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

export class AuthProvider<
  S extends IAuthService = IAuthService,
  P extends IAuthProvider | null = IAuthProvider | null,
  B extends ILoginButton | null = ILoginButton | null,
> {
  private service: S;
  private provider: P;
  private button: B;

  constructor(service: S, provider: P, button: B) {
    this.service = service;
    this.provider = provider;
    this.button = button;
    this.onClick = this.onClick.bind(this);
    this.init();
  }

  async init(): Promise<void> {
    if (this.provider) {
      await this.provider.init();
    }
  }

  getButton() {
    if (!this.button) return null;
    return {
      ...this.button.toJSON(),
      className: this.button.getButtonClass(),
      onClick: this.onClick,
    };
  }

  async onClick(): Promise<void> {
    await this.signIn();
  }

  async signIn(): Promise<void> {
    if (this.provider) {
      await this.provider.signIn();
      const token = await this.provider.getAccessToken();
      if (token && this.service.setAccessToken) {
        this.service.setAccessToken(token);
      }
      const user = await this.provider.getUserInfo();
      if (user) {
        this.service.setAuthInfo(user);
      }
    } else {
      this.service.setAuthState(true);
    }
  }

  signOut(): void {
    if (this.provider) {
      this.provider.signOut();
    }
    this.service.clearAuthState();
  }

  async refresh(refreshTokenFn: () => Promise<string>): Promise<string | null> {
    if (!this.service.refreshToken) return null;
    return await this.service.refreshToken(refreshTokenFn);
  }

  restore(): void {
    const token = this.service.getAccessToken?.();
    if (token) {
      this.service.setAuthState(true);
    }
  }

  async getUserInfo(): Promise<any> {
    if (this.provider) {
      return await this.provider.getUserInfo();
    }
    return this.service.getAuthInfo();
  }

  getAccessToken(): string | null {
    if (!this.service.getAccessToken) return null;
    return this.service.getAccessToken();
  }

  getAuthState(): boolean {
    return this.service.getAuthState();
  }

  watchAuthState(callback: (auth: boolean) => void) {
    return this.service.watchAuthState(callback);
  }

  hasRole(role: string): boolean {
    return this.service.hasRole ? this.service.hasRole(role) : false;
  }

  hasPermission(permission: string): boolean {
    return this.service.hasPermission ? this.service.hasPermission(permission) : false;
  }
}

export default AuthProvider;
