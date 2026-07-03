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

export async function generateFinancialModelAction(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  return generateFinancialModel(ventureProjectId, options);
}

export async function generateBatchAction(
  limit?: number,
): Promise<{ processed: number; generated: number; skipped: number; inserted: number }> {
  return generateBatch(limit);
}

export async function listModelsAction(
  limit?: number,
): Promise<Awaited<ReturnType<typeof listModels>>> {
  return listModels({ limit });
}

export async function getDetailAction(
  modelId: string,
): Promise<Awaited<ReturnType<typeof getModelDetail>>> {
  return getModelDetail(modelId);
}

export async function getByVentureProjectAction(
  ventureProjectId: string,
): Promise<Awaited<ReturnType<typeof getModelByVentureProject>>> {
  return getModelByVentureProject(ventureProjectId);
}

export async function deleteModelAction(modelId: string): Promise<void> {
  return deleteModel(modelId);
}

export async function regenerateModelAction(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  return regenerateModel(ventureProjectId, options);
}

export async function getDashboardStatsAction(): Promise<Awaited<ReturnType<typeof getDashboardStats>>> {
  return getDashboardStats();
}

export async function getSummaryAction(
  modelId: string,
): Promise<string> {
  const detail = await getModelDetail(modelId);
  if (!detail) return "Model not found.";
  return getFinancialSummary(detail);
}
