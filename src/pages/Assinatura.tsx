import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Assinatura() {
  const { subscribed, planName, subscriptionEnd, loading, checkSubscription, expired, expiredAt, durationDays } = useSubscription();
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

  const daysRemaining = subscriptionEnd ? differenceInDays(new Date(subscriptionEnd), new Date()) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="h-7 w-7 text-primary" />
        Minha Assinatura
      </h1>

      {isExpiringSoon && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                Sua assinatura expira em {daysRemaining} {daysRemaining === 1 ? "dia" : "dias"}!
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                Renove agora para não perder o acesso ao sistema.
              </p>
            </div>
            <Button size="sm" className="ml-auto shrink-0" onClick={() => navigate("/planos")}>
              Renovar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalhes da Assinatura</span>
            {subscribed ? (
              <Badge className="bg-emerald-100 text-emerald-700">Ativa</Badge>
            ) : expired ? (
              <Badge variant="destructive">Expirada</Badge>
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
              <p className="text-lg font-semibold">
                {subscribed ? "Ativa" : expired ? "Expirada" : "Sem assinatura"}
              </p>
            </div>
            {subscribed && durationDays && durationDays !== Infinity && (
              <div>
                <p className="text-sm text-muted-foreground">Duração do Plano</p>
                <p className="text-lg font-semibold">{durationDays} dias</p>
              </div>
            )}
            {subscriptionEnd && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Expira em
                </p>
                <p className="text-lg font-semibold">
                  {format(new Date(subscriptionEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {expired && expiredAt && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Expirou em
                </p>
                <p className="text-lg font-semibold text-destructive">
                  {format(new Date(expiredAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleRefresh} disabled={refreshing} variant="secondary">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar Status
            </Button>
            {(!subscribed || expired) && (
              <Button onClick={() => navigate("/planos")}>
                {expired ? "Renovar Plano" : "Escolher Plano"}
              </Button>
            )}
            {subscribed && !expired && (
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
