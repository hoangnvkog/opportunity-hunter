export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunityDossierClient } from "@/components/opportunity/opportunity-dossier";
import { getOpportunityDetailAction } from "@/actions/opportunities.actions";
import { findInsightByOpportunityIdAction } from "@/actions/insights.actions";
import { getEvidenceAction } from "@/actions/evidence.actions";
import { getOpportunityScoreAction } from "@/actions/startup-score.actions";
import { getOpportunityMemoAction } from "@/actions/investment-memo.actions";
import { getOpportunityForecastAction } from "@/actions/forecast.actions";
import { getPortfolioByOpportunity } from "@/lib/services/portfolio.service";
import { CommitteeSection } from "./CommitteeSection";
import { BacktestSection } from "@/components/backtesting/backtest-section";

interface OpportunityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: OpportunityPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getOpportunityDetailAction(id);

  if (!detail) {
    return {
      title: "Opportunity Not Found",
      description: "The requested opportunity could not be found.",
    };
  }

  return {
    title: detail.cluster_name,
    description: detail.cluster_description,
  };
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { id } = await params;

  const [
    detail,
    insight,
    evidenceResult,
    scoreResult,
    forecastResult,
    memoResult,
    portfolioItem,
  ] = await Promise.all([
    getOpportunityDetailAction(id),
    findInsightByOpportunityIdAction(id),
    getEvidenceAction(id),
    getOpportunityScoreAction(id),
    getOpportunityForecastAction(id),
    getOpportunityMemoAction(id),
    getPortfolioByOpportunity(id),
  ]);

  if (!detail) {
    notFound();
  }

  const evidence = evidenceResult.success ? evidenceResult.data ?? [] : [];
  const score =
    scoreResult.success && scoreResult.data ? scoreResult.data : null;
  const forecast =
    forecastResult.success && forecastResult.data
      ? forecastResult.data
      : null;
  const memo = memoResult.success && memoResult.data ? memoResult.data : null;

  return (
    <AppLayout>
      <OpportunityDossierClient
        detail={detail}
        insight={insight}
        evidence={evidence}
        score={score}
        forecast={forecast}
        memo={memo}
        portfolioItem={portfolioItem}
        opportunityId={id}
        committeeSection={
          <Suspense
            fallback={
              <div className="h-32 animate-pulse bg-muted rounded-lg" />
            }
          >
            <CommitteeSection opportunityId={id} />
          </Suspense>
        }
        backtestSection={<BacktestSection opportunityId={id} />}
      />
    </AppLayout>
  );
}
