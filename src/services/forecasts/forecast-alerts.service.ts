/**
 * Sprint 54 — Forecast Alert Service
 *
 * Generates alerts when an opportunity has a high forecast_score (>90).
 * Creates alert records + queues email notifications + tracking analytics.
 */

import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { OpportunityForecastsRepository } from "@/lib/db/repositories/opportunity-forecasts.repository";
import { OpportunitiesRepository } from "@/lib/db/repositories/opportunities.repository";
import type { OpportunityForecastRow } from "@/types/forecast";

const FORECAST_ALERT_THRESHOLD = 90;

/**
 * Result of forecasting alert run.
 */
export interface ForecastAlertResult {
  processed: number;
  alertsCreated: number;
  emailsQueued: number;
  triggered: number;
  skipped: number;
  threshold: number;
}

/**
 * Detect forecast alert candidates.
 */
export async function findForecastAlertCandidates(
  minScore: number = FORECAST_ALERT_THRESHOLD,
): Promise<OpportunityForecastRow[]> {
  const repo = await OpportunityForecastsRepository.create();
  return repo.list({ minScore, limit: 100 });
}

/**
 * Process all alerts for high-forecast opportunities.
 *
 * - Finds forecasts with score > threshold
 * - Matches each opportunity to user watchlists
 * - Creates alert records (idempotent)
 * - Queues email notification for affected users (only if email_enabled)
 * - Tracks analytics event
 *
 * @returns Summary of alert run
 */
export async function processForecastAlerts(
  minScore: number = FORECAST_ALERT_THRESHOLD,
): Promise<ForecastAlertResult> {
  const forecastRepo = await OpportunityForecastsRepository.create();
  const opportunityRepo = await OpportunitiesRepository.create();
  const { getSupabaseServiceClient } = await import("@/lib/supabase");
  const client = getSupabaseServiceClient();
  const { MatchingService } = await import("@/services/matching/matching.service");
  const { EmailService } = await import("@/services/email/email.service");
  const matchingService = new MatchingService(client);
  const alertsRepo = new AlertsRepository(client);
  const emailService = await EmailService.create();

  const candidates = await forecastRepo.list({ minScore, limit: 100 });

  if (candidates.length === 0) {
    return {
      processed: 0,
      alertsCreated: 0,
      emailsQueued: 0,
      triggered: 0,
      skipped: 0,
      threshold: minScore,
    };
  }

  let alertsCreated = 0;
  let emailsQueued = 0;
  let triggered = 0;
  let skipped = 0;

  for (const forecast of candidates) {
    try {
      const opportunity = await opportunityRepo.findById(forecast.opportunity_id);
      if (!opportunity) {
        skipped++;
        continue;
      }

      const matches = await matchingService.matchOpportunityToWatchlists(opportunity);
      if (matches.length === 0) {
        skipped++;
        continue;
      }

      triggered++;

      for (const match of matches) {
        // Idempotency: skip if alert already exists
        const existing = await alertsRepo.findByWatchlistAndOpportunity(
          match.watchlistId,
          forecast.opportunity_id,
        );
        if (existing) {
          skipped++;
          continue;
        }

        const alert = await alertsRepo.create({
          user_id: match.userId,
          watchlist_id: match.watchlistId,
          opportunity_id: forecast.opportunity_id,
        });
        alertsCreated++;

        // Queue email (no-op if user has email disabled)
        try {
          const notificationId = await emailService.queueAlertEmail(
            match.userId,
            alert.id,
          );
          if (notificationId) emailsQueued++;
        } catch (emailErr) {
          console.error(
            `[ForecastAlert] Failed to queue email for user ${match.userId}:`,
            emailErr,
          );
        }

        // Track analytics (best-effort, fire-and-forget).
        // Project has no event-tracking pipeline; AnalyticsService reads
        // metrics from DB on demand, so we emit a structured log line that
        // downstream log-based analytics (system_logs) can pick up.
        console.info(
          "[analytics] forecast_alert_triggered",
          JSON.stringify({
            event: "forecast_alert_triggered",
            opportunityId: forecast.opportunity_id,
            userId: match.userId,
            forecastScore: forecast.forecast_score,
            growthProbability: forecast.growth_probability,
          }),
        );
      }
    } catch (err) {
      console.error(`[ForecastAlert] Error processing ${forecast.id}:`, err);
      skipped++;
    }
  }

  return {
    processed: candidates.length,
    alertsCreated,
    emailsQueued,
    triggered,
    skipped,
    threshold: minScore,
  };
}

/**
 * Get the configured threshold for forecast alerts.
 */
export function getForecastAlertThreshold(): number {
  return FORECAST_ALERT_THRESHOLD;
}

/**
 * Re-export for tests / consumers.
 */
export const FORECAST_ALERT_THRESHOLD_VALUE = FORECAST_ALERT_THRESHOLD;
