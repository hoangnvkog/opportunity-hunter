import { KpiCard } from "./kpi-card";
import type { DashboardMetrics as DashboardMetricsType } from "@/services/dashboard";

interface MetricsGridProps {
  metrics: DashboardMetricsType;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KpiCard
        title="Total Opportunities"
        value={metrics.totalOpportunities}
      />
      <KpiCard
        title="Validated Opportunities"
        value={metrics.validatedCount}
      />
      <KpiCard
        title="Average Score"
        value={metrics.averageScore.toFixed(1)}
      />
    </div>
  );
}
