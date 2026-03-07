import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo-radar-eleitoral.png";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { checkSubscription, subscribed, loading } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Poll subscription status for up to 30 seconds
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      await checkSubscription();
      attempts++;
      if (attempts >= maxAttempts) {
        setChecking(false);
      }
    };

    poll();
    const interval = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setChecking(false);
        return;
      }
      poll();
    }, 3000);

    return () => clearInterval(interval);
  }, [checkSubscription]);

  useEffect(() => {
    if (subscribed && !loading) {
      setChecking(false);
    }
  }, [subscribed, loading]);

  const handleGoToSystem = () => {
    navigate("/dashboard");
  };

  const handleGoToLogin = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <img src={logoImg} alt="Radar Eleitoral" className="h-16 mx-auto mb-4" />
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checking && !subscribed ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verificando sua assinatura...</span>
            </div>
          ) : subscribed ? (
            <>
              <p className="text-muted-foreground">
                Sua assinatura foi ativada com sucesso! Você já pode acessar todas as funcionalidades do sistema.
              </p>
              <Button onClick={handleGoToSystem} className="w-full" size="lg">
                Acessar o Sistema
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Seu pagamento está sendo processado. Em alguns instantes sua assinatura será ativada.
                Faça login novamente para acessar o sistema.
              </p>
              <Button onClick={handleGoToLogin} className="w-full" size="lg">
                Ir para Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
