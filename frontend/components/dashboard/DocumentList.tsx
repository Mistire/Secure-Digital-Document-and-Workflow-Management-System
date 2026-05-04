import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Archive,
  Clock, 
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Document } from '@/types/document';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DocumentListProps {
  documents: Document[];
  onRefresh: () => void;
  onSelectDoc: (doc: Document) => void;
  onDownload: (docId: number, fallbackName: string) => void;
}

export function DocumentList({ documents, onRefresh, onSelectDoc, onDownload }: DocumentListProps) {
  
  const handleWorkflowAction = async (docId: number, actionName: string) => {
    try {
      await api.post(`/workflows/${docId}/${actionName}/`, {});
      onRefresh();
      toast.success(`Action '${actionName}' completed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Permission denied.");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Registry</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
          Refresh List
        </Button>
      </div>
      
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-lg bg-muted/20 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg">No documents found in your registry.</p>
            <p className="text-sm">Upload your first document to get started.</p>
          </div>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="border-border shadow-none hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold leading-none">{doc.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        doc.sensitivity_level === 'confidential' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        doc.sensitivity_level === 'internal' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}>
                        {doc.sensitivity_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(doc.status)}
                        <span className="capitalize">{doc.status}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status === 'draft' && (
                      <Button onClick={() => handleWorkflowAction(doc.id, 'submit')} size="sm">
                        Submit for Review
                      </Button>
                    )}
                    {doc.status === 'review' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleWorkflowAction(doc.id, 'approve_review')} 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleWorkflowAction(doc.id, 'reject')} 
                          variant="destructive" 
                          size="sm"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {doc.status === 'approval' && (
                      <Button 
                        onClick={() => handleWorkflowAction(doc.id, 'approve_final')} 
                        size="sm"
                        className="bg-primary text-primary-foreground"
                      >
                        Final Review
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => onSelectDoc(doc)}
                    >
                      View Details
                    </Button>
                    {doc.status === 'active' && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs flex items-center gap-1 border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => onDownload(doc.id, doc.title)}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-amber-500"
                          onClick={() => handleWorkflowAction(doc.id, 'archive')}
                        >
                          <Archive className="h-3 w-3" />
                          Archive
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
