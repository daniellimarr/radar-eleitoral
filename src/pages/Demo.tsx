import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, MessageSquare, Gift, ClipboardList, Calendar, Target, TrendingUp,
  DollarSign, MapPin, Crown, ArrowRight, BarChart3, Flag, Megaphone,
  Car, Package, Link2, Home, LogOut, Eye, ArrowLeft, Star, Phone,
  Mail, ChevronRight, Check, Shield
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

// ─── Fictional Data ───
const demoContacts = [
  { name: "Maria Silva", phone: "(69) 99812-3456", neighborhood: "Centro", engagement: "conquistado", leader: "Sim" },
  { name: "João Pereira", phone: "(69) 99834-5678", neighborhood: "Vila Nova", engagement: "em_prospeccao", leader: "Não" },
  { name: "Ana Costa", phone: "(69) 99856-7890", neighborhood: "Jardim América", engagement: "criando_envolvimento", leader: "Sim" },
  { name: "Carlos Souza", phone: "(69) 99878-9012", neighborhood: "São José", engagement: "conquistado", leader: "Não" },
  { name: "Fernanda Lima", phone: "(69) 99890-1234", neighborhood: "Boa Vista", engagement: "nao_trabalhado", leader: "Não" },
  { name: "Roberto Santos", phone: "(69) 99801-2345", neighborhood: "Caimbé", engagement: "conquistado", leader: "Sim" },
  { name: "Patricia Oliveira", phone: "(69) 99823-4567", neighborhood: "Mecejana", engagement: "em_prospeccao", leader: "Não" },
  { name: "Marcos Almeida", phone: "(69) 99845-6789", neighborhood: "Pintolândia", engagement: "criando_envolvimento", leader: "Não" },
];

const demoDemands = [
  { title: "Conserto de bueiro na Rua Principal", status: "aberta", priority: "alta", contact: "Maria Silva", date: "07/04/2026" },
  { title: "Iluminação pública na Vila Nova", status: "em_andamento", priority: "normal", contact: "João Pereira", date: "05/04/2026" },
  { title: "Limpeza de terreno baldio", status: "concluida", priority: "baixa", contact: "Ana Costa", date: "01/04/2026" },
  { title: "Instalação de lombada na Av. Norte", status: "aberta", priority: "alta", contact: "Carlos Souza", date: "06/04/2026" },
  { title: "Poda de árvores no Jardim América", status: "em_andamento", priority: "normal", contact: "Fernanda Lima", date: "03/04/2026" },
];

const demoAppointments = [
  { title: "Reunião com líderes do Centro", date: "08/04/2026", time: "09:00", status: "confirmado" },
  { title: "Visita à comunidade Vila Nova", date: "08/04/2026", time: "14:00", status: "a_confirmar" },
  { title: "Encontro com moradores Boa Vista", date: "09/04/2026", time: "10:00", status: "confirmado" },
  { title: "Reunião de campanha", date: "09/04/2026", time: "16:00", status: "confirmado" },
  { title: "Café com apoiadores", date: "10/04/2026", time: "08:00", status: "a_confirmar" },
];

const monthlyData = [
  { name: "Jan", cadastros: 120 }, { name: "Fev", cadastros: 185 }, { name: "Mar", cadastros: 250 },
  { name: "Abr", cadastros: 310 }, { name: "Mai", cadastros: 420 }, { name: "Jun", cadastros: 380 },
  { name: "Jul", cadastros: 510 }, { name: "Ago", cadastros: 620 }, { name: "Set", cadastros: 580 },
  { name: "Out", cadastros: 740 }, { name: "Nov", cadastros: 850 }, { name: "Dez", cadastros: 920 },
];

const engagementData = [
  { name: "Conquistado", value: 3240, color: "#a855f7" },
  { name: "Criando envolvimento", value: 2180, color: "#f59e0b" },
  { name: "Em prospecção", value: 1850, color: "#22c55e" },
  { name: "Não trabalhado", value: 1420, color: "#3b82f6" },
  { name: "Falta trabalhar", value: 980, color: "#6b7280" },
  { name: "Envolvimento perdido", value: 330, color: "#ef4444" },
];

