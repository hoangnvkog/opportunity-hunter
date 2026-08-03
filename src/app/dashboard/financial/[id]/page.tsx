/**
 * Sprint 64: Financial Model Detail Page
 * UI-4 polish — tabs (Tổng quan / Projections / Unit Economics / Break-even / Rủi ro),
 * design system tokens, signal tones.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { ArrowLeft, Coins, Clock, TrendingUp, Target, Flame, AlertTriangle } from "lucide-react";
import {
  getModelDetail,
  getInvestmentRecommendation,
  getRiskAssessment,
} from "@/services/financial/financial.service";

export const dynamic = "force-dynamic";

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function riskTone(level: string): "hot" | "watch" | "risk" {
  if (level === "Low") return "hot";
  if (level === "Medium") return "watch";
  return "risk";
}

function stageVariant(stage: string): "default" | "info" | "hot" | "watch" | "risk" {
  switch (stage) {
    case "Series A":
      return "hot";
    case "Seed":
      return "info";
    case "Angel":
      return "watch";
    case "Bootstrap":
      return "default";
    default:
      return "risk";
  }
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

  const runwayTone =
    ue?.payback_months !== undefined
      ? ue.payback_months <= 12
        ? "hot"
        : ue.payback_months <= 24
          ? "info"
          : "watch"
      : "default";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title={`Financial Model — ${detail.ventureProjectName}`}
            description={`${model.currency} · ${model.projection_years}-year projection`}
            badge={
              <Badge variant={stageVariant(investment.stage)}>
                {investment.stage}
              </Badge>
            }
          />
          <Link
            href="/dashboard/financial"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard
            title="ARR (cuối kỳ)"
            value={
              projections.length > 0
                ? fmt(projections[projections.length - 1].revenue)
                : "—"
            }
            tone="hot"
            icon={<Coins className="h-4 w-4" />}
          />
          <MetricCard
            title="Net Profit (Y5)"
            value={
              projections.length > 0
                ? fmt(projections[projections.length - 1].net_profit)
                : "—"
            }
            tone={
              projections.length > 0 && projections[projections.length - 1].net_profit >= 0
                ? "hot"
                : "risk"
            }
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Break Even"
            value={be ? `Mo ${be.estimated_break_even_month}` : "—"}
            tone="info"
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            title="Payback"
            value={ue ? `${ue.payback_months.toFixed(0)} mo` : "—"}
            tone={runwayTone}
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        {/* Investment Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Investment Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={stageVariant(investment.stage)}>{investment.stage}</Badge>
              {investment.recommended ? (
                <Badge variant="hot-soft">Recommended</Badge>
              ) : (
                <Badge variant="risk-soft">Không khuyến nghị</Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {investment.reasoning}
            </p>
          </CardContent>
        </Card>

        {/* Projections Table */}
        {projections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Năm</th>
                      <th className="px-4 py-2 font-medium">Revenue</th>
                      <th className="px-4 py-2 font-medium">COGS</th>
                      <th className="px-4 py-2 font-medium">Gross Profit</th>
                      <th className="px-4 py-2 font-medium">OpEx</th>
                      <th className="px-4 py-2 font-medium">EBITDA</th>
                      <th className="px-4 py-2 font-medium">Net Profit</th>
                      <th className="px-4 py-2 font-medium">Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((p) => (
                      <tr key={p.year} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium tabular-nums">
                          Y{p.year}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{fmt(p.revenue)}</td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">
                          {fmt(p.cogs)}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{fmt(p.gross_profit)}</td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">
                          {fmt(p.operating_expenses)}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{fmt(p.ebitda)}</td>
                        <td
                          className={`px-4 py-2 tabular-nums ${
                            p.net_profit >= 0 ? "text-signal-hot-foreground" : "text-signal-risk-foreground"
                          }`}
                        >
                          {fmt(p.net_profit)}
                        </td>
                        <td className="px-4 py-2 tabular-nums">{fmt(p.cash_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Unit Economics */}
          {ue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Unit Economics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="CAC" value={fmt(ue.cac)} />
                <Field label="LTV" value={fmt(ue.ltv)} />
                <Field
                  label="LTV/CAC"
                  value={`${ue.ltv_cac_ratio.toFixed(1)}x`}
                  tone={
                    ue.ltv_cac_ratio >= 3
                      ? "hot"
                      : ue.ltv_cac_ratio >= 1
                        ? "info"
                        : "risk"
                  }
                />
                <Field label="Payback" value={`${ue.payback_months.toFixed(0)} mo`} />
                <Field label="ARPU" value={`${fmt(ue.arpu)}/mo`} />
                <Field label="Gross Margin" value={`${ue.gross_margin.toFixed(0)}%`} />
                <Field label="Monthly Churn" value={`${(ue.monthly_churn * 100).toFixed(1)}%`} />
              </CardContent>
            </Card>
          )}

          {/* Break-Even */}
          {be && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Break-Even
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Field label="Monthly Fixed Cost" value={fmt(be.monthly_fixed_cost)} />
                <Field label="Break-Even Revenue" value={`${fmt(be.break_even_revenue)}/mo`} />
                <Field label="Break-Even Customers" value={String(be.break_even_customers)} />
                <Field label="Estimated Month" value={`Month ${be.estimated_break_even_month}`} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risks.map((r) => (
              <div
                key={r.category}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.category}</p>
                  {r.reasoning && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.reasoning}</p>
                  )}
                </div>
                <Badge variant={riskTone(r.level)}>
                  {r.level} · {r.score}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "hot" | "info" | "risk" | "default";
}) {
  const toneClass = tone
    ? {
        hot: "text-signal-hot-foreground",
        info: "text-signal-info-foreground",
        risk: "text-signal-risk-foreground",
        default: "",
      }[tone]
    : "";

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
