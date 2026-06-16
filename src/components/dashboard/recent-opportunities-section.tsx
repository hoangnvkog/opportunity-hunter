import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { OpportunityView } from "@/services/opportunities";

interface RecentOpportunitiesSectionProps {
  opportunities: OpportunityView[];
}

export default function RecentOpportunitiesSection({ opportunities }: RecentOpportunitiesSectionProps) {
  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Opportunities</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No opportunities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Opportunities</CardTitle>
        <Link
          href="/opportunities"
          className="text-sm text-primary hover:underline"
        >
          View all →
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
                  <h3 className="font-medium text-base">{opportunity.title}</h3>
                  <Badge variant="secondary">{opportunity.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opportunity.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Score: {opportunity.score}</span>
                  <span>Severity: {opportunity.severity}</span>
                  <span>Buying Intent: {opportunity.buyingIntent}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-primary">
                  {opportunity.score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
export { RecentOpportunitiesSection };