"use client";

/**
 * Sprint 58: Investment Memo Table (Client Component)
 *
 * Renders either:
 *  - server-loaded top memos (default), or
 *  - client-side search results (when the search bar pushes new rows).
 *
 * Search results are typed as InvestmentMemoRow; server cards as
 * InvestmentMemoCardData. Both have opportunity_title + recommendation
 * + confidence + memo_version + created_at, so we unify them at render.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  InvestmentMemoCardData,
  InvestmentMemoRow,
} from "@/types/investment-memo";
import { searchMemosAction } from "@/actions/investment-memo.actions";

interface InvestmentMemoTableProps {
  initialMemos: InvestmentMemoCardData[];
}

type UnifiedRow = {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  overall_score: number;
  confidence: number;
  recommendation: string;
  memo_version: number;
  created_at: string;
};

function cardToUnified(card: InvestmentMemoCardData): UnifiedRow {
  return {
    id: card.id,
    opportunity_id: card.opportunity_id,
    opportunity_title: card.opportunity_title,
    overall_score: card.overall_score,
    confidence: card.confidence,
    recommendation: card.recommendation,
    memo_version: card.memo_version,
    created_at: card.created_at,
  };
}

function rowToUnified(row: InvestmentMemoRow): UnifiedRow {
  return {
    id: row.id,
    opportunity_id: row.opportunity_id,
    opportunity_title: row.title || `Opportunity ${row.opportunity_id.slice(0, 8)}`,
    overall_score: 0,
    confidence: row.confidence,
    recommendation: row.recommendation,
    memo_version: row.memo_version,
    created_at: row.created_at,
  };
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
  if (rec === "STRONG BUY")
    return <Badge className="bg-green-100 text-green-800">💰 {rec}</Badge>;
  if (rec === "BUY")
    return <Badge className="bg-blue-100 text-blue-800">{rec}</Badge>;
  if (rec === "HOLD")
    return <Badge className="bg-yellow-100 text-yellow-800">{rec}</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">{rec}</Badge>;
}

export function InvestmentMemoTable({ initialMemos }: InvestmentMemoTableProps) {
  const [rows, setRows] = useState<UnifiedRow[]>(initialMemos.map(cardToUnified));
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    function onUpdate(event: Event) {
      const custom = event as CustomEvent<{
        results: InvestmentMemoRow[];
        total: number;
      }>;
      if (!custom.detail) return;
      setSearching(true);
      setRows(custom.detail.results.map(rowToUnified));
      setSearchTotal(custom.detail.total);
      setSearching(false);
    }
    window.addEventListener("investment-memo-search", onUpdate as EventListener);
    return () => {
      window.removeEventListener(
        "investment-memo-search",
        onUpdate as EventListener,
      );
    };
  }, []);

  // Initial fetch (top memos) — used when the search bar emits "reset".
  async function reset() {
    setSearchTotal(null);
    setRows(initialMemos.map(cardToUnified));
    void searchMemosAction;
  }

  // Subscribe to reset events from the search bar.
  useEffect(() => {
    function onReset() {
      void reset();
    }
    window.addEventListener("investment-memo-search-reset", onReset);
    return () => window.removeEventListener("investment-memo-search-reset", onReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMemos]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {searchTotal !== null ? `Search Results (${searchTotal})` : "Top Investment Memos"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {searching ? (
          <p className="text-muted-foreground text-sm">Searching…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No investment memos generated yet. Memos are generated for opportunities with
            startup_score overall_score &ge; 85.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Opportunity</th>
                  <th className="text-left p-2">Investment Score</th>
                  <th className="text-left p-2">Recommendation</th>
                  <th className="text-left p-2">Confidence</th>
                  <th className="text-left p-2">v</th>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium truncate max-w-xs">
                      {row.opportunity_title}
                    </td>
                    <td className={`p-2 font-bold ${getScoreColor(row.overall_score)}`}>
                      {row.overall_score > 0 ? Math.round(row.overall_score) : "—"}
                    </td>
                    <td className="p-2">{getRecommendationBadge(row.recommendation)}</td>
                    <td className={`p-2 font-bold ${getScoreColor(row.confidence)}`}>
                      {row.confidence}%
                    </td>
                    <td className="p-2">{row.memo_version}</td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <a
                        href={`/opportunities/${row.opportunity_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <a
                        href={`/api/investment-memos/${row.id}/export?format=json`}
                        className="text-blue-600 hover:underline"
                      >
                        Export
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}