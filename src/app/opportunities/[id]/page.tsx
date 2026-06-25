import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunityScoreCard } from "@/components/opportunity/opportunity-score-card";
import { OpportunityOverviewCard } from "@/components/opportunity/opportunity-overview-card";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import { AIAnalysisCard } from "@/components/insights/AIAnalysisCard";
import { MarketEvidenceCard } from "@/components/evidence/market-evidence-card";
import { getOpportunityDetailAction } from "@/actions/opportunities.actions";
import { findInsightByOpportunityIdAction } from "@/actions/insights.actions";
import { getEvidenceAction } from "@/actions/evidence.actions";

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

  const [detail, insight, evidenceResult] = await Promise.all([
    getOpportunityDetailAction(id),
    findInsightByOpportunityIdAction(id),
    getEvidenceAction(id),
  ]);

  if (!detail) {
    notFound();
  }

  const evidence = evidenceResult.success ? evidenceResult.data ?? [] : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {detail.cluster_name}
          </h1>
          <p className="text-muted-foreground mt-2">
            {detail.cluster_description}
          </p>
        </div>

        <OpportunityOverviewCard
          cluster_name={detail.cluster_name}
          cluster_description={detail.cluster_description}
          created_at={detail.created_at}
          startup_ideas_count={detail.startup_ideas_count}
        />

        <OpportunityScoreCard
          score={detail.score}
          frequency={detail.frequency}
          severity={detail.severity}
          buying_intent={detail.buying_intent}
        />

        <AIAnalysisCard insight={insight} />

        <MarketEvidenceCard evidence={evidence} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Startup Ideas</h2>
          <StartupIdeasSection ideas={[]} />
        </div>
      </div>
    </AppLayout>
  );
}
