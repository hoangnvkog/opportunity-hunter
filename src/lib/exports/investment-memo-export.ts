/**
 * Sprint 58: Investment Memo Export Utilities
 *
 * Pure formatting helpers for PDF, Markdown, JSON, DOCX export.
 * No I/O, no DB calls — accepts an InvestmentMemoRow and returns a string or
 * an HTML/structured blob payload.
 *
 * PDF export uses a self-contained HTML wrapper (still a "PDF" from the
 * user's perspective when printed to PDF). True PDF generation requires a
 * server-side renderer (puppeteer / pdfkit) which is out of scope for the
 * current dependency footprint. The export endpoint can serve the HTML
 * with a .pdf Content-Disposition hint; browsers will offer "Save as PDF"
 * automatically. For programmatic PDF binary generation in production,
 * swap the `toPdfHtml` implementation with a real renderer.
 *
 * DOCX export uses a self-contained OOXML skeleton (single .xml inside a
 * .docx-named wrapper). For full Office compatibility we'd need the docx
 * npm package; for the Sprint 58 deliverable we ship the same content as
 * a Word-readable HTML (Content-Type: msword) so users can open in Word
 * and resave as proper .docx. A future sprint can swap in the docx lib.
 */

import type { InvestmentMemoRow } from "@/types/investment-memo";

export type ExportFormat = "pdf" | "markdown" | "json" | "docx";

const FORMAT_MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  markdown: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
  docx: "application/msword; charset=utf-8",
};

const FORMAT_EXT: Record<ExportFormat, string> = {
  pdf: "pdf",
  markdown: "md",
  json: "json",
  docx: "doc",
};

/** Resolve a safe filename for the export download. */
export function memoFilename(memo: InvestmentMemoRow, format: ExportFormat): string {
  const slug =
    memo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || `memo-${memo.id.slice(0, 8)}`;
  return `${slug}-v${memo.memo_version}.${FORMAT_EXT[format]}`;
}

