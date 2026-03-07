import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Assinatura() {
  const { subscribed, planName, subscriptionEnd, loading, checkSubscription } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast.success("Status atualizado!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="h-7 w-7 text-primary" />
        Minha Assinatura
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalhes da Assinatura</span>
            {subscribed ? (
              <Badge className="bg-emerald-100 text-emerald-700">Ativa</Badge>
            ) : (
              <Badge variant="destructive">Inativa</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="text-lg font-semibold">{planName || "Nenhum"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{subscribed ? "Ativa" : "Sem assinatura"}</p>
            </div>
            {subscriptionEnd && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Próxima cobrança
                </p>
                <p className="text-lg font-semibold">
                  {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleRefresh} disabled={refreshing} variant="secondary">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar Status
            </Button>
            {!subscribed && (
              <Button onClick={() => navigate("/planos")}>
                Escolher Plano
              </Button>
            )}
            {subscribed && (
              <Button variant="outline" onClick={() => navigate("/planos")}>
                Trocar Plano
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
