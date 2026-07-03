/**
 * Client-side authentication utilities
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client-browser";

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
