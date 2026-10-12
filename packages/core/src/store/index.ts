import {
  initState,
  getState,
  setState,
  subscribe,
  subscribeSelector,
  batch,
  resetAllState,
} from './store';
import { AUTH_KEY, TOKEN_KEY, REFRESH_KEY, AUTH_INFO_KEY } from '../value';
import {
  StorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
  CookieSessionStorageAdapter,
} from './storageAdapter';

export type StorageType =
  | 'memory'                    // [RECOMMENDED] Secure in-memory storage (Zero XSS attack surface)
  | 'cookie'                    // [RECOMMENDED] BFF / HttpOnly Cookie mode
  | 'hybrid'                    // Hybrid Mode (Memory token + Cookie session)
  | 'sessionStorage'            // Browser sessionStorage (Tab-scoped)
  | 'dev_insecure_localStorage' // [DEV ONLY] Explicit insecure localStorage for rapid local prototyping
  | 'insecure_localStorage'     // Alias for dev_insecure_localStorage
  | 'localStorage';             // [INSECURE / DEPRECATED] Triggers explicit security warning in console

export interface StorageConfig {
  type?: StorageType | StorageAdapter;
  prefix?: string;
  persistUserInfo?: boolean;
}

function warnInsecureLocalStorage(storageName: string) {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      `⚠️ [ISA-AUTH SECURITY WARNING] '${storageName}' is enabled for session persistence.\n` +
      `Storing authentication tokens in browser localStorage makes your application vulnerable to XSS (Cross-Site Scripting) token theft.\n` +
      `⛔ DO NOT USE IN PRODUCTION!\n` +
      `💡 Recommended production alternatives:\n` +
      `   - 'memory' (In-memory token with silent HttpOnly refresh)\n` +
      `   - 'cookie' (BFF / Server-managed HttpOnly cookies)`
    );
  }
}

// Default storage is secure MemoryStorageAdapter
let currentStorage: StorageAdapter = new MemoryStorageAdapter();
let storagePrefix = '';
let syncRegistered = false;
let syncListener: ((event: StorageEvent) => void) | null = null;

export function getStorageKey(baseKey: string): string {
  return storagePrefix ? `${storagePrefix}_${baseKey}` : baseKey;
}

export function configureStorage(config: StorageType | StorageAdapter | StorageConfig) {
  if (typeof config === 'string' || (config && 'getItem' in config)) {
    // Legacy signature: configureStorage(type)
    if (typeof config === 'string') {
      switch (config) {
        case 'sessionStorage':
          currentStorage = new SessionStorageAdapter();
          break;
        case 'cookie':
        case 'hybrid':
          currentStorage = new CookieSessionStorageAdapter();
          break;
        case 'dev_insecure_localStorage':
        case 'insecure_localStorage':
        case 'localStorage':
          warnInsecureLocalStorage(config);
          currentStorage = new LocalStorageAdapter();
          break;
        case 'memory':
        default:
          currentStorage = new MemoryStorageAdapter();
          break;
      }
    } else {
      currentStorage = config as StorageAdapter;
    }
  } else if (config && typeof config === 'object') {
    // New signature with prefix support
    const { type = 'memory', prefix = '', persistUserInfo = true } = config;
    storagePrefix = prefix;

    if (typeof type === 'string') {
      switch (type) {
        case 'sessionStorage':
          currentStorage = new SessionStorageAdapter();
          break;
        case 'cookie':
        case 'hybrid':
          currentStorage = new CookieSessionStorageAdapter({ persistUserInfo });
          break;
        case 'dev_insecure_localStorage':
        case 'insecure_localStorage':
        case 'localStorage':
          warnInsecureLocalStorage(type);
          currentStorage = new LocalStorageAdapter();
          break;
        case 'memory':
        default:
          currentStorage = new MemoryStorageAdapter();
          break;
      }
    } else {
      currentStorage = type;
    }
  }
}

export function getStorageAdapter(): StorageAdapter {
  return currentStorage;
}

/**
 * Multi-tab synchronization for tokens, refresh tokens, and user profile
 */
export function setupMultiTabSync() {
  if (syncRegistered || typeof window === 'undefined') return;
  syncRegistered = true;

  syncListener = (event: StorageEvent) => {
    const tokenKey = getStorageKey(TOKEN_KEY);
    const refreshKey = getStorageKey(REFRESH_KEY);
    const infoKey = getStorageKey(AUTH_INFO_KEY);

    // 1. 전체 스토리지 클리어된 경우 (localStorage.clear())
    if (event.key === null) {
      batch(() => {
        setState(TOKEN_KEY, null);
        setState(REFRESH_KEY, null);
        setState(AUTH_KEY, false);
        setState(AUTH_INFO_KEY, null);
      });
      return;
    }

    // 2. Access Token 변경 감지
    if (event.key === tokenKey) {
      const newToken = event.newValue;
      batch(() => {
        if (newToken) {
          setState(TOKEN_KEY, newToken);
          setState(AUTH_KEY, true);
        } else {
          setState(TOKEN_KEY, null);
          setState(AUTH_KEY, false);
          setState(AUTH_INFO_KEY, null);
        }
      });
    }

    // 3. Refresh Token 변경 감지
    if (event.key === refreshKey) {
      setState(REFRESH_KEY, event.newValue || null);
    }

    // 4. Auth Info 변경 감지
    if (event.key === infoKey) {
      const newInfoStr = event.newValue;
      let newInfo = null;
      if (newInfoStr) {
        try {
          newInfo = JSON.parse(newInfoStr);
        } catch {
          newInfo = null;
        }
      }
      setState(AUTH_INFO_KEY, newInfo);
    }
  };

  window.addEventListener('storage', syncListener);
}

