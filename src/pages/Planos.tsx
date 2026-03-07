import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Award, Star, Crown } from "lucide-react";
import { PLANS, PlanKey } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoImg from "@/assets/logo-radar-eleitoral.png";

const icons: Record<PlanKey, React.ReactNode> = {
  bronze: <Award className="h-8 w-8" />,
  prata: <Star className="h-8 w-8" />,
  ouro: <Crown className="h-8 w-8" />,
};

export default function Planos() {
  const { user } = useAuth();
  const { subscribed, planName } = useSubscription();

  const handleSubscribe = (checkoutUrl: string) => {
    if (!user) {
      toast.error("Faça login para assinar um plano");
      return;
    }
    if (!checkoutUrl) {
      toast.error("URL de checkout ainda não configurada para este plano");
      return;
    }
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col items-center py-12 px-4">
      <div className="text-center mb-12">
        <img src={logoImg} alt="Radar Eleitoral" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-1">O melhor custo benefício</h1>
        <p className="text-primary text-2xl md:text-3xl font-bold mb-3">Nº 1 do Brasil</p>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Formas de pagamento: PIX ou Cartão de Crédito — Liberação imediata
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => {
          const plan = PLANS[key];
          const isCurrentPlan = subscribed && planName?.toLowerCase() === plan.name.toLowerCase();
          const isPopular = "popular" in plan && plan.popular;

          return (
            <Card
              key={key}
              className={`relative flex flex-col transition-all hover:shadow-xl ${
                isPopular ? "border-primary shadow-lg scale-[1.03]" : ""
              } ${isCurrentPlan ? "border-emerald-500 border-2" : ""}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                  Mais Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-emerald-500 text-white px-4">
                  Seu Plano
                </Badge>
              )}
              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-3 text-primary">{icons[key]}</div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-primary text-3xl font-extrabold">R$ {plan.price},00</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  PIX ou Cartão de Crédito<br />Liberação imediata
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Button
                  className="w-full mb-6 bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="lg"
                  disabled={isCurrentPlan}
                  onClick={() => handleSubscribe(plan.checkout_url)}
                >
                  {isCurrentPlan ? "Plano Atual" : "CONTRATAR AGORA"}
                </Button>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
