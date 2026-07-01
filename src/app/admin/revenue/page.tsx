import { RevenueService } from "@/services/admin/revenue.service";
import { MetricCard } from "@/components/admin/MetricCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const revenueService = await RevenueService.create();

  const [metrics, trends, breakdown] = await Promise.all([
    revenueService.getMetrics(),
    revenueService.getTrends(12),
    revenueService.getSubscriptionBreakdown(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue</h1>
        <p className="text-muted-foreground mt-1">Subscription revenue metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MRR"
          value={`$${metrics.mrr.toLocaleString()}`}
          icon={DollarSign}
          subtitle="Monthly Recurring Revenue"
        />
        <MetricCard
          title="ARR"
          value={`$${(metrics.arr / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          subtitle="Annual Recurring Revenue"
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics.activeSubscriptions}
          icon={CreditCard}
          subtitle={`${metrics.trialing} trialing`}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={Users}
          subtitle={`${metrics.canceledThisMonth} canceled this month`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart
          data={trends.map((t) => ({ month: t.month, mrr: t.mrr, subscriptions: t.subscriptions }))}
        />

        <Card>
          <CardHeader>
            <CardTitle>Plan Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.plan} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{b.plan}</p>
                    <p className="text-sm text-muted-foreground">{b.count} subscribers</p>
                  </div>
                  <p className="font-bold">${b.revenue.toLocaleString()}/mo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{metrics.activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{metrics.trialing}</p>
              <p className="text-xs text-muted-foreground mt-1">Trialing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{metrics.canceledThisMonth}</p>
              <p className="text-xs text-muted-foreground mt-1">Canceled (month)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{metrics.pastDue}</p>
              <p className="text-xs text-muted-foreground mt-1">Past Due</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}