import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AdminDashboard from "./pages/AdminDashboard";
import CaseReview from "./pages/CaseReview";
import ComponentShowcase from "./pages/ComponentShowcase";
import EvidenceDossier from "./pages/EvidenceDossier";
import { useAuth } from "./hooks/useAuth";
import { useAuthorization } from "./hooks/useAuthorization";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#66747c]">
      Verifying authorization…
    </div>
  );
}

function AccessDenied({ message = "This account is not authorized to view this area." }: { message?: string }) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] px-6">
      <div className="max-w-md border border-[#d4dde1] bg-[#fffdfa] p-8 text-center shadow-[0_12px_32px_rgba(30,44,52,0.06)]">
        <h1 className="font-serif text-3xl font-semibold text-[#21313a]">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-[#66747c]">{message}</p>
        <button className="mt-6 bg-[#21313a] px-4 py-2.5 text-sm font-semibold text-white" onClick={() => setLocation("/")}>
          Return to portal
        </button>
      </div>
    </div>
  );
}

function RoleDestination() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: authorizationLoading } = useAuthorization();

  useEffect(() => {
    if (authLoading || authorizationLoading) return;
    if (!user || !profile) {
      setLocation("/auth");
      return;
    }

    const adminOrigin = "https://admin.masterkanorcase.online";
    if (profile.role === "owner") {
      window.location.assign(window.location.hostname === "masterkanorcase.online" ? `${adminOrigin}/owner` : "/admin");
    } else if (profile.role === "admin") {
      window.location.assign(window.location.hostname === "masterkanorcase.online" ? `${adminOrigin}/dashboard` : "/admin");
    } else {
      setLocation("/dossier");
    }
  }, [authLoading, authorizationLoading, profile, setLocation, user]);

  return <LoadingScreen />;
}

function ProtectedCaseRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: authorizationLoading, can } = useAuthorization();

  if (authLoading || authorizationLoading) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (!can("can_view_dossier")) {
    return <AccessDenied message="Your account does not have permission to view the case dossier." />;
  }
  return <CaseReview />;
}

function ProtectedEvidenceRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: authorizationLoading, can } = useAuthorization();

  if (authLoading || authorizationLoading) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (!can("can_view_dossier")) {
    return <AccessDenied message="Your account does not have permission to view verified evidence." />;
  }
  return <EvidenceDossier />;
}

function ProtectedComponentShowcaseRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: authorizationLoading, can } = useAuthorization();

  if (authLoading || authorizationLoading) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (!can("can_view_dossier")) {
    return <AccessDenied message="Your account does not have permission to view this resource." />;
  }
  return <ComponentShowcase />;
}

function ProtectedAdminRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: authorizationLoading, isAdmin, isOwner } = useAuthorization();

  if (authLoading || authorizationLoading) return <LoadingScreen />;
  if (!user) return <Auth />;
  if (!isAdmin && !isOwner) {
    return <AccessDenied message="Administrative access is restricted to Owner and Admin accounts." />;
  }
  return <AdminDashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/confirm" component={AuthCallback} />
      <Route path="/dashboard" component={RoleDestination} />
      <Route path="/dossier" component={ProtectedCaseRoute} />
      <Route path="/case-review" component={ProtectedCaseRoute} />
      <Route path="/official" component={ProtectedCaseRoute} />
      <Route path="/documentary" component={ProtectedCaseRoute} />
      <Route path="/evidence" component={ProtectedEvidenceRoute} />
      <Route path="/evidence-dossier" component={ProtectedEvidenceRoute} />
      <Route path="/components" component={ProtectedComponentShowcaseRoute} />
      <Route path="/admin" component={ProtectedAdminRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
