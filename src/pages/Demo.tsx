import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, MessageSquare, Gift, ClipboardList, Calendar, Target, TrendingUp,
  DollarSign, MapPin, Crown, ArrowRight, BarChart3, Flag, Megaphone,
  Car, Package, Link2, Home, Eye, ArrowLeft, Star, Phone,
  Mail, FolderDown, Database, FileText, Shield, Send, Image,
  Video, Mic, Clock, CheckCircle, XCircle, AlertTriangle, Download
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
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
  { name: "Maria Silva", phone: "(69) 99812-3456", neighborhood: "Centro", engagement: "conquistado", leader: "Sim", email: "maria@email.com" },
  { name: "João Pereira", phone: "(69) 99834-5678", neighborhood: "Vila Nova", engagement: "em_prospeccao", leader: "Não", email: "joao@email.com" },
  { name: "Ana Costa", phone: "(69) 99856-7890", neighborhood: "Jardim América", engagement: "criando_envolvimento", leader: "Sim", email: "ana@email.com" },
  { name: "Carlos Souza", phone: "(69) 99878-9012", neighborhood: "São José", engagement: "conquistado", leader: "Não", email: "carlos@email.com" },
  { name: "Fernanda Lima", phone: "(69) 99890-1234", neighborhood: "Boa Vista", engagement: "nao_trabalhado", leader: "Não", email: "fernanda@email.com" },
  { name: "Roberto Santos", phone: "(69) 99801-2345", neighborhood: "Caimbé", engagement: "conquistado", leader: "Sim", email: "roberto@email.com" },
  { name: "Patricia Oliveira", phone: "(69) 99823-4567", neighborhood: "Mecejana", engagement: "em_prospeccao", leader: "Não", email: "patricia@email.com" },
  { name: "Marcos Almeida", phone: "(69) 99845-6789", neighborhood: "Pintolândia", engagement: "criando_envolvimento", leader: "Não", email: "marcos@email.com" },
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

const demoVehicles = [
  { plate: "ABC-1D23", model: "Fiat Strada", color: "Branco", driver: "José Silva", status: "disponivel" },
  { plate: "DEF-4G56", model: "VW Gol", color: "Prata", driver: "Maria Souza", status: "em_uso" },
  { plate: "GHI-7H89", model: "Toyota Hilux", color: "Preto", driver: "Carlos Lima", status: "disponivel" },
  { plate: "JKL-0I12", model: "Fiat Toro", color: "Vermelho", driver: "Ana Costa", status: "manutencao" },
];

const demoMaterials = [
  { name: "Santinhos 10x15", type: "Impresso", quantity: 50000, distributed: 32000, location: "Galpão Central" },
  { name: "Adesivos para carro", type: "Adesivo", quantity: 5000, distributed: 3200, location: "Sede" },
  { name: "Bandeiras 2m", type: "Bandeira", quantity: 200, distributed: 145, location: "Galpão Central" },
  { name: "Camisetas campanha", type: "Vestuário", quantity: 3000, distributed: 1800, location: "Sede" },
  { name: "Bonés personalizados", type: "Vestuário", quantity: 2000, distributed: 1500, location: "Sede" },
];

const demoVisitRequests = [
  { title: "Visita ao Bairro São José", requester: "Maria Silva", date: "10/04/2026", status: "pendente", sound: true, chairs: 50 },
  { title: "Evento na Praça Central", requester: "João Pereira", date: "12/04/2026", status: "aprovado", sound: true, chairs: 100 },
  { title: "Reunião no Salão Comunitário", requester: "Ana Costa", date: "15/04/2026", status: "pendente", sound: false, chairs: 30 },
  { title: "Carreata Vila Nova", requester: "Roberto Santos", date: "18/04/2026", status: "rejeitado", sound: true, chairs: 0 },
];

const demoRegistrationLinks = [
  { slug: "lider-maria", leader: "Maria Silva", registrations: 145, active: true, created: "01/03/2026" },
  { slug: "lider-ana", leader: "Ana Costa", registrations: 128, active: true, created: "05/03/2026" },
  { slug: "lider-roberto", leader: "Roberto Santos", registrations: 112, active: true, created: "10/03/2026" },
  { slug: "lider-pedro", leader: "Pedro Nascimento", registrations: 98, active: false, created: "15/03/2026" },
];

