/**
 * Sprint 59: Backtest Export Utilities
 *
 * Pure formatting helpers for CSV, JSON, PDF export.
 * No I/O, no DB calls — accepts a BacktestRow and returns a string.
 */

import type { BacktestRow } from "@/types/backtesting";

export type ExportFormat = "csv" | "json" | "pdf";

const FORMAT_MIME: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  pdf: "text/html; charset=utf-8",
};

const FORMAT_EXT: Record<ExportFormat, string> = {
  csv: "csv",
  json: "json",
  pdf: "html",
};

/** Resolve a safe filename for the export download. */
export function backtestFilename(backtest: BacktestRow, format: ExportFormat): string {
  const slug = backtest.opportunity_id.slice(0, 8);
  return `backtest-${slug}-${backtest.evaluation_date}.${FORMAT_EXT[format]}`;
}

/** MIME content-type for a given export format. */
export function mimeFor(format: ExportFormat): string {
  return FORMAT_MIME[format];
}