/**
 * Role-Based Access Control (RBAC) and Permission Guards
 * Supports wildcards, role hierarchy, custom predicates, and lifecycle callbacks.
 */

export type MatchMode = 'any' | 'all';

export type GuardFailureReason =
  | 'UNAUTHENTICATED'
  | 'INSUFFICIENT_ROLES'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'CUSTOM_VALIDATION_FAILED';

export interface GuardResult {
  allowed: boolean;
  reason?: GuardFailureReason;
  message?: string;
  missingRoles?: string[];
  missingPermissions?: string[];
}

export interface AuthContext {
  isAuthenticated: boolean;
  roles?: string[];
  permissions?: string[];
  user?: any;
  [key: string]: any;
}

export type RoleHierarchyMap = Record<string, string[]>;

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
   * Role match strategy ('any' = match at least one, 'all' = match all)
   * @default 'any'
   */
  roleMatch?: MatchMode;

  /**
   * Optional role hierarchy mapping (e.g. { ADMIN: ['MANAGER', 'USER'] })
   */
  roleHierarchy?: RoleHierarchyMap;

  /**
   * Required permissions (e.g. ['read:users', 'write:*'])
   */
  permissions?: string | string[];

  /**
   * Permission match strategy ('any' = match at least one, 'all' = match all)
   * @default 'all'
   */
  permissionMatch?: MatchMode;

  /**
   * Custom validation predicate for attribute-based or contextual checks (ABAC)
   */
  validate?: (context: AuthContext) => boolean | Promise<boolean>;

  /**
   * Target resource or route identifier for telemetry/logging
   */
  target?: string;

  /**
   * Callback when authentication check fails (not logged in)
   */
  onUnauthenticated?: (context: AuthContext) => void | Promise<void>;

  /**
   * Callback when authorization check fails (insufficient roles/permissions/validation)
   */
  onUnauthorized?: (
    reason: string,
    context: AuthContext,
    result?: GuardResult
  ) => void | Promise<void>;

  /**
   * Callback specifically when roles or permissions are missing (403 Forbidden scenario)
   */
  onForbidden?: (
    missing: { roles?: string[]; permissions?: string[] },
    context: AuthContext
  ) => void | Promise<void>;

  /**
   * Callback when authorization check succeeds
   */
  onSuccess?: (context: AuthContext) => void | Promise<void>;

  /**
   * Global evaluation callback triggered on every guard check
   */
  onEvaluate?: (result: GuardResult, context: AuthContext) => void | Promise<void>;
}

/**
 * Resolves all inherited roles given a user's direct roles and a hierarchy map.
 */
export function resolveInheritedRoles(
  userRoles: string[] = [],
  hierarchy?: RoleHierarchyMap
): string[] {
  if (!hierarchy || Object.keys(hierarchy).length === 0) {
    return Array.from(new Set(userRoles));
  }

  const resolved = new Set<string>(userRoles);
  const queue = [...userRoles];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const inherited = hierarchy[current];
    if (inherited && Array.isArray(inherited)) {
      for (const role of inherited) {
        if (!resolved.has(role)) {
          resolved.add(role);
          queue.push(role);
        }
      }
    }
  }

  return Array.from(resolved);
}

/**
 * Checks if a user permission satisfies a required permission pattern.
 * Supports wildcards:
 * - '*' matches everything (superuser)
 * - 'users:*' matches 'users:read', 'users:create'
 * - '*:read' matches 'posts:read', 'users:read'
 */
export function matchPermissionRule(pattern: string, userPerm: string): boolean {
  if (userPerm === '*' || pattern === '*' || userPerm === pattern) {
    return true;
  }

  // Convert pattern to regex
  // E.g. "users:*" -> /^users:[^:]+$/ or /^users:.*$/
  const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  try {
    const regex = new RegExp(regexStr);
    if (regex.test(userPerm)) return true;
  } catch {
    // Fallback to literal check
  }

  // Also check if user holds a wildcard grant that covers the requested pattern
  // E.g. User has "users:*", pattern is "users:create"
  const userRegexStr = '^' + userPerm.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
  try {
    const userRegex = new RegExp(userRegexStr);
    if (userRegex.test(pattern)) return true;
  } catch {
    // Fallback
  }

  return false;
}

/**
 * Checks if user has required role(s).
 */
export function checkRole(
  required: string | string[],
  userRoles: string[] = [],
  matchAll = false,
  hierarchy?: RoleHierarchyMap
): boolean {
  const reqList = Array.isArray(required) ? required : [required];
  if (reqList.length === 0) return true;

  const effectiveRoles = resolveInheritedRoles(userRoles, hierarchy);

  if (matchAll) {
    return reqList.every((r) => effectiveRoles.includes(r));
  }
  return reqList.some((r) => effectiveRoles.includes(r));
}

/**
 * Checks if user has required permission(s), supporting wildcards.
 */
export function checkPermission(
  required: string | string[],
  userPermissions: string[] = [],
  matchAll = true
): boolean {
  const reqList = Array.isArray(required) ? required : [required];
  if (reqList.length === 0) return true;

  if (matchAll) {
    return reqList.every((req) =>
      userPermissions.some((userPerm) => matchPermissionRule(req, userPerm))
    );
  }
  return reqList.some((req) =>
    userPermissions.some((userPerm) => matchPermissionRule(req, userPerm))
  );
}

