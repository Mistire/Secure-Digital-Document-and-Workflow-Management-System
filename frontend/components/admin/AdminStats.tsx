import { Card, CardContent } from '@/components/ui/card';
import { Users, Activity, Database } from 'lucide-react';
import { User } from '@/types/user';

interface AdminStatsProps {
    users: User[];
    totalLogCount: number;
}

export function AdminStats({ users, totalLogCount }: AdminStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/30 border-border/50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Total Personnel</p>
                            <p className="text-3xl font-bold">{users.length}</p>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card/30 border-border/50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Audit Trail Size</p>
                            <p className="text-3xl font-bold">{totalLogCount}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-full">
                            <Activity className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card/30 border-border/50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">System Status</p>
                            <p className="text-3xl font-bold text-emerald-500 flex items-center gap-2">
                                Active
                            </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
