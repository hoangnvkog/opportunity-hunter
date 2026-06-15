import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { OpportunityListItem } from "@/components/opportunities/opportunity-list-item";
import type { OpportunityView } from "@/services/opportunities";

interface RecentOpportunitiesSectionProps {
  opportunities: OpportunityView[];
}

export function RecentOpportunitiesSection({
  opportunities,
}: RecentOpportunitiesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent opportunities
          </p>
        ) : (
          opportunities.map((opportunity) => (
            <OpportunityListItem
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
