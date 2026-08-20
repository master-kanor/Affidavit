import React, { useEffect, useState } from 'react';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import AuthCallback from '@/pages/AuthCallback';
import AdminDashboard from '@/pages/AdminDashboard';
import { EvidenceDossier } from '@/pages/EvidenceDossier';
import NotFound from '@/pages/NotFound';
import { Route, Switch, useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { checkIsAdmin } from '@/lib/authConfig';
import { Loader2 } from 'lucide-react';

function PublicAdminRedirect() {
  useEffect(() => {
    window.location.href = 'https://admin.masterkanorcase.online/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 text-white">
      <div className="max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 text-center shadow-2xl">
        <h2 className="text-xl font-bold">Admin workspace moved</h2>
        <p className="mt-3 text-sm text-slate-300">The administrative workspace is available only on the secured administrator hostname.</p>
        <a className="mt-6 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700" href="https://admin.masterkanorcase.online/">Open secured admin workspace</a>
      </div>
    </div>
  );
}

export function HostnameRouter() {
  const [hostname, setHostname] = useState<string>('');
  const [isAdminSubdomain, setIsAdminSubdomain] = useState<boolean>(false);
  const [checkingRole, setCheckingRole] = useState<boolean>(true);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<boolean>(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const host = window.location.hostname;
    setHostname(host);
    const isAdminHost = host.startsWith('admin.');
    setIsAdminSubdomain(isAdminHost);

    async function verifySubdomainAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const isAdminUser = checkIsAdmin(user?.email);

      if (isAdminHost) {
        if (!user) {
          // If on admin subdomain and not signed in, redirect to auth
          setLocation('/auth');
        } else if (!isAdminUser) {
          // Signed in as non-admin on admin subdomain -> deny
          setAuthorizedAdmin(false);
        } else {
          setAuthorizedAdmin(true);
        }
      }
      setCheckingRole(false);
    }

    verifySubdomainAccess();
  }, [setLocation]);

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
          <p className="text-sm text-slate-300">Verifying secure domain access...</p>
        </div>
      </div>
    );
  }

  // If accessing admin subdomain
  if (isAdminSubdomain) {
    if (!authorizedAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-2xl text-center space-y-4">
            <h2 className="text-xl font-bold text-red-400">Admin Portal Restriction</h2>
            <p className="text-sm text-slate-300">
              You are attempting to access <span className="font-mono text-amber-400">admin.masterkanorcase.online</span> without administrator privileges.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={() => window.location.href = 'https://masterkanorcase.online/auth'}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Sign In as Admin
              </button>
              <button
                onClick={() => window.location.href = 'https://masterkanorcase.online'}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-medium transition"
              >
                Return to Public Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Switch>
        <Route path={"/"} component={AdminDashboard} />
        <Route path={"/dashboard"} component={AdminDashboard} />
        <Route path={"/auth"} component={Auth} />
        <Route path={"/auth/callback"} component={AuthCallback} />
        <Route component={AdminDashboard} />
      </Switch>
    );
  }

  // Public portal (masterkanorcase.online)
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/auth/callback"} component={AuthCallback} />
      <Route path={"/dossier"} component={EvidenceDossier} />
      <Route path={"/admin"} component={PublicAdminRedirect} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
