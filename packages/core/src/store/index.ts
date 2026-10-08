import { initState, getState, setState, subscribe } from './store';
import { AUTH_KEY, TOKEN_KEY, AUTH_INFO_KEY } from '../value';
import {
  StorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
} from './storageAdapter';

export type StorageType = 'localStorage' | 'sessionStorage' | 'memory';

let currentStorage: StorageAdapter = new LocalStorageAdapter();
let syncRegistered = false;

export function configureStorage(type: StorageType | StorageAdapter) {
  if (typeof type === 'string') {
    switch (type) {
      case 'sessionStorage':
        currentStorage = new SessionStorageAdapter();
        break;
      case 'memory':
        currentStorage = new MemoryStorageAdapter();
        break;
      case 'localStorage':
      default:
        currentStorage = new LocalStorageAdapter();
        break;
    }
  } else {
    currentStorage = type;
  }
}

function setupMultiTabSync() {
  if (syncRegistered || typeof window === 'undefined') return;
  syncRegistered = true;

  window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) {
      const newToken = event.newValue;
      if (newToken) {
        setState(TOKEN_KEY, newToken);
        setState(AUTH_KEY, true);
      } else {
        setState(TOKEN_KEY, null);
        setState(AUTH_KEY, false);
        setState(AUTH_INFO_KEY, null);
      }
    }
  });
}

// 초기 상태 등록 및 스토리지 복원(Hydration)
export function initStore(prevState: boolean = false) {
  setupMultiTabSync();

  const persistedToken = currentStorage.getItem(TOKEN_KEY);
  const isInitiallyAuthed = persistedToken ? true : (prevState ?? false);

  initState(AUTH_KEY, isInitiallyAuthed);
  initState(TOKEN_KEY, persistedToken ?? null);

  let initialInfo = null;
  const persistedInfo = currentStorage.getItem(AUTH_INFO_KEY);
  if (persistedInfo) {
    try {
      initialInfo = JSON.parse(persistedInfo);
    } catch {
      initialInfo = null;
    }
  }
  initState(AUTH_INFO_KEY, initialInfo);
}

// auth state
export function getAuthState(): boolean {
  return getState<boolean>(AUTH_KEY) ?? false;
}

export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
}

// access 토큰 state
export function getAccessToken(): string | null {
  return getState<string>(TOKEN_KEY) ?? null;
}

export function setAccessToken(value: string | null) {
  setState(TOKEN_KEY, value);
  if (value) {
    currentStorage.setItem(TOKEN_KEY, value);
    setState(AUTH_KEY, true);
  } else {
    currentStorage.removeItem(TOKEN_KEY);
    setState(AUTH_KEY, false);
  }
}

export function removeAccessToken() {
  setAccessToken(null);
}

// auth info state
export function getAuthInfo<T = any>(): T | null {
  return getState<T>(AUTH_INFO_KEY) ?? null;
}

export function setAuthInfo(value: any) {
  setState(AUTH_INFO_KEY, value);
  if (value) {
    try {
      currentStorage.setItem(AUTH_INFO_KEY, JSON.stringify(value));
    } catch {
      // Ignore serialization issues
    }
  } else {
    currentStorage.removeItem(AUTH_INFO_KEY);
  }
}

export function removeAuthInfo() {
  setAuthInfo(null);
}

// subscribe to auth state
export function watchAuthState<T extends HTMLElement>(
  callback: (auth: boolean) => void,
) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    callback(Boolean(auth));
  });
}

export {
  initState,
  getState,
  setState,
  subscribe,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
};
