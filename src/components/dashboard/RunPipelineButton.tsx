"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { runPipelineAction } from "@/actions/pipeline.actions";
import type { PipelineRunResult } from "@/types/pipeline-run";
import { Loader2, Play, CheckCircle2, XCircle } from "lucide-react";

export function RunPipelineButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunPipeline = () => {
    setError(null);
    setResult(null);
    
    startTransition(async () => {
      try {
        const actionResult = await runPipelineAction();
        
        if (actionResult.success && actionResult.data) {
          setResult(actionResult.data);
          router.refresh();
        } else {
          setError(actionResult.error || "Pipeline failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Pipeline failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRunPipeline}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Pipeline
          </>
        )}
      </Button>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
            <div className="flex-1 text-sm text-red-800">
              <p className="font-medium">Pipeline failed</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
            <div className="flex-1 text-sm text-green-800">
              <p className="font-medium">Pipeline completed</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>Sources: {result.sources}</li>
                <li>Raw posts: {result.rawPosts}</li>
                <li>Pain points: {result.painPoints}</li>
                <li>Embeddings: {result.embeddings}</li>
                <li>Clusters: {result.clusters}</li>
                <li>Opportunities: {result.opportunities}</li>
                <li>Startup ideas: {result.startupIdeas}</li>
                <li>Duration: {result.durationMs}ms</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
