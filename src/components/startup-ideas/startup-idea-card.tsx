import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StartupIdeaCardProps {
  id: string;
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  clusterName: string;
  clusterDescription: string;
}

export default function StartupIdeaCard({
  id,
  problem,
  solution,
  mvp,
  pricing,
  clusterName,
  clusterDescription,
}: StartupIdeaCardProps) {
  return (
    <Link href={`/ideas/${id}`} className="block transition-opacity hover:opacity-80">
      <Card className="h-full cursor-pointer">
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
    </Link>
  );
}
export { StartupIdeaCard };
