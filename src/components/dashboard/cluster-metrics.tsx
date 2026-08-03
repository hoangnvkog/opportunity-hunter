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
          <CardTitle className="text-sm font-medium">Tổng cụm</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clusterCount}</div>
          <p className="text-xs text-muted-foreground">
            Cụm ngữ nghĩa đã hình thành
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kích thước cụm TB</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {averageClusterSize.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            Điểm đau trên mỗi cụm
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cụm lớn nhất</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{largestClusterSize}</div>
          <p className="text-xs text-muted-foreground">
            Số điểm đau cao nhất trong một cụm
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
