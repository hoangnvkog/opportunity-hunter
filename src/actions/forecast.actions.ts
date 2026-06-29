/**
 * Sprint 54: Forecast Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generateForecast,
  generateForecastBatch,
  getTopForecasts,
  getForecastStats,
  getOpportunityForecast,
} from "@/services/forecasts/forecast.service";

export interface GenerateForecastResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateForecastAction(
  opportunityId: string,
): Promise<GenerateForecastResult> {
  try {
    const result = await generateForecast(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard/forecasts");
    revalidatePath("/admin/forecasts");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateForecastBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateForecastResult> {
  try {
    const result = await generateForecastBatch(limit, providerType);
    revalidatePath("/dashboard/forecasts");
    revalidatePath("/admin/forecasts");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopForecastsAction(limit?: number) {
  try {
    const data = await getTopForecasts(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getForecastStatsAction() {
  try {
    const data = await getForecastStats();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityForecastAction(opportunityId: string) {
  try {
    const data = await getOpportunityForecast(opportunityId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
