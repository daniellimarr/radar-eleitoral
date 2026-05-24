import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationBell from "@/components/NotificationBell";
import PendingApproval from "@/pages/PendingApproval";
import { Loader2, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";


export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileStatus, roles, signOut } = useAuth();
  const { subscribed, loading: subLoading, expired, expiredAt, planName } = useSubscription();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isSuperAdmin = roles.includes("super_admin");
  const isAdminRole = isSuperAdmin || roles.includes("admin_gabinete");
  if (profileStatus === "suspended" && !isAdminRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-300/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Acesso Suspenso</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Seu acesso ao sistema foi suspenso pelo administrador do gabinete.
            </p>
            <p className="text-muted-foreground text-sm">
              Entre em contato com o administrador para solicitar a reativação.
            </p>
            <Button variant="ghost" onClick={() => signOut()} size="sm" className="mt-4">
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (profileStatus && profileStatus !== "approved" && !isAdminRole) {
    return <PendingApproval />;
  }


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-muted-foreground hidden sm:block">
                Olá, <strong>{profile?.full_name || "Usuário"}</strong>
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
