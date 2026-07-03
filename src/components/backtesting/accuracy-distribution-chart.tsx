"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ChartDataItem {
  name: string;
  count: number;
  fill: string;
}

export function AccuracyDistributionChart({ data }: { data: ChartDataItem[] }) {
  if (!data.some((d) => d.count > 0)) {
    return (
      <p className="text-muted-foreground text-sm text-center py-10">
        No evaluated backtests yet. Run the evaluation batch to populate this chart.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
