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
  const { user, loading, profile, profileStatus, roles, signOut } = useAuth();
  const { loading: subLoading } = useSubscription();

  // Otimização: Redirecionamento instantâneo se não houver usuário
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuperAdmin = roles.includes("super_admin");
  const isAdminRole = isSuperAdmin || roles.includes("admin_gabinete");

  // Otimização: Verificação de status consolidada
  if (!isSuperAdmin) {
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
  }

  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        Carregando ambiente...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 z-20">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-medium leading-none">
                  {profile?.full_name || "Usuário"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Radar Eleitoral
                </span>
              </div>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-muted/5">
            <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
