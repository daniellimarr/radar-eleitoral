import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import logoImg from "@/assets/logo-radar-eleitoral.png";

export default function PagamentoConfirmado() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const q = params.get("email");
    setEmail(q || sessionStorage.getItem("checkoutEmail") || "");
    sessionStorage.removeItem("checkoutEmail");
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <img src={logoImg} alt="Radar Eleitoral" className="h-14 mx-auto mb-3" />
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento em processamento</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Recebemos sua solicitação. Assim que o pagamento for confirmado (poucos minutos para
            PIX/Cartão), sua conta será criada automaticamente e você receberá um e-mail com o
            link para definir sua senha.
          </p>
          {email && (
            <div className="flex items-center gap-2 justify-center bg-muted/50 rounded-lg p-3 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              <span className="font-medium">{email}</span>
            </div>
          )}
          <div className="pt-2 space-y-2">
            <Button
              onClick={() => navigate("/auth")}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Acessar o sistema <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Voltar à página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
