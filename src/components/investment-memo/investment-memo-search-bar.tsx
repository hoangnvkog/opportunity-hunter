"use client";

/**
 * Sprint 58: Investment Memo Search Bar (Client Component)
 *
 * Client-side search input + filters that posts to the searchMemosAction.
 * Dispatches a custom window event with the results so that the
 * table component (separate client boundary) can update without
 * prop-drilling.
 */

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { searchMemosAction } from "@/actions/investment-memo.actions";
import type { InvestmentMemoRow } from "@/types/investment-memo";

function dispatchResults(results: InvestmentMemoRow[], total: number): void {
  window.dispatchEvent(
    new CustomEvent("investment-memo-search", { detail: { results, total } }),
  );
}

function dispatchReset(): void {
  window.dispatchEvent(new CustomEvent("investment-memo-search-reset"));
}

export function InvestmentMemoSearchBar() {
  const [query, setQuery] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [minConfidence, setMinConfidence] = useState("");
  const [investmentDecision, setInvestmentDecision] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      const filters = {
        query: query.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
        minConfidence: minConfidence ? Number(minConfidence) : undefined,
        investmentDecision: investmentDecision.trim() || undefined,
        limit: 50,
      };
      const result = await searchMemosAction(filters);
      if (result.success && result.data) {
        dispatchResults(result.data.results, result.data.total);
      } else {
        setError(result.error ?? "Search failed");
      }
    });
  }

  function handleReset() {
    setQuery("");
    setRecommendation("");
    setMinConfidence("");
    setInvestmentDecision("");
    setError(null);
    dispatchReset();
    startTransition(async () => {
      const result = await searchMemosAction({ limit: 50 });
      if (result.success && result.data) {
        dispatchResults(result.data.results, result.data.total);
      }
    });
  }

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search thesis, market, problem, solution…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset} disabled={pending}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Recommendation (e.g. STRONG BUY)"
        />
        <Input
          value={investmentDecision}
          onChange={(e) => setInvestmentDecision(e.target.value)}
          placeholder="Decision (e.g. INVEST — lead)"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={minConfidence}
          onChange={(e) => setMinConfidence(e.target.value)}
          placeholder="Min confidence (0-100)"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}