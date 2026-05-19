import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  module?: string;
  role?: string | string[];
}

export function ProtectedRoute({ children, module, role }: ProtectedRouteProps) {
  const { user, loading, hasPermission, hasRole, permissionsLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !permissionsLoading && user) {
      if (module && !hasPermission(module)) {
        toast.error("Você não tem permissão para acessar este módulo.");
      } else if (role) {
        const roles = Array.isArray(role) ? role : [role];
        const hasRequiredRole = roles.some(r => hasRole(r));
        if (!hasRequiredRole) {
          toast.error("Seu nível de acesso não permite visualizar esta página.");
        }
      }
    }
  }, [loading, permissionsLoading, user, module, role, hasPermission, hasRole]);

  if (loading || permissionsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificar permissão de módulo
  if (module && !hasPermission(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar permissão de role
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRequiredRole = roles.some(r => hasRole(r));
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <AppLayout>{children}</AppLayout>;
}
