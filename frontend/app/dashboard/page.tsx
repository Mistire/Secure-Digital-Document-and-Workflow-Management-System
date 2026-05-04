'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { logout, getUser, isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { 
  ShieldCheck,
  ShieldAlert,
  User,
  Settings, 
  LogOut, 
} from 'lucide-react';
import { Document } from '@/types/document';
import { UploadForm } from '@/components/dashboard/UploadForm';
import { DocumentStats } from '@/components/dashboard/DocumentStats';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { DocumentDetailsModal } from '@/components/dashboard/DocumentDetailsModal';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }
    setUser(getUser());
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId: number, fallbackName: string) => {
    try {
      const response = await api.get(`/documents/${docId}/download/`, {
        responseType: 'blob'
      });
      
      // Extract filename from Content-Disposition header
      let fileName = fallbackName;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started.");
    } catch (err) {
      toast.error("Failed to download file.");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-primary">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">SDWMS Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {(user?.is_staff || user?.is_superuser) && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 border-primary/50 text-primary hover:bg-primary/10">
                  <ShieldAlert className="h-4 w-4" />
                  Admin Console
                </Button>
              </Link>
            )}
            <div className="hidden md:flex items-center gap-2 text-sm font-medium mr-4">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
            </div>
            <ThemeToggle />
            <Link href="/dashboard/mfa">
              <Button variant="ghost" size="icon" title="MFA Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Area: Upload Form & Stats */}
          <div className="lg:col-span-4 space-y-6">
            <UploadForm onUploadSuccess={fetchDocuments} />
            <DocumentStats documents={documents} />
          </div>

          {/* Main Area: Document List */}
          <div className="lg:col-span-8 space-y-6">
            <DocumentList 
              documents={documents} 
              onRefresh={fetchDocuments} 
              onSelectDoc={setSelectedDoc}
              onDownload={handleDownload}
            />
          </div>

        </div>
      </main>
      
      <footer className="mt-12 py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Secure Document Workflow Management System. All Rights Reserved.
        </div>
      </footer>

      {/* Document Details Modal Overlay */}
      {selectedDoc && (
        <DocumentDetailsModal 
          selectedDoc={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
          onUpdateSuccess={fetchDocuments}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
