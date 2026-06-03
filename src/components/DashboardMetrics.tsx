import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, AlertCircle, Users, Target } from "lucide-react";

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

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Opportunities"
        value="156"
        change="+12% from last week"
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Pain Points Identified"
        value="2,341"
        change="+23% from last week"
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="High Priority"
        value="47"
        change="+8 from yesterday"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Categories Tracked"
        value="12"
        change="No change"
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
