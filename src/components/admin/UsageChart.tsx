"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface UsageChartProps {
  data: Array<{
    label: string;
    value: number;
    users?: number;
  }>;
}

export function UsageChart({ data }: UsageChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((d) => {
            const pct = (d.value / maxValue) * 100;
            return (
              <div key={d.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="text-muted-foreground">
                    {d.value.toLocaleString()}
                    {d.users !== undefined && (
                      <span className="ml-1 text-xs">
                        ({d.users} users)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}