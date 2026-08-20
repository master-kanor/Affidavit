import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
}

function mapUser(user: SupabaseUser): User {
  return { id: user.id, email: user.email ?? "" };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!isSupabaseConfigured) {
      setUser(null);
      setIsLoading(false);
      return () => { mounted = false; };
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      setUser(error || !data.user ? null : mapUser(data.user));
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const logout = async () => {
    if (!isSupabaseConfigured) { setUser(null); window.location.href = "/"; return; }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    window.location.href = "/";
  };

  return { user, isLoading, logout, getLoginUrl: () => "/auth", isAuthenticated: Boolean(user) };
}
