import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface UploadFormProps {
  onUploadSuccess: () => void;
}

export function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSensitivity, setUploadSensitivity] = useState('internal');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('file', uploadFile);
    formData.append('sensitivity_level', uploadSensitivity);

    try {
      await api.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadTitle('');
      setUploadFile(null);
      onUploadSuccess();
      toast.success("Document uploaded successfully!");
    } catch (err: any) {
      console.error("Upload failed", err);
      toast.error(err.response?.data?.detail || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-border shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-primary" />
          New Document
        </CardTitle>
        <CardDescription>Upload files for secure processing</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              placeholder="Policy Document v1" 
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sensitivity">Sensitivity</Label>
            <Select value={uploadSensitivity} onValueChange={setUploadSensitivity}>
              <SelectTrigger id="sensitivity">
                <SelectValue placeholder="Select sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File Attachment</Label>
            <Input 
              id="file"
              type="file" 
              className="cursor-pointer"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
