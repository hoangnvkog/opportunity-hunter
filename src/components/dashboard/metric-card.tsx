import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
}

export function MetricCard({ title, value, icon, change }: MetricCardProps) {
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
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        )}
      </CardContent>
    </Card>
  );
}
