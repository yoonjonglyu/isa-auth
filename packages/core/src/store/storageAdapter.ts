/**
 * Storage adapter interface and implementations for persistence
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
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
}

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
}
