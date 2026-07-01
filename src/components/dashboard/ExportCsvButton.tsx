"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { OpportunityView } from "@/services/opportunities";

interface ExportCsvButtonProps {
  data: OpportunityView[];
}

export function ExportCsvButton({ data }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = ["ID", "Title", "Category", "Score", "Severity", "Buying Intent", "Frequency"];
    const rows = data.map((opp) => [
      opp.id,
      opp.title,
      opp.category,
      opp.score.toString(),
      opp.severity.toString(),
      opp.buyingIntent.toString(),
      opp.frequency.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "opportunities.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={data.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
