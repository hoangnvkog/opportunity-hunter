import { SavedOpportunityCardData } from "@/types/saved-opportunity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SaveButton } from "./save-button";
import Link from "next/link";

interface SavedOpportunityCardProps {
  opportunity: SavedOpportunityCardData;
}

export function SavedOpportunityCard({ opportunity }: SavedOpportunityCardProps) {
  const {
    opportunity_id,
    title,
    description,
    score,
    frequency,
    severity,
    buying_intent,
    cluster_name,
    saved_at,
  } = opportunity;

  const savedDate = new Date(saved_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Link href={`/opportunities/${opportunity_id}`}>
              <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                {title}
              </CardTitle>
            </Link>
            <CardDescription className="mt-1">{cluster_name}</CardDescription>
          </div>
          <SaveButton opportunityId={opportunity_id} isSaved={true} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">Score: {score.toFixed(1)}</Badge>
          <Badge variant="secondary">Frequency: {frequency.toFixed(1)}</Badge>
          <Badge variant="secondary">Severity: {severity.toFixed(1)}</Badge>
          <Badge variant="secondary">Buying Intent: {buying_intent.toFixed(1)}</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Saved on {savedDate}
        </p>
      </CardContent>
    </Card>
  );
}
