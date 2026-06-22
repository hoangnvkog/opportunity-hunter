import { AppLayout } from "@/components/layout/AppLayout";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { ClusterMetrics } from "@/components/dashboard/cluster-metrics";
import { SchedulerStatusCard } from "@/components/dashboard/scheduler-status-card";
import RecentOpportunitiesSection from "@/components/dashboard/recent-opportunities-section";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import DashboardFiltersClient from "@/components/dashboard/dashboard-filters-client";
import { RunPipelineClient } from "@/components/dashboard/RunPipelineClient";
import { PipelineHistoryClient } from "@/components/dashboard/pipeline-history-client";
import { SourcesList } from "@/components/dashboard/SourcesList";
import LatestInsightsSection from "@/components/insights/LatestInsightsSection";
import {
  getFilteredOpportunitiesAction,
  getFilteredStartupIdeasAction,
} from "@/actions/dashboard.actions";
import { getDashboardStats } from "@/services/dashboard/dashboard.service";
import { getUser } from "@/lib/auth/server";
import { getProfile } from "@/actions/profile.actions";
import { listRecentInsightsAction } from "@/actions/insights.actions";

export default async function DashboardPage() {
  const [, opportunitiesResult, ideasResult, user, profile] = await Promise.all([
    undefined,
    getFilteredOpportunitiesAction({ limit: 10 }),
    getFilteredStartupIdeasAction({ limit: 10 }),
    getUser(),
    getProfile(),
  ]);

  const stats = await getDashboardStats(user?.id);

  const opportunities = opportunitiesResult.success ? opportunitiesResult.data || [] : [];
  const ideas = ideasResult.success ? ideasResult.data || [] : [];
  const recentInsights = await listRecentInsightsAction(5);

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{profile?.name ? `, ${profile.name}` : ""}! Here&apos;s what&apos;s happening with your
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
          <LatestInsightsSection insights={recentInsights} />
          <StartupIdeasSection ideas={ideas} />
          <PipelineHistoryClient />
        </div>
        <div className="space-y-8">
          <SchedulerStatusCard />
          <SourcesList />
        </div>
      </div>
    </AppLayout>
  );
}
