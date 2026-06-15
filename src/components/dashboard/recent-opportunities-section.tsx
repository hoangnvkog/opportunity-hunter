import { RecentOpportunities } from "@/components/RecentOpportunities";
import type { OpportunityView } from "@/services/opportunities";

interface RecentOpportunitiesSectionProps {
  opportunities: OpportunityView[];
}

export function RecentOpportunitiesSection({
  opportunities,
}: RecentOpportunitiesSectionProps) {
  return <RecentOpportunities opportunities={opportunities} />;
}
