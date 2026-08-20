/**
 * Pure Supabase Authentication Page
 * Replaces all Manus OAuth with Supabase Auth
 */

import React from 'react';
import { useLocation } from 'wouter';
import { SupabaseAuthUI } from '@/components/SupabaseAuthUI';
import { supabase } from '@/lib/supabaseClient';
import { checkIsAdmin } from '@/lib/authConfig';

export function Auth() {
  const [, setLocation] = useLocation();

  const handleAuthSuccess = async () => {
    const { data } = await supabase.auth.getUser();
    const isAdminAccount = checkIsAdmin(data.user?.email);
    const isAdminHost = window.location.hostname.startsWith('admin.');

    if (isAdminAccount && !isAdminHost) {
      // Supabase browser sessions are origin-scoped. Do not pretend a public-host
      // session will be available on the admin subdomain; send administrators to
      // the secured host to sign in there directly.
      await supabase.auth.signOut();
      window.location.href = 'https://admin.masterkanorcase.online/auth';
      return;
    }

    if (isAdminAccount && isAdminHost) {
      setLocation('/');
      return;
    }

    if (isAdminHost) {
      await supabase.auth.signOut();
      window.location.href = 'https://masterkanorcase.online/auth';
      return;
    }

    setLocation('/dossier');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Master Kanor Affidavit</h1>
        </div>
      </header>

      {/* Auth Container */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <SupabaseAuthUI onSuccess={handleAuthSuccess} />
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-slate-400">
          <p>Powered by Supabase | Secure Authentication</p>
        </div>
      </footer>
    </div>
  );
}

export default Auth;
