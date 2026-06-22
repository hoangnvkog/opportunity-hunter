import { SavedOpportunityCardData } from "@/types/saved-opportunity";
import { SavedOpportunityCard } from "./saved-opportunity-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Star } from "lucide-react";

interface SavedOpportunitiesListProps {
  opportunities: SavedOpportunityCardData[];
}

export function SavedOpportunitiesList({ opportunities }: SavedOpportunitiesListProps) {
  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={<Star className="w-12 h-12" />}
        title="No saved opportunities yet"
        description="Save opportunities you're interested in to track them here."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {opportunities.map((opportunity) => (
        <SavedOpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
