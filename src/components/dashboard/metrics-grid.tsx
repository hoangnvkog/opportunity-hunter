import { MetricCard } from "./metric-card";
import { TrendingUp, AlertCircle, Target, Brain, Star, Eye, Bell, Mail, CalendarDays, CheckCircle, FileText, Percent, Zap, BarChart3, Flame } from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

interface MetricsGridProps {
  metrics: DashboardStats;
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Opportunities"
        value={metrics.opportunities}
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Pain Points"
        value={metrics.painPoints}
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="Embeddings"
        value={metrics.embeddings}
        icon={<Brain className="h-4 w-4" />}
      />
      <MetricCard
        title="Validated Opportunities"
        value={metrics.validated}
        icon={<CheckCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="Startup Ideas"
        value={metrics.ideas}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Saved Opportunities"
        value={metrics.savedCount}
        icon={<Star className="h-4 w-4" />}
      />
      <MetricCard
        title="Watchlists"
        value={metrics.watchlistsCount}
        icon={<Eye className="h-4 w-4" />}
      />
      <MetricCard
        title="Unread Alerts"
        value={metrics.unreadAlertsCount}
        icon={<Bell className="h-4 w-4" />}
      />
      <MetricCard
        title="Weekly Opportunities"
        value={metrics.weeklyOpportunities}
        icon={<CalendarDays className="h-4 w-4" />}
      />
      <MetricCard
        title="Weekly Emails"
        value={metrics.weeklyEmailsSent}
        icon={<Mail className="h-4 w-4" />}
        change="Digests delivered"
      />
      <MetricCard
        title="Evidence Records"
        value={metrics.evidenceCount}
        icon={<FileText className="h-4 w-4" />}
      />
      <MetricCard
        title="Avg Evidence Confidence"
        value={Math.round(metrics.averageEvidenceConfidence)}
        suffix="%"
        icon={<Percent className="h-4 w-4" />}
      />
      <MetricCard
        title="Forecasted Opportunities"
        value={metrics.forecastCount}
        icon={<Zap className="h-4 w-4" />}
      />
      <MetricCard
        title="Highest Forecast Score"
        value={Math.round(metrics.topForecastScore)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Avg Forecast Score"
        value={Math.round(metrics.averageForecastScore)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <MetricCard
        title="Market Intelligence Records"
        value={metrics.intelligenceCount}
        icon={<Flame className="h-4 w-4" />}
      />
      <MetricCard
        title="Highest Intelligence Score"
        value={Math.round(metrics.highestIntelligenceScore)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Avg Intelligence Score"
        value={Math.round(metrics.averageIntelligenceScore)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
    </div>
  );
}
export { MetricsGrid };