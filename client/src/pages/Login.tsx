import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Check your email to confirm your account.");
    setLocation("/");
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-sm p-8 space-y-5">
        <div><h1 className="text-2xl font-bold text-slate-900">Affidavit</h1><p className="text-sm text-slate-600 mt-1">Secure access powered by Supabase Auth</p></div>
        <input className="w-full border rounded-md px-3 py-2" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border rounded-md px-3 py-2" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        {message && <p className="text-sm text-slate-700">{message}</p>}
        <button disabled={busy} className="w-full rounded-md bg-slate-900 text-white py-2 disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" className="w-full text-sm text-slate-600" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Already have an account? Sign in"}</button>
      </form>
    </main>
  );
}
