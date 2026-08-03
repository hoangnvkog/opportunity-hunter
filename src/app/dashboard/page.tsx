export const dynamic = "force-dynamic";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

import { HeroIntelligenceStrip } from "@/components/dashboard/hero-intelligence-strip";
import { KpiGroup, SpotlightStats } from "@/components/dashboard/kpi-group";
import { OpportunityRadar } from "@/components/dashboard/opportunity-radar";
import { SignalHeatmap } from "@/components/dashboard/signal-heatmap";
import { PipelineTimeline } from "@/components/dashboard/pipeline-timeline";
import { InvestmentQueue } from "@/components/dashboard/investment-queue";

import { ClusterMetrics } from "@/components/dashboard/cluster-metrics";
import RecentOpportunitiesSection from "@/components/dashboard/recent-opportunities-section";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import DashboardFiltersClient from "@/components/dashboard/dashboard-filters-client";
import { PipelineHistoryClient } from "@/components/dashboard/pipeline-history-client";
import { SourcesList } from "@/components/dashboard/SourcesList";
import LatestInsightsSection from "@/components/insights/LatestInsightsSection";

import {
  getFilteredOpportunitiesAction,
  getFilteredStartupIdeasAction,
} from "@/actions/dashboard.actions";
import {
  getDashboardTopOpportunitiesAction,
  getDashboardLatestPipelineRunAction,
  getDashboardCategoryTrendsAction,
} from "@/app/dashboard/actions/command-center.actions";
import { getDashboardStats } from "@/services/dashboard/dashboard.service";
import { getUser } from "@/lib/auth/server";
import { getProfile } from "@/actions/profile.actions";
import { listRecentInsightsAction } from "@/actions/insights.actions";

export default async function DashboardPage() {
  const user = await getUser();
  const profile = await getProfile();

  const [
    opportunitiesResult,
    ideasResult,
    radarResult,
    pipelineRunResult,
    categoryTrendsResult,
    stats,
    recentInsights,
  ] = await Promise.all([
    getFilteredOpportunitiesAction({ limit: 10 }),
    getFilteredStartupIdeasAction({ limit: 10 }),
    getDashboardTopOpportunitiesAction(5),
    getDashboardLatestPipelineRunAction(),
    getDashboardCategoryTrendsAction(6),
    getDashboardStats(user?.id),
    listRecentInsightsAction(5),
  ]);

  const opportunities = opportunitiesResult.success
    ? opportunitiesResult.data || []
    : [];
  const ideas = ideasResult.success ? ideasResult.data || [] : [];
  const topOpportunities = radarResult.success
    ? radarResult.data || []
    : opportunities;
  const latestRun = pipelineRunResult.success ? (pipelineRunResult.data ?? null) : null;
  const categoryTrends = categoryTrendsResult.success
    ? categoryTrendsResult.data || []
    : [];

  const topScore = topOpportunities[0]?.score ?? 0;

  return (
    <AppLayout>
      <PageHeader
        title="Bảng điều khiển"
        description={
          profile?.name
            ? `Chào mừng ${profile.name} quay lại — đây là tình hình các cơ hội hiện tại.`
            : "Đây là tình hình các cơ hội hiện tại."
        }
        badge={<Badge variant="ai-soft">Command Center</Badge>}
      />

      <HeroIntelligenceStrip
        weeklyOpportunities={stats.weeklyOpportunities}
        validatedCount={stats.validated}
        topScore={topScore}
      />

      <SpotlightStats stats={stats} />

      <KpiGroup stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <OpportunityRadar opportunities={topOpportunities} limit={5} />
          <PipelineTimeline run={latestRun} />
          <RecentOpportunitiesSection opportunities={opportunities} />
        </div>
        <div className="space-y-6">
          <InvestmentQueue opportunities={opportunities} limit={8} />
          <SignalHeatmap trends={categoryTrends} />
          <ClusterMetrics
            clusterCount={stats.clusters}
            averageClusterSize={stats.averageClusterSize}
            largestClusterSize={stats.largestClusterSize}
          />
          <SourcesList />
        </div>
      </div>

      <DashboardFiltersClient
        initialOpportunities={opportunities}
        initialIdeas={ideas}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <LatestInsightsSection insights={recentInsights} />
          <StartupIdeasSection ideas={ideas} />
        </div>
        <div className="space-y-6">
          <PipelineHistoryClient />
        </div>
      </div>
    </AppLayout>
  );
}