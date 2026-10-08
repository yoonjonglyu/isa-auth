/**
 * Role-Based Access Control (RBAC) and Permission Guards
 */

export interface AuthGuardOptions {
  /**
   * Whether authentication is strictly required
   * @default true
   */
  requireAuth?: boolean;

  /**
   * Allowed roles (e.g. ['ADMIN', 'MANAGER'])
   */
  roles?: string | string[];

  /**
   * Required permissions (e.g. ['read:users', 'write:posts'])
   */
  permissions?: string | string[];

  /**
   * Callback when authentication check fails (not logged in)
   */
  onUnauthenticated?: () => void | Promise<void>;

  /**
   * Callback when authorization check fails (insufficient roles/permissions)
   */
  onUnauthorized?: (reason: string) => void | Promise<void>;
}

export interface AuthContext {
  isAuthenticated: boolean;
  roles?: string[];
  permissions?: string[];
}

/**
 * Checks if user has required role(s).
 * If required is an array, defaults to OR condition (match any).
 */
export function checkRole(
  required: string | string[],
  userRoles: string[] = [],
  matchAll = false
): boolean {
  const reqList = Array.isArray(required) ? required : [required];
  if (reqList.length === 0) return true;

  if (matchAll) {
    return reqList.every((r) => userRoles.includes(r));
  }
  return reqList.some((r) => userRoles.includes(r));
}

/**
 * Checks if user has required permission(s).
 */
export function checkPermission(
  required: string | string[],
  userPermissions: string[] = [],
  matchAll = true
): boolean {
  const reqList = Array.isArray(required) ? required : [required];
  if (reqList.length === 0) return true;

  if (matchAll) {
    return reqList.every((p) => userPermissions.includes(p));
  }
  return reqList.some((p) => userPermissions.includes(p));
}

/**
 * Creates a reusable route/navigation guard
 */
export function createAuthGuard(options: AuthGuardOptions) {
  const {
    requireAuth = true,
    roles,
    permissions,
    onUnauthenticated,
    onUnauthorized,
  } = options;

  return async function guard(context: AuthContext): Promise<boolean> {
    if (requireAuth && !context.isAuthenticated) {
      if (onUnauthenticated) await onUnauthenticated();
      return false;
    }

    if (roles) {
      const hasRequiredRole = checkRole(roles, context.roles || []);
      if (!hasRequiredRole) {
        if (onUnauthorized) await onUnauthorized('Insufficient role');
        return false;
      }
    }

    if (permissions) {
      const hasRequiredPerm = checkPermission(permissions, context.permissions || []);
      if (!hasRequiredPerm) {
        if (onUnauthorized) await onUnauthorized('Insufficient permissions');
        return false;
      }
    }

    return true;
  };
}
