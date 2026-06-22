import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OpportunityTable } from "@/components/opportunities/opportunity-table";
import { OpportunitiesFilterControls } from "@/components/insights/OpportunitiesFilterControls";
import { findOpportunitiesAction } from "@/actions/opportunities.actions";
import type { CompetitionLevel, Urgency } from "@/types/opportunity-insight";

interface OpportunitiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const ALLOWED_COMPETITION: ReadonlyArray<CompetitionLevel> = ["Low", "Medium", "High"];
const ALLOWED_URGENCY: ReadonlyArray<Urgency> = ["Low", "Medium", "High"];

function asEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: ReadonlyArray<T>,
): T | undefined {
  const s = pickString(value);
  if (!s) return undefined;
  return allowed.includes(s as T) ? (s as T) : undefined;
}

function pickNumber(value: string | string[] | undefined): number | undefined {
  const s = pickString(value);
  if (s === undefined) return undefined;
  const parsed = Number.parseFloat(s);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const sp = await searchParams;
  const insightCompetition = asEnum<CompetitionLevel>(sp.insightCompetition, ALLOWED_COMPETITION);
  const insightUrgency = asEnum<Urgency>(sp.insightUrgency, ALLOWED_URGENCY);
  const insightMinConfidence = pickNumber(sp.insightMinConfidence);

  const opportunities = await findOpportunitiesAction({
    insightCompetition,
    insightUrgency,
    insightMinConfidence,
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
            <p className="text-muted-foreground mt-1">
              Discover and analyze startup opportunities from online discussions.
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <OpportunitiesFilterControls />
        </Suspense>

        <OpportunityTable opportunities={opportunities} />
      </div>
    </AppLayout>
  );
}
