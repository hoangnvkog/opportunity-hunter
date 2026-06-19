import { MetricCard } from "./metric-card";
import { TrendingUp, AlertCircle, Target } from "lucide-react";
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
        title="Startup Ideas"
        value={metrics.ideas}
        icon={<TrendingUp className="h-4 w-4" />}
      />
    </div>
  );
}
export { MetricsGrid };