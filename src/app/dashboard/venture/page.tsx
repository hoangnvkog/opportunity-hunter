/**
 * Sprint 63: Dashboard Venture Studio Page
 * UI-4 polish — design system tokens, signal badges, EmptyState.
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTopProjectsAction, getStatisticsAction } from "@/actions/venture-studio.actions";
import { Building2, Rocket, TrendingUp, DollarSign, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Sẵn sàng";
    case "archived":
      return "Đã lưu trữ";
    default:
      return status;
  }
}

export default async function VentureStudioPage() {
  const [projectsResult, statsResult] = await Promise.all([
    getTopProjectsAction(50),
    getStatisticsAction(),
  ]);

  const projects = projectsResult.success ? projectsResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;
  const avgScore = Math.round(stats?.averageScore ?? 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Venture Studio"
          description="AI-generated startup blueprints — canvas, GTM, MVP, roadmap, checklist."
          badge={<Badge variant="ai-soft">Sprint 63</Badge>}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Tổng dự án"
            value={stats?.total ?? 0}
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            title="Sẵn sàng build"
            value={stats?.readyToBuild ?? 0}
            tone="hot"
            icon={<Rocket className="h-4 w-4" />}
          />
          <MetricCard
            title="Score TB"
            value={avgScore}
            tone={avgScore >= 75 ? "hot" : avgScore >= 60 ? "info" : "default"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg MVP Cost"
            value={stats?.averageMvpCost ?? "$0"}
            tone="info"
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Venture Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState
                icon={<Rocket className="h-5 w-5" />}
                title="Chưa có venture project"
                description="Projects được tạo cho opportunities có startup_score ≥ 75."
                action={{ label: "Xem opportunities", href: "/opportunities" }}
              />
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/venture/${project.id}`}
                    className="group block rounded-lg border p-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="flex items-center gap-2 font-medium">
                          {project.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {project.tagline}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="space-y-2 text-right shrink-0">
                        <Badge variant={statusVariant(project.status)}>
                          {statusLabel(project.status)}
                        </Badge>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            Score:
                          </span>
                          <span className="text-sm font-bold tabular-nums">
                            {project.overall_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
