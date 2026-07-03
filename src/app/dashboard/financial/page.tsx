/**
 * Sprint 64: Financial Dashboard
 *
 * KPI cards: Projected ARR, Runway, Burn Rate, Break Even, LTV/CAC, Projected Profit
 * Model list with links to detail
 */

import Link from "next/link";
import {
  getDashboardStats,
  listModels,
} from "@/services/financial/financial.service";

function formatCurrencyValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export default async function FinancialDashboardPage() {
  const [stats, models] = await Promise.all([
    getDashboardStats(),
    listModels({ limit: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">💰 Financial Projections</h1>
        <Link
          href="/admin/financial"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          Admin
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Models" value={String(stats.totalModels)} />
        <StatCard label="Projected ARR" value={formatCurrencyValue(stats.projectedARR)} />
        <StatCard label="Runway" value={`${stats.runwayMonths.toFixed(0)} mo`} />
        <StatCard label="Burn Rate" value={formatCurrencyValue(stats.burnRate)} sub="/month" />
        <StatCard label="Break Even" value={`Mo ${stats.breakEvenMonth}`} />
        <StatCard
          label="LTV/CAC"
          value={`${stats.ltvCacRatio.toFixed(1)}x`}
        />
      </div>

      <StatCard
        label="Projected Profit (Year 5)"
        value={formatCurrencyValue(stats.projectedProfit)}
      />

      {/* Model List */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Financial Models</h2>
        </div>
        {models.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No financial models yet. Generate from the Venture Studio.
          </div>
        ) : (
          <div className="divide-y">
            {models.map((m) => (
              <Link
                key={m.id}
                href={`/dashboard/financial/${m.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{m.currency} Model</p>
                  <p className="text-xs text-muted-foreground">
                    {m.projection_years}-year projection · Created {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-blue-600 hover:underline">View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
