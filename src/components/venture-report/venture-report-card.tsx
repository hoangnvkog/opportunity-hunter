/**
 * Sprint 57: Venture Research Report Card Component
 *
 * Displays AI-generated venture research report for an opportunity.
 * Shows: title, executive summary, recommendation, key analysis sections.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { VentureReportRow } from "@/types/venture-report";
import { FileText, TrendingUp, AlertTriangle } from "lucide-react";

interface VentureReportCardProps {
  report: VentureReportRow | null;
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
  if (rec === "STRONG BUY")
    return <Badge className="bg-green-100 text-green-800">🚀 {rec}</Badge>;
  if (rec === "BUY")
    return <Badge className="bg-blue-100 text-blue-800">{rec}</Badge>;
  if (rec === "HOLD")
    return <Badge className="bg-yellow-100 text-yellow-800">{rec}</Badge>;
  return <Badge className="bg-gray-100 text-gray-800">{rec}</Badge>;
}

function getConfidenceColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

export function VentureReportCard({ report }: VentureReportCardProps) {
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Venture Research Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No venture research report generated yet for this opportunity.
            Reports are generated for opportunities with startup_score overall_score &gt;= 80.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Venture Research Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title + Recommendation */}
        <div className="flex items-start justify-between border-b pb-4 gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold">{report.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              v{report.report_version} • Generated {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right space-y-1">
            {getRecommendationBadge(report.recommendation)}
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={`text-sm font-bold ${getConfidenceColor(report.confidence)}`}>
                {report.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {report.executive_summary && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Executive Summary
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {report.executive_summary}
            </p>
          </div>
        )}

        {/* Key Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
          {report.problem && (
            <div>
              <p className="text-sm font-medium mb-1">Problem</p>
              <p className="text-xs text-muted-foreground">{report.problem}</p>
            </div>
          )}
          {report.market_analysis && (
            <div>
              <p className="text-sm font-medium mb-1">Market Analysis</p>
              <p className="text-xs text-muted-foreground">{report.market_analysis}</p>
            </div>
          )}
          {report.tam_analysis && (
            <div>
              <p className="text-sm font-medium mb-1">TAM</p>
              <p className="text-xs text-muted-foreground">{report.tam_analysis}</p>
            </div>
          )}
          {report.business_model && (
            <div>
              <p className="text-sm font-medium mb-1">Business Model</p>
              <p className="text-xs text-muted-foreground">{report.business_model}</p>
            </div>
          )}
        </div>

        {/* Risks */}
        {(report.technical_risks || report.business_risks) && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              Risks
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.technical_risks && (
                <div>
                  <p className="text-xs font-medium">Technical</p>
                  <p className="text-xs text-muted-foreground">{report.technical_risks}</p>
                </div>
              )}
              {report.business_risks && (
                <div>
                  <p className="text-xs font-medium">Business</p>
                  <p className="text-xs text-muted-foreground">{report.business_risks}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competitive Position */}
        {(report.competitive_advantages || report.moat_analysis) && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Competitive Position</p>
            {report.competitive_advantages && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Advantages:</span> {report.competitive_advantages}
              </p>
            )}
            {report.moat_analysis && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Moat:</span> {report.moat_analysis}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}