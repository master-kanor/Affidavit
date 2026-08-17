import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocation } from 'wouter';

/**
 * Hook to verify if the current user is an admin
 * Redirects to login if not authenticated or not admin
 */
export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setIsAdmin(false);
          setIsLoading(false);
          setLocation('/auth');
          return;
        }

        // Check user metadata for admin role
        const user = session.user;
        const isUserAdmin = user.user_metadata?.role === 'admin' ||
                           user.app_metadata?.role === 'admin' ||
                           user.email === 'tanauancharles1@gmail.com';

        if (!isUserAdmin) {
          console.warn('User is not an admin:', user.email);
          setIsAdmin(false);
          setIsLoading(false);
          setLocation('/auth');
          return;
        }

        setIsAdmin(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        setIsLoading(false);
        setLocation('/auth');
      }
    };

    checkAdminStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setIsAdmin(false);
          setLocation('/auth');
        } else if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          const isUserAdmin = user.user_metadata?.role === 'admin' || 
                             user.app_metadata?.role === 'admin' ||
                             user.email?.endsWith('@admin.masterkanor.com');
          setIsAdmin(!!isUserAdmin);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [setLocation]);

  return { isAdmin, isLoading };
}
