/**
 * Sprint 57: Venture Research Report Server Actions
 */

"use server";

import { revalidatePath } from "next/cache";
import {
  generate,
  generateBatch,
  getTopReports,
  getStatistics,
  getOpportunityReport,
  getInvestmentGradeCount,
} from "@/services/venture-report/venture-report.service";

export interface GenerateReportResult {
  success: boolean;
  processed?: number;
  generated?: number;
  skipped?: number;
  inserted?: number;
  error?: string;
}

export async function generateReportAction(
  opportunityId: string,
): Promise<GenerateReportResult> {
  try {
    const result = await generate(opportunityId);
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard/venture-report");
    revalidatePath("/admin/venture-report");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function generateReportBatchAction(
  limit?: number,
  providerType?: "mock" | "openai" | "gemini",
): Promise<GenerateReportResult> {
  try {
    const result = await generateBatch(limit, providerType);
    revalidatePath("/dashboard/venture-report");
    revalidatePath("/admin/venture-report");
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTopReportsAction(limit?: number) {
  try {
    const data = await getTopReports(limit);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getReportStatisticsAction() {
  try {
    const data = await getStatistics();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOpportunityReportAction(opportunityId: string) {
  try {
    const data = await getOpportunityReport(opportunityId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getInvestmentGradeReportCountAction() {
  try {
    const data = await getInvestmentGradeCount();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}