/**
 * Root landing page.
 *
 * Redirects to the authenticated dashboard. /dashboard in turn performs
 * its own auth gating (redirect to /login when not signed in).
 */
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home(): never {
  redirect("/dashboard");
}
