/**
 * Sprint 66: Venture Score Calculator
 *
 * Pure deterministic functions — no I/O, no AI, no side effects.
 * All scoring logic lives here; service layer only does data loading.
 */

import type {
  VentureScoreComponents,
  VentureRecommendation,
  InvestmentGrade,
} from "@/types/venture-score";
import {
  VENTURE_SCORE_WEIGHTS,
  INVESTMENT_GRADE_RULES,
  RECOMMENDATION_RULES,
  CONFIDENCE_WEIGHTS,
  FALLBACK_SCORES,
  EXPLANATION_RULES,
} from "./venture-score.constants";

/**
 * Compute overall venture score from component scores.
 * Missing components use fallback weights redistributed among available ones.
 */
export function calculateOverallScore(components: VentureScoreComponents): number {
  const weights: Record<string, number> = {
    validation: VENTURE_SCORE_WEIGHTS.validation,
    financial: VENTURE_SCORE_WEIGHTS.financial,
    forecast: VENTURE_SCORE_WEIGHTS.forecast,
    research: VENTURE_SCORE_WEIGHTS.research,
    competition: VENTURE_SCORE_WEIGHTS.competition,
    execution: VENTURE_SCORE_WEIGHTS.execution,
    innovation: VENTURE_SCORE_WEIGHTS.innovation,
    historicalSimilarity: VENTURE_SCORE_WEIGHTS.historicalSimilarity,
  };

  const scores: Record<string, number> = {
    validation: components.validation?.available
      ? components.validation.score
      : FALLBACK_SCORES.missingValidation,
    financial: components.financial?.available
      ? components.financial.overallScore
      : FALLBACK_SCORES.missingFinancial,
    forecast: components.forecast?.available
      ? components.forecast.score
      : FALLBACK_SCORES.missingForecast,
    research: components.research?.available
      ? components.research.completeness
      : FALLBACK_SCORES.missingResearch,
    competition: components.competition?.available
      ? components.competition.score
      : FALLBACK_SCORES.missingCompetition,
    execution: components.portfolio?.available
      ? 100 - components.portfolio.similarCount * 2 // proxy: more similar = easier exec
      : 100 - (components.backtesting?.available ? components.backtesting.accuracy : 50),
    innovation: components.research?.available
      ? Math.min(100, components.research.sources * 5)
      : FALLBACK_SCORES.missingResearch,
    historicalSimilarity: components.backtesting?.available
      ? components.backtesting.accuracy
      : FALLBACK_SCORES.missingBacktesting,
  };

  // Only use weights for available components (including fallbacks)
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights) as Array<keyof typeof weights>) {
    weightedSum += weights[key] * scores[key];
    totalWeight += weights[key];
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

/**
 * Determine investment grade from overall score.
 */
export function calculateInvestmentGrade(overallScore: number): InvestmentGrade {
  for (const rule of INVESTMENT_GRADE_RULES) {
    if (overallScore >= rule.min) return rule.grade;
  }
  return "Reject";
}

/**
 * Calculate confidence score (0-100).
 * Depends on data completeness across all modules.
 */
export function calculateConfidence(components: VentureScoreComponents): number {
  const confWeights = CONFIDENCE_WEIGHTS;
  let weightedSum = 0;
  let totalWeight = 0;

  // Validation module
  if (components.validation?.available) {
    weightedSum += confWeights.validation * (components.validation.confidence / 100) * 100;
    totalWeight += confWeights.validation;
  }

  // Forecast module
  if (components.forecast?.available) {
    // Forecast quality: higher trend + available = better
    const fq = Math.min(100, (components.forecast.score + Math.max(0, components.forecast.trend * 10)) / 2);
    weightedSum += confWeights.forecast * fq;
    totalWeight += confWeights.forecast;
  }

  // Financial module
  if (components.financial?.available) {
    const finQual = Math.min(100, components.financial.ltvCacRatio * 20 + (100 - Math.min(50, components.financial.breakEvenMonths * 2)));
    weightedSum += confWeights.financial * finQual;
    totalWeight += confWeights.financial;
  }

  // Research module
  if (components.research?.available) {
    weightedSum += confWeights.research * Math.min(100, components.research.completeness + components.research.sources * 5);
    totalWeight += confWeights.research;
  }

  // Competition module
  if (components.competition?.available) {
    weightedSum += confWeights.competition * components.competition.score;
    totalWeight += confWeights.competition;
  }

  // Portfolio/backtesting
  if (components.portfolio?.available) {
    const pbQual = Math.min(100, 50 + components.portfolio.avgPerformance / 2);
    weightedSum += confWeights.portfolioBacktesting * pbQual;
    totalWeight += confWeights.portfolioBacktesting;
  } else if (components.backtesting?.available) {
    weightedSum += confWeights.portfolioBacktesting * components.backtesting.accuracy;
    totalWeight += confWeights.portfolioBacktesting;
  }

  // Insights
  if (components.insights?.available) {
    weightedSum += confWeights.insights * components.insights.quality;
    totalWeight += confWeights.insights;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 50;
}

/**
 * Calculate risk score (0-100, higher = lower risk = better).
 * Based on competition, execution difficulty, forecast volatility, market uncertainty.
 */
export function calculateRiskScore(components: VentureScoreComponents): number {
  const riskFactors: number[] = [];

  // Competition (higher competition_score = less crowded = lower risk)
  if (components.competition?.available) {
    riskFactors.push(components.competition.score);
  } else {
    riskFactors.push(50);
  }

  // Execution (higher execution_score = easier = lower risk)
  if (components.portfolio?.available) {
    riskFactors.push(Math.min(100, 100 - components.portfolio.similarCount * 3));
  } else {
    riskFactors.push(50);
  }

  // Forecast volatility (lower trend variation = lower risk)
  if (components.forecast?.available) {
    const volatility = Math.max(0, 100 - Math.abs(components.forecast.trend) * 20);
    riskFactors.push(volatility);
  } else {
    riskFactors.push(40);
  }

  // Market uncertainty (inverse of market_score)
  if (components.research?.available) {
    riskFactors.push(Math.min(100, components.research.completeness));
  } else {
    riskFactors.push(40);
  }

  return riskFactors.length > 0
    ? Math.round((riskFactors.reduce((a, b) => a + b, 0) / riskFactors.length) * 100) / 100
    : 50;
}

/**
 * Calculate ROI score from financials.
 */
export function calculateROIScore(components: VentureScoreComponents): number {
  if (!components.financial?.available) return 30;

  const { ltvCacRatio, breakEvenMonths } = components.financial;

  let roi = 0;
  // LTV/CAC: 3x = 60, 5x = 80, 10x = 100
  roi += Math.min(100, ltvCacRatio * 20);

  // Break-even: <12m = 90, 12-24 = 70, 24-36 = 50, >36 = 30
  if (breakEvenMonths <= 12) roi += 90;
  else if (breakEvenMonths <= 24) roi += 70;
  else if (breakEvenMonths <= 36) roi += 50;
  else roi += 30;

  return Math.round((roi / 2) * 100) / 100;
}

/**
 * Calculate market score from research + validation.
 */
export function calculateMarketScore(components: VentureScoreComponents): number {
  const scores: number[] = [];

  if (components.research?.available) {
    scores.push(Math.min(100, components.research.completeness + components.research.sources * 4));
  }
  if (components.validation?.available) {
    scores.push(components.validation.score);
  }
  if (components.competition?.available) {
    scores.push(components.competition.score);
  }

  return scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    : FALLBACK_SCORES.missingResearch;
}

/**
 * Calculate execution score from portfolio/backtesting/insights.
 */
export function calculateExecutionScore(components: VentureScoreComponents): number {
  const scores: number[] = [];

  if (components.portfolio?.available) {
    scores.push(Math.min(100, 50 + components.portfolio.avgPerformance));
  }
  if (components.backtesting?.available) {
    scores.push(components.backtesting.accuracy);
  }
  if (components.insights?.available) {
    scores.push(components.insights.quality);
  }

  return scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    : FALLBACK_SCORES.missingBacktesting;
}

/**
 * Calculate innovation score from research sources + validation.
 */
export function calculateInnovationScore(components: VentureScoreComponents): number {
  if (!components.research?.available) return FALLBACK_SCORES.missingResearch;

  let score = Math.min(100, components.research.sources * 8);

  if (components.validation?.available) {
    score = Math.max(score, components.validation.score * 0.6);
  }

  return Math.round(score * 100) / 100;
}

/**
 * Calculate financial score from financial projection.
 */
export function calculateFinancialScore(components: VentureScoreComponents): number {
  if (!components.financial?.available) return FALLBACK_SCORES.missingFinancial;

  const { overallScore, ltvCacRatio } = components.financial;
  let score = overallScore;

  // Boost for strong unit economics
  if (ltvCacRatio >= 5) score = Math.min(100, score + 10);
  else if (ltvCacRatio >= 3) score = Math.min(100, score + 5);

  return Math.round(score * 100) / 100;
}

/**
 * Calculate validation score (direct from validation module).
 */
export function calculateValidationScore(components: VentureScoreComponents): number {
  if (!components.validation?.available) return FALLBACK_SCORES.missingValidation;
  return components.validation.score;
}

/**
 * Calculate forecast score (direct from forecast module).
 */
export function calculateForecastScore(components: VentureScoreComponents): number {
  if (!components.forecast?.available) return FALLBACK_SCORES.missingForecast;
  return components.forecast.score;
}

/**
 * Calculate research score.
 */
export function calculateResearchScore(components: VentureScoreComponents): number {
  if (!components.research?.available) return FALLBACK_SCORES.missingResearch;
  return Math.min(100, components.research.completeness + components.research.sources * 3);
}

/**
 * Determine recommendation from overall score + confidence + risk.
 * Deterministic rules, no AI.
 */
export function calculateRecommendation(
  overallScore: number,
  confidence: number,
  risk: number,
): VentureRecommendation {
  if (
    overallScore >= RECOMMENDATION_RULES.strongBuy.minOverall &&
    confidence >= RECOMMENDATION_RULES.strongBuy.minConfidence &&
    risk <= RECOMMENDATION_RULES.strongBuy.maxRisk
  ) {
    return "Strong Buy";
  }
  if (
    overallScore >= RECOMMENDATION_RULES.buy.minOverall &&
    confidence >= RECOMMENDATION_RULES.buy.minConfidence
  ) {
    return "Buy";
  }
  if (overallScore >= RECOMMENDATION_RULES.watch.minOverall) {
    return "Watch";
  }
  if (overallScore >= RECOMMENDATION_RULES.speculative.minOverall) {
    return "Speculative";
  }
  return "Reject";
}

/**
 * Generate strengths/weaknesses lists using deterministic thresholds.
 */
export function generateExplanations(components: VentureScoreComponents): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Strengths
  if (components.financial?.available && components.financial.ltvCacRatio >= EXPLANATION_RULES.monetizationThreshold / 3) {
    strengths.push("High LTV/CAC ratio indicates strong monetization potential");
  }
  if (components.research?.available && (components.research.completeness + components.research.sources * 3) >= EXPLANATION_RULES.tamThreshold) {
    strengths.push("Large Total Addressable Market with good research coverage");
  }
  if (components.validation?.available && components.validation.score >= EXPLANATION_RULES.validationThreshold) {
    strengths.push("Strong AI validation score across all dimensions");
  }
  if (components.forecast?.available && components.forecast.trend > 0.1) {
    strengths.push("Positive market momentum and growth forecast");
  }
  if (components.portfolio?.available && components.portfolio.avgPerformance >= 60) {
    strengths.push("Historical portfolio data shows similar ventures performed well");
  }
  if (components.insights?.available && components.insights.quality >= 70) {
    strengths.push("High-quality AI insights with actionable findings");
  }

  // Weaknesses
  if (components.competition?.available && components.competition.score <= EXPLANATION_RULES.competitionCrowdedMax) {
    weaknesses.push("Highly competitive market with many established players");
  }
  if (components.financial?.available && components.financial.breakEvenMonths >= EXPLANATION_RULES.paybackLongMonths) {
    weaknesses.push("Long payback period indicates capital-intensive execution");
  }
  if (components.portfolio?.available && components.portfolio.similarCount >= 5) {
    weaknesses.push("Execution complexity: many similar ventures in portfolio");
  }
  if (components.forecast?.available && components.forecast.trend < -0.1) {
    weaknesses.push("Negative market trend may reduce future demand");
  }
  if (!components.research?.available) {
    weaknesses.push("Limited market research available for this opportunity");
  }
  if (!components.financial?.available) {
    weaknesses.push("No financial projections generated — unit economics unknown");
  }
  if (!components.validation?.available) {
    weaknesses.push("Missing AI validation — risk dimensions unquantified");
  }
  if (!components.forecast?.available) {
    weaknesses.push("No market forecast available — timing uncertain");
  }

  return { strengths, weaknesses };
}

/**
 * Build the complete VentureScoreComponents snapshot from loaded data.
 * This is the only place that converts raw DB rows into the scoring input shape.
 */
export function buildComponentsFromData(data: {
  opportunity: Record<string, unknown>;
  validation?: Record<string, unknown> | null;
  forecast?: Record<string, unknown> | null;
  financial?: Record<string, unknown> | null;
  research?: Record<string, unknown> | null;
  insights?: Record<string, unknown> | null;
  competition?: Record<string, unknown> | null;
  portfolio?: Record<string, unknown> | null;
  backtesting?: Record<string, unknown> | null;
}): VentureScoreComponents {
  return {
    validation: data.validation
      ? {
          available: true,
          score: Number(data.validation.overall_score ?? data.validation.score ?? 0),
          confidence: Number(data.validation.confidence ?? 75),
        }
      : { available: false, score: 0, confidence: 0 },

    forecast: data.forecast
      ? {
          available: true,
          score: Number(data.forecast.overall_score ?? data.forecast.score ?? 0),
          trend: Number(data.forecast.growth_rate ?? data.forecast.trend ?? 0),
        }
      : { available: false, score: 0, trend: 0 },

    financial: data.financial
      ? {
          available: true,
          overallScore: Number(data.financial.overall_score ?? data.financial.score ?? 0),
          ltvCacRatio: Number(data.financial.ltv_cac_ratio ?? data.financial.ltvCacRatio ?? 0),
          breakEvenMonths: Number(data.financial.break_even_months ?? data.financial.breakEvenMonths ?? 36),
        }
      : { available: false, overallScore: 0, ltvCacRatio: 0, breakEvenMonths: 0 },

    research: data.research
      ? {
          available: true,
          completeness: Number(data.research.completeness ?? 0),
          sources: Number(data.research.sources_count ?? data.research.sources ?? 0),
        }
      : { available: false, completeness: 0, sources: 0 },

    insights: data.insights
      ? {
          available: true,
          quality: Number(data.insights.quality ?? 0),
        }
      : { available: false, quality: 0 },

    competition: data.competition
      ? {
          available: true,
          score: Number(data.competition.competition_score ?? data.competition.score ?? 50),
        }
      : { available: false, score: 50 },

    portfolio: data.portfolio
      ? {
          available: true,
          similarCount: Number(data.portfolio.similar_count ?? 0),
          avgPerformance: Number(data.portfolio.avg_performance ?? 0),
        }
      : { available: false, similarCount: 0, avgPerformance: 0 },

    backtesting: data.backtesting
      ? {
          available: true,
          accuracy: Number(data.backtesting.accuracy ?? 0),
        }
      : { available: false, accuracy: 0 },
  };
}