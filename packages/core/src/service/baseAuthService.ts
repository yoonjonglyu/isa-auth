import {
  getAuthState,
  getAuthInfo,
  setAuthInfo,
  setAuthState,
  watchAuthState,
} from '../store';

class AuthBaseService {
  constructor() {
    // 초기 상태 등록
    this.initStore(false);
  }

  initStore(prevState: boolean) {
    setAuthState(prevState);
    setAuthInfo(null);
  }
  getAuthState() {
    return getAuthState();
  }
  setAuthState(value: boolean) {
    setAuthState(value);
  }
  getAuthInfo() {
    return getAuthInfo();
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