/**
 * Evaluates guard rules against context and returns detailed GuardResult.
 */
export async function evaluateGuard(
  options: AuthGuardOptions,
  context: AuthContext
): Promise<GuardResult> {
  const {
    requireAuth = true,
    roles,
    roleMatch = 'any',
    roleHierarchy,
    permissions,
    permissionMatch = 'all',
    validate,
  } = options;

  // 1. Check Authentication
  if (requireAuth && !context.isAuthenticated) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      message: 'Authentication is required to access this resource',
    };
  }

  // 2. Check Roles
  if (roles) {
    const reqRoles = Array.isArray(roles) ? roles : [roles];
    const matchAllRoles = roleMatch === 'all';
    const effectiveRoles = resolveInheritedRoles(context.roles || [], roleHierarchy);

    const missingRoles = reqRoles.filter((r) => !effectiveRoles.includes(r));
    const passed = matchAllRoles
      ? missingRoles.length === 0
      : reqRoles.some((r) => effectiveRoles.includes(r));

    if (!passed) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_ROLES',
        message: `Missing required role(s): ${missingRoles.join(', ')}`,
        missingRoles,
      };
    }
  }

  // 3. Check Permissions
  if (permissions) {
    const reqPerms = Array.isArray(permissions) ? permissions : [permissions];
    const matchAllPerms = permissionMatch === 'all';
    const userPerms = context.permissions || [];

    const missingPerms = reqPerms.filter(
      (req) => !userPerms.some((up) => matchPermissionRule(req, up))
    );
    const passed = matchAllPerms
      ? missingPerms.length === 0
      : reqPerms.some((req) => userPerms.some((up) => matchPermissionRule(req, up)));

    if (!passed) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_PERMISSIONS',
        message: `Missing required permission(s): ${missingPerms.join(', ')}`,
        missingPermissions: missingPerms,
      };
    }
  }

  // 4. Custom Predicate Check (ABAC)
  if (validate) {
    try {
      const isValid = await validate(context);
      if (!isValid) {
        return {
          allowed: false,
          reason: 'CUSTOM_VALIDATION_FAILED',
          message: 'Custom authorization validation predicate returned false',
        };
      }
    } catch (err: any) {
      return {
        allowed: false,
        reason: 'CUSTOM_VALIDATION_FAILED',
        message: `Custom validation threw an error: ${err?.message || String(err)}`,
      };
    }
  }

  return {
    allowed: true,
  };
}

/**
 * Creates a reusable route/navigation guard with callbacks and detailed evaluation.
 */
export function createAuthGuard(options: AuthGuardOptions) {
  const {
    onUnauthenticated,
    onUnauthorized,
    onForbidden,
    onSuccess,
    onEvaluate,
  } = options;

  return async function guard(context: AuthContext): Promise<boolean> {
    const result = await evaluateGuard(options, context);

    if (onEvaluate) {
      await onEvaluate(result, context);
    }

    if (!result.allowed) {
      if (result.reason === 'UNAUTHENTICATED') {
        if (onUnauthenticated) await onUnauthenticated(context);
        if (onUnauthorized) await onUnauthorized(result.message || 'Unauthenticated', context, result);
      } else {
        if (onForbidden && (result.missingRoles || result.missingPermissions)) {
          await onForbidden(
            {
              roles: result.missingRoles,
              permissions: result.missingPermissions,
            },
            context
          );
        }
        if (onUnauthorized) {
          await onUnauthorized(result.message || 'Unauthorized', context, result);
        }
      }
      return false;
    }

    if (onSuccess) {
      await onSuccess(context);
    }
    return true;
  };
}

/**
 * Router / Navigation Guard Helper
 * Compatible with Vue Router, React Router loader, SvelteKit, etc.
 */
export function createNavigationGuard(
  options: AuthGuardOptions & {
    getContext: () => AuthContext | Promise<AuthContext>;
    redirectToOnUnauthenticated?: string;
    redirectToOnUnauthorized?: string;
    onRedirect?: (url: string) => void;
  }
) {
  const guard = createAuthGuard(options);

  return async function navigationGuard(): Promise<{
    allowed: boolean;
    redirect?: string;
  }> {
    const context = await options.getContext();
    const result = await evaluateGuard(options, context);

    if (!result.allowed) {
      let redirectUrl: string | undefined;

      if (result.reason === 'UNAUTHENTICATED' && options.redirectToOnUnauthenticated) {
        redirectUrl = options.redirectToOnUnauthenticated;
      } else if (options.redirectToOnUnauthorized) {
        redirectUrl = options.redirectToOnUnauthorized;
      }

      if (redirectUrl && options.onRedirect) {
        options.onRedirect(redirectUrl);
      }

      // Execute internal guard callbacks
      await guard(context);

      return {
        allowed: false,
        redirect: redirectUrl,
      };
    }

    await guard(context);
    return { allowed: true };
  };
}
