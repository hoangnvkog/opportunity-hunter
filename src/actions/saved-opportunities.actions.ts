"use server";

import { getCurrentUser } from "@/services/auth/auth.service";
import { SavedOpportunitiesService } from "@/services/saved-opportunities/saved-opportunities.service";
import { revalidatePath } from "next/cache";

/**
 * Save an opportunity
 */
export async function saveOpportunityAction(opportunityId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const service = await SavedOpportunitiesService.create();
    await service.save(user.id, opportunityId);
    revalidatePath("/saved");
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to save opportunity" };
  }
}

/**
 * Unsave an opportunity
 */
export async function unsaveOpportunityAction(opportunityId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const service = await SavedOpportunitiesService.create();
    await service.unsave(user.id, opportunityId);
    revalidatePath("/saved");
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Failed to unsave opportunity" };
  }
}

/**
 * Toggle saved state (save if not saved, unsave if saved)
 */
export async function toggleSavedAction(opportunityId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: "Unauthorized", saved: false };
  }

  try {
    const service = await SavedOpportunitiesService.create();
    const isSaved = await service.isSaved(user.id, opportunityId);
    
    if (isSaved) {
      await service.unsave(user.id, opportunityId);
      revalidatePath("/saved");
      revalidatePath("/opportunities");
      revalidatePath("/dashboard");
      return { success: true, saved: false };
    } else {
      await service.save(user.id, opportunityId);
      revalidatePath("/saved");
      revalidatePath("/opportunities");
      revalidatePath("/dashboard");
      return { success: true, saved: true };
    }
  } catch {
    return { error: "Failed to toggle saved state", saved: false };
  }
}
