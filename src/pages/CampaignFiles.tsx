import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Download, Trash2, Upload, Image, Music, Video, FileText, Search, Folder, FolderOpen, ChevronRight } from "lucide-react";
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

// Media preview component
function MediaPreview({ file }: { file: any }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isAudio = file.category === "jingle" || file.mime_type?.startsWith("audio/");
  const isVideo = file.category === "video" || file.mime_type?.startsWith("video/");
  const isImage = file.category === "card" || file.mime_type?.startsWith("image/");

  const loadUrl = async () => {
    if (url) return;
    const { data } = await supabase.storage
      .from("campaign-files")
      .createSignedUrl(file.storage_path, 3600);
    if (data?.signedUrl) setUrl(data.signedUrl);
  };

  useEffect(() => {
    if (isImage) loadUrl();
  }, []);

  const toggleAudio = async () => {
    await loadUrl();
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src && url) audio.src = url;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && url && !audio.src) audio.src = url;
  }, [url]);

  if (isImage && url) {
    return (
      <div className="rounded-md overflow-hidden bg-muted aspect-video mb-2">
        <img src={url} alt={file.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="mb-2">
        <audio
          ref={audioRef}
          onEnded={() => setPlaying(false)}
          preload="none"
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1"
          onClick={toggleAudio}
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {playing ? "Pausar" : "Ouvir"}
        </Button>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="rounded-md overflow-hidden bg-muted aspect-video mb-2">
        {url ? (
          <video
            src={url}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : (
          <button
            onClick={loadUrl}
            className="w-full h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Play className="h-8 w-8" />
          </button>
        )}
      </div>
    );
  }

  return null;
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

  // Group files by category
  const groupedFiles = categories.map(cat => ({
    ...cat,
    files: files.filter(f => f.category === cat.value),
  })).filter(g => filterCategory === "all" ? true : g.value === filterCategory);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    card: true, jingle: true, video: true, documento: true, outro: true,
  });

  const toggleFolder = (cat: string) => {
    setOpenFolders(prev => ({ ...prev, [cat]: !prev[cat] }));
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

      {/* Folder-based layout */}
      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando...</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {groupedFiles.map(group => {
            const Icon = group.icon;
            const isOpen = openFolders[group.value] ?? true;
            return (
              <Card key={group.value} className="overflow-hidden">
                <button
                  onClick={() => toggleFolder(group.value)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  <div className={`p-2 rounded-lg ${categoryColors[group.value] || categoryColors.outro}`}>
                    {isOpen ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{group.label}</span>
                    <Badge variant="secondary" className="text-xs">{group.files.length}</Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t">
                    {group.files.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        Nenhum arquivo nesta pasta
                      </div>
                    ) : (
                      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.files.map((file) => {
                          const FileIcon = getCategoryIcon(file.category);
                          return (
                            <div key={file.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow space-y-2">
                              <MediaPreview file={file} />
                              <div className="flex items-start gap-2">
                                <FileIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{file.file_name}</p>
                                </div>
                              </div>
                              {file.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{file.description}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{formatFileSize(file.file_size)}</span>
                                <span>{new Date(file.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleDownload(file)}>
                                  <Download className="h-3 w-3 mr-1" /> Baixar
                                </Button>
                                {isAdmin && (
                                  <Button size="sm" variant="destructive" className="h-8" onClick={() => handleDelete(file)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
