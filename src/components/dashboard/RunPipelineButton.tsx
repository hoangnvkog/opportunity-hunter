"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runPipelineAction } from "@/actions/pipeline.actions";
import { Loader2, Play, CheckCircle2, XCircle } from "lucide-react";

export function RunPipelineButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRunPipeline = () => {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      try {
        const actionResult = await runPipelineAction();
        
        if (actionResult.success) {
          setSuccess(true);
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

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
            <div className="flex-1 text-sm text-green-800">
              <p className="font-medium">Pipeline completed successfully</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
