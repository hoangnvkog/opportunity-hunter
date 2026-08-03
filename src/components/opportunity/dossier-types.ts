import type { OpportunityDetail } from "@/types/opportunity-detail";
import type { OpportunityInsightCardData } from "@/types/opportunity-insight";
import type { OpportunityEvidenceRow } from "@/types/evidence";
import type { StartupScoreRow } from "@/types/startup-score";
import type { InvestmentMemoRow } from "@/types/investment-memo";
import type { OpportunityForecastRow } from "@/types/forecast";
import type { PortfolioItemRow } from "@/types/portfolio";

export interface OpportunityDossierProps {
  detail: OpportunityDetail;
  insight: OpportunityInsightCardData | null;
  evidence: OpportunityEvidenceRow[];
  score: StartupScoreRow | null;
  forecast: OpportunityForecastRow | null;
  memo: InvestmentMemoRow | null;
  portfolioItem: PortfolioItemRow | null;
  opportunityId: string;
  committeeSection?: React.ReactNode;
  backtestSection?: React.ReactNode;
}
