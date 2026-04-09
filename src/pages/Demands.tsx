import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Paperclip, FileText, Image, Trash2, Download, Eye } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

const statusOptions = [
  { value: "aberta", label: "Aberta", color: "bg-primary text-primary-foreground" },
  { value: "em_andamento", label: "Em Andamento", color: "bg-warning text-warning-foreground" },
  { value: "concluida", label: "Concluída", color: "bg-success text-success-foreground" },
  { value: "cancelada", label: "Cancelada", color: "bg-destructive text-destructive-foreground" },
];

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Demands() {
  const { tenantId, user } = useAuth();
  const [demands, setDemands] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "aberta", priority: "normal" });
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  // Documents state
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDemands = async () => {
    if (!tenantId) return;
    let query = supabase.from("demands").select("*").eq("tenant_id", tenantId).is("deleted_at", null).order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setDemands(data || []);
  };

  useEffect(() => { fetchDemands(); }, [tenantId, search]);

  const handleSave = async () => {
    if (!tenantId || !form.title) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    const { error } = await supabase.from("demands").insert([{
      ...form, tenant_id: tenantId, responsible_id: user?.id,
      status: form.status as "aberta" | "em_andamento" | "concluida" | "cancelada",
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Demanda cadastrada!"); setIsOpen(false); setForm({ title: "", description: "", status: "aberta", priority: "normal" }); fetchDemands(); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("demands").update({ status: status as "aberta" | "em_andamento" | "concluida" | "cancelada" }).eq("id", id);
    fetchDemands();
  };

  // Documents functions
  const fetchDocuments = async (demandId: string) => {
    const { data } = await supabase
      .from("demand_documents")
      .select("*")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false });
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
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`Tipo não permitido: ${file.name}. Apenas JPEG e PDF.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${tenantId}/${selectedDemand.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("demand-documents")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { error: dbError } = await supabase.from("demand_documents").insert({
        demand_id: selectedDemand.id,
        tenant_id: tenantId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: path,
        uploaded_by: user?.id,
      });

      if (dbError) {
        toast.error(`Erro ao registrar ${file.name}`);
      }
    }

    toast.success("Documentos enviados!");
    fetchDocuments(selectedDemand.id);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (doc: any) => {
    await supabase.storage.from("demand-documents").remove([doc.storage_path]);
    await supabase.from("demand_documents").delete().eq("id", doc.id);
    toast.success("Documento removido");
    if (selectedDemand) fetchDocuments(selectedDemand.id);
  };

  const handleDownloadDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("demand-documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const handlePreviewDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("demand-documents").createSignedUrl(doc.storage_path, 120);
    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setPreviewMimeType(doc.mime_type || null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocCount = (demandId: string) => {
    // We'll show a clip icon; counts fetched on demand
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Demandas</h1>
        <div className="flex gap-2">
          <ExportButtons tableRef={tableRef} title="Demandas" filename="demandas" />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Demanda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Demanda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} /></div>
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
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? "Salvando..." : "Cadastrar"}</Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Pesquisar demanda..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demands.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma demanda</TableCell></TableRow>
              ) : demands.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>
                    <Badge className={statusOptions.find(s => s.value === d.status)?.color}>
                      {statusOptions.find(s => s.value === d.status)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{d.priority}</TableCell>
                  <TableCell>{new Date(d.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openDocsDialog(d)} title="Documentos">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Documents Dialog */}
      <Dialog open={docsDialogOpen} onOpenChange={(open) => { setDocsDialogOpen(open); if (!open) { setPreviewUrl(null); setPreviewMimeType(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Documentos - {selectedDemand?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload area */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload" className="cursor-pointer space-y-2 block">
                <div className="flex justify-center gap-2 text-muted-foreground">
                  <Image className="h-8 w-8" />
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">Clique para enviar documentos</p>
                <p className="text-xs text-muted-foreground">JPEG ou PDF • Máximo 10MB por arquivo</p>
                <p className="text-xs text-muted-foreground">Exames, laudos, receitas e outros documentos de saúde</p>
              </label>
              {uploading && <p className="text-sm text-primary mt-2 animate-pulse">Enviando...</p>}
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="border rounded-lg p-2 bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pré-visualização</span>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>✕</Button>
                </div>
                {previewUrl.includes(".pdf") ? (
                  <iframe src={previewUrl} className="w-full h-96 rounded" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-96 mx-auto rounded" />
                )}
              </div>
            )}

            {/* Document list */}
            {documents.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhum documento anexado</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {doc.mime_type?.includes("pdf") ? (
                        <FileText className="h-5 w-5 text-destructive shrink-0" />
                      ) : (
                        <Image className="h-5 w-5 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size || 0)} • {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreviewDoc(doc)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadDoc(doc)} title="Baixar">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDoc(doc)} title="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
