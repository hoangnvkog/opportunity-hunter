import { revalidatePath } from "next/cache";
import {
  validateOpportunitiesFromDatabase,
} from "@/services/validation/validation.service";
import {
  getTopValidatedOpportunities,
} from "@/services/validation/validation-dashboard.service";
import { requireUserAction } from "@/lib/auth/api-guard";

export async function runValidationAction() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await validateOpportunitiesFromDatabase(100);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/validated");
    return { success: true, data: result };
  } catch (error) {
    console.error("Validation failed:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getValidatedOpportunities() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const opportunities = await getTopValidatedOpportunities(20);
    return { success: true, data: opportunities };
  } catch (error) {
    console.error("Failed to fetch validated opportunities:", error);
    return { success: false, error: (error as Error).message };
  }
}