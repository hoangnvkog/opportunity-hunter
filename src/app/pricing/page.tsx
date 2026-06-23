import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import type { Plan } from "@/types/subscription";
import PricingClient from "./PricingClient";

export default async function Page() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await getSupabaseServerClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const currentPlan: Plan = (subscription?.plan as Plan) ?? "free";

  return (
    <AppLayout>
      <PricingClient currentPlan={currentPlan} />
    </AppLayout>
  );
}