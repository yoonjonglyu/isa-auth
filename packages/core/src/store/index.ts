import { initState, getState, setState, subscribe } from './store';
import { AUTH_KEY, TOKEN_KEY, AUTH_INFO_KEY, AUTH_EVENT } from '../value';

// 초기 상태 등록
export function initStore(prevState: boolean) {
  initState(AUTH_KEY, prevState ?? false);
  initState(TOKEN_KEY, null);
  initState(AUTH_INFO_KEY, null);
}
// auth state
export function getAuthState() {
  return getState<boolean>(AUTH_KEY);
}
export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
}
// access 토큰 state
export function getAccessToken() {
  return getState<string>(TOKEN_KEY);
}
export function setAccessToken(value: string) {
  setState(TOKEN_KEY, value);
}
export function removeAccessToken() {
  setState(TOKEN_KEY, null);
}
// auth info state
export function getAuthInfo() {
  return getState<any>(AUTH_INFO_KEY);
}
export function setAuthInfo(value: any) {
  setState(AUTH_INFO_KEY, value);
}
export function removeAuthInfo() {
  setState(AUTH_INFO_KEY, null);
}

// 커스텀 훅 스타일로 사용
// export function useAuthState() {
//   const auth = () => getState<boolean>(AUTH_KEY) ?? false;
//   const setAuth = (value: boolean) => setAuthState(value);
//   return [auth, setAuth] as [() => boolean, typeof setAuth];
// }
/**
 * 아직 여기서 어느 레이어까지 다루어야할지 고민중.일단 state를 다루는 영역까지는 맞는데 과연 binding까지 해야할지?
 */
// Web Components: Custom event for auth state changes
export function watchAuthState<T extends HTMLElement>(
  callback: (auth: boolean) => void,
) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    // 구독자로서 변화 감지
    callback(auth);
  });
}
// Web Component root에 상태 반영
export function AuthProvider<T extends HTMLElement>(root: T) {
  watchAuthState((auth) => {
    if (auth) {
      root.setAttribute('isa-auth', 'true');
    } else {
      root.removeAttribute('isa-auth');
    }
    // 커스텀 이벤트도 발송 (웹 컴포넌트나 외부 연동용)
    root.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: auth }));
  });
  root.addEventListener(AUTH_EVENT, (event: Event) => {
    const auth = (event as CustomEvent<boolean>).detail;
    if (auth) {
      root.setAttribute('isa-auth', 'true');
    } else {
      root.removeAttribute('isa-auth');
    }
  });

  // 초기 상태 반영
  const auth = getState<boolean>(AUTH_KEY);
  if (auth) {
    root.setAttribute('isa-auth', 'true');
  } else {
    root.removeAttribute('isa-auth');
  }
}
