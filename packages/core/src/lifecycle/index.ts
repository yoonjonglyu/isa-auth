/**
 * Authentication & Authorization Lifecycle Event & Hook System
 */

export type AuthLifecycleEvent =
  | 'signIn'
  | 'signOut'
  | 'tokenExpired'
  | 'tokenRefreshed'
  | 'error'
  | 'unauthorized'
  | 'accessDenied'
  | 'roleChanged'
  | 'permissionChanged';

export type LifecycleListener<T = any> = (data?: T) => void | Promise<void>;

export interface UnauthorizedEventData {
  reason: string;
  result?: any;
  context?: any;
  timestamp?: number;
}

export interface AccessDeniedEventData {
  reason: string;
  result?: any;
  context?: any;
  target?: string;
  timestamp?: number;
}

export interface RoleChangedEventData {
  roles: string[];
  previousRoles?: string[];
}

export interface PermissionChangedEventData {
  permissions: string[];
  previousPermissions?: string[];
}

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

  /**
   * Called when authentication or authorization check fails
   */
  onUnauthorized(listener: LifecycleListener<UnauthorizedEventData>) {
    return this.on('unauthorized', listener);
  }

  /**
   * Called when access to a resource/route is denied by an auth guard
   */
  onAccessDenied(listener: LifecycleListener<AccessDeniedEventData>) {
    return this.on('accessDenied', listener);
  }

  /**
   * Called when the active user's roles change
   */
  onRoleChanged(listener: LifecycleListener<RoleChangedEventData>) {
    return this.on('roleChanged', listener);
  }

  /**
   * Called when the active user's permissions change
   */
  onPermissionChanged(listener: LifecycleListener<PermissionChangedEventData>) {
    return this.on('permissionChanged', listener);
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

export default AuthLifecycleManager;
