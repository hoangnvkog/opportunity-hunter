import { AppLayout } from "@/components/layout/AppLayout";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ClusterMetrics } from "@/components/dashboard/cluster-metrics";
import RecentOpportunitiesSection from "@/components/dashboard/recent-opportunities-section";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import DashboardFiltersClient from "@/components/dashboard/dashboard-filters-client";
import { RunPipelineClient } from "@/components/dashboard/RunPipelineClient";
import { PipelineHistoryClient } from "@/components/dashboard/pipeline-history-client";
import { SourcesList } from "@/components/dashboard/SourcesList";
import {
  getFilteredOpportunitiesAction,
  getFilteredStartupIdeasAction,
} from "@/actions/dashboard.actions";
import { getDashboardStats } from "@/services/dashboard/dashboard.service";

export default async function DashboardPage() {
  const [stats, opportunitiesResult, ideasResult] = await Promise.all([
    getDashboardStats(),
    getFilteredOpportunitiesAction({ limit: 10 }),
    getFilteredStartupIdeasAction({ limit: 10 }),
  ]);

  const opportunities = opportunitiesResult.success ? opportunitiesResult.data || [] : [];
  const ideas = ideasResult.success ? ideasResult.data || [] : [];

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your
            opportunities.
          </p>
        </div>
        <div className="flex gap-2">
          <RunPipelineClient />
        </div>
      </div>

      <MetricsGrid metrics={stats} />

      <ClusterMetrics
        clusterCount={stats.clusters}
        averageClusterSize={stats.averageClusterSize}
        largestClusterSize={stats.largestClusterSize}
      />

      <DashboardFiltersClient
        initialOpportunities={opportunities}
        initialIdeas={ideas}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <RecentOpportunitiesSection opportunities={opportunities} />
          <StartupIdeasSection ideas={ideas} />
          <PipelineHistoryClient />
        </div>
        <div>
          <SourcesList />
        </div>
      </div>
    </AppLayout>
  );
}
