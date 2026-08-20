"use server";

import { getStartupIdeaDetail } from "@/services/startup-idea-detail";
import type { StartupIdeaDetail } from "@/types/startup-idea-detail";
import { requireUserAction } from "@/lib/auth/api-guard";

export async function getStartupIdeaDetailAction(
  id: string,
): Promise<StartupIdeaDetail | null> {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  try {
    return await getStartupIdeaDetail(id);
  } catch (error) {
    console.error("[getStartupIdeaDetailAction] Failed:", error);
    return null;
  }
}
