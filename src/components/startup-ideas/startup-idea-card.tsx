import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface StartupIdeaCardProps {
  problem: string;
  solution: string;
  mvp: string;
  pricing: string;
  customer: string;
  distribution: string;
  competitors: string;
}

export default function StartupIdeaCard({
  problem,
  solution,
  mvp,
  pricing,
  customer,
  distribution,
  competitors,
}: StartupIdeaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{problem}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Customer</h4>
          <p className="text-sm">{customer}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Distribution</h4>
          <p className="text-sm">{distribution}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">Competitors</h4>
          <p className="text-sm">{competitors}</p>
        </div>
      </CardContent>
    </Card>
  );
}
export { StartupIdeaCard };