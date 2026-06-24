import { MetricCard } from "./metric-card";
import { TrendingUp, AlertCircle, Target, Brain, Star, Eye, Bell, Mail, CalendarDays, CheckCircle } from "lucide-react";
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
    </div>
  );
}
export { MetricsGrid };