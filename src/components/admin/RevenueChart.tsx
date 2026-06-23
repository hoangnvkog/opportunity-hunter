"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface RevenueChartProps {
  data: Array<{
    month: string;
    mrr: number;
    subscriptions: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const maxMrr = Math.max(...data.map((d) => d.mrr), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>MRR Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((d) => {
            const pct = (d.mrr / maxMrr) * 100;
            return (
              <div key={d.month} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{d.month}</span>
                  <span className="text-muted-foreground">
                    ${d.mrr.toLocaleString()} MRR
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.subscriptions} subscriptions
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}