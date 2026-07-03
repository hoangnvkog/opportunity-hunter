/**
 * Sprint 64: Financial Projection Engine Service
 *
 * Responsibilities:
 * - Generate financial models for venture projects
 * - Persist model, projections, unit economics, break-even
 * - Dashboard stats, detail, regeneration
 * - Export helpers, investment recommendations, risk assessment
 */

import type {
  FinancialModelRow,
  FinancialModelDetail,
  FinancialDashboardStats,
  FinancialGenerationResult,
  InvestmentRecommendation,
  RiskAssessment,
} from "@/types/financial";
import { getAIProviderFromEnv } from "@/lib/ai";
import {
  FinancialModelsRepository,
  FinancialProjectionsRepository,
  UnitEconomicsRepository,
  BreakEvenRepository,
  VentureProjectsRepository,
} from "@/lib/db/repositories";

/** Threshold: only generate financial models for projects with score >= 70. */
const FINANCIAL_SCORE_THRESHOLD = 70;

// ── Analytics ────────────────────────────────────────────────────────────────

function emitAnalytics(event: string, payload: Record<string, unknown>): void {
  console.info(`[analytics] ${event}`, JSON.stringify(payload));
}

// ── Core generation ──────────────────────────────────────────────────────────

/**
 * Generate a full financial model for a single venture project.
 * Gate: project.overall_score >= FINANCIAL_SCORE_THRESHOLD.
 */
export async function generateFinancialModel(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  const projectsRepo = await VentureProjectsRepository.create();
  const modelsRepo = await FinancialModelsRepository.create();
  const projectionsRepo = await FinancialProjectionsRepository.create();
  const unitEconRepo = await UnitEconomicsRepository.create();
  const breakEvenRepo = await BreakEvenRepository.create();

  const project = await projectsRepo.findById(ventureProjectId);
  if (!project) return { inserted: false, skipped: true };

  if (Number(project.overall_score) < FINANCIAL_SCORE_THRESHOLD) {
    return { inserted: false, skipped: true };
  }

  // Idempotency: skip if model already exists for this project
  const existing = await modelsRepo.findByVentureProject(ventureProjectId);
  if (existing) return { inserted: false, skipped: true };

  const provider = getAIProviderFromEnv();

  const financialInput = await provider.generateFinancialModel({
    ventureProjectName: project.name,
    ventureProjectTagline: project.tagline,
    currency: options?.currency ?? "USD",
    projectionYears: options?.projectionYears ?? 5,
  });

  // 1. Create the model
  const model = await modelsRepo.create({
    venture_project_id: ventureProjectId,
    currency: financialInput.currency,
    projection_years: financialInput.projectionYears,
    assumptions: financialInput.assumptions,
  });

  // 2. Create projections
  const projectionInserts = financialInput.projections.map((p) => ({
    financial_model_id: model.id,
    year: p.year,
    revenue: p.revenue,
    cogs: p.cogs,
    gross_profit: p.grossProfit,
    operating_expenses: p.operatingExpenses,
    ebitda: p.ebitda,
    net_profit: p.netProfit,
    cash_balance: p.cashBalance,
  }));
  await projectionsRepo.createMany(projectionInserts);

  // 3. Create unit economics
  await unitEconRepo.create({
    financial_model_id: model.id,
    cac: financialInput.unitEconomics.cac,
    ltv: financialInput.unitEconomics.ltv,
    ltv_cac_ratio: financialInput.unitEconomics.ltvCacRatio,
    payback_months: financialInput.unitEconomics.paybackMonths,
    gross_margin: financialInput.unitEconomics.grossMargin,
    arpu: financialInput.unitEconomics.arpu,
    monthly_churn: financialInput.unitEconomics.monthlyChurn,
  });

  // 4. Create break-even analysis
  await breakEvenRepo.create({
    financial_model_id: model.id,
    monthly_fixed_cost: financialInput.breakEven.monthlyFixedCost,
    gross_margin: financialInput.breakEven.grossMargin,
    break_even_revenue: financialInput.breakEven.breakEvenRevenue,
    break_even_customers: financialInput.breakEven.breakEvenCustomers,
    estimated_break_even_month: financialInput.breakEven.estimatedBreakEvenMonth,
  });

  emitAnalytics("financial_generated", {
    modelId: model.id,
    ventureProjectId,
    projectedARR: financialInput.projectedARR,
    runwayMonths: financialInput.runwayMonths,
    breakEvenMonth: financialInput.breakEvenMonth,
  });

  return { inserted: true, skipped: false };
}

