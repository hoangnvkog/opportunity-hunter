import { SubscriptionsRepository } from "@/lib/db/repositories/subscriptions.repository";
import { UsageLimitsRepository } from "@/lib/db/repositories/usage-limits.repository";
import { ProfilesRepository } from "@/lib/db/repositories/profiles.repository";
import type { RevenueMetrics, RevenueTrend } from "@/types/analytics";

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  pro: 29,
  team: 99,
};

export class RevenueService {
  private subscriptionsRepo: SubscriptionsRepository;
  private usageLimitsRepo: UsageLimitsRepository;
  private profilesRepo: ProfilesRepository;

  constructor(
    subscriptionsRepo: SubscriptionsRepository,
    usageLimitsRepo: UsageLimitsRepository,
    profilesRepo: ProfilesRepository,
  ) {
    this.subscriptionsRepo = subscriptionsRepo;
    this.usageLimitsRepo = usageLimitsRepo;
    this.profilesRepo = profilesRepo;
  }

  static async create(): Promise<RevenueService> {
    const [subscriptionsRepo, usageLimitsRepo, profilesRepo] = await Promise.all([
      SubscriptionsRepository.create(),
      UsageLimitsRepository.create(),
      ProfilesRepository.create(),
    ]);
    return new RevenueService(subscriptionsRepo, usageLimitsRepo, profilesRepo);
  }

  async getMetrics(): Promise<RevenueMetrics> {
    const all = await this.subscriptionsRepo.findAll();

    const active = all.filter(
      (s) => s.status === "active" || s.status === "trialing"
    );
    const mrr = active.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const canceledThisMonth = all.filter(
      (s) =>
        s.status === "canceled" &&
        s.current_period_end &&
        s.current_period_end >= startOfMonth
    ).length;

    const allUsers = await this.profilesRepo.findAll();
    const payingUsers = active.filter((s) => PLAN_PRICES[s.plan] > 0).length;
    const conversionRate =
      allUsers.length > 0 ? (payingUsers / allUsers.length) * 100 : 0;

    return {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: active.length,
      canceledThisMonth,
      trialing: all.filter((s) => s.status === "trialing").length,
      pastDue: all.filter((s) => s.status === "past_due").length,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  async getTrends(months = 6): Promise<RevenueTrend[]> {
    // Approximate: use current snapshot spread across months
    // In production this would query a subscription_events table
    const metrics = await this.getMetrics();
    const trends: RevenueTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toISOString().slice(0, 7);
      // Degrade MRR slightly for earlier months as a placeholder
      const factor = Math.pow(0.92, i);
      trends.push({
        month,
        mrr: Math.round(metrics.mrr * factor),
        subscriptions: Math.round(metrics.activeSubscriptions * factor),
        canceled: Math.round(metrics.canceledThisMonth * factor * 0.5),
        new: Math.round(metrics.activeSubscriptions * factor * 0.1),
      });
    }

    return trends;
  }

  async getSubscriptionBreakdown(): Promise<{
    plan: string;
    count: number;
    revenue: number;
  }[]> {
    const all = await this.subscriptionsRepo.findAll();
    const counts: Record<string, number> = {};
    for (const s of all) {
      counts[s.plan] = (counts[s.plan] ?? 0) + 1;
    }
    return Object.entries(counts).map(([plan, count]) => ({
      plan,
      count,
      revenue: count * (PLAN_PRICES[plan] ?? 0),
    }));
  }
}