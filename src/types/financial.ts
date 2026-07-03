/**
 * Sprint 64: Financial Projection Engine
 *
 * Types for financial_models, financial_projections, unit_economics, break_even_analysis.
 * AI returns business data only — no UUIDs, no foreign keys.
 */

import type { Uuid } from "./index";

// ---------------------------------------------------------------------------
// AI Provider input/output (business data only — no UUIDs, no FKs)
// ---------------------------------------------------------------------------

export interface FinancialAssumptions {
  averagePrice: number;
  conversionRate: number;
  monthlyGrowthRate: number;
  churnRate: number;
  grossMargin: number;
  cac: number;
  supportCost: number;
  hostingCost: number;
  payroll: number;
  marketingBudget: number;
  salesCost: number;
  infrastructure: number;
}

export interface FinancialProjectionInput {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  ebitda: number;
  netProfit: number;
  cashBalance: number;
}

export interface UnitEconomicsInput {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  paybackMonths: number;
  grossMargin: number;
  arpu: number;
  monthlyChurn: number;
}

export interface BreakEvenInput {
  monthlyFixedCost: number;
  grossMargin: number;
  breakEvenRevenue: number;
  breakEvenCustomers: number;
  estimatedBreakEvenMonth: number;
}

export interface InvestmentRecommendation {
  stage: string;
  recommended: boolean;
  reasoning: string;
}

export interface RiskAssessment {
  category: string;
  level: string;
  score: number;
  reasoning: string;
}

export interface FinancialProjectInput {
  name: string;
  tagline: string;
  currency: string;
  projectionYears: number;
  assumptions: FinancialAssumptions;
  projections: FinancialProjectionInput[];
  unitEconomics: UnitEconomicsInput;
  breakEven: BreakEvenInput;
  investmentRecommendation: InvestmentRecommendation;
  risks: RiskAssessment[];
  summary: string;
  runwayMonths: number;
  breakEvenMonth: number;
  projectedARR: number;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export type FinancialModelRow = {
  id: Uuid;
  venture_project_id: Uuid;
  currency: string;
  projection_years: number;
  assumptions: FinancialAssumptions;
  created_at: string;
  updated_at: string;
};

export type FinancialModelInsert = {
  id?: Uuid;
  venture_project_id: Uuid;
  currency?: string;
  projection_years?: number;
  assumptions?: FinancialAssumptions;
  created_at?: string;
  updated_at?: string;
};

export type FinancialProjectionRow = {
  id: Uuid;
  financial_model_id: Uuid;
  year: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  ebitda: number;
  net_profit: number;
  cash_balance: number;
  created_at: string;
};

export type FinancialProjectionInsert = {
  id?: Uuid;
  financial_model_id: Uuid;
  year: number;
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  operating_expenses?: number;
  ebitda?: number;
  net_profit?: number;
  cash_balance?: number;
  created_at?: string;
};

export type UnitEconomicsRow = {
  id: Uuid;
  financial_model_id: Uuid;
  cac: number;
  ltv: number;
  ltv_cac_ratio: number;
  payback_months: number;
  gross_margin: number;
  arpu: number;
  monthly_churn: number;
  created_at: string;
};

export type UnitEconomicsInsert = {
  id?: Uuid;
  financial_model_id: Uuid;
  cac?: number;
  ltv?: number;
  ltv_cac_ratio?: number;
  payback_months?: number;
  gross_margin?: number;
  arpu?: number;
  monthly_churn?: number;
  created_at?: string;
};

export type BreakEvenRow = {
  id: Uuid;
  financial_model_id: Uuid;
  monthly_fixed_cost: number;
  gross_margin: number;
  break_even_revenue: number;
  break_even_customers: number;
  estimated_break_even_month: number;
  created_at: string;
};

export type BreakEvenInsert = {
  id?: Uuid;
  financial_model_id: Uuid;
  monthly_fixed_cost?: number;
  gross_margin?: number;
  break_even_revenue?: number;
  break_even_customers?: number;
  estimated_break_even_month?: number;
  created_at?: string;
};

// ---------------------------------------------------------------------------
// Service result types
// ---------------------------------------------------------------------------

export interface FinancialModelCardData {
  id: Uuid;
  venture_project_id: Uuid;
  venture_project_name: string;
  currency: string;
  projection_years: number;
  created_at: string;
}

export interface FinancialDashboardStats {
  totalModels: number;
  projectedARR: number;
  runwayMonths: number;
  burnRate: number;
  breakEvenMonth: number;
  ltvCacRatio: number;
  projectedProfit: number;
}

export interface FinancialModelDetail {
  model: FinancialModelRow;
  projections: FinancialProjectionRow[];
  unitEconomics: UnitEconomicsRow | null;
  breakEven: BreakEvenRow | null;
  ventureProjectName: string;
}

export interface FinancialGenerationResult {
  processed: number;
  generated: number;
  skipped: number;
  inserted: number;
}

export type ExportFormat = "pdf" | "markdown" | "json" | "csv";
