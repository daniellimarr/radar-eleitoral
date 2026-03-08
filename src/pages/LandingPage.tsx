import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, ClipboardList, Crown, Rocket, BarChart3, ShieldCheck,
  ArrowRight, Check, ChevronRight, MessageSquare, Phone, Mail,
  Building2, UserCheck, Briefcase, Vote, UsersRound, AlertTriangle,
  Layers, Zap, Star, Eye, Award, Gem, Loader2
} from "lucide-react";
import logo from "@/assets/logo-radar-eleitoral.png";
import { ASAAS_PLANS } from "@/lib/asaas";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }),
};

const features = [
  { icon: Users, title: "Gestão de Contatos", desc: "Armazene e organize toda a sua base de eleitores e apoiadores." },
  { icon: ClipboardList, title: "Acompanhamento de Demandas", desc: "Registre e acompanhe solicitações e problemas dos cidadãos." },
  { icon: Crown, title: "Gestão de Lideranças", desc: "Organize líderes por bairro, região ou comunidade." },
  { icon: Rocket, title: "Planejamento de Campanha", desc: "Planeje ações e mobilize apoiadores com eficiência." },
  { icon: BarChart3, title: "Relatórios Estratégicos", desc: "Analise dados e acompanhe o crescimento eleitoral." },
  { icon: ShieldCheck, title: "Plataforma Segura", desc: "Sistema privado com login e permissões de usuário." },
];

const targetUsers = [
  { icon: Building2, label: "Vereadores" },
  { icon: Vote, label: "Deputados Estaduais" },
  { icon: UserCheck, label: "Pré-candidatos" },
  { icon: Briefcase, label: "Assessores Políticos" },
  { icon: UsersRound, label: "Equipes de Campanha" },
];

const benefits = [
  "Centralize seus contatos políticos",
  "Construa relacionamentos mais fortes com eleitores",
  "Organize a estrutura da sua campanha",
  "Acompanhe demandas da população",
  "Cresça sua base eleitoral com estratégia",
];

