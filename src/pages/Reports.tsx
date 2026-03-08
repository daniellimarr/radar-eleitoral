import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileDown, Printer, Search, Users, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { exportTableToPdf, printTable } from "@/lib/exportPdf";
import logoRadar from "@/assets/logo-radar-eleitoral.png";

const engagementLabels: Record<string, string> = {
  nao_trabalhado: "Não trabalhado",
  em_prospeccao: "Em prospecção",
  conquistado: "Conquistado",
  criando_envolvimento: "Criando envolvimento",
  falta_trabalhar: "Falta trabalhar",
  envolvimento_perdido: "Envolvimento perdido",
};

export default function Reports() {
  const { tenantId } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedLeaders, setSelectedLeaders] = useState<Set<string>>(new Set());
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);
  const [leaderVoters, setLeaderVoters] = useState<Record<string, any[]>>({});
  const [voterCounts, setVoterCounts] = useState<Record<string, number>>({});
  const [searchContacts, setSearchContacts] = useState("");
  const [searchLeaders, setSearchLeaders] = useState("");
  const [loading, setLoading] = useState(false);

  const contactsTableRef = useRef<HTMLDivElement>(null);
  const leadersTableRef = useRef<HTMLDivElement>(null);

  const fetchContacts = async () => {
    if (!tenantId) return;
    let query = supabase.from("contacts_decrypted").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("name");
    if (searchContacts) query = query.ilike("name", `%${searchContacts}%`);
    const { data } = await query;
    setContacts(data || []);
  };

  const fetchLeaders = async () => {
    if (!tenantId) return;
    let query = supabase.from("contacts").select("*").eq("tenant_id", tenantId).eq("is_leader", true).is("deleted_at", null).order("name");
    if (searchLeaders) query = query.ilike("name", `%${searchLeaders}%`);
    const { data } = await query;
    setLeaders(data || []);

    if (data && data.length > 0) {
      const leaderIds = data.map((l: any) => l.id);
      const { data: allVoters } = await supabase
        .from("contacts")
        .select("leader_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("leader_id", leaderIds);
      const counts: Record<string, number> = {};
      (allVoters || []).forEach((v: any) => {
        counts[v.leader_id] = (counts[v.leader_id] || 0) + 1;
      });
      setVoterCounts(counts);
    }
  };

  const fetchLeaderVoters = async (leaderId: string) => {
    if (leaderVoters[leaderId]) return;
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId!)
      .eq("leader_id", leaderId)
      .is("deleted_at", null)
      .order("name");
    setLeaderVoters(prev => ({ ...prev, [leaderId]: data || [] }));
  };

  useEffect(() => { fetchContacts(); }, [tenantId, searchContacts]);
  useEffect(() => { fetchLeaders(); }, [tenantId, searchLeaders]);

  const toggleExpandLeader = async (leaderId: string) => {
    if (expandedLeader === leaderId) {
      setExpandedLeader(null);
    } else {
      setExpandedLeader(leaderId);
      await fetchLeaderVoters(leaderId);
    }
  };

  // Selection helpers
  const toggleContactSelection = (id: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllContacts = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const toggleLeaderSelection = (id: string) => {
    setSelectedLeaders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllLeaders = () => {
    if (selectedLeaders.size === leaders.length) {
      setSelectedLeaders(new Set());
    } else {
      setSelectedLeaders(new Set(leaders.map(l => l.id)));
    }
  };

  // Build a printable element with only selected data
  const buildSelectedElement = (
    type: "contacts" | "leaders",
    selected: Set<string>,
    data: any[]
  ): HTMLDivElement => {
    const container = document.createElement("div");
    container.style.cssText = "font-family: Arial, sans-serif; padding: 0; background: white; color: #333;";

    const filteredData = data.filter(d => selected.has(d.id));

    if (type === "contacts") {
      container.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#1e3a5f; color:white;">
              <th style="padding:8px 6px; text-align:left;">#</th>
              <th style="padding:8px 6px; text-align:left;">Nome</th>
              <th style="padding:8px 6px; text-align:left;">Celular</th>
              <th style="padding:8px 6px; text-align:left;">Cidade</th>
              <th style="padding:8px 6px; text-align:left;">Bairro</th>
              <th style="padding:8px 6px; text-align:left;">Envolvimento</th>
              <th style="padding:8px 6px; text-align:left;">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((c, i) => `
              <tr style="border-bottom:1px solid #ddd;${i % 2 === 1 ? 'background:#f9f9f9;' : ''}">
                <td style="padding:6px;">${i + 1}</td>
                <td style="padding:6px; font-weight:500;">${c.name}</td>
                <td style="padding:6px;">${c.phone || "-"}</td>
                <td style="padding:6px;">${c.city || "-"}</td>
                <td style="padding:6px;">${c.neighborhood || "-"}</td>
                <td style="padding:6px;">${engagementLabels[c.engagement] || c.engagement || "-"}</td>
                <td style="padding:6px;">${new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <p style="margin-top:12px; font-size:11px; color:#666;">Total: ${filteredData.length} contato(s)</p>
      `;
    } else {
      // Leaders with their voters
      let html = "";
      for (const leader of filteredData) {
        const voters = leaderVoters[leader.id] || [];
        html += `
          <div style="margin-bottom:24px; page-break-inside:avoid;">
            <h3 style="color:#1e3a5f; border-bottom:2px solid #1e3a5f; padding-bottom:4px; margin-bottom:8px;">
              Liderança: ${leader.name}
            </h3>
            <p style="font-size:11px; color:#666; margin-bottom:8px;">
              Celular: ${leader.phone || "-"} | Cidade: ${leader.city || "-"} | Bairro: ${leader.neighborhood || "-"}
            </p>
            ${voters.length === 0
              ? '<p style="font-size:12px; color:#999;">Nenhum eleitor cadastrado</p>'
              : `<table style="width:100%; border-collapse:collapse; font-size:11px;">
                  <thead>
                    <tr style="background:#2a5a8f; color:white;">
                      <th style="padding:6px 4px; text-align:left;">#</th>
                      <th style="padding:6px 4px; text-align:left;">Nome</th>
                      <th style="padding:6px 4px; text-align:left;">Celular</th>
                      <th style="padding:6px 4px; text-align:left;">Cidade</th>
                      <th style="padding:6px 4px; text-align:left;">Bairro</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${voters.map((v: any, j: number) => `
                      <tr style="border-bottom:1px solid #eee;${j % 2 === 1 ? 'background:#f9f9f9;' : ''}">
                        <td style="padding:4px;">${j + 1}</td>
                        <td style="padding:4px; font-weight:500;">${v.name}</td>
                        <td style="padding:4px;">${v.phone || "-"}</td>
                        <td style="padding:4px;">${v.city || "-"}</td>
                        <td style="padding:4px;">${v.neighborhood || "-"}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
                <p style="font-size:10px; color:#888; margin-top:4px;">Total de eleitores: ${voters.length}</p>`
            }
          </div>
        `;
      }
      container.innerHTML = html;
    }

    return container;
  };

  // Export selected
  const handleExportSelected = async (type: "contacts" | "leaders") => {
    const selected = type === "contacts" ? selectedContacts : selectedLeaders;
    const data = type === "contacts" ? contacts : leaders;

    if (selected.size === 0) {
      toast.error("Selecione pelo menos um registro para exportar.");
      return;
    }

    // For leaders, preload voters for all selected
    if (type === "leaders") {
      setLoading(true);
      const toLoad = [...selected].filter(id => !leaderVoters[id]);
      await Promise.all(toLoad.map(id => fetchLeaderVoters(id)));
      setLoading(false);
    }

    toast.info("Gerando PDF...");
    const el = buildSelectedElement(type, selected, data);
    document.body.appendChild(el);
    try {
      await exportTableToPdf(el, {
        title: type === "contacts" ? "Relatório de Contatos" : "Relatório de Lideranças",
        filename: type === "contacts" ? "relatorio-contatos" : "relatorio-liderancas",
      });
      toast.success("PDF exportado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
    document.body.removeChild(el);
  };

  // Print selected
  const handlePrintSelected = async (type: "contacts" | "leaders") => {
    const selected = type === "contacts" ? selectedContacts : selectedLeaders;
    const data = type === "contacts" ? contacts : leaders;

    if (selected.size === 0) {
      toast.error("Selecione pelo menos um registro para imprimir.");
      return;
    }

    if (type === "leaders") {
      setLoading(true);
      const toLoad = [...selected].filter(id => !leaderVoters[id]);
      await Promise.all(toLoad.map(id => fetchLeaderVoters(id)));
      setLoading(false);
    }

    const el = buildSelectedElement(type, selected, data);
    printTable(el, type === "contacts" ? "Relatório de Contatos" : "Relatório de Lideranças");
  };

  // Export all
  const handleExportAll = async (type: "contacts" | "leaders") => {
    const ref = type === "contacts" ? contactsTableRef : leadersTableRef;
    if (!ref.current) return;

    if (type === "leaders") {
      setLoading(true);
      await Promise.all(leaders.map(l => fetchLeaderVoters(l.id)));
      setLoading(false);
    }

    toast.info("Gerando PDF...");
    try {
      await exportTableToPdf(ref.current, {
        title: type === "contacts" ? "Relatório de Contatos" : "Relatório de Lideranças",
        filename: type === "contacts" ? "relatorio-contatos" : "relatorio-liderancas",
      });
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  const handlePrintAll = (type: "contacts" | "leaders") => {
    const ref = type === "contacts" ? contactsTableRef : leadersTableRef;
    if (!ref.current) return;
    printTable(ref.current, type === "contacts" ? "Relatório de Contatos" : "Relatório de Lideranças");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Relatórios e Auditoria</h1>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" /> Contatos
          </TabsTrigger>
          <TabsTrigger value="leaders" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Lideranças
          </TabsTrigger>
        </TabsList>

        {/* ===== CONTACTS TAB ===== */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Pesquisar contato..." value={searchContacts} onChange={e => setSearchContacts(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleExportAll("contacts")}>
                <FileDown className="h-4 w-4 mr-1" /> PDF Todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrintAll("contacts")}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir Todos
              </Button>
              <Button variant="default" size="sm" onClick={() => handleExportSelected("contacts")} disabled={selectedContacts.size === 0}>
                <FileDown className="h-4 w-4 mr-1" /> PDF Selecionados ({selectedContacts.size})
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handlePrintSelected("contacts")} disabled={selectedContacts.size === 0}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir Selecionados
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div ref={contactsTableRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={contacts.length > 0 && selectedContacts.size === contacts.length}
                          onCheckedChange={toggleAllContacts}
                        />
                      </TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Envolvimento</TableHead>
                      <TableHead>Cadastrado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum contato encontrado</TableCell>
                      </TableRow>
                    ) : contacts.map((c, i) => (
                      <TableRow key={c.id} className={selectedContacts.has(c.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox checked={selectedContacts.has(c.id)} onCheckedChange={() => toggleContactSelection(c.id)} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone || "-"}</TableCell>
                        <TableCell>{c.city || "-"}</TableCell>
                        <TableCell>{c.neighborhood || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {engagementLabels[c.engagement] || c.engagement || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 text-sm text-muted-foreground border-t">
                Total: {contacts.length} contato(s) | {selectedContacts.size} selecionado(s)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LEADERS TAB ===== */}
        <TabsContent value="leaders" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Pesquisar liderança..." value={searchLeaders} onChange={e => setSearchLeaders(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleExportAll("leaders")}>
                <FileDown className="h-4 w-4 mr-1" /> PDF Todos
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrintAll("leaders")}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir Todos
              </Button>
              <Button variant="default" size="sm" onClick={() => handleExportSelected("leaders")} disabled={selectedLeaders.size === 0 || loading}>
                <FileDown className="h-4 w-4 mr-1" /> {loading ? "Carregando..." : `PDF Selecionados (${selectedLeaders.size})`}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handlePrintSelected("leaders")} disabled={selectedLeaders.size === 0 || loading}>
                <Printer className="h-4 w-4 mr-1" /> Imprimir Selecionados
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div ref={leadersTableRef}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={leaders.length > 0 && selectedLeaders.size === leaders.length}
                          onCheckedChange={toggleAllLeaders}
                        />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Eleitores</TableHead>
                      <TableHead>Envolvimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma liderança encontrada</TableCell>
                      </TableRow>
                    ) : leaders.map((l, i) => (
                      <>
                        <TableRow
                          key={l.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedLeaders.has(l.id) ? "bg-primary/5" : ""}`}
                          onClick={() => toggleExpandLeader(l.id)}
                        >
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selectedLeaders.has(l.id)} onCheckedChange={() => toggleLeaderSelection(l.id)} />
                          </TableCell>
                          <TableCell>
                            {expandedLeader === l.id
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </TableCell>
                          <TableCell className="font-bold">{i + 1}</TableCell>
                          <TableCell className="font-medium">{l.name}</TableCell>
                          <TableCell>{l.phone || "-"}</TableCell>
                          <TableCell>{l.city || "-"}</TableCell>
                          <TableCell>{l.neighborhood || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{voterCounts[l.id] || 0} eleitores</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{engagementLabels[l.engagement] || l.engagement || "-"}</Badge>
                          </TableCell>
                        </TableRow>
                        {expandedLeader === l.id && (
                          <TableRow key={`${l.id}-voters`}>
                            <TableCell colSpan={9} className="bg-muted/30 p-4">
                              <p className="text-sm font-semibold mb-2 text-primary">Eleitores de {l.name}:</p>
                              {!leaderVoters[l.id] ? (
                                <p className="text-sm text-muted-foreground">Carregando...</p>
                              ) : leaderVoters[l.id].length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum eleitor cadastrado</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>#</TableHead>
                                      <TableHead>Nome</TableHead>
                                      <TableHead>Celular</TableHead>
                                      <TableHead>Cidade</TableHead>
                                      <TableHead>Bairro</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {leaderVoters[l.id].map((v: any, j: number) => (
                                      <TableRow key={v.id}>
                                        <TableCell>{j + 1}</TableCell>
                                        <TableCell className="font-medium">{v.name}</TableCell>
                                        <TableCell>{v.phone || "-"}</TableCell>
                                        <TableCell>{v.city || "-"}</TableCell>
                                        <TableCell>{v.neighborhood || "-"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 text-sm text-muted-foreground border-t">
                Total: {leaders.length} liderança(s) | {selectedLeaders.size} selecionada(s)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
