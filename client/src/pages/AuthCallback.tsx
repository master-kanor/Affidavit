import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation('/dossier');
      } else {
        setLocation('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === 'SIGNED_IN') {
        setLocation('/dossier');
      } else if (event === 'SIGNED_OUT') {
        setLocation('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
      <h2 className="text-xl font-semibold">Completing authentication...</h2>
      <p className="text-slate-400 text-sm mt-2">Please wait while we log you in via Supabase.</p>
    </div>
  );
}
