import { AppLayout } from "@/components/layout/AppLayout";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import RecentOpportunitiesSection from "@/components/dashboard/recent-opportunities-section";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import DashboardFiltersClient from "@/components/dashboard/dashboard-filters-client";
import { RunPipelineButton } from "@/components/dashboard/RunPipelineButton";
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
          <RunPipelineButton />
        </div>
      </div>

      <MetricsGrid metrics={stats} />

      <DashboardFiltersClient
        initialOpportunities={opportunities}
        initialIdeas={ideas}
      />

      <div className="mt-8 space-y-8">
        <RecentOpportunitiesSection opportunities={opportunities} />
        <StartupIdeasSection ideas={ideas} />
      </div>
    </AppLayout>
  );
}
