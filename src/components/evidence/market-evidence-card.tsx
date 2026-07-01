/**
 * Sprint 53: Market Evidence Card Component
 *
 * Displays market evidence grouped by type for an opportunity.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OpportunityEvidenceRow } from "@/types/evidence";

interface MarketEvidenceCardProps {
  evidence: OpportunityEvidenceRow[];
}

const evidenceTypeLabels: Record<string, string> = {
  competitor: "Competitors",
  pricing: "Pricing",
  customer_quote: "Customer Signals",
  market_report: "Market Reports",
  google_trend: "Trends",
  reddit: "Reddit",
};

const evidenceTypeColors: Record<string, string> = {
  competitor: "bg-blue-500",
  pricing: "bg-green-500",
  customer_quote: "bg-orange-500",
  market_report: "bg-purple-500",
  google_trend: "bg-yellow-500",
  reddit: "bg-red-500",
};

export function MarketEvidenceCard({ evidence }: MarketEvidenceCardProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No market evidence available yet. Run the pipeline to generate evidence for validated opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group evidence by type
  const grouped = evidence.reduce<Record<string, OpportunityEvidenceRow[]>>(
    (acc, ev) => {
      const type = ev.evidence_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(ev);
      return acc;
    },
    {},
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Evidence</CardTitle>
        <p className="text-sm text-muted-foreground">
          {evidence.length} evidence items from validated opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  evidenceTypeColors[type] || "bg-gray-500"
                }`}
              />
              <h3 className="font-semibold text-sm">
                {evidenceTypeLabels[type] || type}
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {items.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {items.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{ev.title}</p>
                      {ev.summary && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {ev.summary}
                        </p>
                      )}
                      {ev.source && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Source: {ev.source}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={ev.confidence >= 80 ? "default" : "outline"}
                      className="ml-2 shrink-0"
                    >
                      {Math.round(ev.confidence)}%
                    </Badge>
                  </div>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                    >
                      View source →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}