import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { findOpportunities } from "@/services/opportunities";

export default async function OpportunitiesPage() {
  const opportunities = await findOpportunities();

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
                  <Link
                    key={opportunity.id}
                    href={`/opportunities/${opportunity.id}`}
                    className="block rounded-lg border bg-secondary p-4 transition-colors hover:bg-secondary/80"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-base">{opportunity.title}</h3>
                          <Badge variant="secondary">{opportunity.category}</Badge>
                          <Badge>{opportunity.source}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Frequency: {opportunity.frequency}</span>
                          <span>Severity: {opportunity.severity}</span>
                          <span>Buying Intent: {opportunity.buyingIntent}</span>
                          <span className="ml-auto">
                            Created: {opportunity.createdAt?.toLocaleDateString() ?? "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">
                          {opportunity.score}
                        </div>
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