const demoContentPlans = [
  { titulo: "Post Dia da Saúde", tipo: "Post", plataforma: "Instagram", data: "08/04/2026", status: "publicado", custo: 150 },
  { titulo: "Vídeo Visita ao Bairro", tipo: "Vídeo", plataforma: "YouTube", data: "09/04/2026", status: "em_producao", custo: 500 },
  { titulo: "Story Live Q&A", tipo: "Story", plataforma: "Instagram", data: "10/04/2026", status: "agendado", custo: 0 },
  { titulo: "Post Conquistas da Semana", tipo: "Post", plataforma: "Facebook", data: "11/04/2026", status: "rascunho", custo: 200 },
  { titulo: "Podcast Ep. 12", tipo: "Áudio", plataforma: "Spotify", data: "12/04/2026", status: "agendado", custo: 100 },
];

const demoCampaignFiles = [
  { name: "Logo Campanha.png", category: "Logotipos", size: "2.4 MB", date: "01/03/2026" },
  { name: "Jingle Oficial.mp3", category: "Áudio", size: "5.1 MB", date: "15/03/2026" },
  { name: "Plano de Governo.pdf", category: "Documentos", size: "3.8 MB", date: "20/03/2026" },
  { name: "Vídeo Institucional.mp4", category: "Vídeos", size: "120 MB", date: "25/03/2026" },
  { name: "Kit Redes Sociais.zip", category: "Marketing", size: "45 MB", date: "01/04/2026" },
  { name: "Manual de Identidade.pdf", category: "Documentos", size: "8.2 MB", date: "05/03/2026" },
];

const demoChatMessages = [
  { sender: "Maria Silva", message: "Bom dia equipe! Os materiais para o evento de amanhã já estão prontos?", time: "08:15", avatar: "MS" },
  { sender: "Carlos Souza", message: "Sim, já separei tudo. 500 santinhos e 50 bandeiras.", time: "08:22", avatar: "CS" },
  { sender: "Ana Costa", message: "Ótimo! Também confirmei o som para o evento.", time: "08:30", avatar: "AC" },
  { sender: "João Pereira", message: "Pessoal, preciso de mais 3 voluntários para o bairro Vila Nova.", time: "09:00", avatar: "JP" },
  { sender: "Roberto Santos", message: "Posso indicar 2 pessoas do meu grupo. Vou enviar os contatos.", time: "09:15", avatar: "RS" },
];

const demoWhatsappAutomations = [
  { name: "Boas-vindas novo cadastro", status: true, sent: 2450, template: "Olá {nome}! Bem-vindo(a) à nossa rede..." },
  { name: "Aniversariante do dia", status: true, sent: 890, template: "Parabéns {nome}! Desejamos um feliz aniversário..." },
  { name: "Lembrete de evento", status: false, sent: 320, template: "Não esqueça! Amanhã teremos..." },
  { name: "Agradecimento pós-visita", status: true, sent: 156, template: "Obrigado pela visita, {nome}!..." },
];

const demoReportsData = [
  { month: "Jan", contacts: 120, demands: 15, events: 4 },
  { month: "Fev", contacts: 185, demands: 22, events: 6 },
  { month: "Mar", contacts: 250, demands: 28, events: 8 },
  { month: "Abr", contacts: 310, demands: 35, events: 10 },
];

const statusColors: Record<string, string> = {
  aberta: "bg-yellow-100 text-yellow-800",
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
  confirmado: "bg-green-100 text-green-800",
  a_confirmar: "bg-yellow-100 text-yellow-800",
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  disponivel: "bg-green-100 text-green-800",
  em_uso: "bg-blue-100 text-blue-800",
  manutencao: "bg-red-100 text-red-800",
  publicado: "bg-green-100 text-green-800",
  em_producao: "bg-blue-100 text-blue-800",
  agendado: "bg-purple-100 text-purple-800",
  rascunho: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta", em_andamento: "Em andamento", concluida: "Concluída",
  confirmado: "Confirmado", a_confirmar: "A confirmar",
  pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado",
  disponivel: "Disponível", em_uso: "Em uso", manutencao: "Manutenção",
  publicado: "Publicado", em_producao: "Em produção", agendado: "Agendado", rascunho: "Rascunho",
};

