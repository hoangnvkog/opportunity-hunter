/**
 * Score breakdown — at-a-glance view of every AI-assigned score for this
 * opportunity. The hero number is the overall startup score; the grid
 * beneath it shows the 4 supporting pillars (validation, forecast, market
 * intelligence, startup score).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, recommendationVariant } from "@/components/ui/badge";
import { TrendingUp, Brain, PieChart, Star } from "lucide-react";

export interface ScorePillar {
  label: string;
  value: number; // 0-100
  hint?: string;
  visible: boolean;
}

interface ScoreBreakdownProps {
  opportunityScore: number; // 0-100 (raw opportunity score)
  validationScore: number | null; // 0-100 (validation pipeline)
  forecastScore: number | null;
  startupScore: number | null; // 0-100 (overall startup score)
  evidenceAverage: number | null; // 0-100
}

export function ScoreBreakdown({
  opportunityScore,
  validationScore,
  forecastScore,
  startupScore,
  evidenceAverage,
}: ScoreBreakdownProps) {
  const rec = recommendationFromScore(startupScore ?? opportunityScore);

  const pillars: ScorePillar[] = [
    {
      label: "Opportunity",
      value: Math.round(opportunityScore),
      hint: "Phát hiện cơ hội",
      visible: true,
    },
    {
      label: "Validation",
      value: validationScore ?? 0,
      hint: "AI xác thực",
      visible: validationScore !== null,
    },
    {
      label: "Forecast",
      value: forecastScore ?? 0,
      hint: "Dự báo tăng trưởng",
      visible: forecastScore !== null,
    },
    {
      label: "Startup Score",
      value: startupScore ?? 0,
      hint: "7 yếu tố VC",
      visible: startupScore !== null,
    },
    {
      label: "Evidence",
      value: evidenceAverage ?? 0,
      hint: "Tin cậy bằng chứng",
      visible: evidenceAverage !== null,
    },
  ];

  const visible = pillars.filter((p) => p.visible);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Điểm tổng hợp
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            5 chiều đánh giá từ AI pipeline
          </p>
        </div>
        <Badge variant={recommendationVariant(rec)}>{rec}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((p) => (
            <Pillar key={p.label} pillar={p} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Pillar({ pillar }: { pillar: ScorePillar }) {
  const tone = toneFor(pillar.value);
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {pillar.label}
        </span>
        {pillar.label === "Opportunity" && (
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
        )}
        {pillar.label === "Validation" && (
          <Brain className="h-3 w-3 text-muted-foreground" />
        )}
        {pillar.label === "Forecast" && (
          <PieChart className="h-3 w-3 text-muted-foreground" />
        )}
        {pillar.label === "Startup Score" && (
          <Star className="h-3 w-3 text-muted-foreground" />
        )}
        {pillar.label === "Evidence" && (
          <PieChart className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone.text}`}>
        {Math.round(pillar.value)}
      </p>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-1.5 rounded-full ${tone.bar}`}
          style={{ width: `${Math.min(100, pillar.value)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{pillar.hint}</p>
    </div>
  );
}

function toneFor(value: number): { text: string; bar: string } {
  if (value >= 85) return { text: "text-signal-hot", bar: "bg-signal-hot" };
  if (value >= 70) return { text: "text-signal-good", bar: "bg-signal-good" };
  if (value >= 50) return { text: "text-signal-watch", bar: "bg-signal-watch" };
  return { text: "text-signal-cold", bar: "bg-signal-cold" };
}

export function recommendationFromScore(score: number): string {
  if (score >= 85) return "Strong Buy";
  if (score >= 70) return "Buy";
  if (score >= 50) return "Watch";
  return "Pass";
}
