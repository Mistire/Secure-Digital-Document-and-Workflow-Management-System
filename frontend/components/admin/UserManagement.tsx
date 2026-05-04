import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { UserPlus, UserCog, X } from 'lucide-react';
import { User } from '@/types/user';
import api from '@/lib/api';
import { toast } from 'sonner';

interface UserManagementProps {
    users: User[];
    onUsersChange: (newUsers: User[]) => void;
    isAddUserOpen: boolean;
    setIsAddUserOpen: (open: boolean) => void;
}

export function UserManagement({ users, onUsersChange, isAddUserOpen, setIsAddUserOpen }: UserManagementProps) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newUserData, setNewUserData] = useState({
        username: '',
        email: '',
        password: '',
        department: '',
        clearance_level: 'public'
    });
    const [isAddingUser, setIsAddingUser] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingUser(true);
        try {
            const res = await api.post('/auth/admin/users/', newUserData);
            onUsersChange([...users, res.data]);
            setIsAddUserOpen(false);
            setNewUserData({
                username: '',
                email: '',
                password: '',
                department: '',
                clearance_level: 'public'
            });
            toast.success("User created successfully.");
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Failed to create user.");
        } finally {
            setIsAddingUser(false);
        }
    };

    const handleClearanceChange = async (userId: number, newLevel: string) => {
        try {
            await api.patch(`/auth/admin/users/${userId}/`, { clearance_level: newLevel });
            onUsersChange(users.map(u => u.id === userId ? { ...u, clearance_level: newLevel } : u));
            toast.success(`Clearance updated for user ${userId}.`);
        } catch (err) {
            toast.error("Failed to update security clearance.");
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {users.map(user => (
                <Card key={user.id} className="border-border hover:border-primary/50 transition-colors shadow-none">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        {user.username}
                                        <span className="text-[10px] border border-border px-1.5 py-0.5 rounded text-muted-foreground uppercase">ID: {user.id}</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{user.email} • {user.department || 'No Department'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Security Clearance:</span>
                                    <Select 
                                        value={user.clearance_level}
                                        onValueChange={(value) => handleClearanceChange(user.id, value)}
                                    >
                                        <SelectTrigger className="h-8 w-[130px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="internal">Internal</SelectItem>
                                            <SelectItem value="confidential">Confidential</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2 text-primary hover:bg-primary/10"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    Details
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Add User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-xl border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                Provision New User
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsAddUserOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-username">Username</Label>
                                    <Input 
                                        id="new-username"
                                        placeholder="johndoe"
                                        value={newUserData.username}
                                        onChange={e => setNewUserData({...newUserData, username: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-email">Email Address</Label>
                                    <Input 
                                        id="new-email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newUserData.email}
                                        onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Initial Password</Label>
                                    <Input 
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newUserData.password}
                                        onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-dept">Department</Label>
                                        <Input 
                                            id="new-dept"
                                            placeholder="Engineering"
                                            value={newUserData.department}
                                            onChange={e => setNewUserData({...newUserData, department: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-clearance">Clearance</Label>
                                        <Select 
                                            value={newUserData.clearance_level}
                                            onValueChange={(value) => setNewUserData({...newUserData, clearance_level: value})}
                                        >
                                            <SelectTrigger id="new-clearance">
                                                <SelectValue placeholder="Select clearance" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="public">Public</SelectItem>
                                                <SelectItem value="internal">Internal</SelectItem>
                                                <SelectItem value="confidential">Confidential</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-2" disabled={isAddingUser}>
                                    {isAddingUser ? "Creating Account..." : "Create User Account"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-xl border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <UserCog className="h-5 w-5 text-primary" />
                                Personnel Profile
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="flex items-center gap-4 pb-4 border-b border-border">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.username}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Department</p>
                                    <p className="font-medium">{selectedUser.department || 'Unassigned'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Phone Number</p>
                                    <p className="font-medium">{selectedUser.phone_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Security Clearance</p>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                                        selectedUser.clearance_level === 'confidential' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                        selectedUser.clearance_level === 'internal' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                        'bg-green-500/10 text-green-500 border-green-500/20'
                                    }`}>
                                        {selectedUser.clearance_level}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block ${
                                        selectedUser.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Role</p>
                                    <p className="font-medium">{selectedUser.is_staff ? 'Administrator' : 'Standard User'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">System ID</p>
                                    <p className="font-mono text-sm">{selectedUser.id}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2">
                             <Button onClick={() => setSelectedUser(null)}>Dismiss</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
