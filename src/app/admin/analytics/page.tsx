import { AnalyticsService } from "@/services/admin/analytics.service";
import { MetricCard } from "@/components/admin/MetricCard";
import { UsageChart } from "@/components/admin/UsageChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Activity,
  TrendingUp,
  Brain,
  Rss,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analyticsService = await AnalyticsService.create();

  const [userMetrics, pipelineMetrics, aiCost, featureUsage, activityTrends] =
    await Promise.all([
      analyticsService.getUserMetrics(),
      analyticsService.getPipelineMetrics(),
      analyticsService.getAiCostMetrics(),
      analyticsService.getFeatureUsage(),
      analyticsService.getUserActivityTrends(30),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Usage and engagement metrics</p>
      </div>

      {/* User Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={userMetrics.totalUsers}
          icon={Users}
          subtitle="All registered users"
        />
        <MetricCard
          title="DAU"
          value={userMetrics.dau}
          icon={Activity}
          subtitle="Daily Active Users"
        />
        <MetricCard
          title="WAU"
          value={userMetrics.wau}
          icon={TrendingUp}
          subtitle="Weekly Active Users"
        />
        <MetricCard
          title="MAU"
          value={userMetrics.mau}
          icon={Users}
          subtitle="Monthly Active Users"
        />
      </div>

      {/* AI Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Costs (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">
                ${aiCost.costThisMonth.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">Total Cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{aiCost.requestsMonth.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">API Requests</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(aiCost.inputTokensMonth / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">Input Tokens</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(aiCost.outputTokensMonth / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-muted-foreground">Output Tokens</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Pipeline Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineMetrics.rawPostsToday}</p>
              <p className="text-xs text-muted-foreground">Raw Posts (Today)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineMetrics.rawPostsWeek}</p>
              <p className="text-xs text-muted-foreground">Raw Posts (Week)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineMetrics.clustersTotal}</p>
              <p className="text-xs text-muted-foreground">Clusters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineMetrics.opportunitiesTotal}</p>
              <p className="text-xs text-muted-foreground">Opportunities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pipelineMetrics.startupIdeasTotal}</p>
              <p className="text-xs text-muted-foreground">Startup Ideas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          data={featureUsage.map((f) => ({ label: f.feature, value: f.count, users: f.users }))}
        />

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activityTrends.slice(-14).map((d) => (
                <div key={d.date} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.date}</span>
                  <span>
                    DAU: <strong>{d.dau}</strong> | WAU: <strong>{d.wau}</strong>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}