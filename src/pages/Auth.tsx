import { useState, useEffect, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

const AuthBrand = memo(() => (
  <div className="hidden lg:flex flex-1 bg-[#0f172a] items-center justify-center p-12 relative overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px]" />
    </div>
    
    <div className="text-white space-y-8 max-w-lg text-center flex flex-col items-center relative z-10">
      <div className="bg-primary p-4 rounded-3xl shadow-2xl shadow-primary/20 mb-4">
        <img src={logoRadar} alt="Radar Eleitoral" className="h-24 w-24 invert brightness-0" loading="lazy" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-6xl font-black leading-tight tracking-tighter text-white">
          RADAR<br />
          <span className="text-primary italic">ELEITORAL</span>
        </h1>
        <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
      </div>

      <div className="space-y-6 pt-4">
        <p className="text-xl font-medium text-slate-300 leading-relaxed">
          A inteligência que seu gabinete precisa para <span className="text-white font-bold">conquistar e gerir</span> sua base eleitoral com precisão.
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-left pt-4">
          {[
            "Gestão de Contatos",
            "Mapas Territoriais",
            "Controle Financeiro",
            "Automação WhatsApp"
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));
AuthBrand.displayName = "AuthBrand";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [view, setView] = useState<"auth" | "forgot-password" | "reset-password">("auth");
  
  const { signIn, signUp, resetPassword, updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      setView("reset-password");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user && view !== "reset-password") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seus dados.");
    } else {
      toast.success("Bem-vindo de volta!");
      navigate("/dashboard");
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(registerEmail, registerPassword, registerName);
    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setActiveTab("login");
    toast.success("Solicitação enviada! Aguarde a aprovação do administrador.");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Instruções enviadas para seu e-mail.");
      setView("auth");
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      setView("auth");
      setActiveTab("login");
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-slate-50/50">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="lg:hidden text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20">
              <img src={logoRadar} alt="Radar Eleitoral" className="h-10 w-10 invert brightness-0" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 text-center">RADAR <span className="text-primary italic">ELEITORAL</span></h2>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {view === "auth" ? (activeTab === "login" ? "Acesse sua conta" : "Comece agora") : 
               view === "forgot-password" ? "Recupere sua conta" : "Defina sua senha"}
            </h1>
            <p className="text-slate-500 text-sm">
              {view === "auth" ? (activeTab === "login" ? "Insira suas credenciais para gerir seu gabinete." : "Crie sua conta para profissionalizar sua campanha.") : 
               "Siga as instruções para garantir seu acesso."}
            </p>
          </div>

          {view === "auth" && (
            <div className="space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "login" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Entrar
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "register" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Cadastrar
                </button>
              </div>

              {activeTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="exemplo@email.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Senha</Label>
                        <button type="button" onClick={() => setView("forgot-password")} className="text-xs font-semibold text-primary hover:underline">Esqueceu a senha?</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="••••••••" required />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar no Sistema"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="Seu nome" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="reg-email" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="exemplo@email.com" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input id="reg-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="Mínimo 6 caracteres" required minLength={6} />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar minha conta"}
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 px-6 uppercase tracking-widest font-bold pt-2">
                    Ao continuar, você concorda com nossos termos de uso.
                  </p>
                </form>
              )}
            </div>
          )}

          {view === "forgot-password" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => setView("auth")} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors gap-2 uppercase tracking-wider">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </button>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">E-mail de recuperação</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="exemplo@email.com" required />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar link de recuperação"}
                </Button>
              </form>
            </div>
          )}

          {view === "reset-password" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-slate-700">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12 bg-white border-slate-200" placeholder="Mínimo 6 caracteres" required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Redefinir Senha"}
                </Button>
              </form>
            </div>
          )}

          <div className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ambiente 100% Seguro</span>
            </div>
          </div>
        </div>
      </div>

      <AuthBrand />
    </div>
  );
}
