/**
 * Sprint 67: Investment Committee Constants
 */

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  MARKET_ANALYST: "Market Analyst",
  PRODUCT_PARTNER: "Product Partner",
  FINANCIAL_PARTNER: "Financial Partner",
  TECHNICAL_PARTNER: "Technical Partner",
  VC_PARTNER: "VC Partner",
};

export const AGENT_EMOJI: Record<string, string> = {
  MARKET_ANALYST: "📊",
  PRODUCT_PARTNER: "💡",
  FINANCIAL_PARTNER: "💰",
  TECHNICAL_PARTNER: "⚙️",
  VC_PARTNER: "🎯",
};

export const VOTE_COLORS: Record<string, string> = {
  BUY: "bg-green-100 text-green-800 border-green-300",
  WATCH: "bg-yellow-100 text-yellow-800 border-yellow-300",
  PASS: "bg-red-100 text-red-800 border-red-300",
};

export const DECISION_COLORS: Record<string, string> = {
  "Strong Buy": "bg-green-500 text-white",
  "Buy": "bg-green-100 text-green-800 border border-green-300",
  "Watch": "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "Reject": "bg-red-100 text-red-800 border border-red-300",
};

export const DECISION_ICONS: Record<string, string> = {
  "Strong Buy": "✅",
  "Buy": "👍",
  "Watch": "👀",
  "Reject": "❌",
};

export const DECISION_SCORE_THRESHOLDS = {
  STRONG_BUY: 75,
  BUY: 60,
  WATCH: 40,
  REJECT: 0,
} as const;

export const DEFAULT_PROS = [
  "Strong market fundamentals",
  "Clear value proposition",
  "Experienced team",
  "Timing advantage",
  "Differentiated approach",
];

export const DEFAULT_CONS = [
  "Execution risk",
  "Market timing uncertainty",
  "Competitive pressure",
  "Resource constraints",
  "Regulatory considerations",
];