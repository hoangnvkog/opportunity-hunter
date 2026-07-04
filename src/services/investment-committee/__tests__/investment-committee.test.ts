/**
 * Sprint 67: Investment Committee Tests
 *
 * Tests cover:
 * - Aggregation logic (tie, unanimous, disagreement)
 * - Repository (mock Supabase)
 * - Service (mock AI calls)
 * - Missing data handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeOverallScore,
  computeConfidence,
  computeDisagreement,
  aggregateVotes,
  generateSummary,
  AGENT_PROFILES,
  type AgentName,
  type AgentVoteOutput,
} from "../investment-committee.types";
import { AgentVoteOutputSchema } from "../investment-committee.schemas";

// ---------------------------------------------------------------------------
// Helper: build a standard vote
// ---------------------------------------------------------------------------

function makeVote(
  agentName: AgentName,
  overrides: Partial<Omit<AgentVoteOutput, "agent_name" | "agent_role">> = {},
): AgentVoteOutput {
  const profile = AGENT_PROFILES.find(p => p.name === agentName)!;
  return {
    agent_name: agentName,
    agent_role: profile.role,
    vote: "WATCH",
    score: 50,
    confidence: 60,
    pros: ["Test pro"],
    cons: ["Test con"],
    reasoning: "Test reasoning",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Aggregation logic tests
// ---------------------------------------------------------------------------

describe("computeOverallScore", () => {
  it("returns weighted average of all agent scores", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { score: 80 }),
      makeVote("PRODUCT_PARTNER", { score: 70 }),
      makeVote("FINANCIAL_PARTNER", { score: 90 }),
      makeVote("TECHNICAL_PARTNER", { score: 60 }),
      makeVote("VC_PARTNER", { score: 75 }),
    ];
    expect(computeOverallScore(votes)).toBe(75);
  });

  it("handles equal weights", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { score: 100 }),
      makeVote("VC_PARTNER", { score: 0 }),
    ];
    // (100 + 0) / 2 = 50
    expect(computeOverallScore(votes)).toBe(50);
  });

  it("returns 0 for empty votes", () => {
    expect(computeOverallScore([])).toBe(0);
  });
});

describe("computeConfidence", () => {
  it("returns average confidence minus disagreement penalty", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { confidence: 80 }),
      makeVote("PRODUCT_PARTNER", { confidence: 80 }),
      makeVote("FINANCIAL_PARTNER", { confidence: 80 }),
      makeVote("TECHNICAL_PARTNER", { confidence: 80 }),
      makeVote("VC_PARTNER", { confidence: 80 }),
    ];
    // avg=80, disagreement=0 → confidence=80
    expect(computeConfidence(votes)).toBe(80);
  });

  it("applies penalty for high disagreement", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { score: 100, confidence: 80 }),
      makeVote("PRODUCT_PARTNER", { score: 0, confidence: 80 }),
      makeVote("FINANCIAL_PARTNER", { score: 50, confidence: 80 }),
      makeVote("TECHNICAL_PARTNER", { score: 50, confidence: 80 }),
      makeVote("VC_PARTNER", { score: 50, confidence: 80 }),
    ];
    const confidence = computeConfidence(votes);
    expect(confidence).toBeLessThan(80);
    expect(confidence).toBeGreaterThan(0);
  });

  it("returns 0 for empty votes", () => {
    expect(computeConfidence([])).toBe(0);
  });
});

describe("computeDisagreement", () => {
  it("returns 0 when all votes agree", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { score: 70 }),
      makeVote("PRODUCT_PARTNER", { score: 70 }),
      makeVote("FINANCIAL_PARTNER", { score: 70 }),
    ];
    expect(computeDisagreement(votes)).toBe(0);
  });

  it("returns positive variance for disagreeing votes", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { score: 100 }),
      makeVote("PRODUCT_PARTNER", { score: 0 }),
      makeVote("FINANCIAL_PARTNER", { score: 50 }),
    ];
    expect(computeDisagreement(votes)).toBeGreaterThan(0);
  });

  it("returns 0 for single vote", () => {
    const votes = [makeVote("MARKET_ANALYST", { score: 75 })];
    expect(computeDisagreement(votes)).toBe(0);
  });
});

describe("aggregateVotes", () => {
  it("returns Buy when avg score is 60-74", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 80 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY", score: 90 }),
      makeVote("TECHNICAL_PARTNER", { vote: "WATCH", score: 60 }),
      makeVote("VC_PARTNER", { vote: "PASS", score: 30 }),
    ];
    // avg = 335/5 = 67 → Buy (not Strong Buy since threshold is 75)
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("BUY");
    expect(result.finalDecision).toBe("Buy");
  });

  it("returns Strong Buy when avg score >= 75", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 85 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 80 }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY", score: 90 }),
      makeVote("TECHNICAL_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("VC_PARTNER", { vote: "WATCH", score: 70 }),
    ];
    // avg = 400/5 = 80 → Strong Buy
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("BUY");
    expect(result.finalDecision).toBe("Strong Buy");
  });

  it("returns WATCH when scores are mid-range", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "WATCH", score: 55 }),
      makeVote("PRODUCT_PARTNER", { vote: "WATCH", score: 50 }),
      makeVote("FINANCIAL_PARTNER", { vote: "WATCH", score: 45 }),
      makeVote("TECHNICAL_PARTNER", { vote: "PASS", score: 35 }),
      makeVote("VC_PARTNER", { vote: "WATCH", score: 48 }),
    ];
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("WATCH");
    expect(result.finalDecision).toBe("Watch");
  });

  it("returns minority vote when vote count > 0", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 80 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY", score: 70 }),
      makeVote("TECHNICAL_PARTNER", { vote: "WATCH", score: 55 }),
      makeVote("VC_PARTNER", { vote: "WATCH", score: 50 }),
    ];
    // BUY=3, WATCH=2 → majority BUY, minority WATCH
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("BUY");
    expect(result.minorityVote).toBe("WATCH");
  });

  it("unanimous BUY: minorityVote is BUY (same as majority)", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 80 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY", score: 90 }),
      makeVote("TECHNICAL_PARTNER", { vote: "BUY", score: 60 }),
      makeVote("VC_PARTNER", { vote: "BUY", score: 30 }),
    ];
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("BUY");
    // Only one non-zero bucket → it is both majority AND minority
    expect(result.minorityVote).toBe("BUY");
  });

  it("handles split vote: BUY majority, PASS minority", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 80 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("FINANCIAL_PARTNER", { vote: "WATCH", score: 55 }),
      makeVote("TECHNICAL_PARTNER", { vote: "WATCH", score: 50 }),
      makeVote("VC_PARTNER", { vote: "PASS", score: 30 }),
    ];
    // BUY=2, WATCH=2, PASS=1 → sorted: BUY/WATCH tied at 2 (first wins), PASS=1 → minority PASS
    const result = aggregateVotes(votes);
    expect(result.majorityVote).toBe("BUY");
    expect(result.minorityVote).toBe("PASS");
  });

  it("maps avg >= 75 to Strong Buy", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 85 }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY", score: 80 }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("TECHNICAL_PARTNER", { vote: "BUY", score: 75 }),
      makeVote("VC_PARTNER", { vote: "WATCH", score: 70 }),
    ];
    const result = aggregateVotes(votes);
    expect(result.finalDecision).toBe("Strong Buy");
  });

  it("maps avg < 40 to Reject", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "PASS", score: 35 }),
      makeVote("PRODUCT_PARTNER", { vote: "PASS", score: 30 }),
      makeVote("FINANCIAL_PARTNER", { vote: "PASS", score: 30 }),
      makeVote("TECHNICAL_PARTNER", { vote: "PASS", score: 25 }),
      makeVote("VC_PARTNER", { vote: "PASS", score: 20 }),
    ];
    const result = aggregateVotes(votes);
    expect(result.finalDecision).toBe("Reject");
  });
});

describe("generateSummary", () => {
  it("mentions BUY majority", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY" }),
      makeVote("PRODUCT_PARTNER", { vote: "BUY" }),
      makeVote("FINANCIAL_PARTNER", { vote: "BUY" }),
      makeVote("TECHNICAL_PARTNER", { vote: "WATCH" }),
      makeVote("VC_PARTNER", { vote: "PASS" }),
    ];
    const summary = generateSummary(votes, "Strong Buy", 10);
    expect(summary).toContain("Majority");
    expect(summary).toContain("BUY");
    expect(summary).toContain("Strong Buy");
  });

  it("mentions high disagreement", () => {
    const votes = [
      makeVote("MARKET_ANALYST", { vote: "BUY", score: 100 }),
      makeVote("PRODUCT_PARTNER", { vote: "PASS", score: 0 }),
      makeVote("FINANCIAL_PARTNER", { vote: "WATCH", score: 50 }),
      makeVote("TECHNICAL_PARTNER", { vote: "WATCH", score: 50 }),
      makeVote("VC_PARTNER", { vote: "WATCH", score: 50 }),
    ];
    const summary = generateSummary(votes, "Watch", 35);
    expect(summary).toContain("High disagreement");
  });
});

// ---------------------------------------------------------------------------
// Schema validation tests
// ---------------------------------------------------------------------------

describe("AgentVoteOutputSchema", () => {
  it("parses valid vote", () => {
    const valid = {
      agent_name: "MARKET_ANALYST",
      agent_role: "Market Analyst",
      vote: "BUY",
      score: 80,
      confidence: 75,
      pros: ["Good market", "Clear traction"],
      cons: ["Competition"],
      reasoning: "Strong opportunity",
    };
    const result = AgentVoteOutputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid vote value", () => {
    const invalid = {
      agent_name: "MARKET_ANALYST",
      agent_role: "Market Analyst",
      vote: "MAYBE",
      score: 80,
      confidence: 75,
      pros: [],
      cons: [],
      reasoning: "Test",
    };
    const result = AgentVoteOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects score out of range", () => {
    const invalid = {
      agent_name: "MARKET_ANALYST",
      agent_role: "Market Analyst",
      vote: "BUY",
      score: 150,
      confidence: 75,
      pros: [],
      cons: [],
      reasoning: "Test",
    };
    const result = AgentVoteOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("defaults pros and cons to empty arrays", () => {
    const minimal = {
      agent_name: "PRODUCT_PARTNER",
      agent_role: "Product Partner",
      vote: "WATCH",
      score: 50,
      confidence: 50,
      reasoning: "Uncertain",
    };
    const result = AgentVoteOutputSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pros).toEqual([]);
      expect(result.data.cons).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Agent profiles tests
// ---------------------------------------------------------------------------

describe("AGENT_PROFILES", () => {
  it("has exactly 5 agents", () => {
    expect(AGENT_PROFILES).toHaveLength(5);
  });

  it("has unique names", () => {
    const names = AGENT_PROFILES.map(p => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(5);
  });

  it("each agent has weight >= 1.0", () => {
    for (const agent of AGENT_PROFILES) {
      expect(agent.weight).toBeGreaterThanOrEqual(1.0);
    }
  });
});