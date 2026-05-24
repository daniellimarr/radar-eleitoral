import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemands } from "@/hooks/demands/useDemands";
import { DemandService } from "@/services/demands/DemandService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";
import { DemandTable } from "@/components/demands/DemandTable";
import { DocsDialog } from "@/components/demands/DocsDialog";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Demands() {
  const { tenantId, user } = useAuth();
  const [search, setSearch] = useState("");
  const { demands, loading: demandsLoading, refresh, updateStatus } = useDemands(tenantId, search);
  
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "aberta", priority: "normal", contact_id: "", leader_id: "" });
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  // Contacts & Leaders state
  const [contacts, setContacts] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  // Documents state
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAuxData = async () => {
      if (!tenantId) return;
      const [{ data: cData }, { data: lData }] = await Promise.all([
        supabase.from("contacts").select("id, name, leader_id").eq("tenant_id", tenantId).is("deleted_at", null).order("name"),
        supabase.from("leaders").select("id, contact_id, contacts(id, name)").eq("tenant_id", tenantId)
      ]);
      setContacts(cData || []);
      setLeaders(lData || []);
      setFilteredContacts(cData || []);
    };
    fetchAuxData();
  }, [tenantId]);

  useEffect(() => {
    let filtered = contacts;
    if (form.leader_id) {
      const leader = leaders.find(l => l.id === form.leader_id);
      if (leader) filtered = contacts.filter(c => c.leader_id === leader.contact_id);
    }
    if (contactSearch) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()));
    }
    setFilteredContacts(filtered);
  }, [form.leader_id, contactSearch, contacts, leaders]);

  const handleSave = async () => {
    if (!tenantId || !form.title) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    const { error } = await DemandService.saveDemand({
      title: form.title, description: form.description, priority: form.priority,
      tenant_id: tenantId, responsible_id: user?.id,
      status: form.status,
      contact_id: form.contact_id || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Demanda cadastrada!");
      setIsOpen(false);
      setForm({ title: "", description: "", status: "aberta", priority: "normal", contact_id: "", leader_id: "" });
      setContactSearch("");
      refresh();
    }
    setLoading(false);
  };

  const fetchDocuments = async (demandId: string) => {
    const { data } = await DemandService.fetchDocuments(demandId);
    setDocuments(data || []);
  };

  const openDocsDialog = (demand: any) => {
    setSelectedDemand(demand);
    setDocsDialogOpen(true);
    fetchDocuments(demand.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedDemand || !tenantId) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error(`Tipo não permitido: ${file.name}`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`Arquivo muito grande: ${file.name}`); continue; }

      const { path, error: uploadError } = await DemandService.uploadDocument(tenantId, selectedDemand.id, file);
      if (uploadError) { toast.error(`Erro ao enviar ${file.name}`); continue; }

      await DemandService.registerDocument({
        demand_id: selectedDemand.id,
        tenant_id: tenantId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: path,
        uploaded_by: user?.id,
      });
    }
    toast.success("Documentos enviados!");
    fetchDocuments(selectedDemand.id);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (doc: any) => {
    await DemandService.deleteDocument(doc.id, doc.storage_path);
    toast.success("Documento removido");
    fetchDocuments(selectedDemand.id);
  };

  const handleDownloadDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("demand-documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handlePreviewDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("demand-documents").createSignedUrl(doc.storage_path, 120);
    if (data?.signedUrl) { setPreviewUrl(data.signedUrl); setPreviewMimeType(doc.mime_type || null); }
  };

    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Demandas</h1>
          <p className="text-muted-foreground mt-1">Gestão de solicitações e acompanhamento de tarefas.</p>
        </div>
        <div className="flex gap-3">
          <ExportButtons tableRef={tableRef} title="Demandas" filename="demandas" />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105">
                <Plus className="h-4 w-4 mr-2" /> Nova Demanda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Demanda</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label>Título da Demanda *</Label>
                  <Input 
                    placeholder="Ex: Reforma da praça central" 
                    value={form.title} 
                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição Detalhada</Label>
                  <Textarea 
                    placeholder="Descreva os detalhes da solicitação..." 
                    className="min-h-[100px]"
                    value={form.description} 
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={loading} className="w-full h-11 text-base font-semibold">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                  ) : "Criar Demanda"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card border px-4 py-2 rounded-2xl shadow-sm max-w-md focus-within:ring-2 ring-primary/20 transition-all">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          className="border-none focus-visible:ring-0 bg-transparent p-0 text-base" 
          placeholder="Pesquisar por título ou descrição..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <DemandTable 
            demands={demands}
            onOpenDocs={openDocsDialog}
            onUpdateStatus={updateStatus}
            tableRef={tableRef}
          />
        </CardContent>
      </Card>

      <DocsDialog 
        open={docsDialogOpen}
        onOpenChange={(open) => { setDocsDialogOpen(open); if (!open) { setPreviewUrl(null); setPreviewMimeType(null); } }}
        selectedDemand={selectedDemand}
        documents={documents}
        uploading={uploading}
        previewUrl={previewUrl}
        previewMimeType={previewMimeType}
        onPreviewClose={() => { setPreviewUrl(null); setPreviewMimeType(null); }}
        onFileUpload={handleFileUpload}
        onDownload={handleDownloadDoc}
        onPreview={handlePreviewDoc}
        onDelete={handleDeleteDoc}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
