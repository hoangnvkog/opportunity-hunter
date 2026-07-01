import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { OpportunityView } from "@/services/opportunities";

interface OpportunityListItemProps {
  opportunity: OpportunityView;
}

export function OpportunityListItem({ opportunity }: OpportunityListItemProps) {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="block rounded-lg border bg-secondary p-4 transition-colors hover:bg-secondary/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-base">{opportunity.title}</h3>
            <Badge variant="secondary">{opportunity.category}</Badge>
            <Badge>{opportunity.source}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {opportunity.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Frequency: {opportunity.frequency}</span>
            <span>Severity: {opportunity.severity.toFixed(2)}</span>
            <span>Buying Intent: {opportunity.buyingIntent.toFixed(2)}</span>
            {opportunity.sourceDiversity != null && (
              <span>Sources: {opportunity.sourceDiversity.toFixed(2)}</span>
            )}
            {opportunity.recencyScore != null && (
              <span>Recency: {opportunity.recencyScore.toFixed(2)}</span>
            )}
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
  );
}