/**
 * Batch generate financial models for eligible venture projects.
 */
export async function generateBatch(limit?: number): Promise<FinancialGenerationResult> {
  const projectsRepo = await VentureProjectsRepository.create();
  const allProjects = await projectsRepo.list({ limit: limit ?? 50 });
  const eligible = allProjects.filter(
    (p) => Number(p.overall_score) >= FINANCIAL_SCORE_THRESHOLD,
  );

  const result: FinancialGenerationResult = {
    processed: 0,
    generated: 0,
    skipped: 0,
    inserted: 0,
  };

  for (const project of eligible.slice(0, limit ?? 10)) {
    result.processed += 1;
    const { inserted, skipped } = await generateFinancialModel(project.id);
    if (inserted) {
      result.generated += 1;
      result.inserted += 1;
    }
    if (skipped) result.skipped += 1;
  }

  return result;
}

// ── Read operations ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<FinancialDashboardStats> {
  const modelsRepo = await FinancialModelsRepository.create();
  const projectionsRepo = await FinancialProjectionsRepository.create();
  const unitEconRepo = await UnitEconomicsRepository.create();

  const totalModels = await modelsRepo.count();
  const allCards = await modelsRepo.listCards({ limit: 200 });

  let projectedARR = 0;
  let runwayMonths = 0;
  let burnRate = 0;
  let breakEvenMonth = 0;
  let ltvCacRatio = 0;
  let projectedProfit = 0;

  if (allCards.length > 0) {
    // Aggregate from all models
    for (const card of allCards) {
      const model = await modelsRepo.findById(card.id);
      if (!model) continue;

      const projections = await projectionsRepo.findByModel(card.id);
      const ue = await unitEconRepo.findByModel(card.id);

      if (projections.length > 0) {
        const year1 = projections.find((p) => p.year === 1);
        if (year1) projectedARR += year1.revenue;

        const lastYear = projections[projections.length - 1];
        if (lastYear) projectedProfit += lastYear.net_profit;
      }

      if (ue) {
        ltvCacRatio += ue.ltv_cac_ratio;
      }
    }

    // Average LTV/CAC
    ltvCacRatio = ltvCacRatio / allCards.length;

    // Estimate burn rate from Year 1 avg monthly expenses
    burnRate = projectedARR > 0 ? (projectedARR * 0.6) / 12 : 0;
    runwayMonths = burnRate > 0 ? (projectedARR * 0.3) / burnRate : 0;
    breakEvenMonth = runwayMonths > 0 ? Math.min(Math.ceil(runwayMonths * 0.8), 36) : 0;
  }

  return {
    totalModels,
    projectedARR,
    runwayMonths,
    burnRate,
    breakEvenMonth,
    ltvCacRatio,
    projectedProfit,
  };
}

export async function getModelDetail(modelId: string): Promise<FinancialModelDetail | null> {
  const modelsRepo = await FinancialModelsRepository.create();
  const projectionsRepo = await FinancialProjectionsRepository.create();
  const unitEconRepo = await UnitEconomicsRepository.create();
  const breakEvenRepo = await BreakEvenRepository.create();
  const projectsRepo = await VentureProjectsRepository.create();

  const model = await modelsRepo.findById(modelId);
  if (!model) return null;

  const projections = await projectionsRepo.findByModel(modelId);
  const unitEconomics = await unitEconRepo.findByModel(modelId);
  const breakEven = await breakEvenRepo.findByModel(modelId);

  const project = await projectsRepo.findById(model.venture_project_id);

  return {
    model,
    projections,
    unitEconomics,
    breakEven,
    ventureProjectName: project?.name ?? "Unknown",
  };
}

export async function getModelByVentureProject(
  ventureProjectId: string,
): Promise<FinancialModelDetail | null> {
  const modelsRepo = await FinancialModelsRepository.create();

  const model = await modelsRepo.findByVentureProject(ventureProjectId);
  if (!model) return null;

  return getModelDetail(model.id);
}

export async function listModels(options: { limit?: number } = {}): Promise<FinancialModelRow[]> {
  const modelsRepo = await FinancialModelsRepository.create();
  return modelsRepo.list(options);
}

export async function deleteModel(modelId: string): Promise<void> {
  const projectionsRepo = await FinancialProjectionsRepository.create();
  const unitEconRepo = await UnitEconomicsRepository.create();
  const breakEvenRepo = await BreakEvenRepository.create();
  const modelsRepo = await FinancialModelsRepository.create();

  // Delete children first
  await projectionsRepo.deleteByModel(modelId);
  await unitEconRepo.deleteByModel(modelId);
  await breakEvenRepo.deleteByModel(modelId);
  await modelsRepo.delete(modelId);

  emitAnalytics("financial_deleted", { modelId });
}

