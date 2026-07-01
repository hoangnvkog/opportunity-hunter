import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Hash, TrendingUp } from "lucide-react";

interface ClusterMetricsProps {
  clusterCount: number;
  averageClusterSize: number;
  largestClusterSize: number;
}

export function ClusterMetrics({
  clusterCount,
  averageClusterSize,
  largestClusterSize,
}: ClusterMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clusters</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clusterCount}</div>
          <p className="text-xs text-muted-foreground">
            Semantic clusters formed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Cluster Size</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageClusterSize.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pain points per cluster
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Largest Cluster</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{largestClusterSize}</div>
          <p className="text-xs text-muted-foreground">
            Max pain points in one cluster
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
