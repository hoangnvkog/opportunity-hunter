import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { OpportunityCard } from "@/components/OpportunityCard";
import type { OpportunityView } from "@/services/opportunities";

interface RecentOpportunitiesProps {
  opportunities: OpportunityView[];
}

export function RecentOpportunities({
  opportunities,
}: RecentOpportunitiesProps) {
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
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
