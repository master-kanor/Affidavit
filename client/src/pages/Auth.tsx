import { useLocation } from "wouter";
import { SupabaseAuthUI } from "@/components/SupabaseAuthUI";
import { ArrowLeft, FileCheck2, LockKeyhole, Scale, ShieldCheck } from "lucide-react";

export function Auth() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-[#f3f5f6]">
      <header className="border-b border-white/10 bg-[#21313a] px-5 py-5 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button className="flex items-center gap-3 text-left" onClick={() => setLocation("/")}>
            <Scale className="h-7 w-7 text-[#d6b65d]" aria-hidden="true" />
            <span><span className="block text-sm font-bold uppercase tracking-[0.2em]">Master Kanor Case</span><span className="mt-1 hidden text-xs uppercase tracking-[0.14em] text-[#c7d1d5] sm:block">Secure Case Documentation Portal</span></span>
          </button>
          <button className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-3 text-sm font-semibold hover:bg-white/10" onClick={() => setLocation("/")}><ArrowLeft className="h-4 w-4" /> Portal</button>
        </div>
      </header>
      <main id="main-content" className="mx-auto grid min-h-[calc(100vh-155px)] max-w-6xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-center lg:py-16">
        <section className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a6537]">Authorized access</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#21313a] sm:text-5xl">Review sensitive case material with controlled disclosure.</h1>
          <p className="mt-5 text-base leading-7 text-[#66747c]">Your account role determines which records, evidence, and administrative actions are available after sign-in.</p>
          <ul className="mt-8 space-y-4 text-sm leading-6 text-[#52616a]">
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#356044]" />Role and resource permissions are verified for every protected workspace.</li>
            <li className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#356044]" />Source text, evidence metadata, and review status remain distinguishable.</li>
            <li className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#356044]" />No case document or evidence file is published from this sign-in page.</li>
          </ul>
        </section>
        <SupabaseAuthUI onSuccess={() => setLocation("/dashboard")} />
      </main>
      <footer className="border-t border-[#d6dde2] bg-white px-6 py-6 text-center text-xs leading-6 text-[#728089]">Authorized accounts only · No public registration · Access activity may be recorded</footer>
    </div>
  );
}
export default Auth;
