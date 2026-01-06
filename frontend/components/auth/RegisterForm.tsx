'use client';

import { useState, useRef, useEffect } from 'react';
import { register } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, CircleCheck, Circle } from 'lucide-react';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Password Validation State
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    const p = formData.password;
    setPasswordValidation({
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error("Password does not meet security requirements.");
      return;
    }

    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA.");
      return;
    }

    setLoading(true);
    try {
      await register({
        ...formData,
        password_confirm: formData.password,
        recaptcha_token: recaptchaToken
      });
      window.location.href = '/login?registered=true';
    } catch (err: any) {
       let errorMessage = 'Registration failed. Please try again.';
       
       if (err.response && err.response.data) {
         const data = err.response.data;
         if (typeof data === 'object') {
           errorMessage = Object.entries(data)
             .map(([key, value]) => {
               const field = key.charAt(0).toUpperCase() + key.slice(1);
               const detail = Array.isArray(value) ? value.join(' ') : value;
               return `${field}: ${detail}`;
             })
             .join('\n');
         } else if (typeof data === 'string') {
           errorMessage = data;
         }
       }
       
       toast.error(errorMessage, {
         duration: 5000,
       });

      // Reset recaptcha on failure
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const ValidationItem = ({ label, met }: { label: string; met: boolean }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-primary' : 'text-muted-foreground'}`}>
      {met ? <CircleCheck className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background transition-colors duration-500">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-border shadow-2xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-center mb-2">
             <div className="bg-primary/10 p-3 rounded-full">
                <ShieldCheck className="h-8 w-8 text-primary" />
             </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-center">Secure access to the SDWMS Protocol</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (MFA)</Label>
                <Input
                  id="phone"
                  placeholder="+1234..."
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Security"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`bg-background/50 pr-10 transition-all ${formData.password && !isPasswordValid ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Validation Checklist */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 bg-muted/30 p-2 rounded-md border border-border/50">
                <ValidationItem label="8+ Characters" met={passwordValidation.minLength} />
                <ValidationItem label="Uppercase" met={passwordValidation.hasUpper} />
                <ValidationItem label="Lowercase" met={passwordValidation.hasLower} />
                <ValidationItem label="Number" met={passwordValidation.hasNumber} />
                <ValidationItem label="Special Character" met={passwordValidation.hasSpecial} />
              </div>
            </div>

            <div className="flex justify-center py-2 bg-muted/20 rounded-lg border border-border/50">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={onRecaptchaChange}
                theme="dark"
              />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold text-lg shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 animate-pulse" />
                  Processing...
                </span>
              ) : 'Initialize Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-muted-foreground bg-muted/30 py-3 rounded-b-xl border-t border-border/50">
            Already authenticated?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 tracking-tight">
              Login to System
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
        <p className="text-[10px] uppercase tracking-[0.3em] font-black">
          Secure Digital Document Management System
        </p>
        <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
      </div>
    </div>
  );
}
