// Sprint 60: Portfolio Intelligence Engine - Service Layer

import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import type {
  PortfolioItemRow,
  PortfolioItemInput,
  PortfolioCard,
  PortfolioStatistics,
  PortfolioFilters,
  PortfolioSort,
  PortfolioStatus,
  Priority,
  HealthCalculationInput,
  ReviewAction,
} from '@/types/portfolio';

const portfolioRepo = new PortfolioRepository();

// Safe analytics wrapper - no-ops if AnalyticsService is unavailable
async function trackAnalytics(payload: { event_type: string; event_data?: Record<string, unknown> }): Promise<void> {
  try {
    const { AnalyticsService } = await import('@/services/admin/analytics.service');
    const svc = new AnalyticsService();
    await svc.track(payload.event_type, payload.event_data ?? {});
  } catch {
    // Analytics is best-effort
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics]', payload.event_type);
    }
  }
}

// ==========================================
// ADD TO PORTFOLIO
// ==========================================

export async function addToPortfolio(
  input: PortfolioItemInput
): Promise<PortfolioItemRow> {
  const item = await portfolioRepo.create(input);

  await trackAnalytics({
    event_type: 'portfolio_added',
    event_data: {
      portfolio_id: item.id,
      opportunity_id: item.opportunity_id,
      status: item.status,
      priority: item.priority,
    },
  });

  return item;
}

// ==========================================
// UPDATE STATUS
// ==========================================

export async function updateStatus(
  id: string,
  status: PortfolioStatus
): Promise<PortfolioItemRow> {
  const item = await portfolioRepo.changeStatus(id, status);

  await trackAnalytics({
    event_type: 'status_changed',
    event_data: {
      portfolio_id: id,
      old_status: item.status,
      new_status: status,
    },
  });

  return item;
}

// ==========================================
// UPDATE PRIORITY
// ==========================================

export async function updatePriority(
  id: string,
  priority: Priority
): Promise<PortfolioItemRow> {
  const item = await portfolioRepo.changePriority(id, priority);

  await trackAnalytics({
    event_type: 'priority_changed',
    event_data: {
      portfolio_id: id,
      old_priority: item.priority,
      new_priority: priority,
    },
  });

  return item;
}

// ==========================================
// TOGGLE FAVORITE
// ==========================================

export async function toggleFavorite(id: string): Promise<PortfolioItemRow> {
  const item = await portfolioRepo.toggleFavorite(id);

  if (item.favorite) {
    await trackAnalytics({
      event_type: 'favorite_added',
      event_data: {
        portfolio_id: id,
        opportunity_id: item.opportunity_id,
      },
    });
  }

  return item;
}

// ==========================================
// ARCHIVE
// ==========================================

export async function archiveItem(id: string): Promise<PortfolioItemRow> {
  const item = await portfolioRepo.archive(id);

  await trackAnalytics({
    event_type: 'portfolio_archived',
    event_data: {
      portfolio_id: id,
      opportunity_id: item.opportunity_id,
    },
  });

  return item;
}

export async function unarchiveItem(id: string): Promise<PortfolioItemRow> {
  return portfolioRepo.unarchive(id);
}

// ==========================================
// REVIEW
// ==========================================

export async function reviewItem(action: ReviewAction): Promise<PortfolioItemRow> {
  const updates: Partial<PortfolioItemInput> = {
    last_reviewed_at: new Date().toISOString(),
  };

  if (action.notes !== undefined) updates.notes = action.notes;
  if (action.status !== undefined) updates.status = action.status;
  if (action.priority !== undefined) updates.priority = action.priority;

  const item = await portfolioRepo.update(action.portfolio_id, updates);

  await trackAnalytics({
    event_type: 'portfolio_reviewed',
    event_data: {
      portfolio_id: action.portfolio_id,
      has_notes: !!action.notes,
      status_changed: !!action.status,
      priority_changed: !!action.priority,
    },
  });

  return item;
}

// ==========================================
// CALCULATE HEALTH SCORE
// ==========================================

export function calculateHealthScore(input: HealthCalculationInput): number {
  const weights = {
    investment_score: 0.30,
    backtesting_accuracy: 0.25,
    trend_score: 0.20,
    forecast_growth: 0.15,
    validation_score: 0.05,
    ai_confidence: 0.05,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  // Investment Score (0-100)
  if (input.investment_score !== null && input.investment_score !== undefined) {
    weightedSum += input.investment_score * weights.investment_score;
    totalWeight += weights.investment_score;
  }

  // Backtesting Accuracy (0-100)
  if (input.backtesting_accuracy !== null && input.backtesting_accuracy !== undefined) {
    weightedSum += input.backtesting_accuracy * weights.backtesting_accuracy;
    totalWeight += weights.backtesting_accuracy;
  }

  // Trend Score (0-100)
  if (input.trend_score !== null && input.trend_score !== undefined) {
    weightedSum += input.trend_score * weights.trend_score;
    totalWeight += weights.trend_score;
  }

  // Forecast Growth (normalize -100 to 100 → 0 to 100)
  if (input.forecast_growth !== null && input.forecast_growth !== undefined) {
    const normalized = ((input.forecast_growth + 100) / 2); // -100..100 → 0..100
    weightedSum += normalized * weights.forecast_growth;
    totalWeight += weights.forecast_growth;
  }

  // Validation Score (0-100)
  if (input.validation_score !== null && input.validation_score !== undefined) {
    weightedSum += input.validation_score * weights.validation_score;
    totalWeight += weights.validation_score;
  }

  // AI Confidence (0-1, scale to 0-100)
  if (input.ai_confidence !== null && input.ai_confidence !== undefined) {
    weightedSum += (input.ai_confidence * 100) * weights.ai_confidence;
    totalWeight += weights.ai_confidence;
  }

  // Return weighted average
  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// ==========================================
// UPDATE HEALTH SCORE
// ==========================================

export async function updateHealthScore(
  portfolio_id: string,
  healthInput: HealthCalculationInput
): Promise<PortfolioItemRow> {
  const health_score = calculateHealthScore(healthInput);
  return portfolioRepo.update(portfolio_id, { health_score });
}

// ==========================================
// GET PORTFOLIO ITEM
// ==========================================

export async function getPortfolioItem(id: string): Promise<PortfolioItemRow | null> {
  return portfolioRepo.findById(id);
}

export async function getPortfolioByOpportunity(
  opportunity_id: string
): Promise<PortfolioItemRow | null> {
  return portfolioRepo.findByOpportunity(opportunity_id);
}

// ==========================================
// LIST PORTFOLIO
// ==========================================

export async function listPortfolio(
  filters?: PortfolioFilters,
  sort?: PortfolioSort,
  limit?: number,
  offset?: number
): Promise<PortfolioItemRow[]> {
  return portfolioRepo.list(filters, sort, limit, offset);
}

export async function listPortfolioCards(
  filters?: PortfolioFilters,
  sort?: PortfolioSort,
  limit?: number,
  offset?: number
): Promise<PortfolioCard[]> {
  return portfolioRepo.listCards(filters, sort, limit, offset);
}

// ==========================================
// COUNT
// ==========================================

export async function countPortfolio(filters?: PortfolioFilters): Promise<number> {
  return portfolioRepo.count(filters);
}

// ==========================================
// GET STATISTICS
// ==========================================

export async function getStatistics(): Promise<PortfolioStatistics> {
  return portfolioRepo.statistics();
}

// ==========================================
// DELETE
// ==========================================

export async function deletePortfolioItem(id: string): Promise<void> {
  await portfolioRepo.delete(id);
}
