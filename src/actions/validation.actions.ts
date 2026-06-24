import { revalidatePath } from "next/cache";
import { validateAllOpportunities } from "@/services/validation/validation.service";
import { getValidatedOpportunities as getValidatedOpportunitiesService } from "@/services/validation/validation-dashboard.service";

export async function runValidationAction() {
  try {
    const result = await validateAllOpportunities(100);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/validated");
    return { success: true, data: result };
  } catch (error) {
    console.error("Validation failed:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getValidatedOpportunities() {
  try {
    const opportunities = await getValidatedOpportunitiesService();
    return { success: true, data: opportunities };
  } catch (error) {
    console.error("Failed to fetch validated opportunities:", error);
    return { success: false, error: (error as Error).message };
  }
}