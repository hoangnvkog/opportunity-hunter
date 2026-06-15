import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface OpportunitySummaryCardProps {
  score: number;
  frequency: number;
  severity: number;
  buyingIntent: number;
}

export function OpportunitySummaryCard({
  score,
  frequency,
  severity,
  buyingIntent,
}: OpportunitySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-2xl font-bold">{score}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Frequency</div>
            <div className="text-2xl font-bold">{frequency}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Severity</div>
            <div className="text-2xl font-bold">{severity}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Buying Intent</div>
            <div className="text-2xl font-bold">{buyingIntent}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
