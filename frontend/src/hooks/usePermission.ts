import { useAuth } from "@/lib/auth";

const SUPER_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Hook to check user permissions.
 * ADMIN/SUPER_ADMIN roles bypass all permission checks.
 */
export function usePermission() {
  const { user } = useAuth();

  const isSuperAdmin = !!user && SUPER_ADMIN_ROLES.includes(user.role);

  /**
   * Check if the current user has a specific permission.
   * Returns true for ADMIN/SUPER_ADMIN users regardless of permission list.
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  /**
   * Check if the user has at least one of the given permissions.
   */
  const hasAnyPermission = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.some((p) => user.permissions?.includes(p));
  };

  /**
   * Check if the user has ALL of the given permissions.
   */
  const hasAllPermissions = (...permissions: string[]): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return permissions.every((p) => user.permissions?.includes(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin };
}
