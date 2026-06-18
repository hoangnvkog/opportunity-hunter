import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunitySummaryCard } from "@/components/opportunities/opportunity-summary-card";
import { StartupIdeasSection } from "@/components/startup-ideas/startup-ideas-section";
import { findOpportunityByIdAction } from "@/actions/opportunities.actions";

interface OpportunityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { id } = await params;

  let opportunity;
  try {
    opportunity = await findOpportunityByIdAction(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Opportunity not found") {
      notFound();
    }
    throw error;
  }

  return (
    <AppLayout>
      <div>
        <h1 className="text-3xl font-bold">{opportunity.title}</h1>
        <p className="text-muted-foreground mt-2">{opportunity.description}</p>
      </div>

      <OpportunitySummaryCard
        score={opportunity.score}
        frequency={opportunity.frequency}
        severity={opportunity.severity}
        buyingIntent={opportunity.buyingIntent}
      />

      <div>
        <h2 className="text-2xl font-semibold mb-4">Startup Ideas</h2>
        <StartupIdeasSection ideas={[]} />
      </div>
    </AppLayout>
  );
}
