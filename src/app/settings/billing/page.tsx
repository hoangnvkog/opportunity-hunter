import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { listUserDigestsAction } from "@/actions/weekly-digest.actions";
import { BillingClient } from "./BillingClient";
import type { Plan } from "@/types/subscription";

export default async function BillingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  const digests = await listUserDigestsAction();

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing settings.
          </p>
        </div>
        <BillingClient
          subscription={
            subscription
              ? {
                  plan: (subscription.plan as Plan) ?? "free",
                  status: subscription.status ?? "active",
                  current_period_end: subscription.current_period_end ?? null,
                  stripe_subscription_id: subscription.stripe_subscription_id ?? null,
                }
              : null
          }
          digests={digests}
        />
      </div>
    </AppLayout>
  );
}