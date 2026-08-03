import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OpportunityCardData } from "@/types/dashboard";

interface RecentOpportunitiesSectionProps {
  opportunities: OpportunityCardData[];
}

export default function RecentOpportunitiesSection({ opportunities }: RecentOpportunitiesSectionProps) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cơ hội gần đây</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chưa tìm thấy cơ hội nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cơ hội gần đây</CardTitle>
        <Link
          href="/opportunities"
          className="text-sm text-primary hover:underline"
        >
          Xem tất cả →
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.map((opportunity) => (
          <Link
            key={opportunity.id}
            href={`/opportunities/${opportunity.id}`}
            className="block rounded-lg border bg-secondary p-4 transition-colors hover:bg-secondary/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-base">{opportunity.cluster_name}</h3>
                  <Badge variant="secondary">{opportunity.cluster_name}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opportunity.cluster_description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Điểm: {opportunity.score}</span>
                  <span>Tần suất: {opportunity.frequency}</span>
                  <span>Mức đau: {opportunity.severity.toFixed(2)}</span>
                  <span>Ý định mua: {opportunity.buying_intent.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Nguồn: {(opportunity.source_diversity * 5).toFixed(0)}</span>
                  <span>Độ mới: {(opportunity.recency_score * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">
                  {opportunity.score}
                </div>
                <div className="text-xs text-muted-foreground">Điểm</div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
export { RecentOpportunitiesSection };
