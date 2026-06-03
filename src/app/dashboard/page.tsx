import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentOpportunities } from "@/components/RecentOpportunities";
import { CategoryTrends } from "@/components/CategoryTrends";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your opportunities.
            </p>
          </div>

          <DashboardMetrics />
          
          <div className="grid gap-6 md:grid-cols-3">
            <RecentOpportunities />
            <CategoryTrends />
          </div>
        </main>
      </div>
    </div>
  );
}