/**
 * Remove multi-tab sync listener (useful for tests and cleanup)
 */
export function teardownMultiTabSync() {
  if (syncListener && typeof window !== 'undefined') {
    window.removeEventListener('storage', syncListener);
    syncListener = null;
  }
  syncRegistered = false;
}

/**
 * 초기 상태 등록 및 스토리지 복원(Hydration)
 */
export function initStore(prevState: boolean = false) {
  setupMultiTabSync();

  const persistedToken = currentStorage.getItem(getStorageKey(TOKEN_KEY));
  const persistedRefreshToken = currentStorage.getItem(getStorageKey(REFRESH_KEY));
  const isInitiallyAuthed = persistedToken ? true : (prevState ?? false);

  initState(AUTH_KEY, isInitiallyAuthed);
  initState(TOKEN_KEY, persistedToken ?? null);
  initState(REFRESH_KEY, persistedRefreshToken ?? null);

  let initialInfo = null;
  const persistedInfo = currentStorage.getItem(getStorageKey(AUTH_INFO_KEY));
  if (persistedInfo) {
    try {
      initialInfo = JSON.parse(persistedInfo);
    } catch {
      initialInfo = null;
    }
  }
  initState(AUTH_INFO_KEY, initialInfo);
}

// 1. Auth State
export function getAuthState(): boolean {
  return getState<boolean>(AUTH_KEY) ?? false;
}

export function setAuthState(value: boolean) {
  setState(AUTH_KEY, value);
}

// 2. Access Token State
export function getAccessToken(): string | null {
  return getState<string>(TOKEN_KEY) ?? null;
}

export function setAccessToken(value: string | null) {
  const tokenKey = getStorageKey(TOKEN_KEY);
  batch(() => {
    setState(TOKEN_KEY, value);
    if (value) {
      currentStorage.setItem(tokenKey, value);
      setState(AUTH_KEY, true);
    } else {
      currentStorage.removeItem(tokenKey);
      setState(AUTH_KEY, false);
    }
  });
}

export function removeAccessToken() {
  setAccessToken(null);
}

// 3. Refresh Token State
export function getRefreshToken(): string | null {
  return getState<string>(REFRESH_KEY) ?? null;
}

export function setRefreshToken(value: string | null) {
  const refreshKey = getStorageKey(REFRESH_KEY);
  setState(REFRESH_KEY, value);
  if (value) {
    currentStorage.setItem(refreshKey, value);
  } else {
    currentStorage.removeItem(refreshKey);
  }
}

export function removeRefreshToken() {
  setRefreshToken(null);
}

// 4. Auth Info State
export function getAuthInfo<T = any>(): T | null {
  return getState<T>(AUTH_INFO_KEY) ?? null;
}

export function setAuthInfo(value: any) {
  const infoKey = getStorageKey(AUTH_INFO_KEY);
  setState(AUTH_INFO_KEY, value);
  if (value) {
    try {
      currentStorage.setItem(infoKey, JSON.stringify(value));
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to serialize authInfo to storage', e);
    }
  } else {
    currentStorage.removeItem(infoKey);
  }
}

/**
 * Partially updates authInfo (shallow merge)
 */
export function updateAuthInfo<T = any>(partial: Partial<T>) {
  const current = getAuthInfo<T>() || ({} as T);
  const updated = { ...current, ...partial };
  setAuthInfo(updated);
  return updated;
}

export function removeAuthInfo() {
  setAuthInfo(null);
}

/**
 * Clears entire authentication session atomically
 */
export function clearStoreSession() {
  batch(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setAuthInfo(null);
    setAuthState(false);
  });
}

// 5. Watchers & Subscriptions
export function watchAuthState(callback: (auth: boolean) => void) {
  return subscribe<boolean>(AUTH_KEY, (auth) => {
    callback(Boolean(auth));
  });
}

export function watchAuthInfo<T = any>(callback: (info: T | null) => void) {
  return subscribe<T | null>(AUTH_INFO_KEY, callback);
}

export {
  initState,
  getState,
  setState,
  subscribe,
  subscribeSelector,
  batch,
  resetAllState,
  LocalStorageAdapter,
  SessionStorageAdapter,
  MemoryStorageAdapter,
  CookieSessionStorageAdapter,
};
