"use client";

import { useRef, useState } from "react";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import type { OpportunityFilters } from "@/types/filters";
import type { OpportunityCardData, StartupIdeaCardData } from "@/types/dashboard";

interface DashboardFiltersClientProps {
  initialOpportunities: OpportunityCardData[];
  initialIdeas: StartupIdeaCardData[];
}

interface FilterResponse {
  opportunities: OpportunityCardData[];
  ideas: StartupIdeaCardData[];
}

export default function DashboardFiltersClient({
  initialOpportunities,
  initialIdeas,
}: DashboardFiltersClientProps) {
  const [_opportunities, setOpportunities] = useState<OpportunityCardData[]>(initialOpportunities);
  const [_ideas, setIdeas] = useState<StartupIdeaCardData[]>(initialIdeas);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the most recent AbortController so a slow request can be
  // cancelled when the user keeps typing (debounce fires repeatedly).
  const inflightRef = useRef<AbortController | null>(null);

  const runFetch = async (
    url: string,
    failureMessage: string,
  ): Promise<void> => {
    // Cancel any in-flight request before starting a new one.
    inflightRef.current?.abort();
    const controller = new AbortController();
    inflightRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(failureMessage);
      const data = (await response.json()) as FilterResponse;
      setOpportunities(data.opportunities ?? []);
      setIdeas(data.ideas ?? []);
    } catch (err) {
      // AbortError is the expected outcome when a newer request supersedes
      // this one — never surface it as a user-facing error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(`${failureMessage}. Please try again.`);
      console.error(err);
    } finally {
      // Only clear the loading spinner if no newer request has taken over.
      if (inflightRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    // SearchBar's debounce fires on mount with an empty string. Hitting
    // the API with q="" returns "no filter applied" results that are
    // already represented by `initialOpportunities` / `initialIdeas`, so
    // skip the round-trip entirely.
    if (trimmed.length === 0) {
      setOpportunities(initialOpportunities);
      setIdeas(initialIdeas);
      setError(null);
      return;
    }
    void runFetch(
      `/api/search?q=${encodeURIComponent(trimmed)}`,
      "Search failed",
    );
  };

  const handleFilter = (filters: OpportunityFilters) => {
    const params = new URLSearchParams();
    if (filters.minScore !== undefined) params.set("minScore", String(filters.minScore));
    if (filters.minFrequency !== undefined) params.set("minFrequency", String(filters.minFrequency));
    if (filters.minSeverity !== undefined) params.set("minSeverity", String(filters.minSeverity));
    if (filters.minBuyingIntent !== undefined) params.set("minBuyingIntent", String(filters.minBuyingIntent));
    if (filters.limit !== undefined) params.set("limit", String(filters.limit));
    if (filters.search) params.set("search", filters.search);

    void runFetch(`/api/filter?${params.toString()}`, "Filter failed");
  };

  return (
    <>
      <div className="space-y-4">
        <SearchBar onSearch={handleSearch} />
        <FilterPanel onFilter={handleFilter} />
      </div>
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </>
  );
}
