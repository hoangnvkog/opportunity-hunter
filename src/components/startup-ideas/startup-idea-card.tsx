import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StartupIdeaCardProps {
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  clusterName: string;
  clusterDescription: string;
}

export default function StartupIdeaCard({
  problem,
  solution,
  mvp,
  pricing,
  clusterName,
  clusterDescription,
}: StartupIdeaCardProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="w-fit mb-2">{clusterName}</Badge>
        <CardTitle className="text-lg">{problem}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Context</h4>
          <p className="text-sm">{clusterDescription}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Solution</h4>
          <p className="text-sm">{solution}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">MVP</h4>
          <p className="text-sm">{mvp}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Pricing</h4>
          <p className="text-sm">{pricing}</p>
        </div>
      </CardContent>
    </Card>
  );
}
export { StartupIdeaCard };
