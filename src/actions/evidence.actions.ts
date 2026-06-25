/**
 * Sprint 53: Evidence Server Actions
 *
 * Server actions for evidence management:
 * - generateEvidence: Generate evidence for an opportunity
 * - regenerateEvidence: Regenerate evidence (delete + generate)
 * - getEvidence: Get evidence for an opportunity
 * - getEvidenceStats: Get evidence statistics
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generateEvidenceForOpportunity,
  generateEvidenceBatch,
  regenerateEvidence,
  getOpportunityEvidence,
  getEvidenceStats,
} from "@/services/evidence/evidence.service";

export interface GenerateEvidenceResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateEvidenceAction(
  opportunityId: string,
): Promise<GenerateEvidenceResult> {
  try {
    const result = await generateEvidenceForOpportunity(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/admin/evidence");
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function generateEvidenceBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateEvidenceResult> {
  try {
    const result = await generateEvidenceBatch(limit, providerType);
    revalidatePath("/admin/evidence");
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function regenerateEvidenceAction(
  opportunityId: string,
): Promise<GenerateEvidenceResult> {
  try {
    const result = await regenerateEvidence(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/admin/evidence");
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getEvidenceAction(
  opportunityId: string,
) {
  try {
    const evidence = await getOpportunityEvidence(opportunityId);
    return { success: true, data: evidence };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getEvidenceStatsAction() {
  try {
    const stats = await getEvidenceStats();
    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}