import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, MapPin, BarChart3, Shield, MessageSquare, Calendar,
  FileText, Car, ChevronRight, Check, Star, Zap, Target, TrendingUp,
  ArrowRight, Phone
} from "lucide-react";
import logo from "@/assets/logo-radar-eleitoral.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
  }),
};

const features = [
  { icon: Users, title: "Gestão de Contatos", desc: "Cadastro completo de eleitores com CPF, endereço, geolocalização e vínculo a lideranças." },
  { icon: Target, title: "Lideranças & Equipes", desc: "Hierarquia de coordenadores, assessores e operadores com controle de acesso por módulo." },
  { icon: MapPin, title: "Georeferenciamento", desc: "Mapa interativo com localização de todos os contatos cadastrados por região e bairro." },
  { icon: BarChart3, title: "Relatórios Avançados", desc: "Dashboards com métricas de engajamento, crescimento de base e desempenho por liderança." },
  { icon: Calendar, title: "Agenda & Visitas", desc: "Controle de compromissos, solicitações de visita com recursos de som, cadeiras e materiais." },
  { icon: MessageSquare, title: "WhatsApp Integrado", desc: "Automações de mensagens, aniversariantes e disparo em massa com templates personalizados." },
  { icon: FileText, title: "Gestão Financeira", desc: "Controle de doações, despesas, fornecedores e prestação de contas da campanha." },
  { icon: Car, title: "Frota & Materiais", desc: "Gerenciamento de veículos, materiais de campanha e distribuição por região." },
];

const plans = [
  {
    name: "Bronze",
    price: "259",
    features: ["1 a 2 usuários", "Até 5.000 contatos", "Módulos essenciais", "Suporte por e-mail"],
    popular: false,
  },
  {
    name: "Prata",
    price: "329",
    features: ["3 a 5 usuários", "Até 10.000 contatos", "Todos os módulos", "WhatsApp integrado", "Suporte prioritário"],
    popular: true,
  },
  {
    name: "Ouro",
    price: "499",
    features: ["6 a 10 usuários", "Até 20.000 contatos", "Todos os módulos", "WhatsApp + Automações", "Suporte VIP dedicado", "Treinamento incluso"],
    popular: false,
  },
];

const stats = [
  { value: "500+", label: "Gabinetes ativos" },
  { value: "2M+", label: "Contatos gerenciados" },
  { value: "99.9%", label: "Uptime garantido" },
  { value: "27", label: "Estados atendidos" },
];

