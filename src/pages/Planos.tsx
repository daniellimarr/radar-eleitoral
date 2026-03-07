import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Zap, Star, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, PlanKey } from "@/lib/stripe";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import logoImg from "@/assets/logo-radar-eleitoral.png";

const icons: Record<PlanKey, React.ReactNode> = {
  starter: <Zap className="h-8 w-8" />,
  profissional: <Star className="h-8 w-8" />,
  agencia: <Building2 className="h-8 w-8" />,
};

export default function Planos() {
  const { user } = useAuth();
  const { subscribed, priceId } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planPriceId: string) => {
    if (!user) {
      toast.error("Faça login para assinar um plano");
      return;
    }
    setLoadingPlan(planPriceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: planPriceId },
      });
      console.log("[CHECKOUT] Response:", JSON.stringify(data), "Error:", error);
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout: " + (err.message || "tente novamente"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col items-center py-12 px-4">
      <div className="text-center mb-12">
        <img src={logoImg} alt="Radar Eleitoral" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Escolha seu Plano</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Comece a gerenciar sua campanha eleitoral com as melhores ferramentas do mercado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {(Object.keys(PLANS) as PlanKey[]).map((key) => {
          const plan = PLANS[key];
          const isCurrentPlan = subscribed && priceId === plan.price_id;
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
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">R${plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrentPlan || !!loadingPlan}
                  onClick={() => handleSubscribe(plan.price_id)}
                >
                  {loadingPlan === plan.price_id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isCurrentPlan ? "Plano Atual" : "Assinar"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
