import { MetricCard } from "./metric-card";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
import type { DashboardMetrics as DashboardMetricsType } from "@/services/dashboard";

interface MetricsGridProps {
  metrics: DashboardMetricsType;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Opportunities"
        value={metrics.totalOpportunities}
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Validated Opportunities"
        value={metrics.validatedCount}
        icon={<AlertCircle className="h-4 w-4" />}
        change="Score ≥ 70"
      />
      <MetricCard
        title="Average Score"
        value={metrics.averageScore.toFixed(1)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
