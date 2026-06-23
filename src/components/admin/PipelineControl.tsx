/**
 * Admin Pipeline Control
 *
 * Dashboard widget showing:
 * - Last pipeline run status + counts
 * - Run Pipeline button
 */
"use client";

import { useState } from "react";
import { runPipelineAction } from "@/actions/pipeline.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Play, Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface LatestRun {
  lastRun: string | null;
  lastStatus: string | null;
  lastDurationMs: number | null;
  rawPosts: number;
  painPoints: number;
  clusters: number;
  opportunities: number;
  ideas: number;
}

interface PipelineControlProps {
  initialRun?: LatestRun | null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString();
}

export function PipelineControl({ initialRun }: PipelineControlProps) {
  const [running, setRunning] = useState(false);
  const [latestRun, setLatestRun] = useState<LatestRun | null>(initialRun ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);

    try {
      const response = await runPipelineAction();

      if (response.success && response.result) {
        setLatestRun({
          lastRun: response.result.finishedAt,
          lastStatus: response.result.success ? "success" : "failed",
          lastDurationMs: response.result.durationMs,
          rawPosts: response.result.rawPosts,
          painPoints: response.result.painPoints,
          clusters: response.result.clusters,
          opportunities: response.result.opportunities,
          ideas: response.result.ideas,
        });
        if (!response.result.success) {
          setError(response.result.errorMessage ?? "Unknown error");
        }
      } else {
        setError(response.error ?? "Failed to run pipeline");
      }
    } catch {
      setError("Failed to execute pipeline action");
    } finally {
      setRunning(false);
    }
  }

  const statusIcon = latestRun?.lastStatus === "success"
    ? <CheckCircle className="h-5 w-5 text-green-500" />
    : latestRun?.lastStatus === "failed"
      ? <AlertCircle className="h-5 w-5 text-red-500" />
      : <Clock className="h-5 w-5 text-gray-400" />;

  const statusColor = latestRun?.lastStatus === "success"
    ? "bg-green-100 text-green-800"
    : latestRun?.lastStatus === "failed"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Pipeline Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run button */}
        <Button
          onClick={handleRun}
          disabled={running}
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Pipeline
            </>
          )}
        </Button>

        {/* Error display */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Latest run summary */}
        {latestRun && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Last Run</span>
              <div className="flex items-center gap-2">
                {statusIcon}
                <Badge className={statusColor}>
                  {latestRun.lastStatus?.toUpperCase() ?? "PENDING"}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {formatDate(latestRun.lastRun)}
              {latestRun.lastDurationMs != null && (
                <span className="ml-2">({formatDuration(latestRun.lastDurationMs)})</span>
              )}
            </div>

            {/* Counts grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Posts" value={latestRun.rawPosts} />
              <StatCard label="Pain Points" value={latestRun.painPoints} />
              <StatCard label="Clusters" value={latestRun.clusters} />
              <StatCard label="Opportunities" value={latestRun.opportunities} />
              <StatCard label="Ideas" value={latestRun.ideas} />
            </div>
          </div>
        )}

        {!latestRun && !running && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pipeline runs yet. Click &quot;Run Pipeline&quot; to start.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-secondary/50 rounded-md p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
