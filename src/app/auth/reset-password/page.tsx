/**
 * Reset password page.
 *
 * User lands here after clicking the password-reset link in their email.
 * The link contains a one-time `code` query param that Supabase exchanges
 * for a recovery session. Once the session is active, the user can submit
 * a new password via `supabase.auth.updateUser()`.
 *
 * Sprint 72 — created because `resetPassword()` redirects here on success
 * but the route was missing → users hit a 404 after requesting a reset.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase auto-detects the recovery session from the URL fragment.
  // We wait for it to be available before showing the form.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            {!ready ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                Verifying reset link…
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm new password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </>
            )}
          </CardContent>
          {ready && (
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
