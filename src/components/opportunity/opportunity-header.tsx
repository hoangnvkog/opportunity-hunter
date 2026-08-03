/**
 * Header for the Opportunity Dossier — title, description, recommendation
 * pill, and primary action buttons.
 */
import Link from "next/link";
import { Star, Bookmark, Wallet, FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, recommendationVariant } from "@/components/ui/badge";
import type { OpportunityDetail } from "@/types/opportunity-detail";

interface OpportunityHeaderProps {
  detail: OpportunityDetail;
  recommendation: string;
  memoId?: string | null;
}

export function OpportunityHeader({
  detail,
  recommendation,
  memoId,
}: OpportunityHeaderProps) {
  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="ai-soft">Investment Dossier</Badge>
              <Badge variant={recommendationVariant(recommendation)}>
                {recommendation}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {detail.cluster_name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              {detail.cluster_description}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
              <Stat label="Score" value={detail.score} />
              <Stat label="Frequency" value={detail.frequency} />
              <Stat
                label="Severity"
                value={detail.severity.toFixed(2)}
              />
              <Stat
                label="Buying intent"
                value={detail.buying_intent.toFixed(2)}
              />
              <Stat
                label="Startup ideas"
                value={detail.startup_ideas_count}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/opportunities/${detail.id}?action=save`}>
                <Bookmark className="mr-1 h-4 w-4" />
                Lưu
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/watchlists`}>
                <Star className="mr-1 h-4 w-4" />
                Watchlist
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/portfolio?opportunity=${detail.id}`}>
                <Wallet className="mr-1 h-4 w-4" />
                Portfolio
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/dashboard/committee?opportunity=${detail.id}`}>
                <Sparkles className="mr-1 h-4 w-4" />
                Committee
              </Link>
            </Button>
            {memoId && (
              <Button asChild size="sm" variant="default">
                <Link href={`/dashboard/memos?memo=${memoId}`}>
                  <FileText className="mr-1 h-4 w-4" />
                  Mở memo
                </Link>
              </Button>
            )}
          </div>
        </div>
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
