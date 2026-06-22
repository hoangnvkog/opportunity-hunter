import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InsightsFilters } from "@/components/insights/InsightsFilters";
import { InsightsHistoryTable } from "@/components/insights/InsightsHistoryTable";
import { GenerateInsightsButton } from "@/components/insights/GenerateInsightsButton";
import { listInsightsAction } from "@/actions/insights.actions";
import type {
  CompetitionLevel,
  Urgency,
} from "@/types/opportunity-insight";

interface InsightsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickString(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function pickNumber(value: string | string[] | undefined): number | undefined {
  const s = pickString(value);
  if (s === undefined) return undefined;
  const parsed = Number.parseFloat(s);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function pickSort(value: string | string[] | undefined): "created_at" | "confidence_score" {
  return pickString(value) === "confidence_score" ? "confidence_score" : "created_at";
}

function pickOrder(value: string | string[] | undefined): "asc" | "desc" {
  return pickString(value) === "asc" ? "asc" : "desc";
}

const PAGE_SIZE = 10;
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

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const sp = await searchParams;
  const competition = asEnum<CompetitionLevel>(sp.competition, ALLOWED_COMPETITION);
  const urgency = asEnum<Urgency>(sp.urgency, ALLOWED_URGENCY);
  const minConfidence = pickNumber(sp.minConfidence);
  const sort = pickSort(sp.sort);
  const order = pickOrder(sp.order);
  const page = Math.max(1, pickNumber(sp.page) ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { items, total } = await listInsightsAction({
    competition_level: competition,
    urgency,
    minConfidence,
    sort,
    order,
    limit: PAGE_SIZE,
    offset,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground mt-1">
              Latest business analysis generated from your opportunities.
            </p>
          </div>
          <GenerateInsightsButton />
        </div>

        <Suspense fallback={null}>
          <InsightsFilters />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Insights history</CardTitle>
            <CardDescription>
              {total} insight{total === 1 ? "" : "s"} match your filters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InsightsHistoryTable
              insights={items}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
