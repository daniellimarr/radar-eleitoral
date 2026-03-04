import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Download, Trash2, Upload, Image, Music, Video, FileText, Search } from "lucide-react";

const categories = [
  { value: "card", label: "Cards", icon: Image },
  { value: "jingle", label: "Jingles", icon: Music },
  { value: "video", label: "Vídeos", icon: Video },
  { value: "documento", label: "Documentos", icon: FileText },
  { value: "outro", label: "Outros", icon: FileText },
];

const categoryColors: Record<string, string> = {
  card: "bg-primary/10 text-primary",
  jingle: "bg-chart-2/20 text-chart-2",
  video: "bg-chart-4/20 text-chart-4",
  documento: "bg-chart-5/20 text-chart-5",
  outro: "bg-muted text-muted-foreground",
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CampaignFiles() {
  const { tenantId, hasRole, user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({ name: "", description: "", category: "card" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAdmin = hasRole("super_admin") || hasRole("admin_gabinete") || hasRole("coordenador");

  const fetchFiles = async () => {
    if (!tenantId) return;
    setLoading(true);
    let query = supabase
      .from("campaign_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (filterCategory !== "all") query = query.eq("category", filterCategory);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data } = await query;
    setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [tenantId, filterCategory, search]);

  const handleUpload = async () => {
    if (!tenantId || !selectedFile || !form.name) {
      toast.error("Nome e arquivo são obrigatórios");
      return;
    }
    setUploading(true);

    const ext = selectedFile.name.split(".").pop();
    const storagePath = `${tenantId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("campaign-files")
      .upload(storagePath, selectedFile);

    if (uploadError) {
      toast.error("Erro ao enviar arquivo: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("campaign_files").insert({
      tenant_id: tenantId,
      name: form.name,
      description: form.description || null,
      category: form.category,
      file_name: selectedFile.name,
      storage_path: storagePath,
      file_size: selectedFile.size,
      mime_type: selectedFile.type,
      uploaded_by: user?.id,
    });

    if (dbError) {
      toast.error("Erro ao salvar registro: " + dbError.message);
    } else {
      toast.success("Arquivo enviado com sucesso!");
      setIsOpen(false);
      setForm({ name: "", description: "", category: "card" });
      setSelectedFile(null);
      fetchFiles();
    }
    setUploading(false);
  };

  const handleDownload = async (file: any) => {
    const { data, error } = await supabase.storage
      .from("campaign-files")
      .createSignedUrl(file.storage_path, 3600);

    if (error || !data?.signedUrl) {
      toast.error("Erro ao gerar link de download");
      return;
    }

    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = file.file_name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Excluir "${file.name}"?`)) return;

    await supabase.storage.from("campaign-files").remove([file.storage_path]);
    await supabase.from("campaign_files").delete().eq("id", file.id);
    toast.success("Arquivo excluído");
    fetchFiles();
  };

  const getCategoryIcon = (cat: string) => {
    const found = categories.find(c => c.value === cat);
    return found ? found.icon : FileText;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Arquivos da Campanha</h1>
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="h-4 w-4 mr-2" /> Enviar Arquivo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enviar Arquivo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Card para Instagram" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição opcional do arquivo" />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo *</Label>
                  <Input
                    type="file"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">{selectedFile.name} — {formatFileSize(selectedFile.size)}</p>
                  )}
                </div>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full">
                  {uploading ? "Enviando..." : "Enviar Arquivo"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Pesquisar arquivo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* File Grid */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {loading ? "Carregando..." : "Nenhum arquivo encontrado"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const Icon = getCategoryIcon(file.category);
            return (
              <Card key={file.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-2 rounded-lg ${categoryColors[file.category] || categoryColors.outro}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">{file.name}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate">{file.file_name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {categories.find(c => c.value === file.category)?.label || file.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {file.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{new Date(file.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleDownload(file)}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Baixar
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(file)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