const engagementColors: Record<string, string> = {
  conquistado: "bg-purple-100 text-purple-800",
  em_prospeccao: "bg-green-100 text-green-800",
  criando_envolvimento: "bg-yellow-100 text-yellow-800",
  nao_trabalhado: "bg-blue-100 text-blue-800",
};

const engagementLabels: Record<string, string> = {
  conquistado: "Conquistado", em_prospeccao: "Em prospecção",
  criando_envolvimento: "Envolvimento", nao_trabalhado: "Não trabalhado",
};

const sidebarItems = [
  { title: "Início", icon: Home, tab: "dashboard" },
  { title: "Campanhas", icon: Flag, tab: "campaigns" },
  { title: "Contatos", icon: Users, tab: "contacts" },
  { title: "Demandas", icon: ClipboardList, tab: "demands" },
  { title: "Agenda", icon: Calendar, tab: "appointments" },
  { title: "Lideranças", icon: BarChart3, tab: "leaders" },
  { title: "Marketing", icon: Megaphone, tab: "marketing" },
  { title: "Arquivos", icon: FolderDown, tab: "files" },
  { title: "Financeiro", icon: DollarSign, tab: "financial" },
  { title: "Mapa", icon: MapPin, tab: "map" },
  { title: "Chat", icon: MessageSquare, tab: "chat" },
  { title: "WhatsApp", icon: Send, tab: "whatsapp" },
  { title: "Veículos", icon: Car, tab: "vehicles" },
  { title: "Materiais", icon: Package, tab: "materials" },
  { title: "Visitas", icon: Calendar, tab: "visits" },
  { title: "Links", icon: Link2, tab: "links" },
  { title: "Relatórios", icon: FileText, tab: "reports" },
  { title: "Backup", icon: Database, tab: "backup" },
];

