import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Users, ClipboardList, Crown, Rocket, BarChart3, ShieldCheck,
  ArrowRight, Zap, Eye, Building2, Vote, UserCheck, Briefcase, UsersRound
} from "lucide-react";
import logo from "@/assets/logo-radar-eleitoral.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
            <button onClick={() => scrollTo("about")} className="hover:text-[#FF6B00] transition-colors">Sobre</button>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }} className="text-sm font-medium text-gray-600">
                Sair
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="text-sm font-medium text-gray-600">
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth")}
                  className="bg-[#FF6B00] hover:bg-[#e55f00] text-white text-sm font-semibold px-5 rounded-lg shadow-md shadow-[#FF6B00]/20">
                  Acessar Sistema
                </Button>
              </>
            )}
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
                Contatos, demandas e estratégia de campanha em um só lugar. Organize sua base eleitoral, gerencie lideranças políticas e acompanhe demandas dos cidadãos de forma eficiente.
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Button onClick={() => navigate("/auth")} size="lg"
                  className="bg-[#FF6B00] hover:bg-[#e55f00] text-white text-base font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 transition-all">
                  Entrar no Sistema <ArrowRight className="ml-2 h-5 w-5" />
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
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Funcionalidades do Gabinete</h2>
            <p className="text-gray-500 mt-4">Tudo o que você precisa para uma gestão política eficiente.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-[#FF6B00]" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#111111] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={logo} alt="Radar Eleitoral" className="h-8 w-auto" />
            <span className="text-lg font-bold">Radar Eleitoral</span>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Radar Eleitoral. Sistema de uso interno do gabinete.</p>
        </div>
      </footer>
    </div>
  );
}
