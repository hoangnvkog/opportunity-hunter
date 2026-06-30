"use client";

/**
 * Sprint 58: Investment Memo Export Menu (Client Component)
 *
 * Provides PDF, Markdown, JSON, and DOCX download links for a single memo.
 * Records an analytics event via server action on every export click.
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, FileText, FileJson, FileType2 } from "lucide-react";
import { recordMemoExportAction } from "@/actions/investment-memo.actions";

interface InvestmentMemoExportMenuProps {
  memoId: string;
  opportunityId: string;
}

type ExportFormat = "pdf" | "markdown" | "json" | "docx";

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  markdown: "Markdown",
  json: "JSON",
  docx: "DOCX",
};

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
  pdf: <FileText className="h-3 w-3" />,
  markdown: <FileType2 className="h-3 w-3" />,
  json: <FileJson className="h-3 w-3" />,
  docx: <FileType2 className="h-3 w-3" />,
};

export function InvestmentMemoExportMenu({
  memoId,
  opportunityId,
}: InvestmentMemoExportMenuProps) {
  const [pending, setPending] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    setPending(format);
    try {
      // Fire analytics event (best-effort).
      void recordMemoExportAction(memoId, opportunityId, format);

      // Trigger file download by opening the export API route.
      const url = `/api/investment-memos/${memoId}/export?format=${format}`;
      window.location.href = url;
    } finally {
      setTimeout(() => setPending(null), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Download className="h-4 w-4" />
        Export
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((format) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            disabled={pending !== null}
            onClick={() => handleExport(format)}
          >
            {FORMAT_ICONS[format]}
            <span className="ml-1">
              {pending === format ? "Preparing…" : FORMAT_LABELS[format]}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}