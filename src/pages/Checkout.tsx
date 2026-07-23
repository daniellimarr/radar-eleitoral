import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Award, Star, Crown, Check, ShieldCheck } from "lucide-react";
import { ASAAS_PLANS, AsaasPlanKey } from "@/lib/asaas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo-radar-eleitoral.png";

const icons: Record<AsaasPlanKey, React.ReactNode> = {
  mensal: <Award className="h-6 w-6" />,
  trimestral: <Star className="h-6 w-6" />,
  anual: <Crown className="h-6 w-6" />,
};

const formatCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialPlan = (params.get("plano") || "trimestral") as AsaasPlanKey;
  const [planKey, setPlanKey] = useState<AsaasPlanKey>(
    ["mensal", "trimestral", "anual"].includes(initialPlan) ? initialPlan : "trimestral",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = params.get("plano");
    if (q && ["mensal", "trimestral", "anual"].includes(q)) setPlanKey(q as AsaasPlanKey);
  }, [params]);

  const plan = ASAAS_PLANS[planKey];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfDigits = cpf.replace(/\D/g, "");
    if (name.trim().length < 3) return toast.error("Informe seu nome completo");
    if (!email.includes("@")) return toast.error("E-mail inválido");
    if (cpfDigits.length !== 11) return toast.error("CPF deve ter 11 dígitos");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-checkout", {
        body: {
          plan_key: planKey,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          cpf: cpfDigits,
          phone: phone.replace(/\D/g, ""),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.payment_url) throw new Error("Link de pagamento indisponível");

      // Store email so /pagamento-confirmado can show it
      sessionStorage.setItem("checkoutEmail", email.trim().toLowerCase());
      window.location.href = data.payment_url;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao processar checkout");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="text-center mb-8">
          <img src={logoImg} alt="Radar Eleitoral" className="h-14 mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold">Finalize sua assinatura</h1>
          <p className="text-muted-foreground mt-1">
            Preencha seus dados e escolha a forma de pagamento (PIX, Boleto ou Cartão).
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,380px] gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como está no seu documento"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este será seu login no sistema após o pagamento.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(95) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div>
                  <Label>Plano escolhido</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(Object.keys(ASAAS_PLANS) as AsaasPlanKey[]).map((k) => {
                      const p = ASAAS_PLANS[k];
                      const active = planKey === k;
                      return (
                        <button
                          type="button"
                          key={k}
                          onClick={() => setPlanKey(k)}
                          className={`border rounded-lg p-3 text-left transition ${
                            active
                              ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-xs font-semibold">{p.name}</div>
                          <div className="text-lg font-bold text-primary">R$ {p.price}</div>
                          <div className="text-[10px] text-muted-foreground">{p.period}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando pagamento...
                    </>
                  ) : (
                    "Ir para pagamento"
                  )}
                </Button>

                <p className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pagamento seguro via Asaas. Sua conta é criada automaticamente após a confirmação.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="h-fit sticky top-6">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                {icons[planKey]}
                <CardTitle>{plan.name}</CardTitle>
              </div>
              {"popular" in plan && plan.popular && (
                <Badge className="w-fit bg-primary text-primary-foreground">Mais Popular</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-extrabold text-primary">R$ {plan.price}</span>
                <span className="text-muted-foreground pb-1">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
