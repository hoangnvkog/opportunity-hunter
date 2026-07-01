"use client";

/**
 * Sprint 59: Backtest Refresh Button (Client Component)
 *
 * Triggers batch evaluation of pending backtests via server action.
 */

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { evaluateBatchAction } from "@/actions/backtesting.actions";

export function BacktestRefreshButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      setMessage("Evaluating pending backtests…");
      const result = await evaluateBatchAction(50);
      if (result.success) {
        setMessage(
          `Done: ${result.evaluated} evaluated, ${result.skipped} skipped`,
        );
      } else {
        setMessage(`Error: ${result.error ?? "unknown"}`);
      }
      setTimeout(() => setMessage(null), 5000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleClick} disabled={pending} variant="outline">
        <RefreshCw className={`h-4 w-4 mr-2 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Evaluating…" : "Run Batch Evaluation"}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground max-w-xs text-right">{message}</p>
      )}
    </div>
  );
}