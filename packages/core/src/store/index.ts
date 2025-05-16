import { initState, getState, setState, subscribe } from './store';
import { AUTH_KEY, TOKEN_KEY, AUTH_INFO_KEY } from '../value';

// 초기 상태 등록
export function initStore(prevState: boolean) {
  initState(AUTH_KEY, prevState ?? false);
  initState(TOKEN_KEY, null);
  initState(AUTH_INFO_KEY, null);
}
// auth state
export function getAuthState() {
  return getState<boolean>(AUTH_KEY) ?? false;
}
export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
}
// access 토큰 state
export function getAccessToken() {
  return getState<string>(TOKEN_KEY) ?? null;
}
export function setAccessToken(value: string) {
  setState(TOKEN_KEY, value);
}
export function removeAccessToken() {
  setState(TOKEN_KEY, null);
}
// auth info state
export function getAuthInfo() {
  return getState<any>(AUTH_INFO_KEY) ?? null;
}
export function setAuthInfo(value: any) {
  setState(AUTH_INFO_KEY, value);
}
export function removeAuthInfo() {
  setState(AUTH_INFO_KEY, null);
}

// subscribe to auth state
export function watchAuthState<T extends HTMLElement>(
  callback: (auth: boolean) => void,
) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    // 구독자로서 변화 감지
    callback(auth);
  });
}
