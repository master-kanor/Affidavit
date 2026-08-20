import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  role?: string;
}

function mapUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email ?? "",
    role: user.user_metadata?.role ?? user.app_metadata?.role,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.user) {
        setUser(null);
      } else {
        setUser(mapUser(data.user));
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase sign out failed:", error);
      throw error;
    }
    setUser(null);
    window.location.href = "/";
  };

  const getLoginUrl = () => "/auth";

  return {
    user,
    isLoading,
    logout,
    getLoginUrl,
    isAuthenticated: !!user,
  };
}
