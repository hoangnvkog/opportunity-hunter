import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentOpportunities } from "@/components/RecentOpportunities";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Pagination } from "@/components/dashboard/Pagination";
import { RunPipelineButton } from "@/components/dashboard/RunPipelineButton";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
import {
  getDashboardDataAction,
  getOpportunitiesWithFiltersAction,
} from "@/actions/dashboard.actions";

interface DashboardPageProps {
  searchParams: Promise<{
    q?: string;
    minScore?: string;
    minSeverity?: string;
    minBuyingIntent?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  
  // Parse search params
  const filters = {
    q: params.q,
    minScore: params.minScore ? parseFloat(params.minScore) : undefined,
    minSeverity: params.minSeverity ? parseFloat(params.minSeverity) : undefined,
    minBuyingIntent: params.minBuyingIntent ? parseFloat(params.minBuyingIntent) : undefined,
    sort: params.sort as 'score_desc' | 'score_asc' | 'buying_intent_desc' | 'newest' | undefined,
    page: params.page ? parseInt(params.page, 10) : 1,
  };

  const [dashboardData, filteredOpportunities] = await Promise.all([
    getDashboardDataAction(),
    getOpportunitiesWithFiltersAction(filters),
  ]);

  const { metrics } = dashboardData;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
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
              <ExportCsvButton data={filteredOpportunities.data} />
            </div>
          </div>

          <DashboardMetrics metrics={metrics} />

          <DashboardFilters currentFilters={filters} />

          {filteredOpportunities.data.length > 0 ? (
            <>
              <RecentOpportunities opportunities={filteredOpportunities.data} />
              <Pagination 
                currentPage={filteredOpportunities.page}
                totalPages={filteredOpportunities.totalPages}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {filters.q ? "No matching opportunities" : "No opportunities found"}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
