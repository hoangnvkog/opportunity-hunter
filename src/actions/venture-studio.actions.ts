/**
 * Sprint 63: Venture Studio Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generateVentureProject,
  generateBatch,
  getTopProjects,
  getStatistics,
  getProjectDetail,
  regenerateProject,
  deleteProject,
  archiveProject,
} from "@/services/venture-studio/venture-studio.service";
import { requireUserAction } from "@/lib/auth/api-guard";

export interface GenerateProjectResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateProjectAction(
  opportunityId: string,
): Promise<GenerateProjectResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generateVentureProject(opportunityId);
    revalidatePath("/dashboard/venture");
    revalidatePath("/admin/venture");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateProjectBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateProjectResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generateBatch(limit, providerType);
    revalidatePath("/dashboard/venture");
    revalidatePath("/admin/venture");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopProjectsAction(limit?: number) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getTopProjects(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getStatisticsAction() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getStatistics();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getProjectDetailAction(projectId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getProjectDetail(projectId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function regenerateProjectAction(projectId: string): Promise<GenerateProjectResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await regenerateProject(projectId);
    revalidatePath("/dashboard/venture");
    revalidatePath("/admin/venture");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteProjectAction(projectId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    await deleteProject(projectId);
    revalidatePath("/dashboard/venture");
    revalidatePath("/admin/venture");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function archiveProjectAction(projectId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    await archiveProject(projectId);
    revalidatePath("/dashboard/venture");
    revalidatePath("/admin/venture");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
