import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Document } from '@/types/document';

interface DocumentStatsProps {
  documents: Document[];
}

export function DocumentStats({ documents }: DocumentStatsProps) {
  return (
    <Card className="border-border shadow-none bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex justify-between py-1 border-b border-border/50">
          <span>Total Documents</span>
          <span className="font-bold">{documents.length}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span>In Review</span>
          <span className="font-bold">{documents.filter(d => d.status === 'review').length}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>Final Approved</span>
          <span className="font-bold text-green-500">{documents.filter(d => d.status === 'approved').length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
