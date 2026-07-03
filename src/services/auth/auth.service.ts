/**
 * Authentication service
 */

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { User, AuthError } from "@supabase/supabase-js";

export interface SignUpParams {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Sign up a new user
 */
export async function signUp({
  email,
  password,
  fullName,
}: SignUpParams): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
      },
    },
  });

  return { user, error };
}

/**
 * Sign in an existing user
 */
export async function signIn({
  email,
  password,
}: SignInParams): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user, error };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require an authenticated user, throw if not authenticated
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