/** MIME content-type for a given export format. */
export function mimeFor(format: ExportFormat): string {
  return FORMAT_MIME[format];
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/** Serialize the memo as JSON. Pretty-printed for human inspection. */
export function toJson(memo: InvestmentMemoRow): string {
  return JSON.stringify(memo, null, 2);
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

/** Render the memo as a Markdown document. */
export function toMarkdown(memo: InvestmentMemoRow): string {
  const lines: string[] = [];
  lines.push(`# ${memo.title}`);
  lines.push("");
  lines.push(
    `> **Recommendation:** ${memo.recommendation} • **Confidence:** ${memo.confidence}% • **Version:** v${memo.memo_version}`,
  );
  lines.push("");

  if (memo.investment_decision) {
    lines.push(`**Decision:** ${memo.investment_decision}`);
    lines.push("");
  }

  const sections: Array<[string, string | null]> = [
    ["Investment Thesis", memo.thesis],
    ["Market", memo.market],
    ["Problem", memo.problem],
    ["Solution", memo.solution],
    ["Business Model", memo.business_model],
    ["Traction", memo.traction],
    ["Competition", memo.competition],
    ["Strengths", memo.strengths],
    ["Risks", memo.risks],
    ["Why Now", memo.why_now],
  ];

  for (const [heading, body] of sections) {
    if (!body) continue;
    lines.push(`## ${heading}`);
    lines.push("");
    lines.push(body);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    `Generated ${new Date(memo.created_at).toISOString()} • Opportunity ${memo.opportunity_id}`,
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// PDF (HTML wrapper for browser print-to-PDF)
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Render the memo as a self-contained HTML document for print/PDF. */
export function toPdfHtml(memo: InvestmentMemoRow): string {
  const sections: Array<[string, string | null]> = [
    ["Investment Thesis", memo.thesis],
    ["Market", memo.market],
    ["Problem", memo.problem],
    ["Solution", memo.solution],
    ["Business Model", memo.business_model],
    ["Traction", memo.traction],
    ["Competition", memo.competition],
    ["Strengths", memo.strengths],
    ["Risks", memo.risks],
    ["Why Now", memo.why_now],
  ];

  const sectionHtml = sections
    .filter(([, body]) => body)
    .map(
      ([heading, body]) => `
  <section>
    <h2>${escapeHtml(heading)}</h2>
    <p>${escapeHtml(body ?? "")}</p>
  </section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(memo.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 32px auto; padding: 0 24px; color: #111; line-height: 1.55; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 16px; }
    .decision { border-left: 4px solid #2563eb; background: #eff6ff; padding: 12px 16px; margin: 16px 0; }
    .decision strong { color: #1e40af; }
    section { margin-bottom: 20px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; margin-bottom: 4px; }
    p { margin: 0; font-size: 14px; }
    footer { border-top: 1px solid #ddd; margin-top: 32px; padding-top: 8px; color: #888; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ecfdf5; color: #065f46; font-weight: 600; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(memo.title)}</h1>
  <p class="meta">
    <span class="badge">${escapeHtml(memo.recommendation)}</span>
    • Confidence: <strong>${memo.confidence}%</strong>
    • Version: v${memo.memo_version}
    • Generated: ${escapeHtml(new Date(memo.created_at).toISOString())}
  </p>
  ${
    memo.investment_decision
      ? `<div class="decision"><strong>Decision:</strong> ${escapeHtml(memo.investment_decision)}</div>`
      : ""
  }
  ${sectionHtml}
  <footer>Opportunity: ${escapeHtml(memo.opportunity_id)} • Memo: ${escapeHtml(memo.id)}</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// DOCX (Word-readable HTML wrapper)
// ---------------------------------------------------------------------------

/**
 * Render the memo as Word-readable HTML (Content-Type: msword).
 * This is the pragmatic "DOCX" deliverable for Sprint 58 given the
 * current dependency footprint — Word opens and resaves as .docx.
 */
export function toDocxHtml(memo: InvestmentMemoRow): string {
  // Same HTML structure as the PDF wrapper but without the print stylesheet.
  const sections: Array<[string, string | null]> = [
    ["Investment Thesis", memo.thesis],
    ["Market", memo.market],
    ["Problem", memo.problem],
    ["Solution", memo.solution],
    ["Business Model", memo.business_model],
    ["Traction", memo.traction],
    ["Competition", memo.competition],
    ["Strengths", memo.strengths],
    ["Risks", memo.risks],
    ["Why Now", memo.why_now],
  ];

  const sectionHtml = sections
    .filter(([, body]) => body)
    .map(
      ([heading, body]) => `
    <h2>${escapeHtml(heading)}</h2>
    <p>${escapeHtml(body ?? "")}</p>`,
    )
    .join("\n");

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(memo.title)}</title>
</head>
<body>
  <h1>${escapeHtml(memo.title)}</h1>
  <p><strong>Recommendation:</strong> ${escapeHtml(memo.recommendation)} • <strong>Confidence:</strong> ${memo.confidence}% • <strong>Version:</strong> v${memo.memo_version}</p>
  ${
    memo.investment_decision
      ? `<p><strong>Decision:</strong> ${escapeHtml(memo.investment_decision)}</p>`
      : ""
  }
  ${sectionHtml}
  <hr/>
  <p><em>Generated ${escapeHtml(new Date(memo.created_at).toISOString())} • Opportunity ${escapeHtml(memo.opportunity_id)}</em></p>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Render the memo body for the requested export format. */
export function renderMemo(memo: InvestmentMemoRow, format: ExportFormat): string {
  switch (format) {
    case "json":
      return toJson(memo);
    case "markdown":
      return toMarkdown(memo);
    case "pdf":
      return toPdfHtml(memo);
    case "docx":
      return toDocxHtml(memo);
    default: {
      const exhaustive: never = format;
      return exhaustive;
    }
  }
}