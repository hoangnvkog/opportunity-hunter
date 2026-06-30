/**
 * Sprint 59: Backtest Export Utilities Tests
 */

import { describe, it, expect } from "vitest";
import { backtestFilename, mimeFor, type ExportFormat } from "../backtest-export";
import type { BacktestRow } from "@/types/backtesting";

const makeRow = (overrides: Partial<BacktestRow> = {}): BacktestRow =>
  ({
    id: "bt-12345678",
    opportunity_id: "opp-87654321",
    predicted_score: "80.000",
    predicted_direction: "up",
    actual_score: "76.500",
    prediction_delta: "3.500",
    market_growth: "5.000",
    search_growth: "12.000",
    reddit_growth: "8.000",
    github_growth: null,
    competitor_growth: "3.000",
    accuracy: "93.00",
    status: "evaluated",
    evaluation_date: "2026-06-15",
    notes: "Minor deviation — prediction accurate.",
    created_at: "2026-05-15T10:00:00Z",
    ...overrides,
  } as BacktestRow);

describe("backtestFilename()", () => {
  it("includes opportunity prefix and evaluation date", () => {
    const row = makeRow();
    const name = backtestFilename(row, "json");
    expect(name).toContain("backtest-");
    expect(name).toContain("opp-87");
    expect(name).toContain("2026-06-15");
  });

  it("uses correct extension for csv", () => {
    const name = backtestFilename(makeRow(), "csv");
    expect(name).toMatch(/\.csv$/);
  });

  it("uses correct extension for json", () => {
    const name = backtestFilename(makeRow(), "json");
    expect(name).toMatch(/\.json$/);
  });

  it("uses correct extension for pdf (html)", () => {
    const name = backtestFilename(makeRow(), "pdf");
    expect(name).toMatch(/\.html$/);
  });
});

describe("mimeFor()", () => {
  it("returns CSV mime type", () => {
    expect(mimeFor("csv")).toBe("text/csv; charset=utf-8");
  });

  it("returns JSON mime type", () => {
    expect(mimeFor("json")).toBe("application/json; charset=utf-8");
  });

  it("returns HTML mime type for pdf", () => {
    expect(mimeFor("pdf")).toBe("text/html; charset=utf-8");
  });
});