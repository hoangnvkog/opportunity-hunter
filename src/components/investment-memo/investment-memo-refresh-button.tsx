"use client";

/**
 * Sprint 58: Investment Memo Refresh Button (Client Component)
 *
 * Triggers batch generation of investment memos via server action.
 */

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { generateMemoBatchAction } from "@/actions/investment-memo.actions";

export function InvestmentMemoRefreshButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      setMessage("Generating memos…");
      const result = await generateMemoBatchAction(50);
      if (result.success) {
        setMessage(
          `Done: ${result.inserted} inserted, ${result.generated} generated, ${result.skipped} skipped`,
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
        {pending ? "Generating…" : "Generate Memos"}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground max-w-xs text-right">{message}</p>
      )}
    </div>
  );
}