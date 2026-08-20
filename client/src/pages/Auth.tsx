import { useLocation } from "wouter";
import { SupabaseAuthUI } from "@/components/SupabaseAuthUI";

export function Auth() {
  const [, setLocation] = useLocation();
  return <div className="min-h-screen bg-[#f3f5f6]"><header className="border-b border-[#d6dde2] bg-[#21313a] px-6 py-5 text-white"><div className="mx-auto max-w-6xl"><button className="text-left" onClick={() => setLocation("/")}><div className="text-sm font-bold uppercase tracking-[0.2em]">Master Kanor Case</div><div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#c7d1d5]">Secure Case Documentation Portal</div></button></div></header><main className="mx-auto flex min-h-[calc(100vh-155px)] max-w-6xl items-center justify-center px-6 py-16"><SupabaseAuthUI onSuccess={() => setLocation("/dashboard")} /></main><footer className="border-t border-[#d6dde2] bg-white px-6 py-6 text-center text-xs leading-6 text-[#728089]">Authorized accounts only · No public registration</footer></div>;
}
export default Auth;