export default function Demo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
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
                  {sidebarItems.slice(0, 6).map((item) => (
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

            <SidebarGroup>
              <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.slice(6, 12).map((item) => (
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

            <SidebarGroup>
              <SidebarGroupLabel>Coordenação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarItems.slice(12).map((item) => (
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

        <div className="flex-1 flex flex-col min-w-0">
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
            {activeTab === "marketing" && <DemoMarketing />}
            {activeTab === "files" && <DemoCampaignFiles />}
            {activeTab === "map" && <DemoMap />}
            {activeTab === "chat" && <DemoChat />}
            {activeTab === "whatsapp" && <DemoWhatsApp />}
            {activeTab === "vehicles" && <DemoVehicles />}
            {activeTab === "materials" && <DemoMaterials />}
            {activeTab === "visits" && <DemoVisitRequests />}
            {activeTab === "links" && <DemoRegistrationLinks />}
            {activeTab === "reports" && <DemoReports />}
            {activeTab === "backup" && <DemoBackup />}
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
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Users className="h-4 w-4 mr-2" /> Novo Contato</Button>
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
                    {c.leader === "Sim" ? <Badge variant="outline" className="border-amber-400 text-amber-600">Líder</Badge> : "—"}
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
        <Button className="bg-emerald-500 hover:bg-emerald-600"><ClipboardList className="h-4 w-4 mr-2" /> Nova Demanda</Button>
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
                  <TableCell><Badge variant={d.priority === "alta" ? "destructive" : "secondary"}>{d.priority.charAt(0).toUpperCase() + d.priority.slice(1)}</Badge></TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded-full ${statusColors[d.status]}`}>{statusLabels[d.status]}</span></TableCell>
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
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Calendar className="h-4 w-4 mr-2" /> Novo Agendamento</Button>
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
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
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
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Crown className="h-4 w-4 mr-2" /> Novo Líder</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoLeaders.map((l, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">{l.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {l.neighborhood}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{l.contacts} contatos</span>
                <div className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /><span className="font-bold">{l.score}</span></div>
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
        <Card><CardContent className="p-4 text-center"><DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" /><p className="text-2xl font-bold text-green-600">R$ 32.700</p><p className="text-sm text-muted-foreground">Total de Doações</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="h-8 w-8 mx-auto text-red-500 mb-2" /><p className="text-2xl font-bold text-red-500">R$ 20.300</p><p className="text-sm text-muted-foreground">Total de Despesas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><BarChart3 className="h-8 w-8 mx-auto text-blue-600 mb-2" /><p className="text-2xl font-bold text-blue-600">R$ 12.400</p><p className="text-sm text-muted-foreground">Saldo</p></CardContent></Card>
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
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center"><Flag className="h-8 w-8 text-primary" /></div>
            <div>
              <h2 className="text-xl font-bold">Eleições 2026</h2>
              <p className="text-sm text-muted-foreground">Vereador · PARTIDO · Nº 12345 · Boa Vista/RR</p>
            </div>
            <Badge className="ml-auto bg-green-100 text-green-800">Ativa</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">10.000</p><p className="text-xs text-muted-foreground">Meta de votos</p></div>
            <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">10.000</p><p className="text-xs text-muted-foreground">Contatos</p></div>
            <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">5</p><p className="text-xs text-muted-foreground">Lideranças</p></div>
            <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">R$ 50.000</p><p className="text-xs text-muted-foreground">Limite de gastos</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Marketing Tab ───
function DemoMarketing() {
  const platformData = [
    { name: "Instagram", posts: 24, alcance: 45000, color: "#E1306C" },
    { name: "Facebook", posts: 18, alcance: 32000, color: "#1877F2" },
    { name: "YouTube", posts: 6, alcance: 18000, color: "#FF0000" },
    { name: "TikTok", posts: 12, alcance: 28000, color: "#000000" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Marketing</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Megaphone className="h-4 w-4 mr-2" /> Novo Conteúdo</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {platformData.map((p) => (
          <Card key={p.name}>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold" style={{ color: p.color }}>{p.posts}</p>
              <p className="text-xs text-muted-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(p.alcance / 1000).toFixed(0)}k alcance</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Plano de Conteúdo</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Impulsionamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoContentPlans.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{c.titulo}</TableCell>
                  <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                  <TableCell>{c.plataforma}</TableCell>
                  <TableCell className="text-muted-foreground">{c.data}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status]}`}>{statusLabels[c.status]}</span></TableCell>
                  <TableCell>{c.custo > 0 ? `R$ ${c.custo}` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Campaign Files Tab ───
function DemoCampaignFiles() {
  const categoryIcons: Record<string, typeof Image> = {
    Logotipos: Image, Áudio: Mic, Documentos: FileText, Vídeos: Video, Marketing: Megaphone,
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Arquivos da Campanha</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><FolderDown className="h-4 w-4 mr-2" /> Upload</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoCampaignFiles.map((f, i) => {
          const Icon = categoryIcons[f.category] || FileText;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.category} · {f.size}</p>
                    <p className="text-xs text-muted-foreground">{f.date}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0"><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Map Tab ───
function DemoMap() {
  const mapPoints = [
    { neighborhood: "Centro", contacts: 1840, lat: "2.8195° N", lng: "60.6714° W" },
    { neighborhood: "Vila Nova", contacts: 1520, lat: "2.8320° N", lng: "60.6890° W" },
    { neighborhood: "Jardim América", contacts: 1280, lat: "2.8050° N", lng: "60.6600° W" },
    { neighborhood: "São José", contacts: 1100, lat: "2.8100° N", lng: "60.6500° W" },
    { neighborhood: "Boa Vista", contacts: 980, lat: "2.8250° N", lng: "60.6750° W" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mapa de Georreferenciamento</h1>
      <Card>
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl h-80 flex items-center justify-center border-2 border-dashed border-emerald-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-primary" style={{
                  width: `${Math.random() * 30 + 10}px`, height: `${Math.random() * 30 + 10}px`,
                  left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 + 0.2,
                }} />
              ))}
            </div>
            <div className="text-center z-10">
              <MapPin className="h-16 w-16 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold">Mapa Interativo</p>
              <p className="text-sm text-muted-foreground">Visualize seus contatos no mapa por localização</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Distribuição por Bairro</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bairro</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Cobertura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapPoints.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{p.neighborhood}</TableCell>
                  <TableCell>{p.contacts.toLocaleString()}</TableCell>
                  <TableCell><Progress value={(p.contacts / 1840) * 100} className="h-2 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Chat Tab ───
function DemoChat() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Chat Interno</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Conversas</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-1">
            {["Equipe Geral", "Coordenação Centro", "Marketing", "Líderes de Bairro"].map((name, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${i === 0 ? "bg-primary/10" : "hover:bg-muted"}`}>
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/20 text-primary text-xs">{name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">Última mensagem...</p>
                </div>
                {i < 2 && <Badge className="bg-primary text-primary-foreground text-[10px]">{i + 1}</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b"><CardTitle className="text-sm">Equipe Geral</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4 h-80 overflow-auto">
            {demoChatMessages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-xs bg-primary/20 text-primary">{m.avatar}</AvatarFallback></Avatar>
                <div className={`max-w-[70%] ${i % 2 === 0 ? "bg-muted" : "bg-primary/10"} rounded-lg p-3`}>
                  <p className="text-xs font-semibold mb-1">{m.sender}</p>
                  <p className="text-sm">{m.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{m.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t flex gap-2">
            <input className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm" placeholder="Digite sua mensagem..." disabled />
            <Button size="icon" disabled><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── WhatsApp Tab ───
function DemoWhatsApp() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Send className="h-4 w-4 mr-2" /> Nova Automação</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><Send className="h-8 w-8 mx-auto text-green-600 mb-2" /><p className="text-2xl font-bold text-green-600">3.816</p><p className="text-sm text-muted-foreground">Mensagens Enviadas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" /><p className="text-2xl font-bold text-blue-600">3</p><p className="text-sm text-muted-foreground">Automações Ativas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="h-8 w-8 mx-auto text-purple-600 mb-2" /><p className="text-2xl font-bold text-purple-600">8.420</p><p className="text-sm text-muted-foreground">Contatos com WhatsApp</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Automações</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviadas</TableHead>
                <TableHead>Modelo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoWhatsappAutomations.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge className={a.status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {a.status ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.sent.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{a.template}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Vehicles Tab ───
function DemoVehicles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Veículos</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Car className="h-4 w-4 mr-2" /> Novo Veículo</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">2</p><p className="text-sm text-muted-foreground">Disponíveis</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">1</p><p className="text-sm text-muted-foreground">Em uso</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">1</p><p className="text-sm text-muted-foreground">Manutenção</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoVehicles.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono font-bold">{v.plate}</TableCell>
                  <TableCell>{v.model}</TableCell>
                  <TableCell>{v.color}</TableCell>
                  <TableCell>{v.driver}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded-full ${statusColors[v.status]}`}>{statusLabels[v.status]}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Materials Tab ───
function DemoMaterials() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Material de Campanha</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Package className="h-4 w-4 mr-2" /> Novo Material</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Distribuído</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Local</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoMaterials.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                  <TableCell>{m.quantity.toLocaleString()}</TableCell>
                  <TableCell>{m.distributed.toLocaleString()}</TableCell>
                  <TableCell><Progress value={(m.distributed / m.quantity) * 100} className="h-2 w-20" /></TableCell>
                  <TableCell className="text-muted-foreground">{m.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Visit Requests Tab ───
function DemoVisitRequests() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Solicitações de Visita</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Calendar className="h-4 w-4 mr-2" /> Nova Solicitação</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">2</p><p className="text-sm text-muted-foreground">Pendentes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">1</p><p className="text-sm text-muted-foreground">Aprovadas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">1</p><p className="text-sm text-muted-foreground">Rejeitadas</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cadeiras</TableHead>
                <TableHead>Som</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoVisitRequests.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{v.title}</TableCell>
                  <TableCell>{v.requester}</TableCell>
                  <TableCell className="text-muted-foreground">{v.date}</TableCell>
                  <TableCell>{v.chairs > 0 ? v.chairs : "—"}</TableCell>
                  <TableCell>{v.sound ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded-full ${statusColors[v.status]}`}>{statusLabels[v.status]}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Registration Links Tab ───
function DemoRegistrationLinks() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Links de Cadastro</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Link2 className="h-4 w-4 mr-2" /> Novo Link</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>Líder</TableHead>
                <TableHead>Cadastros</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoRegistrationLinks.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-primary">radareleitoral.app/cadastro/{l.slug}</TableCell>
                  <TableCell className="font-medium">{l.leader}</TableCell>
                  <TableCell><Badge variant="outline">{l.registrations}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{l.created}</TableCell>
                  <TableCell>
                    <Badge className={l.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {l.active ? "Ativo" : "Inativo"}
                    </Badge>
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

// ─── Reports Tab ───
function DemoReports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Users className="h-6 w-6 mx-auto text-emerald-600 mb-1" /><p className="text-xl font-bold">10.000</p><p className="text-xs text-muted-foreground">Total Contatos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><ClipboardList className="h-6 w-6 mx-auto text-orange-600 mb-1" /><p className="text-xl font-bold">100</p><p className="text-xs text-muted-foreground">Total Demandas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Calendar className="h-6 w-6 mx-auto text-blue-600 mb-1" /><p className="text-xl font-bold">28</p><p className="text-xs text-muted-foreground">Eventos Realizados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Crown className="h-6 w-6 mx-auto text-amber-600 mb-1" /><p className="text-xl font-bold">5</p><p className="text-xs text-muted-foreground">Lideranças Ativas</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoReportsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="contacts" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Contatos" />
              <Area type="monotone" dataKey="demands" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Demandas" />
              <Area type="monotone" dataKey="events" stackId="3" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Eventos" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Últimas Ações de Auditoria</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { action: "Novo contato cadastrado", user: "Maria Silva", time: "Há 5 min" },
              { action: "Demanda atualizada para concluída", user: "Carlos Souza", time: "Há 15 min" },
              { action: "Evento criado", user: "Ana Costa", time: "Há 1 hora" },
              { action: "Material distribuído", user: "Roberto Santos", time: "Há 2 horas" },
              { action: "Login realizado", user: "João Pereira", time: "Há 3 horas" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Exportar Relatórios</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Relatório de Contatos", "Relatório de Demandas", "Relatório Financeiro", "Relatório de Lideranças"].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">{r}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled><Download className="h-3 w-3 mr-1" /> PDF</Button>
                  <Button size="sm" variant="outline" disabled><Download className="h-3 w-3 mr-1" /> Excel</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Backup Tab ───
function DemoBackup() {
  const backups = [
    { date: "08/04/2026 03:00", size: "245 MB", status: "success", tables: 24 },
    { date: "07/04/2026 03:00", size: "242 MB", status: "success", tables: 24 },
    { date: "06/04/2026 03:00", size: "238 MB", status: "success", tables: 24 },
    { date: "05/04/2026 03:00", size: "235 MB", status: "failed", tables: 0 },
    { date: "04/04/2026 03:00", size: "230 MB", status: "success", tables: 24 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Backup</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600"><Database className="h-4 w-4 mr-2" /> Backup Manual</Button>
      </div>
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Backup automático ativo</p>
            <p className="text-sm text-green-700">Último backup: 08/04/2026 às 03:00 — 245 MB</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Histórico de Backups</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Tabelas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{b.date}</TableCell>
                  <TableCell>{b.size}</TableCell>
                  <TableCell>{b.tables > 0 ? b.tables : "—"}</TableCell>
                  <TableCell>
                    {b.status === "success" ? (
                      <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Sucesso</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Falhou</Badge>
                    )}
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
