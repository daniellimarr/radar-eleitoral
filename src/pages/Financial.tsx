import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const defaultDonation = { nome_doador: "", cpf_cnpj: "", valor: 0, tipo: "PF", data: new Date().toISOString().split("T")[0], forma_pagamento: "" };
const defaultExpense = { descricao: "", categoria: "", valor: 0, data: new Date().toISOString().split("T")[0], supplier_id: "" };
const defaultSupplier = { nome: "", cpf_cnpj: "", contato: "", email: "", endereco: "" };

const expenseCategories = ["Propaganda", "Transporte", "Alimentação", "Material gráfico", "Eventos", "Pessoal", "Outros"];

export default function Financial() {
  const { tenantId } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donationForm, setDonationForm] = useState(defaultDonation);
  const [expenseForm, setExpenseForm] = useState(defaultExpense);
  const [supplierForm, setSupplierForm] = useState(defaultSupplier);
  const [donationOpen, setDonationOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!tenantId) return;
    const [d, e, s, c] = await Promise.all([
      supabase.from("donations").select("*").eq("tenant_id", tenantId).order("data", { ascending: false }),
      supabase.from("expenses").select("*, suppliers(nome)").eq("tenant_id", tenantId).order("data", { ascending: false }),
      supabase.from("suppliers").select("*").eq("tenant_id", tenantId).order("nome"),
      supabase.from("campaigns").select("id, nome_campanha, limite_gastos").eq("tenant_id", tenantId),
    ]);
    setDonations(d.data || []); setExpenses(e.data || []); setSuppliers(s.data || []); setCampaigns(c.data || []);
  };

  useEffect(() => { fetchAll(); }, [tenantId]);

  const totalDonations = donations.reduce((s, d) => s + Number(d.valor), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.valor), 0);
  const balance = totalDonations - totalExpenses;
  const limiteGastos = campaigns.reduce((s, c) => s + Number(c.limite_gastos || 0), 0);

  const saveDonation = async () => {
    if (!tenantId || !donationForm.nome_doador.trim()) { toast.error("Nome do doador é obrigatório"); return; }
    setLoading(true);
    const payload = { ...donationForm, valor: Number(donationForm.valor), tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from("donations").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Doação atualizada!");
    } else {
      const { error } = await supabase.from("donations").insert(payload);
      if (error) toast.error(error.message); else toast.success("Doação registrada!");
    }
    setLoading(false); setDonationOpen(false); setDonationForm(defaultDonation); setEditingId(null); fetchAll();
  };

  const saveExpense = async () => {
    if (!tenantId || !expenseForm.descricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    setLoading(true);
    const payload = { descricao: expenseForm.descricao, categoria: expenseForm.categoria || null, valor: Number(expenseForm.valor), data: expenseForm.data, supplier_id: expenseForm.supplier_id || null, tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from("expenses").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Despesa atualizada!");
    } else {
      const { error } = await supabase.from("expenses").insert(payload);
      if (error) toast.error(error.message); else toast.success("Despesa registrada!");
    }
    setLoading(false); setExpenseOpen(false); setExpenseForm(defaultExpense); setEditingId(null); fetchAll();
  };

  const saveSupplier = async () => {
    if (!tenantId || !supplierForm.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setLoading(true);
    const payload = { ...supplierForm, tenant_id: tenantId };
    if (editingId) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Fornecedor atualizado!");
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) toast.error(error.message); else toast.success("Fornecedor cadastrado!");
    }
    setLoading(false); setSupplierOpen(false); setSupplierForm(defaultSupplier); setEditingId(null); fetchAll();
  };

  const deleteDonation = async (id: string) => { await supabase.from("donations").delete().eq("id", id); toast.success("Removido"); fetchAll(); };
  const deleteExpense = async (id: string) => { await supabase.from("expenses").delete().eq("id", id); toast.success("Removido"); fetchAll(); };
  const deleteSupplier = async (id: string) => { await supabase.from("suppliers").delete().eq("id", id); toast.success("Removido"); fetchAll(); };

  // Chart data by category
  const expenseByCategory = expenseCategories.map(cat => ({
    name: cat,
    valor: expenses.filter(e => e.categoria === cat).reduce((s, e) => s + Number(e.valor), 0),
  })).filter(d => d.valor > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Controle Financeiro</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Total Arrecadado</p><p className="text-2xl font-bold">R$ {totalDonations.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"><TrendingDown className="h-6 w-6 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total Gasto</p><p className="text-2xl font-bold">R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Wallet className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Saldo Atual</p><p className={`text-2xl font-bold ${balance < 0 ? "text-destructive" : ""}`}>R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Limite Legal</p><p className="text-2xl font-bold">R$ {limiteGastos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              {limiteGastos > 0 && <p className="text-xs text-muted-foreground">{((totalExpenses / limiteGastos) * 100).toFixed(1)}% utilizado</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {expenseByCategory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} /><Bar dataKey="valor" fill="hsl(205, 85%, 50%)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="donations">
        <TabsList><TabsTrigger value="donations">Doações</TabsTrigger><TabsTrigger value="expenses">Despesas</TabsTrigger><TabsTrigger value="suppliers">Fornecedores</TabsTrigger></TabsList>

        {/* DONATIONS TAB */}
        <TabsContent value="donations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={donationOpen} onOpenChange={setDonationOpen}>
              <DialogTrigger asChild><Button onClick={() => { setDonationForm(defaultDonation); setEditingId(null); }}><Plus className="h-4 w-4 mr-2" /> Nova Doação</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Doação" : "Nova Doação"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Nome do Doador *</Label><Input value={donationForm.nome_doador} onChange={e => setDonationForm(p => ({ ...p, nome_doador: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>CPF/CNPJ</Label><Input value={donationForm.cpf_cnpj} onChange={e => setDonationForm(p => ({ ...p, cpf_cnpj: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Tipo</Label>
                    <Select value={donationForm.tipo} onValueChange={v => setDonationForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PF">Pessoa Física</SelectItem><SelectItem value="PJ">Pessoa Jurídica</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" value={donationForm.valor} onChange={e => setDonationForm(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={donationForm.data} onChange={e => setDonationForm(p => ({ ...p, data: e.target.value }))} /></div>
                  <div className="space-y-2 col-span-2"><Label>Forma de Pagamento</Label><Input value={donationForm.forma_pagamento} onChange={e => setDonationForm(p => ({ ...p, forma_pagamento: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDonationOpen(false)}>Cancelar</Button>
                  <Button onClick={saveDonation} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Doador</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead>Pagamento</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {donations.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma doação</TableCell></TableRow> :
                  donations.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nome_doador}</TableCell>
                      <TableCell>{d.tipo}</TableCell>
                      <TableCell>R$ {Number(d.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{d.data}</TableCell>
                      <TableCell>{d.forma_pagamento}</TableCell>
                      <TableCell><div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setDonationForm({ nome_doador: d.nome_doador, cpf_cnpj: d.cpf_cnpj || "", valor: d.valor, tipo: d.tipo, data: d.data, forma_pagamento: d.forma_pagamento || "" }); setEditingId(d.id); setDonationOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteDonation(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild><Button onClick={() => { setExpenseForm(defaultExpense); setEditingId(null); }}><Plus className="h-4 w-4 mr-2" /> Nova Despesa</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Descrição *</Label><Input value={expenseForm.descricao} onChange={e => setExpenseForm(p => ({ ...p, descricao: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Categoria</Label>
                    <Select value={expenseForm.categoria} onValueChange={v => setExpenseForm(p => ({ ...p, categoria: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Fornecedor</Label>
                    <Select value={expenseForm.supplier_id} onValueChange={v => setExpenseForm(p => ({ ...p, supplier_id: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Valor (R$) *</Label><Input type="number" value={expenseForm.valor} onChange={e => setExpenseForm(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={expenseForm.data} onChange={e => setExpenseForm(p => ({ ...p, data: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancelar</Button>
                  <Button onClick={saveExpense} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Fornecedor</TableHead><TableHead>Valor</TableHead><TableHead>Data</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {expenses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma despesa</TableCell></TableRow> :
                  expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.descricao}</TableCell>
                      <TableCell>{e.categoria}</TableCell>
                      <TableCell>{e.suppliers?.nome || "-"}</TableCell>
                      <TableCell>R$ {Number(e.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{e.data}</TableCell>
                      <TableCell><div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setExpenseForm({ descricao: e.descricao, categoria: e.categoria || "", valor: e.valor, data: e.data, supplier_id: e.supplier_id || "" }); setEditingId(e.id); setExpenseOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteExpense(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* SUPPLIERS TAB */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
              <DialogTrigger asChild><Button onClick={() => { setSupplierForm(defaultSupplier); setEditingId(null); }}><Plus className="h-4 w-4 mr-2" /> Novo Fornecedor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Nome *</Label><Input value={supplierForm.nome} onChange={e => setSupplierForm(p => ({ ...p, nome: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>CPF/CNPJ</Label><Input value={supplierForm.cpf_cnpj} onChange={e => setSupplierForm(p => ({ ...p, cpf_cnpj: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Contato</Label><Input value={supplierForm.contato} onChange={e => setSupplierForm(p => ({ ...p, contato: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Endereço</Label><Input value={supplierForm.endereco} onChange={e => setSupplierForm(p => ({ ...p, endereco: e.target.value }))} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSupplierOpen(false)}>Cancelar</Button>
                  <Button onClick={saveSupplier} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Contato</TableHead><TableHead>Email</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum fornecedor</TableCell></TableRow> :
                  suppliers.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell>{s.cpf_cnpj}</TableCell>
                      <TableCell>{s.contato}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell><div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setSupplierForm({ nome: s.nome, cpf_cnpj: s.cpf_cnpj || "", contato: s.contato || "", email: s.email || "", endereco: s.endereco || "" }); setEditingId(s.id); setSupplierOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteSupplier(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
