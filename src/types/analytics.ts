// Analytics types

export type RevenueMetrics = {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  canceledThisMonth: number;
  trialing: number;
  pastDue: number;
  conversionRate: number;
};

export type RevenueTrend = {
  month: string; // YYYY-MM
  mrr: number;
  subscriptions: number;
  canceled: number;
  new: number;
};

export type UserMetrics = {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
};

export type UserActivityTrend = {
  date: string; // YYYY-MM-DD
  dau: number;
  wau: number;
  mau: number;
};

export type PipelineMetrics = {
  rawPostsToday: number;
  rawPostsWeek: number;
  painPointsToday: number;
  painPointsWeek: number;
  clustersTotal: number;
  opportunitiesTotal: number;
  startupIdeasTotal: number;
};

export type AiCostMetrics = {
  totalCost: number;
  costToday: number;
  costThisWeek: number;
  costThisMonth: number;
  inputTokensMonth: number;
  outputTokensMonth: number;
  requestsMonth: number;
};

export type AiCostTrend = {
  date: string; // YYYY-MM-DD
  cost: number;
  requests: number;
};

export type FeatureUsage = {
  feature: string;
  count: number;
  users: number;
};

export type SystemHealth = {
  status: "healthy" | "degraded" | "down";
  errorsLast24h: number;
  warningsLast24h: number;
  avgResponseTime: number | null;
};

export type AdminDashboardSummary = {
  totalUsers: number;
  totalSubscriptions: number;
  mrr: number;
  arr: number;
  aiCostThisMonth: number;
  opportunitiesTotal: number;
  activeAlerts: number;
  systemHealth: SystemHealth;
};