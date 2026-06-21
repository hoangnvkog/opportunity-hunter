"use client";

import { useEffect, useState } from "react";
import { getPipelineRunsAction } from "@/actions/pipeline-runs.actions";
import { PipelineHistorySection } from "./pipeline-history-section";
import type { PipelineRunHistory } from "@/types/pipeline-run-history";

export function PipelineHistoryClient() {
  const [runs, setRuns] = useState<PipelineRunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoading(true);
        const data = await getPipelineRunsAction(10);
        setRuns(data);
        setError(null);
      } catch (err) {
        setError("Unable to load pipeline history.");
        console.error("Failed to fetch pipeline runs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, []);

  if (loading) {
    return (
      <div className="border rounded-lg p-8">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center text-destructive">
        {error}
      </div>
    );
  }

  return <PipelineHistorySection runs={runs} />;
}