const landingPlans = [
  { name: "Plano Mensal", tag: "Ideal para começar", price: "97", period: "/mês", icon: Award, popular: false },
  { name: "Plano Trimestral", tag: "Melhor economia", price: "247", period: "/trimestre", icon: Star, popular: true },
  { name: "Plano Anual", tag: "Melhor custo-benefício", price: "697", period: "/ano", icon: Gem, popular: false },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const planKeyMap: Record<string, string> = {
    "Plano Mensal": "mensal",
    "Plano Trimestral": "trimestral",
    "Plano Anual": "anual",
  };

  const handleSubscribe = (planName: string) => {
    const planKey = planKeyMap[planName];
    if (!planKey) return;

    if (!user) {
      toast.error("Faça login para assinar um plano");
      navigate("/auth", { state: { returnTo: "/" } });
      return;
    }

    setSelectedPlanKey(planKey);
    setCustomerEmail(user?.email || "");
    setCpfDialogOpen(true);
  };

  const ensureAsaasCustomer = async (cpfValue: string, emailValue: string) => {
    const { data, error } = await supabase.functions.invoke("asaas-create-customer", {
      body: {
        name: profile?.full_name || emailValue,
        email: emailValue,
        cpf: cpfValue,
      },
    });
    if (error) throw new Error("Erro ao criar cliente no gateway de pagamento");
    return data.customer_id;
  };

  const processSubscription = async (planKey: string, cpfValue: string, emailValue: string) => {
    setLoadingPlan(planKey);
    try {
      await ensureAsaasCustomer(cpfValue, emailValue);
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
    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setCpfDialogOpen(false);
    if (selectedPlanKey) {
      await processSubscription(selectedPlanKey, digits, customerEmail);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Radar Eleitoral" className="h-9 w-auto" />
            <span className="text-lg font-bold hidden sm:block">Radar Eleitoral</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <button onClick={() => scrollTo("features")} className="hover:text-[#FF6B00] transition-colors">Funcionalidades</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-[#FF6B00] transition-colors">Planos</button>
            <button onClick={() => scrollTo("benefits")} className="hover:text-[#FF6B00] transition-colors">Benefícios</button>
            <button onClick={() => scrollTo("contact")} className="hover:text-[#FF6B00] transition-colors">Contato</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-sm font-medium text-gray-600">
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth")}
              className="bg-[#FF6B00] hover:bg-[#e55f00] text-white text-sm font-semibold px-5 rounded-lg shadow-md shadow-[#FF6B00]/20">
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#222222]" />
        <div className="absolute top-20 -right-32 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-[#FFC107]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-[#FF6B00]/20">
                  <Zap className="h-3.5 w-3.5" /> Plataforma de Inteligência Política
                </span>
              </motion.div>
              <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Radar Eleitoral –{" "}
                <span className="text-[#FFC107]">Gestão Política Inteligente</span>
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
                Contatos, demandas e estratégia de campanha em um só lugar. Organize sua base eleitoral, gerencie lideranças políticas, acompanhe demandas dos cidadãos e fortaleça sua estratégia de campanha com uma plataforma poderosa de gestão política.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Button onClick={() => navigate("/auth")} size="lg"
                  className="bg-[#FF6B00] hover:bg-[#e55f00] text-white text-base font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 transition-all">
                  Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => scrollTo("features")}
                  className="border-gray-600 text-gray-300 hover:bg-white/5 text-base px-8 py-6 rounded-xl bg-transparent">
                  <Eye className="mr-2 h-5 w-5" /> Veja Como Funciona
                </Button>
              </motion.div>
            </div>

            {/* Dashboard Mockup */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="hidden lg:block">
              <div className="bg-[#1e1e1e] border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#2a2a2a] border-b border-gray-700/50">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-500">Radar Eleitoral — Painel</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total de Contatos", val: "12.847", color: "#FF6B00" },
                      { label: "Lideranças Ativas", val: "342", color: "#FFC107" },
                      { label: "Demandas Abertas", val: "89", color: "#4ade80" },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#2a2a2a] rounded-xl p-4 border border-gray-700/30">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
                        <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#2a2a2a] rounded-xl p-4 border border-gray-700/30 h-32 flex items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 === 0 ? '#FF6B00' : '#FF6B0060' }} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {["Maria S. – Bairro Centro", "João P. – Vila Nova", "Ana L. – Jardim"].map((r, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#2a2a2a] rounded-lg p-3 border border-gray-700/30">
                        <span className="text-xs text-gray-400">{r}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] font-medium">Líder</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Problema ── */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 text-red-500 font-semibold text-sm mb-4">
                <AlertTriangle className="h-4 w-4" /> O Problema
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Campanhas desorganizadas{" "}
                <span className="text-red-500">perdem oportunidades</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 text-gray-500 text-lg leading-relaxed">
                Muitas equipes políticas ainda gerenciam contatos e apoiadores usando planilhas, cadernos ou aplicativos de mensagens. Isso gera confusão, perda de informações e coordenação fraca de campanha.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8">
                <p className="text-gray-600 font-medium mb-4">Sem um sistema, fica difícil:</p>
                <ul className="space-y-3">
                  {["Organizar apoiadores", "Acompanhar demandas dos cidadãos", "Gerenciar lideranças comunitárias", "Crescer a base eleitoral"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-500">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
              <div className="space-y-4">
                {[
                  { emoji: "📋", text: "Contatos espalhados em planilhas", pct: 78 },
                  { emoji: "📱", text: "Demandas perdidas em grupos de WhatsApp", pct: 65 },
                  { emoji: "📝", text: "Dados de campanha em cadernos", pct: 52 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.emoji} {item.text}</span>
                      <span className="text-sm font-bold text-red-500">{item.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Solução ── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-[#FF6B00] to-[#e55f00] rounded-3xl p-8 lg:p-10 text-white shadow-xl">
                <div className="space-y-5">
                  {[
                    { icon: Users, title: "Gerencie toda a sua base eleitoral", desc: "Todos os contatos em uma plataforma segura" },
                    { icon: Crown, title: "Cadastre apoiadores e lideranças", desc: "Organização hierárquica por região" },
                    { icon: ClipboardList, title: "Acompanhe solicitações dos cidadãos", desc: "Nunca mais perca uma demanda" },
                    { icon: Rocket, title: "Organize estratégias de campanha", desc: "Planeje e execute com precisão" },
                    { icon: BarChart3, title: "Analise o crescimento da sua base", desc: "Decisões políticas baseadas em dados" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm">{item.title}</p>
                        <p className="text-xs text-white/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="order-1 lg:order-2">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 text-[#FF6B00] font-semibold text-sm mb-4">
                <Layers className="h-4 w-4" /> A Solução
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Radar Eleitoral{" "}
                <span className="text-[#FF6B00]">centraliza tudo</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-6 text-gray-500 text-lg leading-relaxed">
                O Radar Eleitoral traz a organização política para uma plataforma moderna. Com o sistema você pode gerenciar contatos, acompanhar demandas, coordenar lideranças e planejar campanhas — tudo em um único painel.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8">
                <Button onClick={() => navigate("/auth")} size="lg"
                  className="bg-[#FF6B00] hover:bg-[#e55f00] text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#FF6B00]/25">
                  Comece Gratuitamente <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="features" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#FF6B00] font-semibold text-sm uppercase tracking-wider">Funcionalidades</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold">
              Tudo que sua equipe precisa
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Uma plataforma completa para organizar, acompanhar e expandir sua atuação política.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group bg-white hover:bg-white border border-gray-100 hover:border-[#FF6B00]/30 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-[#FF6B00]/5">
                <div className="w-14 h-14 bg-[#FFC107]/15 group-hover:bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mb-5 transition-colors">
                  <f.icon className="h-7 w-7 text-[#FF6B00]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Público-Alvo ── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#FF6B00] font-semibold text-sm uppercase tracking-wider">Público-Alvo</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold">
              Quem usa o Radar Eleitoral
            </h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {targetUsers.map((u, i) => (
              <motion.div key={u.label} variants={fadeUp} custom={i}
                className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-lg hover:border-[#FF6B00]/20 transition-all group">
                <div className="w-16 h-16 mx-auto bg-[#FFC107]/15 group-hover:bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <u.icon className="h-8 w-8 text-[#FF6B00]" />
                </div>
                <p className="font-bold text-sm">{u.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section id="benefits" className="py-20 lg:py-28 bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span variants={fadeUp} custom={0} className="text-[#FFC107] font-semibold text-sm uppercase tracking-wider">
                Benefícios
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                Mais organização.{" "}
                <span className="text-[#FF6B00]">Mais estratégia.</span>{" "}
                <span className="text-[#FFC107]">Mais resultados.</span>
              </motion.h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="space-y-5">
                {benefits.map((b, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF6B00]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-[#FF6B00]" />
                    </div>
                    <span className="text-gray-300 text-lg font-medium">{b}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-4">
            <span className="text-[#FF6B00] font-semibold text-sm uppercase tracking-wider">Planos</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold">
              O melhor custo benefício
            </h2>
            <p className="mt-2 text-[#FF6B00] text-xl font-bold">Nº 1 do Brasil</p>
            <p className="mt-4 text-gray-500 text-lg">
              Formas de pagamento: PIX ou Cartão de Crédito — Liberação imediata
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {landingPlans.map((plan, i) => {
              const planKey = planKeyMap[plan.name];
              const isLoading = loadingPlan === planKey;
              return (
                <motion.div key={plan.name} variants={fadeUp} custom={i}
                  className={`relative rounded-2xl p-8 border-2 transition-all ${
                    plan.popular
                      ? "border-[#FF6B00] bg-white shadow-2xl shadow-[#FF6B00]/10 scale-[1.03]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  {plan.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md">
                      Mais Popular
                    </span>
                  )}
                  <div className="text-center mb-4">
                    <plan.icon className="h-8 w-8 text-[#FF6B00] mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">{plan.tag}</p>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-gray-500">R$</span>
                      <span className="text-4xl font-extrabold text-[#FF6B00]">{plan.price}</span>
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={isLoading}
                    className={`w-full mt-6 py-6 text-base font-bold rounded-xl transition-all ${
                      plan.popular
                        ? "bg-[#FF6B00] hover:bg-[#e55f00] text-white shadow-lg shadow-[#FF6B00]/20"
                        : "bg-[#111111] hover:bg-[#222] text-white"
                    }`}>
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                    ) : (
                      <>Assinar Agora <ChevronRight className="ml-1 h-4 w-4" /></>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-[#FF6B00] via-[#e55f00] to-[#cc5200]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Comece a organizar sua base eleitoral hoje
            </motion.h2>
            <motion.p variants={fadeUp} custom={1}
              className="mt-6 text-white/80 text-lg max-w-2xl mx-auto">
              Tenha controle total da sua estratégia política com o Radar Eleitoral.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => navigate("/auth")} size="lg"
                className="bg-white text-[#FF6B00] hover:bg-gray-100 text-lg font-bold px-10 py-7 rounded-xl shadow-xl transition-all">
                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button asChild size="lg" variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-lg font-bold px-10 py-7 rounded-xl bg-transparent">
                <a href="https://wa.me/5595991131237?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20o%20Radar%20Eleitoral." target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="mr-2 h-5 w-5" /> Falar no WhatsApp
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Rodapé ── */}
      <footer id="contact" className="bg-[#111111] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Radar Eleitoral" className="h-10 w-auto brightness-200" />
                <span className="text-xl font-bold">Radar Eleitoral</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                Radar Eleitoral – Plataforma de Inteligência Política. A solução mais completa para gestão de campanhas e gabinetes políticos.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Links</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => scrollTo("pricing")} className="hover:text-white transition-colors">Planos</button></li>
                <li><button onClick={() => scrollTo("contact")} className="hover:text-white transition-colors">Contato</button></li>
                <li><button onClick={() => navigate("/auth")} className="hover:text-white transition-colors">Sobre</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Contato</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (95) 99113-1237</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contato@radareleitoral.net</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-600">
            © {new Date().getFullYear()} Radar Eleitoral. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* WhatsApp Flutuante */}
      <a
        href="https://wa.me/5595991131237?text=Ol%C3%A1%21%20Gostaria%20de%20saber%20mais%20sobre%20o%20Radar%20Eleitoral."
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <MessageSquare className="h-6 w-6" />
      </a>

      {/* Dialog de dados para cobrança */}
      <Dialog open={cpfDialogOpen} onOpenChange={setCpfDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dados para cobrança</DialogTitle>
            <DialogDescription>
              Informe seu e-mail e CPF para gerar a cobrança.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerEmail">E-mail</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="seu@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
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
              className="w-full bg-[#FF6B00] hover:bg-[#e55f00] text-white font-bold"
              onClick={handleCpfSubmit}
              disabled={cpf.replace(/\D/g, "").length !== 11 || !customerEmail.includes("@")}
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
