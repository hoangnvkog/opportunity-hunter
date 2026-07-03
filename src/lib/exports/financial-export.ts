/**
 * Sprint 64: Financial Projection Export Utilities
 *
 * Pure formatting helpers for Markdown, JSON, CSV, PDF export.
 * No I/O, no DB calls — accepts FinancialModelDetail and returns formatted output.
 */

import type { FinancialModelDetail, ExportFormat } from "@/types/financial";

const FORMAT_MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  markdown: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

const FORMAT_EXT: Record<ExportFormat, string> = {
  pdf: "pdf",
  markdown: "md",
  json: "json",
  csv: "csv",
};

export function financialFilename(detail: FinancialModelDetail, format: ExportFormat): string {
  const slug = detail.ventureProjectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || `financial-${detail.model.id.slice(0, 8)}`;
  return `${slug}-financial.${FORMAT_EXT[format]}`;
}

export function mimeFor(format: ExportFormat): string {
  return FORMAT_MIME[format];
}

function fmt(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

export function toJson(detail: FinancialModelDetail): string {
  return JSON.stringify(detail, null, 2);
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function toMarkdown(detail: FinancialModelDetail): string {
  const { model, projections, unitEconomics: ue, breakEven: be } = detail;
  const lines: string[] = [];

  lines.push(`# Financial Model — ${detail.ventureProjectName}`);
  lines.push("");
  lines.push(`> Currency: ${model.currency} · Projection: ${model.projection_years} years`);
  lines.push("");

  if (projections.length > 0) {
    lines.push("## Revenue Projections");
    lines.push("");
    lines.push("| Year | Revenue | COGS | Gross Profit | OpEx | EBITDA | Net Profit | Cash |");
    lines.push("|------|---------|------|-------------|------|--------|-----------|------|");
    for (const p of projections) {
      lines.push(
        `| ${p.year} | ${fmt(p.revenue)} | ${fmt(p.cogs)} | ${fmt(p.gross_profit)} | ${fmt(p.operating_expenses)} | ${fmt(p.ebitda)} | ${fmt(p.net_profit)} | ${fmt(p.cash_balance)} |`
      );
    }
    lines.push("");
  }

  if (ue) {
    lines.push("## Unit Economics");
    lines.push("");
    lines.push(`- **CAC:** ${fmt(ue.cac)}`);
    lines.push(`- **LTV:** ${fmt(ue.ltv)}`);
    lines.push(`- **LTV/CAC:** ${ue.ltv_cac_ratio.toFixed(1)}x`);
    lines.push(`- **Payback:** ${ue.payback_months.toFixed(0)} months`);
    lines.push(`- **ARPU:** ${fmt(ue.arpu)}/mo`);
    lines.push(`- **Gross Margin:** ${ue.gross_margin.toFixed(0)}%`);
    lines.push(`- **Monthly Churn:** ${(ue.monthly_churn * 100).toFixed(1)}%`);
    lines.push("");
  }

  if (be) {
    lines.push("## Break-Even Analysis");
    lines.push("");
    lines.push(`- **Monthly Fixed Cost:** ${fmt(be.monthly_fixed_cost)}`);
    lines.push(`- **Break-Even Revenue:** ${fmt(be.break_even_revenue)}/mo`);
    lines.push(`- **Break-Even Customers:** ${be.break_even_customers}`);
    lines.push(`- **Estimated Month:** ${be.estimated_break_even_month}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(`Generated ${new Date(model.created_at).toISOString()}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function toCsv(detail: FinancialModelDetail): string {
  const { projections } = detail;
  const headers = ["Year", "Revenue", "COGS", "Gross Profit", "Operating Expenses", "EBITDA", "Net Profit", "Cash Balance"];
  const rows = projections.map((p) =>
    [p.year, p.revenue, p.cogs, p.gross_profit, p.operating_expenses, p.ebitda, p.net_profit, p.cash_balance].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// PDF (HTML wrapper for browser print-to-PDF)
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toPdfHtml(detail: FinancialModelDetail): string {
  const { model, projections, unitEconomics: ue, breakEven: be } = detail;
  const sections: string[] = [];

  if (projections.length > 0) {
    sections.push("<h2>Revenue Projections</h2>");
    sections.push("<table><thead><tr><th>Year</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th><th>OpEx</th><th>EBITDA</th><th>Net Profit</th><th>Cash</th></tr></thead><tbody>");
    for (const p of projections) {
      sections.push(`<tr><td>${p.year}</td><td>${fmt(p.revenue)}</td><td>${fmt(p.cogs)}</td><td>${fmt(p.gross_profit)}</td><td>${fmt(p.operating_expenses)}</td><td>${fmt(p.ebitda)}</td><td>${fmt(p.net_profit)}</td><td>${fmt(p.cash_balance)}</td></tr>`);
    }
    sections.push("</tbody></table>");
  }

  if (ue) {
    sections.push("<h2>Unit Economics</h2>");
    sections.push(`<p>CAC: ${fmt(ue.cac)} · LTV: ${fmt(ue.ltv)} · LTV/CAC: ${ue.ltv_cac_ratio.toFixed(1)}x · Payback: ${ue.payback_months.toFixed(0)} mo · ARPU: ${fmt(ue.arpu)}/mo · Margin: ${ue.gross_margin.toFixed(0)}% · Churn: ${(ue.monthly_churn * 100).toFixed(1)}%</p>`);
  }

  if (be) {
    sections.push("<h2>Break-Even</h2>");
    sections.push(`<p>Fixed Cost: ${fmt(be.monthly_fixed_cost)} · Break-Even Revenue: ${fmt(be.break_even_revenue)}/mo · Customers: ${be.break_even_customers} · Month: ${be.estimated_break_even_month}</p>`);
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Financial Model — ${escapeHtml(detail.ventureProjectName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 32px auto; padding: 0 24px; color: #111; line-height: 1.55; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
    th { font-weight: 600; color: #555; }
    footer { border-top: 1px solid #ddd; margin-top: 32px; padding-top: 8px; color: #888; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Financial Model — ${escapeHtml(detail.ventureProjectName)}</h1>
  <p>Currency: ${escapeHtml(model.currency)} · Projection: ${model.projection_years} years</p>
  ${sections.join("\n")}
  <footer>Model: ${escapeHtml(model.id)} · Generated: ${escapeHtml(new Date(model.created_at).toISOString())}</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function renderFinancial(detail: FinancialModelDetail, format: ExportFormat): string {
  switch (format) {
    case "json":
      return toJson(detail);
    case "markdown":
      return toMarkdown(detail);
    case "csv":
      return toCsv(detail);
    case "pdf":
      return toPdfHtml(detail);
    default: {
      const exhaustive: never = format;
      return exhaustive;
    }
  }
}
