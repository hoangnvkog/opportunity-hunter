/**
 * Sprint 58: Investment Memo Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generate,
  generateBatch,
  getTopMemos,
  getStatistics,
  getOpportunityMemo,
  getMemoById,
  getStrongBuyCount,
  searchMemos,
  searchMemosCount,
  trackMemoViewed,
  trackMemoExported,
} from "@/services/investment-memo/investment-memo.service";
import type { InvestmentMemoSearchFilters } from "@/types/investment-memo";
import { requireUserAction } from "@/lib/auth/api-guard";

export interface GenerateMemoResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateMemoAction(
  opportunityId: string,
): Promise<GenerateMemoResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generate(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard/memos");
    revalidatePath("/admin/memos");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateMemoBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateMemoResult> {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const result = await generateBatch(limit, providerType);
    revalidatePath("/dashboard/memos");
    revalidatePath("/admin/memos");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopMemosAction(limit?: number) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getTopMemos(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getMemoStatisticsAction() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getStatistics();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityMemoAction(opportunityId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getOpportunityMemo(opportunityId);
    if (data) trackMemoViewed(data.id, data.opportunity_id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getMemoByIdAction(memoId: string) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getMemoById(memoId);
    if (data) trackMemoViewed(data.id, data.opportunity_id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getStrongBuyMemoCountAction() {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const data = await getStrongBuyCount();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function searchMemosAction(filters: InvestmentMemoSearchFilters) {
  const auth = await requireUserAction();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const [results, total] = await Promise.all([
      searchMemos(filters),
      searchMemosCount(filters),
    ]);
    return { success: true, data: { results, total } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function recordMemoExportAction(
  memoId: string,
  opportunityId: string,
  format: "pdf" | "markdown" | "json" | "docx",
): Promise<{ success: boolean; error?: string }> {
  // Analytics-only — keep unguarded so the API route (which already required
  // auth) can still record exports without depending on the server-action
  // helper. The route itself enforces the user check.
  try {
    trackMemoExported(memoId, opportunityId, format);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}