// Sprint 60: Portfolio Intelligence Engine - Alert Notifications

import { createClient } from '@/lib/supabase/server';
import type { PortfolioItemRow } from '@/types/portfolio';

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

  // Get portfolio items with health history (simplified - would need history table in production)
  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .not('health_score', 'is', null);

  // For Sprint 60, we'll alert on low health (<50)
  items?.forEach((item: any) => {
    if (item.health_score < 50) {
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

  // Get portfolio items with excellent health (>90)
  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .gte('health_score', 90);

  items?.forEach((item: any) => {
    alerts.push({
      type: 'health_rise',
      portfolio_id: item.id,
      opportunity_id: item.opportunity_id,
      opportunity_title: item.opportunities.title,
      message: `Health score reached ${item.health_score.toFixed(1)} (excellent!)`,
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

  // Get critical priority items
  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .eq('priority', 'CRITICAL');

  items?.forEach((item: any) => {
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

  // Get items not reviewed in 30+ days
  const { data: items } = await supabase
    .from('portfolio_items')
    .select(`
      *,
      opportunities!inner(id, title)
    `)
    .eq('archived', false)
    .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${thirtyDaysAgo.toISOString()}`);

  items?.forEach((item: any) => {
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

export async function createAlertNotification(alert: PortfolioAlert): Promise<void> {
  const supabase = await createClient();

  await supabase.from('alerts').insert({
    type: alert.type,
    title: alert.message,
    message: alert.message,
    severity: alert.severity,
    metadata: {
      portfolio_id: alert.portfolio_id,
      opportunity_id: alert.opportunity_id,
      ...alert.metadata,
    },
  });
}