export async function regenerateModel(
  ventureProjectId: string,
  options?: { currency?: string; projectionYears?: number },
): Promise<{ inserted: boolean; skipped: boolean }> {
  const modelsRepo = await FinancialModelsRepository.create();

  const existing = await modelsRepo.findByVentureProject(ventureProjectId);
  if (existing) {
    await deleteModel(existing.id);
  }

  return generateFinancialModel(ventureProjectId, options);
}

// ── Investment recommendation ────────────────────────────────────────────────

export function getInvestmentRecommendation(
  detail: FinancialModelDetail,
): InvestmentRecommendation {
  const { unitEconomics: ue, breakEven: be } = detail;

  if (!ue || !be) {
    return {
      stage: "Bootstrap",
      recommended: true,
      reasoning: "Insufficient financial data — bootstrap to validate unit economics.",
    };
  }

  const ltvCac = ue.ltv_cac_ratio;
  const breakEvenMonth = be.estimated_break_even_month;

  if (ltvCac >= 5 && breakEvenMonth <= 12) {
    return {
      stage: "Series A",
      recommended: true,
      reasoning: `Strong unit economics (LTV/CAC ${ltvCac.toFixed(1)}x) and fast break-even (${breakEvenMonth} months) justify growth-stage capital.`,
    };
  }

  if (ltvCac >= 3 && breakEvenMonth <= 18) {
    return {
      stage: "Seed",
      recommended: true,
      reasoning: `Good unit economics (LTV/CAC ${ltvCac.toFixed(1)}x) with ${breakEvenMonth}-month break-even. Seed capital accelerates growth.`,
    };
  }

  if (ltvCac >= 2 && breakEvenMonth <= 24) {
    return {
      stage: "Angel",
      recommended: true,
      reasoning: `Moderate unit economics (LTV/CAC ${ltvCac.toFixed(1)}x). Angel investment to optimize before scaling.`,
    };
  }

  if (ltvCac >= 1) {
    return {
      stage: "Bootstrap",
      recommended: true,
      reasoning: `LTV/CAC ${ltvCac.toFixed(1)}x is marginal. Bootstrap to improve retention and reduce CAC before raising.`,
    };
  }

  return {
    stage: "Not Recommended",
    recommended: false,
    reasoning: `LTV/CAC ${ltvCac.toFixed(1)}x is below 1.0 — the business loses money on every customer. Fix unit economics first.`,
  };
}

// ── Risk assessment ──────────────────────────────────────────────────────────

export function getRiskAssessment(
  detail: FinancialModelDetail,
): RiskAssessment[] {
  const { unitEconomics: ue, projections, breakEven: be } = detail;
  const risks: RiskAssessment[] = [];

  // Revenue Risk
  const year1Rev = projections.find((p) => p.year === 1)?.revenue ?? 0;
  const year5Rev = projections.find((p) => p.year === 5)?.revenue ?? 0;
  const revGrowth = year1Rev > 0 ? year5Rev / year1Rev : 0;
  risks.push({
    category: "Revenue Risk",
    level: revGrowth > 10 ? "Low" : revGrowth > 5 ? "Medium" : "High",
    score: revGrowth > 10 ? 25 : revGrowth > 5 ? 50 : 75,
    reasoning: `Year 1→5 growth: ${revGrowth.toFixed(1)}x. ${revGrowth > 10 ? "Strong projected growth." : "Moderate growth — execution critical."}`,
  });

  // Execution Risk
  const breakEvenMonth = be?.estimated_break_even_month ?? 36;
  risks.push({
    category: "Execution Risk",
    level: breakEvenMonth <= 12 ? "Low" : breakEvenMonth <= 24 ? "Medium" : "High",
    score: breakEvenMonth <= 12 ? 25 : breakEvenMonth <= 24 ? 50 : 75,
    reasoning: `Break-even at month ${breakEvenMonth}. ${breakEvenMonth <= 12 ? "Fast path to profitability." : "Extended burn period increases execution risk."}`,
  });

  // Market Risk
  const grossMargin = ue?.gross_margin ?? 0;
  risks.push({
    category: "Market Risk",
    level: grossMargin >= 70 ? "Low" : grossMargin >= 50 ? "Medium" : "High",
    score: grossMargin >= 70 ? 25 : grossMargin >= 50 ? 50 : 75,
    reasoning: `Gross margin ${grossMargin.toFixed(0)}%. ${grossMargin >= 70 ? "Strong margin indicates pricing power." : "Margin compression may signal competitive pressure."}`,
  });

  // Capital Risk
  const ltvCac = ue?.ltv_cac_ratio ?? 0;
  risks.push({
    category: "Capital Risk",
    level: ltvCac >= 3 ? "Low" : ltvCac >= 2 ? "Medium" : "High",
    score: ltvCac >= 3 ? 25 : ltvCac >= 2 ? 50 : 75,
    reasoning: `LTV/CAC ${ltvCac.toFixed(1)}x. ${ltvCac >= 3 ? "Efficient customer acquisition." : "High CAC may require significant capital."}`,
  });

  // Competition Risk
  risks.push({
    category: "Competition Risk",
    level: "Medium",
    score: 50,
    reasoning: "Market competition assumed moderate — validate with competitive analysis.",
  });

  // Technical Risk
  risks.push({
    category: "Technical Risk",
    level: breakEvenMonth <= 18 ? "Low" : "Medium",
    score: breakEvenMonth <= 18 ? 25 : 50,
    reasoning: `Technical execution ${breakEvenMonth <= 18 ? "aligned with financial timeline" : "may lag financial projections"}.`,
  });

  return risks;
}

