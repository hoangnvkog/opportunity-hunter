// Sprint 60: Portfolio Intelligence Engine - Alert Notifications

import { createClient } from '@/lib/supabase/server';
import type { PortfolioItemRow } from '@/types/portfolio';
import type { Database } from '@/types/database.types';


// Type for portfolio item with joined opportunity
// Uses the actual schema row types to avoid manual interfaces
interface PortfolioItemWithOpportunity extends PortfolioItemRow {
  opportunities: Database['public']['Tables']['opportunities']['Row'];
}

// ==========================================
// ALERT TYPES
// ==========================================

export interface PortfolioAlert {
  type: 'health_drop' | 'health_rise' | 'critical_opportunity' | 'stale_review';
  portfolio_id: string;
  opportunity_id: string;
  opportunity_title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

// ==========================================
// CHECK HEALTH DROPS
// ==========================================

export async function checkHealthDrops(): Promise<PortfolioAlert[]> {
  const supabase = await createClient();
  const alerts: PortfolioAlert[] = [];

  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .not('health_score', 'is', null)
    .returns<PortfolioItemWithOpportunity[]>();

  items?.forEach((item: PortfolioItemWithOpportunity) => {
    if (item.health_score !== null && item.health_score < 50) {
      alerts.push({
        type: 'health_drop',
        portfolio_id: item.id,
        opportunity_id: item.opportunity_id,
        opportunity_title: item.opportunities.title,
        message: `Health score dropped to ${item.health_score.toFixed(1)} (below 50)`,
        severity: 'high',
        metadata: { health_score: item.health_score },
      });
    }
  });

  return alerts;
}

// ==========================================
// CHECK HEALTH RISES
// ==========================================

export async function checkHealthRises(): Promise<PortfolioAlert[]> {
  const supabase = await createClient();
  const alerts: PortfolioAlert[] = [];

  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .gte('health_score', 90)
    .returns<PortfolioItemWithOpportunity[]>();

  items?.forEach((item: PortfolioItemWithOpportunity) => {
    alerts.push({
      type: 'health_rise',
      portfolio_id: item.id,
      opportunity_id: item.opportunity_id,
      opportunity_title: item.opportunities.title,
      message: `Health score reached ${item.health_score!.toFixed(1)} (excellent!)`,
      severity: 'low',
      metadata: { health_score: item.health_score },
    });
  });

  return alerts;
}

// ==========================================
// CHECK CRITICAL OPPORTUNITIES
// ==========================================

export async function checkCriticalOpportunities(): Promise<PortfolioAlert[]> {
  const supabase = await createClient();
  const alerts: PortfolioAlert[] = [];

  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .eq('priority', 'CRITICAL')
    .returns<PortfolioItemWithOpportunity[]>();

  items?.forEach((item: PortfolioItemWithOpportunity) => {
    alerts.push({
      type: 'critical_opportunity',
      portfolio_id: item.id,
      opportunity_id: item.opportunity_id,
      opportunity_title: item.opportunities.title,
      message: `Critical priority opportunity requires attention`,
      severity: 'critical',
      metadata: { priority: item.priority },
    });
  });

  return alerts;
}

// ==========================================
// CHECK STALE REVIEWS
// ==========================================

export async function checkStaleReviews(): Promise<PortfolioAlert[]> {
  const supabase = await createClient();
  const alerts: PortfolioAlert[] = [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgo.toISOString()}`)
    .returns<PortfolioItemWithOpportunity[]>();

  items?.forEach((item: PortfolioItemWithOpportunity) => {
    const daysSinceReview = item.last_reviewed_at
      ? Math.floor((Date.now() - new Date(item.last_reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    alerts.push({
      type: 'stale_review',
      portfolio_id: item.id,
      opportunity_id: item.opportunity_id,
      opportunity_title: item.opportunities.title,
      message: daysSinceReview
        ? `Not reviewed in ${daysSinceReview} days`
        : 'Never reviewed',
      severity: 'medium',
      metadata: { days_since_review: daysSinceReview },
    });
  });

  return alerts;
}

// ==========================================
// GET ALL ALERTS
// ==========================================

export async function getAllPortfolioAlerts(): Promise<PortfolioAlert[]> {
  const [healthDrops, healthRises, critical, stale] = await Promise.all([
    checkHealthDrops(),
    checkHealthRises(),
    checkCriticalOpportunities(),
    checkStaleReviews(),
  ]);

  return [...healthDrops, ...healthRises, ...critical, ...stale];
}

// ==========================================
// CREATE ALERT NOTIFICATION
// ==========================================
// Note: alerts table only has (id, user_id, watchlist_id, opportunity_id, is_read, created_at)
// We insert minimal fields; extra metadata would need a schema migration

export async function createAlertNotification(alert: PortfolioAlert, watchlistId: string): Promise<void> {
  const supabase = await createClient();

  await supabase.from('alerts').insert({
    user_id: '', // Will be set by RLS/auth context
    watchlist_id: watchlistId,
    opportunity_id: alert.opportunity_id,
    is_read: false,
  });
}