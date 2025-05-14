import { initState, getState, setState, subscribe } from './store';
import { AUTH_KEY } from '../value';

// Web Components: Custom event for auth state changes
export function watchAuthState<T extends HTMLElement>(
  root: T,
  callback: (auth: boolean) => void,
) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    // 구독자로서 변화 감지
    callback(auth);
    // 커스텀 이벤트도 발송 (웹 컴포넌트나 외부 연동용)
    root.dispatchEvent(new CustomEvent('isa-auth-change', { detail: auth }));
  });
}

// 상태 변경 및 이벤트 전파
export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
}

// 초기 상태 등록
export function initStore(prevState: boolean) {
  initState(AUTH_KEY, prevState ?? false);
}

// 커스텀 훅 스타일로 사용
export function useAuthState() {
  const auth = () => getState<boolean>(AUTH_KEY) ?? false;
  const setAuth = (value: boolean) => setAuthState(value);
  return [auth, setAuth] as [() => boolean, typeof setAuth];
}
/**
 * 아직 여기서 어느 레이어까지 다루어야할지 고민중.일단 state를 다루는 영역까지는 맞는데 과연 binding까지 해야할지?
 */
// Web Component root에 상태 반영
export function AuthProvider<T extends HTMLElement>(root: T) {
  watchAuthState(root, (auth) => {
    if (auth) {
      root.setAttribute('isa-auth', 'true');
    } else {
      root.removeAttribute('isa-auth');
    }
  });
  root.addEventListener('isa-auth-change', (event: Event) => {
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
