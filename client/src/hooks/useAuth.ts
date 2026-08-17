import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  role?: string;
}

function mapUser(user: SupabaseUser | null): User | null {
  if (!user?.email) return null;
  return {
    id: user.id,
    email: user.email,
    role: typeof user.user_metadata?.role === "string" ? user.user_metadata.role : "user",
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(mapUser(data.session?.user ?? null));
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return {
    user,
    isLoading,
    logout,
    isAuthenticated: Boolean(user),
  };
}
