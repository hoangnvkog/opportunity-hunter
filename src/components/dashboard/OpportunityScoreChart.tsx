"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OpportunityView } from "@/services/opportunities";

interface OpportunityScoreChartProps {
  data: OpportunityView[];
}

export function OpportunityScoreChart({ data }: OpportunityScoreChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Opportunities by Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .slice(0, 10)
    .map((opp) => ({
      name: opp.title.length > 20 ? opp.title.substring(0, 20) + "..." : opp.title,
      score: opp.score,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Opportunities by Score</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
