"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { WeeklyDigestService } from "@/services/digests/weekly-digest.service";

/**
 * List digests for the current user (history page).
 */
export async function listUserDigestsAction() {
  const user = await getUser();
  if (!user) return [];

  const service = await WeeklyDigestService.create();
  return service.listDigestsForUser(user.id);
}

/**
 * Queue a digest for the current user now (manual trigger from /digests).
 * Useful when users want a refresh without waiting for the cron.
 */
export async function queueDigestNowAction() {
  const user = await getUser();
  if (!user) return { ok: false as const, digestId: null, reason: "Unauthorized" };

  const service = await WeeklyDigestService.create();
  const digestId = await service.queueDigest(user.id);
  revalidatePath("/digests");
  return { ok: digestId !== null, digestId, reason: digestId ? null : "Weekly digest disabled" };
}

/**
 * Fetch user notification settings (auto-creates defaults for new users).
 */
export async function getNotificationSettingsAction() {
  const user = await getUser();
  if (!user) return null;

  const client = await getSupabaseServerClient();
  const { data, error } = await client
    .from("notification_settings")
    .select("user_id, email_enabled, weekly_digest_enabled, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getNotificationSettingsAction:", error);
    // No row yet — return defaults so the UI can still render toggles.
    return {
      user_id: user.id,
      email_enabled: true,
      weekly_digest_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (data) return data;

  // Best-effort: try to insert defaults so future reads hit one path.
  const inserted = await client
    .from("notification_settings")
    .insert({
      user_id: user.id,
      email_enabled: true,
      weekly_digest_enabled: true,
    })
    .select("user_id, email_enabled, weekly_digest_enabled, created_at, updated_at")
    .single();

  if (inserted.error) return {
    user_id: user.id,
    email_enabled: true,
    weekly_digest_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return inserted.data;
}

/**
 * Update user notification settings (weekly + instant alerts toggles).
 */
export async function updateNotificationSettingsAction(input: {
  email_enabled?: boolean;
  weekly_digest_enabled?: boolean;
}) {
  const user = await getUser();
  if (!user) return { error: "Unauthorized" };

  const client = await getSupabaseServerClient();

  // Ensure the row exists first (idempotent).
  const { error: upsertError } = await client
    .from("notification_settings")
    .upsert(
      {
        user_id: user.id,
        email_enabled: input.email_enabled ?? true,
        weekly_digest_enabled: input.weekly_digest_enabled ?? true,
        updated_at: new Date().toISOString(),
      } satisfies import("@/types").Database["public"]["Tables"]["notification_settings"]["Insert"],
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error("updateNotificationSettingsAction:", upsertError);
    return { error: upsertError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/digests");
  return { success: true as const };
}
