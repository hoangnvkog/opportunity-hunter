import { CategoryTrends } from "@/components/CategoryTrends";

interface CategoryTrendsSectionProps {
  trends: Array<{
    category: string;
    count: number;
  }>;
}

export function CategoryTrendsSection({ trends }: CategoryTrendsSectionProps) {
  return <CategoryTrends trends={trends} />;
}
