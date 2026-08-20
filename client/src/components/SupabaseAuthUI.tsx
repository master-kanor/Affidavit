import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, LockKeyhole, ShieldCheck } from "lucide-react";

interface AuthUIProps { onSuccess?: () => void; redirectTo?: string; }

export function SupabaseAuthUI({ onSuccess }: AuthUIProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Authentication did not return a user session.");
      setMessage("Signed in. Verifying your authorized access…");
      setEmail("");
      setPassword("");
      onSuccess?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!email) throw new Error("Enter your email address first.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` });
      if (resetError) throw resetError;
      setMessage("If the account is eligible, a password-reset message has been sent.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password reset could not be requested");
    } finally {
      setLoading(false);
    }
  };

  return <div className="mx-auto w-full max-w-md"><Card className="border-[#d4dde1] bg-[#fffdfa] shadow-[0_14px_40px_rgba(30,44,52,0.07)]"><CardHeader><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#356044]"><ShieldCheck className="h-4 w-4" /> Private access gateway</div><CardTitle className="font-serif text-3xl text-[#21313a]">Master Kanor Case</CardTitle><CardDescription>Secure Case Documentation Portal</CardDescription></CardHeader><CardContent><Alert className="mb-5 border-[#eadfce] bg-[#fbf6ee]"><LockKeyhole className="h-4 w-4 text-[#9a6b32]" /><AlertDescription className="text-[#66553f]">Accounts are manually provisioned. The system determines your role and permissions after authentication.</AlertDescription></Alert>{error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}{message && <Alert className="mb-4 border-[#d8e8dc] bg-[#e6efe8]"><AlertDescription className="text-[#356044]">{message}</AlertDescription></Alert>}<form onSubmit={handleEmailSignIn} className="space-y-4"><div><label className="text-sm font-medium text-[#344a56]">Email</label><Input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} /></div><div><label className="text-sm font-medium text-[#344a56]">Password</label><Input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={loading} minLength={6} /></div><Button type="submit" className="w-full bg-[#21313a] text-white hover:bg-[#344a56]" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign In</Button></form><Button type="button" variant="link" className="mt-3 w-full text-[#7d5b32]" disabled={loading || !email} onClick={() => void handlePasswordReset()}>Forgot password?</Button><p className="mt-4 text-center text-xs leading-5 text-[#718089]">No public registration is available. Contact the Owner/Admin if you require authorized access.</p></CardContent></Card></div>;
}

export default SupabaseAuthUI;
