import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || '';
        const isAdmin = email === 'tanauancharles1@gmail.com' || email === 'admin@masterkanorcase.online';
        // Admin users go to admin dashboard, guests/others go to public landing page
        if (isAdmin) {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
      } else {
        setLocation('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user || event === 'SIGNED_IN') {
        const email = session?.user?.email || '';
        const isAdmin = email === 'tanauancharles1@gmail.com' || email === 'admin@masterkanorcase.online';
        if (isAdmin) {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
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
