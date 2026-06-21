"use server";

import { getStartupIdeaDetail } from "@/services/startup-idea-detail";
import type { StartupIdeaDetail } from "@/types/startup-idea-detail";

export async function getStartupIdeaDetailAction(
  id: string,
): Promise<StartupIdeaDetail | null> {
  try {
    return await getStartupIdeaDetail(id);
  } catch (error) {
    console.error("[getStartupIdeaDetailAction] Failed:", error);
    return null;
  }
}
