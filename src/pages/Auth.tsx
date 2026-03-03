import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users } from "lucide-react";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
    } else {
      toast.success("Cadastro realizado! Verifique seu e-mail.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src={logoRadar} alt="Radar Eleitoral" className="h-10 w-10 rounded" />
              <span className="text-2xl font-bold text-foreground tracking-tight">RADAR ELEITORAL</span>
            </div>
            <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
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

          <p className="text-center text-sm text-muted-foreground">© 2009 – 2026</p>
        </div>
      </div>

      {/* Right - Hero */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="text-primary-foreground space-y-6 max-w-lg">
          <h1 className="text-5xl font-black leading-tight">
            SUA INDICAÇÃO<br />
            <span className="text-warning">VALE DINHEIRO</span>
          </h1>
          <p className="text-xl font-semibold">
            Indicou. Fechou. Ganhou.<br />
            Cada indicação convertida<br />
            = 1 mensalidade grátis
          </p>
          <Button variant="outline" size="lg" className="bg-warning text-warning-foreground border-warning hover:bg-warning/90 text-lg font-bold px-8">
            Clique aqui e indique agora
          </Button>
        </div>
      </div>
    </div>
  );
}
