/**
 * Sprint 58: Investment Memo Card Component
 *
 * Displays a concise, decision-oriented investment memo for an opportunity.
 * Mirrors the layout of internal memos used by YC, Sequoia, a16z, Accel.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InvestmentMemoRow } from "@/types/investment-memo";
import { FileText, TrendingUp, AlertTriangle, Shield, Clock, Target } from "lucide-react";

interface InvestmentMemoCardProps {
  memo: InvestmentMemoRow | null;
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return <Badge className="bg-gray-100 text-gray-800">—</Badge>;
  if (rec === "STRONG BUY")
    return <Badge className="bg-green-100 text-green-800">💰 {rec}</Badge>;
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

interface SectionProps {
  label: string;
  body?: string;
  icon?: React.ReactNode;
}

function Section({ label, body, icon }: SectionProps) {
  if (!body) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export function InvestmentMemoCard({ memo }: InvestmentMemoCardProps) {
  if (!memo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Investment Memo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No investment memo generated yet for this opportunity.
            Memos are generated for opportunities with startup_score overall_score &gt;= 85.
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
          Investment Memo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title + Recommendation + Decision */}
        <div className="flex items-start justify-between border-b pb-4 gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold">{memo.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              v{memo.memo_version} • Generated {new Date(memo.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right space-y-1">
            {getRecommendationBadge(memo.recommendation)}
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <span className={`text-sm font-bold ${getConfidenceColor(memo.confidence)}`}>
                {memo.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Investment Decision */}
        {memo.investment_decision && (
          <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-1">
              Decision
            </p>
            <p className="text-sm font-medium text-blue-900">{memo.investment_decision}</p>
          </div>
        )}

        {/* Investment Thesis */}
        {memo.thesis && (
          <div className="border-t pt-3">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Investment Thesis
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{memo.thesis}</p>
          </div>
        )}

        {/* Key Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
          <Section label="Market" body={memo.market} icon={<TrendingUp className="h-3 w-3" />} />
          <Section label="Problem" body={memo.problem} />
          <Section label="Solution" body={memo.solution} />
          <Section label="Business Model" body={memo.business_model} />
          <Section label="Traction" body={memo.traction} icon={<Clock className="h-3 w-3" />} />
          <Section label="Competition" body={memo.competition} />
        </div>

        {/* Strengths + Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
          {memo.strengths && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-600" />
                Strengths
              </p>
              <p className="text-sm leading-relaxed">{memo.strengths}</p>
            </div>
          )}
          {memo.risks && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                Risks
              </p>
              <p className="text-sm leading-relaxed">{memo.risks}</p>
            </div>
          )}
        </div>

        {/* Why Now */}
        {memo.why_now && (
          <div className="border-t pt-3">
            <Section
              label="Why Now"
              body={memo.why_now}
              icon={<TrendingUp className="h-3 w-3" />}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}