/**
 * Final decision panel — single canonical block summarizing the committee
 * verdict (decision, overall score, confidence, majority/minority split).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, recommendationVariant } from "@/components/ui/badge";
import { Sparkles, Scale, TrendingUp } from "lucide-react";

export interface CommitteeFinalDecisionProps {
  decision: string; // "Strong Buy" | "Buy" | "Watch" | "Reject"
  overallScore: number;
  confidence: number;
  majorityVote?: string;
  minorityVote?: string;
  summary?: string;
}

export function CommitteeFinalDecision({
  decision,
  overallScore,
  confidence,
  majorityVote,
  minorityVote,
  summary,
}: CommitteeFinalDecisionProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Quyết định cuối cùng</CardTitle>
        </div>
        <Badge variant={recommendationVariant(decision)}>{decision}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Overall Score"
            value={Math.round(overallScore)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <Stat label="Confidence" value={`${Math.round(confidence)}%`} />
          <Stat
            label="Majority"
            value={majorityVote ?? "—"}
            sub={minorityVote && minorityVote !== majorityVote ? `Minority: ${minorityVote}` : undefined}
            icon={<Scale className="h-3.5 w-3.5" />}
          />
        </div>
        {summary && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
