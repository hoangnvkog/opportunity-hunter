/**
 * Server-side authentication utilities
 */

import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Get current authenticated user on server
 */
export async function getUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require authenticated user, redirect to login if not authenticated
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user;
}
