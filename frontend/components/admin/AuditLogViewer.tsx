import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLog } from '@/types/audit';

interface AuditLogViewerProps {
    logs: AuditLog[];
    logPage: number;
    totalLogCount: number;
    hasNextLogs: boolean;
    hasPrevLogs: boolean;
    fetchLogs: (page: number) => void;
}

export function AuditLogViewer({ logs, logPage, totalLogCount, hasNextLogs, hasPrevLogs, fetchLogs }: AuditLogViewerProps) {
    return (
        <Card className="border-border shadow-none overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px]">Timestamp</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px]">Security Subject</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px]">Atomic Action</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px]">Resource</th>
                            <th className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px]">IPv4/v6 Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-500 font-bold">
                                            {(log.user_username || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium">{log.user_username || 'System Process'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-primary/20">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">{log.resource}</td>
                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{log.ip_address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {logs.length > 0 && (
                <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                        Showing logs {(logPage - 1) * 10 + 1} to {Math.min(logPage * 10, totalLogCount)} of {totalLogCount}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={!hasPrevLogs}
                            onClick={() => fetchLogs(logPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-xs font-medium px-2">Page {logPage}</div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={!hasNextLogs}
                            onClick={() => fetchLogs(logPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {logs.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No security events recorded in the audit trail.</p>
                </div>
            )}
        </Card>
    );
}
