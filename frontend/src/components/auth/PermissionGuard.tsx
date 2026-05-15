import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/lib/auth";
import { Loader2, ShieldX } from "lucide-react";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  /**
   * If true, renders a 403 Forbidden UI instead of redirecting.
   * Useful for inline elements vs. full-page guards.
   */
  fallback?: "redirect" | "ui";
  redirectTo?: string;
}

/**
 * Protects a route or component based on a specific permission.
 * ADMIN/SUPER_ADMIN bypasses all checks.
 */
export function PermissionGuard({
  permission,
  children,
  fallback = "redirect",
  redirectTo = "/forbidden",
}: PermissionGuardProps) {
  const { loading } = useAuth();
  const { hasPermission } = usePermission();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    if (fallback === "redirect") {
      return <Navigate to={redirectTo} replace />;
    }

    // Inline forbidden UI
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <ShieldX className="h-12 w-12 text-destructive opacity-50" />
        <h3 className="text-lg font-black text-foreground">Truy cập bị từ chối</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Bạn không có quyền truy cập tính năng này. Liên hệ quản trị viên để được cấp quyền.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
