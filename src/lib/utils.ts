import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Canonical site URL — used for OAuth callbacks, email redirects,
 * Stripe success/cancel URLs, and any absolute URL the app generates.
 *
 * Sprint 72: unified under NEXT_PUBLIC_SITE_URL (was NEXT_PUBLIC_BASE_URL
 * in some services, hard-coded localhost in others).
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
