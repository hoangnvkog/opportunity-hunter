/**
 * Sprint 59: Backtest Section Component
 *
 * Displays backtest records for a specific opportunity on the detail page.
 * Shows predicted score, actual score, accuracy, and notes.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getOpportunityBacktests } from "@/services/backtesting/backtesting.service";
import { getBacktestById } from "@/services/backtesting/backtesting.service";
import { Target, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

interface BacktestSectionProps {
  opportunityId: string;
}

function AccuracyBadge({ value }: { value: number | null }) {
  if (value === null) return <Badge variant="secondary">Pending</Badge>;
  if (value >= 80) return <Badge className="bg-green-100 text-green-800">{value.toFixed(1)}%</Badge>;
  if (value >= 60) return <Badge className="bg-blue-100 text-blue-800">{value.toFixed(1)}%</Badge>;
  if (value >= 40) return <Badge className="bg-yellow-100 text-yellow-800">{value.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-800">{value.toFixed(1)}%</Badge>;
}

function DeltaLabel({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground">—</span>;
  const sign = delta > 0 ? "+" : "";
  const cls = Math.abs(delta) <= 10 ? "text-green-700" : Math.abs(delta) <= 20 ? "text-yellow-600" : "text-red-600";
  return <span className={`font-mono font-medium ${cls}`}>{sign}{delta.toFixed(1)}</span>;
}

export async function BacktestSection({ opportunityId }: BacktestSectionProps) {
  const backtests = await getOpportunityBacktests(opportunityId, 10);

  const latestBacktest = backtests.length > 0 ? backtests[0] : null;
  const overallAccuracy = latestBacktest?.accuracy != null
    ? Number(latestBacktest.accuracy)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Backtesting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary if we have evaluations */}
        {overallAccuracy !== null && (
          <div className="flex items-center gap-6 rounded-md border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              {overallAccuracy >= 60 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="text-2xl font-bold">{overallAccuracy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Latest accuracy</p>
              </div>
            </div>
            {latestBacktest && (
              <div className="flex items-center gap-2 border-l pl-4">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Predicted {latestBacktest.predicted_score} → Actual {latestBacktest.actual_score ?? "?"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Delta: <DeltaLabel delta={latestBacktest.prediction_delta !== null ? Number(latestBacktest.prediction_delta) : null} />
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {backtests.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No backtest records for this opportunity yet.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">History ({backtests.length})</p>
            <div className="space-y-2">
              {backtests.map((bt) => (
                <div key={bt.id} className="flex items-center gap-4 rounded border p-3 text-sm">
                  <div className="min-w-[80px]">
                    <p className="text-xs text-muted-foreground">{bt.evaluation_date}</p>
                    <p className="text-xs font-mono text-muted-foreground">{bt.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Predicted</p>
                      <p className="font-mono font-medium">{Number(bt.predicted_score).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-mono font-medium">
                        {bt.actual_score !== null ? Number(bt.actual_score).toFixed(1) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <AccuracyBadge value={bt.accuracy !== null ? Number(bt.accuracy) : null} />
                    </div>
                  </div>
                  {bt.notes && (
                    <div className="flex-1 border-l pl-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{bt.notes}</p>
                    </div>
                  )}
                  <a
                    href={`/api/backtests/${bt.id}/export?format=json`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Export"
                    download
                  >
                    ↓
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}