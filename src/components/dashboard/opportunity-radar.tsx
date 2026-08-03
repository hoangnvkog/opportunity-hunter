import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, recommendationVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Target, ArrowRight } from "lucide-react";
import type { OpportunityCardData } from "@/types/dashboard";

interface OpportunityRadarProps {
  opportunities: OpportunityCardData[];
  limit?: number;
}

/**
 * Top opportunities ordered by score. Each row shows key signals (severity,
 * buying intent, frequency, recency) and a recommendation badge for at-a-glance
 * scanning on the dashboard.
 */
export function OpportunityRadar({
  opportunities,
  limit = 5,
}: OpportunityRadarProps) {
  const top = opportunities.slice(0, limit);

  if (top.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Opportunity Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="Chưa có cơ hội nào"
            description="Chạy pipeline để AI phát hiện cơ hội mới từ các nguồn dữ liệu."
            action={{ label: "Chạy pipeline", href: "/dashboard" }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Opportunity Radar
        </CardTitle>
        <Link
          href="/opportunities"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.map((opp) => {
          const rec = scoreToRecommendation(opp.score);
          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="group flex items-center gap-4 rounded-lg border border-transparent bg-secondary/40 p-3 transition-all hover:border-border hover:bg-secondary"
            >
              <ScoreHalo score={opp.score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {opp.cluster_name}
                  </h3>
                  <Badge variant={recommendationVariant(rec)}>{rec}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {opp.cluster_description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <Stat label="Severity" value={opp.severity.toFixed(2)} />
                  <Stat label="Buying intent" value={opp.buying_intent.toFixed(2)} />
                  <Stat label="Frequency" value={opp.frequency} />
                  <Stat
                    label="Recency"
                    value={`${Math.round(opp.recency_score * 100)}%`}
                  />
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </span>
  );
}

function ScoreHalo({ score }: { score: number }) {
  const tone: "hot" | "good" | "watch" | "cold" =
    score >= 85 ? "hot" : score >= 70 ? "good" : score >= 50 ? "watch" : "cold";

  const colorMap = {
    hot: "text-signal-hot bg-signal-hot/15",
    good: "text-signal-good bg-signal-good/15",
    watch: "text-signal-watch bg-signal-watch/15",
    cold: "text-signal-cold bg-signal-cold/15",
  } as const;

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${colorMap[tone]}`}
    >
      {score}
    </div>
  );
}

/**
 * Translate raw opportunity score into a UI recommendation label.
 * Mirrors Sprint 56/58 thresholds (Strong Buy ≥ 85, Buy ≥ 70, Watch ≥ 50, else Pass).
 */
export function scoreToRecommendation(score: number): string {
  if (score >= 85) return "Strong Buy";
  if (score >= 70) return "Buy";
  if (score >= 50) return "Watch";
  return "Pass";
}