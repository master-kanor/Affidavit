export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Supabase OAuth configuration - no Manus OAuth
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  redirectTo: `${window.location.origin}/auth/callback`,
};

// Legacy function kept for backward compatibility but now returns Supabase auth URL
export const getLoginUrl = () => `${window.location.origin}/auth`;

// Compatibility helper for legacy callers. Authentication still terminates at
// the protected email/password Supabase sign-in screen.
export const startLogin = () => {
  window.location.href = getLoginUrl();
};
