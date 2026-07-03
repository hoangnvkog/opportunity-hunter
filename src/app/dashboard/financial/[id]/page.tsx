/**
 * Sprint 64: Financial Model Detail Page
 *
 * Full detail: projections table, unit economics, break-even, risks, investment recommendation
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelDetail, getInvestmentRecommendation, getRiskAssessment } from "@/services/financial/financial.service";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default async function FinancialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getModelDetail(id);
  if (!detail) notFound();

  const { model, projections, unitEconomics: ue, breakEven: be } = detail;
  const investment = getInvestmentRecommendation(detail);
  const risks = getRiskAssessment(detail);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/financial" className="text-sm text-blue-600 hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold">Financial Model — {detail.ventureProjectName}</h1>
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground">
        <span className="rounded bg-muted px-2 py-0.5">{model.currency}</span>
        <span className="rounded bg-muted px-2 py-0.5">{model.projection_years}-year projection</span>
        <span className="rounded bg-muted px-2 py-0.5">
          Created {new Date(model.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Projections Table */}
      {projections.length > 0 && (
        <Section title="📊 Revenue & Profitability">
          <DataTable
            headers={["Year", "Revenue", "COGS", "Gross Profit", "OpEx", "EBITDA", "Net Profit", "Cash"]}
            rows={projections.map((p) => [
              `Year ${p.year}`,
              fmt(p.revenue),
              fmt(p.cogs),
              fmt(p.gross_profit),
              fmt(p.operating_expenses),
              fmt(p.ebitda),
              fmt(p.net_profit),
              fmt(p.cash_balance),
            ])}
          />
        </Section>
      )}

      {/* Unit Economics */}
      {ue && (
        <Section title="📈 Unit Economics">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">CAC</p>
              <p className="text-lg font-bold">{fmt(ue.cac)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">LTV</p>
              <p className="text-lg font-bold">{fmt(ue.ltv)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">LTV/CAC</p>
              <p className="text-lg font-bold">{ue.ltv_cac_ratio.toFixed(1)}x</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payback</p>
              <p className="text-lg font-bold">{ue.payback_months.toFixed(0)} mo</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ARPU</p>
              <p className="text-lg font-bold">{fmt(ue.arpu)}/mo</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gross Margin</p>
              <p className="text-lg font-bold">{ue.gross_margin.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Churn</p>
              <p className="text-lg font-bold">{(ue.monthly_churn * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Section>
      )}

      {/* Break-Even */}
      {be && (
        <Section title="⚖️ Break-Even Analysis">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Fixed Cost</p>
              <p className="text-lg font-bold">{fmt(be.monthly_fixed_cost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Break-Even Revenue</p>
              <p className="text-lg font-bold">{fmt(be.break_even_revenue)}/mo</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Break-Even Customers</p>
              <p className="text-lg font-bold">{be.break_even_customers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated Month</p>
              <p className="text-lg font-bold">Month {be.estimated_break_even_month}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Investment Recommendation */}
      <Section title="💼 Investment Recommendation">
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <p className="font-semibold text-green-800">{investment.stage}</p>
          <p className="text-sm text-green-700">{investment.reasoning}</p>
        </div>
      </Section>

      {/* Risk Assessment */}
      <Section title="⚠️ Risk Assessment">
        <div className="space-y-2">
          {risks.map((r) => (
            <div key={r.category} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="font-medium">{r.category}</p>
                <p className="text-xs text-muted-foreground">{r.reasoning}</p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  r.level === "Low"
                    ? "bg-green-100 text-green-700"
                    : r.level === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {r.level} ({r.score})
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
