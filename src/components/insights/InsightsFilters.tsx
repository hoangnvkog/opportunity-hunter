"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COMPETITION_LEVELS, URGENCY_LEVELS } from "@/types/opportunity-insight";
import type { CompetitionLevel, Urgency } from "@/types/opportunity-insight";

/**
 * Filter controls for `/insights` history page.
 * Uses URL search params so filters survive reloads and are shareable.
 */
export function InsightsFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [competition, setCompetition] = useState<CompetitionLevel | "">(
    () => (params.get("competition") as CompetitionLevel | null) ?? "",
  );
  const [urgency, setUrgency] = useState<Urgency | "">(
    () => (params.get("urgency") as Urgency | null) ?? "",
  );
  const [minConfidence, setMinConfidence] = useState<string>(
    () => params.get("minConfidence") ?? "",
  );
  const [sort, setSort] = useState<string>(
    () => params.get("sort") ?? "created_at",
  );
  const [order, setOrder] = useState<string>(
    () => params.get("order") ?? "desc",
  );

  const apply = () => {
    const next = new URLSearchParams();
    if (competition) next.set("competition", competition);
    if (urgency) next.set("urgency", urgency);
    if (minConfidence) next.set("minConfidence", minConfidence);
    if (sort !== "created_at") next.set("sort", sort);
    if (order !== "desc") next.set("order", order);
    const qs = next.toString();
    router.push(qs ? `/insights?${qs}` : "/insights");
  };

  const reset = () => {
    setCompetition("");
    setUrgency("");
    setMinConfidence("");
    setSort("created_at");
    setOrder("desc");
    router.push("/insights");
  };

  return (
    <div className="rounded-lg border bg-secondary/40 p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Competition
          </label>
          <select
            value={competition}
            onChange={(e) => setCompetition(e.target.value as CompetitionLevel | "")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {COMPETITION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Urgency
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency | "")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Min confidence
          </label>
          <input
            type="number"
            value={minConfidence}
            onChange={(e) => setMinConfidence(e.target.value)}
            step="0.05"
            min="0"
            max="1"
            placeholder="0.0 – 1.0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sort by
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="created_at">Created at</option>
            <option value="confidence_score">Confidence</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Order
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={apply}
          className="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-200 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
