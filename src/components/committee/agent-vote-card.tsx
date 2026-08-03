/**
 * AgentVoteCard — single AI committee member's vote breakdown.
 * Used by the committee dashboard and the dossier "Venture" tab.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, recommendationVariant } from "@/components/ui/badge";

export type AgentKey =
  | "MARKET_ANALYST"
  | "PRODUCT_PARTNER"
  | "FINANCIAL_PARTNER"
  | "TECHNICAL_PARTNER"
  | "VC_PARTNER";

export interface AgentVote {
  agent: AgentKey | string;
  vote: string; // "STRONG_BUY" | "BUY" | "NEUTRAL" | "PASS" | "REJECT"
  score: number; // 0-100
  reasoning?: string;
  confidence?: number;
}

const AGENT_META: Record<
  AgentKey,
  { role: string; icon: string; tone: "info" | "ai" | "watch" | "hot" | "good" }
> = {
  MARKET_ANALYST: { role: "Market Analyst", icon: "📊", tone: "info" },
  PRODUCT_PARTNER: { role: "Product Partner", icon: "💡", tone: "ai" },
  FINANCIAL_PARTNER: { role: "Financial Partner", icon: "💰", tone: "hot" },
  TECHNICAL_PARTNER: { role: "Technical Partner", icon: "⚙️", tone: "watch" },
  VC_PARTNER: { role: "VC Partner", icon: "🎯", tone: "good" },
};

function displayVote(vote: string): string {
  switch (vote) {
    case "STRONG_BUY":
      return "Strong Buy";
    case "BUY":
      return "Buy";
    case "NEUTRAL":
      return "Watch";
    case "PASS":
      return "Watch";
    case "REJECT":
      return "Reject";
    default:
      return vote;
  }
}

export function AgentVoteCard({ vote }: { vote: AgentVote }) {
  const meta = AGENT_META[vote.agent as AgentKey] ?? {
    role: vote.agent,
    icon: "👤",
    tone: "info" as const,
  };
  const label = displayVote(vote.vote);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {meta.icon}
          </span>
          <CardTitle className="text-sm font-semibold">{meta.role}</CardTitle>
        </div>
        <Badge variant={recommendationVariant(label)}>{label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold tabular-nums">{Math.round(vote.score)}</span>
          {vote.confidence !== undefined && (
            <span className="text-xs text-muted-foreground">
              Độ tin cậy{" "}
              <span className="font-medium text-foreground tabular-nums">
                {Math.round(vote.confidence)}%
              </span>
            </span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, vote.score))}%` }}
          />
        </div>
        {vote.reasoning && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {vote.reasoning}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
