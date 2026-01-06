'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { logout } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, QrCode as qrIcon, Key } from 'lucide-react';

export default function MFASetupPage() {
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        fetchSetup();
    }, []);

    const fetchSetup = async () => {
        try {
            const res = await api.get('/auth/mfa/setup/');
            setQrCode(res.data.qr_code);
            setSecret(res.data.secret);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load MFA setup details.");
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/mfa/verify/', { code });
            toast.success('MFA Enabled Successfully! Protect your account with these codes.');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (err) {
            toast.error('Invalid Code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
             <div className="absolute top-4 right-4 flex items-center gap-4">
                <ThemeToggle />
             </div>

            <Card className="w-full max-w-xl border-border shadow-none">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <CardTitle className="text-2xl font-bold">Secure Your Account</CardTitle>
                    </div>
                    <CardDescription>
                        Multi-Factor Authentication adds an extra layer of security to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg p-6 border border-border/50">
                        <p className="text-sm text-center mb-4 text-muted-foreground">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        
                        {qrCode ? (
                            <div className="bg-white p-3 rounded-lg border-4 border-primary/20">
                                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 flex items-center justify-center bg-background border border-border animate-pulse rounded-lg">
                                <p className="text-xs text-muted-foreground">Generating QR...</p>
                            </div>
                        )}
                        
                        <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border border-border">
                            <Key className="h-4 w-4 text-primary" />
                            <span className="text-xs font-mono select-all">{secret || 'Loading secret...'}</span>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2 text-center">
                            <Label htmlFor="verification-code">Verification Code</Label>
                            <Input 
                                id="verification-code"
                                type="text" 
                                className="text-center text-2xl tracking-[0.5em] font-bold h-12"
                                placeholder="000000"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                maxLength={6}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                Enter the 6-digit code from your app
                            </p>
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? 'Verifying...' : 'Enable Multi-Factor Authentication'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border mt-4 pt-4">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Security Overview
                    </Link>
                </CardFooter>
            </Card>

            <p className="mt-8 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                SDWMS Secure Protocol v1.0
            </p>
        </div>
    );
}
