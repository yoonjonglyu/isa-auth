import {
  initStore as setupStore,
  getAuthState,
  getAuthInfo,
  setAuthInfo,
  updateAuthInfo,
  setAuthState,
  watchAuthState,
  watchAuthInfo,
  clearStoreSession,
} from '../store';

export class AuthBaseService {
  constructor() {
    this.initStore(false);
  }

  initStore(prevState: boolean = false) {
    setupStore(prevState);
  }

  getAuthState(): boolean {
    return getAuthState();
  }

  isAuthenticated(): boolean {
    return this.getAuthState();
  }

  setAuthState(value: boolean) {
    setAuthState(value);
  }

  getAuthInfo<T = any>(): T | null {
    return getAuthInfo<T>();
  }

  setAuthInfo(value: any) {
    setAuthInfo(value);
  }

  updateAuthInfo<T = any>(partial: Partial<T>): T {
    return updateAuthInfo<T>(partial);
  }

  watchAuthState(callback: (auth: boolean) => void) {
    return watchAuthState(callback);
  }

  watchAuthInfo<T = any>(callback: (info: T | null) => void) {
    return watchAuthInfo<T>(callback);
  }

  clearAuthState() {
    clearStoreSession();
  }
}

export default AuthBaseService;