// ── Financial summary (Markdown-ready) ───────────────────────────────────────

export function getFinancialSummary(detail: FinancialModelDetail): string {
  const { model, projections, unitEconomics: ue, breakEven: be } = detail;
  const year1 = projections.find((p) => p.year === 1);
  const year3 = projections.find((p) => p.year === 3);
  const year5 = projections.find((p) => p.year === 5);

  const lines: string[] = [];
  lines.push(`# Financial Model — ${detail.ventureProjectName}`);
  lines.push("");
  lines.push(`**Currency:** ${model.currency} · **Projection:** ${model.projection_years} years`);
  lines.push("");

  if (year1) {
    lines.push("## Year 1");
    lines.push(`- Revenue: $${year1.revenue.toLocaleString()}`);
    lines.push(`- COGS: $${year1.cogs.toLocaleString()}`);
    lines.push(`- Gross Profit: $${year1.gross_profit.toLocaleString()}`);
    lines.push(`- OpEx: $${year1.operating_expenses.toLocaleString()}`);
    lines.push(`- EBITDA: $${year1.ebitda.toLocaleString()}`);
    lines.push(`- Net Profit: $${year1.net_profit.toLocaleString()}`);
    lines.push(`- Cash: $${year1.cash_balance.toLocaleString()}`);
    lines.push("");
  }

  if (year3) {
    lines.push("## Year 3");
    lines.push(`- Revenue: $${year3.revenue.toLocaleString()}`);
    lines.push(`- Net Profit: $${year3.net_profit.toLocaleString()}`);
    lines.push("");
  }

  if (year5) {
    lines.push("## Year 5");
    lines.push(`- Revenue: $${year5.revenue.toLocaleString()}`);
    lines.push(`- Net Profit: $${year5.net_profit.toLocaleString()}`);
    lines.push("");
  }

  if (ue) {
    lines.push("## Unit Economics");
    lines.push(`- CAC: $${ue.cac.toLocaleString()}`);
    lines.push(`- LTV: $${ue.ltv.toLocaleString()}`);
    lines.push(`- LTV/CAC: ${ue.ltv_cac_ratio.toFixed(1)}x`);
    lines.push(`- ARPU: $${ue.arpu.toLocaleString()}/mo`);
    lines.push(`- Gross Margin: ${ue.gross_margin.toFixed(0)}%`);
    lines.push(`- Monthly Churn: ${(ue.monthly_churn * 100).toFixed(1)}%`);
    lines.push(`- Payback: ${ue.payback_months.toFixed(0)} months`);
    lines.push("");
  }

  if (be) {
    lines.push("## Break-Even");
    lines.push(`- Monthly Fixed Cost: $${be.monthly_fixed_cost.toLocaleString()}`);
    lines.push(`- Break-Even Revenue: $${be.break_even_revenue.toLocaleString()}/mo`);
    lines.push(`- Break-Even Customers: ${be.break_even_customers}`);
    lines.push(`- Estimated Month: ${be.estimated_break_even_month}`);
    lines.push("");
  }

  return lines.join("\n");
}
