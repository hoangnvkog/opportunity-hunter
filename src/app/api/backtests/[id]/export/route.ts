/**
 * Sprint 59: Backtest Export API Route
 *
 * GET /api/backtests/[id]/export?format=csv|json|pdf
 *
 * Returns the backtest as a downloadable file.
 * - csv: Tabular format
 * - json: Raw row JSON
 * - pdf: HTML wrapper for browser print-to-PDF
 */

import { NextResponse } from "next/server";
import { getBacktestById } from "@/services/backtesting/backtesting.service";
import { backtestFilename, mimeFor, type ExportFormat } from "@/lib/exports/backtest-export";

const VALID_FORMATS: ReadonlySet<ExportFormat> = new Set(["csv", "json", "pdf"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const formatParam = (url.searchParams.get("format") ?? "json") as ExportFormat;

    if (!VALID_FORMATS.has(formatParam)) {
      return NextResponse.json(
        { error: `Invalid format: ${formatParam}. Allowed: csv|json|pdf` },
        { status: 400 },
      );
    }

    const backtest = await getBacktestById(id);
    if (!backtest) {
      return NextResponse.json({ error: "Backtest not found" }, { status: 404 });
    }

    const contentType = mimeFor(formatParam);
    const filename = backtestFilename(backtest, formatParam);

    let body: string;
    if (formatParam === "json") {
      body = JSON.stringify(backtest, null, 2);
    } else if (formatParam === "csv") {
      const row = backtest;
      body = [
        "id,opportunity_id,predicted_score,actual_score,prediction_delta,market_growth,search_growth,reddit_growth,github_growth,competitor_growth,accuracy,status,evaluation_date,notes,created_at",
        [
          row.id,
          row.opportunity_id,
          row.predicted_score,
          row.actual_score ?? "",
          row.prediction_delta ?? "",
          row.market_growth ?? "",
          row.search_growth ?? "",
          row.reddit_growth ?? "",
          row.github_growth ?? "",
          row.competitor_growth ?? "",
          row.accuracy ?? "",
          row.status,
          row.evaluation_date,
          `"${(row.notes ?? "").replace(/"/g, '""')}"`,
          row.created_at,
        ].join(","),
      ].join("\n");
    } else {
      // pdf — HTML wrapper (print-to-PDF in browser)
      body = toPdfHtml(backtest);
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backtest export error:", error);
    return NextResponse.json(
      { error: "Failed to export backtest" },
      { status: 500 },
    );
  }
}

function toPdfHtml(backtest: NonNullable<Awaited<ReturnType<typeof getBacktestById>>>): string {
  const accuracy = backtest.accuracy ?? "N/A";
  const delta = backtest.prediction_delta ?? "N/A";
  const statusColor = backtest.status === "evaluated"
    ? Number(accuracy) >= 60 ? "#16a34a" : Number(accuracy) < 40 ? "#dc2626" : "#d97706"
    : "#6b7280";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Backtest Report — ${backtest.opportunity_id.slice(0, 8)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
    h1 { font-size: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .metric-label { color: #6b7280; font-size: 13px; }
    .metric-value { font-weight: 600; font-size: 14px; }
    .notes { margin-top: 20px; background: #f9fafb; padding: 16px; border-radius: 6px; font-size: 13px; line-height: 1.6; }
    .footer { margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <h1>Backtest Report</h1>
  <div class="metric"><span class="metric-label">Status</span><span class="metric-value" style="color:${statusColor}">${backtest.status}</span></div>
  <div class="metric"><span class="metric-label">Accuracy</span><span class="metric-value">${accuracy}%</span></div>
  <div class="metric"><span class="metric-label">Prediction Delta</span><span class="metric-value">${delta}</span></div>
  <div class="metric"><span class="metric-label">Predicted Score</span><span class="metric-value">${backtest.predicted_score}</span></div>
  <div class="metric"><span class="metric-label">Actual Score</span><span class="metric-value">${backtest.actual_score ?? "Pending"}</span></div>
  <div class="metric"><span class="metric-label">Evaluation Date</span><span class="metric-value">${backtest.evaluation_date}</span></div>
  <div class="metric"><span class="metric-label">Market Growth</span><span class="metric-value">${backtest.market_growth ?? "N/A"}</span></div>
  <div class="metric"><span class="metric-label">Search Growth</span><span class="metric-value">${backtest.search_growth ?? "N/A"}</span></div>
  <div class="metric"><span class="metric-label">Reddit Growth</span><span class="metric-value">${backtest.reddit_growth ?? "N/A"}</span></div>
  <div class="metric"><span class="metric-label">GitHub Growth</span><span class="metric-value">${backtest.github_growth ?? "N/A"}</span></div>
  <div class="metric"><span class="metric-label">Competitor Growth</span><span class="metric-value">${backtest.competitor_growth ?? "N/A"}</span></div>
  ${backtest.notes ? `<div class="notes"><strong>Notes:</strong><br>${backtest.notes}</div>` : ""}
  <div class="footer">Opportunity Hunter — Backtest Report · ${new Date().toISOString()}</div>
</body>
</html>`;
}