import Link from "next/link";
import { Brain, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { OpportunityInsightCardData } from "@/types/opportunity-insight";

interface LatestInsightsSectionProps {
  insights: OpportunityInsightCardData[];
}

const COMPETITION_STYLES: Record<
  OpportunityInsightCardData["competition_level"],
  string
> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-rose-100 text-rose-800",
};

const URGENCY_STYLES: Record<OpportunityInsightCardData["urgency"], string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-rose-100 text-rose-800",
};

function formatConfidence(value: number): string {
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

export default function LatestInsightsSection({ insights }: LatestInsightsSectionProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Latest AI Insights
          </CardTitle>
          <Link href="/insights" className="text-sm text-primary hover:underline">
            Open insights →
          </Link>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No insights generated yet. Trigger the AI pipeline from /insights to fill this card.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Latest AI Insights
        </CardTitle>
        <Link href="/insights" className="text-sm text-primary hover:underline">
          View all →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <Link
            key={insight.id}
            href={`/opportunities/${insight.opportunity_id}`}
            className="block rounded-lg border bg-secondary p-4 transition-colors hover:bg-secondary/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{insight.opportunity_title}</h3>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {insight.summary}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COMPETITION_STYLES[insight.competition_level]}`}
              >
                Competition: {insight.competition_level}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[insight.urgency]}`}
              >
                Urgency: {insight.urgency}
              </span>
              <Badge variant="outline">{insight.market_size}</Badge>
              <Badge variant="secondary">Confidence: {formatConfidence(insight.confidence_score)}</Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
