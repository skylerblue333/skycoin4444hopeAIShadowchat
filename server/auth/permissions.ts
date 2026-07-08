import { UserRole } from "@shared/types";

export const PERMISSIONS = {
  ADMIN: {
    canManageUsers: true,
    canManageSystemSettings: true,
    canAccessTreasury: true,
    canPerformWalletOperations: true,
    canManageMarketplace: true,
  },
  USER: {
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessTreasury: false,
    canPerformWalletOperations: true,
    canManageMarketplace: false,
  },
  MERCHANT: {
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessTreasury: false,
    canPerformWalletOperations: true,
    canManageMarketplace: true,
  },
};

export const hasPermission = (userRole: UserRole, permission: keyof typeof PERMISSIONS.ADMIN): boolean => {
  if (!userRole || !PERMISSIONS[userRole]) {
    return false;
  }
  return PERMISSIONS[userRole][permission];
};
