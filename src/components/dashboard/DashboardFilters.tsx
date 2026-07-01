"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { DashboardFilters } from "@/services/dashboard";

interface DashboardFiltersProps {
  currentFilters: DashboardFilters;
}

export function DashboardFilters({ currentFilters }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(currentFilters.q || "");
  const [minScore, setMinScore] = useState(currentFilters.minScore?.toString() || "");
  const [minSeverity, setMinSeverity] = useState(currentFilters.minSeverity?.toString() || "");
  const [minBuyingIntent, setMinBuyingIntent] = useState(currentFilters.minBuyingIntent?.toString() || "");
  const [sort, setSort] = useState(currentFilters.sort || "score_desc");

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (q) params.set("q", q);
    else params.delete("q");

    if (minScore) params.set("minScore", minScore);
    else params.delete("minScore");

    if (minSeverity) params.set("minSeverity", minSeverity);
    else params.delete("minSeverity");

    if (minBuyingIntent) params.set("minBuyingIntent", minBuyingIntent);
    else params.delete("minBuyingIntent");

    if (sort && sort !== "score_desc") params.set("sort", sort);
    else params.delete("sort");

    // Reset to page 1 when filters change
    params.delete("page");

    router.push(`?${params.toString()}`);
  }, [router, searchParams, q, minScore, minSeverity, minBuyingIntent, sort]);

  const clearFilters = useCallback(() => {
    setQ("");
    setMinScore("");
    setMinSeverity("");
    setMinBuyingIntent("");
    setSort("score_desc");
    router.push("/");
  }, [router]);

  const hasActiveFilters = q || minScore || minSeverity || minBuyingIntent || (sort && sort !== "score_desc");

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search opportunities..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateFilters()}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="minScore">Min Score</Label>
          <Input
            id="minScore"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="0"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters()}
          />
        </div>

        <div>
          <Label htmlFor="minSeverity">Min Severity</Label>
          <Input
            id="minSeverity"
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="0"
            value={minSeverity}
            onChange={(e) => setMinSeverity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters()}
          />
        </div>

        <div>
          <Label htmlFor="minBuyingIntent">Min Buying Intent</Label>
          <Input
            id="minBuyingIntent"
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="0"
            value={minBuyingIntent}
            onChange={(e) => setMinBuyingIntent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters()}
          />
        </div>

        <div>
          <Label htmlFor="sort">Sort by</Label>
          <Select value={sort} onValueChange={(value) => {
            setSort(value as 'score_desc' | 'score_asc' | 'buying_intent_desc' | 'newest');
            setTimeout(updateFilters, 0);
          }}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Score (High to Low)</SelectItem>
              <SelectItem value="score_asc">Score (Low to High)</SelectItem>
              <SelectItem value="buying_intent_desc">Buying Intent (High to Low)</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={updateFilters}>Apply Filters</Button>
      </div>
    </div>
  );
}