const neighborhoodData = [
  { name: "Centro", value: 1840 }, { name: "Vila Nova", value: 1520 },
  { name: "Jardim América", value: 1280 }, { name: "São José", value: 1100 },
  { name: "Boa Vista", value: 980 }, { name: "Caimbé", value: 850 },
  { name: "Mecejana", value: 720 }, { name: "Pintolândia", value: 650 },
  { name: "Aparecida", value: 540 }, { name: "Buritis", value: 420 },
];

const financialData = [
  { month: "Jan", receitas: 5200, despesas: 3800 },
  { month: "Fev", receitas: 7400, despesas: 4200 },
  { month: "Mar", receitas: 8100, despesas: 5500 },
  { month: "Abr", receitas: 12000, despesas: 6800 },
];

const demoLeaders = [
  { name: "Maria Silva", contacts: 145, neighborhood: "Centro", score: 92 },
  { name: "Ana Costa", contacts: 128, neighborhood: "Jardim América", score: 87 },
  { name: "Roberto Santos", contacts: 112, neighborhood: "Caimbé", score: 85 },
  { name: "Pedro Nascimento", contacts: 98, neighborhood: "Vila Nova", score: 78 },
  { name: "Lúcia Ferreira", contacts: 86, neighborhood: "Boa Vista", score: 74 },
];

const statusColors: Record<string, string> = {
  aberta: "bg-yellow-100 text-yellow-800",
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
  confirmado: "bg-green-100 text-green-800",
  a_confirmar: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  confirmado: "Confirmado",
  a_confirmar: "A confirmar",
};

const engagementColors: Record<string, string> = {
  conquistado: "bg-purple-100 text-purple-800",
  em_prospeccao: "bg-green-100 text-green-800",
  criando_envolvimento: "bg-yellow-100 text-yellow-800",
  nao_trabalhado: "bg-blue-100 text-blue-800",
};

const engagementLabels: Record<string, string> = {
  conquistado: "Conquistado",
  em_prospeccao: "Em prospecção",
  criando_envolvimento: "Envolvimento",
  nao_trabalhado: "Não trabalhado",
};

const sidebarItems = [
  { title: "Início", icon: Home, tab: "dashboard" },
  { title: "Contatos", icon: Users, tab: "contacts" },
  { title: "Demandas", icon: ClipboardList, tab: "demands" },
  { title: "Agenda", icon: Calendar, tab: "appointments" },
  { title: "Lideranças", icon: BarChart3, tab: "leaders" },
  { title: "Financeiro", icon: DollarSign, tab: "financial" },
  { title: "Campanhas", icon: Flag, tab: "campaigns" },
];

