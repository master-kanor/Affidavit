import { ArrowRight, FileCheck2, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#21313a]">
      <header className="border-b border-[#d6dde2] bg-[#21313a] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Scale className="h-7 w-7 text-[#d6b65d]" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.2em]">Master Kanor Case</div>
              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#c7d1d5]">Secure Case Documentation Portal</div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 border border-[#d6b65d] px-4 py-2 text-sm font-semibold text-[#f8e8b5] transition hover:bg-[#d6b65d] hover:text-[#21313a]"
            onClick={() => setLocation(user ? "/dashboard" : "/auth")}
            disabled={isLoading}
          >
            {user ? "Open workspace" : "Authorized sign in"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="border-b border-[#d6dde2] bg-[#fffdfa] px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 border border-[#c9b36d] bg-[#fff9e8] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#765f20]">
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> Restricted access
              </div>
              <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.08] tracking-[-0.025em] text-[#21313a] md:text-7xl">
                A private portal for controlled case review.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#66747c]">
                Private case materials are not displayed on the public gateway. Authorized reviewers receive only the cases, documents, and actions assigned to their account.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 bg-[#21313a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#30444f]" onClick={() => setLocation(user ? "/dashboard" : "/auth")}>
                  {user ? "Continue to workspace" : "Sign in securely"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="inline-flex items-center border border-[#ccd5da] bg-white px-5 py-3 text-sm font-semibold text-[#53636c]">No public registration</span>
              </div>
            </div>

            <aside className="border border-[#d6dde2] bg-white p-7 shadow-[0_18px_50px_rgba(30,44,52,0.08)]" aria-label="Security controls">
              <div className="flex items-center gap-3 border-b border-[#e1e6e9] pb-5">
                <ShieldCheck className="h-8 w-8 text-[#59706f]" aria-hidden="true" />
                <div>
                  <div className="font-serif text-xl font-semibold">Controlled disclosure</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#7a888f]">Least-privilege access</div>
                </div>
              </div>
              <ul className="mt-6 space-y-5 text-sm leading-6 text-[#5f6d75]">
                <li className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#59706f]" />Original evidence remains in private storage with provenance and verification metadata.</li>
                <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#59706f]" />Owner, administrator, and reviewer permissions are enforced independently.</li>
                <li className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#59706f]" />Public links never grant access to private case files.</li>
              </ul>
            </aside>
          </div>
        </section>
      </main>

      <footer className="px-6 py-7 text-center text-xs leading-6 text-[#728089]">
        Authorized accounts only · Access and review activity may be recorded for evidentiary integrity.
      </footer>
    </div>
  );
}
