import Stripe from "stripe";
import { SubscriptionsRepository } from "@/lib/db/repositories/subscriptions.repository";
import { UsageLimitsRepository } from "@/lib/db/repositories/usage-limits.repository";
import { getBaseUrl } from "@/lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export class SubscriptionService {
  private subscriptionsRepo: SubscriptionsRepository;
  private usageLimitsRepo: UsageLimitsRepository;

  constructor(
    subscriptionsRepo: SubscriptionsRepository,
    usageLimitsRepo: UsageLimitsRepository
  ) {
    this.subscriptionsRepo = subscriptionsRepo;
    this.usageLimitsRepo = usageLimitsRepo;
  }

  static async create(): Promise<SubscriptionService> {
    const [subscriptionsRepo, usageLimitsRepo] = await Promise.all([
      SubscriptionsRepository.create(),
      UsageLimitsRepository.create(),
    ]);
    return new SubscriptionService(subscriptionsRepo, usageLimitsRepo);
  }

  async createCustomer(userId: string, email: string): Promise<string> {
    const customer = await stripe.customers.create({
      metadata: {
        user_id: userId,
      },
      email,
    });
    return customer.id;
  }

  async createCheckoutSession(
    userId: string,
    plan: "free" | "pro" | "team",
    priceId: string
  ): Promise<string> {
    // Get or create subscription record for the user
    let subscription = await this.subscriptionsRepo.findByUser(userId);
    if (!subscription) {
      // Create a new subscription record
      subscription = await this.subscriptionsRepo.insert({
        user_id: userId,
        plan,
        status: "incomplete",
      });
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id ?? undefined, // nullable on insert
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${getBaseUrl()}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/settings/billing`,
      metadata: {
        user_id: userId,
        subscription_id: subscription.id,
      },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session URL was not created");
    }
    return session.url;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);

    // Update local subscription record
    await this.subscriptionsRepo.update(subscriptionId, {
      status: "canceled",
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    // Note: In a real app, you might want to check the current status and handle accordingly.
    // For simplicity, we'll just update the status to active.
    await this.subscriptionsRepo.update(subscriptionId, {
      status: "active",
    });
  }

  async getCurrentPlan(userId: string): Promise<string> {
    const subscription = await this.subscriptionsRepo.findByUser(userId);
    return subscription?.plan ?? "free";
  }
}