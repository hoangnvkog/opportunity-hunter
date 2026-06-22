"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COMPETITION_LEVELS, URGENCY_LEVELS } from "@/types/opportunity-insight";
import type { CompetitionLevel, Urgency } from "@/types/opportunity-insight";

/**
 * Filter controls for the `/opportunities` table.
 * Filters are written to URL search params; the server page reads
 * them and forwards them to `findOpportunities` filters.
 */
export function OpportunitiesFilterControls() {
  const router = useRouter();
  const params = useSearchParams();

  const [competition, setCompetition] = useState<CompetitionLevel | "">(
    () => (params.get("insightCompetition") as CompetitionLevel | null) ?? "",
  );
  const [urgency, setUrgency] = useState<Urgency | "">(
    () => (params.get("insightUrgency") as Urgency | null) ?? "",
  );
  const [minConfidence, setMinConfidence] = useState<string>(
    () => params.get("insightMinConfidence") ?? "",
  );

  const apply = () => {
    const next = new URLSearchParams();
    if (competition) next.set("insightCompetition", competition);
    if (urgency) next.set("insightUrgency", urgency);
    if (minConfidence) next.set("insightMinConfidence", minConfidence);
    const qs = next.toString();
    router.push(qs ? `/opportunities?${qs}` : "/opportunities");
  };

  const reset = () => {
    setCompetition("");
    setUrgency("");
    setMinConfidence("");
    router.push("/opportunities");
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-secondary/40 px-4 py-3">
      <div className="space-y-1">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Insight: Competition
        </label>
        <select
          value={competition}
          onChange={(e) => setCompetition(e.target.value as CompetitionLevel | "")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Insight: Urgency
        </label>
        <select
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as Urgency | "")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
          className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          className="rounded-md border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-200 bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
