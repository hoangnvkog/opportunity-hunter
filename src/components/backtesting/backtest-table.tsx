"use client";

/**
 * Sprint 59: Backtest Table (Client Component)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download } from "lucide-react";
import type { BacktestCard } from "@/types/backtesting";
import Link from "next/link";

interface BacktestTableProps {
  initialBacktests: BacktestCard[];
}

function AccuracyBadge({ value }: { value: number | null }) {
  if (value === null) return <Badge variant="secondary">Pending</Badge>;
  if (value >= 80) return <Badge className="bg-green-100 text-green-800">{value.toFixed(1)}%</Badge>;
  if (value >= 60) return <Badge className="bg-blue-100 text-blue-800">{value.toFixed(1)}%</Badge>;
  if (value >= 40) return <Badge className="bg-yellow-100 text-yellow-800">{value.toFixed(1)}%</Badge>;
  return <Badge className="bg-red-100 text-red-800">{value.toFixed(1)}%</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "evaluated":
      return <Badge className="bg-green-100 text-green-800">Evaluated</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    case "stale":
      return <Badge className="bg-gray-100 text-gray-800">Stale</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-muted-foreground">—</span>;
  const abs = Math.abs(delta);
  if (abs <= 5) return <span className="text-green-700 font-medium">▲ {delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>;
  if (abs <= 15) return <span className="text-yellow-600 font-medium">▲ {delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>;
  return <span className="text-red-600 font-medium">▲ {delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>;
}

export function BacktestTable({ initialBacktests }: BacktestTableProps) {
  const [sortOrder] = useState<"asc" | "desc">("desc");

  const sorted = [...initialBacktests].sort((a, b) => {
    const diff = new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime();
    return sortOrder === "desc" ? diff : -diff;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Backtest Records ({initialBacktests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opportunity</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Predicted</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actual</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Delta</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Accuracy</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Eval Date</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No backtest records yet. Run batch evaluation to generate predictions.
                  </td>
                </tr>
              ) : (
                sorted.map((bt) => (
                  <tr key={bt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-[200px] truncate">{bt.opportunity_title}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {bt.opportunity_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {bt.predicted_score.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {bt.actual_score !== null ? bt.actual_score.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeltaIndicator delta={bt.prediction_delta} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AccuracyBadge value={bt.accuracy} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={bt.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                      {bt.evaluation_date}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={`/dashboard/backtests/${bt.id}`}
                          className="text-muted-foreground hover:text-foreground"
                          title="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a
                          href={`/api/backtests/${bt.id}/export?format=json`}
                          className="text-muted-foreground hover:text-foreground"
                          title="Export JSON"
                          download
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/opportunities/${bt.opportunity_id}`}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          → Opp
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}