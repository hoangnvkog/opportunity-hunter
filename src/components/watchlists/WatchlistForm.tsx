"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createWatchlistAction } from "@/actions/watchlists.actions";
import type { WatchlistInsert } from "@/types/watchlist";

interface WatchlistFormProps {
  onSuccess?: () => void;
}

export function WatchlistForm({ onSuccess }: WatchlistFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const data: WatchlistInsert = {
        name: formData.get("name") as string,
        search: formData.get("search") as string || null,
        min_score: formData.get("min_score") ? Number(formData.get("min_score")) : null,
        min_frequency: formData.get("min_frequency") ? Number(formData.get("min_frequency")) : null,
        min_severity: formData.get("min_severity") ? Number(formData.get("min_severity")) : null,
        min_buying_intent: formData.get("min_buying_intent") ? Number(formData.get("min_buying_intent")) : null,
      };

      await createWatchlistAction(data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create watchlist");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <Input
          id="name"
          name="name"
          required
          placeholder="My Watchlist"
        />
      </div>

      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-1">
          Search Term (optional)
        </label>
        <Input
          id="search"
          name="search"
          placeholder="e.g., AI, healthcare"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="min_score" className="block text-sm font-medium mb-1">
            Min Score (optional)
          </label>
          <Input
            id="min_score"
            name="min_score"
            type="number"
            step="0.1"
            placeholder="0.0"
          />
        </div>

        <div>
          <label htmlFor="min_frequency" className="block text-sm font-medium mb-1">
            Min Frequency (optional)
          </label>
          <Input
            id="min_frequency"
            name="min_frequency"
            type="number"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="min_severity" className="block text-sm font-medium mb-1">
            Min Severity (optional)
          </label>
          <Input
            id="min_severity"
            name="min_severity"
            type="number"
            step="0.1"
            placeholder="0.0"
          />
        </div>

        <div>
          <label htmlFor="min_buying_intent" className="block text-sm font-medium mb-1">
            Min Buying Intent (optional)
          </label>
          <Input
            id="min_buying_intent"
            name="min_buying_intent"
            type="number"
            step="0.1"
            placeholder="0.0"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Watchlist"}
      </Button>
    </form>
  );
}
