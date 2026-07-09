import { TRPCError } from "@trpc/server";
import type { Context } from "../_core/context";

/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides fine-grained authorization for tRPC procedures
 */

export type UserRole = "admin" | "user" | "moderator" | "support";

export interface Permission {
  resource: string;
  action: string;
}

/**
 * Role to permissions mapping
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // User management
    { resource: "users", action: "read" },
    { resource: "users", action: "create" },
    { resource: "users", action: "update" },
    { resource: "users", action: "delete" },
    { resource: "users", action: "manage_roles" },
    { resource: "users", action: "manage_mfa" },
    { resource: "users", action: "reset_password" },

    // System management
    { resource: "system", action: "read" },
    { resource: "system", action: "configure" },
    { resource: "system", action: "manage_settings" },
    { resource: "system", action: "view_logs" },
    { resource: "system", action: "manage_security" },

    // Financial management
    { resource: "financial", action: "read" },
    { resource: "financial", action: "audit" },
    { resource: "financial", action: "reconcile" },
    { resource: "financial", action: "manage_wallets" },

    // Content moderation
    { resource: "content", action: "read" },
    { resource: "content", action: "moderate" },
    { resource: "content", action: "delete" },
  ],

  moderator: [
    // Content moderation
    { resource: "content", action: "read" },
    { resource: "content", action: "moderate" },
    { resource: "content", action: "delete" },

    // User support
    { resource: "users", action: "read" },
    { resource: "users", action: "reset_password" },

    // Reporting
    { resource: "reports", action: "read" },
    { resource: "reports", action: "create" },
  ],

  support: [
    // User support
    { resource: "users", action: "read" },
    { resource: "users", action: "reset_password" },

    // Ticket management
    { resource: "support", action: "read" },
    { resource: "support", action: "create" },
    { resource: "support", action: "update" },

    // Reporting
    { resource: "reports", action: "read" },
    { resource: "reports", action: "create" },
  ],

  user: [
    // Self-service
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
    { resource: "profile", action: "manage_mfa" },
    { resource: "profile", action: "change_password" },

    // Content
    { resource: "content", action: "read" },
    { resource: "content", action: "create" },
    { resource: "content", action: "update_own" },
    { resource: "content", action: "delete_own" },

    // Wallet
    { resource: "wallet", action: "read" },
    { resource: "wallet", action: "send" },
    { resource: "wallet", action: "receive" },

    // Support
    { resource: "support", action: "read" },
    { resource: "support", action: "create" },
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userRole: UserRole | undefined,
  resource: string,
  action: string
): boolean {
  if (!userRole) return false;

  const permissions = rolePermissions[userRole];
  if (!permissions) return false;

  return permissions.some((p) => p.resource === resource && p.action === action);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: UserRole | undefined, ...roles: UserRole[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * RBAC middleware for tRPC
 */
export function rbacMiddleware(
  requiredRole: UserRole | UserRole[],
  requiredPermission?: { resource: string; action: string }
) {
  return ({ ctx, next }: any) => {
    const userRole = ctx.user?.role as UserRole | undefined;

    // Check role requirement
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!hasRole(userRole, ...roles)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${roles.join(" or ")}`,
      });
    }

    // Check permission requirement if specified
    if (requiredPermission) {
      if (!hasPermission(userRole, requiredPermission.resource, requiredPermission.action)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient permissions. Required: ${requiredPermission.resource}:${requiredPermission.action}`,
        });
      }
    }

    return next({ ctx });
  };
}

/**
 * Admin-only middleware
 */
export function adminOnly() {
  return rbacMiddleware("admin");
}

/**
 * Moderator or admin middleware
 */
export function moderatorOrAdmin() {
  return rbacMiddleware(["admin", "moderator"]);
}

/**
 * Support or admin middleware
 */
export function supportOrAdmin() {
  return rbacMiddleware(["admin", "support"]);
}

/**
 * Permission-based middleware
 */
export function requirePermission(resource: string, action: string) {
  return rbacMiddleware("user", { resource, action });
}

/**
 * Verify user owns the resource
 */
export function verifyOwnership(
  userId: string | undefined,
  resourceOwnerId: string | undefined
): boolean {
  if (!userId || !resourceOwnerId) return false;
  return userId === resourceOwnerId;
}

/**
 * Ownership check middleware
 */
export function requireOwnership(getResourceOwnerId: (ctx: Context) => string | undefined) {
  return ({ ctx, next }: any) => {
    const userId = ctx.user?.id;
    const resourceOwnerId = getResourceOwnerId(ctx);

    if (!verifyOwnership(userId, resourceOwnerId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource",
      });
    }

    return next({ ctx });
  };
}

export default {
  hasPermission,
  hasRole,
  getPermissions,
  rbacMiddleware,
  adminOnly,
  moderatorOrAdmin,
  supportOrAdmin,
  requirePermission,
  verifyOwnership,
  requireOwnership,
};
