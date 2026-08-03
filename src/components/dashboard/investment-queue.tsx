/**
 * Investment queue — high-signal opportunities waiting for committee review.
 * Reuses OpportunityRadar's recommendation helper for badge consistency.
 */
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, recommendationVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Briefcase } from "lucide-react";
import type { OpportunityCardData } from "@/types/dashboard";
import { scoreToRecommendation } from "./opportunity-radar";

interface InvestmentQueueProps {
  opportunities: OpportunityCardData[];
  /** Minimum score to qualify for the queue. Defaults to 70 ("Buy"). */
  minScore?: number;
  limit?: number;
}

export function InvestmentQueue({
  opportunities,
  minScore = 70,
  limit = 8,
}: InvestmentQueueProps) {
  const queue = opportunities
    .filter((o) => o.score >= minScore)
    .slice(0, limit);

  if (queue.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Investment Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="Chưa có cơ hội đạt chuẩn đầu tư"
            description={`Cần ít nhất 1 cơ hội đạt điểm ${minScore}+ để vào hàng chờ committee.`}
            action={{ label: "Xem cơ hội", href: "/opportunities" }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Investment Queue
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="hot-soft">{queue.length} cơ hội</Badge>
          <Button asChild size="sm" variant="default">
            <Link href="/dashboard/committee">
              <Sparkles className="mr-1 h-4 w-4" />
              Chạy Committee
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {queue.map((opp) => {
          const rec = scoreToRecommendation(opp.score);
          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="group flex items-center gap-3 rounded-lg border bg-secondary/40 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {opp.cluster_name}
                  </h3>
                  <Badge variant={recommendationVariant(rec)}>{rec}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {opp.cluster_description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold tabular-nums">{opp.score}</p>
                <p className="text-[10px] uppercase text-muted-foreground">
                  score
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}