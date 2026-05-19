import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

// Otimização: Memoização de componentes estáticos
const AuthBrand = memo(() => (
  <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
    <div className="text-primary-foreground space-y-8 max-w-lg text-center flex flex-col items-center">
      <img src={logoRadar} alt="Radar Eleitoral" className="h-40 w-40 rounded-2xl shadow-2xl" loading="lazy" />
      <h1 className="text-5xl font-black leading-tight">
        RADAR<br />
        <span className="text-warning">ELEITORAL</span>
      </h1>
      <p className="text-xl font-semibold">
        Gestão inteligente de gabinete.<br />
        Contatos, demandas e campanhas<br />
        em um só lugar.
      </p>
      <p className="text-sm opacity-75">Tecnologia a serviço da política</p>
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
      toast.error(error.message);
    } else {
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
    toast.success("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.");
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
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
      toast.success("Senha redefinida com sucesso! Você já pode entrar.");
      setView("auth");
      setActiveTab("login");
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src={logoRadar} alt="Radar Eleitoral" className="h-10 w-10 rounded" />
              <span className="text-2xl font-bold text-foreground tracking-tight">RADAR ELEITORAL</span>
            </div>
          </div>

          {view === "auth" && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Acessar</CardTitle>
                    <CardDescription>Entre com suas credenciais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="usuario@email.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" required />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button variant="link" onClick={() => setView("forgot-password")} className="text-sm text-muted-foreground">
                      Esqueci minha senha
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Novo Cadastro</CardTitle>
                    <CardDescription>Crie sua conta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input id="name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Seu nome" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">E-mail</Label>
                        <Input id="reg-email" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="usuario@email.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Senha</Label>
                        <Input id="reg-password" type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {view === "forgot-password" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="icon" onClick={() => setView("auth")}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>Recuperar Senha</CardTitle>
                </div>
                <CardDescription>Informe seu e-mail para receber as instruções de recuperação</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">E-mail</Label>
                    <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="usuario@email.com" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {view === "reset-password" && (
            <Card>
              <CardHeader>
                <CardTitle>Nova Senha</CardTitle>
                <CardDescription>Digite sua nova senha de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Atualizar Senha"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-sm text-muted-foreground">© 2009 – 2026</p>
        </div>
      </div>

      <AuthBrand />
    </div>
  );
}
