"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/auth-code-callback");
}

/**
 * Server-only sign out — clears the HTTP-only auth cookie via
 * `cookies()` API and redirects to /login. Use from server components
 * or `<form action={signOut}>`.
 *
 * IMPORTANT: throws `redirect()` (Next.js signal). Client components
 * calling this directly will surface the error; use `signOutClient()`
 * from a button instead.
 */
export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Client-friendly sign out — clears the HTTP-only auth cookie server-side
 * but does NOT redirect. Returns a result so the caller can navigate
 * (e.g. `router.push("/login")`) without tripping Next.js's internal
 * `redirect()` throw.
 *
 * Use from Client Components like the user dropdown menu.
 */
export async function signOutClient(): Promise<{ success: boolean }> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  return { success: !error };
}

export async function signInWithGoogle() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithGithub() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}