export default function Demo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Demo Sidebar */}
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="p-4 flex items-center gap-2">
              <img src={logoRadar} alt="Radar Eleitoral" className="h-8 w-8 shrink-0 rounded" />
              <span className="font-bold text-lg text-foreground">RADAR ELEITORAL</span>
            </div>
            <div className="px-4 pb-4 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">D</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Demonstração</p>
                <p className="text-xs text-muted-foreground truncate">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">DEMO</Badge>
                </p>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.map((item) => (
                    <SidebarMenuItem key={item.tab}>
                      <SidebarMenuButton isActive={activeTab === item.tab} onClick={() => setActiveTab(item.tab)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Demo Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4" />
              <span>Modo Demonstração — Dados fictícios para visualização</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate("/auth")} className="text-xs font-bold">
              Assinar Agora <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h2 className="text-sm font-semibold text-muted-foreground">
                {sidebarItems.find(i => i.tab === activeTab)?.title}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Olá, <strong>Visitante</strong>
              </span>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">V</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {activeTab === "dashboard" && <DemoDashboard />}
            {activeTab === "contacts" && <DemoContacts />}
            {activeTab === "demands" && <DemoDemands />}
            {activeTab === "appointments" && <DemoAppointments />}
            {activeTab === "leaders" && <DemoLeaders />}
            {activeTab === "financial" && <DemoFinancial />}
            {activeTab === "campaigns" && <DemoCampaigns />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// ─── Dashboard Tab ───
function DemoDashboard() {
  const totalEngagement = engagementData.reduce((a, b) => a + b.value, 0);
  const statCards = [
    { label: "Contatos", value: "10.000", icon: Users, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
    { label: "Atendimentos hoje", value: "24", icon: MessageSquare, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { label: "Aniversariantes hoje", value: "8", icon: Gift, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Demandas abertas", value: "47", icon: ClipboardList, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Início</h1>
        <div className="flex items-center gap-2 text-sm bg-foreground text-background px-4 py-2 rounded-lg font-medium">
          <Calendar className="h-4 w-4" /> 08 de Abril, 2026
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Plano <span className="text-primary">Trimestral</span></p>
                <p className="text-xs text-muted-foreground">10.000 / 15.000 contatos · 10 usuários · Expira em 15/07/2026</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-40">
                <Progress value={67} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">67% usado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <div key={card.label} className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-full ${card.bgColor} flex items-center justify-center shrink-0`}>
                  <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Visão geral — Cadastros por mês</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="cadastros" fill="hsl(220, 70%, 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Termômetro de envolvimento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {engagementData.map((item) => {
              const pct = (item.value / totalEngagement) * 100;
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-44 shrink-0">{item.name}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-bold border rounded-full px-3 py-0.5" style={{ borderColor: item.color, color: item.color }}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Projeção de Votos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Campanha: <strong>Eleições 2026</strong></span>
            <span>Vereador - PARTIDO 12345</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Projeção estimada</span>
              <span className="font-bold">6.480 / 10.000</span>
            </div>
            <Progress value={64.8} className="h-3" />
            <p className="text-xs text-muted-foreground text-right">64.8% da meta</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Top 10 Bairros por Apoiadores
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={neighborhoodData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" fontSize={11} width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(145, 65%, 42%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Contacts Tab ───
function DemoContacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cadastro de Contatos</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Users className="h-4 w-4 mr-2" /> Novo Contato
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Líder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoContacts.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.neighborhood}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${engagementColors[c.engagement]}`}>
                      {engagementLabels[c.engagement]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.leader === "Sim" ? (
                      <Badge variant="outline" className="border-amber-400 text-amber-600">Líder</Badge>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Demands Tab ───
function DemoDemands() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Demandas</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <ClipboardList className="h-4 w-4 mr-2" /> Nova Demanda
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">12</p><p className="text-sm text-muted-foreground">Abertas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">8</p><p className="text-sm text-muted-foreground">Em andamento</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">27</p><p className="text-sm text-muted-foreground">Concluídas</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoDemands.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>{d.contact}</TableCell>
                  <TableCell>
                    <Badge variant={d.priority === "alta" ? "destructive" : "secondary"}>
                      {d.priority.charAt(0).toUpperCase() + d.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[d.status]}`}>
                      {statusLabels[d.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Appointments Tab ───
function DemoAppointments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Calendar className="h-4 w-4 mr-2" /> Novo Agendamento
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoAppointments.map((a, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.date} às {a.time}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[a.status]}`}>
                {statusLabels[a.status]}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Leaders Tab ───
function DemoLeaders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lideranças</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600">
          <Crown className="h-4 w-4 mr-2" /> Novo Líder
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoLeaders.map((l, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                    {l.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {l.neighborhood}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{l.contacts} contatos</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold">{l.score}</span>
                </div>
              </div>
              <Progress value={l.score} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Financial Tab ───
function DemoFinancial() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financeiro</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-600">R$ 32.700</p>
            <p className="text-sm text-muted-foreground">Total de Doações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold text-red-500">R$ 20.300</p>
            <p className="text-sm text-muted-foreground">Total de Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-600">R$ 12.400</p>
            <p className="text-sm text-muted-foreground">Saldo</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Receitas vs Despesas</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Campaigns Tab ───
function DemoCampaigns() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Campanhas</h1>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flag className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Eleições 2026</h2>
              <p className="text-sm text-muted-foreground">Vereador · PARTIDO · Nº 12345 · Boa Vista/RR</p>
            </div>
            <Badge className="ml-auto bg-green-100 text-green-800">Ativa</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">10.000</p>
              <p className="text-xs text-muted-foreground">Meta de votos</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">10.000</p>
              <p className="text-xs text-muted-foreground">Contatos</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Lideranças</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">R$ 50.000</p>
              <p className="text-xs text-muted-foreground">Limite de gastos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
