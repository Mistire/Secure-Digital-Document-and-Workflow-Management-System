export interface DocumentVersion {
  id: number;
  version_number: number;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  status: string;
  sensitivity_level: string;
  owner: number;
  created_at: string;
  updated_at?: string;
  versions?: DocumentVersion[];
}