const testimonials = [
  { name: "Vereador Carlos M.", city: "São Paulo/SP", text: "O Radar Eleitoral transformou nossa gestão de gabinete. Conseguimos organizar mais de 8 mil contatos e acompanhar cada demanda." },
  { name: "Dep. Ana Souza", city: "Belo Horizonte/MG", text: "A funcionalidade de georeferenciamento nos ajudou a mapear toda a nossa base eleitoral e direcionar melhor nossas ações." },
  { name: "Assessor Ricardo L.", city: "Recife/PE", text: "Sistema completo, intuitivo e com suporte incrível. Recomendo para qualquer gabinete que queira profissionalizar a gestão." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Radar Eleitoral" className="h-10 w-auto" />
            <span className="text-lg font-bold text-[#1a2b4a] hidden sm:block">Radar Eleitoral</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#e86c2a] transition-colors">Funcionalidades</a>
            <a href="#plans" className="hover:text-[#e86c2a] transition-colors">Planos</a>
            <a href="#testimonials" className="hover:text-[#e86c2a] transition-colors">Depoimentos</a>
            <a href="#contact" className="hover:text-[#e86c2a] transition-colors">Contato</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="text-sm font-medium">
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-[#e86c2a] hover:bg-[#d45d1f] text-white text-sm font-semibold px-5">
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2b4a] via-[#243b63] to-[#1a2b4a]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#e86c2a] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#c9a84c] rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full border border-white/20 mb-6">
                <Zap className="h-4 w-4 text-[#c9a84c]" />
                Plataforma Nº 1 em Gestão de Gabinete
              </span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
              Gestão inteligente para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#e86c2a]">
                gabinetes políticos
              </span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Organize contatos, acompanhe demandas, gerencie lideranças e fortaleça sua base eleitoral com tecnologia de ponta.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => navigate("/auth")} size="lg"
                className="bg-[#e86c2a] hover:bg-[#d45d1f] text-white text-lg font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#e86c2a]/30 hover:shadow-[#e86c2a]/50 transition-all">
                Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl bg-transparent">
                Ver Funcionalidades
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-10 z-10 max-w-5xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} custom={i}
              className="text-center py-8 px-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#1a2b4a]">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#e86c2a] font-semibold text-sm uppercase tracking-wider">Funcionalidades</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a2b4a]">
              Tudo que seu gabinete precisa
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Uma plataforma completa para organizar, acompanhar e expandir sua atuação política.
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-[#e86c2a]/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-[#e86c2a]/5">
                <div className="w-12 h-12 bg-[#e86c2a]/10 group-hover:bg-[#e86c2a]/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="h-6 w-6 text-[#e86c2a]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a2b4a] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.span variants={fadeUp} custom={0} className="text-[#e86c2a] font-semibold text-sm uppercase tracking-wider">
                Por que escolher o Radar?
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1a2b4a]">
                Tecnologia a serviço da política
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-gray-500 text-lg leading-relaxed">
                Desenvolvido por especialistas em tecnologia e gestão pública, o Radar Eleitoral é a ferramenta mais completa do mercado para gabinetes que buscam profissionalismo e resultados.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8 space-y-4">
                {[
                  "Dados 100% protegidos com criptografia e LGPD",
                  "Multi-tenant: cada gabinete tem seu ambiente isolado",
                  "Acesso por celular otimizado para uso em campo",
                  "Links de cadastro público para captura de apoiadores",
                  "Relatórios exportáveis em PDF e Excel",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="relative">
              <div className="bg-gradient-to-br from-[#1a2b4a] to-[#243b63] rounded-3xl p-8 lg:p-12 text-white">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <Shield className="h-8 w-8 text-[#c9a84c]" />
                    <div>
                      <p className="font-bold">Segurança Total</p>
                      <p className="text-sm text-white/60">RLS, criptografia e isolamento de dados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <TrendingUp className="h-8 w-8 text-[#c9a84c]" />
                    <div>
                      <p className="font-bold">Crescimento Mensurável</p>
                      <p className="text-sm text-white/60">Métricas de engajamento em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 rounded-xl p-4">
                    <Star className="h-8 w-8 text-[#c9a84c]" />
                    <div>
                      <p className="font-bold">Suporte Especializado</p>
                      <p className="text-sm text-white/60">Time dedicado com experiência política</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#e86c2a] font-semibold text-sm uppercase tracking-wider">Planos</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a2b4a]">
              Escolha o plano ideal
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Pagamento via PIX ou Cartão de Crédito — Liberação imediata
            </p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} custom={i}
                className={`relative rounded-2xl p-8 border-2 transition-all ${
                  plan.popular
                    ? "border-[#e86c2a] bg-white shadow-xl shadow-[#e86c2a]/10 scale-105"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e86c2a] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    Mais Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#1a2b4a]">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm text-gray-500">R$</span>
                  <span className="text-5xl font-extrabold text-[#e86c2a]">{plan.price}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/auth")}
                  className={`w-full mt-8 py-6 text-base font-bold rounded-xl ${
                    plan.popular
                      ? "bg-[#e86c2a] hover:bg-[#d45d1f] text-white shadow-lg shadow-[#e86c2a]/20"
                      : "bg-[#1a2b4a] hover:bg-[#243b63] text-white"
                  }`}>
                  Contratar Agora <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#e86c2a] font-semibold text-sm uppercase tracking-wider">Depoimentos</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1a2b4a]">
              Quem usa, recomenda
            </h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#c9a84c] text-[#c9a84c]" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{t.text}"</p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="font-bold text-[#1a2b4a]">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.city}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a2b4a] leading-tight">
              Pronto para transformar sua{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e86c2a] to-[#c9a84c]">
                gestão política?
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-6 text-gray-500 text-lg max-w-2xl mx-auto">
              Junte-se a centenas de gabinetes que já profissionalizaram sua atuação com o Radar Eleitoral.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-10">
              <Button onClick={() => navigate("/auth")} size="lg"
                className="bg-[#e86c2a] hover:bg-[#d45d1f] text-white text-lg font-bold px-10 py-7 rounded-xl shadow-xl shadow-[#e86c2a]/30 hover:shadow-[#e86c2a]/50 transition-all">
                Começar Agora — É Grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#1a2b4a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="Radar Eleitoral" className="h-10 w-auto brightness-200" />
                <span className="text-xl font-bold">Radar Eleitoral</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Tecnologia a serviço da política. A plataforma mais completa para gestão de gabinetes e campanhas eleitorais do Brasil.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#c9a84c]">Links</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Depoimentos</a></li>
                <li><button onClick={() => navigate("/auth")} className="hover:text-white transition-colors">Entrar</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#c9a84c]">Contato</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> (95) 99999-0000</li>
                <li>contato@radareleitoral.net</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/30">
            © {new Date().getFullYear()} Radar Eleitoral. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
