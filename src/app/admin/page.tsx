import { AnalyticsService } from "@/services/admin/analytics.service";
import { RevenueService } from "@/services/admin/revenue.service";
import { MonitoringService } from "@/services/admin/monitoring.service";
import { PipelineRunsRepository } from "@/lib/db/repositories/pipeline-runs.repository";
import { MetricCard } from "@/components/admin/MetricCard";
import { PipelineControl } from "@/components/admin/PipelineControl";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { UsageChart } from "@/components/admin/UsageChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Brain,
  Briefcase,
  AlertCircle,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [analyticsService, revenueService, monitoringService, pipelineRunsRepo] = await Promise.all([
    AnalyticsService.create(),
    RevenueService.create(),
    MonitoringService.create(),
    PipelineRunsRepository.create(),
  ]);

  const [summary, revenueTrends, featureUsage, health, latestRun] = await Promise.all([
    analyticsService.getDashboardSummary(),
    revenueService.getTrends(6),
    analyticsService.getFeatureUsage(),
    monitoringService.getSystemHealth(),
    pipelineRunsRepo.latest(),
  ]);

  const pipelineInitialData = latestRun
    ? {
        lastRun: latestRun.finished_at || latestRun.started_at,
        lastStatus: latestRun.status,
        lastDurationMs: latestRun.duration_ms,
        rawPosts: latestRun.raw_posts,
        painPoints: latestRun.pain_points,
        clusters: latestRun.clusters,
        opportunities: latestRun.opportunities,
        ideas: latestRun.startup_ideas,
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and key metrics
        </p>
      </div>

      {/* Health Banner */}
      {health.status !== "healthy" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              System {health.status}
            </p>
            <p className="text-sm text-yellow-700">
              {health.errorsLast24h} errors, {health.warningsLast24h} warnings in last 24h
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={summary.totalUsers}
          icon={Users}
          subtitle={`${summary.totalSubscriptions} subscriptions`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${summary.mrr.toLocaleString()}`}
          icon={DollarSign}
          subtitle={`$${(summary.arr / 1000).toFixed(1)}k ARR`}
        />
        <MetricCard
          title="AI Cost (Month)"
          value={`$${summary.aiCostThisMonth.toFixed(4)}`}
          icon={Brain}
          subtitle="OpenAI + Gemini usage"
        />
        <MetricCard
          title="Opportunities"
          value={summary.opportunitiesTotal}
          icon={Briefcase}
          subtitle="Total generated"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevenueChart data={revenueTrends} />
        <UsageChart data={featureUsage.map(f => ({ label: f.feature, value: f.count, users: f.users }))} />
        <PipelineControl initialRun={pipelineInitialData} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span
                className={`text-sm font-medium capitalize ${
                  health.status === "healthy"
                    ? "text-green-600"
                    : health.status === "degraded"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {health.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Errors (24h)</span>
              <span className="text-sm font-medium">{health.errorsLast24h}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Warnings (24h)</span>
              <span className="text-sm font-medium">{health.warningsLast24h}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}