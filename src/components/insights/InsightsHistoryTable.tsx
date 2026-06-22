import Link from "next/link";
import type { OpportunityInsightCardData } from "@/types/opportunity-insight";

interface InsightsHistoryTableProps {
  insights: OpportunityInsightCardData[];
  page: number;
  pageSize: number;
  total: number;
}

const COMPETITION_STYLES: Record<
  OpportunityInsightCardData["competition_level"],
  string
> = {
  Low: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-rose-100 text-rose-800",
};

const URGENCY_STYLES: Record<OpportunityInsightCardData["urgency"], string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-rose-100 text-rose-800",
};

function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InsightsHistoryTable({
  insights,
  page,
  pageSize,
  total,
}: InsightsHistoryTableProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        No insights match your filters. Adjust them and try again, or generate
        fresh insights from the button above.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Opportunity</th>
            <th className="px-4 py-3">Competition</th>
            <th className="px-4 py-3">Urgency</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {insights.map((insight) => (
            <tr key={insight.id} className="bg-card">
              <td className="px-4 py-3">
                <div className="font-medium">
                  <Link
                    href={`/opportunities/${insight.opportunity_id}`}
                    className="hover:underline"
                  >
                    {insight.opportunity_title}
                  </Link>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {insight.summary}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COMPETITION_STYLES[insight.competition_level]}`}
                >
                  {insight.competition_level}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_STYLES[insight.urgency]}`}
                >
                  {insight.urgency}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">
                {formatConfidence(insight.confidence_score)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(insight.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
        </span>
        <span>
          {total} insight{total === 1 ? "" : "s"} total
        </span>
      </div>
    </div>
  );
}
