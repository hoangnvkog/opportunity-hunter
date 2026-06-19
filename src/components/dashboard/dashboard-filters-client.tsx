"use client";

import { useState } from "react";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import type { OpportunityFilters } from "@/types/filters";
import type { OpportunityCardData, StartupIdeaCardData } from "@/types/dashboard";

interface DashboardFiltersClientProps {
  initialOpportunities: OpportunityCardData[];
  initialIdeas: StartupIdeaCardData[];
}

export default function DashboardFiltersClient({
  initialOpportunities,
  initialIdeas,
}: DashboardFiltersClientProps) {
  const [_opportunities, setOpportunities] = useState<OpportunityCardData[]>(initialOpportunities);
  const [_ideas, setIdeas] = useState<StartupIdeaCardData[]>(initialIdeas);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setOpportunities(data.opportunities);
      setIdeas(data.ideas);
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async (filters: OpportunityFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.minScore) params.set("minScore", filters.minScore.toString());
      if (filters.minFrequency) params.set("minFrequency", filters.minFrequency.toString());
      if (filters.minSeverity) params.set("minSeverity", filters.minSeverity.toString());
      if (filters.minBuyingIntent) params.set("minBuyingIntent", filters.minBuyingIntent.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/filter?${params.toString()}`);
      if (!response.ok) throw new Error("Filter failed");
      const data = await response.json();
      setOpportunities(data.opportunities);
      setIdeas(data.ideas);
    } catch (err) {
      setError("Filter failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
