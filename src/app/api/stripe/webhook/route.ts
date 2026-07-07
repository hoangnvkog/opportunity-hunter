import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SubscriptionsRepository } from "@/lib/db/repositories/subscriptions.repository";
import { getStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const buf = await request.text();
  const sig = request.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const subscriptionId = session.metadata?.subscription_id;

      if (userId && subscriptionId) {
        const supabase = await getSupabaseServerClient();
        const subscriptionsRepo = new SubscriptionsRepository(supabase);
        // Find the subscription by user_id to update
        const subscription = await subscriptionsRepo.findByUser(userId);
        if (subscription) {
          await subscriptionsRepo.update(subscription.id, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            status: "active",
          });
        }
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeSubscriptionId = subscription.id;
      const stripeCustomerId = subscription.customer as string;

      const supabase = await getSupabaseServerClient();
      const subscriptionsRepo = new SubscriptionsRepository(supabase);
      const sub = await subscriptionsRepo.findByStripeSubscriptionId(stripeSubscriptionId);

      if (sub) {
        // Determine plan from subscription items
        let plan = "free"; // default
        if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price.id;
          if (priceId === process.env.PRICE_PRO) {
            plan = "pro";
          } else if (priceId === process.env.PRICE_TEAM) {
            plan = "team";
          } else {
            plan = "free";
          }
        }

        const firstItem = subscription.items.data[0];
        await subscriptionsRepo.update(sub.id, {
          stripe_customer_id: stripeCustomerId,
          status: subscription.status,
          plan,
          current_period_start: firstItem?.current_period_start
            ? new Date(firstItem.current_period_start * 1000).toISOString()
            : null,
          current_period_end: firstItem?.current_period_end
            ? new Date(firstItem.current_period_end * 1000).toISOString()
            : null,
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeSubscriptionId = subscription.id;

      const supabase = await getSupabaseServerClient();
      const subscriptionsRepo = new SubscriptionsRepository(supabase);
      const sub = await subscriptionsRepo.findByStripeSubscriptionId(stripeSubscriptionId);

      if (sub) {
        await subscriptionsRepo.update(sub.id, {
          status: "canceled",
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: "free",
          current_period_start: null,
          current_period_end: null,
        });
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}