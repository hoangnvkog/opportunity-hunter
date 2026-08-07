/**
 * Auth code callback — Supabase email confirm + OAuth return URL.
 *
 * Supabase appends a one-time `code` query param (PKCE flow) when the user
 * clicks the email confirm link or returns from OAuth. We exchange that
 * code for a session via `supabase.auth.exchangeCodeForSession()`, then
 * redirect to the dashboard.
 *
 * Sprint 72 — created because OAuth + email signup previously redirected
 * here but the route was missing → users hit a 404 after signup.
 */

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Fallback: send to login with an error hint.
  return NextResponse.redirect(
    new URL(`/login?error=auth_callback_failed`, url.origin),
  );
}
