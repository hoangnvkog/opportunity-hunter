/**
 * Sprint 58: Investment Memo Export API Route
 *
 * GET /api/investment-memos/[id]/export?format=pdf|markdown|json|docx
 *
 * Returns the memo as a downloadable file in the requested format.
 * - pdf: HTML wrapper for browser print-to-PDF
 * - markdown: Markdown text
 * - json: JSON payload
 * - docx: Word-readable HTML
 */

import { NextResponse } from "next/server";
import { getMemoById, trackMemoExported } from "@/services/investment-memo/investment-memo.service";
import {
  renderMemo,
  mimeFor,
  memoFilename,
  type ExportFormat,
} from "@/lib/exports/investment-memo-export";

const VALID_FORMATS: ReadonlySet<ExportFormat> = new Set([
  "pdf",
  "markdown",
  "json",
  "docx",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const formatParam = url.searchParams.get("format") ?? "json";

    if (!VALID_FORMATS.has(formatParam as ExportFormat)) {
      return NextResponse.json(
        { error: `Invalid format: ${formatParam}. Allowed: pdf|markdown|json|docx` },
        { status: 400 },
      );
    }

    const format = formatParam as ExportFormat;
    const memo = await getMemoById(id);
    if (!memo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    const body = renderMemo(memo, format);
    const filename = memoFilename(memo, format);
    const mime = mimeFor(format);

    // Best-effort analytics event.
    try {
      trackMemoExported(memo.id, memo.opportunity_id, format);
    } catch {
      // ignore analytics errors
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Investment memo export API error:", error);
    return NextResponse.json(
      { error: "Failed to export investment memo" },
      { status: 500 },
    );
  }
}