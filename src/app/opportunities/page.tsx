import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OpportunityTable } from "@/components/opportunities/opportunity-table";
import { findOpportunitiesAction } from "@/actions/opportunities.actions";

export default async function OpportunitiesPage() {
  const opportunities = await findOpportunitiesAction();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
              <p className="text-muted-foreground mt-1">
                Discover and analyze startup opportunities from online discussions.
              </p>
            </div>
          </div>

          <OpportunityTable opportunities={opportunities} />
        </main>
      </div>
    </div>
  );
}
