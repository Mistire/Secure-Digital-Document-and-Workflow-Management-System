'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { logout, isAdmin } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  ShieldAlert, 
  ArrowLeft, 
  LogOut, 
  UserPlus, 
  FileSearch, 
  UserCog,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types/user';
import { AuditLog } from '@/types/audit';
import { AdminStats } from '@/components/admin/AdminStats';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'users' | 'audit'>('users');
    
    // Pagination State
    const [logPage, setLogPage] = useState(1);
    const [totalLogCount, setTotalLogCount] = useState(0);
    const [hasNextLogs, setHasNextLogs] = useState(false);
    const [hasPrevLogs, setHasPrevLogs] = useState(false);

    
    // Add User State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);

    useEffect(() => {
        if (!isAdmin()) {
            window.location.href = '/dashboard';
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, logsRes] = await Promise.all([
                api.get('/auth/admin/users/'),
                api.get('/audit/logs/?page=1')
            ]);
            setUsers(usersRes.data);
            setLogs(logsRes.data.results);
            setTotalLogCount(logsRes.data.count);
            setHasNextLogs(!!logsRes.data.next);
            setHasPrevLogs(!!logsRes.data.previous);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
            toast.error("Failed to fetch administrative data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (page: number) => {
        try {
            const res = await api.get(`/audit/logs/?page=${page}`);
            setLogs(res.data.results);
            setLogPage(page);
            setHasNextLogs(!!res.data.next);
            setHasPrevLogs(!!res.data.previous);
            setTotalLogCount(res.data.count);
        } catch (err) {
            toast.error("Failed to fetch more logs.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background text-primary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Admin Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <ShieldAlert className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Security Management</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard">
                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={logout}>
                            <LogOut className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Stats Row */}
                <AdminStats users={users} totalLogCount={totalLogCount} />

                {/* Tabs & Content */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
                            <button 
                                onClick={() => setTab('users')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'users' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <UserCog className="h-4 w-4" />
                                    Users
                                </div>
                            </button>
                            <button 
                                onClick={() => setTab('audit')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'audit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileSearch className="h-4 w-4" />
                                    Audit Logs
                                </div>
                            </button>
                        </div>

                        {tab === 'users' && (
                            <Button size="sm" className="items-center gap-2" onClick={() => setIsAddUserOpen(true)}>
                                <UserPlus className="h-4 w-4" />
                                Add User
                            </Button>
                        )}
                    </div>

                    {tab === 'users' && (
                        <UserManagement 
                            users={users} 
                            onUsersChange={setUsers} 
                            isAddUserOpen={isAddUserOpen} 
                            setIsAddUserOpen={setIsAddUserOpen} 
                        />
                    )}

                    {tab === 'audit' && (
                        <AuditLogViewer 
                            logs={logs} 
                            logPage={logPage} 
                            totalLogCount={totalLogCount} 
                            hasNextLogs={hasNextLogs} 
                            hasPrevLogs={hasPrevLogs} 
                            fetchLogs={fetchLogs} 
                        />
                    )}
                </div>
            </main>

            <footer className="mt-12 py-8 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2 text-primary opacity-50">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Secure Document Workflow Management System</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
// Need to add ShieldCheck to imports
