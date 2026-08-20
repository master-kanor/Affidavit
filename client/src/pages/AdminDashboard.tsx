import { ShieldCheck, Users, FileImage, FileText, History, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { label: "Users and roles", description: "Provisioned accounts, Owner/Admin/User status, and delegated permissions.", icon: Users },
  { label: "Evidence management", description: "Authorized evidence metadata, relationships, and storage access.", icon: FileImage },
  { label: "Documentary workspace", description: "Chapter structure, review states, resource composition, and exports.", icon: FileText },
  { label: "Audit history", description: "Administrative changes and review decisions recorded by the API.", icon: History },
  { label: "Security settings", description: "RLS, storage, authentication, and production configuration status.", icon: Settings },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { isAdmin, isOwner, isLoading, error } = useAdminCheck();

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#66747c]">Verifying administrative access…</div>;
  if (!isAdmin) return <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#66747c]">Administrative access denied.</div>;

  return <div className="min-h-screen bg-[#f3f5f6] text-[#21313a]"><header className="border-b border-[#d6dde2] bg-[#21313a] text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><div className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5c18f]">Master Kanor Case</div><h1 className="mt-2 font-serif text-3xl font-semibold">Administrative Control Center</h1><p className="mt-1 text-sm text-[#c7d1d5]">{isOwner ? "Owner authority" : "Delegated Admin authority"}</p></div><button className="inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-sm font-semibold text-white" onClick={() => void logout()}><LogOut className="h-4 w-4" /> Sign out</button></div></header><main className="mx-auto max-w-7xl px-6 py-10"><div className="mb-8 border border-[#d4dde1] bg-[#fffdfa] p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 text-[#356044]" /><div><h2 className="text-lg font-semibold">Trusted authorization is active</h2><p className="mt-1 text-sm leading-6 text-[#66747c]">This interface is only a navigation surface. Database permissions, resource authorization, and audit writes must be enforced by the server and Supabase RLS.</p>{error && <p className="mt-3 text-xs text-[#8B2635]">Authorization data is currently unavailable; mutation controls remain disabled.</p>}</div></div></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{links.map(({ label, description, icon: Icon }) => <button key={label} onClick={() => label === "Documentary workspace" && setLocation("/documentary")} className="border border-[#d4dde1] bg-[#fffdfa] p-6 text-left hover:bg-white"><Icon className="h-5 w-5 text-[#9a6b32]" /><h3 className="mt-5 font-semibold text-[#21313a]">{label}</h3><p className="mt-2 text-sm leading-6 text-[#66747c]">{description}</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#78848b]">Connect verified data source</p></button>)}</div></main></div>;
}
