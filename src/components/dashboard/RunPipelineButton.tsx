"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { runPipelineAction } from "@/actions/pipeline.actions";
import { Loader2, Play } from "lucide-react";

export function RunPipelineButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    try {
      await runPipelineAction();
      router.refresh();
    } catch (error) {
      console.error("Pipeline failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      onClick={handleRunPipeline}
      disabled={isRunning}
      size="sm"
    >
      {isRunning ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Run Pipeline
        </>
      )}
    </Button>
  );
}
