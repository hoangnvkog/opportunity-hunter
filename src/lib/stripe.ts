/**
 * Lazy Stripe client initializer.
 *
 * Avoids top-level `new Stripe(key)` which fails at build time
 * when STRIPE_SECRET_KEY is not set.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-05-27.dahlia",
  });
  return _stripe;
}
