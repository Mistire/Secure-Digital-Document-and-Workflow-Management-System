import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document } from '@/types/document';
import { 
  FileText as FileIcon, 
  X, 
  User, 
  Download, 
  History,
  Clock, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Archive
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DocumentDetailsModalProps {
  selectedDoc: Document;
  onClose: () => void;
  onUpdateSuccess: () => void;
  onDownload: (docId: number, fallbackName: string) => void;
}

export function DocumentDetailsModal({ selectedDoc, onClose, onUpdateSuccess, onDownload }: DocumentDetailsModalProps) {
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);

  const handleUpdateFile = async (docId: number) => {
    if (!updateFile) return;
    setIsUpdatingDoc(true);
    const formData = new FormData();
    formData.append('file', updateFile);
    try {
      await api.patch(`/documents/${docId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUpdateFile(null);
      onUpdateSuccess();
      toast.success("Document updated successfully (New Version created)!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Update failed.");
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'review': return <AlertCircle className="h-4 w-4 text-primary" />;
      case 'approval': return <ShieldCheck className="h-4 w-4 text-primary" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'archived': return <Archive className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-xl border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Document Details</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Title</p>
              <p className="font-medium">{selectedDoc.title}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
              <div className="flex items-center gap-1.5">
                {getStatusIcon(selectedDoc.status)}
                <span className="capitalize font-medium">{selectedDoc.status}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Sensitivity</p>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                selectedDoc.sensitivity_level === 'confidential' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                selectedDoc.sensitivity_level === 'internal' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                'bg-green-500/10 text-green-500 border-green-500/20'
              }`}>
                {selectedDoc.sensitivity_level}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Created At</p>
              <p className="text-sm">{new Date(selectedDoc.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-1 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Description</p>
            <p className="text-sm leading-relaxed text-foreground/80">
              {selectedDoc.description || "No description provided for this document."}
            </p>
          </div>

          {(selectedDoc.status === 'draft' || selectedDoc.status === 'active') && (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Upload New Version</p>
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  className="text-xs h-8"
                  onChange={e => setUpdateFile(e.target.files?.[0] || null)}
                />
                <Button 
                  size="sm" 
                  className="h-8 text-[10px]" 
                  disabled={!updateFile || isUpdatingDoc}
                  onClick={() => handleUpdateFile(selectedDoc.id)}
                >
                  {isUpdatingDoc ? 'Updating...' : 'Upload'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Owner ID: {selectedDoc.owner}</span>
            </div>
            <span>•</span>
            <span>ID: {selectedDoc.id}</span>
          </div>

          {selectedDoc.versions && selectedDoc.versions.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase">Version History</p>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                {selectedDoc.versions.map(v => (
                  <div key={v.id} className="flex items-center justify-between text-[11px] p-2 rounded bg-muted/40">
                    <span className="font-bold">v{v.version_number}</span>
                    <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
                    <span className="text-emerald-500">Encrypted</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedDoc.status === 'active' && (
            <div className="pt-4 border-t border-border mt-4">
              <Button 
                className="w-full flex items-center gap-2" 
                onClick={() => {
                  onDownload(selectedDoc.id, selectedDoc.title);
                  onClose();
                }}
              >
                <Download className="h-4 w-4" />
                Download Official Document
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
