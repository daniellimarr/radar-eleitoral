import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Settings, Plus, Send, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const SCHEDULE_OPTIONS = [
  { value: "06:00", label: "06:00" },
  { value: "07:00", label: "07:00" },
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "12:00", label: "12:00" },
];

const VARIABLE_OPTIONS = [
  { value: "nome", label: "Nome" },
  { value: "apelido", label: "Apelido" },
  { value: "bairro", label: "Bairro" },
  { value: "cidade", label: "Cidade" },
];

type Automation = {
  id: string;
  name: string;
  message_template: string;
  schedule_time: string | null;
  is_active: boolean;
  include_variable: string | null;
  created_at: string;
};

type SendLog = {
  id: string;
  contact_name: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export default function WhatsApp() {
  const { tenantId } = useAuth();
  const [activeTab, setActiveTab] = useState("automacao");
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Form state
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [includeVariable, setIncludeVariable] = useState("nome");
  const [messageTemplate, setMessageTemplate] = useState(
    "Feliz aniversário, {nome}! 🎂🎉 Desejamos tudo de melhor para você!"
  );
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleOpenWhatsAppWeb = () => {
    window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (tenantId) {
      fetchAutomations();
      fetchSendLogs();
    }
  }, [tenantId]);

  const fetchAutomations = async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("whatsapp_automations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (data) {
      setAutomations(data);
      if (data.length > 0) {
        const first = data[0];
        setScheduleTime(first.schedule_time || "08:00");
        setIncludeVariable(first.include_variable || "nome");
        setMessageTemplate(first.message_template);
        setIsActive(first.is_active);
        setEditingId(first.id);
      }
    }
    if (error) console.error(error);
  };

  const fetchSendLogs = async () => {
    if (!tenantId) return;
    const { data, error } = await supabase
      .from("whatsapp_send_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setSendLogs(data);
    if (error) console.error(error);
  };

  const handleInsertVariable = () => {
    const varTag = `{${includeVariable}}`;
    setMessageTemplate((prev) => prev + varTag);
  };

  const handleSave = async () => {
    if (!tenantId) return;
    setLoading(true);

    const payload = {
      tenant_id: tenantId,
      name: "Aniversariantes",
      message_template: messageTemplate,
      schedule_time: scheduleTime,
      is_active: isActive,
      include_variable: includeVariable,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("whatsapp_automations")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("whatsapp_automations").insert(payload));
    }

    setLoading(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Automação atualizada!" : "Automação cadastrada!" });
      fetchAutomations();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enviado":
        return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"><CheckCircle className="h-3 w-3 mr-1" />Enviado</Badge>;
      case "erro":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      case "pendente":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automação</h1>
          <p className="text-muted-foreground">
            Disparo de WhatsApp para Aniversariantes AUTOMÁTICO
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleOpenWhatsAppWeb}>
            <MessageSquare className="h-4 w-4" />
            Conectar WhatsApp
          </Button>

          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-primary">
                  <MessageSquare className="h-5 w-5" />
                  Configurar WhatsApp
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  {[
                    { step: 1, text: "Abra o WhatsApp 📱 no seu celular." },
                    { step: 2, text: "Toque em Mais opções ⋮ no Android ou em Configurações ⚙ no iPhone." },
                    { step: 3, text: "Toque em Dispositivos conectados e, em seguida, em Conectar dispositivo." },
                    { step: 4, text: "Escaneie o QR code para confirmar." },
                  ].map((item, idx) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary text-primary font-semibold text-sm">
                          {item.step}
                        </div>
                        {idx < 3 && <div className="w-0.5 h-6 bg-border mt-1" />}
                      </div>
                      <p className="text-sm pt-1.5 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>

                <Button className="w-full gap-2" onClick={handleOpenWhatsAppWeb}>
                  <ExternalLink className="h-4 w-4" />
                  Abrir WhatsApp Web
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="automacao" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="envios" className="gap-2">
            <Send className="h-4 w-4" />
            Rel. envios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automacao" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Configurar Mensagem</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="active-switch" className="text-sm">Ativo</Label>
                    <Switch
                      id="active-switch"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Agendar todos os dias</Label>
                    <Select value={scheduleTime} onValueChange={setScheduleTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="SELECIONE" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Incluir Variável</Label>
                    <div className="flex gap-2">
                      <Select value={includeVariable} onValueChange={setIncludeVariable}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="SELECIONE" />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={handleInsertVariable}>
                        Inserir
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">
                      Mensagem (<span className="font-bold">*negrito*</span> e quebra de linha)
                    </Label>
                    <Textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Digite aqui a mensagem"
                      className="min-h-[160px]"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={loading || !messageTemplate.trim()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {editingId ? "Salvar automação" : "Cadastrar automação"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Phone Preview */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-[280px] h-[560px] bg-foreground/5 rounded-[3rem] border-4 border-foreground/20 overflow-hidden shadow-xl">
                <div className="absolute top-0 inset-x-0 h-8 bg-foreground/10 rounded-t-[2.5rem]" />
                <div className="mt-10 mx-3 flex-1 h-[calc(100%-6rem)] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiM2NjYiLz48L3N2Zz4=')] rounded-xl p-3 flex flex-col justify-end">
                  <div className="bg-[hsl(120,60%,90%)] rounded-lg p-3 text-sm text-foreground/80 max-w-[90%] self-end shadow-sm">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">
                      {messageTemplate.replace(/\{(\w+)\}/g, (_, v) => {
                        const map: Record<string, string> = { nome: "João", apelido: "Joãozinho", bairro: "Centro", cidade: "São Paulo" };
                        return map[v] || `{${v}}`;
                      })}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-12 bg-foreground/5 rounded-b-[2.5rem] flex items-center px-4">
                  <Input className="h-8 text-xs rounded-full bg-background" placeholder="Digite sua mensagem" disabled />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="envios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatório de Envios</CardTitle>
            </CardHeader>
            <CardContent>
              {sendLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum envio registrado ainda.</p>
                  <p className="text-sm mt-1">Os envios aparecerão aqui quando a automação processar os aniversariantes.</p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contato</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sendLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.contact_name || "—"}</TableCell>
                          <TableCell>{log.phone || "—"}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sent_at ? format(new Date(log.sent_at), "dd/MM/yyyy HH:mm") : format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{log.message || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
