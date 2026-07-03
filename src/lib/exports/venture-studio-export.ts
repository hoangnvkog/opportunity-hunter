/**
 * Sprint 63: Venture Studio Export Utilities
 *
 * Pure formatting helpers for PDF, Markdown, JSON export.
 * No I/O, no DB calls — accepts a VentureProjectDetail and returns formatted output.
 */

import type { VentureProjectDetail } from "@/types/venture-studio";

export type ExportFormat = "pdf" | "markdown" | "json";

const FORMAT_MIME: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  markdown: "text/markdown; charset=utf-8",
  json: "application/json; charset=utf-8",
};

const FORMAT_EXT: Record<ExportFormat, string> = {
  pdf: "pdf",
  markdown: "md",
  json: "json",
};

/** Resolve a safe filename for the export download. */
export function ventureFilename(detail: VentureProjectDetail, format: ExportFormat): string {
  const slug =
    detail.project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || `venture-${detail.project.id.slice(0, 8)}`;
  return `${slug}.${FORMAT_EXT[format]}`;
}

/** MIME content-type for a given export format. */
export function mimeFor(format: ExportFormat): string {
  return FORMAT_MIME[format];
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/** Serialize the full venture project detail as JSON. */
export function toJson(detail: VentureProjectDetail): string {
  return JSON.stringify(detail, null, 2);
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

/** Render the venture project detail as a Markdown document. */
export function toMarkdown(detail: VentureProjectDetail): string {
  const { project, canvas, gtm, mvp } = detail;
  const lines: string[] = [];

  lines.push(`# ${project.name}`);
  lines.push("");
  lines.push(`> ${project.tagline}`);
  lines.push("");
  lines.push(`**Score:** ${project.overall_score} · **Status:** ${project.status}`);
  lines.push("");

  if (canvas) {
    lines.push("## Business Model Canvas");
    lines.push("");
    const canvasSections: Array<[string, string]> = [
      ["Problem", canvas.problem],
      ["Solution", canvas.solution],
      ["Value Proposition", canvas.value_proposition],
      ["Customer Segments", canvas.customer_segments],
      ["Channels", canvas.channels],
      ["Customer Relationships", canvas.customer_relationships],
      ["Key Activities", canvas.key_activities],
      ["Key Resources", canvas.key_resources],
      ["Key Partners", canvas.key_partners],
      ["Cost Structure", canvas.cost_structure],
      ["Revenue Streams", canvas.revenue_streams],
    ];
    for (const [heading, body] of canvasSections) {
      if (body) {
        lines.push(`### ${heading}`);
        lines.push(body);
        lines.push("");
      }
    }
  }

  if (mvp) {
    lines.push("## MVP Plan");
    lines.push("");
    const mvpSections: Array<[string, string]> = [
      ["Core Features", mvp.core_features],
      ["Tech Stack", mvp.tech_stack],
      ["Estimated Cost", mvp.estimated_cost],
      ["Estimated Time", mvp.estimated_time],
      ["Roadmap", mvp.roadmap],
      ["Risks", mvp.risks],
    ];
    for (const [heading, body] of mvpSections) {
      if (body) {
        lines.push(`### ${heading}`);
        lines.push(body);
        lines.push("");
      }
    }
  }

  if (gtm) {
    lines.push("## Go-to-Market Strategy");
    lines.push("");
    const gtmSections: Array<[string, string]> = [
      ["Launch Strategy", gtm.launch_strategy],
      ["Acquisition Channels", gtm.acquisition_channels],
      ["Pricing Strategy", gtm.pricing_strategy],
      ["Growth Loops", gtm.growth_loops],
      ["Marketing Plan", gtm.marketing_plan],
      ["Sales Plan", gtm.sales_plan],
    ];
    for (const [heading, body] of gtmSections) {
      if (body) {
        lines.push(`### ${heading}`);
        lines.push(body);
        lines.push("");
      }
    }
  }

  lines.push("---");
  lines.push(`Generated ${new Date(project.created_at).toISOString()}`);

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

/** Render the venture project as a self-contained HTML document for print/PDF. */
export function toPdfHtml(detail: VentureProjectDetail): string {
  const { project, canvas, gtm, mvp } = detail;
  const sections: string[] = [];

  if (canvas) {
    const canvasPairs: Array<[string, string]> = [
      ["Problem", canvas.problem],
      ["Solution", canvas.solution],
      ["Value Proposition", canvas.value_proposition],
      ["Customer Segments", canvas.customer_segments],
      ["Channels", canvas.channels],
      ["Customer Relationships", canvas.customer_relationships],
      ["Key Activities", canvas.key_activities],
      ["Key Resources", canvas.key_resources],
      ["Key Partners", canvas.key_partners],
      ["Cost Structure", canvas.cost_structure],
      ["Revenue Streams", canvas.revenue_streams],
    ];
    sections.push('<h2>Business Model Canvas</h2>');
    for (const [heading, body] of canvasPairs) {
      if (body) {
        sections.push(`<h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body)}</p>`);
      }
    }
  }

  if (mvp) {
    const mvpPairs: Array<[string, string]> = [
      ["Core Features", mvp.core_features],
      ["Tech Stack", mvp.tech_stack],
      ["Estimated Cost", mvp.estimated_cost],
      ["Estimated Time", mvp.estimated_time],
      ["Roadmap", mvp.roadmap],
      ["Risks", mvp.risks],
    ];
    sections.push('<h2>MVP Plan</h2>');
    for (const [heading, body] of mvpPairs) {
      if (body) {
        sections.push(`<h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body)}</p>`);
      }
    }
  }

  if (gtm) {
    const gtmPairs: Array<[string, string]> = [
      ["Launch Strategy", gtm.launch_strategy],
      ["Acquisition Channels", gtm.acquisition_channels],
      ["Pricing Strategy", gtm.pricing_strategy],
      ["Growth Loops", gtm.growth_loops],
      ["Marketing Plan", gtm.marketing_plan],
      ["Sales Plan", gtm.sales_plan],
    ];
    sections.push('<h2>Go-to-Market Strategy</h2>');
    for (const [heading, body] of gtmPairs) {
      if (body) {
        sections.push(`<h3>${escapeHtml(heading)}</h3><p>${escapeHtml(body)}</p>`);
      }
    }
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(project.name)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 32px auto; padding: 0 24px; color: #111; line-height: 1.55; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .tagline { color: #555; font-style: italic; margin-bottom: 8px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 16px; }
    h2 { font-size: 18px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; margin-bottom: 4px; margin-top: 16px; }
    p { margin: 0; font-size: 14px; }
    footer { border-top: 1px solid #ddd; margin-top: 32px; padding-top: 8px; color: #888; font-size: 11px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #ecfdf5; color: #065f46; font-weight: 600; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(project.name)}</h1>
  <p class="tagline">${escapeHtml(project.tagline)}</p>
  <p class="meta">
    <span class="badge">${escapeHtml(project.status)}</span>
    • Score: <strong>${project.overall_score}</strong>
    • Generated: ${escapeHtml(new Date(project.created_at).toISOString())}
  </p>
  ${sections.join("\n")}
  <footer>Opportunity: ${escapeHtml(project.opportunity_id)} • Project: ${escapeHtml(project.id)}</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Render the venture project detail for the requested export format. */
export function renderVenture(detail: VentureProjectDetail, format: ExportFormat): string {
  switch (format) {
    case "json":
      return toJson(detail);
    case "markdown":
      return toMarkdown(detail);
    case "pdf":
      return toPdfHtml(detail);
    default: {
      const exhaustive: never = format;
      return exhaustive;
    }
  }
}
