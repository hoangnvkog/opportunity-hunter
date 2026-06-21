import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { StartupIdeaDetail } from "@/types/startup-idea-detail";

interface IdeaOverviewCardProps {
  idea: StartupIdeaDetail;
}

export function IdeaOverviewCard({ idea }: IdeaOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Problem
          </h3>
          <p className="text-base leading-relaxed">{idea.problem}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Solution
          </h3>
          <p className="text-base leading-relaxed">{idea.solution}</p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Opportunity
          </h3>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Cluster: </span>
              <span>{idea.cluster_name}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {idea.cluster_description}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <span className="text-xs text-muted-foreground">Score: </span>
                <span className="font-semibold">{idea.opportunity_score}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Created: </span>
                <span className="text-sm">
                  {new Date(idea.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
