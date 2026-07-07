import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/server";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 },
    );
  }

  await getStripeClient().subscriptions.cancel(sub.stripe_subscription_id);

  await supabase
    .from("subscriptions")
    .update({ status: "canceled", plan: "free" })
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}