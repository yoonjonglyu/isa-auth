/**
 * Authentication Lifecycle Event & Hook System
 */

export type AuthLifecycleEvent =
  | 'signIn'
  | 'signOut'
  | 'tokenExpired'
  | 'tokenRefreshed'
  | 'error';

export type LifecycleListener<T = any> = (data?: T) => void | Promise<void>;

export class AuthLifecycleManager {
  private listeners = new Map<AuthLifecycleEvent, Set<LifecycleListener>>();

  on(event: AuthLifecycleEvent, listener: LifecycleListener): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);

    return () => {
      set.delete(listener);
    };
  }

  onSignIn(listener: LifecycleListener<{ user?: any; token?: string }>) {
    return this.on('signIn', listener);
  }

  onSignOut(listener: LifecycleListener<void>) {
    return this.on('signOut', listener);
  }

  onTokenExpired(listener: LifecycleListener<void>) {
    return this.on('tokenExpired', listener);
  }

  onTokenRefreshed(listener: LifecycleListener<{ token: string }>) {
    return this.on('tokenRefreshed', listener);
  }

  onError(listener: LifecycleListener<{ error: any; phase?: string }>) {
    return this.on('error', listener);
  }

  async emit(event: AuthLifecycleEvent, data?: any) {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    for (const listener of set) {
      try {
        await listener(data);
      } catch (err) {
        console.error(`[ISA-AUTH] Error in lifecycle listener for event "${event}":`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
