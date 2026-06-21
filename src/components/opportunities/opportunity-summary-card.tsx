import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface OpportunitySummaryCardProps {
  score: number;
  frequency: number;
  severity: number;
  buyingIntent: number;
  sourceDiversity?: number | null;
  recency?: number | null;
}

export default function OpportunitySummaryCard({
  score,
  frequency,
  severity,
  buyingIntent,
  sourceDiversity,
  recency,
}: OpportunitySummaryCardProps) {
  const metrics = [
    { label: "Score", value: score, max: 100 },
    { label: "Frequency", value: frequency, max: 100 },
    { label: "Severity", value: severity, max: 1 },
    { label: "Buying Intent", value: buyingIntent, max: 1 },
    { label: "Source Diversity", value: sourceDiversity ?? 0, max: 1 },
    { label: "Recency", value: recency ?? 0, max: 1 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <div className="text-2xl font-bold">
                {metric.max === 100
                  ? metric.value
                  : metric.value.toFixed(2)}
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
export { OpportunitySummaryCard };
