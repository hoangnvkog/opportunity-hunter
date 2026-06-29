/**
 * Sprint 56: Startup Investment Scoring Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generate,
  generateBatch,
  getTopScores,
  getStatistics,
  getOpportunityScore,
} from "@/services/startup-score/startup-score.service";

export interface GenerateScoreResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateScoreAction(
  opportunityId: string,
): Promise<GenerateScoreResult> {
  try {
    const result = await generate(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard/investment");
    revalidatePath("/admin/investment");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateScoreBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateScoreResult> {
  try {
    const result = await generateBatch(limit, providerType);
    revalidatePath("/dashboard/investment");
    revalidatePath("/admin/investment");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopScoresAction(limit?: number) {
  try {
    const data = await getTopScores(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getScoreStatisticsAction() {
  try {
    const data = await getStatistics();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityScoreAction(opportunityId: string) {
  try {
    const data = await getOpportunityScore(opportunityId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}