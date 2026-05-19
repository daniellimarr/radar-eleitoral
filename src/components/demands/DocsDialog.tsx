import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip, Image, FileText, Download, Eye, Trash2 } from "lucide-react";
import React from "react";

interface DocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDemand: any;
  documents: any[];
  uploading: boolean;
  previewUrl: string | null;
  previewMimeType: string | null;
  onPreviewClose: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (doc: any) => void;
  onPreview: (doc: any) => void;
  onDelete: (doc: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function DocsDialog({
  open,
  onOpenChange,
  selectedDemand,
  documents,
  uploading,
  previewUrl,
  previewMimeType,
  onPreviewClose,
  onFileUpload,
  onDownload,
  onPreview,
  onDelete,
  fileInputRef
}: DocsDialogProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Documentos - {selectedDemand?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.pdf"
              multiple
              onChange={onFileUpload}
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
            </label>
            {uploading && <p className="text-sm text-primary mt-2 animate-pulse">Enviando...</p>}
          </div>

          {previewUrl && (
            <div className="border rounded-lg p-2 bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Pré-visualização</span>
                <Button variant="ghost" size="sm" onClick={onPreviewClose}>✕</Button>
              </div>
              {previewMimeType === "application/pdf" ? (
                <iframe src={previewUrl + "#toolbar=1"} className="w-full h-96 rounded" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-96 mx-auto rounded" />
              )}
            </div>
          )}

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
                    <Button variant="ghost" size="icon" onClick={() => onPreview(doc)} title="Ver"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDownload(doc)} title="Baixar"><Download className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(doc)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
