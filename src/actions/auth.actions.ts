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
 *
 * IMPORTANT: must NEVER throw. If this action throws, Next.js wraps the
 * 4xx/5xx HTML response in the server-action protocol and the client
 * surfaces `"An unexpected response was received from the server."`
 * (see node_modules/next/dist/client/components/router-reducer/reducers/
 * server-action-reducer.js:117). Always return a structured result.
 *
 * Sprint 72 follow-up: when `client.auth.signOut()` already cleared the
 * browser cookies, the server-side `getSupabaseServerClient()` reads an
 * empty cookie jar → Supabase JS SDK throws when calling
 * `/auth/v1/logout` without a session token. We now catch every
 * exception so the UI can navigate to /login cleanly.
 */
export async function signOutClient(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    // Catch Supabase SDK throws (e.g. "An unexpected response was received
    // from the server.") so the client-side handler can still navigate.
    // The browser-side `client.auth.signOut()` already cleared local
    // cookies + storage; this server call is best-effort.
    const message = err instanceof Error ? err.message : "Sign out failed";
    console.warn("[auth] signOutClient server-side error (ignored):", message);
    return { success: false, error: message };
  }
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
