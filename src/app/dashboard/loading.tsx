import { SkeletonCard, SkeletonMetricGrid, SkeletonTable } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <SkeletonMetricGrid count={6} />
      <SkeletonCard rows={2} />
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}