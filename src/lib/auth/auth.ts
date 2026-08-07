/**
 * Client-side authentication utilities
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}

/**
 * Sign up with email and password
 *
 * `emailRedirectTo` tells Supabase where to redirect after the user clicks
 * the confirmation link in their email. Without this, Supabase falls back
 * to the project's default Site URL (currently `http://localhost:3000` in
 * dev), which produces broken confirmation links in production.
 *
 * Sprint 72: pass `window.location.origin` so the redirect always matches
 * the current deployment (preview, production, local dev).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || email.split("@")[0],
      },
      emailRedirectTo: `${window.location.origin}/auth/auth-code-callback`,
    },
  });

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = getSupabaseBrowserClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    return { error: { message: error.message, status: error.status } };
  }

  return { error: null };
}
