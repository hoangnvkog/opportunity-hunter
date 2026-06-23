import { NextResponse } from "next/server";
import { SubscriptionService } from "@/services/billing/subscription.service";
import { getUser } from "@/lib/auth/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();

  // Map plan to Stripe price ID from environment variables
  let priceId: string;
  switch (plan) {
    case "free":
      priceId = process.env.PRICE_FREE!;
      break;
    case "pro":
      priceId = process.env.PRICE_PRO!;
      break;
    case "team":
      priceId = process.env.PRICE_TEAM!;
      break;
    default:
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const subscriptionService = await SubscriptionService.create();
  const checkoutUrl = await subscriptionService.createCheckoutSession(
    user.id,
    plan as "free" | "pro" | "team",
    priceId
  );

  return NextResponse.json({ url: checkoutUrl });
}