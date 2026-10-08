import {
  initStore as setupStore,
  getAuthState,
  getAuthInfo,
  setAuthInfo,
  setAuthState,
  watchAuthState,
} from '../store';

class AuthBaseService {
  constructor() {
    this.initStore(false);
  }

  initStore(prevState: boolean = false) {
    setupStore(prevState);
  }
  getAuthState() {
    return getAuthState();
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
  watchAuthState<T extends HTMLElement>(
    callback: (auth: boolean) => void,
  ) {
    return watchAuthState<T>(callback);
  }
  clearAuthState() {
    setAuthState(false);
    setAuthInfo(null);
  }
}

export default AuthBaseService;
