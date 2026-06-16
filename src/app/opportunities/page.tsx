import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunityTable } from "@/components/opportunities/opportunity-table";
import { findOpportunitiesAction } from "@/actions/opportunities.actions";

export default async function OpportunitiesPage() {
  const opportunities = await findOpportunitiesAction();

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Discover and analyze startup opportunities from online discussions.
          </p>
        </div>
      </div>

      <OpportunityTable opportunities={opportunities} />
    </AppLayout>
  );
}