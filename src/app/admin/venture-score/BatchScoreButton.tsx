"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BatchScoreButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleBatchScore() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/venture-score/batch", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(`Processed: ${data.processed}, Scored: ${data.inserted}, Skipped: ${data.skipped}`);
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleBatchScore} disabled={loading}>
        {loading ? "Scoring..." : "Batch Score All"}
      </Button>
      {result && <span className="text-sm text-muted-foreground">{result}</span>}
    </div>
  );
}
