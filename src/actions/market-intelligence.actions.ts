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
  try {
    const data = await getTopSignals(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getIntelligenceStatsAction() {
  try {
    const data = await getStats();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityIntelligenceAction(opportunityId: string) {
  try {
    const data = await getOpportunityIntelligence(opportunityId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}