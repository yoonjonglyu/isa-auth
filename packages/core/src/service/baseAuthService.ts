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
}
export function getIsAuth() {
  return getAuthState();
}
export function setIsAuth(value: boolean) {
  setAuthState(value);
}

export function getInfo() {
  return getAuthInfo();
}
export function setInfo(value: any) {
  setAuthInfo(value);
}
export function watchAuthStateService<T extends HTMLElement>(
  callback: (auth: boolean) => void,
) {
  return watchAuthState<T>(callback);
}
export function clearAuthService() {
  setAuthState(false);
  setAuthInfo(null);
}
export function removeAuthService() {
  setAuthState(false);
  setAuthInfo(null);
}
