import {
  initState,
  getState,
  setState,
  subscribe,
} from './store';

const AUTH_KEY = 'isa-auth';

// Web Components: Custom event for auth state changes
export function watchAuthState(callback: (auth: boolean) => void) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    // 구독자로서 변화 감지
    callback(auth);
    // 커스텀 이벤트도 발송 (웹 컴포넌트나 외부 연동용)
    window.dispatchEvent(new CustomEvent('isa-auth-change', { detail: auth }));
  });
}

// 상태 변경 및 이벤트 전파
export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
  // 커스텀 이벤트 전파는 subscribe 쪽에서 담당
}

// 초기 상태 등록
export function initStore(prevState: boolean) {
  initState(AUTH_KEY, prevState ?? false);
}

// 커스텀 훅 스타일로 사용
export function useAuthState() {
  const auth = getState<boolean>(AUTH_KEY) ?? false;
  const setAuth = (value: boolean) => setAuthState(value);
  return [auth, setAuth] as [boolean, typeof setAuth];
}

// Web Component root에 상태 반영
export function AuthProvider(root: HTMLElement) {
  watchAuthState((auth) => {
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
