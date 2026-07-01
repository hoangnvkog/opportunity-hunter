/**
 * Sprint 56: Investment Score Card Component
 *
 * Displays VC-style due-diligence breakdown for an opportunity:
 * - Overall score + recommendation
 * - 7-dimension score grid (TAM, Timing, Competition, Moat, Distribution, Execution, Capital)
 * - Key strengths (dimensions >= 75)
 * - Major risks (dimensions < 50)
 * - AI summary
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StartupScoreRow } from "@/types/startup-score";
import { STARTUP_SCORE_LABELS, type StartupScoreDimension } from "@/types/startup-score";
import { Star, AlertTriangle, CheckCircle2 } from "lucide-react";

interface InvestmentScoreCardProps {
  score: StartupScoreRow | null;
}

interface DimensionRow {
  key: StartupScoreDimension;
  label: string;
  value: number;
}

const DIMENSIONS: ReadonlyArray<DimensionRow> = [
  { key: "tam_score", label: STARTUP_SCORE_LABELS.tam_score, value: 0 },
  { key: "market_timing_score", label: STARTUP_SCORE_LABELS.market_timing_score, value: 0 },
  { key: "competition_score", label: STARTUP_SCORE_LABELS.competition_score, value: 0 },
  { key: "moat_score", label: STARTUP_SCORE_LABELS.moat_score, value: 0 },
  { key: "distribution_score", label: STARTUP_SCORE_LABELS.distribution_score, value: 0 },
  { key: "execution_score", label: STARTUP_SCORE_LABELS.execution_score, value: 0 },
  { key: "capital_efficiency_score", label: STARTUP_SCORE_LABELS.capital_efficiency_score, value: 0 },
];

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function getBarColor(score: number) {
  if (score >= 90) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-gray-400";
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
  if (rec.toLowerCase().includes("strong"))
    return <Badge className="bg-green-100 text-green-800">⭐ {rec}</Badge>;
  if (rec.toLowerCase().includes("watch"))
    return <Badge className="bg-yellow-100 text-yellow-800">{rec}</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">{rec}</Badge>;
}

export function InvestmentScoreCard({ score }: InvestmentScoreCardProps) {
  if (!score) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Investment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No investment score generated yet for this opportunity.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dimensions = DIMENSIONS.map((d) => ({
    ...d,
    value: score[d.key] as number,
  }));

  const strengths = dimensions.filter((d) => d.value >= 75);
  const risks = dimensions.filter((d) => d.value < 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          Investment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall + Recommendation */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(score.overall_score)}`}>
              {score.overall_score}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {score.confidence}%
            </p>
          </div>
          <div className="text-right">
            {getRecommendationBadge(score.recommendation)}
          </div>
        </div>

        {/* Dimension grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dimensions.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{d.label}</span>
                <span className={`font-bold ${getScoreColor(d.value)}`}>
                  {d.value}
                </span>
              </div>
              <div className="bg-muted rounded h-2 relative">
                <div
                  className={`${getBarColor(d.value)} h-full rounded`}
                  style={{ width: `${Math.min(100, d.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {score.summary && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-1">Summary</p>
            <p className="text-sm text-muted-foreground">{score.summary}</p>
          </div>
        )}

        {/* Strengths + Risks */}
        {(strengths.length > 0 || risks.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
            {strengths.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Key Strengths
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {strengths.map((d) => (
                    <li key={d.key}>
                      {d.label} — {d.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {risks.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  Major Risks
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {risks.map((d) => (
                    <li key={d.key}>
                      {d.label} — {d.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}