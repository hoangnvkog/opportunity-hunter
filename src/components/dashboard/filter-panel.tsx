"use client";

import { useState } from "react";
import type { OpportunityFilters } from "@/types/filters";

interface FilterPanelProps {
  onFilter: (filters: OpportunityFilters) => void;
}

export function FilterPanel({ onFilter }: FilterPanelProps) {
  const [minScore, setMinScore] = useState<number | undefined>();
  const [minFrequency, setMinFrequency] = useState<number | undefined>();
  const [minSeverity, setMinSeverity] = useState<number | undefined>();
  const [minBuyingIntent, setMinBuyingIntent] = useState<number | undefined>();
  const [limit, setLimit] = useState<number>(10);

  const handleApply = () => {
    onFilter({
      minScore,
      minFrequency,
      minSeverity,
      minBuyingIntent,
      limit,
    });
  };

  const handleReset = () => {
    setMinScore(undefined);
    setMinFrequency(undefined);
    setMinSeverity(undefined);
    setMinBuyingIntent(undefined);
    setLimit(10);
    onFilter({ limit: 10 });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold dark:text-white">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Score
          </label>
          <input
            type="number"
            value={minScore ?? ""}
            onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0-100"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Frequency
          </label>
          <input
            type="number"
            value={minFrequency ?? ""}
            onChange={(e) => setMinFrequency(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0+"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Severity
          </label>
          <input
            type="number"
            value={minSeverity ?? ""}
            onChange={(e) => setMinSeverity(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0.0-1.0"
            min="0"
            max="1"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Buying Intent
          </label>
          <input
            type="number"
            value={minBuyingIntent ?? ""}
            onChange={(e) => setMinBuyingIntent(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0.0-1.0"
            min="0"
            max="1"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Limit
          </label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            placeholder="10"
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
