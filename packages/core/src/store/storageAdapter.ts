/**
 * Storage adapter interface and implementations for persistence
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
  keys?(): string[];
}

export class MemoryStorageAdapter implements StorageAdapter {
  private cache = new Map<string, string>();

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.cache.set(key, value);
  }
  removeItem(key: string): void {
    this.cache.delete(key);
  }
  clear(): void {
    this.cache.clear();
  }
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * @deprecated ⚠️ SECURITY WARNING:
 * Storing authentication tokens in LocalStorage exposes the application to XSS (Cross-Site Scripting) token theft.
 * DO NOT USE FOR PRODUCTION!
 * For development/prototyping, use 'dev_insecure_localStorage'.
 * For production, use 'memory' (with silent refresh) or 'cookie' (BFF HttpOnly mode).
 */
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to write to localStorage', e);
    }
  }
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to remove from localStorage', e);
    }
  }
  clear(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.clear();
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to clear localStorage', e);
    }
  }
  keys(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      return Object.keys(window.localStorage);
    } catch {
      return [];
    }
  }
}

export class SessionStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to write to sessionStorage', e);
    }
  }
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to remove from sessionStorage', e);
    }
  }
  clear(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.clear();
    } catch (e) {
      console.warn('[ISA-AUTH] Failed to clear sessionStorage', e);
    }
  }
  keys(): string[] {
    if (typeof window === 'undefined' || !window.sessionStorage) return [];
    try {
      return Object.keys(window.sessionStorage);
    } catch {
      return [];
    }
  }
}

/**
 * Cookie / Hybrid Session Storage Adapter
 * Designed for BFF / Server-Side HttpOnly cookie setups.
 * Does NOT persist raw JWT/tokens to local storage (relies on browser cookie jar and withCredentials).
 * Only non-sensitive session metadata (user profile, roles) may optionally be cached in memory.
 */
export class CookieSessionStorageAdapter implements StorageAdapter {
  private memoryCache = new Map<string, string>();
  private persistUserInfo: boolean;

  constructor(options: { persistUserInfo?: boolean } = {}) {
    this.persistUserInfo = options.persistUserInfo ?? true;
  }

  getItem(key: string): string | null {
    // Sensitive token keys return null from client storage in cookie mode
    if (key.includes('token') || key.includes('refresh')) {
      return null;
    }
    return this.memoryCache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (key.includes('token') || key.includes('refresh')) {
      // Intentionally omit saving tokens to client-side storage
      return;
    }
    if (this.persistUserInfo) {
      this.memoryCache.set(key, value);
    }
  }

  removeItem(key: string): void {
    this.memoryCache.delete(key);
  }

  clear(): void {
    this.memoryCache.clear();
  }

  keys(): string[] {
    return Array.from(this.memoryCache.keys());
  }
}
