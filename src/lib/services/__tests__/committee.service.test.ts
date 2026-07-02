/**
 * Sprint 61: AI Investment Committee - Service tests
 *
 * We test pure logic functions (aggregateVotes, bucketDecisionByScore, voteToNumeric)
 * directly without mocking. For runCommittee/calculateCommitteeStats we mock
 * the repo functions via factory pattern.
 */
import { describe, it, expect, vi } from "vitest";
import {
  aggregateVotes,
} from "@/lib/services/committee.service";
import {
  bucketDecisionByScore,
  voteToNumeric,
  COMMITTEE_AGENT_PROFILES,
} from "@/types/investment-committee";

// ─── Pure logic tests (no mocks needed) ───

describe("aggregateVotes", () => {
  it("returns zeros for empty vote array", () => {
    const result = aggregateVotes([]);
    expect(result.committee_score).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.consensus).toBe(0);
    expect(result.final_decision).toBe("REJECT");
  });

  it("computes weighted average score", () => {
    const result = aggregateVotes([
      { vote: "STRONG_BUY", score: 100, confidence: 80, weight: 1.0 },
      { vote: "REJECT", score: 0, confidence: 80, weight: 1.0 },
      { vote: "STRONG_BUY", score: 100, confidence: 80, weight: 1.0 },
      { vote: "REJECT", score: 0, confidence: 80, weight: 1.0 },
      { vote: "NEUTRAL", score: 50, confidence: 80, weight: 1.0 },
    ]);
    expect(result.committee_score).toBe(50);
    expect(result.confidence).toBe(80);
  });

  it("buckets STRONG_BUY for high scores", () => {
    const result = aggregateVotes([
      { vote: "STRONG_BUY", score: 90, confidence: 80, weight: 1.0 },
    ]);
    expect(result.final_decision).toBe("STRONG_BUY");
  });

  it("buckets REJECT for low scores", () => {
    const result = aggregateVotes([
      { vote: "REJECT", score: 10, confidence: 80, weight: 1.0 },
    ]);
    expect(result.final_decision).toBe("REJECT");
  });

  it("perfect agreement yields high consensus", () => {
    const result = aggregateVotes([
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
    ]);
    expect(result.consensus).toBeCloseTo(100, 0);
  });

  it("respects per-vote weights", () => {
    const result = aggregateVotes([
      { vote: "STRONG_BUY", score: 100, confidence: 80, weight: 1.0 },
      { vote: "REJECT", score: 0, confidence: 80, weight: 1.2 },
    ]);
    // (100*1.0 + 0*1.2) / (1.0+1.2) = 100/2.2 ≈ 45.45
    expect(result.committee_score).toBeCloseTo(45.45, 1);
  });

  it("BUYS score maps to BUY decision", () => {
    const result = aggregateVotes([
      { vote: "BUY", score: 75, confidence: 80, weight: 1.0 },
    ]);
    expect(result.final_decision).toBe("BUY");
  });

  it("NEUTRAL score maps to NEUTRAL decision", () => {
    const result = aggregateVotes([
      { vote: "NEUTRAL", score: 50, confidence: 80, weight: 1.0 },
    ]);
    expect(result.final_decision).toBe("NEUTRAL");
  });

  it("PASS score maps to PASS decision", () => {
    const result = aggregateVotes([
      { vote: "PASS", score: 30, confidence: 80, weight: 1.0 },
    ]);
    expect(result.final_decision).toBe("PASS");
  });
});

describe("bucketDecisionByScore", () => {
  it("STRONG_BUY >= 85", () => {
    expect(bucketDecisionByScore(85)).toBe("STRONG_BUY");
    expect(bucketDecisionByScore(100)).toBe("STRONG_BUY");
  });

  it("BUY >= 70", () => {
    expect(bucketDecisionByScore(70)).toBe("BUY");
    expect(bucketDecisionByScore(84)).toBe("BUY");
  });

  it("NEUTRAL >= 50", () => {
    expect(bucketDecisionByScore(50)).toBe("NEUTRAL");
    expect(bucketDecisionByScore(69)).toBe("NEUTRAL");
  });

  it("PASS >= 30", () => {
    expect(bucketDecisionByScore(30)).toBe("PASS");
    expect(bucketDecisionByScore(49)).toBe("PASS");
  });

  it("REJECT < 30", () => {
    expect(bucketDecisionByScore(0)).toBe("REJECT");
    expect(bucketDecisionByScore(29)).toBe("REJECT");
  });
});

describe("voteToNumeric", () => {
  it("STRONG_BUY → 100", () => expect(voteToNumeric("STRONG_BUY")).toBe(100));
  it("BUY → 75", () => expect(voteToNumeric("BUY")).toBe(75));
  it("NEUTRAL → 50", () => expect(voteToNumeric("NEUTRAL")).toBe(50));
  it("PASS → 25", () => expect(voteToNumeric("PASS")).toBe(25));
  it("REJECT → 0", () => expect(voteToNumeric("REJECT")).toBe(0));
});

describe("COMMITTEE_AGENT_PROFILES", () => {
  it("has 5 agents", () => {
    expect(COMMITTEE_AGENT_PROFILES).toHaveLength(5);
  });

  it("risk partner has weight 1.2", () => {
    const risk = COMMITTEE_AGENT_PROFILES.find(a => a.name === "RISK_PARTNER");
    expect(risk?.weight).toBe(1.2);
  });

  it("each agent has name, role, focus, weight", () => {
    for (const agent of COMMITTEE_AGENT_PROFILES) {
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(agent.focus).toHaveLength(3);
      expect(agent.weight).toBeGreaterThanOrEqual(1.0);
    }
  });

  it("agent names match enum values", () => {
    const names = COMMITTEE_AGENT_PROFILES.map(a => a.name);
    expect(names).toContain("MARKET_ANALYST");
    expect(names).toContain("TECHNICAL_PARTNER");
    expect(names).toContain("FOUNDER_PARTNER");
    expect(names).toContain("INVESTMENT_PARTNER");
    expect(names).toContain("RISK_PARTNER");
  });
});
