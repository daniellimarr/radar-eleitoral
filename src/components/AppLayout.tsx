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

function ExpiredSubscriptionScreen({ planName, expiredAt }: { planName: string | null; expiredAt: string | null }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Assinatura Expirada</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Seu plano <strong>{planName || "atual"}</strong> expirou
            {expiredAt && (
              <> em <strong>{format(new Date(expiredAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong></>
            )}.
          </p>
          <p className="text-muted-foreground text-sm">
            O acesso ao sistema está bloqueado até que você renove sua assinatura.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => navigate("/planos")} size="lg" className="w-full bg-emerald-500 hover:bg-emerald-600">
              Renovar Plano
            </Button>
            <Button variant="ghost" onClick={() => signOut()} size="sm">
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileStatus, roles } = useAuth();
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
  if (profileStatus && profileStatus !== "approved" && !isAdminRole) {
    return <PendingApproval />;
  }

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show expired screen with renewal option
  if (expired && !isSuperAdmin) {
    return <ExpiredSubscriptionScreen planName={planName} expiredAt={expiredAt} />;
  }

  // Not subscribed at all - redirect to landing
  if (!subscribed && !isSuperAdmin && location.pathname !== "/assinatura") {
    return <Navigate to="/" replace />;
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
