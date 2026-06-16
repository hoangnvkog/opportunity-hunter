import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { findOpportunitiesAction } from "@/actions/opportunities.actions";
import { OpportunityCard } from "@/components/OpportunityCard";

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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">All Opportunities</h2>
                <div className="flex gap-2">
                  <select className="rounded-md border bg-secondary px-3 py-1 text-sm outline-none focus:border-primary">
                    <option value="score">Sort by Score</option>
                    <option value="frequency">Sort by Frequency</option>
                    <option value="date">Sort by Date</option>
                  </select>
                  <select className="rounded-md border bg-secondary px-3 py-1 text-sm outline-none focus:border-primary">
                    <option value="all">All Categories</option>
                    <option value="Customer Service">Customer Service</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Marketing">Marketing</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
