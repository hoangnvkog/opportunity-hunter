"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { AlertsService } from "@/services/alerts/alerts.service";

export async function getUserAlertsAction() {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await AlertsService.create();
  return service.getUserAlerts(user.id);
}

export async function markAlertReadAction(id: string) {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await AlertsService.create();
  await service.markAlertRead(id, user.id);

  revalidatePath("/alerts");
}

export async function markAllAlertsReadAction() {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const service = await AlertsService.create();
  await service.markAllAlertsRead(user.id);

  revalidatePath("/alerts");
}

export async function getUnreadAlertCountAction() {
  const client = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    return 0;
  }

  const service = await AlertsService.create();
  return service.getUnreadCount(user.id);
}
