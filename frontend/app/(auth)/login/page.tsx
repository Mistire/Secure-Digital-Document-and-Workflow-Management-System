'use client';

import { useState } from 'react';
import { login, googleLogin } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <LoginFormContents />
      </Suspense>
    </GoogleOAuthProvider>
  );
}

function LoginFormContents() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const registered = searchParams.get('registered');
    const verified = searchParams.get('verified');

    if (registered === 'true') {
      toast.success("Registration successful! Please check your email (and spam folder) for a verification link.", {
        duration: 10000,
        id: 'registration-success'
      });
    }

    if (verified === 'true') {
      toast.success("Email verified! You can now sign in.", {
        id: 'verification-success'
      });
    } else if (verified === 'error') {
      toast.error("Verification failed. The link may be expired.", {
        id: 'verification-error'
      });
    }
  }, [searchParams]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const user: any = await googleLogin(credentialResponse.credential);
      toast.success('Signed in with Google!');
      if (user && (user.is_staff || user.is_superuser)) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user: any = await login(username, password, otp);
      toast.success('Login successful!');
      if (user && (user.is_staff || user.is_superuser)) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
       console.log(err.response?.data);
        if (err.response?.data?.detail === 'MFA_REQUIRED') {
            setShowOtp(true);
            toast.info('MFA Code Required');
        } else {
            const errorMessage = err.response?.data?.detail || 
                                err.response?.data?.error || 
                                (typeof err.response?.data === 'string' ? err.response.data : null) ||
                                'Invalid credentials or code. Please try again.';
            toast.error(errorMessage);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-border shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-primary">Secure Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={showOtp || loading}
                className="bg-muted/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={showOtp || loading}
                  className="bg-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  disabled={showOtp || loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {showOtp && (
              <div className="space-y-2">
                <Label htmlFor="otp">MFA Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  className="bg-muted/50"
                />
              </div>
            )}

            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? 'Logging in...' : (showOtp ? 'Verify Code' : 'Sign In')}
            </Button>
          </form>

          {!showOtp && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google sign-in failed. Please try again.')}
                  useOneTap={false}
                  theme="outline"
                  shape="rectangular"
                  width="368"
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline underline-offset-4">
              Register now
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground uppercase tracking-widest font-medium">
        Secure Digital Document Management System
      </p>
    </div>
  );
}
