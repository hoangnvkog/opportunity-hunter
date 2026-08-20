/**
 * Sprint 55: Market Intelligence Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generate,
  generateBatch,
  getTopSignals,
  getStats,
  getOpportunityIntelligence,
} from "@/services/market-intelligence/market-intelligence.service";
import { requireUserAction } from "@/lib/auth/api-guard";

export interface GenerateIntelligenceResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateIntelligenceAction(
  opportunityId: string,
): Promise<GenerateIntelligenceResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generate(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard/intelligence");
    revalidatePath("/admin/intelligence");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateIntelligenceBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateIntelligenceResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generateBatch(limit, providerType);
    revalidatePath("/dashboard/intelligence");
    revalidatePath("/admin/intelligence");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopIntelligenceSignalsAction(limit?: number) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getTopSignals(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getIntelligenceStatsAction() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getStats();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityIntelligenceAction(opportunityId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getOpportunityIntelligence(opportunityId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}