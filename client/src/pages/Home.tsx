import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#21313a]">
      <header className="border-b border-[#d6dde2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.2em]">Master Kanor Case</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#728089]">Secure Case Documentation Portal</div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5e6c74]"><ShieldCheck className="h-4 w-4 text-[#356044]" /> Restricted access</div>
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-155px)] max-w-6xl items-center px-6 py-16">
        <section className="grid w-full gap-12 border border-[#d4dde1] bg-[#fffdfa] p-8 shadow-[0_14px_40px_rgba(30,44,52,0.06)] lg:grid-cols-[1.15fr_.85fr] lg:p-14">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6b32]">Authorized access only</div>
            <h1 className="mt-5 max-w-2xl font-serif text-5xl font-semibold leading-[1.08] text-[#21313a]">A private portal for controlled case review.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#5f6e77]">This system provides authorized reviewers with access to case documentation and evidence according to their assigned permissions. Private case materials are not displayed on the public gateway.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!isLoading && user ? <><Button onClick={() => setLocation("/dashboard")} className="gap-2 bg-[#21313a] text-white hover:bg-[#344a56]">Open authorized portal</Button><Button onClick={() => void logout()} variant="outline">Sign out</Button></> : <Button onClick={() => setLocation("/auth")} className="gap-2 bg-[#21313a] text-white hover:bg-[#344a56]"><LockKeyhole className="h-4 w-4" /> Sign in</Button>}
            </div>
          </div>
          <div className="flex items-center border-l border-[#e0e5e7] pl-0 lg:pl-12">
            <div className="w-full border border-[#d4dde1] bg-[#f7f8f8] p-6">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9a6b32]">Security notice</div>
              <p className="mt-4 text-sm leading-7 text-[#5e6c74]">Access is provisioned manually. Your role and resource permissions are resolved from trusted authorization records after authentication.</p>
              <div className="mt-6 border-t border-[#d4dde1] pt-5 text-xs leading-6 text-[#718089]">Do not use a URL, browser state, or hidden interface control as an authorization mechanism. Unauthorized requests are denied at the application and database layers.</div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#d6dde2] bg-white px-6 py-6 text-center text-xs leading-6 text-[#728089]">Private system · Access is restricted to approved accounts · No public registration</footer>
    </div>
  );
}
