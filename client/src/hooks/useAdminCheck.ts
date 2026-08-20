import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLocation } from "wouter";
import { checkIsAdmin, checkIsOwner } from "@/lib/authConfig";
import type { DraftRole } from "@/adminDraft";

/**
 * Verifies the current session for the secured admin workspace and exposes the
 * explicit Owner/Admin role used by the settings and draft permission matrix.
 */
export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<DraftRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const applySession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
    const email = session?.user?.email;
    const owner = checkIsOwner(email);
    const admin = checkIsAdmin(email) || session?.user?.user_metadata?.role === "admin" || session?.user?.app_metadata?.role === "admin";
    setIsAdmin(Boolean(admin));
    setRole(owner ? "owner" : admin ? "admin" : null);
    return Boolean(admin);
  };

  useEffect(() => {
    let mounted = true;
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error || !data.session || !applySession(data.session)) {
          setIsAdmin(false);
          setRole(null);
          setIsLoading(false);
          setLocation("/auth");
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Admin check error:", error);
        if (!mounted) return;
        setIsAdmin(false);
        setRole(null);
        setIsLoading(false);
        setLocation("/auth");
      }
    };

    void checkAdminStatus();
    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session || !applySession(session)) {
        setIsAdmin(false);
        setRole(null);
        setLocation("/auth");
      }
    });

    return () => {
      mounted = false;
      authData.subscription.unsubscribe();
    };
  }, [setLocation]);

  return { isAdmin, role, isLoading };
}
