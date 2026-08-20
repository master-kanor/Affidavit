import { useState, type ReactNode } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FolderLock,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";

export type PortalSection =
  | "overview"
  | "assistant"
  | "access"
  | "publishing"
  | "integrations"
  | "settings";

const baseItems = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "assistant" as const, label: "AI assistant", icon: Bot },
];
const managementItems = [
  { id: "access" as const, label: "Users & access", icon: Users },
  { id: "publishing" as const, label: "Publish to users", icon: FileCheck2 },
  { id: "integrations" as const, label: "Integrations", icon: Plug },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function PortalShell({
  active,
  onSelect,
  children,
}: {
  active: PortalSection;
  onSelect: (section: PortalSection) => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { profile, isOwner, isAdmin, can } = useAuthorization();
  const manager = isOwner || isAdmin;
  const items = manager
    ? [...baseItems, ...managementItems]
    : baseItems.filter(item => item.id !== "assistant" || can("can_ask_ai"));
  const choose = (id: PortalSection) => {
    onSelect(id);
    setMobileOpen(false);
  };

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-[#cbd4d8] bg-[#18262e] text-white transition-[width] ${collapsed ? "w-[76px]" : "w-[272px]"}`}
    >
      <div className="flex min-h-20 items-center justify-between border-b border-white/10 px-4">
        <button
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() => setLocation("/")}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#d6b65d]/60 bg-[#21313a] text-[#e5c18f]">
            <FolderLock className="h-5 w-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <strong className="block truncate text-sm tracking-[0.14em]">
                MASTER KANOR
              </strong>
              <span className="block truncate text-[10px] uppercase tracking-[0.12em] text-[#9eabb1]">
                Case control portal
              </span>
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            className="p-2 text-[#9eabb1] hover:text-white lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Portal navigation"
      >
        <p
          className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#819097] ${collapsed ? "sr-only" : ""}`}
        >
          Workspace
        </p>
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => choose(id)}
            title={collapsed ? label : undefined}
            className={`flex min-h-11 w-full items-center gap-3 px-3 text-sm font-medium transition ${active === id ? "bg-[#fffdfa] text-[#21313a]" : "text-[#c8d1d5] hover:bg-white/8 hover:text-white"}`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && label}
          </button>
        ))}
        <div className="my-3 border-t border-white/10" />
        {(manager || can("can_view_dossier")) && (
          <button
            onClick={() => setLocation("/dossier")}
            className="flex min-h-11 w-full items-center gap-3 px-3 text-sm font-medium text-[#c8d1d5] hover:bg-white/8 hover:text-white"
          >
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && "Case workspace"}
          </button>
        )}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-semibold">
              {profile?.display_name || "Authorized account"}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[#9eabb1]">
              {profile?.role === "user"
                ? "Guest Reviewer"
                : profile?.role || "Guest Reviewer"}
            </p>
          </div>
        )}
        <button
          onClick={() => void logout()}
          className="flex min-h-11 w-full items-center gap-3 px-3 text-sm text-[#c8d1d5] hover:bg-white/8"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-1 hidden min-h-10 w-full items-center gap-3 px-3 text-xs text-[#819097] hover:text-white lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" /> Collapse sidebar
            </>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#eef1f2] text-[#21313a]">
      <div className="fixed inset-y-0 left-0 z-50 hidden lg:block">
        {sidebar}
      </div>
      {mobileOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-[#132027]/60 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebar}</div>
        </>
      )}
      <div
        className={`min-w-0 flex-1 transition-[margin] ${collapsed ? "lg:ml-[76px]" : "lg:ml-[272px]"}`}
      >
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#cbd4d8] bg-[#fffdfa]/95 px-4 backdrop-blur sm:px-6">
          <button
            className="p-2 lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-[#63717a]">
            <span className="h-2 w-2 rounded-full bg-[#4f7a5a]" /> Secure
            session
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
