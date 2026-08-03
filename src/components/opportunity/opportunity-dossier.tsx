/**
 * Client-side dossier with tabs. Receives all server-fetched data via
 * props and renders tabs that contain the existing cards (re-exported).
 */
"use client";

import { useState } from "react";
import {
  Brain,
  Layers,
  PieChart,
  TrendingUp,
  Sparkles,
  FileText,
  Rocket,
  Calendar,
  Briefcase,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AIAnalysisCard } from "@/components/insights/AIAnalysisCard";
import { MarketEvidenceCard } from "@/components/evidence/market-evidence-card";
import { InvestmentScoreCard } from "@/components/investment/investment-score-card";
import { InvestmentMemoCard } from "@/components/investment-memo/investment-memo-card";
import { InvestmentMemoExportMenu } from "@/components/investment-memo/investment-memo-export-menu";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import {
  OpportunityHeader,
} from "@/components/opportunity/opportunity-header";
import {
  ScoreBreakdown,
  recommendationFromScore,
} from "@/components/opportunity/score-breakdown";
import type { OpportunityDossierProps } from "@/components/opportunity/dossier-types";
import type { OpportunityForecastRow } from "@/types/forecast";

interface OpportunityDossierClientProps extends OpportunityDossierProps {
  forecast: OpportunityForecastRow | null;
}

type TabValue =
  | "overview"
  | "evidence"
  | "forecast"
  | "idea"
  | "memo"
  | "venture"
  | "history";

export function OpportunityDossierClient(props: OpportunityDossierClientProps) {
  const {
    detail,
    insight,
    evidence,
    score,
    forecast,
    memo,
    portfolioItem,
    opportunityId,
    committeeSection,
    backtestSection,
  } = props;

  const [tab, setTab] = useState<TabValue>(() => {
    if (typeof window === "undefined") return "overview";
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab") as TabValue | null;
    const allowed: TabValue[] = [
      "overview",
      "evidence",
      "forecast",
      "idea",
      "memo",
      "venture",
      "history",
    ];
    return t && allowed.includes(t) ? t : "overview";
  });

  const recommendation = recommendationFromScore(
    score?.overall_score ?? detail.score,
  );

  const evidenceAverage =
    evidence.length > 0
      ? Math.round(
          evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length,
        )
      : null;

  return (
    <div className="space-y-6">
      <OpportunityHeader
        detail={detail}
        recommendation={recommendation}
        memoId={memo?.id ?? null}
      />

      <ScoreBreakdown
        opportunityScore={detail.score}
        validationScore={null /* not surfaced in current detail type */}
        forecastScore={forecast?.forecast_score ?? null}
        startupScore={score?.overall_score ?? null}
        evidenceAverage={evidenceAverage}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1">
            <Brain className="h-3.5 w-3.5" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <Layers className="h-3.5 w-3.5" />
            Bằng chứng
            {evidence.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-medium tabular-nums text-primary">
                {evidence.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            Dự báo
          </TabsTrigger>
          <TabsTrigger value="idea" className="gap-1">
            <Rocket className="h-3.5 w-3.5" />
            Startup Idea
          </TabsTrigger>
          <TabsTrigger value="memo" className="gap-1">
            <FileText className="h-3.5 w-3.5" />
            Memo
          </TabsTrigger>
          <TabsTrigger value="venture" className="gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            Venture
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AIAnalysisCard insight={insight} />
          <InvestmentScoreCard score={score} />
          <PortfolioCard
            portfolioItem={portfolioItem}
            opportunityId={opportunityId}
          />
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          <MarketEvidenceCard evidence={evidence} />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <ForecastPanel forecast={forecast} />
        </TabsContent>

        <TabsContent value="idea" className="space-y-6">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">Startup Ideas</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ý tưởng được AI sinh ra từ cluster này.
            </p>
            <StartupIdeasSection ideas={[]} />
          </div>
        </TabsContent>

        <TabsContent value="memo" className="space-y-6">
          <InvestmentMemoCard memo={memo} />
          {memo && (
            <div className="rounded-md border bg-muted/30 p-4">
              <InvestmentMemoExportMenu
                memoId={memo.id}
                opportunityId={memo.opportunity_id}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="venture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Investment Committee
              </CardTitle>
            </CardHeader>
            <CardContent>{committeeSection}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioCard
                portfolioItem={portfolioItem}
                opportunityId={opportunityId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {backtestSection}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ForecastPanel({ forecast }: { forecast: OpportunityForecastRow | null }) {
  if (!forecast) {
    return (
      <EmptyState
        icon={<PieChart className="h-5 w-5" />}
        title="Chưa có dự báo"
        description="Chạy forecast pipeline để AI dự đoán tăng trưởng của cơ hội này."
      />
    );
  }

  const metrics = [
    { label: "Forecast Score", value: forecast.forecast_score },
    { label: "Growth Probability", value: forecast.growth_probability, suffix: "%" },
    { label: "Confidence", value: forecast.confidence, suffix: "%" },
    { label: "Momentum", value: forecast.momentum, suffix: "%" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Opportunity Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border bg-card p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {Math.round(m.value)}
                {m.suffix && (
                  <span className="ml-0.5 text-base text-muted-foreground">
                    {m.suffix}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        {forecast.prediction_summary && (
          <p className="text-sm text-foreground leading-relaxed">
            {forecast.prediction_summary}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Cửa sổ dự báo: {forecast.forecast_window_days} ngày
        </p>
      </CardContent>
    </Card>
  );
}
