import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { findOpportunityById, type OpportunityView } from "@/services/opportunities";
import { TrendingUp, AlertCircle, Users, Target, ArrowLeft } from "lucide-react";

interface OpportunityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityPageProps) {
  const { id } = await params;
  const opportunity = await findOpportunityById(id);

  if (!opportunity) {
    notFound();
  }

  const metrics = [
    {
      title: "Frequency",
      value: `${opportunity.frequency}/100`,
      description: "How often this pain point appears",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "Severity",
      value: `${opportunity.severity}/100`,
      description: "Impact level of the problem",
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-500",
    },
    {
      title: "Buying Intent",
      value: `${opportunity.buyingIntent}/100`,
      description: "Willingness to pay for solution",
      icon: <Target className="h-4 w-4" />,
      color: "text-green-500",
    },
    {
      title: "Overall Score",
      value: `${opportunity.score}/100`,
      description: "Weighted average of all metrics",
      icon: <Users className="h-4 w-4" />,
      color: "text-primary",
    },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{opportunity.category}</Badge>
                        <Badge>{opportunity.source}</Badge>
                      </div>
                      <CardTitle className="text-2xl mt-2">
                        {opportunity.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {opportunity.description}
                  </p>
                  
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3">Key Insights</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        This opportunity appears frequently across multiple platforms
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        High severity indicates users are actively seeking solutions
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-semibold">•</span>
                        Strong buying intent suggests viable monetization potential
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pain Points Identified</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg border bg-secondary p-3">
                        <p className="text-sm text-muted-foreground">
                          User complaint #{i}: &quot;This is extremely frustrating when...&quot;
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.title} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={metric.color}>{metric.icon}</span>
                        <span className="text-sm font-medium">{metric.title}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold">{metric.value}</span>
                        <span className="text-xs text-muted-foreground">
                          {metric.description}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full ${metric.color.replace("text-", "bg-")} transition-all`}
                          style={{ width: `${opportunity.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                    Generate Startup Idea
                  </button>
                  <button className="w-full rounded-md border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                    Export Report
                  </button>
                  <button className="w-full rounded-md border border-dashed px-4 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors">
                    Add to Watchlist
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Source Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Platform:</span>{" "}
                      <span className="font-medium">{opportunity.source}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">First Detected:</span>{" "}
                      <span className="font-medium">
                        {opportunity.createdAt?.toLocaleDateString() ?? "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updates:</span>{" "}
                      <span className="font-medium">Daily</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
