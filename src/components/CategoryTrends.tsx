import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface CategoryTrendsProps {
  trends: Array<{ category: string; count: number }>;
}

export function CategoryTrends({ trends }: CategoryTrendsProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Trends by Category</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map(({ category, count }) => {
            const maxCount = 30;
            const width = (count / maxCount) * 100;

            return (
              <div key={category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{category}</span>
                  <span className="text-muted-foreground">
                    {count} opportunities
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
