import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMockOpportunities } from "@/services/mockData";

export function RecentOpportunities() {
  const opportunities = getMockOpportunities();

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Opportunities</h2>
        <Link
          href="/opportunities"
          className="text-sm text-primary hover:underline"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.slice(0, 5).map((opportunity) => (
            <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`}>
              <div className="rounded-lg border bg-secondary p-4 transition-colors hover:bg-secondary/80">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium">{opportunity.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opportunity.description}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="secondary">{opportunity.category}</Badge>
                      <Badge>{opportunity.source}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {opportunity.score}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
