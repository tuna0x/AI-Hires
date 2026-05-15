import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  /** Redirect to /dashboard if user is not an admin role */
  adminOnly?: boolean;
  /** Redirect to /forbidden if user lacks this specific permission */
  permission?: string;
  /** Redirect to /forbidden if user lacks all permissions in this list */
  anyPermissions?: string[];
}

export function RequireAuth({ children, adminOnly = false, permission, anyPermissions }: RequireAuthProps) {
  const { user, loading, isAdmin, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/forbidden" replace />;
  }
  if (anyPermissions && anyPermissions.length > 0 && !anyPermissions.some((p) => hasPermission(p))) {
    return <Navigate to="/forbidden" replace />;
  }
  return <>{children}</>;
}
