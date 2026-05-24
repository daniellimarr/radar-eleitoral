import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useContacts } from "@/hooks/contacts/useContacts";
import { ContactService } from "@/services/contacts/ContactService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Loader2, Users, UserPlus, Filter, FileDown } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { geocodeByCep } from "@/lib/geocoding";

// Refactored sub-components
import { ContactRow } from "@/components/contacts/ContactRow";
import { StepGeneralData } from "@/components/contacts/StepGeneralData";
import { StepAddress } from "@/components/contacts/StepAddress";
import { StepPoliticalData } from "@/components/contacts/StepPoliticalData";

const defaultContact = {
  name: "", nickname: "", gender: "", birth_date: "", cpf: "",
  phone: "", has_whatsapp: false, cep: "", address: "",
  address_number: "", neighborhood: "", city: "Boa Vista", state: "RR",
  voting_zone: "", voting_section: "", voting_location: "",
  engagement: "nao_trabalhado" as any, is_leader: false,
  leader_id: "",
};

export default function Contacts() {
  const { tenantId, user, hasRole, profile } = useAuth();
  const { contactLimit } = useSubscription();
  const [search, setSearch] = useState("");
  const { contacts, totalContacts, loading: contactsLoading, refresh, deleteContact } = useContacts(tenantId, search);

  const [leaders, setLeaders] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("dados");
  const [form, setForm] = useState(defaultContact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  
  const tableRef = useRef<HTMLTableElement>(null);
  const isOperador = hasRole("operador");

  useEffect(() => {
    const fetchLeaders = async () => {
      if (!tenantId) return;
      const { data } = await ContactService.fetchLeaders(tenantId);
      setLeaders(data || []);
      if (isOperador && profile?.full_name) {
        const matched = (data || []).find(l => l.name.toLowerCase() === profile.full_name.toLowerCase());
        if (matched) setForm(p => ({ ...p, leader_id: matched.id }));
      }
    };
    fetchLeaders();
  }, [tenantId, isOperador, profile?.full_name]);

  const handleCepBlur = async () => {
    if (!form.cep || form.cep.replace(/\D/g, "").length !== 8) return;
    setGeocoding(true);
    const result = await geocodeByCep(form.cep);
    if (result) {
      setForm((prev) => ({
        ...prev,
        address: result.address || prev.address,
        neighborhood: result.neighborhood || prev.neighborhood,
        city: result.city || prev.city,
        state: result.state || prev.state,
      }));
      setGeoCoords({ latitude: result.latitude || null, longitude: result.longitude || null });
    }
    setGeocoding(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("O nome é obrigatório para o cadastro."); return; }

    let effectiveTenantId = tenantId || profile?.tenant_id || null;
    if (!effectiveTenantId) { 
      toast.error("Vínculo com gabinete não localizado."); 
      return; 
    }

    if (!editingId && contactLimit !== Infinity && totalContacts >= contactLimit) {
      toast.error(`Limite do seu plano atingido (${contactLimit.toLocaleString()} contatos).`);
      return;
    }

    setLoading(true);
    try {
      const sanitizedPayload = {
        ...form,
        tenant_id: effectiveTenantId,
        registered_by: user?.id,
        latitude: geoCoords.latitude,
        longitude: geoCoords.longitude,
        leader_id: form.leader_id && form.leader_id !== "" ? form.leader_id : null,
        birth_date: form.birth_date && form.birth_date !== "" ? form.birth_date : null,
        gender: form.gender || null,
        phone: form.phone || null,
        cep: form.cep || null,
      };

      const { error } = await ContactService.saveContact(sanitizedPayload, editingId);
      
      if (error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.success(editingId ? "Contato atualizado com sucesso!" : "Novo contato registrado!");
        setIsOpen(false);
        setForm(defaultContact);
        setEditingId(null);
        setActiveFormTab("dados");
        refresh();
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contact: any) => {
    setForm({
      name: contact.name || "", 
      nickname: contact.nickname || "",
      gender: contact.gender || "", 
      birth_date: contact.birth_date || "",
      cpf: contact.cpf || "",
      phone: contact.phone || "", 
      has_whatsapp: contact.has_whatsapp || false,
      cep: contact.cep || "", 
      address: contact.address || "",
      address_number: contact.address_number || "", 
      neighborhood: contact.neighborhood || "",
      city: contact.city || "Boa Vista", 
      state: contact.state || "RR",
      voting_zone: contact.voting_zone || "", 
      voting_section: contact.voting_section || "",
      voting_location: contact.voting_location || "",
      engagement: contact.engagement || "nao_trabalhado",
      is_leader: contact.is_leader || false,
      leader_id: contact.leader_id || "",
    });
    setEditingId(contact.id);
    setIsOpen(true);
    setActiveFormTab("dados");
  };

  const updateField = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Base Eleitoral</h1>
            <p className="text-slate-500 font-medium">Gestão centralizada de apoiadores e contatos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ExportButtons tableRef={tableRef} title="Contatos" filename="contatos" />
          </div>
          <Button 
            onClick={() => { setForm(defaultContact); setEditingId(null); setIsOpen(true); }}
            className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-primary/20"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            NOVO CADASTRO
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total na Base</p>
              <p className="text-3xl font-black text-slate-900">{totalContacts.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-11 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-primary focus-visible:bg-white transition-all font-medium" 
              placeholder="Buscar por nome, apelido ou telefone..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-600 gap-2 flex-1 sm:flex-none">
                <Filter className="h-4 w-4" /> Filtros
             </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table ref={tableRef}>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest h-12">Nome / Apelido</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest h-12">Contato</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest h-12">Bairro</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest h-12">Liderança</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest h-12">Status</TableHead>
                  <TableHead className="w-24 text-right h-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-slate-400 font-medium text-sm">Carregando base de contatos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="h-12 w-12 text-slate-200" />
                        <p className="text-slate-400 font-medium">Nenhum contato encontrado.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contacts.map((c) => (
                  <ContactRow 
                    key={c.id} 
                    contact={c} 
                    onEdit={handleEdit} 
                    onDelete={deleteContact} 
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditingId(null);
          setForm(defaultContact);
          setActiveFormTab("dados");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-6 bg-slate-50 border-none shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingId ? "Editar Cadastro" : "Novo Cadastro"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="w-full mt-2">
            <TabsList className="grid grid-cols-2 w-full bg-slate-300/60 p-1 rounded-full h-12">
              <TabsTrigger value="dados" className="rounded-full font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Dados gerais
              </TabsTrigger>
              <TabsTrigger value="endereco" className="rounded-full font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                Endereço
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="dados">
                <StepGeneralData form={form} updateField={updateField} leaders={leaders} />
              </TabsContent>
              <TabsContent value="endereco">
                <StepAddress form={form} updateField={updateField} geocoding={geocoding} handleCepBlur={handleCepBlur} />
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="h-11 px-6 rounded-lg font-semibold">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="h-11 px-8 font-bold bg-primary hover:bg-primary/90 text-white rounded-lg"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
              ) : (
                editingId ? "Atualizar" : "Cadastrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
