"use server";

/**
 * Sprint 64: Financial Projection Engine — Server Actions
 */

import {
  generateFinancialModel,
  generateBatch,
  listModels,
  getModelDetail,
  getModelByVentureProject,
  deleteModel,
  regenerateModel,
  getDashboardStats,
  getFinancialSummary,
} from "@/services/financial/financial.service";
import { requireUserAction } from "@/lib/auth/api-guard";

export async function generateFinancialModelAction(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  const auth = await requireUserAction();
  if (!auth.ok) return { inserted: false, skipped: false };
  return generateFinancialModel(ventureProjectId, options);
}

export async function generateBatchAction(
  limit?: number,
): Promise<{ processed: number; generated: number; skipped: number; inserted: number }> {
  const auth = await requireUserAction();
  if (!auth.ok) return { processed: 0, generated: 0, skipped: 0, inserted: 0 };
  return generateBatch(limit);
}

export async function listModelsAction(
  limit?: number,
): Promise<Awaited<ReturnType<typeof listModels>>> {
  const auth = await requireUserAction();
  if (!auth.ok) return [];
  return listModels({ limit });
}

export async function getDetailAction(
  modelId: string,
): Promise<Awaited<ReturnType<typeof getModelDetail>>> {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  return getModelDetail(modelId);
}

export async function getByVentureProjectAction(
  ventureProjectId: string,
): Promise<Awaited<ReturnType<typeof getModelByVentureProject>>> {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  return getModelByVentureProject(ventureProjectId);
}

export async function deleteModelAction(modelId: string): Promise<void> {
  const auth = await requireUserAction();
  if (!auth.ok) return;
  return deleteModel(modelId);
}

export async function regenerateModelAction(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  const auth = await requireUserAction();
  if (!auth.ok) return { inserted: false, skipped: false };
  return regenerateModel(ventureProjectId, options);
}

export async function getDashboardStatsAction(): Promise<Awaited<ReturnType<typeof getDashboardStats>> | null> {
  const auth = await requireUserAction();
  if (!auth.ok) return null;
  return getDashboardStats();
}

export async function getSummaryAction(
  modelId: string,
): Promise<string> {
  const auth = await requireUserAction();
  if (!auth.ok) return "Unauthorized.";
  const detail = await getModelDetail(modelId);
  if (!detail) return "Model not found.";
  return getFinancialSummary(detail);
}
