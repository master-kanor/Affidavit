import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createAuthorizationState, loadAuthorizationState, type AuthorizationState } from "@/lib/authorization";

const initialState: AuthorizationState = createAuthorizationState(null, {}, new Set());

export function useAuthorization() {
  const [authorization, setAuthorization] = useState<AuthorizationState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      setIsLoading(true);
      setError(null);
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      try {
        const next = await loadAuthorizationState(data.user);
        if (mounted) setAuthorization(next);
      } catch (cause) {
        if (mounted) {
          setAuthorization(initialState);
          setError(cause instanceof Error ? cause.message : "Authorization could not be verified");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { ...authorization, isLoading, error, refresh: async () => setAuthorization(await loadAuthorizationState((await supabase.auth.getUser()).data.user)) };
}
