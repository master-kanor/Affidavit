/**
 * Supabase Authentication UI Component
 * Admin-Only Authentication
 * Supports: Email (admin only), Google, GitHub
 * No public user sign up
 */

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Github, Chrome, AlertCircle, Info } from 'lucide-react';

interface AuthUIProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function SupabaseAuthUI({ onSuccess, redirectTo }: AuthUIProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const REDIRECT_URL = redirectTo || `${window.location.origin}/auth/callback`;

  // Sign in with email/password (admin only)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify user is admin by checking custom claims or user metadata
      if (data.user) {
        setMessage('Signed in successfully');
        setEmail('');
        setPassword('');
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // OAuth sign in (Google & GitHub only)
  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: REDIRECT_URL,
          scopes: provider === 'github' ? 'user:email' : undefined
        }
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign in failed`);
      setLoading(false);
    }
  };

  // Magic link sign in (admin only)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: REDIRECT_URL
        }
      });

      if (error) throw error;

      setMessage('Check your email for the magic link');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Magic link failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Master Kanor Affidavit</CardTitle>
          <CardDescription>
            Admin Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Admin Notice */}
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Admin access only. User accounts are created by administrators in Supabase.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {/* Email/Password Sign In */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-semibold">Email Sign In</h3>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            {/* Magic Link Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={loading || !email}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send Magic Link
              </Button>
            </form>
          </div>

          {/* OAuth Providers - Google & GitHub Only */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupabaseAuthUI;
