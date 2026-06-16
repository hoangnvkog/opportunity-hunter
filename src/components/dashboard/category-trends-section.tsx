import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface CategoryTrendsSectionProps {
  trends: Array<{
    category: string;
    count: number;
  }>;
}

export default function CategoryTrendsSection({ trends }: CategoryTrendsSectionProps) {
  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trends by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trends data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends by Category</CardTitle>
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
                    style={{ width: `${Math.min(width, 100)}%` }}
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
export { CategoryTrendsSection };