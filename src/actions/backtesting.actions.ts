/**
 * Sprint 59: Backtesting Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  evaluateOpportunity,
  evaluateBatch,
  evaluateBacktest,
  getStatistics,
  listBacktests,
  getBacktestById,
  getOpportunityBacktests,
  getAccuracyDistribution,
  calculateAccuracy,
  calculatePredictionDelta,
} from "@/services/backtesting/backtesting.service";

export interface BacktestResult {
  success: boolean;
  processed?: number;
  evaluated?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  error?: string;
}

export async function createBacktestAction(
  opportunityId: string,
): Promise<BacktestResult> {
  try {
    const result = await evaluateOpportunity(opportunityId);
    revalidatePath("/dashboard/backtesting");
    revalidatePath("/admin/backtesting");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function evaluateBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<BacktestResult> {
  try {
    const result = await evaluateBatch(limit, providerType);
    revalidatePath("/dashboard/backtesting");
    revalidatePath("/admin/backtesting");
    revalidatePath("/opportunities/[id]", "page");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function evaluateBacktestAction(
  backtestId: string,
  providerType?: "mock" | "openai" | "gemini",
): Promise<BacktestResult> {
  try {
    const result = await evaluateBacktest(backtestId, providerType);
    revalidatePath("/dashboard/backtesting");
    revalidatePath("/admin/backtesting");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getBacktestStatsAction() {
  try {
    return { success: true, data: await getStatistics() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getBacktestsListAction(filters: {
  status?: string;
  minAccuracy?: number;
  maxAccuracy?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    return {
      success: true,
      data: await listBacktests({
        status: filters.status as "pending" | "evaluated" | "failed" | "stale" | undefined,
        minAccuracy: filters.minAccuracy,
        maxAccuracy: filters.maxAccuracy,
        limit: filters.limit,
        offset: filters.offset,
      }),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getBacktestByIdAction(id: string) {
  try {
    return { success: true, data: await getBacktestById(id) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityBacktestsAction(opportunityId: string, limit = 20) {
  try {
    return { success: true, data: await getOpportunityBacktests(opportunityId, limit) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getAccuracyDistributionAction() {
  try {
    return { success: true, data: await getAccuracyDistribution() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function trackBacktestViewedAction(backtestId: string): Promise<void> {
  console.info("[analytics] backtest_viewed", { backtestId });
}

export async function trackBacktestExportedAction(
  backtestId: string,
  format: "csv" | "json" | "pdf",
): Promise<void> {
  console.info("[analytics] backtest_exported", { backtestId, format });
}