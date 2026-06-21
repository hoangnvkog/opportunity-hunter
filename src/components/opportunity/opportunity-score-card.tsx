import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface OpportunityScoreCardProps {
  score: number;
  frequency: number;
  severity: number;
  buying_intent: number;
}

export function OpportunityScoreCard({
  score,
  frequency,
  severity,
  buying_intent,
}: OpportunityScoreCardProps) {
  const metrics = [
    { label: "Score", value: score, max: 100, color: "bg-primary" },
    { label: "Frequency", value: frequency, max: 100, color: "bg-blue-500" },
    { label: "Severity", value: severity, max: 1, color: "bg-orange-500" },
    { label: "Buying Intent", value: buying_intent, max: 1, color: "bg-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scores & Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <span className="text-2xl font-bold">
                  {metric.max === 1 ? metric.value.toFixed(3) : metric.value}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-2 rounded-full ${metric.color} transition-all`}
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
