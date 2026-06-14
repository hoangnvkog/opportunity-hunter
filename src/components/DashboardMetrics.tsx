import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, AlertCircle, Users, Target } from "lucide-react";
import type { DashboardMetrics as DashboardMetricsType } from "@/services/dashboard";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  metrics: DashboardMetricsType;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Opportunities"
        value={metrics.totalOpportunities}
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Average Score"
        value={metrics.averageScore}
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="Validated"
        value={metrics.validatedCount}
        change="Score ≥ 70"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Top Category"
        value={metrics.topCategory}
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
