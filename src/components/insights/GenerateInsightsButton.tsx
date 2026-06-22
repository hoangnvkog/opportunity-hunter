"use client";

import { useState } from "react";
import { generateInsightsFromDatabaseAction } from "@/actions/insights.actions";

export function GenerateInsightsButton({ className }: { className?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function trigger() {
    setMessage(null);
    setPending(true);
    try {
      const result = await generateInsightsFromDatabaseAction(20);
      setMessage(
        `Scanned ${result.scanned} opportunities. Generated ${result.created} insight${result.created === 1 ? "" : "s"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to generate insights.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={trigger}
        disabled={pending}
        className="inline-flex items-center rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Generating…" : "Generate insights now"}
      </button>
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
