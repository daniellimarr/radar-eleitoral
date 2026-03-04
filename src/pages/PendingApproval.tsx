import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <img src={logoRadar} alt="Radar Eleitoral" className="h-16 w-16 rounded-xl mx-auto" />
          <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Cadastro Pendente</h1>
            <p className="text-muted-foreground text-sm">
              Olá{profile?.full_name ? `, ${profile.full_name}` : ""}! Seu cadastro foi recebido e está aguardando aprovação de um administrador.
            </p>
            <p className="text-muted-foreground text-sm">
              Você receberá acesso ao sistema assim que seu cadastro for aprovado.
            </p>
          </div>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
