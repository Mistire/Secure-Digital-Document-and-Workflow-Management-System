'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (uid && token) {
            verify();
        } else {
            setStatus('error');
            setMessage('Invalid verification link.');
        }
    }, [uid, token]);

    const verify = async () => {
        console.log('Initiating verification for:', { uid, token });
        try {
            const response = await api.post('/auth/verify-email/', { uid, token });
            console.log('Verification success:', response.data);
            setStatus('success');
            setMessage('Your email has been successfully verified. You can now access your account.');
        } catch (err: any) {
            console.error('Verification failure details:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            setStatus('error');
            setMessage(err.response?.data?.error || 'Verification failed. The link may be expired or already used.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-6 py-8">
            {status === 'verifying' && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Verifying your credentials...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-4 text-center">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-primary">Identity Verified</h2>
                        <p className="text-muted-foreground max-w-xs mx-auto">{message}</p>
                    </div>
                    <Link href="/login" className="w-full pt-4">
                        <Button className="w-full">Proceed to Login</Button>
                    </Link>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-4 text-center">
                    <XCircle className="h-16 w-16 text-destructive" />
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-destructive">Verification Failed</h2>
                        <p className="text-muted-foreground max-w-xs mx-auto">{message}</p>
                    </div>
                    <Link href="/login" className="w-full pt-4 text-sm text-primary hover:underline underline-offset-4">
                        Back to Login
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-md border-border shadow-none">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Secure Verification</CardTitle>
                    <CardDescription>SDWMS Authentication Protocol</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground">Initializing...</p>
                        </div>
                    }>
                        <VerifyEmailContent />
                    </Suspense>
                </CardContent>
            </Card>

            <p className="mt-8 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                Secure Digital Document Management System
            </p>
        </div>
    );
}
