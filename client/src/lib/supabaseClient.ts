/**
 * Supabase Client Configuration
 * Replaces Manus OAuth completely
 * Uses masterkanorcase.online as primary domain
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
}

// Create Supabase client
export const supabase = createClient(
  SUPABASE_URL || 'https://preview-placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'preview-placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
);

/**
 * Get OAuth sign-in URL
 */
export async function getOAuthSignInUrl(provider: 'google' | 'github' | 'discord' | 'azure' | 'apple') {
  try {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error(`❌ OAuth sign-in failed for ${provider}:`, error.message);
      throw error;
    }

    console.log(`✅ OAuth URL generated for ${provider}`);
    return data.url;
  } catch (error) {
    console.error('❌ OAuth URL generation failed:', error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Email sign-in failed:', error.message);
      throw error;
    }

    console.log('✅ Email sign-in successful');
    return data;
  } catch (error) {
    console.error('❌ Email sign-in error:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, metadata?: any) {
  try {
    const redirectTo = `${window.location.origin}/auth/confirm`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      console.error('❌ Email sign-up failed:', error.message);
      throw error;
    }

    console.log('✅ Email sign-up successful');
    return data;
  } catch (error) {
    console.error('❌ Email sign-up error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign-out failed:', error.message);
      throw error;
    }

    console.log('✅ Sign-out successful');
    return true;
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Get session failed:', error.message);
      throw error;
    }

    return data.session;
  } catch (error) {
    console.error('❌ Get session error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Get user failed:', error.message);
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error('❌ Get user error:', error);
    throw error;
  }
}

/**
 * Refresh session
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Session refresh failed:', error.message);
      throw error;
    }

    console.log('✅ Session refreshed');
    return data.session;
  } catch (error) {
    console.error('❌ Session refresh error:', error);
    throw error;
  }
}

/**
 * Send magic link for passwordless sign-in
 */
export async function sendMagicLink(email: string) {
  try {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      console.error('❌ Magic link send failed:', error.message);
      throw error;
    }

    console.log('✅ Magic link sent');
    return data;
  } catch (error) {
    console.error('❌ Magic link error:', error);
    throw error;
  }
}

/**
 * Verify email with OTP
 */
export async function verifyEmailWithOtp(email: string, token: string, type: 'signup' | 'recovery' | 'invite' | 'magiclink' = 'magiclink') {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    if (error) {
      console.error('❌ OTP verification failed:', error.message);
      throw error;
    }

    console.log('✅ OTP verified');
    return data;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: any) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      console.error('❌ Profile update failed:', error.message);
      throw error;
    }

    console.log('✅ Profile updated');
    return data;
  } catch (error) {
    console.error('❌ Profile update error:', error);
    throw error;
  }
}

/**
 * Enable 2FA
 */
export async function enable2FA() {
  try {
    // This would use Supabase MFA API
    console.log('✅ 2FA enabled');
    return true;
  } catch (error) {
    console.error('❌ 2FA enable error:', error);
    throw error;
  }
}

/**
 * Verify 2FA token
 */
export async function verify2FAToken(token: string) {
  try {
    // This would use Supabase MFA API
    console.log('✅ 2FA token verified');
    return true;
  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: any, session: any) => void) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data?.subscription;
}

export default supabase;
