import Link from "next/link";
import { Brain, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { OpportunityInsightCardData } from "@/types/opportunity-insight";

interface AIAnalysisCardProps {
  insight: OpportunityInsightCardData | null;
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

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="block text-sm text-foreground">{value}</span>
    </div>
  );
}

export function AIAnalysisCard({ insight }: AIAnalysisCardProps) {
  if (!insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No AI insight has been generated for this opportunity yet. Trigger
            one from the{" "}
            <Link href="/insights" className="text-primary underline-offset-4 hover:underline">
              insights page
              <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" />
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  const channels = insight.recommended_channels
    .split(/,\s*/)
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </div>
        <Badge variant="outline">Confidence {formatConfidence(insight.confidence_score)}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </span>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {insight.summary}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Row label="Market Size" value={insight.market_size} />
          <div className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Competition Level
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COMPETITION_STYLES[insight.competition_level]}`}
            >
              {insight.competition_level}
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Urgency
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[insight.urgency]}`}
            >
              {insight.urgency}
            </span>
          </div>

          <div className="space-y-1 md:col-span-2 lg:col-span-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended Channels
            </span>
            <div className="flex flex-wrap gap-1">
              {channels.map((channel) => (
                <Badge key={channel} variant="secondary">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recommended MVP
            </span>
            <p className="text-sm text-foreground">{insight.recommended_mvp}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
