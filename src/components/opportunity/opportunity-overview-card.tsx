import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface OpportunityOverviewCardProps {
  cluster_name: string;
  cluster_description: string;
  created_at?: string;
  startup_ideas_count: number;
}

export function OpportunityOverviewCard({
  cluster_name,
  cluster_description,
  created_at,
  startup_ideas_count,
}: OpportunityOverviewCardProps) {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">{cluster_name}</h3>
          <p className="text-muted-foreground leading-relaxed">
            {cluster_description}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="flex-1 min-w-[150px]">
            <div className="text-sm text-muted-foreground mb-1">Created</div>
            <div className="font-medium">{formatDate(created_at)}</div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="text-sm text-muted-foreground mb-1">
              Startup Ideas
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{startup_ideas_count}</span>
              <Badge variant="secondary">
                {startup_ideas_count === 1 ? "idea" : "ideas"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
