import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Award, Star, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { ASAAS_PLANS, AsaasPlanKey } from "@/lib/asaas";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo-radar-eleitoral.png";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const icons: Record<AsaasPlanKey, React.ReactNode> = {
  mensal: <Award className="h-8 w-8" />,
  trimestral: <Star className="h-8 w-8" />,
  anual: <Crown className="h-8 w-8" />,
};

export default function Planos() {
  const { user, profile } = useAuth();
  const { subscribed, planName } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState<string | null>(null);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const ensureAsaasCustomer = async (cpfValue: string) => {
    // Always call the function to ensure CPF is updated even if customer exists
    const { data, error } = await supabase.functions.invoke("asaas-create-customer", {
      body: {
        name: profile?.full_name || user?.email,
        email: user?.email,
        cpf: cpfValue,
      },
    });

    if (error) throw new Error("Erro ao criar cliente no gateway de pagamento");
    return data.customer_id;
  };

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      toast.error("Faça login para assinar um plano");
      navigate("/auth", { state: { returnTo: "/planos" } });
      return;
    }

    // Always ask for CPF on first subscription
    if (!cpf) {
      setSelectedPlanKey(planKey);
      setCpfDialogOpen(true);
      return;
    }

    await processSubscription(planKey, cpf.replace(/\D/g, ""));
  };

  const processSubscription = async (planKey: string, cpfValue?: string) => {
    setLoadingPlan(planKey);
    try {
      await ensureAsaasCustomer(cpfValue || "");

      const { data, error } = await supabase.functions.invoke("asaas-create-subscription", {
        body: { plan_key: planKey },
      });

      if (error) throw error;

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.error("Erro ao gerar link de pagamento. Tente novamente.");
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      toast.error(err.message || "Erro ao processar assinatura");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCpfSubmit = async () => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }
    setCpfDialogOpen(false);
    if (selectedPlanKey) {
      await processSubscription(selectedPlanKey, digits);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-5xl mb-4">
        <Button variant="ghost" onClick={() => navigate("/auth")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>
      <div className="text-center mb-12">
        <img src={logoImg} alt="Radar Eleitoral" className="h-16 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold mb-1">O melhor custo benefício</h1>
        <p className="text-primary text-2xl md:text-3xl font-bold mb-3">Nº 1 do Brasil</p>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Formas de pagamento: PIX, Boleto ou Cartão de Crédito — Liberação imediata
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {(Object.keys(ASAAS_PLANS) as AsaasPlanKey[]).map((key) => {
          const plan = ASAAS_PLANS[key];
          const isCurrentPlan = subscribed && planName?.toLowerCase() === plan.name.toLowerCase();
          const isPopular = "popular" in plan && plan.popular;
          const isLoading = loadingPlan === key;

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
                  <span className="text-primary text-3xl font-extrabold">R$ {plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  PIX, Boleto ou Cartão<br />Liberação imediata
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Button
                  className="w-full mb-6 bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="lg"
                  disabled={isCurrentPlan || isLoading}
                  onClick={() => handleSubscribe(key)}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : isCurrentPlan ? (
                    "Plano Atual"
                  ) : (
                    "CONTRATAR AGORA"
                  )}
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

      <Dialog open={cpfDialogOpen} onOpenChange={setCpfDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informe seu CPF</DialogTitle>
            <DialogDescription>
              Para gerar a cobrança, precisamos do seu CPF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                maxLength={14}
              />
            </div>
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleCpfSubmit}
              disabled={cpf.replace(/\D/g, "").length !== 11}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}